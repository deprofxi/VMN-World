# TSK-11 box 6 follow-up — served broadcast screens take engine snapshots (2026-10-12)

**What changed.** `src/web/broadcast/index.ts:800` has accepted a live engine snapshot
since TSK-11, and `src/modules/broadcast/screens/data.ts:29-34` declares the four panels
it can project. The router never passed one: `src/api/router.ts` called
`renderBroadcastScreenHtml(screen, params, role)` with three arguments, so every served
desk printed `NOT_CONNECTED` for all four panels no matter what the process held. The
route now calls `buildScreenEngineSnapshot(context)` as the fourth argument
(`src/api/router.ts:3553`), and that builder (`:406`) projects the two panels this process
can honestly source:

| panel | source in the served process | status |
| --- | --- | --- |
| `billingTotals` | `context.billingEngine.listBillingSchedules()` (new accessor, `src/modules/broadcast/billing/index.ts:155`), mapping `totalContractValueNgn` | **projected** |
| `sponsorshipAudit` | `context.sponsorshipEngine.getFulfillmentReport()` on the instance hydrated from durable bindings at boot (`src/api/server.ts:335`) | **projected** |
| `asRunSummary` | no route ingests as-run logs: `ScheduleRepository.recordAsRun` has 0 `src/` callers, the only rows are seed fixtures | **not projected** |
| `playoutStatus` | `PlayoutAutomationEngine` holds no on-air / playlist-lock state and there is no machine adapter | **not projected** |

**Measured served census** (`served-census.txt`, reproducible with
`node measure-served-census.mjs`): **31 / 33** screens still show at least one
`NOT_CONNECTED`/`PROVISIONAL` badge (was 33/33 renderer-level) and **2 / 33** serve a
`DOMAIN_ENGINE` `SOURCE:` badge — SCR-BCST-02 (channel registry, pre-existing) and
**SCR-BCST-20**, the sponsorship desk, which is the first served screen whose entire KPI
strip reads a hydrated durable source and therefore carries no unsourced badge.
SCR-BCST-21/31 stay `NOT_CONNECTED` for booked revenue in that measurement because a
freshly booted instance holds no billing schedule — `CommercialBillingSchedule` is not a
durable store. The HTTP test proves the projection when a schedule does exist.

**Gates, all exit 0 on this tree.** `typecheck.txt` · `lint.txt` · `build.txt` ·
`full-suite.txt` (**68 files / 813 tests**, 27.39 s) · `coverage.txt` (same 68/813,
**79.04 / 70.50 / 82.94 / 80.33** against floors 73/62/77/72 — no floor moved) ·
`focused-run.txt` (5 instrument files, 76 tests). This is the clean exit-0 coverage run
that TSK-11's 2026-10-11 closure evidence recorded as not yet achieved.

**Not claimed.** Box 6 stays open. The register entry `UX-BR-001..033` is `MOCK` and the
box requires it to move, which needs (a) the remaining panels to have real sources — that
is an ingestion decision, not a wiring one — and (b) a register vocabulary for
"authorization-gated, canonical fields, explicit NOT CONNECTED for unbound feeds", which
is **TSK-60 box 4**. Also recorded, found while measuring and deliberately not touched:
`/broadcast/dashboard` is answered at `src/api/router.ts:2973` by a legacy honest-but-unbadged
page ahead of the screen matcher, so SCR-BCST-01's provenance strip is never served on its
own route. It is authenticated (anonymous → rejected, `tests/security/route-authorization.test.ts:189`)
and prints no invented figures, so removing it is a surface decision for the owner, not a
data-integrity fix.

Every figure in these files with the command that reproduces it: `measurements.txt`.
