/**
 * TSK-61/TSK-62 — create-if-missing + `prisma migrate deploy` for a target URL.
 *
 * Shared by `tests/global-setup.ts` (the suite's dedicated `<db>_test`
 * database) and `tests/unit/performance-budget-seeded-data.test.ts` (its own
 * `<testdb>_perfseed` database), so provisioning behaves identically in both
 * places: create only if absent, migrate to the current schema, fail hard on a
 * migration error, and report "unreachable" when no server answers so the
 * caller can fall back to the suite's documented no-database mode.
 *
 * Never touches any database other than `targetUrl`'s — in particular the
 * development database is only ever read (its name is never derived here).
 */

import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

import { databaseNameOf, maintenanceDatabaseUrl, redactDatabaseUrl } from "./test-database-url.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export type ProvisionOutcome =
  | {
      state: "provisioned";
      dbName: string;
      created: boolean;
      /** Prisma's one-line verdict: whether migrations applied or the schema was current. */
      migrateSummary: string;
    }
  | { state: "unreachable"; reason: string };

/** Connect to a maintenance database, falling back to template1. */
async function connectMaintenance(targetUrl: string): Promise<Client> {
  const candidates = [
    maintenanceDatabaseUrl(targetUrl),
    maintenanceDatabaseUrl(targetUrl).replace(/\/postgres$/, "/template1"),
  ];
  let lastError: unknown;
  for (const connectionString of candidates) {
    const client = new Client({ connectionString, connectionTimeoutMillis: 3000 });
    try {
      await client.connect();
      return client;
    } catch (err) {
      lastError = err;
      await client.end().catch(() => undefined);
    }
  }
  throw lastError;
}

/**
 * Provision `targetUrl`: create the database if missing, then
 * `prisma migrate deploy` against it.
 *
 * Throws on any database/CLI failure (a half-provisioned schema must fail the
 * run, not degrade it). Returns `{ state: "unreachable" }` only when no
 * Postgres server answers at all.
 */
export async function provisionDatabase(targetUrl: string): Promise<ProvisionOutcome> {
  const dbName = databaseNameOf(targetUrl);

  let admin: Client;
  try {
    admin = await connectMaintenance(targetUrl);
  } catch (err) {
    return {
      state: "unreachable",
      reason: err instanceof Error ? err.message : String(err),
    };
  }

  let created = false;
  try {
    const existing = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if ((existing.rowCount ?? 0) === 0) {
      // dbName is validated against SAFE_DATABASE_NAME by deriveTestDatabaseUrl.
      await admin.query(`CREATE DATABASE "${dbName}"`);
      created = true;
    }
  } finally {
    await admin.end().catch(() => undefined);
  }

  const require = createRequire(import.meta.url);
  const prismaCli = require.resolve("prisma/build/index.js"); // resolved from node_modules, not a repo path — citation:absent
  let stdout: string;
  try {
    stdout = execFileSync(process.execPath, [prismaCli, "migrate", "deploy"], {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, DATABASE_URL: targetUrl },
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    throw new Error(
      `[provision] prisma migrate deploy failed for "${dbName}" (${redactDatabaseUrl(targetUrl)}):\n` +
        `${e.stdout ?? ""}${e.stderr ?? e.message ?? ""}`,
      { cause: err },
    );
  }

  // Prisma prints "No pending migrations to apply." when the schema is current.
  const migrateSummary = stdout.includes("No pending migrations")
    ? "schema already current"
    : "pending migrations applied";

  return { state: "provisioned", dbName, created, migrateSummary };
}
