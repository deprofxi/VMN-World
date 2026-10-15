import { describe, it, expect, afterAll } from "vitest";
import {
  sealSensitiveField,
  assertSealedForStorage,
  openSealedField,
  isSealedFieldValue,
} from "../../src/core/websecurity/index.js";
import { _getAuditLogStoreForTesting } from "../../src/core/audit/index.js";
import { checkDatabaseConnection, getPrismaClient } from "../../src/core/database/index.js";
import {
  hashPassword,
  verifyPassword,
  signSessionToken,
  signMfaLoginChallenge,
  verifyMfaLoginChallenge,
  consumeMfaLoginChallenge,
  _resetMfaChallengesForTesting,
  sandboxSeedOptIn,
  verifySessionToken,
  SessionUser,
  setTokenRevocationStore,
  InMemoryRevocationStore,
  revokeToken,
  isTokenRevoked,
  registerUser,
  updateUserMfaEnrollment,
  findUserByEmail,
  useKeyValueAdapterForAuthStores,
} from "../../src/core/auth/index.js";
import { MemoryKeyValueAdapter, _resetCacheAdapterForTesting } from "../../src/core/cache/index.js";

describe("Core Authentication Service (TASK-P1-02)", () => {
  // AUD-06 regression: TOTP seeds must never persist in plaintext outside the
  // process boundary — the shared KV mirror stores an AES-256-GCM envelope.
  it("seals MFA secrets before they leave the process and round-trips them on read", async () => {
    const adapter = new MemoryKeyValueAdapter();
    useKeyValueAdapterForAuthStores(adapter);

    const email = "mfa-seal-regression@example.ng";
    const totpSeed = "JBSWY3DPEHPK3PXP"; // base32 RFC 4648 test vector
    const created = await registerUser({ email, password: "RegressionPassword2026!" });
    expect(created.email).toBe(email);

    await updateUserMfaEnrollment(email, totpSeed);

    // 1. The durable mirror holds ciphertext, not the seed.
    const rawRecord = (await adapter.get(`user:${email}`)) ?? "";
    expect(rawRecord).not.toContain(totpSeed);
    expect(rawRecord).toContain("enc:v1:");

    // 2. A cold reader hydrating from KV still gets a working secret.
    const hydrated = await findUserByEmail(email);
    expect(hydrated?.mfaSecret).toBe(totpSeed);
    expect(hydrated?.mfaEnabled).toBe(true);

    // 3. A record sealed under a different key degrades fail-closed: no usable
    //    secret is ever handed back from a corrupted/foreign-key envelope.
    await adapter.set(
      `user:foreign-key@example.ng`,
      JSON.stringify({ ...JSON.parse(rawRecord), email: "foreign-key@example.ng", mfaSecret: "enc:v1:deadbeef:cafe:beef" })
    );
    const corrupted = await findUserByEmail("foreign-key@example.ng");
    expect(corrupted?.mfaSecret).toBeNull();

    _resetCacheAdapterForTesting();
  });
  it("never enables sandbox account seeding in production or staging", () => {
    expect(sandboxSeedOptIn("production", "true")).toBe(false);
    expect(sandboxSeedOptIn("staging", "true")).toBe(false);
    expect(sandboxSeedOptIn("development", "true")).toBe(true);
    expect(sandboxSeedOptIn("development", undefined)).toBe(false);
    expect(sandboxSeedOptIn("test", undefined)).toBe(true);
  });

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

  it("scopes MFA login challenges to the MFA exchange and consumes them once", async () => {
    const user: SessionUser = {
      userId: "usr-mfa-challenge",
      personId: "per-mfa-challenge",
      email: "mfa@example.ng",
      roles: ["Operator"],
      tenantId: "vmnl-hq",
    };
    _resetMfaChallengesForTesting();
    const challenge = signMfaLoginChallenge(user);
    expect(verifyMfaLoginChallenge(challenge)).toMatchObject({ userId: user.userId, email: user.email, roles: user.roles });
    expect(await consumeMfaLoginChallenge(challenge)).toMatchObject({ userId: user.userId });
    expect(await consumeMfaLoginChallenge(challenge)).toBeNull();
    expect(() => verifySessionToken(challenge)).toThrow(/MFA login challenge cannot be used as a session/);
    _resetMfaChallengesForTesting();
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

/**
 * TSK-30 (`report.md` CA-18): `Person.nationalId` and `User.mfaSecret` were
 * documented as envelope-only, which is a convention, not a control. These
 * tests pin the two halves that are now enforced: the write boundary refuses a
 * value it cannot seal, and opening a sealed credential is itself a recorded
 * access.
 */
const dbConnection = await checkDatabaseConnection(true);
const WITH_DB = dbConnection.connected;
if (!WITH_DB) {
  console.warn(
    `[TSK-30] no reachable Postgres (${dbConnection.error}): the database half of the sealed-envelope ` +
      "constraint is NOT verified in this run."
  );
}

describe("TSK-30: sealed-envelope write boundary", () => {
  const SEED = "JBSWY3DPEHPK3PXP";

  it("recognises only the AES-256-GCM envelope and refuses to seal a sealed value twice", () => {
    const envelope = sealSensitiveField(SEED);
    expect(isSealedFieldValue(envelope)).toBe(true);
    expect(openSealedField(envelope)).toEqual({ outcome: "opened", plaintext: SEED });
    expect(() => sealSensitiveField(envelope)).toThrow(/VMNL-PII-02/);
    // The prefix test this replaces accepted a value whose iv/tag lengths were
    // unusable; the envelope contract does not, and it opens as malformed
    // rather than throwing at a call site that cannot recover.
    expect(isSealedFieldValue("enc:v1:deadbeef:cafe:beef")).toBe(false);
    expect(openSealedField("enc:v1:deadbeef:cafe:beef")).toEqual({ outcome: "malformed", plaintext: null });
  });

  it("rejects a plaintext sensitive value at the write boundary instead of persisting it", () => {
    expect(() => assertSealedForStorage("User.mfaSecret", SEED)).toThrow(/VMNL-PII-01/);
    expect(() => assertSealedForStorage("Person.nationalId", "12345678901")).toThrow(/VMNL-PII-01/);
    expect(() => assertSealedForStorage("User.mfaSecret", null)).not.toThrow();
    expect(() => assertSealedForStorage("User.mfaSecret", undefined)).not.toThrow();
    expect(() => assertSealedForStorage("User.mfaSecret", sealSensitiveField(SEED))).not.toThrow();
  });

  it("logs the decryption access itself, without logging the secret or the ciphertext", async () => {
    const adapter = new MemoryKeyValueAdapter();
    useKeyValueAdapterForAuthStores(adapter);

    const email = `secret-access-probe@example.ng`;
    const envelope = sealSensitiveField(SEED);
    // Written straight to the shared mirror so the reader must come in cold and
    // actually open the envelope — that open is the access under test.
    await adapter.set(
      `user:${email}`,
      JSON.stringify({
        userId: "usr-tsk30-probe",
        personId: "per-tsk30-probe",
        email,
        passwordHash: "$2a$10$notarealhashforthisprobe",
        roles: ["Operator"],
        status: "ACTIVE",
        tenantId: "vmnl-hq",
        mfaEnabled: true,
        mfaSecret: envelope,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );

    const before = _getAuditLogStoreForTesting().length;
    const hydrated = await findUserByEmail(email);
    expect(hydrated?.mfaSecret).toBe(SEED);

    const entries = _getAuditLogStoreForTesting().slice(before);
    const secretAccess = entries.filter((e) => e.resource === "User.mfaSecret");
    expect(secretAccess.map((e) => e.action)).toEqual(["auth.mfa_secret_decrypted"]);
    expect(secretAccess[0].resourceId).toBe(email);
    expect(secretAccess[0].changes).toMatchObject({ outcome: "opened", algorithm: "aes-256-gcm" });
    const serialized = JSON.stringify(secretAccess[0]);
    expect(serialized).not.toContain(SEED);
    expect(serialized).not.toContain(envelope.split(":")[2]); // no ciphertext slice

    _resetCacheAdapterForTesting();
  });

  it("logs a refused open and hands back no usable secret", async () => {
    const adapter = new MemoryKeyValueAdapter();
    useKeyValueAdapterForAuthStores(adapter);

    const email = "secret-access-refused@example.ng";
    await adapter.set(
      `user:${email}`,
      JSON.stringify({
        userId: "usr-tsk30-refused",
        personId: "per-tsk30-refused",
        email,
        passwordHash: "$2a$10$notarealhashforthisprobe",
        roles: ["Operator"],
        status: "ACTIVE",
        tenantId: "vmnl-hq",
        mfaEnabled: true,
        mfaSecret: "enc:v1:deadbeef:cafe:beef",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );

    const before = _getAuditLogStoreForTesting().length;
    const hydrated = await findUserByEmail(email);
    expect(hydrated?.mfaSecret).toBeNull();

    const refused = _getAuditLogStoreForTesting()
      .slice(before)
      .filter((e) => e.resource === "User.mfaSecret");
    expect(refused.map((e) => e.action)).toEqual(["auth.mfa_secret_decrypt_refused"]);
    expect(refused[0].changes).toMatchObject({ outcome: "malformed" });

    _resetCacheAdapterForTesting();
  });
});

describe.skipIf(!WITH_DB)(
  "TSK-30: the database refuses an unsealed value (migration 20261009200000)",
  () => {
    const RUN = `tsk30-${Date.now()}`;
    const cleanup: Array<() => Promise<unknown>> = [];

    afterAll(async () => {
      for (const drop of cleanup) await drop();
    });

    it("installs both CHECK constraints in the schema the suite runs against", async () => {
      const rows = await getPrismaClient().$queryRaw<
        { conname: string }[]
      >`select conname from pg_constraint where conname in
        ('Person_nationalId_sealed_envelope', 'User_mfaSecret_sealed_envelope')`;
      expect(rows.map((r) => r.conname).sort()).toEqual([
        "Person_nationalId_sealed_envelope",
        "User_mfaSecret_sealed_envelope",
      ]);
    });

    it("rejects a plaintext national ID and accepts the sealed envelope", async () => {
      const prisma = getPrismaClient();
      await expect(
        prisma.person.create({
          data: {
            email: `${RUN}-plaintext@tsk30.vmnl.ng`,
            firstName: "Unsealed",
            lastName: "Probe",
            nationalId: "12345678901",
          },
        })
      ).rejects.toThrow(/Person_nationalId_sealed_envelope|check|constraint/i);

      const sealed = await prisma.person.create({
        data: {
          email: `${RUN}-sealed@tsk30.vmnl.ng`,
          firstName: "Sealed",
          lastName: "Probe",
          nationalId: sealSensitiveField("12345678901"),
        },
      });
      cleanup.push(() => prisma.person.deleteMany({ where: { id: sealed.id } }));
      expect(isSealedFieldValue(sealed.nationalId)).toBe(true);
    });

    it("rejects a plaintext TOTP seed on the User row too", async () => {
      const prisma = getPrismaClient();
      const person = await prisma.person.create({
        data: { email: `${RUN}-user@tsk30.vmnl.ng`, firstName: "Mfa", lastName: "Probe" },
      });
      // deleteMany, not delete: the person row owns the user row through
      // `onDelete: Cascade`, so a later `delete` by id would find nothing.
      cleanup.push(() => prisma.user.deleteMany({ where: { personId: person.id } }));
      cleanup.push(() => prisma.person.deleteMany({ where: { id: person.id } }));

      await expect(
        prisma.user.create({
          data: {
            personId: person.id,
            email: `${RUN}-user@tsk30.vmnl.ng`,
            passwordHash: "$2a$10$notarealhashforthisprobe",
            mfaSecret: "JBSWY3DPEHPK3PXP",
          },
        })
      ).rejects.toThrow(/User_mfaSecret_sealed_envelope|check|constraint/i);

      const sealedUser = await prisma.user.create({
        data: {
          personId: person.id,
          email: `${RUN}-user@tsk30.vmnl.ng`,
          passwordHash: "$2a$10$notarealhashforthisprobe",
          mfaSecret: sealSensitiveField("JBSWY3DPEHPK3PXP"),
        },
      });
      cleanup.push(() => prisma.user.deleteMany({ where: { id: sealedUser.id } }));
      expect(isSealedFieldValue(sealedUser.mfaSecret)).toBe(true);
    });
  }
);
