/**
 * VMNL Enterprise Database Client & Connection Manager
 * Authority: VMNL-AZP-VMN-CCPP-001 §15 / VMNL-AZP-VMN-BRD-PRD-001 — R1.2A
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { getConfig } from "../config/index.js";

let prismaInstance: PrismaClient | null = null;
let poolInstance: Pool | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    const config = getConfig();
    poolInstance = new Pool({
      connectionString: config.DATABASE_URL,
      min: config.DATABASE_POOL_MIN,
      max: config.DATABASE_POOL_MAX,
      connectionTimeoutMillis: 3000,
    });
    const adapter = new PrismaPg(poolInstance);
    prismaInstance = new PrismaClient({
      adapter,
      log: config.LOG_LEVEL === "debug" ? ["query", "error", "warn"] : ["error"],
    });
  }
  return prismaInstance;
}

export async function checkDatabaseConnection(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now();
  try {
    const client = getPrismaClient();
    // Test database roundtrip with a lightweight query
    await client.$queryRawUnsafe("SELECT 1");
    return {
      connected: true,
      latencyMs: Date.now() - start,
    };
  } catch (err: any) {
    return {
      connected: false,
      error: err?.message || String(err),
      latencyMs: Date.now() - start,
    };
  }
}

export async function disconnectDatabase(): Promise<void> {
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
