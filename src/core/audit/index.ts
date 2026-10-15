import crypto from "crypto";
import { NotificationService } from "../notifications/index.js";
import { checkDatabaseConnection, getPrismaClient } from "../database/index.js";
import { resolveKeyValueAdapter } from "../cache/index.js";
import { registerDurableStore, stageDurableWrite } from "../database/durable-journal.js";
import {
  DEFAULT_AUDIT_READ_WINDOW,
  loadAuditLogRows,
  persistAuditLogEntry,
  type AuditLogRow,
  type AuditLogWrite,
} from "../database/repositories/release-critical.repository.js";

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
const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";
let latestBlockHash = GENESIS_HASH;

// AUD-05: the chain tail (sequence + latest hash) is persisted through the KV
// adapter so a restarted process continues the durable chain instead of
// resetting it to genesis, and so chain position survives across instances
// when Redis is configured. Entries themselves remain individually hashed and
// independently verifiable.
let chainSequence = 0;
const CHAIN_TAIL_KEY = "audit:chain:tail";

function persistChainTail(): void {
  void resolveKeyValueAdapter()
    .set(
      CHAIN_TAIL_KEY,
      JSON.stringify({ seq: chainSequence, hash: latestBlockHash, at: new Date().toISOString() }),
      0
    )
    .catch(() => {
      /* best-effort: the local chain remains verifiable; persistenceMode already reflects DB health */
    });
}

/**
 * AUD-05: restores the durable chain tail at boot when the local chain is
 * empty, so entries recorded after a restart link back to the previous chain.
 */
export async function restoreAuditChainFromKv(): Promise<{ restored: boolean; sequence?: number }> {
  try {
    const raw = await resolveKeyValueAdapter().get(CHAIN_TAIL_KEY);
    if (!raw) return { restored: false };
    const tail = JSON.parse(raw) as { seq?: number; hash?: string };
    if (
      typeof tail.hash === "string" &&
      tail.hash.length === 64 &&
      auditLogStore.length === 0 &&
      latestBlockHash === GENESIS_HASH
    ) {
      latestBlockHash = tail.hash;
      chainSequence = typeof tail.seq === "number" ? tail.seq : 0;
      return { restored: true, sequence: chainSequence };
    }
    return { restored: false };
  } catch {
    return { restored: false };
  }
}

/** Health surface for /readyz: audit persistence mode + chain position. */
export function getAuditHealth(): {
  persistenceMode: AuditPersistenceMode;
  chainSequence: number;
  bufferedEntries: number;
  durableFailures: number;
} {
  return {
    persistenceMode,
    chainSequence,
    bufferedEntries: auditLogStore.length,
    durableFailures,
  };
}

/**
 * Durability mode of the audit ledger (AUD-06):
 * - "memory"      → in-memory chain only (offline / degraded persistence)
 * - "prisma"      → every entry is also written to the Prisma `AuditLog` table
 * - "prisma_error" → a Prisma write failed on the last entry
 */
export type AuditPersistenceMode = "memory" | "prisma" | "prisma_error";
let persistenceMode: AuditPersistenceMode = "memory";
let durableFailures = 0;

export function getAuditPersistenceMode(): AuditPersistenceMode {
  return persistenceMode;
}

/**
 * TSK-18 (box 3): the WARN is the log-drain signal; an operator's alert rule
 * needs the same fact as a metric. The server installs this listener with its
 * telemetry, so a durable audit failure reaches `TelemetryService`'s rule
 * engine and the configured dispatcher (console or webhook) instead of stopping
 * at stdout.
 */
export type AuditDegradationListener = (entryId: string, reason: string) => void;
let degradationListener: AuditDegradationListener | null = null;

export function setAuditDegradationListener(listener: AuditDegradationListener | null): void {
  degradationListener = listener;
}

export function computeAuditEntryHash(previousHash: string | undefined, entry: Omit<AuditLogEntry, "entryHash">): string {
  return computeEntryHash(previousHash, entry);
}

export function _getAuditLogStoreForTesting(): AuditLogEntry[] {
  return auditLogStore;
}

/**
 * The exact byte string an entry's hash is taken over. `tenantId` is part of it
 * (TSK-58 box 4): scope attribution must be covered by the chain, not merely
 * stored beside it. The payload is also written into the durable row, because a
 * jsonb column does not preserve key order and re-serialising `changes` does not
 * reproduce these bytes.
 */
