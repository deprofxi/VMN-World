/**
 * Web Security Controls — TODO-SEC-11 (CSRF) & TODO-SEC-08 (mutation idempotency)
 *
 * CSRF (AUD-01): unsafe requests authenticated by ambient session cookies
 * require a double-submit token plus Origin and Fetch-Metadata checks. Browser
 * forms submit a hidden field; JSON clients send X-CSRF-Token. Bearer-only API
 * clients do not rely on ambient browser credentials.
 *
 * Idempotency (SEC-08): mutating operations may present an operation-identity
 * key; the first execution records the outcome, replays return the recorded
 * result without re-executing (unknown-outcome recovery: a replay before the
 * original completes yields 409 RETRY_LATER until the outcome exists).
 */

import {
  createHmac,
  timingSafeEqual,
  randomBytes,
  createCipheriv,
  createDecipheriv,
  scryptSync,
} from "node:crypto";
import { registerDurableStore, stageDurableWrite } from "../database/durable-journal.js";
import { loadIdempotencyRecords, persistIdempotencyRecord } from "../database/repositories/release-critical.repository.js";

// ---------------------------------------------------------------------------
// CSRF (TODO-SEC-11)
// ---------------------------------------------------------------------------

export const CSRF_COOKIE_NAME = "vmnl_csrf";
export const CSRF_FIELD_NAME = "csrfToken";

function csrfSecret(): string {
  const sessionSecret = process.env.SESSION_SECRET;
  const jwtSecret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging") {
    if (!sessionSecret || !jwtSecret || sessionSecret === jwtSecret) {
      throw new Error("[VMNL-SEC] SESSION_SECRET must be configured separately from JWT_SECRET in production/staging (AUD-13)");
    }
    return sessionSecret;
  }
  return sessionSecret || jwtSecret || "vmnl-dev-csrf-secret-not-for-production";
}

/** Issues a new CSRF token (HMAC-bound to the session secret). */
export function issueCsrfToken(): string {
  const nonce = randomBytes(16).toString("hex");
  const mac = createHmac("sha256", csrfSecret()).update(nonce).digest("hex");
  return `${nonce}.${mac}`;
}

