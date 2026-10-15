/**
 * TSK-17 — write-behind durability journal (report.md CA-12).
 *
 * The release-critical stores in `src/core/*` and `src/modules/*` are synchronous:
 * their domain functions are called from synchronous desk code and asserted by
 * synchronous tests, and rewriting all of them `async` would change behaviour the
 * register has already pinned. This journal is how they become durable anyway:
 *
 *   1. the domain function updates its in-process read index as before, and
 *      `stageDurableWrite()` records the same row for persistence;
 *   2. `flushDurableJournal()` — awaited by every HTTP response choke point
 *      (`sendJson`, `sendText`, `sendHtml`) and by the server's `stop()` —
 *      writes the staged rows of the current request inside ONE Prisma
 *      transaction (TSK-18: the business row and the audit entries that attest
 *      it land together, or neither does);
 *   3. a transaction the database rejects rolls back every optimistic index
 *      entry it carried and the request fails closed with HTTP 503
 *      (`REPOSITORY_UNAVAILABLE`), so a caller can never be told a write landed
 *      when it did not;
 *   4. at boot each store calls its own `refresh…Index()` and repopulates from
 *      the durable table, which is what makes the Map a projection rather than a
 *      second truth.
 *
 * Entries coalesce per `store:key`, so a burst of in-place mutations of one
 * record results in one row write of its final state.
 *
 * Mode contract, identical to the established repositories: a *reachable*
 * database that errors is a 503 in `fail_closed` (the production default) and a
 * warning in `memory_fallback`; an *absent* database is the sandbox, and staged
 * rows are counted as `sandboxDeferred` instead of pretending to be durable.
 */

import { AsyncLocalStorage } from "node:async_hooks";
import { checkDatabaseConnection, getPrismaClient, withTransactionClient } from "./index.js";
import { getRepositoryMode, RepositoryUnavailableError } from "./repository-mode.js";

export type DurablePersister<T> = (payload: T) => Promise<void>;

export interface StagedWrite<T = unknown> {
  /** Store key a domain module registered with `registerDurableStore()`. */
  store: string;
  /** Key inside the owning store's read index — used for the rollback. */
  key: string;
  payload: T;
  /**
   * Remove the optimistic in-process index entry when the durable write fails.
   * TSK-18: the journal now calls this for **every** write in the transaction
   * that aborted, not only the one that errored, because nothing in a rolled
   * back transaction landed. The cause is handed in so a store whose rollback
   * is also its degradation signal (the audit ledger) can report why.
   */
  rollback: (cause?: unknown) => void;
}

interface JournalStats {
  persisted: number;
  failed: number;
  sandboxDeferred: number;
}

const persisters = new Map<string, (payload: unknown) => Promise<void>>();
const staged = new Map<string, GroupedWrite>();
const stats: JournalStats = { persisted: 0, failed: 0, sandboxDeferred: 0 };

type GroupedWrite = StagedWrite & { group: string };

// TSK-18 (box 1): the unit of durability is the *request*, not the flush. Every
// row a request stages — its business writes and the audit entries that attest
// them — shares one group, and a group drains inside one Prisma transaction.
// Without this, a flush that happened to carry two in-flight requests' rows
// would either land one request's business row without its audit row or roll a
// healthy request back for a concurrent one's bad payload.
const groupScope = new AsyncLocalStorage<string>();
let groupSequence = 0;

/** Mint a journal group id (one per HTTP request). */
export function nextJournalGroup(): string {
  return `g${++groupSequence}`;
}

/** Run `fn` with `group` installed as the staging group for this async context. */
export function withJournalGroup<T>(group: string, fn: () => Promise<T>): Promise<T> {
  return groupScope.run(group, fn);
}

/** The group writes staged here belong to, or `undefined` outside a request. */
export function currentJournalGroup(): string | undefined {
  return groupScope.getStore();
}

/**
 * A boot-time backlog (server-side writes staged before any request existed) is
 * drained in its own transaction rather than being appended to some unrelated
 * request's, so a one-time seed failure cannot be blamed on that request.
 */
const UNGROUPED = "";

/**
 * Longest a journal transaction may run. The ungrouped partition can be large
 * exactly once — a fresh database's golden-DAM backfill stages a row per asset —
 * and Prisma's 5s interactive default would abort it.
 */
