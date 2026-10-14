# TSK-42 / TSK-50 — shipped-payload budget sweep (2026-10-14)

Closes `tasks.md` **TSK-42 box 1** (the two un-substantiated §6 sweep claims, measured as tests) and
advances **TSK-50 boxes 1–2** (procedure steps 1–3 executed, medians archived, miss recorded as named debt).
TSK-50 box 3 is deliberately **not** closed — see "What this does not claim".

## What was unmeasured before

`docs/audit/performance-budgets.md` froze four byte budgets and a TTFB budget, and `docs/design-debt-register.md`
DEBT-008 sat at `TARGET` with the note "no measurement artifact exists". `report.md §6` left two sweep claims
un-substantiated: shipped stylesheet size against those budgets, and the extent of unescaped interpolation into
rendered HTML.

## Method

**Byte budgets** — `tests/unit/performance-budget-measurement.test.ts` (see "Reproduce"). The stylesheet figure is taken
from the constant the server actually ships (`CANONICAL_STYLESHEET`, `src/web/styles/index.ts:15`), and the page
figures are taken over HTTP from a booted server, so the measurement describes the served artifact, not a guess
about it.

**Interpolation census** — `tests/unit/html-escape-census.test.ts` recounts by a published rule and ratchets.

**Timing** — measured by `measure-perf.mjs` and archived here, **not** asserted in the suite. A TTFB assertion
inside the gate would make the suite environment-dependent, and this repository's rule 0.4a already prohibits
passing a sandbox number off as a production one.

### Reproduce

```
pnpm build
DATABASE_URL=postgresql://root@localhost:5432/vmnl_enterprise_gates?schema=public \
  pnpm vitest run tests/unit/performance-budget-measurement.test.ts tests/unit/html-escape-census.test.ts
DATABASE_URL=postgresql://root@localhost:5432/vmnl_enterprise_gates?schema=public \
  node docs/audit/evidence/tsk42-budget-sweep-2026-10-14/measure-perf.mjs
```

The second command prints the raw rows in `measurements.txt`. Byte figures reproduced identically on re-run;
TTFB varies (5–15 ms) as expected.

### Environment

- Bundle: `pnpm build` (tsc only — the repository has no bundler and therefore no minification step).
- Database: `vmnl_enterprise_gates`, migrated, without the golden catalogue seed.
- Server: `createApiServer(0)` on loopback, warm process, three samples per surface, median reported.
- Encoding: `Accept-Encoding: identity` for the budget verdicts, plus one gzip-negotiated request to settle what
  "transfer" means for this server.
- Candidate HEAD at measurement time: recorded at the top of `measurements.txt`.

## Results

| Budget | Target | Measured (identity) | Verdict |
|---|---|---|---|
| Public page shell `/` | ≤ 25 KB | 20,308 B | MET |
| Public page shell `/channels/nxtr` | ≤ 25 KB | 17,945 B | MET |
| Critical-path HTML, SCR-BCST-01 `/broadcast/dashboard` | ≤ 65 KB | 21,162 B | MET |
| Shipped stylesheet `/assets/styles.css` | DEBT-008 wording: ≤ 25 KB | 212,853 B | **MISSED, 8.3×** |
| Operational screen view total (HTML + CSS + JS) | ≤ 120 KB | 250,409 B | **MISSED over identity** |
| Same, gzip negotiated | ≤ 120 KB | 47,352 B | MET |
| Server TTFB (warm, loopback) | ≤ 200 ms | 11–15 ms | MET — sandbox only |

Two gzip numbers appear in `measurements.txt` and they are not in conflict: **39,885 B** is `zlib` at level 9
computed locally in the harness, **40,611 B** is what the server actually puts on the wire. The server number is
the one quoted in the records, because that is the one a client pays.

### The 403 row

`SCR-BCST-23` (`/broadcast/playout/live`, `primaryRole: PlayoutOperator`) answers **403 to a SuperAdmin session**.
It is recorded, not silently dropped: the per-view total therefore uses SCR-BCST-01, which SuperAdmin may see.
Whether a SuperAdmin should be denied a MCR monitor is an authorization-scoping question owned by
`TSK-28`/`HD`-class decisions, not something this sweep settles.

## Interpolation census

Rule, stated so it can be recounted: within `src/web/**/*.ts`, count `${identifier}` / `${a.b}` interpolations on
a line that contains markup (`<` or `>` followed by a letter) and does not mention `escapeHtml(`. Expressions with
calls, ternaries, literals or nested templates are excluded because shape alone cannot classify them.

**Measured: 299 sites across 32 files.** Top eight files carry 163 of them:
`src/web/public/hub.ts` 33 · `src/web/broadcast/index.ts` 25 · `src/web/public/screens-view.ts` 24 ·
`src/web/workspace/creative-hub-extended.ts` 20 · `src/web/workspace/surface-bc.ts` 19 ·
`src/web/portal/vtm-portal.ts` 15 · `src/web/public/dashboard.ts` 14 · `src/web/public/admin-feature-flags.ts` 13.

**This is a ceiling, not a vulnerability count.** Numeric fields (`${s.totalAiredSpots}`), CSS tokens (`${color}`),
and locals escaped earlier all appear in it. The census does not claim any listed site is exploitable, and it does
not claim any is safe — triaging which sites carry externally-sourced strings is the first burn-down step and is
recorded as such in DEBT-009.

The same test proves the mechanism the ceiling assumes exists: `escapeHtml` neutralises `<`, `>`, `&`, `"` and `'`,
so text, attribute and URL break-out characters are handled wherever the helper is actually called. `escapeHtml`
has **395** call sites in `src/web` and `src/api` today.

## Decision

- DEBT-008's status changed from `TARGET` to `MEASURED MISS` with its owner (Lead Frontend Architect) and expiry
  (2026-12-31) unchanged — the budget is not weakened to accommodate the stylesheet.
- DEBT-009 opened for the unescaped-site ceiling, ratchet-pinned by the test so it cannot silently grow, following
  the same discipline as `scripts/explicit-any-budget.js`.
- Both `report.md §6` sweep claims now have numbers and tests; `tasks.md` TSK-42 boxes 1 and 2 are marked with them.

## What this does not claim

- **TSK-50 box 3 is not closed.** G-gate §7.7 stays `NOT_RUN`: the per-view budget is missed outright over
  identity encoding, and the only passing TTFB number came from a warm loopback sandbox. A `PASSED` gate on these
  artifacts would be a false claim.
- **No LCP/sub-2.5s claim.** DEBT-008's rationale mentions throttled 3G LCP on Nigerian carriers. Nothing here
  measures LCP or a throttled network; only byte counts and local TTFB.
- **Not a production measurement.** No CDN, no real carrier RTT, no concurrent load, unseeded database.
- **No CSS pipeline fix was attempted.** Shipping a smaller stylesheet (split, purge, minify) is the actual remedy
  and is frontend work, not audit work.
- **The census is not a security finding.** Calling 299 sites "XSS candidates" would overstate what a line-shaped
  rule can see.
