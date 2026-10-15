# TSK-60 box 3 — the client portal's money half is durable

Closed 2026-10-11 (code + tests), gates re-run on the finished tree 2026-10-12.
Baseline `ce098f8` + the dirty working set (**196** `git status --porcelain` entries, 297 files with
`--untracked-files=all`). **Nothing here is committed and `git remote -v` prints nothing** — commit and
push are the owner's decision.

## The finding, in one sentence

TSK-13 rewired the client counterparty portal to canonical `QuoteToCashSalesEngine` deals, and in doing
so published a `SOURCE:` line naming an in-process `Map`: restart the process and the portfolio a
counterparty was shown vanishes, which is the same "sandbox state is not persistence" failure TSK-17 was
raised for — registered as TSK-60 box 3 rather than left implied by the portal's honesty.

## What changed (every pin opened in `measurements.txt`)

| Behaviour | Where |
|:---|:---|
| Durable row per deal, money in named NGN columns | `model SalesDealRecord` `prisma/schema.prisma:888` — 18 columns, 5 `*Ngn Decimal(14,2)` counters, indexes `[clientOrgId, stage]` + `[updatedAt]` |
| Additive migration, applied not edited | `prisma/migrations/20261011220000_add_durable_sales_deal_portfolio/migration.sql` (36 lines: 1 `CREATE TABLE`, 2 `CREATE INDEX`); `prisma migrate status` → 11 migrations, up to date |
| Registered with the write-behind journal | `registerDurableStore<SalesDeal>("salesDeal", persistSalesDeal)` `src/modules/finance/sales/index.ts:28` — the **14th** store in `src/` |
| Every mutator stages through one seam | **7** `this.stageDeal(...)` sites `:94 :125 :151 :168 :189 :215 :263` → `stageDurableWrite<SalesDeal>` `:106` |
| A rejected row does not stay projected | `stageDeal` rollback `:110-116` — `Object.assign(deal, prior)` for a mutation, `deals.delete(id)` for a create |
| Boot fills the instance the routes already hold | `hydrateSalesEngine(salesEngine)` `src/api/server.ts:339` (engine constructed `:169`; telemetry counts `sales.deals` `:346`, payload `:352`) |
| A restart cannot invent an approval | `loadSalesDeals` `...release-critical.repository.ts:994` maps 5 NULL columns to **absent fields**, not to zero-dates or placeholder URLs |
| Portal provenance names the store, not the Map | `src/web/portal/client-portal.ts:106` (list) and `:245` (detail) |

## Tests

`tests/unit/durability-release-critical.test.ts` — **19 tests**, of which two are new. Both drain the
journal, then spawn `node tests/helpers/durable-restart-reader.mjs salesDeal <id>` (branch `:91`) as a
**fresh OS process** against compiled `dist/src`, assert `database: true`, and read the deal back
through the engine's own `hydrate()`. A value that survives that boundary did not come from the writing
process's memory.

- `:529` *"persists a signed deal through cash and recognition with every money counter exact"* —
  7,500,000.50 contract / 2,500,000.25 deposit / 5,000,000.25 invoice / 5,000,000.00 cash / 0.25
  recognized, **to the kobo**. The quarters are deliberate: no assertion leans on float tolerance. Stage
  `REVENUE_RECOGNIZED`, `clientOrgId`/`dealName`/`createdAt`/`proofDocumentUrl` exact, and law 7's cap
  `recognizedRevenueNgn ≤ totalContractValueNgn`.
- `:578` *"does not invent an approval stamp or proof document a deal never had"* — the register's
  "this record does not manufacture missing business approval" rule, as a test.

The suite's journal census rose to `persisted ≥ 14` with `failed = 0` and `sandboxDeferred = 0`: every
staged deal write was reported persisted, none deferred. That is a live-Postgres result, not a
sandbox-state claim (rule 0.4a).

`tests/unit/client-portal-and-operations.test.ts` — when the `SOURCE:` line changed, the assertion was
**tightened** to the full durable provenance string rather than relaxed (rule 0.3), and the leak-probe
deal (`DEAL-TSK13-LEAKPROBE`) is now reset before and after the suite.

## Repeatability was the real cost of making this durable

Deals that persist outlive the suite that created them: the second run failed with
`[QTC-DEAL-01] Deal 'DEAL-TSK13-LEAKPROBE' already exists`, surfaced as 500/503 rather than as a portal
gate. Fixed at the fixture layer, not by disabling the store:
`tests/helpers/db-parents.ts:78` gained a `dealIds` scope;
`tests/integration/enterprise-end-to-end.test.ts:87` deletes its deal fixtures **after** `app.stop()`,
because the journal drain at stop re-writes a row cleared earlier;
`tests/unit/client-portal-and-operations.test.ts:97` resets `SalesDealRecord` rows so an interrupted run
cannot strand a durable row. Both files then passed twice.

## Gates, same tree, serial, output to files (never piped through `tail`)

| Command | Exit | Measured |
|:---|:---|:---|
| `pnpm typecheck` | 0 | `typecheck.txt` — 0 errors |
| `pnpm lint` (`--max-warnings 0`) | 0 | `lint.txt` |
| `pnpm build` | 0 | `build.txt` |
| `prisma migrate status` | 0 | `migrate-status.txt` — 11 migrations, "up to date" |
| `npx vitest run` (focused five) | 0 | `focused-run.txt` — 5 files / **104** tests, 8.95 s |
| `pnpm test` | 0 | `full-suite.txt` — 67 files / **800** tests, 0 failed, 0 skipped, 354.91 s |
| `pnpm test:coverage` | 0 | `coverage.txt` — 78.96 stmts / 70.36 branches / 82.84 funcs / 80.26 lines against floors 73 / 62 / 77 / 72, **no floor moved** |

## The runs that did not pass, kept in this directory

`pnpm test` was green twice and lost exactly one test twice more — always
`Error: Test timed out in 60000ms`, never a behavioural failure:

- `full-suite-contended-1.txt` — `rights-clearance-e2e.test.ts`, 1 failed / 799 passed, 974.14 s total
  (that one test consumed 953.71 s of wall time).
- `full-suite-contended-2.txt` — `enterprise-end-to-end.test.ts`, 1 failed / 799 passed.

Both pass on their own: `rights-clearance-isolated.txt` (8 tests, 1.39 s) and `focused-run.txt`
(enterprise-end-to-end 42 tests, 0.55 s). The cause is external to this repository — **50**
`nest start --watch` processes from `/Users/deprof/www/YCN` ran across the whole session, with load
averages measured at 5.28–19.15. The per-test timeout in `vitest.config.ts` was not raised to hide it.

## What is still open (not implied closed by this)

- **TSK-60 boxes 1–2** — the delivery half. Nothing joins a booked deliverable or a per-airing
  certificate to a deal: `CommercialCampaign.clientName` (`prisma/schema.prisma:492`) and
  `ProofOfAirCertificate.clientName` (`src/modules/broadcast/asrun/index.ts:50`) are free text, and the
  portal's per-deliverable table and per-airing list still render **NOT CONNECTED**.
- **TSK-60 box 4** — the register still cannot express "surface exists, authorization-gated, renders
  canonical fields, shows an explicit NOT CONNECTED section"; that is an owner vocabulary decision.
- Durability here means *this process's writes reach Postgres and a new process reads them*. With the
  database unreachable the journal defers, writes fail closed with 503, and the surfaces say so.
