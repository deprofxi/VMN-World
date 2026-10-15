# VMN Enterprise Evidence Register: S1 to S5 Progression Ladder

**Authority:** VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMNL-AZP-VMN-CCPP-001 §8  
*(The `File 1.txt §8` citation carried here since the S1 ladder was first drafted names a file
that has never existed in this repository; it is removed per `tasks.md` TSK-07. The governing
completion register is `tasks.md` — `VMNL-AZP-VMN-TODO-002` — which inherits the historical
`TODO-*` identifiers documented in its §1.3.)*
**Audit Reference:** `VMNL-REPO-AUDIT-DEEPCHECK-001` · `VMNL-REPO-COMPLETION-AUDIT-001` (`report.md`)
**Current Evaluated Maturity Tier:** **Tier S2 claim WITHDRAWN pending Track A** (`tasks.md` §1.2) —
S2 presumes a reproducible verification baseline, and the tree failed to compile until 2026-10-07.
**Audited Date:** 2026-09-28 · **Re-pinned:** 2026-10-07 (TSK-08), 2026-10-08 (TSK-12 close-out, TSK-17)
and 2026-10-13 (TSK-18, TSK-20) — see §1  

---

## 1. The Five-Tier Production Evidence Ladder

Virtual Media Network Limited enforces continuous evidence progression from conceptual architecture to legally binding operational execution:

