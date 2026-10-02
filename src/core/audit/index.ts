import crypto from "crypto";
import { NotificationService } from "../notifications/index.js";
import { getPrismaClient } from "../database/index.js";
import type { Prisma } from "@prisma/client";

export interface AuditLogEntry {
  id?: string;
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  tenantId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  changes?: Record<string, unknown> | null;
  timestamp?: Date;
  previousHash?: string;
  entryHash?: string;
}

export interface NotificationPayload {
  recipientId: string;
  channel: "email" | "sms" | "push" | "in_app";
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationResult {
  messageId: string;
  recipientId: string;
  channel: string;
  status: "delivered" | "queued" | "failed" | "sandbox";
  provider?: "SMTP" | "SES" | "TERMII" | "SANDBOX" | "UNCONFIGURED";
  dispatchedAt: Date;
}

// In-memory tamper-evident audit ledger buffer with cryptographic hash chaining (B-9)
const auditLogStore: AuditLogEntry[] = [];
let latestBlockHash = "0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Durability mode of the audit ledger (AUD-06):
 * - "memory"      → in-memory chain only (offline / degraded persistence)
 * - "prisma"      → every entry is also written to the Prisma `AuditLog` table
 * - "prisma_error" → a Prisma write failed on the last entry
 */
export type AuditPersistenceMode = "memory" | "prisma" | "prisma_error";
let persistenceMode: AuditPersistenceMode = "memory";

export function getAuditPersistenceMode(): AuditPersistenceMode {
  return persistenceMode;
}

export function computeAuditEntryHash(previousHash: string | undefined, entry: Omit<AuditLogEntry, "entryHash">): string {
  return computeEntryHash(previousHash, entry);
}

export function _getAuditLogStoreForTesting(): AuditLogEntry[] {
  return auditLogStore;
}

function computeEntryHash(previousHash: string | undefined, entry: Omit<AuditLogEntry, "entryHash">): string {
  const payload = [
    previousHash || "",
    entry.id,
    entry.userId || "",
    entry.action,
    entry.resource,
    entry.resourceId || "",
    entry.timestamp?.toISOString() || "",
    JSON.stringify(entry.changes || {}),
  ].join("|");
  return crypto.createHash("sha256").update(payload).digest("hex");
}

/**
 * Records an immutable, tamper-evident audit log entry with SHA-256 hash chaining (B-9)
 */
export function recordAuditLog(entry: AuditLogEntry): AuditLogEntry {
  const id = entry.id || crypto.randomUUID();
  const timestamp = entry.timestamp || new Date();
  const previousHash = latestBlockHash;

  const preHashed: Omit<AuditLogEntry, "entryHash"> = {
    id,
    userId: entry.userId || null,
    action: entry.action,
    resource: entry.resource,
    resourceId: entry.resourceId || null,
    tenantId: entry.tenantId || null,
    ipAddress: entry.ipAddress || null,
    userAgent: entry.userAgent || null,
    changes: entry.changes ? JSON.parse(JSON.stringify(entry.changes)) : null,
    timestamp,
    previousHash,
  };

  const entryHash = computeEntryHash(previousHash, preHashed);
  const finalizedEntry: AuditLogEntry = {
    ...preHashed,
    entryHash,
  };

  latestBlockHash = entryHash;
  auditLogStore.push(finalizedEntry);

  // Durable persistence: append to the Prisma AuditLog table when reachable
  // (AUD-06). The sync caller contract is preserved by issuing the write as a
  // fire-and-forget task; the full hash-chain metadata is folded into
  // changesJson so durable records remain independently tamper-evident.
  // A failed write degrades the reported mode rather than throwing so audit
  // logging can never break a business request path.
  const durablePayload: Record<string, unknown> = {
    changes: finalizedEntry.changes ?? null,
    auditEntryHash: entryHash,
    auditPreviousHash: previousHash,
    auditTimestamp: timestamp.toISOString(),
  };
  void getPrismaClient()
    .auditLog.create({
      data: {
        id: finalizedEntry.id!,
        userId: finalizedEntry.userId || null,
        action: finalizedEntry.action,
        resource: finalizedEntry.resource,
        resourceId: finalizedEntry.resourceId || null,
        ipAddress: finalizedEntry.ipAddress || null,
        userAgent: finalizedEntry.userAgent || null,
        changesJson: durablePayload as unknown as Prisma.InputJsonObject,
      },
    })
    .then(() => {
      persistenceMode = "prisma";
    })
    .catch(() => {
      persistenceMode = "prisma_error";
    });

  return finalizedEntry;
}

/**
 * Verifies the mathematical integrity of the cryptographic audit hash chain (B-9)
 */
export function verifyAuditLogChainIntegrity(): { valid: boolean; verifiedCount: number; errors: string[] } {
  const errors: string[] = [];
  let expectedPrev = "0000000000000000000000000000000000000000000000000000000000000000";

  for (let i = 0; i < auditLogStore.length; i++) {
    const entry = auditLogStore[i];
    if (entry.previousHash !== expectedPrev) {
      errors.push(`Broken link at index ${i}: expected prev hash ${expectedPrev}, found ${entry.previousHash}`);
    }
    const computed = computeEntryHash(expectedPrev, entry);
    if (computed !== entry.entryHash) {
      errors.push(`Tampered entry at index ${i} (${entry.id}): computed hash mismatch`);
    }
    expectedPrev = entry.entryHash || "";
  }

  return {
    valid: errors.length === 0,
    verifiedCount: auditLogStore.length,
    errors,
  };
}

/**
 * Retrieves audit logs for a given resource, action, user, or limit
 */
export function getAuditLogs(filter?: { resource?: string; resourceId?: string; userId?: string; action?: string; limit?: number }): AuditLogEntry[] {
  let logs = auditLogStore.filter((log) => {
    if (filter?.resource && log.resource !== filter.resource) return false;
    if (filter?.resourceId && log.resourceId !== filter.resourceId) return false;
    if (filter?.userId && log.userId !== filter.userId) return false;
    if (filter?.action && log.action !== filter.action) return false;
    return true;
  });
  if (filter?.limit && filter.limit > 0) {
    logs = logs.slice(-filter.limit);
  }
  return logs;
}

const notificationServiceSingleton = new NotificationService();

/**
 * Dispatches a multi-channel notification to a user or partner via real notification providers (B-9)
 */
export async function dispatchNotification(payload: NotificationPayload): Promise<NotificationResult> {
  if (!payload.recipientId || !payload.title || !payload.body) {
    throw new Error("[VMNL-NOTIFY-ERROR] Invalid notification payload: recipientId, title, and body are required");
  }

  const messageId = `msg-${crypto.randomUUID()}`;

  if (payload.channel === "email") {
    const res = await notificationServiceSingleton.sendEmail({
      to: payload.recipientId,
      subject: payload.title,
      htmlContent: `<p>${payload.body}</p>`,
    });
    const status = res.provider === "SANDBOX" ? "sandbox" : res.success ? "delivered" : "failed";
    return {
      messageId: res.messageId,
      recipientId: payload.recipientId,
      channel: "email",
      status,
      provider: res.provider,
      dispatchedAt: res.timestamp,
    };
  }

  if (payload.channel === "sms") {
    const res = await notificationServiceSingleton.sendSms({
      to: payload.recipientId,
      message: `${payload.title}: ${payload.body}`,
    });
    const status = res.provider === "SANDBOX" ? "sandbox" : res.success ? "delivered" : "failed";
    return {
      messageId: res.messageId,
      recipientId: payload.recipientId,
      channel: "sms",
      status,
      provider: res.provider,
      dispatchedAt: res.timestamp,
    };
  }

  return {
    messageId,
    recipientId: payload.recipientId,
    channel: payload.channel,
    status: "sandbox",
    provider: "SANDBOX",
    dispatchedAt: new Date(),
  };
}