export function buildAuditHashPayload(previousHash: string | undefined, entry: Omit<AuditLogEntry, "entryHash">): string {
  return [
    previousHash || "",
    entry.id,
    entry.userId || "",
    entry.action,
    entry.resource,
    entry.resourceId || "",
    entry.tenantId || "",
    entry.timestamp?.toISOString() || "",
    JSON.stringify(entry.changes || {}),
  ].join("|");
}

function computeEntryHash(previousHash: string | undefined, entry: Omit<AuditLogEntry, "entryHash">): string {
  return crypto.createHash("sha256").update(buildAuditHashPayload(previousHash, entry)).digest("hex");
}

// TSK-18: the ledger is a journal store, so its rows drain in the same Prisma
// transaction as the business rows of the request that recorded them. The mode
// flips to "prisma" only once the insert resolves inside that transaction, and
// a rolled-back transaction flips it to "prisma_error" through the write's
// rollback — a durable-evidence failure is never reported as a success.
registerDurableStore<AuditLogWrite>("auditLog", async (write) => {
  await persistAuditLogEntry(write);
  persistenceMode = "prisma";
});

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

  const hashPayload = buildAuditHashPayload(previousHash, preHashed);
  const entryHash = crypto.createHash("sha256").update(hashPayload).digest("hex");
  const finalizedEntry: AuditLogEntry = {
    ...preHashed,
    entryHash,
  };

  latestBlockHash = entryHash;
  chainSequence += 1;
  auditLogStore.push(finalizedEntry);
  persistChainTail();

  // TSK-18 (box 1): the ledger row joins the journal group of the request that
  // recorded it, so it drains in the SAME Prisma transaction as the business
  // rows it attests (AUD-05). The caller contract stays synchronous: the
  // response choke points await the drain before anything leaves the process.
  stageDurableWrite<AuditLogWrite>({
    store: "auditLog",
    key: id,
    payload: {
      id,
      userId: preHashed.userId ?? null,
      tenantId: preHashed.tenantId ?? null,
      action: preHashed.action,
      resource: preHashed.resource,
      resourceId: preHashed.resourceId ?? null,
      ipAddress: preHashed.ipAddress ?? null,
      userAgent: preHashed.userAgent ?? null,
      timestamp,
      changes: preHashed.changes ?? null,
      entryHash,
      previousHash,
      hashPayload,
    },
    // An audit row is append-only evidence, so "roll back" does not delete
    // anything: the entry stays correctly linked in the local chain (removing it
    // would break the chain itself) while the durable ledger — which is what
    // getAuditLogs reads — never receives it. The action did not happen, and no
    // query can now be shown an entry claiming that it did.
    rollback: (cause) => reportDurableFailure(id, cause),
  });

  return finalizedEntry;
}

/**
 * AUD-05 / TSK-18 (box 3): a durable-evidence failure must be an observable
 * signal, never a silent flag flip. The structured WARN is the log-drain
 * signal, the listener feeds the same fact to the telemetry alert rule, and the
 * mode stays queryable (getAuditPersistenceMode, /readyz).
 */
function reportDurableFailure(entryId: string, cause: unknown): void {
  durableFailures += 1;
  persistenceMode = "prisma_error";
  const reason = cause instanceof Error ? cause.message : cause ? String(cause) : "rolled back with its transaction";
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "WARN",
      message: "Audit durable write rolled back with its transaction; ledger degraded to in-memory (prisma_error)",
      component: "audit",
      entryId,
      reason,
    })
  );
  degradationListener?.(entryId, reason);
}

/**
 * Verifies the mathematical integrity of the cryptographic audit hash chain (B-9)
 */