```
[Tier S1: Architecture & Assumptions] 
   └── Documented specifications, BRD/PRD R1.2A, ADR-001..013, Canonical Data Model. (VERIFIED)
[Tier S2: Internal Sandbox]
   └── Verification pin VMNL-EV-PIN-2026-10-08 (TSK-08, re-pinned from 2026-10-07 after TSK-12).
   Measured on this working tree
   (baseline commit `ce098f8` + 114 modified / 51 untracked entries / 2 deleted paths, which the
   TSK-09 series committed on 2026-10-15 — see the VMNL-EV-PIN-2026-10-15 block below and `tasks.md`
   TSK-09; the four outputs below are archived verbatim in
   `docs/audit/evidence/baseline-2026-10-08/`):
     `npx tsc --noEmit`  -> exit 0, 0 errors        (2026-10-07 morning: 152 errors, 3 files)
     `pnpm build`        -> exit 0
     `pnpm lint`         -> exit 0 (eslint --max-warnings 0)   (was 4 errors)
     `pnpm test`         -> 63 test files / 689 tests passed, 0 failed, 0 skipped, 0 unhandled errors
       (progression measured on this register, same day: 55/617 → 56/624 → 57/632 → 58/639 → 59/650
       → 60/665 after TSK-12: +13 tests in the new `broadcast-schedule-lifecycle.test.ts`, +1 in
       `broadcast-rights-gate.test.ts` (approval re-runs the gate) and +1 in
       `todo-remediation.test.ts` (refusal of an unattributed approved day)
       → 61/671 after TSK-52 box 3: +6 in the new `systems-of-record.test.ts`, which recomputes that
       document's Prisma accessor census and opens every file:line citation it publishes
       → 63/689 after TSK-52 box 1 and TSK-53: +13 in the new `canonical-model.test.ts` (the model /
       enum / vocabulary censuses of `canonical-model.md` and `data-dictionary.md`, plus every citation
       in both) and +5 in the new `hygiene-guards.test.ts` (the CA-29 verified-good invariants))
   ENVIRONMENT (recorded honestly, TSK-05/TSK-06, re-measured 2026-10-08): this pin run had
   Postgres reachable on `localhost:5432`, and plain `pnpm test` is sufficient — Vitest sets
   `NODE_ENV=test`, which the `x-test-role` path in `resolveSessionUser` requires. Sourcing `.env`
   first exports `NODE_ENV=development` and fails ~80 guard tests; that is a measurement error, not a
   regression. The FK-ordered fixtures and the keyset-pagination repair were measured green against
   the live database.
   Screen census (TSK-24, supersedes the withdrawn "225 system screens" and the unmeasured "≈166"):
   `docs/decisions/screen-register.json` — VMNL-REG-SCREENS-001 **R1.2** — is **60 register entries
   standing for 226 documented IDs (225 screens + 1 ALIAS)**; by entry status 55 IMPLEMENTED / 4 MOCK /
   0 MISSING / 0 DEFERRED / 1 ALIAS. The register is now an instrument, not a tally:
   `tests/unit/screen-register-verification.test.ts` expands the ranges, resolves every evidence
   citation against the repository, checks every declared route against the router's dispatch surface
   and live responses, and classifies provenance — measured **75 DOMAIN_ENGINE / 4 NOT_CONNECTED /
   147 NOT_VERIFIED by documented ID**, **40 reachable HTML surfaces** on register-declared routes and
   **111 literal HTML-serving routes** repository-wide. Report: `docs/audit/screen-register-verification.md`.
   `DEC-RL1-SCOPE-001` remains `PENDING_SIGNATURE` and repudiates the 225 figure.
   Domain invariants, 3-way reconciliation algorithms and failure drills verified in code.

   [Pin VMNL-EV-PIN-2026-10-08-B — TSK-17 closure, same day; supersedes the four gate figures of the
   TSK-08 pin above, which is retained because it is archived verbatim in
   `docs/audit/evidence/baseline-2026-10-08/`]
   Measured on `ce098f8` + **120 modified / 56 untracked entries / 2 deleted = 178 paths** (the same set
   expands to **205** files under `--untracked-files=all`), Postgres reachable on `localhost:5432`, no
   Redis. Logs archived in `docs/audit/evidence/tsk17-durability-2026-10-08/`:
     `pnpm typecheck`    -> exit 0, 0 errors
     `pnpm lint`         -> exit 0 (eslint --max-warnings 0)
     `pnpm build`        -> exit 0
     `pnpm test`         -> exit 0, **run twice back-to-back**: 64 test files / 705 tests passed,
       0 failed, 0 skipped, 0 unhandled errors on both runs (+1 file / +16 tests over the TSK-08 pin:
       `tests/unit/durability-release-critical.test.ts`). The second run is not a courtesy: TSK-17 turns
       the risk/issue registers and the approval queue into real tables, so the first run leaves rows a
       later boot hydrates, and two older suites that mint fixed-id fixtures collided with their own
       residue (422 where they expect 201/200) until they were made to delete their own rows before
       `app.start()` and again after the stop flush. **No assertion was relaxed** — Rule 0.3, and the
       register says so under TSK-17's closure evidence.
     `pnpm test:coverage`-> exit 0, 64/705 with **78.14 statements / 69.31 branches / 81.69 functions /
       79.52 lines** against the pinned floors 73/62/77/72
     `npx prisma migrate status` / `migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`
       -> **7 migrations · "Database schema is up to date!" · "-- This is an empty migration."**
       (zero drift after both additive TSK-17 migrations; this is the development database, **not** the
       clean-instance verification TSK-06 owns, which remains `[B]`)
   What the TSK-17 pin newly proves about the system, as opposed to the tree: 14 release-critical stores
   survive a real process restart, measured by a second OS process that boots `dist/src` and reports only
   what Postgres told it (`tests/helpers/durable-restart-reader.mjs`); a rejected durable write rolls its
   optimistic index entry back and answers **503 `REPOSITORY_UNAVAILABLE`** on the live HTTP path; an
   absent database defers staged rows as `sandboxDeferred` and is never reported as persisted (0.4a).
   HISTORICAL PINS (superseded, retained for audit trail): 356/41, then 480/480 at
   `ca303f0`+remediation (`6bb519d`), 494/494 at `b80ba12`, 506/506 across 45 files in the
   uncommitted tree of 2026-10-02. **The 506/506 + "zero typecheck errors" pin was false at the
   time it was written**: the same tree failed `tsc --noEmit` with 152 errors (`report.md` §1,
   CA-01/CA-25). Figures may not be re-pinned without the command that produces them
   (`tasks.md` rule 0.2).
   (CURRENT ACTIVE TIER: not asserted — see the tier withdrawal above.)

   [Pin VMNL-EV-PIN-2026-10-13 — TSK-18 then TSK-20 closure; supersedes the gate figures of the
   TSK-17 pin above, which is retained because its logs are archived verbatim]
   Measured on `ce098f8` + a dirty working set (**201** entries under `git status --porcelain`, **364**
   files under `--untracked-files=all`; the TSK-20 `gate-summary.txt` recorded 362 for the run that
   produced its own gate logs, before the last two artifacts in that directory were written).
   Nothing was committed at that pin and nothing has been pushed (the tree landed as the TSK-09 series on
   2026-10-15 — see the next pin). Database: migrated, **unseeded** `vmnl_enterprise_gates` on
   `localhost:5432`; `.env` never sourced. Logs in
   `docs/audit/evidence/tsk18-durable-audit-transaction-2026-10-12/` and
   `docs/audit/evidence/tsk20-sandbox-state-labelling-2026-10-13/`:
     `pnpm typecheck`    -> exit 0
     `pnpm lint`         -> exit 0 (eslint --max-warnings 0)
     `pnpm build`        -> exit 0
     `pnpm test`         -> exit 0, **68 test files / 822 tests passed, 0 failed, 0 skipped**
       (64/705 at the TSK-17 pin → 68/819 after TSK-18's durability and audit suites → **68/822** after
       TSK-20 added three tests to `tests/unit/systems-of-record.test.ts`. No assertion was relaxed for
       any of those deltas — Rule 0.3 — and the non-green runs (server down, wrong cluster, golden-seeded
       database) are kept beside the green one, per 0.4.)
     `pnpm test:coverage`-> exit 0, **78.97 statements / 70.16 branches / 82.97 functions / 80.32 lines**
       against the pinned floors 73 / 62 / 77 / 72 — the floors did not move
     `npx prisma migrate deploy` / `migrate diff` -> 12 migrations applied, including against two
       databases created empty on 2026-10-13, and `-- This is an empty migration.` for drift. Still **not**
       the clean-instance verification TSK-06 owns, which remains `[B]`.
   Data-state census (TSK-20, recomputed by `inventory.mjs` through the module that serves the register —
   `sandbox-state-inventory.txt` in that directory is its output, so every figure below is recomputed, never
   tallied by hand): `docs/domain/systems-of-record.md` §3.3 carries **30** `sandbox-state` families and
   `docs/decisions/screen-register.json` mirrors them **row-for-row** in `sandboxState.families`; **30**
   register entries carry `dataState: "sandbox-state"`, and those labels stand on **147** of the **226**
   documented IDs (60 entries; **183 IMPLEMENTED / 42 MOCK / 0 MISSING / 0 DEFERRED / 1 ALIAS**). **26**
   families have at least one labelled screen and four have none — `proof-of-air-registry`,
   `bank-reconciliation`, `broadcast-traffic`, `playout-cache` — because their stores are reached through
   engines, fixtures and the ledger rather than through a documented surface; **5** of the 30 have no journey
   row in the readiness matrix. Both residuals are recorded in `sandboxState.limits`, and
   `tests/unit/systems-of-record.test.ts` fails if the document, the register and the matrix diverge. What
   this pin does **not** claim: it makes the documents say *less* about persistence, not more — no
   readiness-matrix gate moved, and labelling sandbox state is not the same as persisting it.

   [Pin VMNL-EV-PIN-2026-10-15 — TSK-09 commit series + TSK-41 doc-pin guard; supersedes the gate
   figures of the 2026-10-13 pin, which is retained because its logs are archived verbatim]
   Measured on the **committed** tree at `88b6cb1` (the residual dirty set there is **1** entry under
   `git status --porcelain`: `?? pages.pdf`, untracked by decision; the artifacts of this pin add only
   `docs/audit/evidence/handoff-repin-2026-10-15/` and the documents it re-pins). Database: migrated,
   **unseeded** `vmnl_enterprise_gates` on `localhost:5432`; `.env` never sourced. Nothing pushed —
   `git remote -v` prints nothing. Logs in `docs/audit/evidence/handoff-repin-2026-10-15/`:
     `pnpm typecheck`    -> exit 0
     `pnpm lint`         -> exit 0 (eslint --max-warnings 0)
     `pnpm build`        -> exit 0
     `pnpm test`         -> exit 0, **78 test files / 872 tests passed, 0 failed, 0 skipped**
       (68/822 at the TSK-20 pin → 78/872 after the verification pyramid landed in `2ce8fab` and the
       doc-pin guard in `fd0d91b`. The delta is **not** itemised per file: the 822 pin was taken on a
       dirty tree, so per-file arithmetic would be folklore (rule 0.2). No floor, census or assertion
       was relaxed for it (rule 0.3).)
     `pnpm test:coverage`-> exit 0, **79.07 statements / 70.4 branches / 82.92 functions / 80.41 lines**
       against the same floors 73 / 62 / 77 / 72 — the floors did not move. An earlier run of the same
       committed source read 79.09 / 70.43 / 82.92 / 80.43; hundredths of run-to-run variation on the
       shared database are recorded rather than smoothed over, and both numbers clear the floors.
     `node scripts/audit-check.js`, `node scripts/audit-threshold.js`, `node scripts/explicit-any-budget.js`
       -> each exit 0
     `prisma migrate deploy` from an empty database -> exit 0, **13** migrations, **44** public tables
       (`docs/audit/evidence/tsk09-commit-series-2026-10-15/migrate-deploy-from-empty.txt`), over **14**
       tracked paths under `prisma/migrations` against **2** before the series.
   What this pin does **not** claim: that CI has executed any step — `docker info` exits 127 on this host,
   so `TSK-57`'s boxes stay open and the release posture stays BLOCKED (tasks.md §2); that the push
   happened, which remains the owner's decision; that the 872 include a browser run — no browser has run,
   so `HD-10` and manual §7.5 coverage remain NOT_RUN.

[Tier S3: Operational Staging] 
   └── Live staging deployment with Postgres container, playout integration,
       and multi-party operator rehearsal. (IN PROGRESS / TARGET)
[Tier S4: Independent Verification] 
   └── External security penetration audit, NDPR data privacy clearance, WCAG 2.2 AA automated axe audits.
[Tier S5: Binding Audited Production] 
   └── Executed StarTimes carriage contracts with live RF uplink lock, binding bank MT940 statement sync,
       and external revenue audit sign-offs.
```

