/**
 * NIBSS Instant Payment (NIP) Payload Cryptography & Mandate Security
 * Authority: Central Bank of Nigeria (CBN) Electronic Payments Guidelines / NIP Interface Specification v3.2
 * Financial Authority Master R1.1 — HD-04 / S-FIN-01
 *
 * Implements hardware-security-ready payload encryption (AES-256-CBC with PKCS7 padding),
 * 30-digit NIP Session ID verification, and cryptographic HMAC mandate signing.
 */

import crypto from "node:crypto";

export interface NipSessionDetails {
  institutionCode: string;
  timestampSegment: string;
  sequenceSegment: string;
  formattedSessionId: string;
}

export interface EncryptedNipPayload {
  cipherTextB64: string;
  ivHex: string;
  authSignatureHex: string;
}

export interface NipMandateClaims {
  nipSessionId: string;
  sourceAccount: string;
  destinationAccount: string;
  destinationBankCode: string;
  amountKobo: bigint;
  narration: string;
  mandateReference: string;
}

export class NipSecurityModule {
  public static readonly NIP_RESPONSE_CODES: Record<string, string> = {
    "00": "Approved or completed successfully",
    "03": "Invalid sender / originating institution",
    "05": "Do not honor transaction",
    "06": "System error or processing failure",
    "07": "Pick up card or suspect account",
    "08": "Honor with identification",
    "12": "Invalid transaction mandate",
    "13": "Invalid disbursement amount",
    "14": "Invalid account number",
    "15": "No such originating financial institution",
    "25": "Unable to locate record in bank core",
    "26": "Duplicate record / already processed session ID",
    "30": "Format error in NIP payload",
    "51": "Insufficient funds in settlement treasury",
    "57": "Transaction not permitted to recipient account",
    "58": "Transaction not permitted to originating channel",
    "61": "Exceeds withdrawal or transfer frequency limit",
    "91": "Destination bank core timeout / switch inoperative",
    "92": "Financial institution cannot be routed",
    "96": "System malfunction / NIBSS Central Switch error",
  };

  /**
   * Validates that a string conforms to the 30-digit NIBSS Instant Payment (NIP) Session ID standard:
   * 6 digits (Originating Institution Code) + 12 digits (YYMMDDHHmmss) + 12 digits (Sequence / Random).
   */
  public static validateNipSessionId(sessionId: string): { valid: boolean; details?: NipSessionDetails; error?: string } {
    if (!/^\d{30}$/.test(sessionId)) {
      return {
        valid: false,
        error: "NIP Session ID must contain exactly 30 numeric digits.",
      };
    }

    const institutionCode = sessionId.substring(0, 6);
    const timestampSegment = sessionId.substring(6, 18);
    const sequenceSegment = sessionId.substring(18, 30);

    return {
      valid: true,
      details: {
        institutionCode,
        timestampSegment,
        sequenceSegment,
        formattedSessionId: sessionId,
      },
    };
  }

  /**
   * Encrypts a payment mandate using AES-256-CBC and generates an HMAC-SHA256 signature.
   */
  public static encryptMandate(payloadJson: string, secretKeyHex: string, hmacKeyHex: string): EncryptedNipPayload {
    const key = Buffer.from(secretKeyHex, "hex");
    if (key.length !== 32) {
      throw new Error("NIP_SEC_ERR_01: AES-256 encryption key must be exactly 32 bytes (64 hex characters).");
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(payloadJson, "utf8", "base64");
    encrypted += cipher.final("base64");

    const authSignatureHex = crypto
      .createHmac("sha256", Buffer.from(hmacKeyHex, "hex"))
      .update(encrypted)
      .digest("hex");

    return {
      cipherTextB64: encrypted,
      ivHex: iv.toString("hex"),
      authSignatureHex,
    };
  }

  /**
   * Decrypts an AES-256-CBC encrypted NIP payload and verifies the HMAC-SHA256 signature.
   */
  public static decryptMandate(
    encrypted: EncryptedNipPayload,
    secretKeyHex: string,
    hmacKeyHex: string
  ): { success: boolean; plainTextJson?: string; error?: string } {
    const expectedSig = crypto
      .createHmac("sha256", Buffer.from(hmacKeyHex, "hex"))
      .update(encrypted.cipherTextB64)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(encrypted.authSignatureHex, "hex"), Buffer.from(expectedSig, "hex"))) {
      return { success: false, error: "NIP payload HMAC signature verification failed." };
    }

    try {
      const key = Buffer.from(secretKeyHex, "hex");
      const iv = Buffer.from(encrypted.ivHex, "hex");
      const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
      let decrypted = decipher.update(encrypted.cipherTextB64, "base64", "utf8");
      decrypted += decipher.final("utf8");

      return {
        success: true,
        plainTextJson: decrypted,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: `Decryption failure: ${message}`,
      };
    }
  }

  /**
   * Resolves a NIBSS 2-digit response code to its human-readable statutory definition.
   */
  public static resolveResponseCode(code: string): { code: string; successful: boolean; description: string } {
    const description = NipSecurityModule.NIP_RESPONSE_CODES[code] || `Unrecognized NIP response code: ${code}`;
    return {
      code,
      successful: code === "00",
      description,
    };
  }
}
