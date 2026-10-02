import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  signSessionToken,
  verifySessionToken,
  SessionUser,
  setTokenRevocationStore,
  InMemoryRevocationStore,
  revokeToken,
  isTokenRevoked,
} from "../../src/core/auth/index.js";

describe("Core Authentication Service (TASK-P1-02)", () => {
  it("should securely hash and verify passwords", async () => {
    const rawPassword = "SuperSecretAuthToken2026!";
    const hash = await hashPassword(rawPassword);

    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith("$2")).toBe(true); // bcrypt prefix

    const isMatch = await verifyPassword(rawPassword, hash);
    expect(isMatch).toBe(true);

    const isWrong = await verifyPassword("WrongAuthToken2026!", hash);
    expect(isWrong).toBe(false);
  });

  it("should reject passwords shorter than 8 characters", async () => {
    await expect(hashPassword("short")).rejects.toThrowError(/at least 8 characters/);
  });

  it("should sign and verify valid JWT session tokens", () => {
    const mockUser: SessionUser = {
      userId: "usr-12345-uuid",
      personId: "per-67890-uuid",
      email: "director@vmn.ng",
      roles: ["BroadcastDirector"],
      tenantId: "vmnl-hq",
    };

    const tokens = signSessionToken(mockUser);
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.expiresIn).toBe(86400);

    const decoded = verifySessionToken(tokens.accessToken);
    expect(decoded.userId).toBe(mockUser.userId);
    expect(decoded.personId).toBe(mockUser.personId);
    expect(decoded.email).toBe(mockUser.email);
    expect(decoded.roles).toContain("BroadcastDirector");
    expect(decoded.tenantId).toBe("vmnl-hq");
  });

  it("should reject tampered or invalid JWT tokens", () => {
    expect(() => verifySessionToken("tampered.fake.token")).toThrowError(/Invalid or expired session token/);
  });

  it("propagates token revocation across instances via shared TokenRevocationStore (T-26)", () => {
    class SharedMockRevocationStore {
      public blacklist = new Set<string>();
      public revoke(token: string) {
        this.blacklist.add(token);
      }
      public isRevoked(token: string) {
        return this.blacklist.has(token);
      }
    }

    const sharedStore = new SharedMockRevocationStore();
    setTokenRevocationStore(sharedStore);

    const token = signSessionToken({
      userId: "usr-shared",
      personId: "per-shared",
      email: "operator@vmnl.ng",
      roles: ["Operator"],
    }).accessToken;

    expect(isTokenRevoked(token)).toBe(false);
    expect(verifySessionToken(token).email).toBe("operator@vmnl.ng");

    // Revoke token
    revokeToken(token);

    // Verify token is revoked and verification fails
    expect(isTokenRevoked(token)).toBe(true);
    expect(() => verifySessionToken(token)).toThrow(/token has been revoked/);

    // Reset back to default in-memory store
    setTokenRevocationStore(new InMemoryRevocationStore());
  });
});
