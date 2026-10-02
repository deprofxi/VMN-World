import { describe, it, expect } from "vitest";
import {
  recordAuditLog,
  getAuditLogs,
  dispatchNotification,
  verifyAuditLogChainIntegrity,
  computeAuditEntryHash,
  _getAuditLogStoreForTesting,
} from "../../src/core/audit/index.js";

describe("Enterprise Audit Logging & Notification Engine (TASK-P1-05)", () => {
  it("should record immutable audit log entries and allow filtered retrieval with cryptographic hash chaining (B-9)", () => {
    const entry = recordAuditLog({
      userId: "usr-admin-01",
      action: "schedule:lock",
      resource: "schedule",
      resourceId: "sch-2026-09-28",
      tenantId: "vmn-broadcast",
      changes: { isLocked: true, lockedBy: "BroadcastDirector" },
    });

    expect(entry.id).toBeDefined();
    expect(entry.action).toBe("schedule:lock");
    expect(entry.timestamp).toBeInstanceOf(Date);
    expect(entry.entryHash).toBeDefined();
    expect(entry.previousHash).toBeDefined();

    const logs = getAuditLogs({ resource: "schedule", resourceId: "sch-2026-09-28" });
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].action).toBe("schedule:lock");

    // Cryptographic tamper-evident chain verification (B-9)
    const chainCheck = verifyAuditLogChainIntegrity();
    expect(chainCheck.valid).toBe(true);
    expect(chainCheck.verifiedCount).toBeGreaterThan(0);
    expect(chainCheck.errors.length).toBe(0);
  });

  it("should detect unauthorized payload mutation in the audit chain (T-13, R3-4)", () => {
    const store = _getAuditLogStoreForTesting();
    expect(store.length).toBeGreaterThan(0);

    const originalEntry = store[0];
    const originalAction = originalEntry.action;

    try {
      // 1. Mutate recorded entry in place
      (originalEntry as any).action = "tampered:illicit:override";

      // 2. Integrity check must flag tampering
      const check = verifyAuditLogChainIntegrity();
      expect(check.valid).toBe(false);
      expect(check.errors.some((e) => e.includes("Tampered entry"))).toBe(true);
    } finally {
      // Revert mutation to preserve chain for subsequent tests
      originalEntry.action = originalAction;
    }

    // Verify chain is valid once reverted
    expect(verifyAuditLogChainIntegrity().valid).toBe(true);
  });

  it("should detect deleted entries causing chain link breaks (T-13, R3-4)", () => {
    // Record two subsequent entries
    const e1 = recordAuditLog({
      userId: "usr-test-1",
      action: "channel:switch",
      resource: "broadcast",
      resourceId: "chan-nxtr",
    });
    recordAuditLog({
      userId: "usr-test-2",
      action: "channel:mute",
      resource: "broadcast",
      resourceId: "chan-nxtr",
    });

    const store = _getAuditLogStoreForTesting();
    const e1Index = store.findIndex((e) => e.id === e1.id);
    expect(e1Index).toBeGreaterThan(-1);

    // Remove e1 from the chain to simulate record deletion
    const [removed] = store.splice(e1Index, 1);
    try {
      const check = verifyAuditLogChainIntegrity();
      expect(check.valid).toBe(false);
      expect(check.errors.some((e) => e.includes("Broken link"))).toBe(true);
    } finally {
      // Restore removed entry
      store.splice(e1Index, 0, removed);
    }

    expect(verifyAuditLogChainIntegrity().valid).toBe(true);
  });

  it("should correctly compute entry hashes independently (T-13)", () => {
    const store = _getAuditLogStoreForTesting();
    const entry = store[store.length - 1];
    const computed = computeAuditEntryHash(entry.previousHash, entry);
    expect(computed).toBe(entry.entryHash);
  });

  it("should distinguish sandbox vs real notification delivery (T-14, N-9)", async () => {
    // Without SMTP configured in test environment, provider should be SANDBOX with status "sandbox"
    const result = await dispatchNotification({
      recipientId: "director@vmnl.ng",
      channel: "email",
      title: "Schedule Locked",
      body: "The 24-hour playout schedule for Orisun has been locked.",
    });

    expect(result.messageId.startsWith("msg-")).toBe(true);
    expect(result.status).toBe("sandbox");
    expect(result.provider).toBe("SANDBOX");
    expect(result.channel).toBe("email");
  });

  it("should reject invalid notification payloads missing required fields", async () => {
    await expect(
      dispatchNotification({
        recipientId: "",
        channel: "sms",
        title: "Test",
        body: "",
      })
    ).rejects.toThrowError(/recipientId, title, and body are required/);
  });
});
