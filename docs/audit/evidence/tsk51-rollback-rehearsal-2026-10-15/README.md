# TSK-51 — rollback rehearsal, database half (executed 2026-10-15)

**Register item:** `tasks.md` TSK-51 · P2 · Rollback/canary rehearsal *(PRC-07, CCPP §21)* —
"`docs/runbooks/rollback-runbook.md` moved from TARGET to rehearsed, with preconditions executed
on a scratch deployment".

**What this directory is:** the measured half of that box. The database recovery path the runbook
documents (§3.3) was executed against a real PostgreSQL server on throwaway databases, with
recorded timings, and it worked — once, and then not at all when the runbook's own one-line
procedure was followed literally. **The box stays open** for the reasons in
[What this does not rehearse](#what-this-does-not-rehearse) below.

## Environment

Measured on the local machine, not in CI, not in a container.

| | |
| --- | --- |
| Host | `Darwin 25.6.0`, arm64 |
| Server | PostgreSQL **18.3** (`/Users/deprof/www/vmng` dev cluster on `localhost:5432`) |
| Client | `psql (PostgreSQL) 18.3` |
| Migrations | 13 directories in `prisma/migrations` (`0_init` … `20261013142927_add_composite_keyset_indexes`) |
| Migration under rehearsal | `20261013142927_add_composite_keyset_indexes` (newest; drops 2 indexes, creates 2 composite ones) |
| Databases | `vmnl_tsk51_rehearsal_a` (source) and `vmnl_tsk51_rehearsal_b` (restore target), created by the script and **dropped by it at the end** |

## Files

| File | Role |
| --- | --- |
| `rehearsal.sh` | the whole drill, 25 numbered steps; re-runnable, self-cleaning |
| `seed.sql` | 250 synthetic `DataSubjectRequest` rows so the snapshot carries *data*, not only DDL |
| `undo.sql` | hand-revert of the migration's DDL — the schema half the runbook does not spell out |
| `drill.sh` | step 20: one timed run of the complete recovery path |
| `counterfactual.sh` | step 21: run §3.3 **on its own**, with the DDL never reverted |
| `rehearsal-timings.txt` | the raw log of the run quoted below — every figure here is from that file |
| `coverage-attempt-1-starved-fork.txt` | the first `pnpm test:coverage` attempt: one fork starved for 953,811 ms under machine load, which expired a Prisma transaction mid-write |
| `gate-database-leftover-rows.txt` | the rows that starved run left in `vmnl_enterprise_gates`, what they broke on the next attempt, the clean-run proof, and the teardown fix |
| `gate-battery.txt` | the full gate battery re-run on the tree this rehearsal produced (lint, typecheck, build, test, coverage, three audit scripts, structure invariants) |

## Measured result (the run in `rehearsal-timings.txt`)

| Step | What ran | Result |
| --- | --- | --- |
| 03 | `prisma migrate deploy` onto an empty scratch database | exit **0**, real **27.38 s**, 13/13 migrations applied |
| 05 | resulting schema | **44** tables, **470** columns, **122** indexes, **13** journal rows, then **250** seeded rows |
| 06 | `pg_dump -Fc --no-owner -n public` (the restore point) | exit **0**, real **0.51 s**, **104,960** bytes |
| 08 | `pg_restore --no-owner --exit-on-error --single-transaction` into a second scratch database | exit **0**, real **0.65 s** |
| 10 | source vs restored target: columns, indexes, journal rows, seeded rows — four set diffs | all four **exit=0 / differing_lines=0** |
| 11 | incident injected: newest journal row set to `finished_at=NULL, applied_steps_count=0` (what a mid-flight failure leaves behind) | exit 0 |
| 12 | `migrate status` | exit **1** — "Following migration have failed" |
| 13 | `migrate deploy` while the journal is unclean | exit **1**, **`P3009`** — new migrations are refused |
| 14 | hand-revert the DDL (`undo.sql`) | exit **0**, real **0.17 s** |
| 15 | **the runbook §3.3 command verbatim** — `pnpm prisma migrate resolve --rolled-back <name>` | exit **0**, real **5.22 s**, "marked as rolled back" |
| 16 | journal row after the resolve | `applied=false rolled_back=true steps=0` |
| 17 | `migrate status` after the resolve | exit 1, migration pending again — the block is cleared |
| 18 | `migrate deploy` re-applies it | exit **0**, real **5.84 s** |
| 19 | recovered target vs source | 44 tables / 470 columns / 122 indexes, **250 seeded rows intact**, column diff and row diff **0 lines** |
| 20 | **the whole recovery path in one timed run** (dirty journal → undo DDL → §3.3 resolve → deploy) | exit **0**, real **11.44 s** |
| 21 | counterfactual: §3.3 alone, DDL left in its post-migration state | see below |
| 23–24 | both scratch databases dropped | exit 0, `scratch_databases_remaining=0` |

Against the runbook's stated target RTO of "< 60 seconds", the rehearsed database recovery path
measured **11.44 s** on this machine. That number covers only §3.3 plus the deploy; it does **not**
cover §2's traffic switchback, which was not rehearsed at all.

## The counterfactual is the useful finding

Step 21 ran the runbook's §3.3 exactly as written — the single `migrate resolve --rolled-back`
command — and skipped the schema half:

1. `resolve --rolled-back` **succeeded** (exit 0, "marked as rolled back"). The command cannot tell
   that the DDL was never reverted; it only rewrites the journal.
2. `migrate deploy` then **failed**: `P3018`, database error code **`42704`**,
   `ERROR: index "BroadcastEpisode_programmeCode_idx" does not exist` — the migration re-ran its
   own `DROP INDEX` against a schema that was already in the post-migration state.
3. The journal went back to `applied=false rolled_back=false steps=0`, i.e. **the failed state again**.
   Following §3.3 literally, from that row, loops.
4. Recovery required the step the runbook does not mention: revert the DDL (`undo.sql`), *then*
   `resolve --rolled-back`, *then* `deploy` — after which the target's index set diffs **0 lines**
   against the source and all **250** seeded rows are still present. The whole counterfactual leg,
   including the recovery, measured **23.06 s**.

So: `prisma migrate resolve --rolled-back` is a *journal* repair, not a rollback. The runbook now
says that, because the measurement says it — the repository's migration SQL is not idempotent
(bare `DROP INDEX` / `CREATE INDEX`, no `IF EXISTS`), which is what turns the omission into a loop
rather than a cosmetic gap.

## What this does not rehearse

- **§1 and §2 of the runbook were not exercised.** The canary telemetry triggers (5xx rate, P95
  degradation, playout drift, circuit-breaker state) and the `kubectl set selector` /
  `kubectl scale deployment/vmn-canary` switchback did not run, because `vmn-canary`,
  `vmn-app-service` and `infra/k8s/*` still do not exist in this repository. There is no canary to
  roll back; this drill is a migration-recovery drill.
- **Not a "scratch deployment".** The box's wording asks for preconditions on a scratch
  *deployment*. This ran against the local PostgreSQL server on scratch *databases*. The committed
  compose stack (`docker-compose.yml`: app, postgres, redis, minio, postgres-backup, prometheus)
  was not brought up — there is no Docker binary on this machine (`docker info` exits 127), the
  same blocker that keeps `tasks.md` TSK-57 open.
- **No application traffic.** Nothing measured request latency, error rate or playout continuity.
  Zero data loss here means the 250 rehearsal rows survived a schema round trip on a database with
  no concurrent writers, not that a live cutover is safe.
- **Not CI, and not a rehearsal of the CI canary stage** — there is no canary stage to rehearse.
- **Not a substitute for an on-call owner.** Nobody was paged; the war-room and PagerDuty steps in
  §2 were not tested.

## Precondition census (the runbook's own four)

| # | Precondition | State after this drill |
| --- | --- | --- |
| 1 | Committed deployment manifests **or compose-based equivalents** | **Met in the compose sense** — `docker-compose.yml` is committed and defines app/postgres/redis/minio/backup/prometheus. `infra/k8s/*` and the `kubectl` objects §2 names still do not exist, and the compose stack was not exercised (no Docker here). |
| 2 | A CI stage wiring §1's triggers to real telemetry | **Not met.** `.github/workflows/ci.yml` has no canary stage; `/metrics` is scraped by `prometheus.yml` only. |
| 3 | A rehearsal drill with recorded timings | **Met for §3.3 only** — this directory. **Not met for §1/§2.** |
| 4 | Named on-call owner | **Not met.** No name, no page path, in this repository. |

Because 2 and 4 are unmet and 3 is met for one section of four, **the runbook stays `STATUS: TARGET`**
and the TSK-51 box stays open. Preconditions 2 and 4 are owner decisions and infrastructure the
owner has to provide; they are not engineerable from this tree.

## Observed while measuring (recorded, not acted on)

- The **gate/test database** `vmnl_enterprise_gates` was not modified by the drill (step 25: 44
  tables, 122 indexes, 40 `DataSubjectRequest` rows belonging to the suite, `rehearsal_rows_in_gate_database=0`;
  that row count is a point-in-measurement reading of a table the suite grows by one row per run, so
  it is quoted as step 25's output, not as a stable property). Its journal carries **12** applied
  migrations against **13** directories, and it still has
  `BroadcastEpisode_programmeCode_idx` / `Programme_channelCode_idx` rather than the two composite
  indexes — i.e. that database is one migration behind `prisma/migrations` and nobody notices,
  because the missing migration is index-only and the suite passes either way. The rehearsal did
  not "fix" that: bringing the gate database up to date changes what the next `pnpm test` measures,
  and it was not asked for by this box.
- **The rehearsal is not the only thing that writes to the gate database, and the two are easy to
  confuse.** `pnpm test` and `pnpm test:coverage` each add exactly one `DataSubjectRequest` row:
  `tests/security/route-authorization.test.ts:277` POSTs `/api/v1/privacy/export-request`, and
  `src/api/routes/privacy.routes.ts:64-71` persists the ledger row deliberately — the test asserts
  that write, so it is behaviour under verification, not fixture slop, and nobody deletes it. The
  row's `createdAt`/`updatedAt` are `timestamp without time zone` written **UTC-naive** by Prisma on
  a server whose session is `Africa/Lagos`, so a run at 01:36 local stores `00:36`. Filtering that
  table on local wall clock silently returns zero and invites the conclusion that a run "tore down
  clean" when it did not — that is exactly the wrong reading this directory's first draft of
  `gate-battery.txt` published, and correcting it is why the file records the counts as
  47 → 49 across the two battery passes. The suite is required to tolerate the residue (TSK-17), and
  four consecutive 872/872 runs here show it does.
- **Machine starvation, measured.** Load averages of 206–309 for the whole session (the owner's own
  running services; none touched here) made one coverage fork wait 953,811 ms, which expired a
  Prisma transaction inside a CMS write and produced seven failures that had nothing wrong with the
  code — and then an eighth, because the starved run persisted a row its fixture did not clean.
  Attempts, causes, the clean-run proof and the test hardening are in
  `coverage-attempt-1-starved-fork.txt`, `gate-database-leftover-rows.txt` and `gate-battery.txt`.
- **Two earlier rehearsal attempts are part of this record.** The first used `?schema=public` on every
  `psql`/`pg_dump`/`pg_restore` target; libpq rejects that query parameter, so the snapshot was
  empty and the restore target stayed bare. The second produced
  `Invariant violation: called markMigrationRolledBack on a database without migrations table`,
  and, in its step 16, a `DATABASE_URL` that was not quoted into the `env` prefix — which sent the
  §3.3 command at the **gate database** instead of the scratch one. The effect there was a no-op,
  verified after the fact: `vmnl_enterprise_gates` still had 12 journal rows, `journal_rolled_back=0`,
  and no rehearsal rows. Both bugs are why `rehearsal.sh` now (a) keeps one URL variable per
  consumer and (b) prints `cmd:` for every step so the datasource each command used is in the log.

## Commands

```bash
bash docs/audit/evidence/tsk51-rollback-rehearsal-2026-10-15/rehearsal.sh
# writes docs/audit/evidence/tsk51-rollback-rehearsal-2026-10-15/rehearsal-timings.txt
# creates and drops vmnl_tsk51_rehearsal_a / _b; touches no other database
```

libpq targets take the URL without `?schema=public`; the Prisma CLI takes it with. Getting that
backwards is the first thing this drill measured.
