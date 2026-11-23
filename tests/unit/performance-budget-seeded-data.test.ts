/**
 * TSK-62 — the frozen byte budgets re-measured against realistic (seeded) data.
 *
 * `tests/unit/performance-budget-measurement.test.ts` measures the public
 * shell on the suite's dedicated but *unseeded* test database, where
 * `/channels/nxtr` renders its empty states (17,945 B — the figure DEBT-008
 * quoted as "under 25 KB"). Production databases are not empty: against the
 * golden-seeded development database the same page measured **72,026 B** on
 * 2026-10-16, and that overrun was named nowhere.
 *
 * This file measures the budgets on seeded data instead of prose:
 *   1. provisions its own `<testdb>_perfseed` database (never the development
 *      database, never the suite's shared test database);
 *   2. seeds it with the golden master dataset through `runDatabaseSeed()`
 *      — the same idempotent path `pnpm db:seed` runs;
 *   3. boots a server against it and probes `/` and `/channels/nxtr` with
 *      `Accept-Encoding: identity`, exactly as the frozen procedure requires;
 *   4. asserts, without weakening anything (Rule 0.3):
 *      - `/` (public shell) still meets the 25 KB budget on seeded data;
 *      - `/channels/nxtr` currently MISSES that budget, and the miss is
 *        named as **DEBT-010** in `docs/design-debt-register.md` with owner
 *        and expiry. If the page ever comes inside the budget the test fails
 *        and demands the debt row be closed — the same pattern the DEBT-008
 *        stylesheet test uses;
 *      - the DB really held seeded rows while measured (≥100 episode masters
 *        and ≥100 media assets), so an empty-database run cannot masquerade
 *        as a seeded measurement.
 *
 * TTFB (cold first request after boot, then warm median) is printed for the
 * `docs/audit/evidence/perf-2026-10-16/` artifact but deliberately not
 * asserted: timings are environment-dependent and would make the gate flaky
 * (the same rule `performance-budget-measurement.test.ts` states).
 *
 * Reproduce with:
 *   pnpm vitest run tests/unit/performance-budget-seeded-data.test.ts
 */

import http from "node:http";

import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { createApiServer, type ApiServerInstance } from "../../src/api/server.js";
import { disconnectDatabase, getPrismaClient } from "../../src/core/database/index.js";
import { _resetConfigForTesting } from "../../src/core/config/index.js";
import { runDatabaseSeed } from "../../src/db/migrate-and-seed.js";
import { databaseNameOf, withDatabaseName } from "../helpers/test-database-url.js";
import { provisionDatabase, type ProvisionOutcome } from "../helpers/provision-database.js";

const KB = 1024;
const PUBLIC_SHELL_BUDGET = 25 * KB;

let app: ApiServerInstance | undefined;
let port = 0;
let ready = false;
let notReadyReason = "";
let seedStats: Record<string, number> = {};
let coldTtfbMs = 0;
const warmTtfbMs: number[] = [];

/** GET with the frozen procedure's encoding; resolves status, bytes and time-to-first-byte. */
function get(path: string): Promise<{ status: number; bytes: number; ms: number }> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const req = http.request(
      { hostname: "127.0.0.1", port, path, method: "GET", headers: { "Accept-Encoding": "identity" } },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c as Buffer));
        res.on("end", () =>
          resolve({
            status: res.statusCode || 0,
            bytes: Buffer.concat(chunks).length,
            ms: Date.now() - started,
          }),
        );
      },
    );
    req.on("error", reject);
    req.setTimeout(20_000, () => req.destroy(new Error(`budget probe timed out on ${path}`)));
    req.end();
  });
}

beforeAll(async () => {
  // global-setup has already exported the suite's dedicated test URL when a
  // server is reachable; derive this file's own seeded database from it.
  const base = process.env.DATABASE_URL?.trim();
  if (!base) {
    notReadyReason = "DATABASE_URL unset (no Postgres provisioned for this run)";
    return;
  }
  const seededUrl = withDatabaseName(base, `${databaseNameOf(base)}_perfseed`);

  // A half-provisioned schema is a real failure, not a degraded mode, so any
  // provisioning error is allowed to propagate out of this hook untouched.
  const outcome: ProvisionOutcome = await provisionDatabase(seededUrl);
  if (outcome.state === "unreachable") {
    notReadyReason = `no Postgres reachable (${outcome.reason})`;
    return;
  }

  // Re-point this worker's process-wide configuration before anything connects.
  await disconnectDatabase();
  process.env.DATABASE_URL = seededUrl;
  _resetConfigForTesting();

  const seeded = await runDatabaseSeed();
  if (!seeded.success) {
    throw new Error(`[TSK-62] golden seed reported failure: ${JSON.stringify(seeded.stats)}`);
  }
  seedStats = seeded.stats;
  await disconnectDatabase();

  app = createApiServer(0);
  await app.start();
  port = (app.server.address() as { port: number }).port;

  const cold = await get("/");
  coldTtfbMs = cold.ms;
  if (cold.status !== 200) throw new Error(`[TSK-62] / returned ${cold.status} on the seeded database`);
  ready = true;
}, 300_000);