---

## 2. Evidence Register Ledger (Truthful S2 Sandbox Audit)

| Evidence ID | Domain / Capability | Target Tier | Current Evaluated Tier | Verification Artifact / Output | Status |
|---|---|---|---|---|---|
| `EVD-01-ARCH` | Architecture Authority | S1 | **S1** | `docs/adrs/` (13 ADRs including ADR-013), `CLAUDE.md`, `release-manifest.json` | **VERIFIED** |
| `EVD-02-CORE` | Canonical Data & Auth | S2 | **S2** | `tests/unit/domain.test.ts`, `tests/unit/auth.test.ts`, Prisma Schema, `tests/unit/security-auth-rbac.test.ts` | **VERIFIED (Sandbox)** |
| `EVD-03-RBAC` | Multi-Tenant PEP/PDP | S2 | **S2** | `tests/unit/rbac.test.ts` (10 enterprise roles + 19 §48 broadcast roles incl. MCRSupervisor & Operator) | **VERIFIED (Sandbox)** |
| `EVD-04-BCST` | Linear Broadcast Systems | S3 | **S2** | `tests/unit/broadcast.test.ts`, `src/modules/broadcast/playout/index.ts`, `src/modules/broadcast/export/index.ts` | **VERIFIED (Prototype)** |
| `EVD-05-DRIL` | 20 UAT Failure Drills | S3 | **S2** | `tests/unit/uat-broadcast-failure-drills.test.ts` (20/20 green) | **VERIFIED (Sandbox)** |
| `EVD-06-TLNT` | Talent & AFCA Academy | S2 | **S2** | `tests/unit/hub-talent.test.ts` (rubrics, certificates, rate cards, public verification `/verify/afca/:id`) | **VERIFIED (Sandbox)** |
| `EVD-07-PROD` | VCF, ONE Studios, TEND | S2 | **S2** | `tests/unit/hub-production.test.ts` (waterfalls, avails, tickets, POA `/verify/poa/:id`) | **VERIFIED (Sandbox)** |
| `EVD-08-INTL` | HeadspaceNG, Cr8Tech, AOS | S2 | **S2** | `tests/unit/intelligence.test.ts` (kill switch, WebVTT, policy gates) | **VERIFIED (Sandbox)** |
| `EVD-09-FEDR` | Azeebo+ Federation L1-L4 | S3 | **S2** | `tests/unit/federation.test.ts` (circuit breaker, deep links, webhooks) | **VERIFIED (Sandbox)** |
| `EVD-10-A11Y` | Web Surfaces & Contrast | S4 | **S2** | `tests/a11y/accessibility-audit.test.ts`, `tests/unit/public-surfaces.test.ts` (automated token contrast + 44px target + HTML-shape checks) | **VERIFIED (Sandbox) — automated checks only. Manual §7.5 coverage: NOT_RUN (PRC-06/HD-09). Browser run via `pnpm test:a11y`: NOT_PROVEN — see TSK-45/TSK-46** |
| `EVD-11-FINC` | 7-Way Finance & MT940 | S5 | **S2** | `tests/unit/reconciliation-mt940.test.ts`, `tests/unit/finance.test.ts`, `BankReconciliationEngine` replay safety | **VERIFIED (Algorithmic Prototype)** |
| `EVD-12-GATE` | R1.2A §67 Release Gates | S4 | **S2** | `tests/unit/quality-gates.test.ts`, `release-manifest.json` (BG0–BG9 gates evaluator, BG6: NOT_TESTED, GO_WITH_CONDITIONS) | **VERIFIED (Sandbox S2 Cleared)** |
| `EVD-13-REPO` | Repositories & Invariants | S2 | **S2** | `src/core/database/repositories/*.ts`, `tests/unit/production-core-and-infrastructure.test.ts` (Database-authoritative, DB/MEMORY flag) | **VERIFIED (Library/Sandbox)** |
| `EVD-14-QUEU` | Background Queue Worker | S2 | **S2** | `src/core/queue/index.ts`, `src/api/server.ts` (EPG, notifications, webhooks, reconciliation handlers) | **VERIFIED (Sandbox)** |
| `EVD-15-AUDT` | Cryptographic Audit Chain | S2 | **S2** | `src/core/audit/index.ts`, `tests/unit/audit.test.ts` (SHA-256 hash chaining, out-of-band tamper detection) | **VERIFIED (Sandbox)** |
| `EVD-16-NOTF` | Multi-Provider Notification | S2 | **S2** | `src/core/notifications/index.ts`, `tests/unit/production-core-and-infrastructure.test.ts` (SMTP/SES, Termii, sandbox isolation) | **VERIFIED (Sandbox)** |
| `EVD-17-BCST-SCR` | 33 Operational Screens | S3 | **S2** | `src/web/broadcast/index.ts`, `tests/unit/broadcast-screens.test.ts` (All 33 SCR-BCST routes with RBAC enforcement) | **VERIFIED (Sandbox)** |
| `EVD-18-CNTR` | OpenAPI Spec & Abuse Tests | S4 | **S2** | `tests/contract/openapi-contract.test.ts`, `tests/security/abuse-and-fuzzing.test.ts` (OpenAPI 3.1.0 schema, fuzzing, tamper verification) | **VERIFIED (Sandbox)** |
| `EVD-19-OTEL` | Observability & OTEL Export | S3 | **S2** | `src/core/observability/index.ts`, `tests/unit/observability.test.ts` (OTLP/HTTP metrics exporter, webhook alert dispatch adapter) | **VERIFIED (Sandbox)** |
| `EVD-20-SECD` | Dependency Triage & CVEs | S4 | **S2** | `docs/audit/dependency-triage.md`, `package.json` (`audit:check` script) | **VERIFIED** |
| `EVD-21-WORKSPACES` | Extended Workspaces & Desks | S2 | **S2** | `src/web/workspace/*.ts`, `tests/unit/extended-workspaces.test.ts` (28 tests: Proposal Builder, Term Sheets, LMS Rubrics, Video Submissions, Gear Locker, Call Sheets, AOS Killswitch) | **VERIFIED (Sandbox)** |
| `EVD-22-SCREENS` | Unified Surface Matrix (verified instrument) | S2 | **S2** | `docs/decisions/screen-register.json` (VMNL-REG-SCREENS-001 **R1.2**: 60 entries = **226 documented IDs**, 55 IMPLEMENTED / 4 MOCK / 0 MISSING / 0 DEFERRED / 1 ALIAS by entry), `tests/unit/screen-register-verification.test.ts` (range expansion, evidence-file resolution, route-mount and provenance assertions), `docs/audit/screen-register-verification.md` | **VERIFIED (instrument)** — the former "225 canonical screen IDs active and mounted" row stays withdrawn, and so does the row that called 60 entries "totalScreens". Measured provenance is **75 DOMAIN_ENGINE / 4 NOT_CONNECTED / 147 NOT_VERIFIED by documented ID**; NOT_VERIFIED is an honest class, not a pass. The broadcast group was probed through `/broadcast/screens/SCR-BCST-01` (200, no provenance marker), which is the gap TSK-11 must close (`report.md` CA-08). |
| `EVD-23-DESIGN-TOKEN` | Zero-Emoji & WCAG Token Discipline | S4 | **S2** | `tests/unit/token-discipline.test.ts`, `tests/unit/tokens-contrast.test.ts`, `tests/unit/styleguide.test.ts` (Zero raw OS emojis, strictly SVG icons, 4.5:1 text contrast) | **VERIFIED (Sandbox)** |
| `EVD-24-ADMISSIONS` | AFCA Multi-Step Intake Flow | S2 | **S2** | `src/modules/hub/afca/admissions.ts`, `src/web/public/admissions.ts`, `tests/unit/admissions.test.ts` (Multi-step validation, portfolio submission, audit trails) | **VERIFIED (Sandbox)** |
| `EVD-25-DATASTATE` | Data-state labelling: durable stores vs `sandbox-state` | S2 | **S2 (instrument)** | `docs/domain/systems-of-record.md` §3.1/§3.3 (**15** durable stores, **30** `sandbox-state` families), `docs/decisions/screen-register.json` `sandboxState.families`, `docs/audit/journey-readiness-matrix.md` family → journey parity table, `tests/unit/systems-of-record.test.ts` (9 tests), `docs/audit/evidence/tsk20-sandbox-state-labelling-2026-10-13/` | **VERIFIED (instrument)** — three independent inventories of the same measured fact must agree or CI fails, and every Persistence cell that describes process memory must name its family. This row certifies the *labelling*, not the persistence: **147** documented IDs are now openly labelled as having no durable copy, and no gate moved because of it. |

