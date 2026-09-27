import { describe, it, expect } from "vitest";
import {
  recordAuditLog,
  getAuditLogs,
  dispatchNotification,
} from "../../src/core/audit/index.js";

describe("Enterprise Audit Logging & Notification Engine (TASK-P1-05)", () => {
  it("should record immutable audit log entries and allow filtered retrieval", () => {
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

    const logs = getAuditLogs({ resource: "schedule", resourceId: "sch-2026-09-28" });
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].action).toBe("schedule:lock");
  });

  it("should dispatch multi-channel notifications successfully", async () => {
    const result = await dispatchNotification({
      recipientId: "usr-director-01",
      channel: "email",
      title: "Schedule Locked",
      body: "The 24-hour playout schedule for Orisun has been locked.",
    });

    expect(result.messageId.startsWith("msg-")).toBe(true);
    expect(result.status).toBe("queued");
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
