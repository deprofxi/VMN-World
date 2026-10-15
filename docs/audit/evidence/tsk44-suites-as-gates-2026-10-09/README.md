# TSK-44 — the security, contract and a11y suites are gates (2026-10-09)

**Register item:** `tasks.md` **TSK-44 · P1 · Restore the security and contract suites as gates**
(source `report.md` CA-02 / CA-17).

**Baseline:** HEAD `ce098f8`, **uncommitted**. The three files this item depends on are all working
tree only:

```
$ git status --porcelain vitest.config.ts package.json .github/workflows/ci.yml
 M .github/workflows/ci.yml
 M package.json
?? vitest.config.ts
$ git cat-file -e HEAD:vitest.config.ts
fatal: path 'vitest.config.ts' exists on disk, but not in 'HEAD'
```

Committing is **not** part of this closure (`TSK-09`, owner authorization), so box 2's second half is
recorded `[B]` here rather than ticked. Nothing in this artifact claims a SHA.

## What was measured

`npx vitest run tests/security tests/contract tests/a11y tests/integration` → **11 files / 127 tests
passed, 0 failed, 0 skipped**, exit 0, 34.52s, against the real Postgres (`pool: "forks"`,
`minWorkers/maxWorkers: 1`, `vitest.config.ts:14-16`). Full output: `focused-run.txt`; the parsed
counts and every command above: `measurements.txt`.

| File | Tests | Named by box 1? |
|:---|:---|:---|
| `tests/security/abuse-and-fuzzing.test.ts` | 8 | yes (`tests/security/*`) |
| `tests/security/route-authorization.test.ts` | 13 | yes |
| `tests/security/route-guard-parity.test.ts` | 6 | yes |
| `tests/contract/openapi-contract.test.ts` | 10 | yes |
| `tests/a11y/accessibility-audit.test.ts` | 6 | yes (`tests/a11y/*`) |
| `tests/a11y/responsive.test.ts` | 6 | yes |
| `tests/a11y/visual-regression-baseline.test.ts` | 6 | yes |
| `tests/integration/enterprise-end-to-end.test.ts` | 42 | yes |
| `tests/integration/enquiry-failure-drill.test.ts` | 9 | neighbour |
| `tests/integration/journey-failure-drills.test.ts` | 13 | neighbour |
| `tests/integration/rights-clearance-e2e.test.ts` | 8 | neighbour |

The four glob families are 8 files (127 − 30 = 97 in the named set). The three neighbouring
integration suites were run anyway: a claim about a directory is only worth what the whole directory
shows, and box 3's zero-skip statement has to hold over the run, not a subset.

All 11 also load inside the default `pnpm test`, whose last full certification is recorded in
`../tsk13-canonical-client-portal-2026-10-09/test-run3.txt` — 65 files / 746 tests, 0 failed, 0
skipped. That is what makes them gates rather than optional suites.

## Coverage enforcement

`vitest.config.ts:24-29` sets floors 72 lines / 62 branches / 77 functions / 73 statements. The
gated step exists in this tree's workflow — `.github/workflows/ci.yml:94-95` runs
`pnpm run test:coverage` (`package.json:16`, provider `@vitest/coverage-v8` at `package.json:57`) —
and the last coverage run cleared the floors at **78.47 / 69.89 / 82.19 / 79.74**
(`../tsk13-canonical-client-portal-2026-10-09/test-coverage.txt`).

## The blocked half, stated plainly

At HEAD the workflow's test step is plain `pnpm test` (HEAD's `.github/workflows/ci.yml:82-83`) and
HEAD's `package.json` has no `test:coverage` script; `vitest.config.ts` is not in HEAD at all. So a
CI checkout today runs neither the thresholds nor the coverage step, and it would also lose the
serial pool settings the shared-Postgres suites depend on. The configuration is written and measured
green locally; making it a CI gate is a commit, and commits here are `TSK-09`'s — the owner's call.
Recording that as `[B]` is the honest state; ticking the box would be the claim the audit made in
2026-10-06 and this repository has been re-pinning ever since.

## What this does **not** claim

- **No browser.** `tests/a11y/accessibility-audit.test.ts:20-22` renders
  `renderMasterLayout(...)` and asserts on the returned bytes. `pnpm test:a11y` (`playwright test`)
  remains unproven in this environment — that is `TSK-45` / `HD-10`, and the WCAG AA claim stays
  automated-only (`TSK-46` / `HD-09`).
- **A green CI run.** CI has never run on a commit containing this work (posture row, `tasks.md`
  §1.2; `TSK-06` is `[B]`).
- **New test code.** This increment edited no `src/**` or `tests/**` file; it measured four families
  and wrote down the result.

## Documents touched

`tasks.md` TSK-44 (boxes re-statused, box 2 split, cross-reference added to `TSK-09` box 5, whose
dirty-path prose is re-measured to **189 / 246**); `docs/handoffs/LATEST.md` (new gate-state bullet +
pin row pointing at this directory).

One incidental finding worth recording, because it is an evidence-integrity defect rather than a
tidy-up: `.gitignore:3` is `*.log`, which silently excluded every run output stored under
`docs/audit/evidence/`. The four logs here and
`docs/audit/evidence/migrations-2026-10-07/deploy-from-empty.log` are therefore written/renamed as
`.txt` — an artifact that `git status` cannot see cannot be committed, and a committed register is
exactly what `TSK-09` is about.
