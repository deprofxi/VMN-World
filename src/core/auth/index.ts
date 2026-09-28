import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getConfig } from "../config/index.js";

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

const revokedTokens = new Set<string>();

export function revokeToken(token: string): void {
  revokedTokens.add(token);
}

export function isTokenRevoked(token: string): boolean {
  return revokedTokens.has(token);
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const rateLimitStore = new Map<string, RateLimitBucket>();

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

