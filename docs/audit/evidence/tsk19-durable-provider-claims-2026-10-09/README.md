# TSK-19 closure gates — 2026-10-09

`tasks.md` Rule 0.1 requires a DONE claim to carry code, an executable behaviour test, the gates exit-0
**on the same tree**, and an evidence artifact. This directory is that artifact for TSK-19 (durable
webhook event dedup, `audit.md` AUD-07's open half): the six gate outputs, the two suites that carry the
new provider-claim assertions on their own, and the migration state the additive phase-2 column was
closed against.

**Baseline:** commit `ce098f8` plus the working-tree dirty set, reproduced by
`git status --porcelain | awk '{print $1}' | sort | uniq -c` — **126 modified / 61 untracked entries /
2 deleted = 189 paths** at the moment these files were written (the figure does not count this
directory's own contents; re-run the command and it will, which is why the pin publishes the command
rather than the number alone). The tree is **not committed**: TSK-09's commit series is deferred
pending owner authorization.

**Environment:** Postgres reachable on `localhost:5432` (`vmnl_enterprise`), no Redis, so the KV
`setIfAbsent` mirror runs on its in-memory fallback while the **durable** claim is the thing under test.
Vitest sets `NODE_ENV=test` itself; plain `pnpm test` is the correct command — sourcing `.env` first
exports `NODE_ENV=development` and fails ~80 route-guard tests (recorded in
`docs/audit/evidence/baseline-2026-10-08/README.md`; a measurement error, not a regression). The restart
test additionally needs the compiled `dist/` artifact, which `pnpm build` produced before it ran.

| File | Command | Result |
|:---|:---|:---|
| `tsc.txt` | `pnpm typecheck` (`tsc --noEmit`) | exit 0, 0 errors |
| `lint.txt` | `pnpm lint` (`eslint . --max-warnings 0`) | exit 0 |
| `build.txt` | `pnpm build` (`tsc`) | exit 0 |
| `test-run1.txt` | `pnpm test` | exit 0 — **65 files / 742 tests passed, 0 failed, 0 skipped, 0 unhandled errors** |
| `test-run2.txt` | `pnpm test`, immediately again, same tree, same now-dirty database | exit 0 — **65 / 742**, identical |
| `test-coverage.txt` | `pnpm test:coverage` | exit 0 — 65/742 and **78.48 statements / 69.86 branches / 82.24 functions / 79.76 lines** against the pinned floors 73/62/77/72 (`vitest.config.ts`) |
| `provider-claim-suites.txt` | `pnpm vitest run tests/unit/durability-release-critical.test.ts tests/unit/audit-remediation-regressions.test.ts` | exit 0 — **29 tests passed** (17 restart-boundary + 12 remediation regressions) |
| `migrations.txt` | `npx prisma migrate status` and `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` | **9 migrations found · Database schema is up to date!** · diff prints `-- This is an empty migration.` (zero drift) |

## Why the suite was run twice

A durable dedup table is shared state: it outlives the process that wrote it, which is the point. Run 1
and run 2 against the same now-dirty development database are therefore part of the measurement, not
decoration — the provider-claim loop in `durability-release-critical.test.ts` mints a real
`(provider, eventId)` row and would collide with itself on a second run if the fixture were not owned.
Both runs are identical: **65 files / 742 tests, 0 failed, 0 skipped.**

## The two-phase claim, and what the tests actually pin

`ProviderEventClaim` (`prisma/schema.prisma:851`) enforces `@@unique([provider, eventId])` at the
database, so dedup no longer depends on a Redis that can be flushed. The write layer is
`src/core/database/repositories/release-critical.repository.ts`: `claimProviderEvent` **:907**
(create at **:911**, `P2002` → atomic takeover `updateMany({ where: { id, ingestedAt: null } })` at
**:917**), `markProviderEventIngested` **:931** (at **:933**), `releaseProviderEventClaim` **:945** (at
**:946**). The orchestration is `src/core/websecurity/index.ts` — `claimProviderEventOnce` :157 (durable
call at :169), `confirmProviderEventIngested` :201 (at :207), `releaseProviderEventClaim` :226 (at :232) —
and the two production webhook handlers call the confirm at `src/api/router.ts:7843` (Paystack) and
`:7935` (Flutterwave).

Splitting *claim* from *ingest* is what makes the box honest rather than cosmetic. A single-phase "insert
a row to mean I saw this event" design strands a payment: if the process dies after the insert and
before the credit is applied, every retry from then on reads the row, calls it a replay and refuses —
the money is never reconciled. With `ingestedAt` nullable (`prisma/schema.prisma:857`), a retry that
finds an **unstamped** claim takes it over atomically and re-runs ingestion; a retry that finds a
**stamped** claim is refused as replay. `audit-remediation-regressions.test.ts` pins exactly that
reprocessing case, and the restart test pins the stronger claim: it crosses a real OS-process boundary
and asserts the row comes back with `replayRefused: true` **and** a parseable `ingestedAt`, i.e. the
stamp itself, not just the claim, survives.