/** Verifies a presented token's structure and MAC (timing-safe). */
export function verifyCsrfToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const nonce = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = createHmac("sha256", csrfSecret()).update(nonce).digest("hex");
  if (mac.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(mac), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * Double-submit + Origin + Fetch-Metadata verification for unsafe requests.
 * The presented header/form token must equal the valid CSRF cookie token; a
 * present Origin must be allow-listed and cross-site Fetch Metadata is denied.
 */
export function verifyFormCsrf(params: {
  headers: Record<string, unknown> | { origin?: unknown; "sec-fetch-site"?: unknown; cookie?: unknown };
  cookieHeader: string | undefined;
  formToken: string | undefined;
  allowedOrigins: string[];
}): { ok: boolean; reason?: "MISSING_TOKEN" | "MISMATCH" | "INVALID_ORIGIN" } {
  const origin = typeof params.headers.origin === "string" ? params.headers.origin : undefined;
  const fetchSite = typeof params.headers["sec-fetch-site"] === "string" ? params.headers["sec-fetch-site"] : undefined;

  // Reject browser-identified cross-site requests even if an Origin header is
  // missing. A present Origin must match exactly one configured trusted origin.
  if (fetchSite === "cross-site" || (origin && !params.allowedOrigins.includes(origin))) {
    return { ok: false, reason: "INVALID_ORIGIN" };
  }

  const cookieToken = params.cookieHeader
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`))
    ?.substring(CSRF_COOKIE_NAME.length + 1);

  if (!params.formToken || !cookieToken) return { ok: false, reason: "MISSING_TOKEN" };
  if (params.formToken !== cookieToken) return { ok: false, reason: "MISMATCH" };
  if (!verifyCsrfToken(params.formToken)) return { ok: false, reason: "MISMATCH" };
  return { ok: true };
}

/** Parses the CSRF token from a urlencoded form body. */
export function extractCsrfFromForm(rawBody: string): string | undefined {
  return new URLSearchParams(rawBody).get(CSRF_FIELD_NAME) || undefined;
}

export function csrfCookieHeader(token: string): string {
  return `${CSRF_COOKIE_NAME}=${token}; Path=/; SameSite=Strict; HttpOnly=false`;
}

// ---------------------------------------------------------------------------
// Idempotency (TODO-SEC-08)
// ---------------------------------------------------------------------------

import { resolveKeyValueAdapter } from "../cache/index.js";
import { checkDatabaseConnection } from "../database/index.js";
import { getRepositoryMode, RepositoryUnavailableError } from "../database/repository-mode.js";
import {
  claimProviderEvent,
  markProviderEventIngested,
  releaseProviderEventClaim as deleteUngestedProviderClaim,
} from "../database/repositories/release-critical.repository.js";

/** A provider webhook is refused *because it was already ingested*, not because it was invalid. */
export interface ProviderEventReplay {
  duplicate: true;
  layer: "DATABASE" | "CACHE";
}

/**
 * AUD-07 / TSK-19: replay protection for payment provider events.
 *
 * The claim is Postgres-first. `@@unique([provider, eventId])` on
 * `ProviderEventClaim` is the authority, so a retry that arrives after a Redis
 * flush and a process restart — the exact hole the KV-only claim left open — is
 * still refused. The KV key is kept as a mirror so a same-window replay is
 * answered without a database round trip, and as the *only* layer available when
 * Postgres is unreachable.
 *
 * Refusing a replay must never cost a genuine payment, so the durable claim is
 * two-phase: `claimProviderEventOnce` takes the claim unstamped, and
 * `confirmProviderEventIngested` stamps it once the event has reached the
 * engine. A retry of an unstamped claim is an abandoned attempt — the process
 * died between claim and ingestion — and takes the claim over instead of being
 * refused. `releaseProviderEventClaim` is the same rollback on the visible error
 * path, where the attempt failed for a reason the provider can act on.
 *
 * Degradation is reported, never hidden: `layer: "CACHE"` on a granted claim
 * means this event is protected by the KV backend alone, which is durable only
 * as long as that backend is. Callers surface it (the webhook routes record a
 * `webhook_durable_claim_degraded_total` metric) rather than implying persistence
 * the deployment does not have.
 *
 * @throws RepositoryUnavailableError when Postgres refuses the insert for a
 * reason other than a unique violation and the repository mode is `fail_closed`.
 * The request then becomes a 503, which is what makes a provider retry — and
 * therefore a second delivery attempt — the correct outcome.
 */
export async function claimProviderEventOnce(
  provider: "paystack" | "flutterwave",
  eventId: string,
  ttlMs: number
): Promise<ProviderEventReplay | { duplicate: false; layer: "DATABASE" | "CACHE" }> {
  const adapter = resolveKeyValueAdapter();
  const key = `wh:${provider}:${eventId}`;
  const stamp = String(Date.now());

  const db = await checkDatabaseConnection();
  if (db.connected) {
    try {
      const claimed = await claimProviderEvent(provider, eventId);
      if (!claimed) {
        await adapter.set(key, stamp, ttlMs);
        return { duplicate: true, layer: "DATABASE" };
      }
      await adapter.set(key, stamp, ttlMs);
      return { duplicate: false, layer: "DATABASE" };
    } catch (err) {
      if (getRepositoryMode() === "fail_closed") {
        throw new RepositoryUnavailableError("claim", "ProviderEventClaim", err);
      }
      console.warn(
        `[VMNL-REPO-WARN] Prisma ProviderEventClaim claim failed, falling back to the KV layer: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  const kvClaimed = await adapter.setIfAbsent(key, stamp, ttlMs);
  return kvClaimed ? { duplicate: false, layer: "CACHE" } : { duplicate: true, layer: "CACHE" };
}

/**
 * TSK-19, phase two: stamp the durable claim once the event has reached the
 * engine. From this point a retry of the same provider event id is a true replay
 * and is refused; before it, a retry is treated as the recovery of an abandoned
 * attempt. Best-effort by design — the ingestion already succeeded, so a
 * sequencing fault here must not turn a delivered payment into a 5xx. An unstamped
 * claim only ever widens the window in which a retry is re-processed, and
 * ingestion is idempotent per transaction id.
 */
export async function confirmProviderEventIngested(
  provider: "paystack" | "flutterwave",
  eventId: string
): Promise<void> {
  try {
    if (!(await checkDatabaseConnection()).connected) return;
    await markProviderEventIngested(provider, eventId);
  } catch (err) {
    console.warn(
      `[VMNL-REPO-WARN] ProviderEventClaim ingest stamp failed for '${provider}:${eventId}': ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

/**
 * TSK-19: release a claim taken for an event that never reached the engine.
 *
 * A claim that outlives a failed ingestion is worse than no claim at all: the
 * provider's retry — the mechanism that exists precisely to recover a dropped
 * delivery — would be refused as a duplicate, turning a transient fault into a
 * permanently lost payment. Releasing is best-effort by design; it runs on an
 * error path and must never mask the error that caused it.
 */
export async function releaseProviderEventClaim(
  provider: "paystack" | "flutterwave",
  eventId: string
): Promise<void> {
  try {
    if ((await checkDatabaseConnection()).connected) {
      await deleteUngestedProviderClaim(provider, eventId);
    }
  } catch (err) {
    console.warn(
      `[VMNL-REPO-WARN] ProviderEventClaim release failed for '${provider}:${eventId}': ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
  try {
    await resolveKeyValueAdapter().del(`wh:${provider}:${eventId}`);
  } catch {
    // a KV that cannot answer is not a reason to lose the original error
  }
}

export interface IdempotencyRecord {
  key: string;
  outcome: string;
  responseBody?: unknown;
  recordedAt: Date;
}

const idempotencyStore = new Map<string, IdempotencyRecord>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * TSK-17: the operation-identity ledger is durable. A recorded outcome that only
 * lived in one process is the exact failure SEC-08 exists to prevent — a replay
 * after a restart would re-execute the mutation. Hydration therefore rebuilds
 * the store within the same TTL window the registry already applies.
 */
registerDurableStore<IdempotencyRecord>("idempotencyRecord", persistIdempotencyRecord);

function stageIdempotency(record: IdempotencyRecord): void {
  stageDurableWrite<IdempotencyRecord>({
    store: "idempotencyRecord",
    key: record.key,
    payload: record,
    rollback: () => {
      idempotencyStore.delete(record.key);
    },
  });
}

/** Boot hydration (TSK-17): rebuild the ledger from unexpired durable rows. */
export async function refreshIdempotencyIndex(): Promise<{ outcomes: number }> {
  const loaded = await loadIdempotencyRecords(new Date(Date.now() - IDEMPOTENCY_TTL_MS));
  idempotencyStore.clear();
  for (const record of loaded) idempotencyStore.set(record.key, record);
  return { outcomes: idempotencyStore.size };
}

/**
 * Records an outcome for an operation-identity key. Used after a mutating
 * handler completes so replays can return the same result.
 */
export function recordIdempotentOutcome(key: string, outcome: string, responseBody?: unknown): IdempotencyRecord {
  const record: IdempotencyRecord = { key, outcome, responseBody, recordedAt: new Date() };
  idempotencyStore.set(key, record);
  stageIdempotency(record);
  return record;
}

/**
 * Looks up a prior outcome for an idempotency key.
 *  - "recorded" → replay: return the recorded result, do not re-execute.
 *  - "absent"   → first execution.
 * The caller passes revisionToken (when applicable) to guard against stale
 * concurrent revisions: a mismatched revision with an existing key is REJECTED.
 */
export function checkIdempotency(
  key: string | undefined,
  _revisionToken?: string
): { status: "absent" } | { status: "recorded"; record: IdempotencyRecord } {
  if (!key) return { status: "absent" };
  const record = idempotencyStore.get(key);
  if (!record) return { status: "absent" };
  if (record.recordedAt.getTime() + IDEMPOTENCY_TTL_MS < Date.now()) {
    idempotencyStore.delete(key);
    return { status: "absent" };
  }
  return { status: "recorded", record };
}

export function _resetIdempotencyForTesting(): void {
  idempotencyStore.clear();
}

// ---------------------------------------------------------------------------
// Field-Level Envelope Encryption (AUD-30 / PII Protection)
// ---------------------------------------------------------------------------

export interface EncryptedFieldRecord {
  ciphertext: string;
  iv: string;
  authTag: string;
}

function getFieldEncryptionKey(secret?: string): Buffer {
  const env = process.env.NODE_ENV;
  const masterKey = secret || process.env.PII_ENCRYPTION_KEY;
  if (!masterKey) {
    if (env === "production" || env === "staging") {
      throw new Error("[VMNL-SEC] PII_ENCRYPTION_KEY is required in production/staging environments (AUD-09)");
    }
    // Dev/test fallback — never used in production
    return scryptSync(process.env.JWT_SECRET || "vmnl-fallback-key-min-32-chars-long", "vmnl_field_encryption_salt", 32);
  }
  return scryptSync(masterKey, "vmnl_field_encryption_salt", 32);
}

/**
 * Encrypts sensitive personal identifiers (nationalId, phone) using AES-256-GCM.
 */
export function encryptSensitiveField(plaintext: string, secret?: string): EncryptedFieldRecord {
  const key = getFieldEncryptionKey(secret);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString("hex"),
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

/**
 * Decrypts an AES-256-GCM encrypted field record.
 */
export function decryptSensitiveField(record: EncryptedFieldRecord, secret?: string): string {
  const key = getFieldEncryptionKey(secret);
  const iv = Buffer.from(record.iv, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(Buffer.from(record.authTag, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(record.ciphertext, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/**
 * TSK-30 (`report.md` CA-18): the envelope format is the contract the database
 * enforces too — `prisma/migrations/*_add_pii_sealed_envelope_checks` puts the
 * same shape into a `CHECK` on `Person.nationalId` and `User.mfaSecret`. It is
 * stated once here so the application guard and the constraint cannot drift
 * into two different definitions of "sealed".
 */
export const SEALED_FIELD_ENVELOPE = /^enc:v1:[0-9a-f]+:[0-9a-f]{24}:[0-9a-f]{32}$/;

export function isSealedFieldValue(value: string | null | undefined): boolean {
  return typeof value === "string" && SEALED_FIELD_ENVELOPE.test(value);
}

/**
 * Seals a sensitive value into the storage envelope. Fails closed two ways:
 * `getFieldEncryptionKey` throws when `PII_ENCRYPTION_KEY` is absent in
 * production/staging, and a value that is already an envelope is refused rather
 * than sealed a second time (a double-sealed field is unreadable and would
 * otherwise be written as if it were valid).
 */
export function sealSensitiveField(plaintext: string, secret?: string): string {
  if (isSealedFieldValue(plaintext)) {
    throw new Error("[VMNL-PII-02] value is already a sealed envelope; refusing to seal twice");
  }
  const { ciphertext, iv, authTag } = encryptSensitiveField(plaintext, secret);
  const envelope = `enc:v1:${ciphertext}:${iv}:${authTag}`;
  if (!isSealedFieldValue(envelope)) {
    throw new Error("[VMNL-PII-01] field encryption produced a malformed envelope");
  }
  return envelope;
}

/**
 * Write-boundary assertion: a sensitive column may be NULL or sealed, never a
 * plaintext value. Called before the bytes leave the process, so a caller that
 * forgot to seal gets an error instead of a persisted secret.
 */
export function assertSealedForStorage(field: string, value: string | null | undefined): void {
  if (value === null || value === undefined) return;
  if (!isSealedFieldValue(value)) {
    throw new Error(`[VMNL-PII-01] ${field} must be sealed before it is persisted`);
  }
}

export type OpenedField =
  | { outcome: "opened"; plaintext: string }
  | { outcome: "malformed"; plaintext: null }
  | { outcome: "auth_failed"; plaintext: null };

/**
 * Opens an envelope without ever throwing at a call site that cannot recover:
 * a structurally invalid value is `malformed`, a GCM authentication failure
 * (wrong key, tampered ciphertext) is `auth_failed`, and both must be handled
 * as "no plaintext available". Callers log the outcome — see
 * `decryptUserSecretsFromStore` in `src/core/auth`.
 */
export function openSealedField(value: string, secret?: string): OpenedField {
  if (!isSealedFieldValue(value)) return { outcome: "malformed", plaintext: null };
  const [, , ciphertext, iv, authTag] = value.split(":");
  try {
    return { outcome: "opened", plaintext: decryptSensitiveField({ ciphertext, iv, authTag }, secret) };
  } catch {
    return { outcome: "auth_failed", plaintext: null };
  }
}

/**
 * Masks a sensitive string, exposing only the trailing characters (e.g. "••••••••1234").
 */
export function maskSensitiveLast4(identifier: string | null | undefined, visibleChars = 4): string {
  if (!identifier) return "••••";
  const trimmed = identifier.trim();
  if (trimmed.length <= visibleChars) return "•".repeat(trimmed.length);
  const maskedLength = trimmed.length - visibleChars;
  return "•".repeat(maskedLength) + trimmed.slice(-visibleChars);
}

/**
 * Masks a phone number (e.g. "•••• ••• 4567").
 */
export function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "••• ••• ••••";
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "•••" + digits;
  return `•••• ••• ${digits.slice(-4)}`;
}

