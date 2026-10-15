# TSK-18 — the audit ledger shares the business write's transaction

Closed 2026-10-12 (code + tests); gates re-run on the finished tree 2026-10-13. Baseline `ce098f8` +
the dirty working set (**201** `git status --porcelain` entries, 348 with `--untracked-files=all`).
**Nothing here is committed and no remote is pushed to** — commit and push are the owner's decision.

## The finding, in one sentence

TSK-17 turned ten release-critical domains into durable stores but left the thing that *attests* them —
the tamper-evident audit ledger — in a process `Map` written beside the request, so a 201 proved the row
landed and proved nothing about the entry that records why it was allowed; `getAuditLogs` read that
`Map`, so the ledger an operator queried was not the ledger the database held. This task made the ledger
row part of the same Prisma transaction as the rows it attests, moved the read to Postgres, and surfaced
its degradation on `/readyz` **and** as an alert metric.

## What changed (every pin opened before it was written down)

| Behaviour | Where |
|:---|:---|
| One journal **group** per request | `createApiServer` wraps every socket in `serveRequestInJournalGroup` — `src/api/server.ts:303-306` → `:586` |
| The group is the unit of durability | `nextJournalGroup()` `src/core/database/durable-journal.ts:77`, `withJournalGroup()` `:82` over an `AsyncLocalStorage` scope (`:73`), stamped onto each write by `stageDurableWrite` `:113` |
| One Prisma transaction per group | `flushDurableJournal()` `:138` partitions by group (`:162`) and drains each partition inside `prisma.$transaction` (`:176`), `JOURNAL_TX_TIMEOUT_MS = 120_000` (`:103`) |
| Existing persisters join it without changing | `getPrismaClient()` returns the scoped transaction client inside a drain — `src/core/database/index.ts:26`, `:35-38` — which is why ~50 synchronous mutators stayed synchronous |
| The ledger is a registered durable store | `registerDurableStore<AuditLogWrite>("auditLog", …)` `src/core/audit/index.ts:177`, persisting through `persistAuditLogEntry` `src/core/database/repositories/release-critical.repository.ts:1050` (create at `:1051`) — the **15th** store in `src/` |
| The read is a durable read | `getAuditLogs` `src/core/audit/index.ts:320` → `loadAuditLogRows` `…release-critical.repository.ts:1107` (findMany `:1114`); both call sites await it — `src/api/router.ts:3810` (`GET /api/v1/audit/logs`), `:7351` (governance register desk) |
| The drain is the response path, not a side job | `sendJson` `src/api/router.ts:573` drains at `:579-580`; `sendText`/`sendHtml` gate through `flushOrFailure` `:638`, `:700` → `:8225`; the `finally` backstop `src/api/server.ts:586-603` covers paths that answer without a choke point |
| A rejected ledger row fails closed | the staged write rolls the optimistic entry back and the request becomes **503 `REPOSITORY_UNAVAILABLE`**, never a 2xx that attests nothing |
| The scope is inside the hash | `buildAuditHashPayload` `src/core/audit/index.ts:154-165` joins nine components, `tenantId` seventh (`:162`); `tenantId` is also a real column (`prisma/schema.prisma:341`) and the exact hashed bytes travel with the row as `changesJson.auditHashPayload` (`…release-critical.repository.ts:1065-1071`) — jsonb does not preserve key order, so re-serialising `changes` cannot reproduce them |
| The actor constraint that made an audit insert gating is gone | `prisma/migrations/20261012120000_relax_audit_ledger_actor_identity/migration.sql` — 3 statements, additive otherwise; `prisma migrate diff` says `-- This is an empty migration.` |
| Degradation is observable, not prose | `getAuditHealth()` `src/core/audit/index.ts:97` counts `durableFailures`; `reportDurableFailure` `:255` emits the WARN **and** fires the listener; `wireAuditDegradationAlerting` `src/api/server.ts:568-572` turns it into `audit_durable_degraded_total`; rule 4 `src/core/observability/index.ts:223-233` pages `AUDIT_DURABLE_PERSISTENCE_DEGRADED` at CRITICAL; `/readyz` publishes the counter beside `auditPersistence`/`auditChainSequence`/`auditBufferedEntries` (`src/api/router.ts:3625-3627`) |