const JOURNAL_TX_TIMEOUT_MS = 120_000;

export function registerDurableStore<T>(store: string, persister: DurablePersister<T>): void {
  if (persisters.has(store)) throw new Error(`[VMNL-DURABILITY] store '${store}' is already registered`);
  // The journal is deliberately payload-opaque: each store's own typed persister
  // is the place that knows the record shape, and `stageDurableWrite<T>()` keeps
  // the pairing honest on the staging side.
  persisters.set(store, persister as unknown as (payload: unknown) => Promise<void>);
}

export function stageDurableWrite<T>(write: StagedWrite<T>): void {
  if (!persisters.has(write.store)) {
    throw new Error(`[VMNL-DURABILITY] no persister registered for store '${write.store}'`);
  }
  staged.set(`${write.store}:${write.key}`, {
    ...write,
    group: currentJournalGroup() ?? UNGROUPED,
  } as GroupedWrite);
}

export function pendingDurableWrites(): number {
  return staged.size;
}

export function durableJournalStats(): Readonly<JournalStats> {
  return { ...stats };
}

/**
 * Drains the journal. Each group's rows go into ONE Prisma transaction, so a
 * consequential business write and the audit entries recorded for it are
 * durable together (TSK-18 box 1). Throws `RepositoryUnavailableError`
 * (→ HTTP 503) when the database is reachable and a transaction is rejected
 * while the repository is operating fail-closed.
 */
export async function flushDurableJournal(): Promise<{ written: number }> {
  if (staged.size === 0) return { written: 0 };

  const db = await checkDatabaseConnection();
  const scope = currentJournalGroup() ?? UNGROUPED;
  // Outside a request everything drains; inside one, only this request's rows
  // and the ungrouped (server-side) backlog join its transactions. Another
  // in-flight request's rows stay staged: they answer through their own choke
  // point and their own transaction.
  const selected = [...staged.values()].filter(
    (write) => scope === UNGROUPED || write.group === scope || write.group === UNGROUPED
  );
  // Re-staged while this flush was queued: the newer copy belongs to a later drain.
  const batch = selected.filter((write) => staged.get(`${write.store}:${write.key}`) === write);
  for (const write of batch) staged.delete(`${write.store}:${write.key}`);
  if (batch.length === 0) return { written: 0 };

  if (!db.connected) {
    // Sandbox: nothing here is persistence (Rule 0.4a). The rows stay in the
    // read index and are reported as deferred, never as durable.
    stats.sandboxDeferred += batch.length;
    return { written: 0 };
  }

  const partitions = new Map<string, GroupedWrite[]>();
  for (const write of batch) {
    const list = partitions.get(write.group);
    if (list) list.push(write);
    else partitions.set(write.group, [write]);
  }

  const failures: string[] = [];
  let written = 0;
  for (const [group, writes] of partitions) {
    const ids = writes.map((write) => `${write.store}:${write.key}`);
    try {
      await getPrismaClient().$transaction(
        (tx) =>
          withTransactionClient(tx, async () => {
            for (const write of writes) {
              const persister = persisters.get(write.store);
              if (!persister) throw new Error(`no persister registered for store '${write.store}'`);
              await persister(write.payload);
            }
          }),
        { timeout: JOURNAL_TX_TIMEOUT_MS }
      );
      written += writes.length;
      stats.persisted += writes.length;
    } catch (err: unknown) {
      // All-or-nothing: the transaction aborted, so not one of these rows
      // landed, and not one of them may stay claimed by a read index either.
      for (const write of writes) {
        write.rollback(err);
        stats.failed += 1;
      }
      failures.push(`${group || "ungrouped"} [${ids.join(", ")}] (${err instanceof Error ? err.message : String(err)})`);
    }
  }

  if (failures.length) {
    if (getRepositoryMode() === "fail_closed") {
      throw new RepositoryUnavailableError(
        `flush of ${failures.length} staged transaction(s): ${failures.join("; ")}`,
        "durableJournal"
      );
    }
    console.warn(`[VMNL-REPO-WARN] durable journal flush degraded to memory only for: ${failures.join("; ")}`);
  }
  return { written };
}

export function _resetDurableJournalForTesting(): void {
  staged.clear();
  stats.persisted = 0;
  stats.failed = 0;
  stats.sandboxDeferred = 0;
}
