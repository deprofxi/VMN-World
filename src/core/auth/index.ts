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

/**
 * Verifies and decodes a JWT session token
 */
export function verifySessionToken(token: string): SessionUser {
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
    throw new Error(`[VMNL-AUTH-ERROR] Invalid or expired session token: ${(error as Error).message}`);
  }
}
