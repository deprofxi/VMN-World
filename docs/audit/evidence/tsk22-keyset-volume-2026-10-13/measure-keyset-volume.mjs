#!/usr/bin/env node
/**
 * TSK-22 keyset / N+1 volume harness (evidence instrument, not a test).
 *
 * AUD-15 asked for three things that could not be produced without a live
 * PostgreSQL: an EXPLAIN of the two keyset queries at representative volume, a
 * latency baseline, and a decision about batching the episode-master refresh.
 * This file produces the measurements; `docs/audit/evidence/…` archives the
 * output. Nothing here asserts a business rule, so nothing here belongs in the
 * Vitest suite — and the suite must not be running while it is, because it
 * would then be measuring a contended database (Rule 0.4a).
 *
 * Usage:
 *   node docs/audit/evidence/tsk22-keyset-volume-2026-10-13/measure-keyset-volume.mjs \
 *     --admin-url postgresql://root@localhost:5432/postgres \
 *     --db vmnl_enterprise_perf \
 *     --scale 100 \
 *     [--reps 200] [--no-refresh] [--episodes-per-programme 300] [--episode-shape contiguous]
 *
 * --scale multiplies the golden seed's own programme ratio (3 channels x 50
 * programmes, measured from `pnpm db:seed` output), so 1 == 150 programmes /
 * 600 episodes (the as-shipped dataset at --episodes-per-programme 4) and
 * 100 == 15,000 programmes / 60,000 episodes. The PRD fixes three linear
 * channels (BRD-PRD R1.2A "The three linear channels"), so catalogue growth
 * lands on programmes-per-channel, not on channel count.
 *
 * --episodes-per-programme overrides the seed's 4 for a single programme's
 * episode list, which is where a long-running soaps/daily-news catalogue grows.
 *
 * The dataset is SYNTHETIC. It is a load, not a claim about VMNL's production
 * catalogue, which no authority document states (see README §"What this is not").
 */

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../../../..");
const DIST = path.join(REPO, "dist/src");

// ---------------------------------------------------------------- arguments

/**
 * How episode codes are laid out in the key space.
 *
 * `interleaved` (default) mints one global counter across the whole catalogue,
 * so a programme's episodes are spread roughly `programmes` apart in
 * `episodeCode` order. That is the shape real data has — ids are minted as
 * episodes are delivered over months, not grouped per programme — and it is the
 * pessimistic case for a `WHERE programmeCode = $1 AND episodeCode > $2
 * ORDER BY episodeCode` page, because the scan has to skip other programmes'
 * rows to find the next one.
 *
 * `contiguous` reproduces the golden seed's own layout (`EP-0001…EP-0200`, four
 * in a row per programme, `src/db/seeds/golden/index.ts:50-64`), where the rows
 * a page wants happen to sit next to the cursor. Measuring only that shape would
 * understate the cost, so it is the opt-in comparison, not the default.
 */
const EPISODE_SHAPES = ["interleaved", "contiguous"];

/** Golden-seed ratio, measured from `pnpm db:seed` output: 3 / 50 / 200. */
const SEED = { channels: 3, programmesPerChannel: 50, episodesPerProgramme: 4 };
const CHANNEL_CODES = ["NXTR", "ORIS", "IMBD"];

/**
 * Synthetic keys deliberately copy the golden seed's key LAYOUT, not just its
 * row counts, because the layout is what decides which plan Postgres picks.
 *
 * Programme codes are CHANNEL-BLIND in the seed (`PRG-GOLDEN-001…050`,
 * `src/db/seeds/golden/index.ts:44`) while `listProgrammes` pages with
 * `WHERE channelCode = $1 AND code > $2 ORDER BY code`. A code that embeds its
 * own channel (`PERF-PRG-NXTR-…`) puts a channel's rows next to each other in
 * the index and makes every page after the first look cheap — measured once
 * that way, it hid the defect. The seed instead derives the channel from the
 * programme's genre (`src/db/migrate-and-seed.ts:111`), and because genres cycle
 * every 5 programmes, a channel's codes are interleaved through the whole range:
 * NXTR holds 3 of every 5, ORIS and IMBD 1 of every 5 each. That rule is
 * reproduced below rather than approximated, so the scan-waste factor measured
 * here is the one production has (≈1.67x for NXTR, ≈5x for the other two).
 *
 * Episode codes are PROGRAMME-BLIND in the seed (`EP-0001…EP-0200`, four in a
 * row per programme), see EPISODE_SHAPES above for the two layouts measured.
 */
