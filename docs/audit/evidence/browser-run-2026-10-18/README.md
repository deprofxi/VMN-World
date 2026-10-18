# Real-browser run — 2026-10-18 (PR-26 / TSK-45, plan phase 1.1)

**Command:** `CI=1 pnpm test:browser` (the `CI=1` prefix selects the same reporter
configuration the workflow uses, so the HTML report is written to the exact
artifact path `.github/workflows/ci.yml` uploads: `coverage/browser-report`).
**Result:** exit 0 — **13 passed / 0 failed**, 3 specs, 4.1 m, Playwright chromium
against the built server (`node dist/src/index.js`, `playwright.config.ts`).

| Artifact | What it is |
|:---|:---|
| `browser-run.log` | Verbatim stdout+stderr of the run, with `EXIT_CODE=0` captured inside the file by the shell that ran it |
| `html-report/` | The Playwright HTML report, copied from `coverage/browser-report` — the same artifact CI uploads as `vmnl-browser-report` |

## What the 13 tests cover

- `tests/browser/a11y.spec.ts` — axe-core 4.13.0 (WCAG 2.2 A/AA) over 7 routes ×
  the six target viewports, **zero violations**;
- `tests/browser/keyboard.spec.ts` — keyboard path, skip link, visible focus
  indicator, command-palette focus trap and restoration, closed-palette tab order;
- `tests/browser/rendering.spec.ts` — the built server serves the canonical
  stylesheet and client bundle, and chrome controls render at the target size the
  design system declares.

## What this artifact does **not** claim

- **Not a CI run.** No GitHub Actions execution has ever seen this repository
  (`git remote -v` prints nothing — PR-02). CI's upload step
  (`Upload Browser Run Report (PR-26)`, `coverage/browser-report`) is wired and
  this local run produces exactly that path, but "the workflow would upload it"
  is a statement about the workflow, not a run that happened.
- **Not manual coverage.** Manual WCAG §7.5 remains **NOT_RUN**
  (`HD-09` / `PRC-06`); an automated axe sweep is not a manual conformance
  review. `tests/unit/a11y-claim-hygiene.test.ts` keeps that qualifier attached
  wherever the claim appears.
- **Not the whole surface.** 7 routes are covered, not all 33 broadcast screens.

Reproduce: `pnpm build && CI=1 pnpm test:browser`.
