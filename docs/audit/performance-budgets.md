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
