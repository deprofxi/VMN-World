# TSK-40 — design-debt register completion (2026-10-14)

**Register:** `tasks.md` TSK-40 *(CA-25, CA-22)* · **Rules applied:** 0.2 evidence before claims,
0.3 never weaken a gate, 0.5 scope discipline, 9 re-pin after any line shift.

## What was asked

Three boxes: every `DT-*` key resolvable or re-keyed; the `DEBT-004` expiry decided; `DEBT-008`
allowed to leave `TARGET` once an artifact exists.

## Box 1 — `DT-*` keys: measured census, not a recollection

Reproduce:

```
CI=1 NODE_ENV=test pnpm vitest run tests/unit/dt-decitation-keys.test.ts
```

The guard prints its own census on every run. Measured 2026-10-14:

| | count |
|:---|:---|
| distinct `DT-*` keys in live files | **42** |
| live files citing them | **21** |
| files that cited a key with no pointer to the de-citation record | **7** (6 real + 1 false positive) |
| files now carrying the pointer | **6** |

Per-file key counts, as printed by the run:

```
docs/design-debt-register.md:8      docs/design-review-gate.md:8      docs/ui-copy-standards.md:3
src/api/router.ts:4                 src/web/assets/index.ts:2         src/web/broadcast/index.ts:8
src/web/components/icons.ts:1       src/web/components/index.ts:5     src/web/components/tokens.ts:2
src/web/federation/surface-e.ts:4   src/web/public/hub.ts:7           src/web/styles/index.ts:9
src/web/workspace/surface-bc.ts:2   tests/a11y/visual-regression-baseline.test.ts:5
tests/helpers/stylesheet.ts:1       tests/unit/broadcast-screens.test.ts:7
tests/unit/public-surfaces.test.ts:2 tests/unit/styleguide.test.ts:2
tests/unit/stylesheet-resolution.test.ts:1 tests/unit/token-discipline.test.ts:3
tests/unit/tokens-contrast.test.ts:2
```

### The six re-keyed sites

Each edit is **inside an existing comment line and preserves the file's line count**. That
constraint is not cosmetic: this register and the handoffs publish **729** `src/api/router.ts:NNNN`
citations, and inserting one line into the router would invalidate all of them at once (Rule 9).

| file | line | form |
|:---|:---|:---|
| `src/api/router.ts` | 3 | appended to the existing `Authority:` line |
| `src/web/public/hub.ts` | 3 | appended to the existing `Authority:` line |
| `tests/unit/broadcast-screens.test.ts` | 3 | appended to the existing `Authority:` line |
| `tests/unit/public-surfaces.test.ts` | 54 | `// DT-202 (docs/decisions/design-task-de-citation.md) / TSK-04: …` |
| `tests/unit/stylesheet-resolution.test.ts` | 4 | sentence added to the header's third line |
| `tests/helpers/stylesheet.ts` | 5 | clause added to the existing `DT-202 / AUD-20 / TSK-04.` line |

The convention matches what the already-compliant files use (`src/web/components/tokens.ts:3`,
`tests/unit/styleguide.test.ts:3`, `src/web/styles/index.ts:3`), so no new style was invented.

### The false positive, kept visible

`src/db/seeds/golden/index.ts:120` matched a naive `DT-\d+` sweep, but the string is the AFCA course
code **`AFCA-EDT-201`**. It was not edited. The guard's key pattern is
`/(?<![A-Za-z])DT-\d{2,3}\b/` so a letter-prefixed code cannot be read as a citation — a naive
`grep -E "DT-[0-9]{2,3}"` over-reports by exactly this one file and one key.

## Box 3 — `DEBT-008`

`docs/design-debt-register.md:22` now reads `[MEASURED MISS 2026-10-14]` with the four byte budgets
restated from measurements; reproduction is `pnpm vitest run tests/unit/performance-budget-measurement.test.ts`
and the raw rows are in `docs/audit/evidence/tsk42-budget-sweep-2026-10-14/`.

**The box cited TSK-46; the artifact came from TSK-42.** DEBT-008 is the low-bandwidth payload
budget. TSK-46 is accessibility conformance claim hygiene, and its artifact
(`tests/unit/a11y-claim-hygiene.test.ts`) closes TSK-46's own boxes and nothing here. The box was
closed on the substance the register cares about — the row left `TARGET` because it was measured and
guarded — and the mis-citation is recorded rather than silently reinterpreted.

## Box 2 — left open deliberately

`DEBT-004` expires **2026-10-31**. Its three allowed outcomes (renew / resolve / accept the block)
are owner decisions under `docs/design-debt-register.md` §2.2, which makes expired debt block BG
gate clearance. Renewing it would require naming the Brand Owner and Engineering Lead as approvers;
this repository's convention is that no engineering contribution manufactures a business approval,
so the date is stated and the decision is left to the owner.

## What this does not claim

- That the 42 keys are *correct* — only that every live citation now points at the record stating
  they are internal labels with no acceptance authority.
- That `design-task.md` will stay absent; if the owner supplies it, `docs/decisions/design-task-de-citation.md`
  §5 requires a follow-up record before any `DT` citation regains authority.
- That `DEBT-008` is paid off. It is measured as a miss; paying it is `TSK-50` box 3, still open, and
  `tests/unit/performance-budget-measurement.test.ts` is written to fail loudly if the stylesheet ever
  stops overrunning while the register still claims a miss.
- That the guard's own file is exempt from its rule — it quotes an example key in a comment, and the
  census test excludes that file by name so the printed numbers stay honest.
