import { createHash, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  computeAuditEntryHash,
  dispatchNotification,
  getAuditHealth,
  getAuditLogs,
  getAuditPersistenceMode,
  recordAuditLog,
  setAuditDegradationListener,
  verifyAuditLogChainIntegrity,
  _getAuditLogStoreForTesting,
} from "../../src/core/audit/index.js";
import { checkDatabaseConnection, getPrismaClient } from "../../src/core/database/index.js";
import {
  durableJournalStats,
  flushDurableJournal,
  nextJournalGroup,
  pendingDurableWrites,
  registerDurableStore,
  stageDurableWrite,
  withJournalGroup,
} from "../../src/core/database/durable-journal.js";
import { RepositoryUnavailableError } from "../../src/core/database/repository-mode.js";
import {
  loadAuditLogRows,
  persistIdempotencyRecord,
} from "../../src/core/database/repositories/release-critical.repository.js";
import type { IdempotencyRecord } from "../../src/core/websecurity/index.js";

const connection = await checkDatabaseConnection(true);
const DURABLE = connection.connected;
if (!DURABLE) {
  // Rule 0.4a: with no reachable Postgres the durable-ledger claims below cannot
  // be measured at all, so they are reported as skipped, never as passed.
  console.warn(
    `[TSK-18] SKIP: no reachable Postgres (${connection.error}). The audit ledger's durable reads and ` +
      "transactional writes below are unmeasured in this run."
  );
}

