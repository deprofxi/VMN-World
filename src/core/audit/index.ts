import crypto from "crypto";

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
  status: "delivered" | "queued" | "failed";
  dispatchedAt: Date;
}

// In-memory audit buffer / persistence abstraction
const auditLogStore: AuditLogEntry[] = [];

/**
 * Records an immutable audit log entry for sensitive operational actions
 */
export function recordAuditLog(entry: AuditLogEntry): AuditLogEntry {
  const finalizedEntry: AuditLogEntry = {
    id: entry.id || crypto.randomUUID(),
    userId: entry.userId || null,
    action: entry.action,
    resource: entry.resource,
    resourceId: entry.resourceId || null,
    tenantId: entry.tenantId || null,
    ipAddress: entry.ipAddress || null,
    userAgent: entry.userAgent || null,
    changes: entry.changes ? JSON.parse(JSON.stringify(entry.changes)) : null,
    timestamp: entry.timestamp || new Date(),
  };

  auditLogStore.push(finalizedEntry);
  return finalizedEntry;
}

/**
 * Retrieves audit logs for a given resource or user
 */
export function getAuditLogs(filter?: { resource?: string; resourceId?: string; userId?: string }): AuditLogEntry[] {
  return auditLogStore.filter((log) => {
    if (filter?.resource && log.resource !== filter.resource) return false;
    if (filter?.resourceId && log.resourceId !== filter.resourceId) return false;
    if (filter?.userId && log.userId !== filter.userId) return false;
    return true;
  });
}

/**
 * Dispatches a multi-channel notification to a user or partner
 */
export async function dispatchNotification(payload: NotificationPayload): Promise<NotificationResult> {
  if (!payload.recipientId || !payload.title || !payload.body) {
    throw new Error("[VMNL-NOTIFY-ERROR] Invalid notification payload: recipientId, title, and body are required");
  }

  const messageId = `msg-${crypto.randomUUID()}`;

  // In production, delegates to Termii/Twilio for SMS or SendGrid/SES for Email.
  return {
    messageId,
    recipientId: payload.recipientId,
    channel: payload.channel,
    status: "queued",
    dispatchedAt: new Date(),
  };
}
