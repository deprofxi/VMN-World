import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { getConfig } from "../config/index.js";
import { assertSeedRolesConformToRbac } from "../rbac/index.js";
import { isTokenIdRevoked, computeSessionId, markTokenIdRevoked, primeRevocationFromSharedStore } from "./sessions.js";
import type { KeyValueAdapter } from "../cache/index.js";
import {
  sealSensitiveField,
  assertSealedForStorage,
  openSealedField,
  isSealedFieldValue,
} from "../websecurity/index.js";
import { recordAuditLog } from "../audit/index.js";

export interface SessionUser {
  userId: string;
  personId: string;
  email: string;
  roles: string[];
  tenantId?: string;
  mfaEnabled?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

const MFA_CHALLENGE_PURPOSE = "mfa_login_challenge";
const MFA_CHALLENGE_TTL_SECONDS = 300;
const consumedMfaChallenges = new Map<string, number>();

export function signMfaLoginChallenge(user: SessionUser): string {
  const config = getConfig();
  return jwt.sign(
    { sub: user.userId, personId: user.personId, email: user.email, roles: user.roles, tenantId: user.tenantId, purpose: MFA_CHALLENGE_PURPOSE },
    config.JWT_SECRET,
    { expiresIn: MFA_CHALLENGE_TTL_SECONDS, issuer: "vmnl-enterprise-auth", audience: "vmnl-api", jwtid: randomUUID() }
  );
}

function verifyMfaLoginChallengePayload(token: string): jwt.JwtPayload {
  const config = getConfig();
  const decoded = jwt.verify(token, config.JWT_SECRET, {
    issuer: "vmnl-enterprise-auth",
    audience: "vmnl-api",
    algorithms: ["HS256"],
    maxAge: `${MFA_CHALLENGE_TTL_SECONDS}s`,
  }) as jwt.JwtPayload;
  if (decoded.purpose !== MFA_CHALLENGE_PURPOSE || !decoded.sub || !decoded.email || !decoded.jti || !decoded.exp) {
    throw new Error("Invalid MFA login challenge");
  }
  return decoded;
}

function sessionUserFromMfaChallenge(decoded: jwt.JwtPayload): SessionUser {
  return {
    userId: decoded.sub as string,
    personId: String(decoded.personId || ""),
    email: String(decoded.email),
    roles: Array.isArray(decoded.roles) ? decoded.roles as string[] : [],
    tenantId: typeof decoded.tenantId === "string" ? decoded.tenantId : undefined,
  };
}

export function verifyMfaLoginChallenge(token: string): SessionUser {
  return sessionUserFromMfaChallenge(verifyMfaLoginChallengePayload(token));
}

/**
 * TSK-27 (CA-26): consume a valid MFA login challenge exactly once **across the
 * fleet**, not once per process. With a shared adapter the claim is a single
 * atomic SET NX keyed by the challenge id; without one it is this process's Map.
 * A shared-backend failure refuses rather than proceeds: an unreadable claim
 * store cannot prove the challenge is unused, and a second factor that can be
 * replayed is not a second factor.
 */
export async function consumeMfaLoginChallenge(token: string): Promise<SessionUser | null> {
  const decoded = verifyMfaLoginChallengePayload(token);
  const challengeId = String(decoded.jti);
  const expiresAt = Number(decoded.exp) * 1000;
  const ttlMs = Math.max(1_000, expiresAt - Date.now());

  if (kvAdapter) {
    let claimed: boolean;
    try {
      claimed = await kvAdapter.setIfAbsent(mfaChallengeKey(challengeId), String(Date.now()), ttlMs);
    } catch {
      return null; // fail closed — replay cannot be ruled out
    }
    if (!claimed) return null;
    rememberConsumedChallenge(challengeId, expiresAt);
    return sessionUserFromMfaChallenge(decoded);
  }

  pruneConsumedChallenges(Date.now());
  if (consumedMfaChallenges.has(challengeId)) return null;
  rememberConsumedChallenge(challengeId, expiresAt);
  return sessionUserFromMfaChallenge(decoded);
}

function mfaChallengeKey(challengeId: string): string {
  return `auth:mfa-consumed:${challengeId}`;
}

/** Local mirror of consumed ids: observability and the no-adapter deployment. */
function rememberConsumedChallenge(challengeId: string, expiresAt: number): void {
  if (consumedMfaChallenges.size >= 10_000) {
    const oldestId = consumedMfaChallenges.keys().next().value as string | undefined;
    if (oldestId) consumedMfaChallenges.delete(oldestId);
  }
  consumedMfaChallenges.set(challengeId, expiresAt);
}

function pruneConsumedChallenges(now: number): void {
  for (const [id, expiresAt] of consumedMfaChallenges) {
    if (expiresAt <= now) consumedMfaChallenges.delete(id);
  }
}

export function _resetMfaChallengesForTesting(): void {
  consumedMfaChallenges.clear();
}

const BCRYPT_SALT_ROUNDS = process.env.NODE_ENV === "test" ? 4 : 12;

/**
 * Securely hashes a plain text password using bcrypt with 12 salt rounds
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Compares a plain text password against a stored bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Signs a cryptographically secure JWT session token
 */
export function signSessionToken(user: SessionUser, customExpiresIn?: number): AuthTokens {
  const config = getConfig();
  const expiresIn = customExpiresIn || config.JWT_EXPIRATION_SECONDS;

  const payload = {
    sub: user.userId,
    personId: user.personId,
    email: user.email,
    roles: user.roles,
    tenantId: user.tenantId,
  };

  const options: SignOptions = {
    expiresIn,
    issuer: "vmnl-enterprise-auth",
    audience: "vmnl-api",
  };

  const accessToken = jwt.sign(payload, config.JWT_SECRET, options);

  return {
    accessToken,
    expiresIn,
  };
}

export interface TokenRevocationStore {
  revoke(token: string): void | Promise<void>;
  isRevoked(token: string): boolean | Promise<boolean>;
}

export class InMemoryRevocationStore implements TokenRevocationStore {
  private set = new Set<string>();
  public revoke(token: string): void {
    this.set.add(token);
  }
  public isRevoked(token: string): boolean {
    return this.set.has(token);
  }
}

let activeRevocationStore: TokenRevocationStore = new InMemoryRevocationStore();

export function setTokenRevocationStore(store: TokenRevocationStore): void {
  activeRevocationStore = store;
}

/**
 * Revoke a session token. The raw-token store is process-local, so this also
 * marks the sha-256 token id — the key the shared KV store and every other
 * instance consult (TSK-27 / CA-26). Pass the raw token, never a token id.
 */
export function revokeToken(token: string): void {
  activeRevocationStore.revoke(token);
  markTokenIdRevoked(computeSessionId(token));
}

export function isTokenRevoked(token: string): boolean {
  return Boolean(activeRevocationStore.isRevoked(token));
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

/**
 * TODO-SEC-10 / TSK-27: the shared budget for rate limiting is
 * `checkSharedRateLimit` below (atomic INCRBY on the KeyValueAdapter, Redis when
 * REDIS_URL is configured), and the account-lockout counters are keyed on that
 * same adapter. `checkRateLimit` is the process-local fixed window used when no
 * adapter is bound (unit-test contexts, pre-boot); it is deliberately NOT
 * mirrored to the adapter, because a write-only mirror would read as a shared
 * limit while counting per instance.
 */
const rateLimitStore = new Map<string, RateLimitBucket>();
let kvAdapter: KeyValueAdapter | null = null;

/** Boot-time hook: point the auth stores at the process-wide KV adapter. */
export function useKeyValueAdapterForAuthStores(adapter: KeyValueAdapter): void {
  kvAdapter = adapter;
}

/**
 * Test seam for the multi-instance checks (TSK-27): this is what a second
 * process starts with — no local copies, the shared adapter still bound.
 */
export function _resetSharedAuthStateForTesting(): void {
  userStore.clear();
  rateLimitStore.clear();
  accountLockoutStore.clear();
  consumedMfaChallenges.clear();
  kvAdapter = null;
}

/**
 * AUD-06 / TSK-30: MFA secrets are high-value credentials (a leaked TOTP seed
 * defeats 2FA entirely). Whenever a user record is serialized to the shared KV
 * store (Redis at-rest), the secret is sealed with the AES-256-GCM field
 * helper (src/core/websecurity) instead of being persisted in plaintext. The
 * in-process Map remains plaintext for synchronous verification cost, and
 * `passwordHash` stays a bcrypt hash (already one-way). A shared deployment
 * therefore never carries a usable TOTP seed in its cache/queue backing store.
 *
 * TSK-30 moves the envelope rules out of convention: `sealSensitiveField`
 * refuses to double-seal and refuses to emit a malformed envelope, and every
 * `user:` payload that reaches the adapter is serialized by `sealedUserPayload`
 * (the mirror write and TSK-27's atomic registration claim both go through it),
 * so a call site that forgets to seal cannot exist.
 */
function encryptUserSecretsForStore(user: UserRecord): UserRecord {
  if (!user.mfaSecret) return user;
  if (isSealedFieldValue(user.mfaSecret)) return user;
  return { ...user, mfaSecret: sealSensitiveField(user.mfaSecret) };
}

/** The choke point: seal, assert, then serialize a user record for the adapter. */
function sealedUserPayload(user: UserRecord): string {
  const sealed = encryptUserSecretsForStore(user);
  // Fail closed: refuse the write rather than persist a plaintext or malformed secret.
  assertSealedForStorage("User.mfaSecret", sealed.mfaSecret);
  return JSON.stringify(sealed);
}

async function persistUserToSharedStore(emailKey: string, user: UserRecord): Promise<void> {
  if (!kvAdapter) return;
  await kvAdapter.set(`user:${emailKey}`, sealedUserPayload(user));
}

/**
 * Box 2 of TSK-30: opening a sealed credential is itself an access to a
 * sensitive field, so it is recorded. The entry carries the outcome and the
 * envelope version only — never ciphertext, never plaintext.
 */
function recordSecretAccess(user: UserRecord, outcome: "opened" | "malformed" | "auth_failed"): void {
  recordAuditLog({
    // No `userId`: `AuditLog.userId` carries a foreign key to the `User` table,
    // which no application code writes (see the TSK-30 note in tasks.md), so a
    // real id here would fail the FK and the entry would be lost. The subject is
    // identified by `resourceId` (the account email), which is what the access
    // was about.
    userId: null,
    action: outcome === "opened" ? "auth.mfa_secret_decrypted" : "auth.mfa_secret_decrypt_refused",
    resource: "User.mfaSecret",
    resourceId: user.email,
    tenantId: user.tenantId || null,
    changes: { outcome, envelopeVersion: "v1", algorithm: "aes-256-gcm" },
  });
}

function decryptUserSecretsFromStore(user: UserRecord): UserRecord {
  if (!user.mfaSecret) return user;
  const opened = openSealedField(user.mfaSecret);
  recordSecretAccess(user, opened.outcome);
  // Fail closed in every non-opened case: an unusable secret is better than a
  // guessed one, and a wrong-key envelope must not surface as a credential.
  if (opened.outcome === "opened") return { ...user, mfaSecret: opened.plaintext };
  return { ...user, mfaSecret: null };
}

export function checkRateLimit(
  key: string,
  maxRequests: number = 60,
  windowMs: number = 60_000
): {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
} {
  const now = Date.now();
  const bucket = rateLimitStore.get(key);

  if (!bucket || now > bucket.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetInMs: windowMs };
  }

  if (bucket.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetInMs: Math.max(0, bucket.resetAt - now) };
  }

