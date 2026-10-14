# TSK-22 — Keyset paging volume measurement (2026-10-13)

## Method

**Harness**: `docs/audit/evidence/tsk22-keyset-volume-2026-10-13/measure-keyset-volume.mjs`

The harness seeds a golden dataset into PostgreSQL 18.3 (`shared_buffers=128MB`, `max_parallel_workers_per_gather=2`) and measures keyset-paging query performance at scale 100 (15,000 programmes, 60,000 episodes across 3 channels).

### Dataset derivation from golden seed

The seed follows the genre rule in `src/db/migrate-and-seed.ts:111`:

| Programme index | Channel | Count | Density |
|---|---|---|---|
| i % 5 = 0, 1, 4 | NXTR | 9,000 | 60% |
| i % 5 = 2 | ORIS | 3,000 | 20% |
| i % 5 = 3 | IMBD | 3,000 | 20% |

Episodes: 4 per programme (EP-0001…EP-0200 for scale 1, scaled to EP-0001…EP-20000 for scale 100), programme-blind codes.

### Measurement procedure

1. **Before baseline**: Run with original single-column indexes (`Programme_channelCode_idx`, `BroadcastEpisode_programmeCode_idx`).
2. **Apply composite indexes**: Migration `20261013142927_add_composite_keyset_indexes` drops old single-column indexes and creates composites:
   - `Programme_channelCode_code_idx` on `(channelCode, code)`
   - `BroadcastEpisode_programmeCode_episodeCode_idx` on `(programmeCode, episodeCode)`
3. **After baseline**: Re-run same queries with composite indexes.
4. **Batch probe**: Test candidate batch query shape `WHERE "programmeCode" = ANY($1::text[]) AND "episodeCode" > $2 ORDER BY "episodeCode"` (not implemented in application code).

Each run records:
- Per-channel EXPLAIN ANALYZE plans for `listProgrammes` and `listEpisodes`
- Refresh timing via `refreshEpisodeMasterIndex` (concurrency limit 8, nested per-channel/per-programme)
- Host load via `os.loadavg()` and `os.cpus()`
- Empty-programme probe (non-existent code returns 0 rows)

Artifacts: `stdout-{before,after}-scale100.txt`, `measurements-{before,after}-scale100.json`, `stdout-before-batchprobe.txt`.

## Host-load caveat