---

## 3. Truthful Maturity Attestation

**This repository is not currently certified at any tier.** The Tier S2 attestation written here on
2026-09-28/10-02 is withdrawn pending `tasks.md` Track A closure (CCPP §8: a tier claim requires a
reproducible verification baseline; this tree did not compile until 2026-10-07).

- **What is verified** (pin VMNL-EV-PIN-2026-10-07, commands in §1): `npx tsc --noEmit` exit 0;
  `pnpm build` exit 0; `pnpm lint` exit 0; `pnpm test` = **59 files / 650 tests passed, 0 failed,
  0 skipped** (this pin first recorded 50 files / 588 tests on the same date and was re-measured
  after TSK-43, TSK-14, TSK-07 and TSK-10 added their suites). Business invariants asserted by
  executable tests include the 7-way financial separation, broadcast failure drills (13 journey
  drills), 3-way reconciliation logic, MT940 SWIFT parsing, the 60-entry screen register census, HMAC
  webhook validation, idempotent mutations, the tamper-evident audit ledger, and — as of 2026-10-07 —
  the Azeebo+ destination state machine and fail-closed federation origin
  (`tests/unit/federation-destination-registry.test.ts`), the AC traceability census
  (`tests/unit/ac-traceability.test.ts`, TSK-43), the rights review-request → clearance-gate path
  against live Postgres (`tests/integration/rights-clearance-e2e.test.ts`, TSK-14), and the rights
  gate on the authoritative lifecycle path — approval, amendment and EPG export all refuse on the
  registered `RightsRecord`, never on a free-text attestation
  (`tests/unit/broadcast-rights-gate.test.ts`, TSK-10).
