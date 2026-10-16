/**
 * TSK-61 — provision the suite's dedicated database before any test runs.
 *
 * Why this exists: the suite used to inherit whatever state the ambient
 * `DATABASE_URL` pointed at. On a golden-seeded development database ten
 * suites failed on the seed's rows and `pnpm test` exited red — an
 * "environment fact" the register had to re-record three times (2026-10-08,
 * 2026-10-12, 2026-10-16). A gate that depends on which database was seeded
 * last is not a gate.
 *
 * What it does, in order:
 *   1. resolve the base URL exactly as `src/core/config/index.ts` would
 *      (shell env → `.env` file, parsed without mutating the environment);
 *   2. derive the isolated target (`<db>_test`, or `TEST_DATABASE_URL`);
 *   3. if no Postgres server answers, log that fact and leave the environment
 *      untouched — the suite's documented no-database mode is unchanged;
 *   4. create the database if missing and `prisma migrate deploy` it, so tests
 *      always meet a current schema (`tests/helpers/provision-database.ts`);
 *   5. export the target as `DATABASE_URL` so every forked worker, spawned
 *      helper and boot-time `getConfig()` resolves to the test database.
 *
 * Runs as a Vitest `globalSetup`, i.e. once per `pnpm test`,
 * `pnpm test:coverage` and focused `vitest run` — not only on `pretest`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as dotenv from "dotenv";

import {
  deriveTestDatabaseUrl,
  resolveBaseDatabaseUrl,
} from "./helpers/test-database-url.js";
import { provisionDatabase } from "./helpers/provision-database.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export default async function setup(): Promise<void> {
  // Parsed, never applied to process.env — see resolveBaseDatabaseUrl docs.
  let fileValues: Record<string, string> = {};
  try {
    fileValues = dotenv.parse(fs.readFileSync(path.join(repoRoot, ".env")));
  } catch {
    // No .env (fresh clone): env/fallback precedence still resolves.
  }

  const baseUrl = resolveBaseDatabaseUrl(process.env, fileValues);
  const testUrl = deriveTestDatabaseUrl(baseUrl, process.env.TEST_DATABASE_URL);

  const outcome = await provisionDatabase(testUrl);
  if (outcome.state === "unreachable") {
    console.log(
      `[TSK-61] No Postgres reachable (${outcome.reason}). Tests will run in their documented no-database mode; ` +
        `DATABASE_URL left untouched.`,
    );
    return;
  }

  if (outcome.created) console.log(`[TSK-61] created dedicated test database "${outcome.dbName}"`);
  console.log(
    `[TSK-61] prisma migrate deploy ok for "${outcome.dbName}" — ${outcome.migrateSummary}`,
  );

  process.env.DATABASE_URL = testUrl;
  console.log(`[TSK-61] tests will use dedicated database "${outcome.dbName}" (development database untouched)`);
}