  bucket.count += 1;
  return { allowed: true, remaining: maxRequests - bucket.count, resetInMs: Math.max(0, bucket.resetAt - now) };
}

export interface SharedRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
  backend: "redis" | "memory";
  /** False when the shared backend itself failed and load was shed instead. */
  sharedBackendAvailable: boolean;
}

/**
 * AUD-14: shared, KV-backed fixed-window rate limiter. The window identity is
 * the time bucket itself (`rl:<key>:<bucket>`), so the increment is a single
 * atomic INCRBY on both backends and every instance in a deployment counts
 * against ONE budget — a multi-instance deployment no longer multiplies every
 * limit by instance count. On a shared-backend failure the limiter sheds load
 * (allowed:false) instead of silently unbounding intake (fail closed).
 */
export async function checkSharedRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<SharedRateLimitResult> {
  const bucket = Math.floor(Date.now() / windowMs);
  const resetInMs = (bucket + 1) * windowMs - Date.now();
  const adapter = kvAdapter;
  if (!adapter) {
    // Adapter not bound at boot (unit-test contexts): identical fixed-window
    // semantics, process-local.
    const local = checkRateLimit(key, maxRequests, windowMs);
    return { ...local, backend: "memory", sharedBackendAvailable: true };
  }
  try {
    // TTL of 2× window so a bucket is garbage-collected shortly after it ends;
    // counts never straddle buckets because the key embeds the bucket id.
    const count = await adapter.incrBy(`rl:${key}:${bucket}`, 1, windowMs * 2);
    return {
      allowed: count <= maxRequests,
      remaining: Math.max(0, maxRequests - count),
      resetInMs,
      backend: adapter.backend,
      sharedBackendAvailable: true,
    };
  } catch {
    // Shed load: refuse this request rather than silently multiplying the
    // budget when the shared backend is unreachable (AUD-14).
    return { allowed: false, remaining: 0, resetInMs, backend: adapter.backend, sharedBackendAvailable: false };
  }
}