describe("Enterprise Audit Logging & Notification Engine (TASK-P1-05)", () => {
  it("should record immutable audit log entries and allow filtered retrieval with cryptographic hash chaining (B-9)", async () => {
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

    // TSK-18 (box 2): the ledger read answers from Postgres, so the drain that
    // the response path performs in production is performed here explicitly.
    await flushDurableJournal();
    const logs = await getAuditLogs({ resource: "schedule", resourceId: "sch-2026-09-28" });
    expect(logs.length).toBeGreaterThan(0);
    const recorded = logs.find((log) => log.id === entry.id);
    expect(recorded, "the entry must answer from the durable ledger").toBeDefined();
    expect(recorded?.action).toBe("schedule:lock");
    expect(recorded?.tenantId).toBe("vmn-broadcast");

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

/**
 * TSK-18 — the tamper-evident ledger is durable, and it is durable *together
 * with* the write it attests.
 *
 * The defect this closes: `recordAuditLog` kept the entry in a process-local
 * chain while the business row went to Postgres in a separate transaction, and
 * `getAuditLogs` read only the chain. So a crash between the two left the ledger
 * claiming an action the database had never committed (or silently lost the
 * evidence of one it had), and an entry written by an earlier process was
 * invisible to a query. The ledger row now joins the journal group of the request
 * that recorded it and drains inside that group's single Prisma transaction.
 *
 * Three claims, asserted separately:
 *  1. a drained entry reads back from the table — proven by emptying the local
 *     chain first, so a pass cannot come from the writing process's own memory;
 *  2. crash-between-writes: two business rows that were successfully inserted
 *     and the ledger row that attests them all vanish together, the caller gets
 *     503, and no query can be shown the entry for an action that did not happen;
 *  3. the degradation is a signal — `prisma_error`, a counted failure, and the
 *     listener that feeds the alert rule (box 3).
 */
describe.skipIf(!DURABLE)("TSK-18: the audit ledger is durable and lands with its transaction", () => {
  const LEDGER = `tsk18-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
  const BUSINESS_STORE = "tsk18-business-write";
  const REJECT_STORE = "tsk18-write-rejected-last";
  /** Id namespace per run, so rows never collide with a previous run's. */
  const optimisticIndex = new Map<string, string>();

  beforeAll(() => {
    // A real durable write, so "absent after the abort" means rolled back rather
    // than never attempted. Registered under test-owned store names, so nothing
    // here touches a production registration.
    registerDurableStore<IdempotencyRecord>(BUSINESS_STORE, persistIdempotencyRecord);
    registerDurableStore<{ id: string }>(REJECT_STORE, async (payload) => {
      throw new Error(`[TSK-18 TEST] durable write rejected for ${payload.id}`);
    });
  });

  afterAll(() => {
    setAuditDegradationListener(null);
  });

  async function businessRow(key: string): Promise<unknown> {
    return getPrismaClient().idempotencyRecord.findUnique({ where: { id: key } });
  }

  function stageBusiness(key: string): void {
    optimisticIndex.set(key, "optimistic read-index entry that must not survive");
    stageDurableWrite<IdempotencyRecord>({
      store: BUSINESS_STORE,
      key,
      payload: { key, outcome: "OK", responseBody: { marker: key }, recordedAt: new Date() },
      rollback: () => optimisticIndex.delete(key),
    });
  }

  it("lands the business row and its ledger entry in one transaction, and reads the ledger from Postgres", async () => {
    const resourceId = `${LEDGER}-landed`;
    const businessKey = `${LEDGER}-business`;
    let entryId = "";

    await withJournalGroup(nextJournalGroup(), async () => {
      stageBusiness(businessKey);
      const entry = recordAuditLog({
        userId: "usr-desk-01",
        action: "tsk18:ledger:landed",
        resource: "tsk18_ledger",
        resourceId,
        tenantId: "vmn-broadcast",
        changes: { before: "LOCKED", after: "UNLOCKED", by: "usr-desk-01" },
      });
      entryId = entry.id!;
      await flushDurableJournal();
      // The group landed, so the optimistic projection is superseded by the row.
      optimisticIndex.delete(businessKey);
    });

    try {
      // Positive control: both rows of the group landed.
      expect(await businessRow(businessKey)).not.toBeNull();
      const rows = await loadAuditLogRows({ resource: "tsk18_ledger", resourceId });
      const row = rows.find((candidate) => candidate.id === entryId);
      expect(row, "the ledger row must be in Postgres").toBeDefined();

      // The stored payload is the exact byte string the chain hashed, so an
      // offline verifier can recompute a durable row from the table alone — and
      // the tenant scope is inside those bytes, not merely stored beside them.
      const payload = (row!.changesJson ?? {}) as { auditHashPayload?: string; auditEntryHash?: string };
      expect(createHash("sha256").update(payload.auditHashPayload!).digest("hex")).toBe(payload.auditEntryHash);
      expect(payload.auditHashPayload!.split("|")[1]).toBe(entryId);
      expect(payload.auditHashPayload!.split("|")[6]).toBe("vmn-broadcast");

      // And the public read path answers from the table: the writing process's
      // own chain entry is taken out of the picture while the read happens, so a
      // pass here is a durable read, not the Map returning what it wrote.
      const store = _getAuditLogStoreForTesting();
      const index = store.findIndex((candidate) => candidate.id === entryId);
      const [held] = store.splice(index, 1);
      try {
        const logs = await getAuditLogs({ resource: "tsk18_ledger", resourceId });
        expect(logs.map((log) => log.id)).toContain(entryId);
        const durable = logs.find((log) => log.id === entryId)!;
        expect(durable.action).toBe("tsk18:ledger:landed");
        expect(durable.userId).toBe("usr-desk-01");
        expect(durable.tenantId).toBe("vmn-broadcast");
        expect(durable.changes).toEqual({ before: "LOCKED", after: "UNLOCKED", by: "usr-desk-01" });
        expect(durable.previousHash).toBeDefined();
        // The ledger reports the instant of the action, not the instant of the
        // write — and that instant is the one that was hashed.
        expect(durable.timestamp).toBeInstanceOf(Date);
        expect(payload.auditHashPayload!.split("|")[7]).toBe(durable.timestamp!.toISOString());
      } finally {
        store.splice(index, 0, held);
      }
    } finally {
      await getPrismaClient().idempotencyRecord.deleteMany({ where: { id: businessKey } });
      await getPrismaClient().auditLog.deleteMany({ where: { id: entryId } });
    }
  });

  it("crash between writes: the ledger entry rolls back with the rows it attests, and the failure is signalled", async () => {
    const firstKey = `${LEDGER}-first`;
    const secondKey = `${LEDGER}-second`;
    const resourceId = `${LEDGER}-aborted`;
    const failuresBefore = durableJournalStats().failed;
    const degraded: Array<{ entryId: string; reason: string }> = [];
    setAuditDegradationListener((entryId, reason) => degraded.push({ entryId, reason }));

    let entryId = "";
    let thrown: unknown;
    await withJournalGroup(nextJournalGroup(), async () => {
      stageBusiness(firstKey);
      const entry = recordAuditLog({
        userId: "usr-crashed-actor",
        action: "tsk18:ledger:crashed",
        resource: "tsk18_ledger",
        resourceId,
        changes: { marker: LEDGER },
      });
      entryId = entry.id!;
      // A second business row that also lands inside the transaction, so the
      // abort is proved to reach writes the database had already accepted.
      stageBusiness(secondKey);
      stageDurableWrite<{ id: string }>({
        store: REJECT_STORE,
        key: `${LEDGER}-boom`,
        payload: { id: `${LEDGER}-boom` },
        rollback: () => {},
      });
      try {
        await flushDurableJournal();
      } catch (err) {
        thrown = err;
      }
    });

    // Fail closed: the caller is never told the write landed when it did not.
    expect(thrown).toBeInstanceOf(RepositoryUnavailableError);
    expect((thrown as RepositoryUnavailableError).code).toBe("REPOSITORY_UNAVAILABLE");
    expect((thrown as RepositoryUnavailableError).status).toBe(503);

    // All-or-nothing: both business rows were inserted inside the transaction
    // and neither survived its abort...
    expect(await businessRow(firstKey)).toBeNull();
    expect(await businessRow(secondKey)).toBeNull();
    // ...and neither did the audit entry that attests them, through either read.
    expect(await loadAuditLogRows({ resource: "tsk18_ledger", resourceId })).toHaveLength(0);
    expect(await getAuditLogs({ resource: "tsk18_ledger", resourceId })).toHaveLength(0);

    // Every optimistic index entry the transaction carried was rolled back.
    expect(optimisticIndex.has(firstKey)).toBe(false);
    expect(optimisticIndex.has(secondKey)).toBe(false);
    expect(pendingDurableWrites()).toBe(0);
    expect(durableJournalStats().failed).toBeGreaterThanOrEqual(failuresBefore + 3);

    // Box 3: degradation is an observable signal, not a silent flag flip.
    expect(getAuditPersistenceMode()).toBe("prisma_error");
    expect(getAuditHealth().durableFailures).toBeGreaterThan(0);
    expect(degraded.map((d) => d.entryId)).toContain(entryId);
    expect(degraded.length).toBe(1);

    // The entry is append-only evidence of an action that did not happen, so it
    // stays correctly linked in the local chain; the ledger that queries read —
    // Postgres — never received it (asserted above).
    expect(verifyAuditLogChainIntegrity().valid).toBe(true);
  });
});