const PROGRAMME_CODE_PREFIX = "PERF-PRG-";
const programmeCode = (globalIndex) => PROGRAMME_CODE_PREFIX + String(globalIndex).padStart(6, "0");

/** SQL expression for the seed's genre→channel rule, applied to global position `i`. */
const SEED_CHANNEL_CASE = `CASE (i % 5) WHEN 2 THEN 'ORIS' WHEN 3 THEN 'IMBD' ELSE 'NXTR' END`;

function parseArgs(argv) {
  const out = {
    reps: 200,
    scale: 100,
    refresh: true,
    episodeShape: "interleaved",
    label: "before",
    episodesPerProgramme: SEED.episodesPerProgramme,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--admin-url") out.adminUrl = argv[++i];
    else if (a === "--db") out.db = argv[++i];
    else if (a === "--label") out.label = argv[++i];
    else if (a === "--scale") out.scale = Number(argv[++i]);
    else if (a === "--reps") out.reps = Number(argv[++i]);
    else if (a === "--episode-shape") out.episodeShape = argv[++i];
    else if (a === "--episodes-per-programme") out.episodesPerProgramme = Number(argv[++i]);
    else if (a === "--no-refresh") out.refresh = false;
    else throw new Error(`[TSK-22] unknown argument ${a}`);
  }
  if (!out.adminUrl || !out.db) throw new Error("[TSK-22] --admin-url and --db are required");
  if (!EPISODE_SHAPES.includes(out.episodeShape)) {
    throw new Error(`[TSK-22] --episode-shape must be one of ${EPISODE_SHAPES.join(", ")}`);
  }
  if (!Number.isInteger(out.episodesPerProgramme) || out.episodesPerProgramme < 1) {
    throw new Error("[TSK-22] --episodes-per-programme must be a positive integer");
  }
  // Refuse to measure against a database the suite or the developers own: a
  // 200k-row synthetic load in `vmnl_enterprise_gates` would poison every
  // count-asserting test, and in `vmnl_enterprise` it would look like real data.
  const forbidden = ["vmnl_enterprise_gates", "vmnl_enterprise", "postgres", "template1"];
  if (forbidden.includes(out.db)) {
    throw new Error(`[TSK-22] refusing to load synthetic volume into "${out.db}" — pass a scratch database name`);
  }
  if (!/^[a-z0-9-]+$/.test(out.label)) throw new Error("[TSK-22] --label must be a lowercase alphanumeric token (it is used in artifact filenames)");
  if (!Number.isInteger(out.scale) || out.scale < 1) throw new Error("[TSK-22] --scale must be a positive integer");
  return out;
}

const ARGS = parseArgs(process.argv.slice(2));

// The application-side steps import the compiled repositories, and those read
// `getConfig()`, which loads `.env` — whose DATABASE_URL is the developer
// database. Point the process at the scratch database BEFORE any import so the
// application-side numbers measure the same rows the raw-SQL plans describe.
process.env.DATABASE_URL = connectionUrl();

// --------------------------------------------------------------- dataset

function plan(scale) {
  const programmes = SEED.programmesPerChannel * SEED.channels * scale;
  // Exact per-channel tallies under the seed's genre rule (average is not a
  // fact here: NXTR carries 60% of the catalogue, the other two 20% each).
  const channelProgrammes = {};
  for (const code of CHANNEL_CODES) channelProgrammes[code] = 0;
  for (let i = 1; i <= programmes; i++) channelProgrammes[channelForPosition(i)] += 1;
  return {
    scale,
    channels: SEED.channels,
    programmes,
    episodes: programmes * ARGS.episodesPerProgramme,
    programmesPerChannel: Math.round(programmes / SEED.channels),
    channelProgrammes,
  };
}

/** The golden seed's genre→channel rule: genres cycle every 5 programmes. */
function channelForPosition(i) {
  const mod = i % 5;
  if (mod === 2) return "ORIS";
  if (mod === 3) return "IMBD";
  return "NXTR";
}

// ------------------------------------------------------------- sql shapes

/**
 * Reconstructed from the repository source; `verifyShapes()` proves each
 * reconstruction returns the same rows as the repository's own call for the
 * same keyset position, so the plan below is the plan the application gets.
 *   listProgrammes  src/core/database/repositories/schedule.repository.ts:173-180
 *   listEpisodes    src/core/database/repositories/schedule.repository.ts:290-297
 */