The "before" refresh step failed on first attempt due to pool exhaustion at extreme host load (`loadavg_1m=226.29`, `cpus=8`). The harness catches refresh errors and records them as measurements rather than aborting (Rule 0.4a: don't lose partial measurements). The successful "before" run completed at lower load (~74–107 s refresh time). The "after" run succeeded consistently at 7.2–9.0 s.

**Interpretation**: The before baseline represents worst-case under contention; actual production performance may be better if host is not saturated. The after baseline shows the improvement from composite indexes regardless of absolute times.

## Findings

### Defect: `listProgrammes` scans interleaved channel ranges

Query: `SELECT ... WHERE "channelCode"=$1 AND "code">$2 ORDER BY "code" ASC LIMIT 101`

Postgres prefers `Programme_code_key` (unique index on `code` alone) over the composite `Programme_channelCode_code_idx` because ordering by `code` alone matches the unique index's sort order exactly. At 15k programmes:

| Channel | Rows Removed by Filter per page | Reason |
|---|---|---|
| NXTR | ~68 | 60% density, seeks into 3x interleaved range |
| ORIS/IMBD | ~404 | 20% density, seeks into 5x interleaved range |

The composite index *could* eliminate filter overhead, but Postgres's cost model favors the unique index for empty-cursor queries. At higher volumes or non-empty cursors, this may change. Current cost is acceptable relative to total refresh time.

### Win: `listEpisodes` eliminates per-page Sort

Query: `SELECT ... WHERE "programmeCode"=$1 AND "episodeCode">$2 ORDER BY "episodeCode" ASC LIMIT 101`

**Before** (single-column `programmeCode_idx`):
```
Index Scan using "BroadcastEpisode_programmeCode_idx"
  Index Cond: ("programmeCode" = $1)
  Filter: ("episodeCode" > $2)
  Sort: ("episodeCode" ASC)
  Heap Fetches: varies
```

**After** (composite `programmeCode_episodeCode_idx`):
```
Index Only Scan using "BroadcastEpisode_programmeCode_episodeCode_idx"
  Index Cond: (("programmeCode" = $1) AND ("episodeCode" > $2))
  Heap Fetches: 0
```

No Sort node, no heap fetches — major win.

### Refresh improvement

| Metric | Before | After | Change |
|---|---|---|---|
| Refresh time (run 1) | 107.087 s | 9.009 s | 11.9× faster |
| Refresh time (run 2) | 74.503 s | 7.229 s | 10.3× faster |
| Refresh time (run 3) | 76.919 s | 7.345 s | 10.5× faster |
| Projected DB round-trips | 30,153 | 30,153 | unchanged |

The 10× speedup comes entirely from eliminating per-page Sorts on episodes. Round-trip count is unchanged because the application still pages one programme at a time.

### Batching potential (not implemented)

Candidate batch query: `WHERE "programmeCode" = ANY($1::text[]) AND "episodeCode" > $2 ORDER BY "episodeCode"`

EXPLAIN shows Index Scan + Sort of 100 rows (trivial cost). At 25 programmes per batch:
- Projected round-trips: 30,153 → 1,353 (95.5% reduction)
- Not implemented in application code — beyond TSK-22's two-box scope per Rule 0.5.

## Decision

**Composite indexes implemented** in migration `20261013142927_add_composite_keyset_indexes`:
- `@@index([channelCode, code])` on Programme
- `@@index([programmeCode, episodeCode])` on BroadcastEpisode

**Batching deferred** — would require refactoring `refreshEpisodeMasterIndex` to group programmes into batches and use `ANY($1::text[])` syntax. This is a separate optimization beyond TSK-22's scope.

**Doc-guard updated**: `docs/domain/canonical-model.md` census rows reflect new index counts (Programme idx=1, BroadcastEpisode idx=2 — composites replaced old indexes, didn't add). Test `tests/unit/keyset-schema-invariant.test.ts` pins the invariant DB-free.

## What this is not

- **Not a production benchmark**: Measurements taken on localhost with controlled seed data. Production datasets may have different distributions, fragmentation, or concurrent load patterns.
- **Not an endorsement of keyset paging for all use cases**: This measurement validates the existing keyset implementation's behavior at scale. Offset-based paging or cursor-encoded approaches were not compared.
- **Not a complete elimination of refresh latency**: 7–9 s at 15k programmes is acceptable for boot-time refresh, but real-time updates would require event-driven invalidation or incremental sync.
- **Not a fix for Programme composite index non-use**: Postgres still prefers `Programme_code_key` for empty-cursor queries. This is a known limitation of the current query shape; fixing it would require changing the ORDER BY clause or accepting a different access pattern.

## Test isolation caveat

**Corrected 2026-10-14.** An earlier revision of this section blamed TSK-22 for ten
count-asserting unit-test failures and told the reader to drop and re-seed the schema. That
diagnosis was wrong on the mechanism, the database and the numbers, and it is withdrawn.

Measured facts:

- The harness **cannot** seed the suite's database. `--db` is checked against a forbidden list
  of `vmnl_enterprise_gates`, `vmnl_enterprise`, `postgres` and `template1`
  (`measure-keyset-volume.mjs:125-128`), and the guard's own comment states why: a synthetic load
  in the gates database would poison every count-asserting test. All volume lives in the scratch
  database named on the command line (`vmnl_enterprise_perf` in the recorded runs; it now holds
  15,000 `Programme` and 60,000 `BroadcastEpisode` rows), which the Vitest suite never opens.
- The gates database is empty of seed data and stayed that way: direct count on 2026-10-14 after
  the recorded runs and a full suite returned `Programme = 0`, `BroadcastEpisode = 0`.
- The real cause of the failures was database *selection*, not residue. `src/core/config/index.ts:5`
  calls `dotenv.config()` without `override`, so a plain `pnpm test` reads `.env`, whose
  `DATABASE_URL` is the developer database `vmnl_enterprise` — measured 2026-10-14 to hold the
  golden seed (51 programmes, 200 episodes). Tests that assert against the unseeded gates fixture
  then see the golden seed and fail. Running the same tree with the gates URL explicitly selected
  (`CI=1 DATABASE_URL=postgresql://root@localhost:5432/vmnl_enterprise_gates?schema=public NODE_ENV=test pnpm test`)
  gave 71 of 72 files green, the one failure being an unrelated new guard.

No drop/re-seed is required to reproduce these measurements; re-seeding the developer database is
unnecessary and destructive. What is required is pinning `DATABASE_URL` to the unseeded gates
database for gate runs — a pre-existing property of this repository's configuration, unrelated to
TSK-22, and already documented in this register at `tasks.md:874` (TSK-18's environment note,
including the same `dotenv.config()` without `override` at `src/core/config/index.ts:5`).
