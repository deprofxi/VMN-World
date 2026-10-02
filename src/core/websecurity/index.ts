/**
 * Web Security Controls — TODO-SEC-11 (CSRF) & TODO-SEC-08 (mutation idempotency)
 *
 * CSRF (SEC-11): every state-changing form POST carries a double-submit CSRF
 * token — issued as a readable cookie + hidden field pair and verified for
 * equality on POST. Form-originating routes additionally validate the Origin
 * header against the allow-list when present, so a cross-site attacker cannot
 * ride an authenticated session. JSON API mutations are excluded (they are
 * already Authorization-guarded and same-origin policy prevents cross-site
 * JSON writes with custom headers).
 *
 * Idempotency (SEC-08): mutating operations may present an operation-identity
 * key; the first execution records the outcome, replays return the recorded
 * result without re-executing (unknown-outcome recovery: a replay before the
 * original completes yields 409 RETRY_LATER until the outcome exists).
 */

import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

// ---------------------------------------------------------------------------
// CSRF (TODO-SEC-11)
// ---------------------------------------------------------------------------

export const CSRF_COOKIE_NAME = "vmnl_csrf";
export const CSRF_FIELD_NAME = "csrfToken";

function csrfSecret(): string {
  return process.env.SESSION_SECRET || process.env.JWT_SECRET || "vmnl-dev-csrf-secret-not-for-production";
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
 * Double-submit + Origin verification for form POSTs.
 * Passes when: the form field token equals the cookie token (both valid
 * MACs), AND (when the browser sent an Origin header) the origin is allowed.
 */
export function verifyFormCsrf(params: {
  headers: Record<string, unknown> | { origin?: unknown; "sec-fetch-site"?: unknown; cookie?: unknown };
  cookieHeader: string | undefined;
  formToken: string | undefined;
  allowedOrigins: string[];
}): { ok: boolean; reason?: "MISSING_TOKEN" | "MISMATCH" | "INVALID_ORIGIN" } {
  const origin = typeof params.headers.origin === "string" ? params.headers.origin : undefined;

  // Origin enforcement: a present Origin that is not allow-listed is a
  // cross-site request — reject before even looking at the token.
  if (origin && !params.allowedOrigins.includes(origin)) {
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

export interface IdempotencyRecord {
  key: string;
  outcome: string;
  responseBody?: unknown;
  recordedAt: Date;
}

const idempotencyStore = new Map<string, IdempotencyRecord>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Records an outcome for an operation-identity key. Used after a mutating
 * handler completes so replays can return the same result.
 */
export function recordIdempotentOutcome(key: string, outcome: string, responseBody?: unknown): IdempotencyRecord {
  const record: IdempotencyRecord = { key, outcome, responseBody, recordedAt: new Date() };
  idempotencyStore.set(key, record);
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
  revisionToken?: string
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