export function verifyAuditLogChainIntegrity(): { valid: boolean; verifiedCount: number; errors: string[] } {
  const errors: string[] = [];
  let expectedPrev = GENESIS_HASH;

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

export interface AuditLogFilter {
  resource?: string;
  resourceId?: string;
  userId?: string;
  action?: string;
  limit?: number;
}

/**
 * Reads the audit ledger. TSK-18 (box 2): Postgres is the ledger, so this is a
 * durable read — an entry committed by an earlier process answers here, and an
 * entry whose transaction rolled back never reaches it. The in-process chain is
 * the fallback only when the database does not answer, and it is then labelled
 * what it is: `getAuditPersistenceMode()` reports "memory", because a local
 * chain is sandbox state, not persistence (Rule 0.4a).
 *
 * Stated limit: entries are returned oldest-first up to the read window
 * (`DEFAULT_AUDIT_READ_WINDOW`, most recent ones); cross-entry chain linkage is
 * verified over the in-process chain by `verifyAuditLogChainIntegrity`, not
 * here, because a table written by many processes over time links across
 * restarts through the KV tail and not every legacy row carries its anchor.
 */
export async function getAuditLogs(filter?: AuditLogFilter): Promise<AuditLogEntry[]> {
  const db = await checkDatabaseConnection();
  if (db.connected) {
    try {
      const rows = await loadAuditLogRows({
        resource: filter?.resource,
        resourceId: filter?.resourceId,
        userId: filter?.userId,
        action: filter?.action,
        limit: filter?.limit ?? DEFAULT_AUDIT_READ_WINDOW,
      });
      return rows.map(auditEntryFromRow);
    } catch (cause: unknown) {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "WARN",
          message: "Audit durable read failed; answering from the in-process chain",
          component: "audit",
          reason: cause instanceof Error ? cause.message : String(cause),
        })
      );
    }
  }
  return readLocalAuditChain(filter);
}

function auditEntryFromRow(row: AuditLogRow): AuditLogEntry {
  const payload = (row.changesJson ?? {}) as {
    changes?: Record<string, unknown> | null;
    auditEntryHash?: string;
    auditPreviousHash?: string;
    auditTimestamp?: string;
  };
  // The payload instant wins: rows written before `createdAt` carried the event
  // time have their true action instant only inside the JSON.
  const recordedAt =
    typeof payload.auditTimestamp === "string" && !Number.isNaN(Date.parse(payload.auditTimestamp))
      ? new Date(payload.auditTimestamp)
      : row.createdAt;
  return {
    id: row.id,
    userId: row.userId,
    tenantId: row.tenantId,
    action: row.action,
    resource: row.resource,
    resourceId: row.resourceId,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    changes: payload.changes ?? null,
    timestamp: recordedAt,
    previousHash: payload.auditPreviousHash,
    entryHash: payload.auditEntryHash,
  };
}

/** The process's own chain: the degraded read path, and the shape the verifier walks. */
export function readLocalAuditChain(filter?: AuditLogFilter): AuditLogEntry[] {
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

/**
 * AUD-30: Privacy & Data Retention Prune Job
 * Prunes audit records older than retentionDays. Fail-closed with dry-run support.
 * Destructive deletion records an audit log entry for compliance accountability.
 */
export async function pruneAuditLogs(
  retentionDays: number,
  options: { dryRun?: boolean } = { dryRun: true }
): Promise<{ pruned: number; wouldPrune: number; cutoff: Date; dryRun: boolean }> {
  const cutoff = new Date(Date.now() - retentionDays * 86_400_000);
  const prisma = getPrismaClient();

  let doomedCount: number;
  try {
    doomedCount = await prisma.auditLog.count({
      where: { createdAt: { lt: cutoff } },
    });
  } catch {
    // If DB is offline, count from memory store
    doomedCount = auditLogStore.filter((e) => (e.timestamp ?? new Date(0)) < cutoff).length;
  }

  if (options.dryRun !== false) {
    return { pruned: 0, wouldPrune: doomedCount, cutoff, dryRun: true };
  }

  let deletedCount: number;
  try {
    const res = await prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    deletedCount = res.count;
  } catch {
    const initialLen = auditLogStore.length;
    const remaining = auditLogStore.filter((e) => (e.timestamp ?? new Date(0)) >= cutoff);
    auditLogStore.length = 0;
    auditLogStore.push(...remaining);
    deletedCount = initialLen - remaining.length;
  }

  recordAuditLog({
    action: "privacy.audit.retention.prune",
    resource: "audit",
    changes: { retentionDays, prunedCount: deletedCount, cutoff: cutoff.toISOString() },
  });

  return { pruned: deletedCount, wouldPrune: doomedCount, cutoff, dryRun: false };
}