const SQL = {
  programmesPage: `SELECT "id", "code", "title", "channelCode", "category", "targetDemographic", "synopsis", "totalEpisodes", "createdAt", "updatedAt"
FROM "Programme"
WHERE "channelCode" = $1 AND "code" > $2
ORDER BY "code" ASC
LIMIT 101`,
  episodesPage: `SELECT "id", "episodeCode", "programmeCode", "episodeNumber", "title", "durationSeconds", "segmentCount", "mediaAssetId", "complianceRating", "createdAt", "updatedAt"
FROM "BroadcastEpisode"
WHERE "programmeCode" = $1 AND "episodeCode" > $2
ORDER BY "episodeCode" ASC
LIMIT 101`,
  /**
   * CANDIDATE, not current code. AUD-15 asks for the episode-master refresh to be
   * batched, and the only way to decide that honestly is to plan the batched
   * query before writing it: one keyset page covering many programmes instead of
   * one page per programme. `= ANY($1)` is the shape a repository method would
   * get from `where: { programmeCode: { in: [...] } }`.
   */
  episodesBatchPage: `SELECT "programmeCode", "episodeCode"
FROM "BroadcastEpisode"
WHERE "programmeCode" = ANY($1::text[]) AND "episodeCode" > $2
ORDER BY "episodeCode" ASC
LIMIT 101`,
};

// ---------------------------------------------------------------- helpers

const out = [];
const say = (line = "") => {
  out.push(line);
  process.stdout.write(line + "\n");
};

function pct(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

function stats(values) {
  const ms = values.map((v) => v * 1000);
  return {
    n: ms.length,
    min: +Math.min(...ms).toFixed(3),
    p50: +pct(ms, 50).toFixed(3),
    p95: +pct(ms, 95).toFixed(3),
    p99: +pct(ms, 99).toFixed(3),
    max: +Math.max(...ms).toFixed(3),
  };
}

async function timed(client, text, params) {
  const t0 = process.hrtime.bigint();
  const res = await client.query(text, params);
  const t1 = process.hrtime.bigint();
  return { seconds: Number(t1 - t0) / 1e9, rows: res.rowCount };
}

/** Median wall clock of `fn`, reported in seconds. */
async function medianOf(count, fn) {
  const samples = [];
  for (let i = 0; i < count; i++) samples.push(await fn(i));
  return samples;
}

// ------------------------------------------------------------ step 1: db

async function ensureDatabase() {
  const admin = new pg.Client({ connectionString: ARGS.adminUrl });
  await admin.connect();
  const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [ARGS.db]);
  if (exists.rowCount === 0) {
    await admin.query(`CREATE DATABASE "${ARGS.db}"`);
    say(`created database ${ARGS.db}`);
  } else {
    say(`database ${ARGS.db} already exists`);
  }
  await admin.end();
}

function migrate() {
  const url = connectionUrl();
  const res = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    cwd: REPO,
    env: { ...process.env, DATABASE_URL: url, SHADOW_DATABASE_URL: undefined },
    encoding: "utf8",
  });
  say(`prisma migrate deploy -> exit ${res.status}`);
  say((res.stdout || "").trim().split("\n").slice(-3).join("\n"));
  if (res.status !== 0) throw new Error("[TSK-22] migrate deploy failed: " + (res.stderr || "").slice(0, 500));
}

function connectionUrl() {
  const u = new URL(ARGS.adminUrl);
  u.pathname = "/" + ARGS.db;
  return u.toString();
}

// ----------------------------------------------------------- step 2: seed

