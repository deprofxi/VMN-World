/**
 * Azeebo+ Production Identity & Token Federation Service
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A (§41–§45) / ADR-008
 *
 * Implements cryptographic single sign-on (SSO) token issuance and verification
 * for cross-platform subscriber handoffs between VMNL and Azeebo+ streaming platform.
 */

import crypto from "node:crypto";
import { getConfiguredFederationOrigin } from "./destinations.js";

export interface AzeeboFederationClaims {
  sub: string;
  email?: string;
  displayName?: string;
  roles: string[];
  entitlements: string[];
  iss: string;
  aud: string;
  iat: number;
  exp: number;
  nonce: string;
  orgId?: string;
}

export interface AzeeboFederationTokenHandoff {
  token: string;
  redirectUrl: string;
  expiresAt: Date;
  claims: AzeeboFederationClaims;
}

export class AzeeboFederationService {
  private secretKey: string;
  private defaultIssuer: string;
  private defaultAudience: string;

  constructor(secretKey?: string, issuer = "https://vmnl.ng", audience = "https://azeebo.plus") {
    this.secretKey = secretKey || process.env.AZEEBO_FEDERATION_SECRET || "azeebo_federation_secret_key_32chars";
    this.defaultIssuer = issuer;
    this.defaultAudience = audience;
  }

  public issueToken(params: {
    userId: string;
    email?: string;
    displayName?: string;
    roles?: string[];
    entitlements?: string[];
    orgId?: string;
    targetPath?: string;
    expiresInSeconds?: number;
  }): AzeeboFederationTokenHandoff {
    const origin = getConfiguredFederationOrigin() || this.defaultAudience;
    const now = Math.floor(Date.now() / 1000);
    const ttl = params.expiresInSeconds ?? 900; // 15 mins default
    const exp = now + ttl;
    const nonce = crypto.randomBytes(16).toString("hex");

    const claims: AzeeboFederationClaims = {
      sub: params.userId,
      email: params.email,
      displayName: params.displayName,
      roles: params.roles || ["SUBSCRIBER"],
      entitlements: params.entitlements || ["NXTR_LIVE", "ORIS_LIVE", "IMBD_LIVE"],
      orgId: params.orgId,
      iss: this.defaultIssuer,
      aud: origin,
      iat: now,
      exp,
      nonce,
    };

    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
    const encodedPayload = Buffer.from(JSON.stringify(claims)).toString("base64url");
    const signature = crypto
      .createHmac("sha256", this.secretKey)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64url");

    const token = `${encodedHeader}.${encodedPayload}.${signature}`;
    const cleanPath = (params.targetPath || "/").replace(/^\/+/, "");
    const redirectUrl = `${origin.replace(/\/+$/, "")}/${cleanPath}?fed_token=${token}&nonce=${nonce}`;

    return {
      token,
      redirectUrl,
      expiresAt: new Date(exp * 1000),
      claims,
    };
  }

  public verifyToken(token: string): {
    valid: boolean;
    claims?: AzeeboFederationClaims;
    error?: string;
  } {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        return { valid: false, error: "Invalid token structure" };
      }

      const [headerB64, payloadB64, signature] = parts;
      const expectedSignature = crypto
        .createHmac("sha256", this.secretKey)
        .update(`${headerB64}.${payloadB64}`)
        .digest("base64url");

      if (signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return { valid: false, error: "Signature mismatch" };
      }

      const claims = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as AzeeboFederationClaims;
      const now = Math.floor(Date.now() / 1000);

      if (claims.exp && claims.exp < now) {
        return { valid: false, error: "Token expired" };
      }

      return { valid: true, claims };
    } catch (err) {
      return { valid: false, error: (err as Error).message };
    }
  }
}