## Asserted by

| Claim | Test |
|:---|:---|
| Business row + its ledger entry land in one transaction, and the ledger reads from Postgres | `tests/unit/audit.test.ts:223` |
| Crash between writes: the entry rolls back with the rows it attests, and the failure is signalled | `tests/unit/audit.test.ts:287` |
| A durable row is recomputable from its own columns, scope included | `tests/unit/audit.test.ts:254-257` (`sha256(auditHashPayload) === auditEntryHash`, components 1 and 6 pinned to the entry id and the tenant), `:277` (component 7 = the event instant) |
| The ledger entry that attests an enquiry survives into a **second OS process** | `tests/unit/durability-release-critical.test.ts:669` (the 201 case) restarts against `restartRead("auditLedger", …)` `:697` → reader branch `tests/helpers/durable-restart-reader.mjs:141-163`; `database: false` is reported as an impossible measurement, never a pass |
| `/readyz` carries the durable-failure counter as a number | `tests/unit/audit-remediation-regressions.test.ts:296-304` |
| A real degradation pages; value 0 does not | `tests/unit/observability.test.ts` ("alerts when the durable audit ledger degrades, and only on a real degradation") |
| Every durable domain — now **16** — has a drill, in both directions | `tests/unit/durability-drill-coverage.test.ts` (9 tests): `registerDurableStore` call sites ⇄ domain table ⇄ reader branches ⇄ `restartRead("<entity>")` |

The instrument earned its keep here: registering the 15th store made it **red in two places** (no
domain row for the audit ledger, and an orphan `auditLedger` reader branch). The domain row was added;
no assertion was relaxed (Rule 0.3).

## Measured, not argued

`measurements.txt` holds the database facts and the reason the FK had to go: **1783 of 1783** durable
`AuditLog` rows carried `userId = NULL` before the change (`onDelete: SetNull` was erasing the actor from
rows whose user was later deleted, and the constraint refused any write from a synthetic or system
actor), and only **668 of 1783** rows could be recomputed from their own columns. It also records the
instrument bug that first reported `createdAtEqualsEventTimestamp: 0` — `node-postgres` builds a `Date`
from a `timestamp` *without time zone*, so the comparison was skewed by the machine's UTC offset — and
the corrected **34 of 34**.

## Gates on this tree (Rule 0.1 — all on the same final tree)

| Gate | Exit | Measured |
| --- | --- | --- |
| `pnpm typecheck` | 0 | `typecheck.txt` |
| `pnpm lint` (`--max-warnings 0`) | 0 | `lint.txt` |
| `pnpm build` | 0 | `build.txt` |
| `pnpm test` | 0 | `full-suite.txt` — 68 files, **819 tests, 0 skipped**, 45.33 s |
| `pnpm test:coverage` | 0 | `coverage.txt` — statements 78.96 · branches 70.15 · functions 82.95 · lines 80.32, against thresholds 73 / 62 / 77 / 72 (floors untouched) |
| the two doc guards + the five TSK-18 suites | 0 | `focused-gates-db.txt` — 7 files, 76 tests (28 of them the citation/census instruments above) |
| the two files that were red on a seeded database | 0 | `focused-unseeded-gates-db.txt` — 106 tests |

No assertion was deleted, skipped or relaxed to get there (Rule 0.3). The full accounting, including
the three runs that are **not** a pass, is in `gate-summary.txt`.

## Environment, stated rather than hidden (Rule 0.4a)