async function seed(client, p) {
  const t0 = process.hrtime.bigint();
  await client.query('TRUNCATE "BroadcastEpisode", "Programme"');
  for (const code of CHANNEL_CODES) {
    await client.query(
      `INSERT INTO "BroadcastChannel" ("id","code","name","tagline","primaryLanguage","bouquetTier","isProvisional","isActive","createdAt","updatedAt")
       VALUES ($1,$2,$3,$4,$5,'Basic',true,true,now(),now())
       ON CONFLICT ("code") DO NOTHING`,
      [`chn-perf-${code}`, code, `${code} perf`, "TSK-22 load channel", "English"]
    );
  }

  // Channel comes from the seed's own genre rule, so a channel's codes are
  // interleaved through the whole `code` range exactly as production's are.
  await client.query(
    `INSERT INTO "Programme" ("id","code","title","channelCode","category","targetDemographic","synopsis","totalEpisodes","createdAt","updatedAt")
     SELECT 'prg-perf-'||lpad(i::text,6,'0'),
            '${PROGRAMME_CODE_PREFIX}'||lpad(i::text,6,'0'),
            'Perf programme '||i,
            ${SEED_CHANNEL_CASE},
            'Perf',
            'General',
            'synthetic TSK-22 load row',
            $1::int, now(), now()
     FROM generate_series(1, $2::bigint) AS i`,
    [ARGS.episodesPerProgramme, p.programmes]
  );

  // Which programme a load episode belongs to, by code position `j`, for the
  // chosen key-space shape (see EPISODE_SHAPES).
  const programmeOf =
    ARGS.episodeShape === "interleaved"
      ? `((j - 1) % $2::bigint) + 1` // programme p holds codes p, p+P, p+2P…
      : `((j - 1) / $1::bigint) + 1`; // programme p holds codes (p-1)*E+1 … p*E
  const numberOf =
    ARGS.episodeShape === "interleaved"
      ? `((j - 1) / $2::bigint) + 1`
      : `((j - 1) % $1::bigint) + 1`;
  await client.query(
    `INSERT INTO "BroadcastEpisode" ("id","episodeCode","programmeCode","episodeNumber","title","durationSeconds","segmentCount","complianceRating","createdAt","updatedAt")
     SELECT 'ep-perf-'||lpad(j::text,7,'0'),
            'PERF-EPG-'||lpad(j::text,7,'0'),
            '${PROGRAMME_CODE_PREFIX}'||lpad((${programmeOf})::text,6,'0'),
            (${numberOf})::int,
            'Perf episode '||j,
            1800, 4, '15', now(), now()
     FROM generate_series(1, $2::bigint * $1::bigint) AS j`,
    [ARGS.episodesPerProgramme, p.programmes]
  );

  const seconds = Number(process.hrtime.bigint() - t0) / 1e9;
  const counts = await client.query(`SELECT (SELECT count(*) FROM "Programme") AS programmes, (SELECT count(*) FROM "BroadcastEpisode") AS episodes`);
  const targetProgramme = programmeCode(1);
  const spread = await client.query(
    `SELECT min("episodeCode") AS "firstCode", max("episodeCode") AS "lastCode", count(*) AS "rowTotal"
     FROM "BroadcastEpisode" WHERE "programmeCode" = $1`,
    [targetProgramme]
  );
  const perChannel = await client.query(
    `SELECT "channelCode", min("code") AS "firstCode", max("code") AS "lastCode", count(*) AS "rowTotal"
     FROM "Programme" GROUP BY "channelCode" ORDER BY "channelCode"`
  );
  await client.query('ANALYZE "Programme"');
  await client.query('ANALYZE "BroadcastEpisode"');
  return {
    seconds: +seconds.toFixed(2),
    programmes: counts.rows[0].programmes,
    episodes: counts.rows[0].episodes,
    episodeShape: ARGS.episodeShape,
    firstProgrammeEpisodeSpread: spread.rows[0],
    channelSpreads: perChannel.rows,
    targetProgramme,
  };
}

// -------------------------------------------------------- step 3: explain

