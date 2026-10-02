/**
 * VMNL TOTP (RFC 6238) Step-Up Verification — UX-SYS-002
 * Implements server-side verification for MFA step-up (todo.md TODO-SEC-01).
 * Uses Node's built-in crypto HMAC-SHA1; no new dependencies (Law 15).
 */

import crypto from "crypto";

const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
const TOTP_DRIFT_STEPS = 1; // allow ±1 step of clock drift

function base32Decode(input: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = input.replace(/=+$/g, "").replace(/\s+/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function generateTotpSecret(): string {
  const raw = crypto.randomBytes(20);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of raw) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += alphabet[(value << (5 - bits)) & 31];
  return out;
}

/**
 * Computes the TOTP code for a secret at a given step window.
 */
export function computeTotp(secretBase32: string, counter: number): string {
  const key = base32Decode(secretBase32);
  if (key.length === 0) {
    throw new Error("[VMNL-TOTP-01] Invalid TOTP secret (empty after decode).");
  }
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter % 0x100000000, 4);
  const hmac = crypto.createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const code =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);
  return String(code % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, "0");
}

export interface TotpVerifyResult {
  valid: boolean;
  code: string;
  error?: string;
}

/**
 * Verifies a 6-digit step-up code against the user's secret with ±1 step of
 * clock drift. Anti-replay: a consumed (counter, code) pair cannot be reused
 * until it falls outside the drift window.
 */
export class TotpVerifier {
  // userId -> set of `${counter}:${code}` consumed
  private consumed = new Map<string, Set<string>>();

  public verify(userId: string, secretBase32: string, code: string, nowMs: number = Date.now()): TotpVerifyResult {
    const normalized = (code || "").trim();
    if (!/^\d{6}$/.test(normalized)) {
      return { valid: false, code: normalized, error: "Verification code must be exactly 6 digits." };
    }

    const counterNow = Math.floor(nowMs / 1000 / TOTP_STEP_SECONDS);
    const used = this.consumed.get(userId) || new Set<string>();

    for (let drift = -TOTP_DRIFT_STEPS; drift <= TOTP_DRIFT_STEPS; drift++) {
      const counter = counterNow + drift;
      const expected = computeTotp(secretBase32, counter);
      const key = `${counter}:${expected}`;
      if (expected === normalized) {
        if (used.has(key)) {
          return { valid: false, code: normalized, error: "This verification code has already been used. Wait for the next code." };
        }
        used.add(key);
        this.consumed.set(userId, used);
        return { valid: true, code: normalized };
      }
    }
    return { valid: false, code: normalized, error: "Incorrect or expired verification code." };
  }

  public _resetForTesting(): void {
    this.consumed.clear();
  }
}

export const globalTotpVerifier = new TotpVerifier();

/**
 * Sandbox MFA secret store. In production this column lives on the User record
 * (prisma `mfaSecret`); the sandbox keeps an in-memory map keyed by email.
 */
const sandboxSecrets = new Map<string, string>();

export function enrollMfaSecret(email: string, secret?: string): string {
  const key = email.toLowerCase().trim();
  const value = secret || generateTotpSecret();
  sandboxSecrets.set(key, value);
  return value;
}

export function getMfaSecret(email: string): string | undefined {
  return sandboxSecrets.get(email.toLowerCase().trim());
}

export function _resetMfaSecretsForTesting(): void {
  sandboxSecrets.clear();
}