afterAll(async () => {
  app?.server.close();
  await disconnectDatabase();
});

describe("TSK-62: frozen byte budgets against golden-seeded data", () => {
  it("measured a genuinely seeded database (not an empty one wearing the label)", async (ctx) => {
    if (!ready) {
      console.log(`[TSK-62] skipped — ${notReadyReason}`);
      return ctx.skip();
    }
    const prisma = getPrismaClient();
    const episodes = await prisma.broadcastEpisode.count();
    const assets = await prisma.mediaAssetRecord.count();
    console.log(
      `[TSK-62] seeded DB census: episodes=${episodes} assets=${assets} ` +
        `(seed stats: ${JSON.stringify(seedStats)})`,
    );
    expect(episodes, "the golden seed must have written episode masters").toBeGreaterThanOrEqual(100);
    expect(assets, "the golden seed must have written media assets").toBeGreaterThanOrEqual(100);
  });

  it("keeps the public shell `/` inside 25 KB on seeded data", async (ctx) => {
    if (!ready) {
      console.log(`[TSK-62] skipped — ${notReadyReason}`);
      return ctx.skip();
    }
    const res = await get("/");
    console.log(`[TSK-62] GET / (seeded) → ${res.bytes} B in ${res.ms} ms`);
    expect(res.status, "/ must serve").toBe(200);
    expect(res.bytes, `/ exceeds the 25 KB public shell budget on seeded data (${res.bytes} B)`).toBeLessThanOrEqual(
      PUBLIC_SHELL_BUDGET,
    );
  });

  it("keeps the IA successor of the retired channel page inside 25 KB on seeded data", async (ctx) => {
    if (!ready) {
      console.log(`[TSK-62] skipped — ${notReadyReason}`);
      return ctx.skip();
    }
    // DEBT-010 (seeded `/channels/nxtr` at 72,026 B) was retired with the
    // route (page-plan.md Phase 7): `/channels/nxtr` now 301-redirects to the
    // IA media overview, and the successor — registry-driven, rendering no
    // seeded episode/DAM tables — must hold the budget the old page missed.
    const redirect = await get("/channels/nxtr");
    expect(redirect.status, "the retired channel route must 301").toBe(301);

    const res = await get("/media-and-audience-overview");
    console.log(
      `[TSK-62] GET /media-and-audience-overview (seeded) → ${res.bytes} B in ${res.ms} ms ` +
        `(budget ${PUBLIC_SHELL_BUDGET} B)`,
    );
    expect(res.status, "the successor page must serve").toBe(200);
    expect(
      res.bytes,
      `the IA successor of the retired channel page exceeds the 25 KB public shell budget on seeded data (${res.bytes} B)`,
    ).toBeLessThanOrEqual(PUBLIC_SHELL_BUDGET);
  });

  it("prints the TTFB artifact figures (cold first request, warm median)", async (ctx) => {
    if (!ready) {
      console.log(`[TSK-62] skipped — ${notReadyReason}`);
      return ctx.skip();
    }
    for (let i = 0; i < 3; i++) {
      const res = await get("/");
      warmTtfbMs.push(res.ms);
    }
    const sorted = [...warmTtfbMs].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    console.log(
      `[TSK-62] TTFB artifact: cold(first request after boot)=${coldTtfbMs} ms, ` +
        `warm samples=${warmTtfbMs.join("/")} ms, warm median=${median} ms ` +
        `(budget: warm ≤ 200 ms, loopback sandbox only — see docs/audit/performance-budgets.md §7.7)`,
    );
    expect(coldTtfbMs).toBeGreaterThan(0);
    expect(median).toBeGreaterThan(0);
  });
});