async function explain(client, label, text, params) {
  const res = await client.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ${text}`, params);
  say(`\n--- EXPLAIN (ANALYZE, BUFFERS): ${label}`);
  say(`    parameters: ${JSON.stringify(params)}`);
  for (const row of res.rows) say("    " + row["QUERY PLAN"]);
  return res.rows.map((r) => r["QUERY PLAN"]);
}

// ------------------------------------------------------- step 4: latency

async function latency(client, label, text, params) {
  const samples = await medianOf(ARGS.reps, async () => (await timed(client, text, params)).seconds);
  const s = stats(samples);
  say(`\n--- latency ${label} (${s.n} reps, DB-side, ms)`);
  say(`    min ${s.min} · p50 ${s.p50} · p95 ${s.p95} · p99 ${s.p99} · max ${s.max}`);
  return { label, ...s };
}

// ------------------------------------------- step 5: the real repository

/**
 * Runs the actual `ScheduleRepository` methods against the same database so the
 * measurement includes Prisma/adapter overhead, not just libpq time.
 */
async function applicationSide(sample, p) {
  const codes = sample.programmesPage.rows.map((r) => r.code);
  const timings = [];
  const reps = Math.min(ARGS.reps, 100);
  for (let i = 0; i < reps; i++) {
    const t0 = process.hrtime.bigint();
    await sample.repo.listEpisodes(codes[i % codes.length]);
    timings.push(Number(process.hrtime.bigint() - t0) / 1e9);
  }

  // A programme code with no episode rows: the DB page returns zero rows, the
  // guard at schedule.repository.ts:298 (`if (found.length > 0)`) does not return
  // it, and the call falls through to the in-memory page. Record what the caller
  // sees, because it is a source-of-truth question the volume run surfaces. No
  // row is written — the code is simply outside the loaded range.
  const emptyProgramme = programmeCode(p.programmes + 1);
  const emptyPage = await sample.repo.listEpisodes(emptyProgramme);

  // Round-trip arithmetic for the boot refresh at this volume: every channel
  // walks its own programme pages (plus one terminating empty page) and every
  // programme walks its episode pages (plus one terminating empty page).
  const programmePages = Object.values(p.channelProgrammes).reduce((sum, n) => sum + Math.ceil(n / 100) + 1, 0);
  const episodePagesPerProgramme = Math.ceil(ARGS.episodesPerProgramme / 100) + 1;
  return {
    appSideMs: stats(timings),
    reps,
    projectedRefreshQueries: programmePages + p.programmes * episodePagesPerProgramme,
    refreshPageArithmetic: {
      programmePages,
      episodePagesPerProgramme,
      channels: p.channels,
      programmes: p.programmes,
      episodesPerProgramme: ARGS.episodesPerProgramme,
    },
    emptyProgrammePage: {
      requestedFor: emptyProgramme,
      rows: emptyPage.rows.length,
      sources: [...new Set(emptyPage.rows.map((r) => r.source))],
    },
    shapeVerified: {
      programmeCodes: codes,
      episodesPage: sample.episodesPage.rows,
      firstProgrammeCode: sample.firstProgrammeCode,
    },
  };
}

// -------------------------------------- step 6: verify reconstructed SQL

async function verifyShapes(client, app) {
  // The repository asks for `limit + 1` rows and slices the page to `limit`
  // (schedule.repository.ts:179 + pagination.ts:26), so the raw query returns
  // the repository's rows plus at most the one probe row. Prefix equality on
  // that basis is what makes the plan below the plan the application gets.
  const rawProgrammes = await client.query(SQL.programmesPage, [CHANNEL_CODES[0], ""]);
  const targetProgramme = app.shapeVerified.firstProgrammeCode;
  const rawEpisodes = await client.query(SQL.episodesPage, [targetProgramme, ""]);
  const check = (raw, sampled, keyName, pick) => {
    const rows = raw.rows.map(pick);
    const ok =
      rows.length >= sampled.length &&
      rows.length <= sampled.length + 1 &&
      rows.slice(0, sampled.length).join() === sampled.join();
    say(`    ${keyName}: raw ${rows.length} vs repository ${sampled.length} (+1 probe row allowed) — prefix identical: ${ok}`);
    if (!ok) throw new Error(`[TSK-22] reconstructed SQL does not reproduce the repository's ${keyName} rows — fix the shape before trusting any plan`);
    return true;
  };
  say("\n--- reconstructed SQL vs repository rows");
  const programmeCheck = check(rawProgrammes, app.shapeVerified.programmeCodes, "Programme.code", (r) => r.code);
  const episodeCheck = check(rawEpisodes, app.shapeVerified.episodesPage.map((r) => r.episodeCode), "BroadcastEpisode.episodeCode", (r) => r.episodeCode);
  return { programmeCheck, episodeCheck };
}

/**
 * Asks the repository for the same pages the raw SQL will be planned for, so
 * `verifyShapes` compares like with like and the application-side timings use
 * real keys read from this dataset rather than strings the harness invented.
 */
async function repositorySamplePages() {
  const { ScheduleRepository } = await import(path.join(DIST, "core/database/repositories/schedule.repository.js"));
  const repo = new ScheduleRepository();
  const programmesPage = await repo.listProgrammes(CHANNEL_CODES[0]);
  const firstProgrammeCode = programmesPage.rows[0]?.code;
  if (!firstProgrammeCode) throw new Error("[TSK-22] no programmes in the load dataset — seeding failed");
  const episodesPage = await repo.listEpisodes(firstProgrammeCode);
  return { repo, programmesPage, episodesPage, firstProgrammeCode };
}

// --------------------------------------------------------------- step 7

