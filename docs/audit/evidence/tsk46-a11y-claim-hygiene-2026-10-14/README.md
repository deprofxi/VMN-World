# TSK-46 — accessibility conformance claim hygiene (2026-10-14)

**Register:** `tasks.md` TSK-46 · **Source:** `report.md` AUD-19 claim hygiene, canonical law 20
(no "TESTED & PASSED" without an artifact) · **Rules applied:** 0.2, 0.3, 0.4a, 9.

## The defect class

The automated accessibility suite is real and green: it checks token contrast, the 44×44 touch
target floor, duplicate-attribute HTML shape and stylesheet-resolved rules. Documents and source
comments repeatedly reported its result as though it had settled **WCAG 2.2 AA**. Two halves of that
claim have never been exercised in this repository:

| half | status 2026-10-14 | why |
|:---|:---|:---|
| Automated, static + stylesheet-resolved checks | **run and green** | `tests/a11y/`, `tests/unit/tokens-contrast.test.ts`, `tests/unit/public-surfaces.test.ts` |
| Manual §7.5 coverage | **NOT_RUN** | no manual pass has ever been recorded; `HD-09` is open, inherited from `TODO-PRC-06` |
| Real browser run (`pnpm test:a11y`) | **NOT_PROVEN** | the script exists, but there is **no `playwright.config.*` at the repository root and no `axe-core` dependency** |

## Sites found and their disposition

Sweep rule: any line matching `AA (compliant|compliance verified|conformant|conformance verified)`
(case-insensitive) must carry a qualifier (`automated` / `manual` / `NOT_RUN`) on the same line or
the next. Files swept: every `.md` under `docs/` and every `.ts` under `src/`.

| file:line | before | after |
|:---|:---|:---|
| `docs/handoffs/LATEST.md:315` | "contrast-checked design tokens" inside a `T-19 / B-15 … Implemented` checklist line, reading as conformance | states that the automated suite checks token contrast and HTML shape, that manual §7.5 coverage is `NOT_RUN`, and points at the downgrade at `:275` |
| `docs/audit/evidence-register.md:157` (`EVD-10-A11Y`) | status cell read as though the row settled AA | `VERIFIED (Sandbox) — automated checks only. Manual §7.5 coverage: NOT_RUN (PRC-06/HD-09). Browser run via pnpm test:a11y: NOT_PROVEN — see TSK-45/TSK-46` |
| `src/web/public/screens-view.ts:8` | source comment asserting AA for the public screens view | comment now names the automated scope and `NOT_RUN` manual coverage |
| `src/web/styles/index.ts:5` | source comment asserting AA for the stylesheet | same qualification |
| `docs/audit/CC-ARCH-001-forensic-report.md:79` | **"found by the guard after the first pass"** — a build-target cell asserting AA for the components yet to be extracted | "…React/Web components built to WCAG 2.2 AA." — same instruction, no conformance assertion |

Left alone, with the reason recorded in the register: `docs/decisions/design-task-de-citation.md:19`
restates the *requirement* (canonical law 19) — it is about what the law demands, not about what this
project achieved.

**A phantom citation in my own first draft of this closure, withdrawn.** That draft listed a second
exception — `docs/audit/forensic-report-va-mnl-csrm-cloud.md:79`, described as a third party's claim
inside a forensic report. The file does not exist. `ls docs/audit/*forensic*` on this tree returns
exactly one row, `CC-ARCH-001-forensic-report.md`, and its line 79 is the fifth site the guard caught
and the one this document fixes. Same line number, same word "forensic", different document: a
citation written from plausible-sounding memory instead of an opened file. It is reproduced here
because Rule 0.2 applies to the person doing the measuring, and a register whose only defence is
prose cannot catch a confident wrong sentence. What this file's guard catches is an unqualified
*conformance claim*; a path that names nothing is a different defect class, and it is TSK-39 box 3
that owns the machine check for it.

Source comments were swept alongside the documents because operators and auditors read them; a
qualifier that lives only in `docs/` leaves the code free to re-assert conformance.

## The guard

```
CI=1 NODE_ENV=test pnpm vitest run tests/unit/a11y-claim-hygiene.test.ts
```

`tests/unit/a11y-claim-hygiene.test.ts` (4 tests):

1. the sweep itself — fails on any unqualified conformance phrase anywhere in `docs/**.md` or `src/**.ts`;
2. manual §7.5 recorded as `NOT_RUN` in both documents the claim lives in (`docs/handoffs/LATEST.md`,
   `docs/audit/evidence-register.md`);
3. the browser run kept at `unproven` / `NOT_PROVEN` while TSK-45's boxes stay open;
4. the wiring check — reads `package.json` and the repository root, and if `axe-core` or a
   `playwright.config.*` is absent, the register must describe the gap rather than claim coverage.
   `test:a11y` must stay *declared* so the gap cannot be hidden by deleting the script.

The third and fourth tests are what turned up TSK-45's false premise: the register's preamble said
"`(Playwright + axe) exists`". That was only ever true of the npm script *name*.

## Two corrections to my own first draft of this test

- The §7.5 assertion was written case-sensitive and so failed on the register's actual wording
  (`Manual §7.5 coverage: NOT_RUN`). The regex is now case-insensitive. The register text was **not**
  edited to satisfy the assertion — Rule 0.3 forbids shaping the evidence to the gate.
- The first sweep missed `CC-ARCH-001-forensic-report.md:79`; the guard caught it, which is the
  behaviour the guard exists to provide.

## What this does not claim

- It does **not** close `HD-09`. Recording that manual coverage is absent is not manual coverage.
- It does not assert AA conformance in either direction: the automated half passes, the manual and
  browser halves are unmeasured.
- The sweep is a phrase-level instrument, not a semantic audit. It catches the documented wording
  patterns; a claim rephrased to dodge the regex (e.g. "meets WCAG in full") would need the rule
  widened, not the file exempted.
- No owner names were invented. Where a signature is required (`HD-09`, `HD-10`) the register still
  shows the role, and TSK-45/TSK-37 remain open on that basis.