- **What is NOT verified, despite earlier claims in this document:**
  - ~~**Rights window gates.**~~ **Closed 2026-10-07 by TSK-10** — the former row listing them as
    verified was false (schedule approval never consulted the rights engine), and it stayed false
    after TSK-14 only fixed the *recording* half. It is now verified for the right reason:
    `approveSchedule`/`amendSchedule` re-decide every entry against the registered `RightsRecord`
    (`[SCHED-RIGHTS-03]`), the lifecycle refuses an entry that names no record
    (`[SCHED-RIGHTS-02]`), XMLTV/StarTimes export re-checks at export time
    (`RIGHTS_NOT_CLEARED_AT_EXPORT`, never the approval timestamp), and
    `/api/v1/broadcast/rights/validate` answers 400 `RIGHTS_RECORD_FIELDS_NOT_TRUSTED` /
    `RIGHTS_RECORD_ID_REQUIRED` instead of judging a caller-authored record — the
    `CALLER_SUPPLIED_COPY` path is gone, so `recordProvenance.source` is only ever
    `REGISTERED_RIGHTS_RECORD`. Evidence: `tests/unit/broadcast-rights-gate.test.ts` (11 tests as
    measured on 2026-10-07; 12 since TSK-12 moved the gate to its PRD stage and added the
    "window lapses between RIGHTS_CHECK and APPROVED" case),
    `tests/integration/rights-clearance-e2e.test.ts` and, for the lifecycle around it,
    `tests/unit/broadcast-schedule-lifecycle.test.ts` (13 tests). Remaining rights work in this
    register is
    durability of *other* release-critical domains (TSK-17), not this gate.
  - **Database-path repository behaviour at this pin** — **corrected 2026-10-08**: the former row
    here said "no reachable Postgres during the pin run (`P1001`)", which stopped being true the same
    evening it was written (§1 environment note) and is not what the 2026-10-08 run measured. What is
    actually exercised against the live database in `fail_closed`: the registered-rights read path
    (`tests/unit/broadcast-rights-gate.test.ts`, printing `rights gate path under test: Postgres
    (fail_closed)`), `tests/unit/production-core-and-infrastructure.test.ts`,
    `tests/integration/rights-clearance-e2e.test.ts`, and the FK-ordered parent fixtures in
    `tests/helpers/db-parents.ts` (used by 4 suites). What is **still not verified**: `docs/domain/state-machines.md`
    §8's process-memory inventory is the open work, and TSK-20 turned it from prose into a checked
    inventory — **30** `sandbox-state` families, **147** labelled documented IDs (§1, pin
    VMNL-EV-PIN-2026-10-13). Concretely, the schedule day and the broadcast versions/schedules a day
    references are still in-process `Map`s, as is VTM milestone escrow (`vtm-book`). The row this bullet
    previously wrote — "no `tests/unit/durability-*.test.ts` exists", with cases, approvals and content
    listed as in-process `Map`s — was false when this pin was re-opened on 2026-10-13 and contradicted
    §1 of this same document: TSK-17 added `tests/unit/durability-release-critical.test.ts`
    (`tests/unit/durability-drill-coverage.test.ts` also exists), and `privacySecurityCase`,
    `approvalItem` and `contentItem` are three of the **15** stores registered with the durable journal
    (`src/core/approvals/index.ts:61`, `src/core/cases/index.ts:35`, `src/core/content/index.ts:107`).
    It is corrected, not re-asserted.
  - **Migrations deployable from clean** — `prisma migrate deploy` / `migrate diff` unverified;
    three migrations and `migration_lock.toml` are still uncommitted (`tasks.md` TSK-06).
  - **33 broadcast operational screens** reaching a domain engine — since the TSK-11 rewiring all
    33 serve the provenance-badged KPI strip (`vmn-kpi-strip`). **Renderer-level** (the figure
    `tests/unit/broadcast-provenance-coverage.test.ts` prints on every run): 33/33 carry the
    provenance banner, 0 fabricated per-screen KPI literals. **Served level**, re-measured
    2026-10-12 over HTTP against compiled `dist/src` with Postgres reachable
    (`docs/audit/evidence/tsk11-served-screen-engine-snapshot-2026-10-12/served-census.txt`): the
    route now injects what its own process holds — `buildScreenEngineSnapshot`
    (`src/api/router.ts:406`), passed to the renderer at `:3553` — so **2 of 33** served screens
    emit at least one `DOMAIN_ENGINE` `SOURCE:` badge (SCR-BCST-02 from the live channel registry,
    SCR-BCST-20 from the hydrated sponsorship audit), **31 of 33** still carry a
    `NOT CONNECTED` / `PROVISIONAL` badge, and **1 of 33** (SCR-BCST-20) is *fully* sourced. SCR-BCST-01
    shows no badge only because `/broadcast/dashboard` is answered by the legacy page before the
    screen matcher, so its strip is never served — surface duplication, not a sourced desk
    (`tasks.md` TSK-11 residual 4). The billing panels (`:21`/`:31`) are engine-capable but were
    unsourced in that census because no campaign had been booked in the served process; the as-run
    and playout panels stay `NOT_CONNECTED` — no route ingests as-run logs and the playout engine
    holds no on-air/lock state (`tasks.md` TSK-11 box 6).
  - **DAM tenant scoping (TSK-58 box 2, closed 2026-10-12)** — the registry's read path
    (`src/core/storage/index.ts:411`) no longer hands tenant-less rows to every tenant: a session
    scoped to `tenant-a` lists only `tenant-a` rows, proved over HTTP with signed cookies
    (`tests/unit/todo-final-remediation.test.ts:1327`, unit case at `:1236`). What is **still not**
    done: the central `canPerform` tenant predicate remains unreachable from any route — no call
    site passes the fourth `context` argument (`src/api/router.ts:769`, `:8093`,
    `src/api/routes/enquiry.routes.ts:25`, `:49`) — so isolation stays per-handler (TSK-58 boxes 1
    and 3 open); and the **1,427 unowned rows** of the local `MediaAssetRecord` table (1,585 total;
    the whole golden backfill registers with no `tenantId`) are now visible to no tenant session,
    SuperAdmin included, since a SuperAdmin session carries `vmnl-hq` (`src/core/auth/index.ts:497`).
    Measurements: `docs/audit/evidence/tsk58-fail-closed-unscoped-assets-2026-10-12/measurements.txt`.
  - **Audit ledger shares the business write's transaction (TSK-18, closed 2026-10-13)** — the
    write-behind journal now groups durable writes per request and drains each group inside one
    `prisma.$transaction`, `AuditLog` is a registered durable store read back from Postgres, and a
    rejected ledger row fails the request closed at 503 instead of committing a 2xx that attests
    nothing. Mechanism, assertions, gates and the two environment discoveries below are in
    `docs/audit/evidence/tsk18-durable-audit-transaction-2026-10-12/README.md`.
  - **Test-environment dependencies this ladder has never stated (measured 2026-10-13)** — the
    DB-backed suites are only green on a *migrated, unseeded* Postgres. With `pnpm db:seed` loaded in
    the same database, seven count assertions report the seed's rows and `pnpm test` exits 10-red
    (`…/full-suite-golden-seeded-dev-db.txt`); and `(set -a; source .env; …; pnpm test)` pushes
    `NODE_ENV=development` into the test process, which disables the `x-test-role` harness
    (`src/api/router.ts:730`) and turns authenticated route tests into 401s. Both are environment
    facts, not tree facts: the same commit is 819/819 green without them. Scoping those assertions
    so they do not depend on an empty table is register work, not something this document will claim
    is already fixed.
- **What is provisional / pending operational staging (S3) and production (S5):**
  - StarTimes carriage channel assignments (Ch 428/430/432) and service PIDs are marked provisional (`BG6_CARRIAGE: "NOT_TESTED"`) pending final execution of StarTimes carriage contracts and NBC frequency allocations.
  - Playout automation relies on native standard playout engines (SMPTE-2067, BXF, Harris CSV, Grass Valley) pending live master control network deployment.
  - Live bank feeds and Paystack/Flutterwave production webhooks require operational deployment and live API secrets.
