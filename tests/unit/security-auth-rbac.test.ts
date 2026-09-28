import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import { createApiServer, ApiServerInstance } from "../../src/api/server.js";
import { scanBufferForThreats, generatePresignedUploadUrl } from "../../src/core/storage/index.js";
import { signSessionToken, revokeToken, isTokenRevoked, checkRateLimit } from "../../src/core/auth/index.js";
import { canPerform } from "../../src/core/rbac/index.js";

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

  it("should authenticate users via POST /api/v1/auth/login and set session cookie", async () => {
    const res = await makeRequest(testPort, "/api/v1/auth/login", {
      method: "POST",
      body: {
        email: "finance.controller@vmnl.ng",
        password: "ValidEnterprisePassword123!",
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.roles).toContain("FinanceController");
  });

  it("should revoke tokens and prevent re-use via POST /api/v1/auth/revoke", async () => {
    // 1. Login
    const loginRes = await makeRequest(testPort, "/api/v1/auth/login", {
      method: "POST",
      body: {
        email: "admin@vmnl.ng",
        password: "AdminPassword123!",
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
});
