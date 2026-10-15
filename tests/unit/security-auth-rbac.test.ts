import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import crypto from "node:crypto";
import { createApiServer, ApiServerInstance } from "../../src/api/server.js";
import { scanBufferForThreats, generatePresignedUploadUrl } from "../../src/core/storage/index.js";
import { signSessionToken, revokeToken, isTokenRevoked, checkRateLimit } from "../../src/core/auth/index.js";
import { canPerform, assertSeedRolesConformToRbac } from "../../src/core/rbac/index.js";
import { BankReconciliationEngine } from "../../src/modules/finance/reconciliation/index.js";
import {
  encryptSensitiveField,
  decryptSensitiveField,
  maskSensitiveLast4,
  maskPhoneNumber,
} from "../../src/core/websecurity/index.js";
import {
  registerSession,
  revokeSessionById,
  useKeyValueAdapterForSessions,
  _resetSessionsForTesting,
} from "../../src/core/auth/sessions.js";
import { MemoryKeyValueAdapter } from "../../src/core/cache/index.js";

/**
 * TSK-19: the provider-event claim is a durable unique row, so a webhook event id
 * may be delivered exactly once *ever*, not once per run. These fixtures own a
 * fresh id per run — otherwise the second run of this suite would be measuring
 * the duplicate path while believing it measured the accepted path.
 */
const RUN_TOKEN = Date.now().toString(36);