async function indexes(client) {
  const res = await client.query(
    `SELECT tablename, indexname, indexdef FROM pg_indexes
     WHERE tablename IN ('Programme','BroadcastEpisode') ORDER BY tablename, indexname`
  );
  say("\n--- indexes on the two tables (pg_indexes)");
  for (const r of res.rows) say(`    ${r.tablename}: ${r.indexname}  ::  ${r.indexdef}`);
  return res.rows;
}

async function serverInfo(client) {
  const v = await client.query("SHOW server_version");
  const ram = await client.query("SHOW shared_buffers");
  const cpu = await client.query("SELECT current_setting('max_parallel_workers_per_gather') AS mpw");
  return { server_version: v.rows[0].server_version, shared_buffers: ram.rows[0].shared_buffers, max_parallel_workers_per_gather: cpu.rows[0].mpw };
}

// ------------------------------------------------------------------ main

/** Host contention is part of every latency number this harness publishes. */
function hostLoad() {
  return {
    loadavg_1m: +os.loadavg()[0].toFixed(2),
    loadavg_5m: +os.loadavg()[1].toFixed(2),
    cpus: os.cpus().length,
    uptime_seconds: Math.round(os.uptime()),
  };
}

/**
 * Everything a step measures lands in RUN, and writeArtifacts() runs on the
 * success path AND the failure path. A run that dies half-way (e.g. the pool
 * refusing a connection under host load) still has to leave its measurements on
 * disk, otherwise the harness would silently publish only the convenient parts
 * of a measurement (Rule 0.4a).
 */
const RUN = {
  hostLoadStart: null,
  info: null,
  seedStats: null,
  explain: {},
  latencies: [],
  applicationSide: null,
  refreshRuns: null,
  indexUsage: null,
  shapeCheck: null,
};

let artifactBase = null;

function writeArtifacts(failure) {
  if (!artifactBase) return;
  writeFileSync(
    path.join(HERE, `${artifactBase}.json`),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        args: { ...ARGS, adminUrl: "<redacted>" },
        hostLoad: { start: RUN.hostLoadStart, end: hostLoad() },
        dataset: plan(ARGS.scale),
        ...RUN,
        ...(failure ? { failure: { message: failure.message, stack: String(failure.stack).split("\n").slice(0, 6) } } : {}),
      },
      null,
      2
    )
  );
  writeFileSync(path.join(HERE, `${artifactBase}.txt`), out.join("\n"));
  process.stdout.write(`wrote ${artifactBase}.json / ${artifactBase}.txt${failure ? " (partial run)" : ""}\n`);
}

