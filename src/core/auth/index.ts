import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getConfig } from "../config/index.js";
import { assertSeedRolesConformToRbac } from "../rbac/index.js";
import { isTokenIdRevoked, computeSessionId } from "./sessions.js";
import type { KeyValueAdapter } from "../cache/index.js";

export interface SessionUser {
  userId: string;
  personId: string;
  email: string;
  roles: string[];
  tenantId?: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
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

export function revokeToken(token: string): void {
  activeRevocationStore.revoke(token);
}

export function isTokenRevoked(token: string): boolean {
  return Boolean(activeRevocationStore.isRevoked(token));
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

/**
 * TODO-SEC-10: the rate-limit and account-lockout stores run on the shared
 * KeyValueAdapter (Redis when REDIS_URL is configured, in-memory otherwise)
 * so the limits hold across instances. The in-memory adapter is synchronous
 * in cost, so the existing sync call sites are preserved; a Redis deployment
 * resolves the same adapter at boot via resolveKeyValueAdapter().
 */
const rateLimitStore = new Map<string, RateLimitBucket>();
let kvAdapter: KeyValueAdapter | null = null;

/** Boot-time hook: point the auth stores at the process-wide KV adapter. */
export function useKeyValueAdapterForAuthStores(adapter: KeyValueAdapter): void {
  kvAdapter = adapter;
}

function kvGetJson<T>(store: Map<string, T>, key: string): T | undefined {
  return store.get(key);
}

function kvSetJson<T>(store: Map<string, T>, key: string, value: T, ttlMs?: number): void {
  store.set(key, value);
  if (kvAdapter && ttlMs) {
    void kvAdapter.set(`auth:${key}`, JSON.stringify(value), ttlMs).catch(() => {
      /* adapter telemetry reports its own health; never block the request */
    });
  }
}

function kvDelJson<T>(store: Map<string, T>, key: string): void {
  store.delete(key);
  if (kvAdapter) {
    void kvAdapter.del(`auth:${key}`).catch(() => {
      /* never block the request */
    });
  }
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
  const bucket = kvGetJson(rateLimitStore, key);

  if (!bucket || now > bucket.resetAt) {
    kvSetJson(rateLimitStore, key, { count: 1, resetAt: now + windowMs }, windowMs);
    return { allowed: true, remaining: maxRequests - 1, resetInMs: windowMs };
  }

  if (bucket.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetInMs: Math.max(0, bucket.resetAt - now) };
  }

  bucket.count += 1;
  kvSetJson(rateLimitStore, key, bucket, bucket.resetAt - now);
  return { allowed: true, remaining: maxRequests - bucket.count, resetInMs: Math.max(0, bucket.resetAt - now) };
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
    }) as jwt.JwtPayload;

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

export interface UserRecord {
  userId: string;
  personId: string;
  email: string;
  passwordHash: string;
  roles: string[];
  status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory credential store with real bcrypt hashes for system users
const userStore = new Map<string, UserRecord>();

function seedDefaultUsers(): void {
  // If explicitly configured via VMNL_SEED_USERS_JSON env variable, load from JSON (T-05, Law 7)
  if (process.env.VMNL_SEED_USERS_JSON) {
    try {
      const parsed = JSON.parse(process.env.VMNL_SEED_USERS_JSON);
      if (Array.isArray(parsed)) {
        for (const u of parsed) {
          const emailKey = u.email.toLowerCase().trim();
          assertSeedRolesConformToRbac(u.roles || []);
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
    }
  }

  // In production, do not seed sandbox accounts unless VMNL_SEED_USERS_JSON was provided
  if (process.env.NODE_ENV === "production") {
    return;
  }

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
      userStore.set(emailKey, {
        userId: `usr-${Buffer.from(emailKey).toString("hex").substring(0, 12)}`,
        personId: `per-${Buffer.from(emailKey).toString("hex").substring(0, 12)}`,
        email: emailKey,
        passwordHash: devHash,
        roles: u.roles,
        status: "ACTIVE",
        tenantId: u.tenantId || "vmnl-hq",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
}

seedDefaultUsers();

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const emailKey = email.toLowerCase().trim();
  return userStore.get(emailKey) || null;
}

export async function registerUser(params: {
  email: string;
  password: string;
  roles?: string[];
  tenantId?: string;
}): Promise<UserRecord> {
  const emailKey = params.email.toLowerCase().trim();
  if (userStore.has(emailKey)) {
    throw new Error(`[VMNL-AUTH-ERROR] User with email '${emailKey}' already exists`);
  }
  const passwordHash = await hashPassword(params.password);
  const now = new Date();
  const user: UserRecord = {
    userId: `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    personId: `per-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    email: emailKey,
    passwordHash,
    roles: params.roles && params.roles.length > 0 ? params.roles : ["Operator"],
    status: "ACTIVE",
    tenantId: params.tenantId || "vmnl-hq",
    createdAt: now,
    updatedAt: now,
  };
  userStore.set(emailKey, user);
  return user;
}

/**
 * Brute-force defense (AUD-05): per-account failed-attempt tracking with
 * exponential lockout windows. Keyed by lower-cased email so the limit holds
 * regardless of source IP (which may be a shared NAT or a spoofable proxy
 * header).
 */
interface AccountLockoutState {
  consecutiveFailures: number;
  lockedUntil: number;
}
const accountLockoutStore = new Map<string, AccountLockoutState>();
const MAX_CONSECUTIVE_LOGIN_FAILURES = 5;
const BASE_LOCKOUT_MS = 30_000; // doubles per subsequent failure, capped
const MAX_LOCKOUT_MS = 15 * 60_000;

function getRemainingLockoutMs(emailKey: string): number {
  const state = accountLockoutStore.get(emailKey);
  if (!state) return 0;
  if (state.lockedUntil > Date.now()) {
    return state.lockedUntil - Date.now();
  }
  return 0;
}

function recordLoginFailure(emailKey: string): number {
  const state = accountLockoutStore.get(emailKey) || {
    consecutiveFailures: 0,
    lockedUntil: 0,
  };
  state.consecutiveFailures += 1;
  if (state.consecutiveFailures >= MAX_CONSECUTIVE_LOGIN_FAILURES) {
    const lockoutMs = Math.min(BASE_LOCKOUT_MS * 2 ** (state.consecutiveFailures - MAX_CONSECUTIVE_LOGIN_FAILURES), MAX_LOCKOUT_MS);
    state.lockedUntil = Date.now() + lockoutMs;
  }
  kvSetJson(accountLockoutStore, emailKey, state, MAX_LOCKOUT_MS);
  return getRemainingLockoutMs(emailKey);
}

function recordLoginSuccess(emailKey: string): void {
  kvDelJson(accountLockoutStore, emailKey);
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

  const remainingLockoutMs = getRemainingLockoutMs(emailKey);
  if (remainingLockoutMs > 0) {
    // Uniform 401 semantics preserved; the caller may surface retryAfterMs.
    return { user: null, lockedForMs: remainingLockoutMs };
  }

  const user = await findUserByEmail(emailKey);
  if (!user || user.status !== "ACTIVE") {
    const lockedForMs = recordLoginFailure(emailKey);
    return { user: null, lockedForMs };
  }
  const isMatch = await verifyPassword(password, user.passwordHash);
  if (!isMatch) {
    const lockedForMs = recordLoginFailure(emailKey);
    return { user: null, lockedForMs };
  }
  recordLoginSuccess(emailKey);
  return {
    user: {
      userId: user.userId,
      personId: user.personId,
      email: user.email,
      roles: user.roles,
      tenantId: user.tenantId,
    },
    lockedForMs: 0,
  };
}

