#!/usr/bin/env node
/**
 * TSK-22 step probe: isolates where the episode-master refresh spends or loses
 * its time. The full harness stalled once with two Prisma connections idle for
 * 14 minutes and no active query (host load was ~316 at the time), so this
 * probe runs the same calls one at a time, prints each duration, and fires a
 * watchdog that dumps `pg_stat_activity` if a step never returns.
 *
 * Usage: node probe-refresh.mjs --admin-url postgresql://root@localhost:5432/postgres --db vmnl_enterprise_perf [--watchdog 60]
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../../../..");
const DIST = path.join(REPO, "dist/src");

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};
const db = arg("db", "vmnl_enterprise_perf");
const adminUrl = arg("admin-url", "postgresql://root@localhost:5432/postgres");
const WATCHDOG_MS = Number(arg("watchdog", 60)) * 1000;

const url = new URL(adminUrl);
url.pathname = "/" + db;
const perfUrl = url.toString();
process.env.DATABASE_URL = perfUrl;

const log = (m) => process.stdout.write(`${new Date().toISOString()} ${m}\n`);

let watchdog = null;
function arm(step) {
  if (watchdog) clearTimeout(watchdog);
  watchdog = setTimeout(async () => {
    log(`WATCHDOG: "${step}" has not returned after ${WATCHDOG_MS}ms`);
    try {
      const c = new pg.Client({ connectionString: perfUrl });
      await c.connect();
      const rows = await c.query(
        `SELECT pid, state, wait_event_type, wait_event, now()-query_start AS age, left(query,110) AS q
         FROM pg_stat_activity WHERE datname = current_database() ORDER BY query_start NULLS LAST`
      );
      for (const r of rows.rows) log(`  activity ${JSON.stringify(r)}`);
      await c.end();
    } catch (err) {
      log(`  activity dump failed: ${err.message}`);
    }
    process.exit(2);
  }, WATCHDOG_MS);
  watchdog.unref?.();
}
const step = async (name, fn) => {
  arm(name);
  const t0 = process.hrtime.bigint();
  const out = await fn();
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  clearTimeout(watchdog);
  log(`${name}: ${ms.toFixed(1)}ms ${JSON.stringify(out ?? null)}`);
  return out;
};

async function main() {
  log(`DATABASE_URL -> ${perfUrl.replace(/:[^:@/]*@/, ":<redacted>@")}`);
  const { checkDatabaseConnection } = await import(path.join(DIST, "core/database/index.js"));
  await step("checkDatabaseConnection", async () => checkDatabaseConnection(true));

  const { ScheduleRepository } = await import(path.join(DIST, "core/database/repositories/schedule.repository.js"));
  const repo = new ScheduleRepository();
  const page = await step("listProgrammes(NXTR) page 1", async () => {
    const p = await repo.listProgrammes("NXTR");
    return { rows: p.rows.length, nextCursor: p.nextCursor ?? null, source: p.rows[0]?.source ?? null };
  });

  const codes = page ? (await step("re-read codes", async () => (await repo.listProgrammes("NXTR")).rows.map((r) => r.code))).slice(0, 12) : [];
  for (const code of codes) {
    await step(`listEpisodes(${code})`, async () => {
      const e = await repo.listEpisodes(code);
      return { rows: e.rows.length, nextCursor: e.nextCursor ?? null, source: e.rows[0]?.source ?? null };
    });
  }

  await step("refreshEpisodeMasterIndex", async () => {
    const m = await import(path.join(DIST, "modules/broadcast/episode-masters.js"));
    return m.refreshEpisodeMasterIndex();
  });

  log("probe finished");
}

main().catch((err) => {
  log(`probe failed: ${err?.stack || err}`);
  process.exit(1);
});