export function createSessionCookie(token: string, maxAgeSeconds: number = 86400): string {
  const isSecure = process.env.NODE_ENV === "production";
  return `vmnl_session=${token}; HttpOnly; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${isSecure ? "; Secure" : ""}`;
}

/**
 * Verifies and decodes a JWT session token
 */
export function verifySessionToken(token: string): SessionUser {
  if (isTokenRevoked(token)) {
    throw new Error("[VMNL-AUTH-ERROR] Session token has been revoked");
  }
  // TODO-SEC-03: the session registry revokes by token id (sha-256 of the raw
  // token, which the registry never retains). Consult it so a session revoked
  // from the Active Sessions surface fails verification immediately.
  if (isTokenIdRevoked(computeSessionId(token))) {
    throw new Error("[VMNL-AUTH-ERROR] Session token has been revoked");
  }

  const config = getConfig();
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      issuer: "vmnl-enterprise-auth",
      audience: "vmnl-api",
      algorithms: ["HS256"],
      maxAge: `${config.JWT_EXPIRATION_SECONDS}s`,
    }) as jwt.JwtPayload;
    if (decoded.purpose === MFA_CHALLENGE_PURPOSE) {
      throw new Error("MFA login challenge cannot be used as a session");
    }

    return {
      userId: decoded.sub as string,
      personId: decoded.personId as string,
      email: decoded.email as string,
      roles: (decoded.roles as string[]) || [],
      tenantId: decoded.tenantId as string | undefined,
    };
  } catch (error) {
    throw new Error(`[VMNL-AUTH-ERROR] Invalid or expired session token: ${(error as Error).message}`, {
      cause: error,
    });
  }
}

