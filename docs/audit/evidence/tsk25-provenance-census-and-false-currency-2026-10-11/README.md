# TSK-25 — provenance-banner census, and the false-currency claims it exposed

Measured and closed 2026-10-11 (UTC 11:52–12:0x) · baseline `ce098f8` + the dirty working set.
Nothing committed; `git remote -v` prints nothing — commit series is TSK-09, push is the owner's call.

## The question the audit left open

`report.md:303` recorded **"Only 3 of 33 broadcast screens emit the mock-data provenance banner"** as
UNCONFIRMED: `renderMockDataBanner` has one call site (`src/web/broadcast/index.ts:1163`) inside the
shared per-screen template, and six screens substitute a bespoke domain panel, so the open question was
whether those six bypass it. `tasks.md` §10 and TSK-11's box 5 carried the same open question.

## Answer, by rendering rather than reading

`tests/unit/broadcast-provenance-coverage.test.ts` (7 tests) walks `BROADCAST_SCREEN_INVENTORY`, serves
each screen through `renderBroadcastScreenHtml` for a role the renderer's own authorization rule
admits, and counts markers in the returned bytes. Printed census (identical in `full-suite.txt` and
`coverage.txt`):

```
[TSK-25] screens 33 · banner 33 · without 0 · bespoke panels 6 · invented-KPI fallback 0
```

| Figure | Measured |
|:---|:---|
| Registered screens | **33** |
| Screens serving `vmn-provenance-banner` | **33 / 33** (default, empty, error and loading states) |
| Bespoke panels — `SCR-BCST-12` `:449`, `-23` `:539`, `-22` `:593`, `-24` `:680`, `-14` `:761`, `-31` `:816` | **6**, none bypasses the banner: they substitute `panelContent` only |
| Screens served with an engine-sourced KPI strip (`vmn-kpi-strip`) | **0 / 33** |
| Production call sites of `getScreenData` / `renderScreenKpis` | **0** — the honest provenance layer is unreachable from any served page |
| Screens taking the invented `SLA Compliance 100%` default at `:918-922` | **0** — every registered screen declares an entry, so the default is unreachable for this inventory |
| Anonymous request | 403 render, no banner, no KPI block |

So "3 of 33" was false, and false in the direction that hid the real problem: the *label* is universal,
the *engine data* is absent, which is what confirms `report.md:90`'s "0 of 33 screens show engine data"
and names its mechanism. TSK-11's remaining boxes are wiring work, not labelling work.

## What the census found next to it (fixed in the same increment)

`src/web/public/screens-view.ts` asserted the opposite of the census:

- `33 of 33 Screens Ready` → now `33 registered · 0 engine-sourced · demonstration data`;
- `PRD R1.2A (§46) Verified` on every screen spec → `PRD R1.2A §46 registered — data-source wiring NOT_VERIFIED`;
- an `Audit & Quality Gate Clearance` block claiming registration in the release gate registry
  (Gate 0–3) and validation under tri-party sign-off (CEO, COO, StarTimes Lead) → `Registration & gate
  status`, stating that **registration is not clearance**, that **DG-RL1-06 is OPEN** (owner Broadcast
  Director, expiry 2026-10-31) per `docs/audit/design-gate-closure-records.md:14`, and that no sign-off
  has been recorded;
- the withdrawn **S2** tier printed as a live stat → `Sandbox — S2 tier claim withdrawn pending TSK-06`.

Three tests were enforcing the fabricated strings (`tests/unit/public-surfaces.test.ts:282`,
`tests/integration/enterprise-end-to-end.test.ts:162`,
`tests/a11y/visual-regression-baseline.test.ts:117`). Per Rule 0.3 the assertions were **not** relaxed:
they now assert the corrected text *and* that the fabricated labels are absent, and
`broadcast-provenance-coverage.test.ts` fails if any of them returns.

## Gates, one tree, serial, output redirected to files

| Command | Exit | Result |
|:---|:---|:---|
| `pnpm typecheck` | 0 | `typecheck.txt` |
| `pnpm lint` (`--max-warnings 0`) | 0 | `lint.txt` |
| `pnpm test` | 0 | `full-suite.txt` — **67 files / 772 tests**, 0 failed, 0 skipped, 51.98 s |
| `pnpm test:coverage` | 0 | `coverage.txt` — **67 / 772**, **78.65 / 70.11 / 82.38 / 79.94** against floors 73/62/77/72, 152.88 s |
| `pnpm build` | 0 | `build.txt` |

`coverage-attempt1-timeout.txt` is kept: the first coverage attempt failed
`tests/unit/extended-workspaces.test.ts:373` with *Test timed out in 60000ms* while the run reported
**956.91 s of test time** for a suite that measures 32 s uninstrumented — contention with the suite
whose teardown had not fully released the shared Postgres. The idle re-run passed the same 772 in
79.76 s of test time. Recorded, not deleted, per Rule 0.4a.

## Accident worth stating, because the fix is part of this evidence

While patching `src/web/public/screens-view.ts` a `substring(a, b)` with `b < a` silently reversed its
range and deleted ~130 lines, taking the file's codemod-migrated markup with it. Recovery: restored the
file from HEAD and re-ran `node scripts/migrate-inline-styles.mjs --root src/web/public` (TSK-48's
deterministic, idempotent codemod), verified by a dry run first — `files changed: 1`, `migrated static
attributes: 68`, `utility classes in the sheet: 1399` (unchanged, so every class already existed), and
`git diff --stat` showing 68/68 attribute-line replacements and no other file touched. `npx tsc --noEmit`
and the full suite then passed. The honesty edits were re-applied afterwards by exact-string replacement
with forward bounds only.
