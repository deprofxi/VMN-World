/**
 * VMNL MFA Enrollment & Recovery Token Store — bridges TOTP secrets and
 * recovery tokens to user emails for the sandbox identity store. Production
 * persistence is the User record (prisma `mfaSecret`).
 */

import crypto from "crypto";

import { getMfaSecret, enrollMfaSecret, globalTotpVerifier } from "./totp.js";

export { enrollMfaSecret, getMfaSecret } from "./totp.js";

export interface RecoveryRequestResult {
  dispatched: boolean;
  channel: "EMAIL" | "SANDBOX";
  /** Never returns whether the account exists (anti-enumeration, UIUX-001 §8.4). */
  message: string;
}

const recoveryTokens = new Map<string, { tokenHash: string; expiresAt: Date; used: boolean }>();

export function requestAccountRecovery(
  email: string,
  dispatch: (email: string, token: string) => "EMAIL" | "SANDBOX" | Promise<"EMAIL" | "SANDBOX">
): RecoveryRequestResult {
  // Uniform response regardless of account existence (anti-enumeration).
  const message = "If an account exists for that address, recovery instructions have been sent. Check your registered channels.";
  if (!email || !email.includes("@")) {
    return { dispatched: false, channel: "SANDBOX", message };
  }
  const token = crypto.randomBytes(24).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  recoveryTokens.set(email.toLowerCase().trim(), {
    tokenHash,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    used: false,
  });
  const channelOrPromise = dispatch(email, token);
  // Sync and async dispatch are both supported; the anti-enumeration response
  // does not depend on the dispatch outcome.
  const channel: "EMAIL" | "SANDBOX" =
    typeof channelOrPromise === "string" ? channelOrPromise : "SANDBOX";
  void channelOrPromise; // async dispatch (email) completes independently
  return { dispatched: true, channel, message };
}

/**
 * Consumes a recovery token. Returns false for unknown/expired/used tokens.
 */
export function consumeRecoveryToken(email: string, token: string): boolean {
  const record = recoveryTokens.get(email.toLowerCase().trim());
  if (!record || record.used) return false;
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  if (record.tokenHash !== hash) return false;
  if (record.expiresAt.getTime() <= Date.now()) return false;
  record.used = true;
  return true;
}

export function verifyStepUpCode(email: string, code: string): { valid: boolean; error?: string } {
  const secret = getMfaSecret(email);
  if (!secret) {
    return { valid: false, error: "MFA is not enrolled for this account." };
  }
  const result = globalTotpVerifier.verify(email, secret, code);
  return result.valid ? { valid: true } : { valid: false, error: result.error };
}

export function _resetRecoveryForTesting(): void {
  recoveryTokens.clear();
}