The local Postgres went away with the machine: `kern.boottime` is **Mon Oct 12 23:22:24 2026** and
nothing was listening on `localhost:5432` when the gates were first re-run. Two runs are kept as
evidence of what a skipped suite looks like — `full-suite-server-down.txt` (connection refused: 794
passed, **25 skipped**, the whole durability suite) and `full-suite-wrong-cluster.txt` (an unrelated
empty cluster answered 5432 and durability stayed skipped). Both exited 0 and both are **not** a
durability pass. Restoring the dependency took three additive steps, recorded here:
`/opt/local/lib/postgresql18/bin/pg_ctl -D ~/Library/FlyEnv/data/postgresql start` (the dev cluster that
hosts `localhost:5432`), then `createuser --createdb --login root` + `createdb -O root vmnl_enterprise`
(the old data directory is not recoverable on this machine, so the schema came from the repository, not
a dump), then `prisma migrate deploy` (**12 migrations**, `migrate-deploy-fresh-database-2026-10-13.txt`)
and `pnpm db:seed` (`db-seed-fresh-database.txt`: 3 channels / 50 programmes / 200 episodes / 250 DAM
masters / 200 episode references, with `schedules` still labelled in-memory and `damAssets` labelled
DAM-registry-in-memory — the honest labels TSK-17 required). The earlier measurements in this directory
are from the pre-reboot database and are labelled as such; they are not restated as properties of the
fresh one.

Two environment facts decide what a green run means here, and both are measured in
`measurements.txt` rather than asserted:

* **The gates ran on `vmnl_enterprise_gates`** — the same 12 migrations, no golden seed. Loaded into
  the dev database, `pnpm db:seed` makes seven count-asserting repository expectations
  (`tests/unit/production-core-and-infrastructure.test.ts:129`, `:164`, `:213`;
  `tests/unit/todo-final-remediation.test.ts:1829`, `:2207`) report the seed's rows instead of the
  fixture's, and the suite exits 10-red: `full-suite-golden-seeded-dev-db.txt`. The seed rows were
  left in place for page-browsing; the second database was added instead of deleting them.
* **`.env` must not be sourced before `pnpm test`.** It carries `NODE_ENV=development`, which survives
  into the test process and disables the `x-test-role` harness at `src/api/router.ts:730`, turning
  authenticated route tests into 401s. That cost this closure six fabricated failures on the first
  restored-cluster run. `DATABASE_URL=… pnpm test` selects the database without touching `NODE_ENV`.

## Stated limits, not gaps hidden by prose

1. Atomicity is **per request**. A business write and the audit entry recorded in the same request share
   one transaction; nothing is claimed for two requests, or for a write staged outside any request —
   the server-side backlog drains in its own `ungrouped` transaction (`src/core/database/durable-journal.ts:194`)
   so a one-time seed failure cannot destroy a healthy request's rows.
2. `AuditLog` now records the actor **verbatim with no referential guarantee** that a `User` row exists.
   Attribution is an application-side id reference, like `linkedRiskId` in the risk register.
3. `pruneAuditLogs` (`src/core/audit/index.ts:451`) still has **zero call sites**: the ledger is
   append-only with no retention job, and this task did not pretend to fix that.
4. With no database reachable, the journal defers and the surfaces say so (`sandboxDeferred`,
   `persistenceMode`, the boot WARN). A green suite on a machine without Postgres is a skipped suite —
   see the environment section.
5. Hashing a scope is not enforcing one: TSK-58 boxes 1 and 3 stay open, one of them an owner decision.

## Artifacts in this directory

`measurements.txt` (+ `measure.mjs`, read-only, reproducible from the repo root) ·
`migrate-deploy.txt` · `migrate-deploy-fresh-database-2026-10-13.txt` · `migrate-diff-drift.txt` ·
`prisma-generate.txt` · `db-seed-fresh-database.txt` · `typecheck.txt` · `lint.txt` · `build.txt` ·
`focused-audit.txt` · `focused-audit-observability.txt` · `focused-durability.txt` ·
`focused-docs-and-security.txt` · `focused-postgres-restored.txt` · `focused-gates-db.txt` ·
`focused-unseeded-gates-db.txt` · `full-suite.txt` · `full-suite-golden-seeded-dev-db.txt` ·
`full-suite-server-down.txt` · `full-suite-wrong-cluster.txt` · `coverage.txt` · `gate-summary.txt`