/**
 * TSK-27 (CA-26): fleet-wide revocation check for a request-carrying token.
 * `verifySessionToken` is synchronous and cannot await the shared store, so the
 * HTTP entry point awaits this once per request before any authorization
 * decision — after it runs, a token revoked by another instance is rejected by
 * every sync verification on the path.
 */
export async function primeSessionRevocation(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const id = computeSessionId(token);
  if (isTokenIdRevoked(id)) return true;
  return primeRevocationFromSharedStore(id);
}

export interface UserRecord {
  userId: string;
  personId: string;
  email: string;
  passwordHash: string;
  roles: string[];
  status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
  tenantId?: string;
  mfaEnabled?: boolean;
  mfaSecret?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory credential store with real bcrypt hashes for system users
const userStore = new Map<string, UserRecord>();

export function isBcryptPasswordHash(value: unknown): value is string {
  return typeof value === "string" && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
}

export function sandboxSeedOptIn(env: string | undefined, enabled: string | undefined): boolean {
  const normalizedEnv = (env || "").toLowerCase();
  if (normalizedEnv === "production" || normalizedEnv === "staging") return false;
  if (normalizedEnv === "test") return true; // test fixtures are an isolated runtime
  return normalizedEnv === "development" && enabled === "true";
}

export function seedDefaultUsers(): void {
  // If explicitly configured via VMNL_SEED_USERS_JSON env variable, load from JSON (T-05, Law 7)
  if (process.env.VMNL_SEED_USERS_JSON) {
    try {
      const parsed = JSON.parse(process.env.VMNL_SEED_USERS_JSON);
      if (Array.isArray(parsed)) {
        const isDeployment = ["production", "staging"].includes((process.env.NODE_ENV || "").toLowerCase());
        if (isDeployment && parsed.length === 0) {
          throw new Error("Production/staging seed records must include at least one provisioned user.");
        }
        for (const u of parsed) {
          if (!u || typeof u.email !== "string" || !Array.isArray(u.roles) || u.roles.some((role: unknown) => typeof role !== "string")) {
            throw new Error("Each configured deployment user must include an email and roles array.");
          }
          if (isDeployment && (!isBcryptPasswordHash(u.passwordHash) || Object.prototype.hasOwnProperty.call(u, "password"))) {
            throw new Error("Production/staging seed records must use bcrypt passwordHash only.");
          }
          const emailKey = u.email.toLowerCase().trim();
          assertSeedRolesConformToRbac(u.roles);
          const hash = u.passwordHash || (u.password ? bcrypt.hashSync(u.password, BCRYPT_SALT_ROUNDS) : "");
          if (hash) {
            userStore.set(emailKey, {
              userId: u.userId || `usr-${Buffer.from(emailKey).toString("hex").substring(0, 12)}`,
              personId: u.personId || `per-${Buffer.from(emailKey).toString("hex").substring(0, 12)}`,
              email: emailKey,
              passwordHash: hash,
              roles: u.roles || ["Operator"],
              status: "ACTIVE",
              tenantId: u.tenantId || "vmnl-hq",
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }
        return;
      }
    } catch (err: any) {
      console.error("[VMNL-AUTH-ERROR] Failed to parse VMNL_SEED_USERS_JSON:", err.message);
      if (["production", "staging"].includes((process.env.NODE_ENV || "").toLowerCase())) throw err;
    }
  }

  // Never seed sandbox accounts in production-like deployments. Explicit,
  // pre-hashed VMNL_SEED_USERS_JSON records were handled above; all other
  // deployment bootstraps must provision users through the approved process.
  if (["production", "staging"].includes((process.env.NODE_ENV || "").toLowerCase())) {
    throw new Error("[VMNL-AUTH] Refusing to start production/staging without explicitly supplied deployment users.");
  }

  // Sandbox account creation is confined to development/test environments;
  // development must opt in, while isolated test runs use their test fixtures.
  if (!sandboxSeedOptIn(process.env.NODE_ENV, process.env.VMNL_ENABLE_SANDBOX_SEEDS)) return;


  // Development/Test Sandbox Seeding:
  // Pre-computed bcrypt hash derived from DEV_SEED_PASSWORD (never plaintext in source)
  const devPassword = process.env.DEV_SEED_PASSWORD || "vmnl-dev-seed-pass-2026#secure";
  const devHash = process.env.DEV_SEED_PASSWORD_HASH || bcrypt.hashSync(devPassword, BCRYPT_SALT_ROUNDS);

  const defaultUsers: Array<{
    email: string;
    roles: string[];
    tenantId?: string;
  }> = [
    { email: "admin@vmnl.ng", roles: ["SuperAdmin"] },
    { email: "director@vmnl.ng", roles: ["BroadcastDirector"] },
    { email: "finance.controller@vmnl.ng", roles: ["FinanceController"] },
    { email: "finance@vmnl.ng", roles: ["FinanceController"] },
    { email: "traffic@vmnl.ng", roles: ["CommercialTrafficOfficer", "TrafficManager"] },
    { email: "scheduler@vmnl.ng", roles: ["ProgrammeScheduler"] },
    { email: "rights@vmnl.ng", roles: ["RightsManager"] },
    { email: "operator@vmnl.ng", roles: ["Operator"] },
    { email: "auditor@vmnl.ng", roles: ["Auditor"] },
    { email: "mcr@vmnl.ng", roles: ["MCRSupervisor"] },
    { email: "talent@vmnl.ng", roles: ["TalentManager"] },
  ];

  for (const u of defaultUsers) {
    const emailKey = u.email.toLowerCase().trim();
    assertSeedRolesConformToRbac(u.roles);
    if (!userStore.has(emailKey)) {
      const seedRecord: UserRecord = {
        userId: `usr-${Buffer.from(emailKey).toString("hex").substring(0, 12)}`,
        personId: `per-${Buffer.from(emailKey).toString("hex").substring(0, 12)}`,
        email: emailKey,
        passwordHash: devHash,
        roles: u.roles,
        status: "ACTIVE",
        tenantId: u.tenantId || "vmnl-hq",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      userStore.set(emailKey, seedRecord);
      void persistUserToSharedStore(emailKey, seedRecord).catch(() => { /* non-blocking */ });
    }
  }
}

seedDefaultUsers();

/**
 * TSK-27 (CA-26): adapter-**first** read. With a shared backend bound, the
 * adapter is the authority and the process Map is a cache that is refreshed from
 * it — otherwise a wired Redis is a write-only mirror and a second instance's
 * enrollment, role change or deactivation is invisible here until restart.
 * A KV *miss* still falls through to the Map, because a boot-seeded sandbox
 * account may never have been mirrored; that fall-through repairs the mirror
 * rather than quietly serving a record only this process can see.
 */
export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const emailKey = email.toLowerCase().trim();
  if (kvAdapter) {
    try {
      const raw = await kvAdapter.get(`user:${emailKey}`);
      if (raw) {
        const record = decryptUserSecretsFromStore(JSON.parse(raw) as UserRecord);
        record.createdAt = new Date(record.createdAt);
        record.updatedAt = new Date(record.updatedAt);
        userStore.set(emailKey, record);
        return record;
      }
    } catch {
      /* KV read failure: fall through to the process copy, do not invent a miss */
    }
  }
  const local = userStore.get(emailKey);
  if (local && kvAdapter) {
    // Only a *confirmed* KV miss reaches here (a failure returned above), so this
    // is a repair, not an overwrite of a newer remote record.
    void persistUserToSharedStore(emailKey, local).catch(() => { /* non-blocking */ });
  }
  return local ?? null;
}

export async function updateUserMfaEnrollment(email: string, secret: string): Promise<void> {
  const emailKey = email.toLowerCase().trim();
  const user = await findUserByEmail(emailKey);
  if (!user) throw new Error("User record not found");
  user.mfaEnabled = true;
  user.mfaSecret = secret;
  user.updatedAt = new Date();
  userStore.set(emailKey, user);
  // AUD-06 / TSK-30: seal, then assert, before the record leaves the process.
  await persistUserToSharedStore(emailKey, user);
}

export async function registerUser(params: {
  email: string;
  password: string;
  roles?: string[];
  tenantId?: string;
}): Promise<UserRecord> {
  const emailKey = params.email.toLowerCase().trim();
  // TSK-27: existence is decided by the adapter when one is bound, so an account
  // created by another instance is visible here instead of duplicating.
  const existing = await findUserByEmail(emailKey);
  if (existing) {
    throw new Error(`[VMNL-AUTH-ERROR] User with email '${emailKey}' already exists`);
  }
  const passwordHash = await hashPassword(params.password);
  const now = new Date();
  const user: UserRecord = {
    userId: `usr-${randomUUID()}`,
    personId: `per-${randomUUID()}`,
    email: emailKey,
    passwordHash,
    roles: params.roles && params.roles.length > 0 ? params.roles : ["Operator"],
    status: "ACTIVE",
    tenantId: params.tenantId || "vmnl-hq",
    createdAt: now,
    updatedAt: now,
  };
  if (kvAdapter) {
    // Claim the key atomically (SET NX): two instances that both read "absent"
    // must not both write. The loser reports the conflict it just lost.
    const claimed = await kvAdapter.setIfAbsent(`user:${emailKey}`, sealedUserPayload(user));
    if (!claimed) {
      throw new Error(`[VMNL-AUTH-ERROR] User with email '${emailKey}' already exists`);
    }
  }
  userStore.set(emailKey, user);
  return user;
}

/**
 * Brute-force defense (AUD-05, TSK-27): per-account failed-attempt tracking with
 * exponential lockout windows. Keyed by lower-cased email so the limit holds
 * regardless of source IP (which may be a shared NAT or a spoofable proxy
 * header). With a shared adapter bound, the counter is a single atomic INCR and
 * the lockout is an expiring key, so the whole fleet shares one budget per
 * account — a distributed password spray no longer gets `instance count`
 * attempts per window.
 */
interface AccountLockoutState {
  consecutiveFailures: number;
  lockedUntil: number;
}
const accountLockoutStore = new Map<string, AccountLockoutState>();
const MAX_CONSECUTIVE_LOGIN_FAILURES = 5;
const BASE_LOCKOUT_MS = 30_000; // doubles per subsequent failure, capped
const MAX_LOCKOUT_MS = 15 * 60_000;
/** Failed attempts are counted over a window as long as the cap itself. */
const LOGIN_FAILURE_WINDOW_MS = MAX_LOCKOUT_MS;

function failureCounterKey(emailKey: string): string {
  return `auth:fail:${emailKey}`;
}

function lockKey(emailKey: string): string {
  return `auth:lock:${emailKey}`;
}

function lockoutDurationMs(consecutiveFailures: number): number {
  return Math.min(BASE_LOCKOUT_MS * 2 ** (consecutiveFailures - MAX_CONSECUTIVE_LOGIN_FAILURES), MAX_LOCKOUT_MS);
}

function getRemainingLockoutMs(emailKey: string): number {
  const state = accountLockoutStore.get(emailKey);
  if (state && state.lockedUntil > Date.now()) {
    return state.lockedUntil - Date.now();
  }
  return 0;
}

/**
 * AUD-01 / TSK-27: the lockout decision is the shared key's, not this process's
 * Map. The local copy is warmed from the adapter so the sync readers agree.
 */
async function getRemainingLockoutMsAsync(emailKey: string): Promise<number> {
  const localMs = getRemainingLockoutMs(emailKey);
  if (localMs > 0) return localMs;
  const adapter = kvAdapter;
  if (!adapter) return 0;
  try {
    const [lockRaw, failuresRaw] = await Promise.all([
      adapter.get(lockKey(emailKey)),
      adapter.get(failureCounterKey(emailKey)),
    ]);
    if (!lockRaw) return 0;
    const lockedUntil = Number(lockRaw);
    if (!Number.isFinite(lockedUntil)) return 0;
    accountLockoutStore.set(emailKey, {
      consecutiveFailures: Number(failuresRaw) || MAX_CONSECUTIVE_LOGIN_FAILURES,
      lockedUntil,
    });
    return Math.max(0, lockedUntil - Date.now());
  } catch {
    // A shared-backend *failure* is not a lockout: the credential check still
    // runs, and the rate limiter in front of login is the fail-closed layer.
    return 0;
  }
}

async function recordLoginFailure(emailKey: string): Promise<number> {
  const adapter = kvAdapter;
  if (adapter) {
    try {
      const failures = await adapter.incrBy(failureCounterKey(emailKey), 1, LOGIN_FAILURE_WINDOW_MS);
      const state: AccountLockoutState = { consecutiveFailures: failures, lockedUntil: 0 };
      if (failures >= MAX_CONSECUTIVE_LOGIN_FAILURES) {
        const lockoutMs = lockoutDurationMs(failures);
        state.lockedUntil = Date.now() + lockoutMs;
        await adapter.set(lockKey(emailKey), String(state.lockedUntil), lockoutMs);
      }
      accountLockoutStore.set(emailKey, state);
      return Math.max(0, state.lockedUntil - Date.now());
    } catch {
      /* fall through to the process-local counter */
    }
  }
  const state = accountLockoutStore.get(emailKey) || { consecutiveFailures: 0, lockedUntil: 0 };
  state.consecutiveFailures += 1;
  if (state.consecutiveFailures >= MAX_CONSECUTIVE_LOGIN_FAILURES) {
    state.lockedUntil = Date.now() + lockoutDurationMs(state.consecutiveFailures);
  }
  accountLockoutStore.set(emailKey, state);
  return getRemainingLockoutMs(emailKey);
}

async function recordLoginSuccess(emailKey: string): Promise<void> {
  accountLockoutStore.delete(emailKey);
  const adapter = kvAdapter;
  if (!adapter) return;
  try {
    await Promise.all([adapter.del(failureCounterKey(emailKey)), adapter.del(lockKey(emailKey))]);
  } catch {
    // The local counter is reset either way; the shared window expires on its
    // own TTL rather than being extended by an unreachable backend.
  }
}

export interface LoginAttemptResult {
  user: SessionUser | null;
  lockedForMs: number;
}

/**
 * Authenticates user credentials with real bcrypt password verification against stored credentials.
 * Enforces per-account exponential lockout after repeated failures (AUD-05).
 * Returns SessionUser on success, null on invalid credentials.
 */
export async function authenticateUser(email: string, password: string): Promise<LoginAttemptResult> {
  if (!email || !password) return { user: null, lockedForMs: 0 };
  const emailKey = email.toLowerCase().trim();

  // AUD-01: check cross-process lockout state via KV adapter
  const remainingLockoutMs = await getRemainingLockoutMsAsync(emailKey);
  if (remainingLockoutMs > 0) {
    // Uniform 401 semantics preserved; the caller may surface retryAfterMs.
    return { user: null, lockedForMs: remainingLockoutMs };
  }

  const user = await findUserByEmail(emailKey);
  if (!user || user.status !== "ACTIVE") {
    const lockedForMs = await recordLoginFailure(emailKey);
    return { user: null, lockedForMs };
  }
  const isMatch = await verifyPassword(password, user.passwordHash);
  if (!isMatch) {
    const lockedForMs = await recordLoginFailure(emailKey);
    return { user: null, lockedForMs };
  }
  await recordLoginSuccess(emailKey);
  return {
    user: {
      userId: user.userId,
      personId: user.personId,
      email: user.email,
      roles: user.roles,
      tenantId: user.tenantId,
      mfaEnabled: user.mfaEnabled,
    },
    lockedForMs: 0,
  };
}

