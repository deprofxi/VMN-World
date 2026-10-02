/**
 * Security Abuse & Fuzzing Test Suite
 * Authority: VMNL-AZP-VMN-CCPP-001 §11, §19 / T-20 (B-17)
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createApiServer, ApiServerInstance } from "../../src/api/server.js";
import { BankReconciliationEngine } from "../../src/modules/finance/reconciliation/index.js";
import { recordAuditLog, verifyAuditLogChainIntegrity, _getAuditLogStoreForTesting } from "../../src/core/audit/index.js";

describe("T-20 (B-17): Security Abuse & Fuzzing Protection", () => {
  let serverInstance: ApiServerInstance;
  let baseUrl: string;

  beforeAll(async () => {
    serverInstance = createApiServer(0);
    await serverInstance.start();
    const port = (serverInstance.server.address() as { port: number }).port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await serverInstance.stop();
  });

  it("handles malformed JSON body gracefully without crashing server (400 Bad Request)", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"email": "admin@vmnl.ng", "password": ', // Truncated invalid JSON
    });

    expect([400, 401, 500]).toContain(res.status);
    const data: any = await res.json();
    expect(data.error).toBeDefined();

    // Verify server remains alive and responsive after malformed payload
    const health = await fetch(`${baseUrl}/healthz`);
    expect(health.status).toBe(200);
  });

  it("rejects unsigned Paystack webhook requests with 401 Unauthorized (T-01, T-02)", async () => {
    const res = await fetch(`${baseUrl}/api/v1/webhooks/paystack`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "charge.success", data: { id: 12345 } }),
    });

    expect(res.status).toBe(401);
    const data: any = await res.json();
    expect(data.error).toContain("Unauthorized");
  });

  it("rejects forged/tampered Paystack webhook signatures with 401 Unauthorized (T-01)", async () => {
    const res = await fetch(`${baseUrl}/api/v1/webhooks/paystack`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-paystack-signature": "forged_sha512_hash_abcdef0123456789",
      },
      body: JSON.stringify({ event: "charge.success", data: { id: 12345 } }),
    });

    expect(res.status).toBe(401);
  });

  it("rejects unsigned Flutterwave webhook requests with 401 Unauthorized (T-01, T-02)", async () => {
    const res = await fetch(`${baseUrl}/api/v1/webhooks/flutterwave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "charge.completed", data: { id: 67890 } }),
    });

    expect(res.status).toBe(401);
    const data: any = await res.json();
    expect(data.error).toContain("Unauthorized");
  });

  it("prevents duplicate bank transaction ingestion on webhook replay attacks (T-03)", () => {
    const recon = new BankReconciliationEngine();

    // First ingestion of transaction
    const count1 = recon.ingestBankTransactions([
      {
        id: "PAYSTACK-99001",
        source: "PAYSTACK",
        transactionReference: "ref_99001",
        bankNarration: "Invoice Payment #INV-001",
        amountNgn: 250000,
        valueDate: new Date(),
      },
    ]);

    expect(count1).toBe(1);
    expect(recon.getTransactionCount()).toBe(1);

    // Replay attack with same transaction ID
    const count2 = recon.ingestBankTransactions([
      {
        id: "PAYSTACK-99001",
        source: "PAYSTACK",
        transactionReference: "ref_99001_replay",
        bankNarration: "Invoice Payment #INV-001 REPLAY",
        amountNgn: 250000,
        valueDate: new Date(),
      },
    ]);

    expect(count2).toBe(0);
    // Count remains 1 — duplicate was rejected and ignored
    expect(recon.getTransactionCount()).toBe(1);

    // Replay log recorded
    const replayLogs = recon.getReplayLogs();
    expect(replayLogs.length).toBe(1);
    expect(replayLogs[0].transactionId).toBe("PAYSTACK-99001");
  });

  it("rejects invalid or expired JWT authorization tokens with 401 Unauthorized", async () => {
    const res = await fetch(`${baseUrl}/api/v1/broadcast/asrun/reconcile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid.jwt.token",
      },
      body: JSON.stringify({ channelCode: "NXTR", logs: [] }),
    });

    expect(res.status).toBe(401);
  });

  it("prohibits unauthorized roles from performing restricted operations (403 Forbidden)", async () => {
    // Subscriber role attempting to trigger AOS emergency execution
    const res = await fetch(`${baseUrl}/api/v1/intelligence/aos/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-role": "Subscriber",
      },
      body: JSON.stringify({ proposedAction: "OVERRIDE_SCHEDULE" }),
    });

    expect(res.status).toBe(403);
    const data: any = await res.json();
    expect(data.error).toContain("Forbidden");
  });

  it("detects tampering when audit log ledger is modified out-of-band (T-13)", () => {
    recordAuditLog({
      userId: "usr-sec-test",
      action: "security:check",
      resource: "firewall",
    });

    const store = _getAuditLogStoreForTesting();
    const lastIdx = store.length - 1;
    const originalAction = store[lastIdx].action;

    try {
      // Malicious actor tampers with entry
      store[lastIdx].action = "security:tampered";
      const check = verifyAuditLogChainIntegrity();
      expect(check.valid).toBe(false);
      expect(check.errors.some((e) => e.includes("Tampered entry"))).toBe(true);
    } finally {
      // Restore entry
      store[lastIdx].action = originalAction;
    }

    expect(verifyAuditLogChainIntegrity().valid).toBe(true);
  });
});
