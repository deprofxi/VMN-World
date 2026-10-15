# TSK-20 — every process-memory store is labelled, and the labelling is checked

Closed 2026-10-13. Baseline `ce098f8` + the dirty working set (**201** `git status --porcelain`
entries, 362 with `--untracked-files=all`). **Nothing here is committed and no remote is pushed to** —
commit and push are the owner's decision.

## The finding, in one sentence

TSK-17 made ten release-critical domains durable and left the other **30** entity families exactly
where CA-12 found them — in module-level `Map`s that are the *only* copy — but nothing in the repo
said which screens and journeys depended on one, so `docs/audit/journey-readiness-matrix.md` could
print `IMPLEMENTED` in a Persistence column for a journey whose data dies with the process, and
`docs/handoffs/LATEST.md` could call a `Map` a "memory fallback" as if a table were waiting behind it.
This task made the label machine-derived from `docs/domain/systems-of-record.md` §3.3 and put it on the
register, the readiness matrix and the handoff — then instrumented all three so a label cannot be
added without evidence or removed without failing CI.

## What changed (every pin opened before it was written down)

| Behaviour | Where |
|:---|:---|
| §3.3 is the authority, and it grew | `docs/domain/systems-of-record.md` §3.3 from 18 to **30** rows; rows 19-30 accepted only after `grep` proved **0** references for 16 entity types in `prisma/schema.prisma` *and* `src/core/database/repositories/`, no `hydrate*` export, and `new` inside `createServer` (`src/api/server.ts:165-167`, `:254-263`) |
| The register publishes a copy of it | `docs/decisions/screen-register.json` `sandboxState` — `authority`, `measuredAt`, `meaning`, `derivation`, 30 `families` (`id`/`entity`/`stores`/`anchors`), `coverage`, `limits` |
| Screens carry the label, derived not asserted | `dataState: "sandbox-state"` + `sandboxFamilies` on **30** entries → **147** of the 226 documented IDs; a family attaches only when the entry's own `evidence` contains one of its anchors |
| The tallies are computed | `computeSandboxCoverage()` `src/core/config/screen-register.ts`, `SandboxStateFamily`/`SandboxCoverage` types; `computeScreenRegisterCounts` moved `:69-82` → `:112-127` (Rule 9 re-pin in `tasks.md:934`, `report.md:102` left as the historical finding) |
| The matrix speaks the same vocabulary | `docs/audit/journey-readiness-matrix.md` **R1.1**: `D2`/`D1`/`sandbox-state`/`BLOCKED` legend, **16 of 17** Persistence cells rewritten, 30-row family → journey parity table |
| The handoff no longer calls memory a persistence mode | `docs/handoffs/LATEST.md` — eight sentences corrected (SEC-04, SEC-05, SCR-18 ×2, SCR-19, the rights-review bullet, and both "Known Operating Conditions" bullets) |
| Seed labels: kept, reasoning fixed | `seedStatLabel` `src/db/migrate-and-seed.ts:288` unchanged (pinned at `tests/unit/todo-final-remediation.test.ts:2269-2272`); its doc comment no longer claims DAM "never touches a table" — the CLI never *drains* (`src/core/storage/index.ts:328` stages, `src/api/server.ts:422` flushes at boot) |

## Measurements

`sandbox-state-inventory.txt` — every figure in it is recomputed by `inventory.mjs` through
`src/core/config/screen-register.ts`, the same module the register serves; nothing is hand-tallied:

```
systems-of-record.md §3.3 rows (authority)      : 30
screen-register.json sandboxState.families      : 30
register entries labelled sandbox-state          : 30
documented IDs carrying the label                : 147
documented IDs total (all statuses)              : 226 from 60 entries
families with NO labelled screen                 : proof-of-air-registry, bank-reconciliation,
                                                   broadcast-traffic, playout-cache
matrix: §3.3 family ids the matrix never names    : none
matrix: parity-table rows                         : 30
```

`gate-summary.txt` — typecheck / lint / build / test / coverage all exit 0 on the final tree, **68 files
/ 822 tests / 0 skipped**, coverage floors 73 / 62 / 77 / 72 untouched (+3 tests on TSK-18's 819 pin,
all three in `systems-of-record.test.ts`: 6 → 9).

## The instrument bites (negative evidence, in `instrument-runs.txt`)

A parity check that has never been seen red is a decoration. Two mutations of
`docs/audit/journey-readiness-matrix.md` were applied, run, and reverted:

1. `queue-jobs` → `queue-jobz` in the parity table → `AssertionError: §3.3 families the matrix never
   names: expected [ 'queue-jobs' ] to deeply equal []`.
2. `sandbox-state (routing-rules)` → `process memory only` in J-RL1-13's Persistence cell →
   `AssertionError: Persistence cells that describe process memory without labelling it: … "J-RL1-13"`
   (backticked spans are stripped first, so a cell *quoting* an old claim is not punished for it).

Both reverted to `9 passed (9)`. The register's own derivation is bidirectional: an entry whose evidence
names a store but carries no label is as red as a label the evidence cannot anchor — which is how
`UX-BR-012` came to be **un**-labelled (reading `renderBroadcastScheduleReviewHtml` showed it renders
channel/episode-master state and fixed blocker copy, touching neither Map).

## Stated limits

1. **Four families have no register screen** whose evidence names them (`proof-of-air-registry`,
   `bank-reconciliation`, `broadcast-traffic`, `playout-cache`) — they are reached through engines,
   fixtures and the ledger. Recorded in `sandboxState.limits`; a labelling residual, not a clean bill.
2. **Five families have no journey row** (`queue-jobs`, `aos-agent-runs`, `headspace-library`,
   `cr8tech-jobs`, `source-mappings`). Making them journeys is a `DEC-RL1-SCOPE-001`-class decision, so
   they are named rather than invented.
3. Labelling is not durability. Nothing here moves an entity from `M` to a table; that is TSK-17's
   unfinished half, and the clean-instance verification is TSK-06's `[B]`.
4. `source-mappings` is the weakest row in §3.3 — its own recovery path says "it is configuration", so
   the label means *not hot-reloadable*, not *user data at risk*.
5. The matrix's Gate column is unchanged for all 17 rows. This task made the documents say **less**,
   not more; no row got greener.

## Reproduce

```bash
DATABASE_URL=postgresql://root@localhost:5432/vmnl_enterprise_gates?schema=public \
  pnpm vitest run tests/unit/systems-of-record.test.ts tests/unit/screen-register-verification.test.ts
node --experimental-strip-types \
  docs/audit/evidence/tsk20-sandbox-state-labelling-2026-10-13/inventory.mjs
```