function makeRequest(
  port: number,
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
): Promise<{ statusCode: number; body: any }> {
  return new Promise((resolve, reject) => {
    const payload = options.body ? JSON.stringify(options.body) : undefined;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
          ...options.headers,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let parsedBody;
          try {
            parsedBody = JSON.parse(data);
          } catch {
            parsedBody = data;
          }
          resolve({
            statusCode: res.statusCode || 500,
            body: parsedBody,
          });
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

describe("Security, RBAC Enforcement & Authentication Suite (B-6, B-7, B-8)", () => {
  let app: ApiServerInstance;
  const testPort = 4199;

  beforeAll(async () => {
    app = createApiServer(testPort);
    await app.start();
  });

  afterAll(async () => {
    await app.stop();
  });

  it("should hide internal exception details from 500 responses (route now guarded, so unauthenticated callers get 401 before any handler logic)", async () => {
    // AUD-01/AUD-04: /api/v1/storage/upload-url now requires authentication,
    // so an unauthenticated request with a disallowed MIME type is rejected at
    // the authorization boundary (401) before reaching MIME validation. A 500
    // would leak handler internals; 401 proves the guard runs first.
    const res = await makeRequest(testPort, "/api/v1/storage/upload-url", {
      method: "POST",
      body: { fileName: "rejected.bin", contentType: "application/x-internal-test" },
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe("AUTH_TOKEN_REQUIRED");
    expect(res.body.message).not.toContain("not permitted");
  });

  it("should return 500 with sanitized body for authenticated storage errors (fail-closed guard regression)", async () => {
    const devPass = process.env.DEV_SEED_PASSWORD || "vmnl-dev-seed-pass-2026#secure";
    const loginRes = await makeRequest(testPort, "/api/v1/auth/login", {
      method: "POST",
      body: { email: "admin@vmnl.ng", password: devPass },
    });
    const token = loginRes.body.accessToken;

    const res = await makeRequest(testPort, "/api/v1/storage/upload-url", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: { fileName: "rejected.bin", contentType: "application/x-internal-test" },
    });

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("An unexpected error occurred");
    expect(res.body.message).not.toContain("not permitted");
    expect(typeof res.body.traceId).toBe("string");
  });

  it("should authenticate users via POST /api/v1/auth/login and set session cookie", async () => {
    const devPass = process.env.DEV_SEED_PASSWORD || "vmnl-dev-seed-pass-2026#secure";
    const res = await makeRequest(testPort, "/api/v1/auth/login", {
      method: "POST",
      body: {
        email: "finance.controller@vmnl.ng",
        password: devPass,
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.roles).toContain("FinanceController");
  });

  it("should reject login with 401 on incorrect password or non-existent user (CR-1)", async () => {
    // 1. Wrong password
    const wrongPassRes = await makeRequest(testPort, "/api/v1/auth/login", {
      method: "POST",
      body: {
        email: "finance.controller@vmnl.ng",
        password: "IncorrectPassword999!",
      },
    });
    expect(wrongPassRes.statusCode).toBe(401);
    expect(wrongPassRes.body.code).toBe("INVALID_CREDENTIALS");

    // 2. Non-existent email
    const nonExistentRes = await makeRequest(testPort, "/api/v1/auth/login", {
      method: "POST",
      body: {
        email: "unknown.intruder@vmnl.ng",
        password: "WrongDevAuthKey2026!",
      },
    });
    expect(nonExistentRes.statusCode).toBe(401);
    expect(nonExistentRes.body.code).toBe("INVALID_CREDENTIALS");
  });

  it("should revoke tokens and prevent re-use via POST /api/v1/auth/revoke", async () => {
    const devPass = process.env.DEV_SEED_PASSWORD || "vmnl-dev-seed-pass-2026#secure";
    // 1. Login
    const loginRes = await makeRequest(testPort, "/api/v1/auth/login", {
      method: "POST",
      body: {
        email: "admin@vmnl.ng",
        password: devPass,
      },
    });
    const token = loginRes.body.accessToken;

    // 2. Revoke token
    const revokeRes = await makeRequest(testPort, "/api/v1/auth/revoke", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(revokeRes.statusCode).toBe(200);
    expect(revokeRes.body.success).toBe(true);

    // 3. Verify token is marked revoked
    expect(isTokenRevoked(token)).toBe(true);
    revokeToken("direct-manual-revoke-token");
    expect(isTokenRevoked("direct-manual-revoke-token")).toBe(true);

    // 4. Using revoked token with strict auth header should return 401
    const testRes = await makeRequest(testPort, "/api/v1/finance/payouts/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Require-Auth": "true",
      },
      body: { id: "bat-test-01", batchReference: "REV-TEST", makerUserId: "usr-01", items: [] },
    });
    expect(testRes.statusCode).toBe(401);
  });

  it("should enforce 401 Unauthorized on mutating routes when unauthenticated in strict mode", async () => {
    const res = await makeRequest(testPort, "/api/v1/finance/payouts/batch", {
      method: "POST",
      headers: {
        "X-Require-Auth": "true",
      },
      body: { id: "bat-test-401", batchReference: "FAIL", makerUserId: "usr-01", items: [] },
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe("AUTH_TOKEN_REQUIRED");
  });

  it("should enforce 403 Forbidden when authenticated user lacks required role/permission", async () => {
    // User with only "Operator" role attempting to create payouts batch (requires "create:finance")
    const operatorToken = signSessionToken({
      userId: "usr-op-01",
      personId: "per-op-01",
      email: "operator@vmnl.ng",
      roles: ["Auditor"], // Auditor can only read, cannot create finance batches
    }).accessToken;

    const res = await makeRequest(testPort, "/api/v1/finance/payouts/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${operatorToken}`,
        "X-Require-Auth": "true",
      },
      body: { id: "bat-test-403", batchReference: "FAIL-403", makerUserId: "usr-01", items: [] },
    });

    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe("INSUFFICIENT_PERMISSIONS");
  });

  it("should enforce rate limiting on frequent requests", () => {
    const rateKey = "test-rate-limit-client";
    const res1 = checkRateLimit(rateKey, 2, 60000);
    expect(res1.allowed).toBe(true);

    const res2 = checkRateLimit(rateKey, 2, 60000);
    expect(res2.allowed).toBe(true);

    const res3 = checkRateLimit(rateKey, 2, 60000);
    expect(res3.allowed).toBe(false);
  });

  it("should detect malware and EICAR test signature during virus scanning (B-8)", () => {
    const cleanBuffer = Buffer.from("clean video asset byte buffer payload for broadcast master");
    const cleanScan = scanBufferForThreats(cleanBuffer);
    expect(cleanScan.isClean).toBe(true);

    const eicarSignature = "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";
    const infectedBuffer = Buffer.from(`Malicious header ${eicarSignature} trailing bytes`);
    const threatScan = scanBufferForThreats(infectedBuffer);
    expect(threatScan.isClean).toBe(false);
    expect(threatScan.threatName).toBe("EICAR-Test-Signature.Found");
  });

  it("should generate S3/MinIO SigV4 presigned upload URL with HMAC signature (B-8)", () => {
    const presigned = generatePresignedUploadUrl({
      fileName: "broadcast_master_1080p.mp4",
      contentType: "video/mp4",
      fileSizeBytes: 1024 * 1024 * 500, // 500MB
    });

    expect(presigned.uploadUrl).toContain("X-Amz-Algorithm=AWS4-HMAC-SHA256");
    expect(presigned.uploadUrl).toContain("X-Amz-Signature=");
    expect(presigned.downloadUrl).toContain("broadcast_master_1080p.mp4");
  });

  it("should verify R1.2A §48 17 broadcast capability roles in RBAC matrix", () => {
    const schedulerUser = {
      userId: "usr-sched",
      personId: "per-sched",
      email: "sched@vmnl.ng",
      roles: ["ProgrammeScheduler"],
    };

    // ProgrammeScheduler can edit schedule
    expect(canPerform(schedulerUser, "update", "schedule")).toBe(true);
    // ProgrammeScheduler CANNOT clear rights
    expect(canPerform(schedulerUser, "approve", "rights")).toBe(false);

    const trafficOfficer = {
      userId: "usr-traffic",
      personId: "per-traffic",
      email: "traffic@vmnl.ng",
      roles: ["CommercialTrafficOfficer"],
    };

    // CommercialTrafficOfficer can place ads
    expect(canPerform(trafficOfficer, "create", "traffic")).toBe(true);
    // CommercialTrafficOfficer CANNOT change pricing or approve rights
    expect(canPerform(trafficOfficer, "approve", "rights")).toBe(false);
  });

  it("should enforce CI invariant: seed roles must conform to RBAC permissions matrix (T-04)", () => {
    // 1. Valid seed roles pass
    const validSeedRoles = [
      "SuperAdmin",
      "BroadcastDirector",
      "FinanceController",
      "CommercialTrafficOfficer",
      "ProgrammeScheduler",
      "RightsManager",
      "Operator",
      "Auditor",
      "MCRSupervisor",
      "TalentManager",
    ];
    expect(assertSeedRolesConformToRbac(validSeedRoles)).toBe(true);

    // 2. Invalid/unregistered role throws invariant error
    expect(() => assertSeedRolesConformToRbac(["NonExistentArbitraryRole"])).toThrowError(
      /is not defined in ROLE_PERMISSIONS matrix/
    );

    // 3. MCRSupervisor permissions verification
    const mcrUser = {
      userId: "usr-mcr-01",
      personId: "per-mcr-01",
      email: "mcr@vmnl.ng",
      roles: ["MCRSupervisor"],
    };
    expect(canPerform(mcrUser, "read", "playout")).toBe(true);
    expect(canPerform(mcrUser, "execute", "playout")).toBe(true);
    expect(canPerform(mcrUser, "read", "schedule")).toBe(true);
    expect(canPerform(mcrUser, "execute", "broadcast")).toBe(true);
    expect(canPerform(mcrUser, "approve", "finance")).toBe(false);
  });

  it("should unconditionally enforce HMAC signature verification on payment webhooks (T-01, T-02)", async () => {
    const origKey = process.env.PAYSTACK_SECRET_KEY;
    const origFlw = process.env.FLUTTERWAVE_SECRET_HASH;
    try {
      process.env.PAYSTACK_SECRET_KEY = "test_paystack_secret_key_configured_32";
      process.env.FLUTTERWAVE_SECRET_HASH = "test_flw_secret_hash_configured_32";

      // 1. Unsigned request -> 401 in test environment
      const unsignedRes = await makeRequest(testPort, "/api/v1/webhooks/paystack", {
        method: "POST",
        body: { event: "charge.success", data: { id: "tx-unsigned-1" } },
      });
      expect(unsignedRes.statusCode).toBe(401);
      expect(unsignedRes.body.message).toContain("signature");

      // 2. Tampered / invalid signature -> 401
      const tamperedRes = await makeRequest(testPort, "/api/v1/webhooks/paystack", {
        method: "POST",
        headers: { "x-paystack-signature": "invalid_hex_signature_deadbeef" },
        body: { event: "charge.success", data: { id: "tx-tampered-1" } },
      });
      expect(tamperedRes.statusCode).toBe(401);
      expect(tamperedRes.body.message).toContain("Invalid Paystack signature");

      // 3. Valid signature -> 200
      const validPayload = { event: "charge.success", data: { id: `psk-unit-test-${RUN_TOKEN}`, reference: "PSK-UNIT-REF-1", amount: 100000, currency: "NGN", status: "success" } };
      const rawPayload = JSON.stringify(validPayload);
      const validSig = crypto
        .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
        .update(rawPayload)
        .digest("hex");

      const validRes = await makeRequest(testPort, "/api/v1/webhooks/paystack", {
        method: "POST",
        headers: { "x-paystack-signature": validSig },
        body: validPayload,
      });
      expect(validRes.statusCode).toBe(200);
      expect(validRes.body.status).toBe("success");

      // 4. Flutterwave missing header -> 401
      const unsignedFlwRes = await makeRequest(testPort, "/api/v1/webhooks/flutterwave", {
        method: "POST",
        body: { event: "charge.completed", data: { id: "flw-unsigned-1" } },
      });
      expect(unsignedFlwRes.statusCode).toBe(401);
      expect(unsignedFlwRes.body.message).toContain("hash header");

      // 5. Flutterwave invalid hash -> 401
      const invalidFlwRes = await makeRequest(testPort, "/api/v1/webhooks/flutterwave", {
        method: "POST",
        headers: { "verif-hash": "wrong-hash" },
        body: { event: "charge.completed", data: { id: "flw-invalid-1" } },
      });
      expect(invalidFlwRes.statusCode).toBe(401);
      expect(invalidFlwRes.body.message).toContain("Invalid Flutterwave");

      // 6. Flutterwave valid hash -> 200
      const validFlwRes = await makeRequest(testPort, "/api/v1/webhooks/flutterwave", {
        method: "POST",
        headers: { "verif-hash": process.env.FLUTTERWAVE_SECRET_HASH },
        body: { event: "charge.completed", data: { id: `flw-unit-test-${RUN_TOKEN}`, tx_ref: "FLW-UNIT-REF-1", amount: 50000, currency: "NGN", status: "successful" } },
      });
      expect(validFlwRes.statusCode).toBe(200);
      expect(validFlwRes.body.status).toBe("success");
    } finally {
      process.env.PAYSTACK_SECRET_KEY = origKey;
      process.env.FLUTTERWAVE_SECRET_HASH = origFlw;
    }
  });

  it("should enforce webhook idempotency and reject duplicate transaction replays (T-03)", () => {
    const recon = new BankReconciliationEngine();
    const records = [
      {
        id: "PAYSTACK-12345",
        source: "PAYSTACK" as const,
        transactionReference: "PSK-REF-001",
        bankNarration: "Paystack: test@agency.ng - Successful",
        amountNgn: 50000,
        valueDate: new Date(),
      },
    ];

    // First ingestion: exactly 1 transaction ingested
    const count1 = recon.ingestBankTransactions(records);
    expect(count1).toBe(1);
    expect(recon.getTransactionCount()).toBe(1);

    // Duplicate ingestion replay: 0 newly ingested transactions
    const count2 = recon.ingestBankTransactions(records);
    expect(count2).toBe(0);
    expect(recon.getTransactionCount()).toBe(1);

    // Replay was logged with transactionId
    const replayLogs = recon.getReplayLogs();
    expect(replayLogs.length).toBe(1);
    expect(replayLogs[0].transactionId).toBe("PAYSTACK-12345");
    expect(replayLogs[0].reason).toContain("replay");
  });

  it("should encrypt, decrypt and mask sensitive identity fields with AES-256-GCM (AUD-30)", () => {
    const rawNationalId = "NIN-29384756102";
    const rawPhone = "+2348012345678";

    // Encryption & decryption roundtrip
    const encryptedNIN = encryptSensitiveField(rawNationalId);
    expect(encryptedNIN.ciphertext).toBeDefined();
    expect(encryptedNIN.iv).toHaveLength(24); // 12 bytes = 24 hex chars
    expect(encryptedNIN.authTag).toHaveLength(32); // 16 bytes = 32 hex chars

    const decryptedNIN = decryptSensitiveField(encryptedNIN);
    expect(decryptedNIN).toBe(rawNationalId);

    // Decryption fails with wrong key
    expect(() => decryptSensitiveField(encryptedNIN, "wrong-key-value-must-be-min-32-chars-long")).toThrow();

    // Masking helpers
    expect(maskSensitiveLast4(rawNationalId)).toBe("•••••••••••6102");
    expect(maskSensitiveLast4("1234")).toBe("••••");
    expect(maskSensitiveLast4(undefined)).toBe("••••");

    expect(maskPhoneNumber(rawPhone)).toBe("•••• ••• 5678");
    expect(maskPhoneNumber("")).toBe("••• ••• ••••");
  });

  it("synchronizes session registration and revocation to KeyValueAdapter (Phase 4 / Distributed Sessions)", async () => {
    _resetSessionsForTesting();
    const adapter = new MemoryKeyValueAdapter();
    useKeyValueAdapterForSessions(adapter);

    const session = registerSession({
      token: "test-jwt-token-for-adapter-sync",
      userId: "usr-sync-001",
      email: "operator@vmnl.ng",
      deviceLabel: "Chrome Mac",
      ipAddress: "10.0.0.1",
    });

    // Check adapter has the session key
    const rawStored = await adapter.get(`session:${session.tokenId}`);
    expect(rawStored).not.toBeNull();
    const parsed = JSON.parse(rawStored!);
    expect(parsed.userId).toBe("usr-sync-001");
    expect(parsed.email).toBe("operator@vmnl.ng");

    // Revoking session updates the adapter
    revokeSessionById("usr-sync-001", session.tokenId);
    const afterRevoke = await adapter.get(`session:${session.tokenId}`);
    expect(afterRevoke).toBeNull();
    const isRevoked = await adapter.get(`revoked:${session.tokenId}`);
    expect(isRevoked).toBe("1");

    _resetSessionsForTesting();
  });
});

