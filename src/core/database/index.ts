/**
 * VMNL Enterprise Database Client & Connection Manager
 * Authority: VMNL-AZP-VMN-CCPP-001 §15 / VMNL-AZP-VMN-BRD-PRD-001 — R1.2A
 */

import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { AsyncLocalStorage } from "node:async_hooks";
import { getConfig } from "../config/index.js";

let prismaInstance: PrismaClient | null = null;
let poolInstance: Pool | null = null;

// TSK-18: the durability journal runs a whole response batch — the business rows
// and the audit entries recorded for them — inside one Prisma transaction.
// Persisters are synchronous-domain adapters that each call `getPrismaClient()`
// themselves, so the transaction is installed for the duration of the flush in
// this async context: every client they obtain is the transactional one, and a
// persister that escaped to the outer client would silently write *outside* the
// transaction it believes it is part of.
const transactionScope = new AsyncLocalStorage<Prisma.TransactionClient>();

/** Run `fn` with `tx` as the client every `getPrismaClient()` call resolves to. */
export function withTransactionClient<T>(tx: Prisma.TransactionClient, fn: () => Promise<T>): Promise<T> {
  return transactionScope.run(tx, fn);
}

/** True while the current async context is inside a journal flush transaction. */
export function isInTransactionScope(): boolean {
  return transactionScope.getStore() !== undefined;
}

export function getPrismaClient(): PrismaClient {
  const scoped = transactionScope.getStore();
  if (scoped) return scoped as unknown as PrismaClient;
  if (!prismaInstance) {
    const config = getConfig();
    poolInstance = new Pool({
      connectionString: config.DATABASE_URL,
      min: config.DATABASE_POOL_MIN,
      max: config.DATABASE_POOL_MAX,
      connectionTimeoutMillis: 3000,
      // PR-18: bound query execution, not just connection acquisition. Without
      // these, a lock wait held the connection and the request indefinitely.
      statement_timeout: config.DATABASE_STATEMENT_TIMEOUT_MS,
      query_timeout: config.DATABASE_STATEMENT_TIMEOUT_MS,
    });
    const adapter = new PrismaPg(poolInstance);
    prismaInstance = new PrismaClient({
      adapter,
      log: config.LOG_LEVEL === "debug" ? ["query", "error", "warn"] : ["error"],
    });
  }
  return prismaInstance;
}

let cachedStatus: { connected: boolean; latencyMs?: number; error?: string; timestamp: number } | null = null;
const CACHE_TTL_MS = 10_000;

export async function checkDatabaseConnection(forceRefresh = false): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
  const now = Date.now();
  if (!forceRefresh && cachedStatus && now - cachedStatus.timestamp < CACHE_TTL_MS) {
    return {
      connected: cachedStatus.connected,
      latencyMs: cachedStatus.latencyMs,
      error: cachedStatus.error,
    };
  }

  const start = Date.now();
  try {
    const client = getPrismaClient();
    // Test database roundtrip with a lightweight query
    await client.$queryRawUnsafe("SELECT 1");
    cachedStatus = {
      connected: true,
      latencyMs: Date.now() - start,
      timestamp: now,
    };
    return cachedStatus;
  } catch (err: any) {
    cachedStatus = {
      connected: false,
      error: err?.message || String(err),
      latencyMs: Date.now() - start,
      timestamp: now,
    };
    return cachedStatus;
  }
}

export async function disconnectDatabase(): Promise<void> {
  cachedStatus = null;
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
  }
}

export { PrismaClient };
export * from "./repositories/index.js";