async function main() {
  const p = plan(ARGS.scale);
  RUN.hostLoadStart = hostLoad();
  artifactBase = `measurements-${ARGS.label}-scale${ARGS.scale}${ARGS.episodesPerProgramme === SEED.episodesPerProgramme ? "" : `-ep${ARGS.episodesPerProgramme}`}${ARGS.episodeShape === "interleaved" ? "" : `-${ARGS.episodeShape}`}`;
  say(`TSK-22 keyset/N+1 volume harness — ${new Date().toISOString()} · label ${ARGS.label}`);
  say(`repo ${readFileSync(path.join(REPO, ".git/HEAD"), "utf8").trim()} · baseline commit ce098f8 + dirty tree`);
  say(`target database ${ARGS.db} (scratch; never the gates or developer database)`);
  say(`dataset: scale ${p.scale} == ${p.channels} channels, ${p.programmes} programmes (${Object.entries(p.channelProgrammes).map(([c, n]) => `${c}=${n}`).join(", ")}), ${ARGS.episodesPerProgramme} episodes each = ${p.episodes.toLocaleString()} episode rows`);
  say(`host load at start: ${JSON.stringify(RUN.hostLoadStart)}`);

  await ensureDatabase();
  migrate();

  const client = new pg.Client({ connectionString: connectionUrl() });
  await client.connect();
  const info = await serverInfo(client);
  RUN.info = info;
  say(`server ${JSON.stringify(info)}`);

  const seedStats = await seed(client, p);
  RUN.seedStats = seedStats;
  say(
    `seed: ${seedStats.programmes} programmes / ${seedStats.episodes} episodes in ${seedStats.seconds}s ` +
      `(${ARGS.episodeShape} episode-key layout; ${seedStats.targetProgramme}'s ${seedStats.firstProgrammeEpisodeSpread.rowTotal} codes run ` +
      `${seedStats.firstProgrammeEpisodeSpread.firstCode}…${seedStats.firstProgrammeEpisodeSpread.lastCode})`
  );
  for (const r of seedStats.channelSpreads) {
    say(`  ${r.channelCode}: ${r.rowTotal} programme codes ${r.firstCode}…${r.lastCode} (density ${((+r.rowTotal / p.programmes) * 100).toFixed(1)}%, expected scan waste ≈${(1 / (+r.rowTotal / p.programmes)).toFixed(2)}x)`);
  }
  await indexes(client);

  // Positions that matter per channel: the first page (cold boot) and a deep
  // page. The deep cursors are read back from the dataset rather than invented,
  // so they are real keyset positions — the code 90% through that channel's own
  // ordered codes, and for episodes that programme's second code, which forces
  // the scan to walk other programmes' rows to reach the rest of its own.
  const positions = await client.query(
    `SELECT ch."channelCode", deep."code" AS "deepProgramme", second."episodeCode" AS "deepEpisodeCursor"
     FROM (SELECT DISTINCT "channelCode" FROM "Programme") ch
     CROSS JOIN LATERAL (
       SELECT "code" FROM "Programme" WHERE "channelCode" = ch."channelCode" ORDER BY "code"
       OFFSET (SELECT floor(count(*)*0.9)::int FROM "Programme" WHERE "channelCode" = ch."channelCode") LIMIT 1
     ) deep
     CROSS JOIN LATERAL (
       SELECT "episodeCode" FROM "BroadcastEpisode" WHERE "programmeCode" = deep."code" ORDER BY "episodeCode" OFFSET 1 LIMIT 1
     ) second`
  );
  const deepByChannel = Object.fromEntries(positions.rows.map((r) => [r.channelCode, r]));
  for (const r of positions.rows) say(`deep positions ${r.channelCode}: programme ${r.deepProgramme} · episode cursor ${r.deepEpisodeCursor}`);

  const firstEpisodeProgramme = seedStats.targetProgramme;
  const targetEpisodeCursor = seedStats.firstProgrammeEpisodeSpread.firstCode;
  const explainArtifacts = RUN.explain;
  const latencies = RUN.latencies;
  for (const code of CHANNEL_CODES) {
    const deep = deepByChannel[code];
    explainArtifacts[`programmesFirst_${code}`] = await explain(client, `listProgrammes shape, ${code} first page`, SQL.programmesPage, [code, ""]);
    explainArtifacts[`programmesDeep_${code}`] = await explain(client, `listProgrammes shape, ${code} deep cursor`, SQL.programmesPage, [code, deep.deepProgramme]);
    latencies.push(await latency(client, `listProgrammes ${code} first page`, SQL.programmesPage, [code, ""]));
    latencies.push(await latency(client, `listProgrammes ${code} deep cursor`, SQL.programmesPage, [code, deep.deepProgramme]));
  }
  explainArtifacts.episodesFirst = await explain(client, "listEpisodes shape, first page", SQL.episodesPage, [firstEpisodeProgramme, ""]);
  explainArtifacts.episodesDeep = await explain(client, "listEpisodes shape, deep cursor", SQL.episodesPage, [firstEpisodeProgramme, targetEpisodeCursor]);
  explainArtifacts.episodesDeepOtherProgramme = await explain(client, "listEpisodes shape, deep-channel programme deep cursor", SQL.episodesPage, [deepByChannel.ORIS.deepProgramme, deepByChannel.ORIS.deepEpisodeCursor]);
  latencies.push(await latency(client, "listEpisodes first page", SQL.episodesPage, [firstEpisodeProgramme, ""]));
  latencies.push(await latency(client, "listEpisodes deep cursor", SQL.episodesPage, [firstEpisodeProgramme, targetEpisodeCursor]));

  // Candidate batch page (see SQL.episodesBatchPage): 25 contiguous programme
  // codes of one channel, keyed forward by episodeCode. Both a dense (NXTR) and a
  // sparse (ORIS) chunk are planned, because whether batching actually helps
  // depends on which rows the scan has to step over.
  const BATCH_PROGRAMMES = 25;
  const batchChunks = {};
  for (const code of ["NXTR", "ORIS"]) {
    const chunk = await client.query(
      `SELECT array_agg("code" ORDER BY "code") AS codes FROM (
         SELECT "code" FROM "Programme" WHERE "channelCode" = $1 ORDER BY "code" LIMIT $2
       ) s`,
      [code, BATCH_PROGRAMMES]
    );
    batchChunks[code] = chunk.rows[0].codes;
  }
  const programmePageQueries = Object.values(p.channelProgrammes).reduce((s, n) => s + Math.ceil(n / 100) + 1, 0);
  const batchedRefreshQueries = Math.ceil(p.programmes / BATCH_PROGRAMMES) * (Math.ceil((BATCH_PROGRAMMES * ARGS.episodesPerProgramme) / 100) + 1) + programmePageQueries;
  const chunkEpisodeStart = await client.query(
    `SELECT min("episodeCode") AS "firstCode" FROM "BroadcastEpisode" WHERE "programmeCode" = ANY($1::text[])`,
    [batchChunks.NXTR]
  );
  const batchStartCursor = chunkEpisodeStart.rows[0].firstCode;
  explainArtifacts.episodesBatchDense = await explain(client, `candidate batched listEpisodes, dense chunk of ${BATCH_PROGRAMMES}`, SQL.episodesBatchPage, [batchChunks.NXTR, ""]);
  explainArtifacts.episodesBatchSparse = await explain(client, `candidate batched listEpisodes, sparse chunk of ${BATCH_PROGRAMMES}`, SQL.episodesBatchPage, [batchChunks.ORIS, ""]);
  latencies.push(await latency(client, "candidate batched listEpisodes (dense chunk)", SQL.episodesBatchPage, [batchChunks.NXTR, ""]));
  latencies.push(await latency(client, "candidate batched listEpisodes (paged from its own first code)", SQL.episodesBatchPage, [batchChunks.NXTR, batchStartCursor]));
  const asWrittenRefreshQueries = programmePageQueries + p.programmes * (Math.ceil(ARGS.episodesPerProgramme / 100) + 1);
  say(`projected DB round-trips for one boot refresh as written: ${asWrittenRefreshQueries.toLocaleString()}; batched at ${BATCH_PROGRAMMES} programmes per query: ${batchedRefreshQueries.toLocaleString()}`);

  const sample = await repositorySamplePages();
  const app = await applicationSide(sample, p);
  RUN.applicationSide = app;
  RUN.shapeCheck = await verifyShapes(client, app);
  say(`application-side (Prisma/repository) listEpisodes, ${app.reps} reps: ${JSON.stringify(app.appSideMs)}`);
  say(`projected DB round-trips for one boot refresh at this volume: ${app.projectedRefreshQueries.toLocaleString()}`);
  say(`empty-episode-page probe (code with zero episode rows): ${JSON.stringify(app.emptyProgrammePage)}`);

  if (ARGS.refresh) {
    const { refreshEpisodeMasterIndex } = await import(path.join(DIST, "modules/broadcast/episode-masters.js"));
    const runs = [];
    for (let i = 0; i < 3; i++) {
      const t0 = process.hrtime.bigint();
      let entry;
      try {
        const result = await refreshEpisodeMasterIndex();
        entry = { seconds: +(Number(process.hrtime.bigint() - t0) / 1e9).toFixed(3), ...result };
      } catch (err) {
        // A failed refresh run is a measurement too — the register asks what the
        // boot path costs, and "it throws under this host load" is the answer.
        entry = { seconds: +(Number(process.hrtime.bigint() - t0) / 1e9).toFixed(3), error: err.message };
      }
      runs.push({ ...entry, hostLoad: hostLoad() });
      say(`refreshEpisodeMasterIndex run ${runs.length}: ${JSON.stringify(entry)}`);
    }
    RUN.refreshRuns = runs;
  }

  const usage = await client.query(
    `SELECT relname, indexrelname, idx_scan, pg_size_pretty(pg_relation_size(indexrelid)) AS size
     FROM pg_stat_user_indexes WHERE relname IN ('Programme','BroadcastEpisode') ORDER BY relname, idx_scan DESC`
  );
  RUN.indexUsage = usage.rows;
  say("\n--- index usage after the run (pg_stat_user_indexes)");
  for (const r of usage.rows) say(`    ${r.relname}.${r.indexrelname}: idx_scan ${r.idx_scan} size ${r.size}`);

  say(`host load at end: ${JSON.stringify(hostLoad())}`);
  await client.end();
  writeArtifacts();
  say(`\nwrote ${artifactBase}.json / ${artifactBase}.txt`);
}

main().catch((err) => {
  console.error("[TSK-22] harness failed:", err);
  say(`\n!!! harness aborted after the steps above: ${err.message}`);
  writeArtifacts(err);
  process.exit(1);
});
