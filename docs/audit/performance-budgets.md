# Performance Budget Record — TODO-PRC-04

**Document:** `VMNL-AZP-VMN-PERF-BUDGET-001 — R1.0`
**Authority:** VMNL-AZP-VMN-UIUX-CCPP-001 §7.7 — budgets fixed before acceptance; a claim of "TESTED & PASSED" without a measurement artifact is prohibited (Canonical Law 20).

## Status of DEBT-008

The design-debt register entry DEBT-008 previously claimed budgets of 65KB (critical path) / 25KB (public page shell) were **"TESTED & PASSED"**. No measurement artifact existed in the repository. Per TODO-DOC-07, that claim is downgraded to **TARGET** by this record until a measurement harness produces an artifact.

## Fixed budgets (targets until measured)

| Budget | Target | Device / network | Dataset | Owner |
|---|---|---|---|---|
| Critical-path HTML (server-rendered, uncompressed) | ≤ 65 KB | Mid-range Android / 3G Fast (400ms RTT, 400kbps) | Broadcast screen SCR-BCST-01 rendered page | Frontend lead |
| Public page shell (HTML + inline critical CSS) | ≤ 25 KB | Mid-range Android / 3G Fast | `/` and `/channels/nxtr` | Frontend lead |
| Total transfer per operational screen view | ≤ 120 KB | 3G Fast | Any `/broadcast/*` screen incl. stylesheet | Frontend lead |
| Server TTFB (sandbox, warm) | ≤ 200 ms | Local loopback | `/`, `/workspace/my-work` | Platform lead |
| Interactive for MCR emergency filler action | ≤ 3 s | 3G Fast | SCR-BCST-23 | MCR product owner |

## Measurement procedure (to be executed before the §7.7 gate closes)

1. Run the production build (`docker-compose` profile or `NODE_ENV=production node dist/api/server.js`).
2. For each budgeted surface: `curl -s -o /dev/null -w '%{size_download} %{time_starttransfer}' -H 'Accept-Encoding: identity' URL` three times; record the median.
3. Archive raw outputs under `docs/audit/evidence/perf-<date>/` with the candidate commit SHA.
4. A budget is **PASSED** only when the median is within target on the recorded dataset; otherwise the surface is a named debt with an owner and expiry in `docs/design-debt-register.md`.

Until step 3 artifacts exist, all budget claims remain **TARGET**, and G-gate §7.7 stays **NOT_RUN** in every completion claim.

## Measured 2026-10-14 (TSK-42 / TSK-50 step 1–3)

Executed against the compiled bundle (`pnpm build`, then `node dist/...` via `createApiServer(0)`) on the migrated,
unseeded gates database, three samples per surface, `Accept-Encoding: identity` unless stated. Reproduce with
`pnpm vitest run tests/unit/performance-budget-measurement.test.ts`; raw figures in
`docs/audit/evidence/tsk42-budget-sweep-2026-10-14/measurements.txt`.

| Budget | Target | Measured (identity) | Verdict |
|---|---|---|---|
| Public page shell `/` | ≤ 25 KB | 20,308 B | **MET** |
| Public page shell `/channels/nxtr` | ≤ 25 KB | 17,945 B | **MET** |
| Critical-path HTML (SCR-BCST-01 `/broadcast/dashboard`) | ≤ 65 KB | 21,162 B | **MET** |
| Shipped stylesheet alone `/assets/styles.css` | ≤ 25 KB (DEBT-008 wording) | 212,853 B (40,611 B as the server actually gzip-encodes it) | **MISSED — 8.3×** |
| Total transfer per operational screen view (HTML + CSS + JS) | ≤ 120 KB | 250,409 B | **MISSED over identity; MET only when gzip is negotiated (47,352 B)** |
| Server TTFB (warm, loopback) | ≤ 200 ms | 11–15 ms median | **MET (sandbox only — not a production measurement)** |

The miss is recorded as **DEBT-008** with owner and expiry in `docs/design-debt-register.md`. G-gate §7.7 is **not**
flipped by this record: the per-view budget is missed, and the TTFB figure is a sandbox loopback number, so a §7.7
`PASSED` claim would not be evidence-backed. Note for TSK-39: this document's header cites `CCPP §7.7`, which is one
of the sub-sections TSK-39 records as not existing in the numbered CCPP.

## Measured 2026-10-16 (TSK-62 — the same budgets against golden-seeded data)

The 2026-10-14 sweep measured a **migrated, unseeded** database, where `/channels/nxtr`
renders its empty states. Production databases are not empty, so TSK-62 re-measured the two
public-shell surfaces and TTFB against a golden-seeded database (`<testdb>_perfseed`:
200 episode masters, 251 media assets, created and seeded by the test itself — the
development database is never touched). Reproduce with
`pnpm vitest run tests/unit/performance-budget-seeded-data.test.ts`; raw figures in
`docs/audit/evidence/perf-2026-10-16/measurements.txt`.

| Budget | Target | Measured (identity, seeded) | Verdict |
|---|---|---|---|
| Public page shell `/` | ≤ 25 KB | 20,308 B | **MET** (byte-identical to the unseeded figure — the shell is static) |
| Public page shell `/channels/nxtr` | ≤ 25 KB | 72,026 B | **MISSED — 2.8×** → **DEBT-010** (unseeded: 17,945 B, MET) |
| Server TTFB (warm, loopback) | ≤ 200 ms | 9–11 ms median across runs | **MET (sandbox only — not a production measurement)** |
| Server TTFB (cold, first request after boot) | no frozen budget | 1,153 ms and 1,841 ms across runs; 2,967 ms / 7,221 ms in same-day standalone probes; one probe exceeded a 15 s test timeout under machine load | **Recorded, not budgeted** — cold-start render time has no frozen target; freezing one is a §7.7 owner decision |

The seeded misses are named as **DEBT-010** (channel page) with owner and expiry in
`docs/design-debt-register.md`; the assertion that found it
(`tests/unit/performance-budget-seeded-data.test.ts`) fails if the page ever comes back
inside the budget without the debt row being closed, and fails if the miss is ever
unrecorded. G-gate §7.7 remains **unflipped** for the reasons TSK-50 records: the per-view
and stylesheet budgets still miss (DEBT-008), the channel page now misses on realistic
data (DEBT-010), and every TTFB figure here is a loopback sandbox number. What changed is
that the artefacts behind the numbers now exist in the repository, which is the precondition
this document set for leaving `NOT_RUN` — the flip itself stays with the gate owner.

