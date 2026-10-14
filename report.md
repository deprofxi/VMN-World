# VMNL Project Completion Audit — Documents vs. Implementation

**Audit ID:** `VMNL-REPO-COMPLETION-AUDIT-001`
**Date:** 2026-10-07
**Subject:** `/Users/deprof/www/vmng` @ branch `main`, working tree (HEAD `ce098f8` + 96 modified / 18 untracked files)
**Method:** The authority documents, ADRs, decision records, registers and handoffs were read against the code, tests, schema and CI they claim to describe (PRD R1.2A and CCPP R1.1 were audited section-by-section via delegated sweeps; every resulting claim was then re-checked at the cited line before being published — see §6). Baseline commands were re-run in this tree. No documented claim was accepted without executable or file-level evidence.
**Verdict:** **NOT COMPLETE. The project does not currently build, test, or lint, and the documentation materially overstates completion.** Underneath the broken tree there is a substantial and genuinely capable codebase (~47,500 lines of TypeScript, 48 test files, 27 Prisma models, ~166 routed HTML surfaces). The gap is not absence of effort — it is (a) an in-flight, unfinished design-token migration that broke the build, (b) large regions of "surface without substance" (renderers over hardcoded data, engines that nothing calls), (c) no durable system of record for most domains, and (d) governance documents whose numbers are stale or unreproducible.

---

## 1. Measured baseline (2026-10-07, this tree)

| Check | Command | Result |
|:---|:---|:---|
| Typecheck / build | `pnpm build` (`tsc`) | **FAIL** exit 2 — syntax errors in 3 renderer files |
| Test suite | `pnpm test` (`vitest run`) | **FAIL** exit 1 — **20 of 48 test files fail**; 282 collected: 274 passed, 4 failed, 4 skipped |
| Lint | `pnpm lint` (`eslint . --max-warnings 0`) | **FAIL** exit 1 — 4 errors |
| Production artifact | `dist/` | Stale/partial — written by the failed build; `pnpm start` cannot be trusted |
| CI | `.github/workflows/ci.yml` | Would fail at step 3 (`pnpm run typecheck`), before tests, gates, or image build |
| Uncommitted work | `git diff --shortstat` | 96 files, **+8,237 / −6,555**; 18 untracked paths |

**Documented claims contradicted by measurement:**

| Claim | Where | Measured truth |
|:---|:---|:---|
| "506/506 tests across 45 files, zero skips" | `docs/handoffs/LATEST.md:13`, `docs/audit/evidence-register.md:18,27,78` | 274 passing / 4 failing / 4 skipped across 48 files; 20 files cannot even load |
| "`tsc --noEmit` clean" | `docs/handoffs/LATEST.md:13`, `docs/audit/evidence-register.md:27` | 152 `tsc` errors in 3 files |
| "`eslint` passing with 0 errors" | `docs/handoffs/LATEST.md:13` | 4 errors |
| "`pnpm run typecheck` exit 0, `pnpm run lint` exit 0 … 47 files / 556 tests, all passing" | `audit.md:454-456` (§5 Remediation Status, dated 2026-10-06) | No — regressed on 2026-10-06/07 |
| "every `MOCK_*` dataset on these surfaces is deleted" (Round 6B) | `docs/handoffs/LATEST.md:26,31` | `MOCK_CLIENT_PROJECTS` exists and is the live data source for the client portal |
| "all engineering-closable items closed (66/71)" | `docs/handoffs/LATEST.md:5` | `todo.md` and `tasks.md` — the registers those items lived in — have been **deleted** from the tree |
| "Zero raw OS emoji across 100% of `src/web/`" | `docs/handoffs/LATEST.md:137` | `tests/unit/token-discipline.test.ts` currently fails to load, so this is unverified, not passing |

---

## 2. Findings

Severity: **P0** blocks any release; **P1** material correctness/compliance defect; **P2** quality/governance debt; **P3** hygiene.

### 2.1 P0 — The tree is broken

**CA-01 · P0 · Build fails: design-token migration corrupted template literals**
A bulk inline-style→class rewrite (`scripts/migrate-inline-styles.mjs`, untracked) rewrote string literals as well as markup. In three renderers it replaced the *selected-class expression inside a ternary* with a generated class token, destroying the syntax:

- `src/web/public/screens-view.ts:36` and `:40` — `${!selectedRole ?  s-zTjcEp-kWU"btn-primary" : "btn-outline"}`
- `src/web/public/admin-feature-flags.ts:27`, `:31`, `:77` — same pattern (`s--wJWanX93Y`, `s-BLW…`)
- `src/web/public/auth-screens.ts:566` and onward — same pattern (`s-xpqECJulZc`)

`tsc` reports 152 errors across these three files. All three are imported by the router (`src/api/router.ts:184,306` and the broadcast screens path), so **the server cannot be built or started**.
**Do next:** repair the three ternaries (restore the conditional class-string, keep the generated class for the non-conditional parts), or `git checkout HEAD -- src/web/public/screens-view.ts src/web/public/admin-feature-flags.ts src/web/public/auth-screens.ts` and re-run the migration with a script that skips expressions inside `${…}`. Compare against `git show HEAD:src/web/public/screens-view.ts:36`, which is valid.

**CA-02 · P0 · Cascade: 17 test files fail only because of CA-01**
Every `Transform failed with 1 error: … screens-view.ts:36:73` failure is the same defect: all 3 `tests/a11y/*`, `tests/contract/openapi-contract.test.ts`, both `tests/security/*`, `tests/integration/enterprise-end-to-end.test.ts`, and 11 unit files. This is why measured coverage and the CI test gate are meaningless right now.
**Do next:** re-run `pnpm test` after CA-01; do not triage these individually.

**CA-03 · P0 · Real assertion regressions independent of the build break**
- `tests/unit/styleguide.test.ts:107` asserts `min-height: 44px` on rendered buttons. The token pass stripped the inline touch-target style and moved it into a generated class (`src/web/styles/generated-utilities.ts`), so the DT-202 state-matrix test fails. 44px is still declared in `src/web/styles/index.ts` and `minTouchTargetPx: 44` in the token module — the *test* is checking the old delivery mechanism.
**Do next:** assert the token class resolves to a 44px rule (parse the shipped stylesheet), rather than asserting an inline attribute. That closes DT-202 honestly and unblocks AUD-20.

**CA-04 · P0 · DB-backed repository tests fail against the reachable Postgres**
`tests/unit/production-core-and-infrastructure.test.ts:55,121,197` throw `RepositoryUnavailableError` caused by Prisma `P2003` FK violations: `TalentProfile_personId_fkey`, `Programme_channelCode_fkey`. A database *is* reachable here, so this is not an environment excuse — the seed/write ordering creates a child before its parent. The fail-closed mode (`src/core/database/repository-mode.ts:21,50`) correctly converts this into a hard failure.
**Do next:** make the test seed create `Person`/`Organisation` parents first (or use a transactional fixture), and add a schema-level ordering assertion.

**CA-05 · P0 · `lint` errors block the CI lint gate**
`src/api/router.ts:468` — `isStringRecord` declared and never used; plus the three parsing errors from CA-01.
**Do next:** delete the dead helper (or use it) after fixing CA-01.

**CA-06 · P0 · The task registers the project is managed from have been deleted**
`tasks.md` and `todo.md` are tracked in HEAD but show as ` D` (deleted, uncommitted) in the working tree. Four living documents still cite them — `docs/handoffs/LATEST.md`, `docs/audit/todo-remediation-evidence.md`, `docs/decisions/DEC-RL1-SCOPE-001.md`, `docs/runbooks/disaster-recovery.md` — and `docs/audit/evidence-register.md:4` cites `File 1.txt §8`, which has never existed in the repo. Every `TODO-SEC-nn / TODO-SCR-nn / TODO-BCST-nn / TODO-FIN-nn / TODO-PRC-nn` identifier used throughout the audit documents now resolves to nothing.
**Do next:** decide deliberately — either restore the registers, or commit the deletion and repoint all traceability to a surviving register. Do not leave a half-deleted register; it is the spine of the whole evidence system.

---

### 2.2 P1 — Substance gaps: surfaces that do not do what the documents say

**CA-07 · P1 · CRITICAL DOMAIN DEFECT — rights clearance is not enforced before exploitation**
This is the repo's own canonical law 8 ("No rights clearance → no exploitation") and PRD BR-011 / §62.

- `src/modules/broadcast/versions/index.ts:187-188` — schedule validation only requires that `rightsClearedBy` be a **non-empty free-text string**: `[SCHED-RIGHTS-01]`. No `RightsRecord` is looked up, no window/territory/channel check occurs.
- `src/modules/broadcast/versions/index.ts:260-275` — `approveSchedule()` checks lifecycle state and that `approvedBy` is non-empty, computes lock-out, and sets `APPROVED`. **It never consults the rights gate.**
- `src/api/router.ts:5652-5670` — the "rights validation" endpoint constructs the entire `RightsRecord` (`rightsType`, `territory`, `startDate`, `expiryDate`, `channelCode`) **from the request body**. The caller asserts its own rights facts; the server validates the arithmetic of a claim, not the claim.
- The real engine exists — `validateScheduleRights` at `src/modules/broadcast/rights/clearance.ts:53`, `BroadcastRightsGate.checkRightsReadiness` at `clearance.ts:169` — and correctly rejects wrong type/territory/channel/expiry. It is simply never invoked on the authoritative path, and `src/core/rights/index.ts` implements only a *review-request* workflow (`createRightsReviewRequest`, `transitionRequest`), not clearance.
- The Prisma `RightsRecord` model exists but nothing in the schedule/export path reads rights from it (`grep` for durable rights reads returns only intra-engine field access).

**Do next:** (1) load the `RightsRecord` server-side by id from the durable store, never from the body; (2) call `validateScheduleRights` inside `approveSchedule` and reject approval on failure; (3) make the XMLTV/StarTimes export path re-check clearance at export time. This is the single highest-value functional fix in the project.

**CA-08 · P1 · All 33 broadcast operational screens render fabricated KPIs; the honest engine is dead code**
`src/web/broadcast/index.ts:193-358` — `SCREEN_DECISIONS` hardcodes per-screen KPIs for all 33 screens: "Carriage Uptime 99.98%", "Daily Yield ₦18.4M", "₦19.2M", "Prime Fill Rate 98.2%", "Monthly Uptime 99.98%". `:918-922` invents a generic fallback ("SLA Compliance 100% / Gate Cleared"). `:615` presents the SHA-256 **of the empty string** (`e3b0c442…`) as a "cryptographic playlist hash". Schedule grid (`:457-470`) and playout monitor (`:539-588`) are static.
Meanwhile `getScreenData()` / `renderScreenKpis()` in `src/modules/broadcast/screens/data.ts:51,150` — the provenance-honest layer that returns `DOMAIN_ENGINE | PROVISIONAL | NOT_CONNECTED` and refuses to fabricate — has **zero production call sites**. It is imported only by `tests/unit/todo-remediation.test.ts:86`.
The `renderMockDataBanner` (`src/web/broadcast/index.ts:1163`) does label these as demonstration data, which is why this is P1 and not dishonest-by-stealth — but `docs/handoffs/LATEST.md:9` "broadcast desks remain labelled demonstration" understates that **0 of 33** screens show engine data.
**Do next:** wire the 33 screens through `getScreenData`, delete `SCREEN_DECISIONS`, and remove the empty-string hash.

**CA-09 · P1 · The client counterparty portal is mock data labelled as canonical**
`src/web/portal/client-portal.ts:55` defines `MOCK_CLIENT_PROJECTS`, served live at `src/api/router.ts:2395` and `:2437`. `docs/decisions/screen-register.json` marks UX-POR-001 / UX-PRJ-002 / UX-COM-010 as **IMPLEMENTED**, and `docs/handoffs/LATEST.md:26,31` claims every `MOCK_*` on rewired surfaces was deleted. The page contains no demo/provenance banner (0 hits for banner/provenance/canonical-note in the file), while its 403 copy refers to "canonical records". Round 6B claims SCR-19 was rewired to `QuoteToCashSalesEngine`; the client portal was not.
**Do next:** rewire to the sales engine deals (the relationship-scoping helper `getClientOrgRelationship` already exists), or downgrade the register entries to `MOCK` and add the provenance banner.

**CA-10 · P1 · "48 desks" is a catalogue, not 48 operational surfaces**
`src/web/workspace/surface-bc.ts` does register exactly 48 `ENTERPRISE_WORKSPACES` entries, so the count is real. But `renderWorkspaceDeskHtml` (`surface-bc.ts:671+`) is a presentation shell emitting static metadata, a frozen date string ("2026-09-28") and an unconditional "Synchronized" badge. Only the desks with dedicated router handlers reach an engine — two independent sweeps counted this at 10 and 15 of 48; accelerator, guilds, events, tend, vcf, one, headspace, cr8tech, aos, vtm, content, approvals, cases, work and governance are the recurring set. The remaining ~33–38 render desk chrome over no canonical data.
**Do next:** produce an authoritative engine-backed desk count, then either implement the remainder or state plainly in the register that 48 = registered desk routes and N = engine-backed.

**CA-11 · P1 · The screen register counts entries, not screens, and verifies nothing**
`computeScreenRegisterCounts` at `src/core/config/screen-register.ts:69-82` only tallies JSON objects. One entry `"UX-PUB-001..028"` stands for 28 documented screens and counts as 1 — 23 of the 60 entries collapse an ID range into a single tally, and `"SCR-BCST-01...33"` collapses 33 screens into 1. The function does not check that an evidence path exists, that a route is mounted, or that the renderer uses real data. To be fair to the register: **all 60 cited evidence paths do exist**, and spot-checked IDs are genuinely present in the cited files (e.g. `UX-BR-012` in `src/web/workspace/governance-and-operations.ts`, `UX-COM-010` in `src/web/portal/client-portal.ts`) — it is not fabricated. It is simply not a verification instrument.
Independent route census from `src/api/router.ts`: 232 distinct literal paths + 35 `startsWith` prefixes, of which 106 are `/api/...` and ~131 are HTML/asset surfaces; plus the 33 dynamic `/broadcast/screens/*`. Real reachable HTML surfaces are ≈166, while `docs/audit/evidence-register.md:31` still asserts "225 system screens" — a figure `docs/decisions/DEC-RL1-SCOPE-001.md:16` already repudiated.
**Do next:** make the register expand ranges into discrete IDs and assert route-mounting + evidence-file existence per ID; correct the 225 figure everywhere it still appears.

**CA-12 · P1 · No durable system of record for most domains (violates canonical law 6/§37)**
138 module-level in-memory store declarations across `src` (`= new Map` / `= new Set` / `= {}`). Prisma is consulted in only 4 repositories (`campaign`, `invoice`, `schedule`, `talent`), `src/core/audit`, and the seed scripts. The schema has 27 models, but **none** of these documented core entities exists as a model, confirmed by direct `grep`:

| Entity | Prisma model | Used in src files |
|:---|:---|:---|
| `LedgerPosting` / `JournalEntry` (FIN-03, claimed done) | **0** | 1 / 2 |
| `ApprovalItem` (four-eyes, SCR-06) | **0** | 1 |
| `ContentRevision` (CMS, SCR-01/02) | **0** | 1 |
| `MediaAsset` (DAM picker, SCR-03) | **0** | 12 |
| `PrivacySecurityCase` (SCR-08) | **0** | 1 |
| `RiskRecord` / `IssueRecord` | **0** | 3 |
| `AzeeboDestination` (federation registry) | **0** | 1 |
| `Enquiry` (VS-RL1-01, the flagship vertical slice) | **0** | 10 |
| `SponsorBinding` (BCST-12) | **0** | 2 |
| `SessionRecord` / `IdempotencyKey` | **0** | 2 / 1 |

Plus entities the PRD requires that have neither model nor code: `CarriageAgreement`, `CarriageEndpoint`, `TrafficInstruction`, `EPGEntry`, `AdSpot`, `CampaignBooking`, `PromoAsset`, `ChannelEditorialProfile`, `BroadcastComplianceRecord` (0 grep hits each).
Every state described above evaporates on process restart and is invisible to a second instance. `docs/audit/evidence-register.md:31` nonetheless claims "domain invariants … verified", and `docs/handoffs/LATEST.md:13` claims the seed "persists 200 episode master references".
**Do next:** pick the release-critical domains (enquiry, approvals, content revisions, media assets, ledger postings, sessions/idempotency, cases) and give them tables + migrations + repository wiring with `fail_closed` as the default. Everything else should be explicitly labelled sandbox-state in the register.

**CA-13 · P1 · §39 canonical event catalogue is absent**
`grep` for the documented `broadcast.*` event names across `src` returns 0 matches. ADR-006 and PRD §39 describe an event-driven architecture; what exists is a `src/core/queue` worker with 4 registered handlers. The domain model in the documents and the domain model in the code are different systems.
**Do next:** either implement the event catalogue or supersede it by recorded decision.

**CA-14 · P1 · Schedule state machine does not match PRD §15**
`src/modules/broadcast/versions/index.ts:144` — `ScheduleState = DRAFT | PENDING_APPROVAL | APPROVED | AMENDED | LOCKED`. The PRD's chain (PROGRAMMING REVIEW → RIGHTS CHECK → TRAFFIC READY → ON AIR → AS-RUN RECONCILED → ARCHIVED) and schedule revision identity are absent (0 grep hits). BCST-03 is declared closed on the strength of the shorter machine.
**Do next:** reconcile — extend the machine, or record a decision that RL1 ships the reduced lifecycle.

**CA-15 · P1 · Federation registry violates its own ADR constraints**
`src/core/federation/destinations.ts:17` — in-memory `Map`; `:51-87` — statuses limited to `VERIFIED`/`REVOKED` where §41 requires `CANDIDATE`/`DEPRECATED`/`BLOCKED`; `:74` — hard-coded fallback destination `https://azeebo.plus`, a guessed production domain that CLAUDE.md `<azeebo>` ("Never invent production endpoints") and PRD §41 both prohibit.
**Do next:** remove the guessed default (require explicit configuration and fail closed), complete the status set, persist the registry.

**CA-16 · P1 · Make-good resolution returns canned success**
`src/modules/broadcast/traffic/index.ts:153-156` — `resolveMakeGood()` dequeues and returns `resolved: true` without rebooking inventory or creating the credit-note linkage FIN-07 claims. BCST/FIN-07 is marked closed.
**Do next:** implement the rebooking + credit-note posting, or downgrade the register status.

### 2.3 P1 — Security and privacy

**CA-17 · P1 · Server-side authorization is real, but its test is currently unloaded**
`src/api/router.ts:609+` carries a default-deny `ROUTE_GUARDS` table (~80 declarations) and `tests/security/route-authorization.test.ts` exercises it — but that file fails to import because of CA-01, so authorization is presently *unverified*, not verified. CLAUDE.md `<security>` requires proof.
**Do next:** restore the build, re-run, and pin the guard-count assertion.

**CA-18 · P1 · Plaintext-capable PII/credential columns (carry-over AUD-06, only half closed)**
`prisma/schema.prisma:90,107` — `Person.nationalId` and `User.mfaSecret` are plain `String?`. `audit.md §5.2` records the interim position: `mfaSecret` sealed at the KV auth-store boundary, `nationalId` documented as "envelope-only". Documentation is a mitigation, not enforcement: nothing prevents a future write path storing plaintext, and there is no key-rotation or decryption-access-logging control.
**Do next:** enforce at the write boundary (reject unsealed values), then own the key-management decision with the DPO.

**CA-19 · P1 · Data-subject export cannot be fulfilled**
`src/api/routes/privacy.routes.ts:15,108` — honest stub text stating archive generation is not implemented, and §5.2/§8 of the schema migration add a durable `DataSubjectRequest` ledger. There is still no export generator, no SLA clock, and no operator transition path. Canonical law 12 and NDPR obligations are unmet in substance even though the interface is truthful.
**Do next:** implement the archive job (queue handler already exists to hang it on) or declare DSR export explicitly out of RL1 scope by decision record.

**CA-20 · P1 · `logStructured` now emits — verified good; but OTLP/trace export remains test-only**
`src/core/observability/index.ts:160-181` does `console.log(serialized)` (AUD-16 genuinely fixed). The OTLP exporters are referenced only by tests, so ADR-011's observability standard is not met in a real deployment.
**Do next:** wire OTLP export in production config and prove it with a runnable check.

### 2.4 P1/P2 — Governance and traceability integrity

**CA-21 · P1 · The AC traceability index mostly cites criteria that appear nowhere in the tests**
`docs/audit/ac-traceability-index.md` marks journeys **VERIFIED** with AC-ID blocks. Grepping the literal IDs in `tests/`:
- Present: `AC-UI-RL1-R03-01…06,08,11` (enquiry drill), `AC-SCR-03-01…03` (todo-final-remediation).
- **Claimed but absent from every test file:** `R03-07/09/10/12` (while the row claims "12 criteria — full AC coverage"); **all** of `AC-UI-RL1-R02-01…14`, `R05-01…09`, `R06-01…12`, `R07`, `R08`, `R09`, `R10`, `R11`; `AC-SCR-03-04`, `AC-SCR-03-05`; `AC-PRC-08-01`.
The file's own maintenance rule (`ac-traceability-index.md:25`) invalidates a completeness claim without an indexed AC block — by that rule most of the index is invalid.
**Do next:** add the literal AC IDs as assertion labels in the cited tests, or downgrade the rows to IMPLEMENTED/PARTIAL.

**CA-22 · P2 · Citations to authority documents that are not in the repository**
`docs/authorities/` contains exactly three files (PRD R1.2A, CCPP R1.1, EXEC-001). Documents and code nevertheless cite, as if available: `VMNL-AZP-VMN-UIUX-001` (2×, incl. `docs/decisions/DEC-RL1-SCOPE-001.md:5`), `VMNL-AZP-VMN-UIUX-CCPP-001` (5×, incl. the readiness matrix's §4.1 and the perf budget's §7.7), `VMNL-AZP-VMN-UIUX-REG-001`, `VMNL-AZP-VMN-DESIGN-TASK-001` (2×, the source of every `DT-*` rule), `VMNL-AZP-VMN-CDDS-001` (2× — cited at `docs/domain/master-data-model.md:3` as the authority for the data model), `VMNL-AZP-VMN-TODO-001`.
Also **phantom sub-sections**: `CCPP §2.2`, `§4.1`, `§5.2`, `§7.7`, `§1.4`, `§1.5` do not exist — the CCPP is numbered as top-level `N. TITLE` sections 0–38 with no decimal subsections. §16/§18/§19 are real. (Independent check: PRD is numbered to **§77**; the "§283"/"§158" PRD subsections mentioned in commit history appear nowhere in the PRD or in any `src/` citation.)
**Do next:** import the missing authorities into `docs/authorities/`, or repoint each citation at the section that actually says what is claimed. A register that cites unreachable documents cannot be audited.

**CA-23 · P2 · CCPP §3 governance structure is materially incomplete**
`docs/authorities/VMNL-AZP-VMN-CCPP-001-R1.1.md:195-249` prescribes a governance layer. Missing outright: `docs/architecture/{overview,domains,integrations,deployment}.md` (directory holds only `descoped-modules.json`), `docs/domain/{canonical-model,data-dictionary,state-machines,systems-of-record}.md` (only `master-data-model.md` exists), `docs/api`, `docs/events`, `docs/broadcast`, `docs/azeebo`, `docs/security` (**including `threat-model.md`, required by CCPP §16**), `docs/privacy`, `docs/testing`, `docs/migrations`, `docs/operations`, `docs/prompts`. Test-layer directories `tests/domain`, `tests/e2e`, `tests/migration` are absent (`contract`/`a11y` exist under different names). CCPP does allow the structure to "adapt to the real stack" — but the *relationships* (documented state machines, systems of record, threat model) are substantive and genuinely missing, which is the same root cause as CA-12/CA-14.
**Do next:** write `state-machines.md` and `systems-of-record.md` from the real code, and the threat model, before the next gate review.

**CA-24 · P1 · Governance contradiction: a signed release decision against an unsigned scope decision**
`release-manifest.json` records `decision: GO_WITH_CONDITIONS`, `humanReleaseOwner.signedAt: 2026-09-28`, and `conditionsAcceptance.acceptedBy: "Femi Aderibigbe"`. `docs/decisions/DEC-RL1-SCOPE-001.md:8` is still `PENDING_SIGNATURE` with **all ten** scope allocations D-01…D-10 marked `[PENDING]` and the acceptance box unchecked (line 52). The project has recorded executive acceptance of a release whose scope has no executive acceptance. Separately the manifest pins `gitCommitSha: ca303f0` — five commits and ~8,200 changed lines stale; the CI gate step runs `gates:check` without `--allow-sha-drift`, so the artifact it evaluates describes code that no longer exists.
**Do next:** re-pin the SHA at the next green commit and either obtain the D-01…D-10 signatures or set the manifest decision to `NOT_APPROVED`.

**CA-25 · P2 · Stale and self-inconsistent registers**
- `docs/audit/journey-readiness-matrix.md:6` — "Reconciled 2026-09-30"; its VERIFIED rows cite five test files that now fail to load.
- `docs/audit/evidence-register.md:31` — still asserts "225 system screens" after `DEC-RL1-SCOPE-001.md:16` repudiated it.
- `docs/design-debt-register.md` — every DEBT item is keyed to `DT-*` rules from the absent DESIGN-TASK-001 (CA-22); its own §2.2 makes expired debt block BG gate clearance, and DEBT-004 expires **2026-10-31** (24 days away) with status still `[PROVISIONAL COMPLIANCE DD-4]`.
- `docs/audit/performance-budgets.md` — all five budgets remain **TARGET**; the required artifact directory `docs/audit/evidence/perf-<date>/` does not exist, so §7.7 stays NOT_RUN. Nothing has been measured.
**Do next:** re-reconcile each register against the tree after CA-01, and either produce the perf artifacts or state that G-gate §7.7 is unverified.

**CA-26 · P2 · Prior audit's open items are still open**
`audit.md` (2026-10-05, 25 findings: 7 High / 11 Medium / 1 Low + others) recorded §5.3 as open: AUD-12 (untyped `parseJsonBody` with `any` flowing into domain handlers, `no-explicit-any` disabled in `eslint.config.js:21`), AUD-18 (7,687-line monolith `src/api/router.ts`), AUD-19 (no real-browser Playwright/axe run — `pnpm test:a11y` exists but is unproven), AUD-20 (inline-style→class migration — **attempted 2026-10-06 and left the tree unbuildable**, 37 `style="` occurrences remain), AUD-22 (Compose hardening: unauthenticated Redis, backup job privileges), AUD-13 (two conflicting error contracts: RFC 9457 `problem+json` on the modular routes vs ad-hoc `{error,message,code}` in the monolith). AUD-03/04 remain partially wired — `kvGetJson` is still Map-first, so a wired Redis is a write-only mirror.
**Do next:** note that AUD-20 is now *causally implicated* in CA-01. Finish the migration with a syntax-safe transform and re-gate, or revert it wholesale.

### 2.5 P3 — Hygiene

**CA-27 · P3 · 114 dirty paths with no commit boundary.** 96 modified + 18 untracked, including the migration script (`scripts/`), vitest config, three Prisma migrations, `src/api/routes/`, `src/api/schemas/`, `audit.md` itself, and `prisma/migrations/migration_lock.toml`. Untracked migrations are a deployment hazard: `prisma migrate deploy` in CI will not see them consistently. Evidence documents pin commit SHAs that don't contain the work they describe.
**Do next:** land this as a coherent commit series (fix-first, then the token migration) so the evidence registers can be re-pinned truthfully.

**CA-28 · P3 · Route ownership is spread across three places.** `src/api/server.ts` registers no routes itself (it delegates to `handleApiRequest`, `server.ts:36,284`) while documents describe it as the API surface; `src/api/routes/` (new) hosts only 2 domain routers; the rest live in the 7,687-line monolith. This is the AUD-18 symptom, not a separate defect.

**CA-29 · P3 · Secrets hygiene is genuinely good** — verified, not assumed: `.env` is untracked and gitignored (`.gitignore:60`), `.env.example` carries no live values, gitleaks runs in CI. Preserve as-is.

**CA-30 · P3 · The style injector dropped attributes at two sites**
`src/web/broadcast/index.ts:546` renders `class="s-sj5T5qvyn0" class="vmn-pulse-dot"` and `src/api/router.ts:5939` renders `class="s-NpaiBgA8Dx" class="card"`. HTML parsers keep the first duplicate attribute and ignore the rest, so `vmn-pulse-dot` and `card` are silently lost — those elements render unstyled even once the build is fixed.
**Do next:** merge into a single `class` attribute at both sites and add a lint/test rule rejecting duplicate attributes in rendered HTML.

**CA-31 · P3 · Route-guard census is incomplete by construction**
`ROUTE_GUARDS` (`src/api/router.ts:680`) declares 71 method+path guard entries against 106 `/api/...` routes, and the lookup at `:997-1000` matches only method and path — there is no tenant/org dimension in the table. Cross-org isolation for counterparty data therefore lives entirely in handler code (e.g. `getClientOrgRelationship`), not in the central enforcement point. This is defensible but undocumented, and there is no parity test asserting "every mutating route has a guard entry".
**Do next:** add a contract test that fails when a mutating route lacks a guard, and document which routes rely on in-handler scoping.

**CA-32 · P3 · Two parallel rights implementations**
`src/core/rights/index.ts` (review-request workflow) and `src/modules/broadcast/rights/index.ts` (the actual clearance engine) are separate, non-communicating modules with overlapping names. This is how CA-07 went unnoticed: the review-request module is wired and tested, so the domain *looks* covered while the gate is not.
**Do next:** consolidate into one rights context and make the review-request module write to the same durable `RightsRecord` the gate reads.

---

## 3. What is genuinely complete (preserve this)

Not everything is a gap. These were verified in this tree and should not be re-litigated:

- **Financial integrity model.** The 7-way separation is real and enforced in the domain (`src/core/domain/types.ts:141-157`), kobo-exact, with `tests/unit/finance-minor-units.test.ts` and `reconciliation-mt940.test.ts` passing. MT940 parsing and webhook replay protection are implemented and tested.
- **Release gates are honest.** `src/modules/quality/gates.ts:129-218` evaluates BG0–BG9 and, critically, treats `NOT_TESTED` as never-PASS: `release-manifest.json` carries `BG6_CARRIAGE: NOT_TESTED`. The `docs/audit/*` registers consistently name human owners for blocked items (`docs/audit/journey-readiness-matrix.md:34-40`). This is unusually disciplined evidence practice and matches canonical law 20.
- **Security controls exist and are substantive.** RFC 6238 TOTP with anti-replay (`src/core/auth/totp.ts`), session registry with revocation, double-submit CSRF with Origin allow-list (`src/core/websecurity/index.ts`), idempotency keys, default-deny `ROUTE_GUARDS`, tamper-evident SHA-256 audit chain, bcrypt with seed credentials decoupled from source.
- **Repository fail-closed policy is the right design** (`src/core/database/repository-mode.ts`), `.env.example` correctly ships `ALLOW_SANDBOX_FALLBACK=false` and `ALLOW_MEMORY_KV_IN_PRODUCTION=false`, boot refuses fallback in production/staging, and `logStructured` emits. AUD-10/11/16/21/25 are genuinely closed.
- **Breadth of working domain engines:** 144 source files spanning broadcast, finance, hub, federation, intelligence, quality — with a 20-drill UAT failure suite and 13 journey failure drills that pass when the tree compiles.
- **The design-token CSS pipeline itself is sound** — 1,399 generated utilities are compiled into `CANONICAL_STYLESHEET` (`src/web/styles/index.ts:2518`), served at `/assets/styles.css`, linked by the single HTML shell; cross-check found 1,332 used classes and **0 undefined**. Only the *expression corruption* (CA-01) and the touch-target assertion (CA-03) are wrong.

---

## 4. Completion assessment by domain

| Domain | Documents require | Tree delivers | Completion |
|:---|:---|:---|:---|
| Identity, RBAC, sessions | CCPP §29, PRD §48/§49, law 1 | Engines + guards complete; tests unresolvable (CA-01), roles ≈10 of 17 documented | **~80% / unverified** |
| Broadcast scheduling & rights | PRD §15/§62, BR-011, law 8 | Lifecycle + QC real; rights gate **not enforced** (CA-07); state machine reduced (CA-14) | **~45%** |
| Broadcast operations (33 screens) | PRD §46 | 33 routes mounted; 0 engine-wired (CA-08) | **~25% (shell)** |
| Finance quote-to-cash | PRD §42, FIN-01…08 | 7-way, ledger, MT940, WHT, reconciliation verified; no durable ledger table (CA-12); make-good canned (CA-16) | **~65%** |
| Creative economy hub / 48 desks | PRD §27–34 | 48 registered, ~10 engine-backed, 1 portal still mock (CA-09/10) | **~40%** |
| Azeebo+ federation | PRD §40–41, ADR-008 | Links + HMAC bridge work; registry guessed/in-memory (CA-15); SSO deferred by decision | **~50%** |
| Content & DAM | PRD §55, SCR-01…03 | Revision domain + picker logic exist; **no persistence** for either (CA-12) | **~40%** |
| Privacy & DSR | Law 12, PRD §55 | Truthful stubs, DSR ledger added, no fulfilment (CA-19), PII columns unenforced (CA-18) | **~35%** |
| Persistence / system of record | PRD §37, ADR-003, law 6 | 27 models; 4 repositories wired; 138 in-memory stores | **~20%** |
| Events / ADR-006 | PRD §39 | 0 of the documented catalogue (CA-13) | **~10%** |
| Testing pyramid & traceability | CCPP §14/§29/§33 | 48 files, good spread; 20 failing; AC index largely unbacked (CA-21) | **~50%** |
| Governance docs | CCPP §3/§8/§16 | 3 authorities present, 5 cited-and-absent; structure incomplete (CA-22/23); stale registers (CA-25) | **~45%** |
| Operations (DR, perf, observability) | CCPP §18/§19/§21 | Backup drill run (restore 0.132 s, table parity) — real; performance budgets never measured; OTLP unwired | **~55%** |

**Overall: the project is not complete.** Roughly 45–50% of documented scope is implemented with evidence; the RL1 vertical slices are further along than the enterprise-wide ambitions. Current maturity is **below the claimed Tier S2**, because S2 presumes a green, reproducible verification baseline and this tree has none.

---

## 5. Prioritized work list

**Sprint 0 — restore a trustworthy baseline (blocking; ~1–2 days)**
1. CA-01 repair the 3 corrupted ternaries (or revert the 3 files) so `pnpm build` exits 0.
2. CA-05 remove the unused `isStringRecord`; confirm `pnpm lint` exits 0.
3. CA-02 re-run `pnpm test`; confirm 17 files return.
4. CA-03 fix DT-202 to assert the token-resolved touch target.
5. CA-04 fix the FK-ordered test fixtures.
6. CA-27 commit as a clean series; re-pin `evidence-register.md` and `LATEST.md` to the **measured** numbers, and delete every figure that is not reproducible from a command in this repo.
7. CA-06 decide the fate of `tasks.md`/`todo.md` and repoint all `TODO-*` references.
8. Verify the database story end-to-end once the build is green: run `prisma migrate deploy` against a scratch Postgres (three of the four migrations are currently untracked — CA-27), confirm all 27 models deploy, and resolve whether the FK failures in CA-04 are fixture ordering or a real constraint defect.

**Sprint 1 — close the compliance-critical substance gaps (~1–2 weeks)**
9. CA-07 enforce the rights gate server-side (load `RightsRecord` from durable store; call `validateScheduleRights` in `approveSchedule` and at export). Highest value in the backlog. Consolidate the two rights modules while there (CA-32).
10. CA-12 give enquiry, approvals, content revisions, media assets, ledger postings, sessions/idempotency durable tables + migrations + repositories.
11. CA-08 wire the 33 screens to `getScreenData`; delete `SCREEN_DECISIONS` and the empty-string playlist hash.
12. CA-09 rewire the client portal to the sales engine.
13. CA-21 put the literal AC IDs into the cited tests or downgrade the index.
14. CA-24 resolve the signed-manifest vs unsigned-scope contradiction; re-pin the SHA.

**Sprint 2 — governance and quality debt**
15. CA-22/23 import or repoint the missing authorities; write `docs/security/threat-model.md`, `docs/domain/state-machines.md`, `docs/domain/systems-of-record.md`.
16. CA-11 make the screen register per-ID and self-verifying.
17. CA-13/CA-14 implement or formally defer the event catalogue and the full schedule lifecycle.
18. CA-15/CA-16/CA-17/CA-18/CA-19/CA-20 federation registry hardening, make-good rebooking, authorization re-verification, PII write-boundary enforcement, DSR fulfilment, OTLP wiring.
19. CA-26 finish AUD-12/13/18/19/20/22 (typed request boundaries; one error contract; router decomposition; real-browser a11y; complete style migration safely; Compose hardening).
20. CA-25/CA-28 produce performance-budget artifacts under `docs/audit/evidence/perf-<date>/`, refresh the design-debt register (DEBT-004 expires 2026-10-31), consolidate route ownership.
21. CA-30/CA-31 fix the two dropped-attribute render sites and add a mutating-route↔guard parity contract test.

**Human decisions required (cannot be engineered — these block full completion)**
- D-01…D-10 scope acceptance signatures (`DEC-RL1-SCOPE-001`, all `[PENDING]`).
- Revenue-recognition accounting ruling (GVR-05 / FIN-01 C-2) — Finance Controller.
- Rights override interpretation (GVR-04 / C-1) — General Counsel.
- StarTimes carriage machine data (BCST-07 / BG6) — Carriage Platform Owner.
- Key-management ownership for sealed PII (CA-18) — DPO.
- DSR SLA and archive policy (CA-19) — DPO.
- Real-user usability validation (PRC-05) and manual WCAG 2.2 AA coverage (PRC-06).

---

## 6. Claims examined and *not* substantiated

Several alarming assertions circulating about this repo (from automated sweeps and from the audit documents themselves) did not survive direct verification. They are recorded here so nobody re-works them or "fixes" a non-existent defect:

| Claim | Source | Result |
|:---|:---|:---|
| "Production boot is impossible — `AUTH_BYPASS_ENABLED=true` satisfies config validation but `server.ts` throws unconditionally" | sweep | **FALSE.** `src/api/server.ts:58-63` throws only when bypass is `true` **and** `NODE_ENV` is `production`/`staging` — that is the intended control, not a contradiction. `src/core/config/index.ts:78-79` gates its strict rules on the same two environments. Production bootability is therefore *not disproven*; it is simply untestable while CA-01 breaks the build. |
| "20–26 `Person` columns exist in the schema but in no migration (schema/migration drift)" | sweep | **NOT SUPPORTED.** Field-by-field comparison of `model Person` against `prisma/migrations/0_init/migration.sql`: 9 scalar columns in each. The 4 apparent differences (`user`, `talentProfile`, `creatorProfile`, `contracts`) are **relation fields**, which generate no columns. |
| "`ensureScheduleDemoSeed` is never called at boot, so schedule surfaces are empty" | sweep | **FALSE.** Imported at `src/api/server.ts:49` and called at `src/api/server.ts:307`. |
| "5 register entries cite evidence files that contain none of their UX IDs" | sweep | **FALSE.** Spot-checked `UX-BR-012` → present in `src/web/workspace/governance-and-operations.ts`; `UX-COM-010` → present in `src/web/portal/client-portal.ts`. All 60 evidence paths exist. |
| "The HTML layout shell lost `<!DOCTYPE html>` / `<html lang>` in the style migration" | sweep | **FALSE.** `src/web/public/dashboard.ts:200` emits `<!DOCTYPE html>`, `<html lang="en">`, viewport meta, and the stylesheet link. The a11y suites fail because of CA-01, not a broken shell. |
| "`tests/a11y/accessibility-audit.test.ts:141-149` asserts stale inline touch-target styles" | sweep | **FALSE.** The file is 123 lines and asserts a 44×44 target configuration (`:51-52`), not an inline attribute. The stale-touch-target problem is real but lives in `tests/unit/styleguide.test.ts:107` (CA-03). |
| "Only 3 of 33 broadcast screens emit the mock-data provenance banner" | sweep | **UNCONFIRMED.** `renderMockDataBanner` has one call site (`src/web/broadcast/index.ts:1163`) inside the shared per-screen template, so it applies to every screen routed through that path. Six screens have bespoke panels and may bypass it — worth checking, but the "3/33" figure is not established. |
| "`prisma migrate deploy` fails (P3006/P2022) and the database is unreachable at runtime" | sweep | **NOT VERIFIED.** Prisma 7 requires `datasource.shadowDatabaseUrl` in `prisma.config.ts` to diff a migrations directory, and setting it means editing config — out of scope for a read-only audit. Note the FK violations in CA-04 prove a database *is* reachable from this environment. Run `prisma migrate deploy` against a scratch database as the first post-CA-01 step. |
| "506/506 tests, zero skips, `tsc --noEmit` clean" | `docs/handoffs/LATEST.md:13`, `docs/audit/evidence-register.md:18,27,78` | **FALSE today** (see §1). These are the claims that led to this audit. |
| "Shipped stylesheet size breaches the frozen performance budgets" | sweep, could not be re-measured 2026-10-07 | **SUBSTANTIATED for the stylesheet, NOT substantiated for the pages** — measured 2026-10-14 (`TSK-42`). `/assets/styles.css` is 212,853 B over identity encoding against DEBT-008's 25 KB single-stylesheet wording (8.3×) and alone exceeds the 120 KB per-view budget (a full view measures 250,409 B; 47,352 B once gzip is negotiated). The two page budgets are met: `/` 20,308 B and `/channels/nxtr` 17,945 B (≤ 25 KB), SCR-BCST-01 21,162 B (≤ 65 KB). Do not re-run this sweep; the numbers are pinned by `tests/unit/performance-budget-measurement.test.ts` and the miss is DEBT-008. |
| "Rendered HTML interpolates unescaped data widely" | sweep, could not be re-measured 2026-10-07 | **SIZED, NOT ADJUDICATED** — measured 2026-10-14 (`TSK-42`): **299** interpolation sites in `src/web/` sit on a markup-bearing line that does not mention `escapeHtml(`, across 32 files (top eight carry 163). That is a **ceiling**, not a defect count: numeric fields, CSS tokens and values escaped earlier are all inside it, and no site is claimed exploitable. `escapeHtml` itself is proven to neutralise `<`, `>`, `&`, `"` and `'` and has 395 call sites. Triage of which sites receive externally-sourced strings is open work, recorded as DEBT-009 and ratchet-pinned by `tests/unit/html-escape-census.test.ts`. Do not re-derive this by eye. |

This table is a **standing "do not re-investigate" list** (`TSK-42` box 2): a claim in it has either been
disproved, or measured and pinned by a test in this repository. Re-opening one requires re-running the cited
test or artifact, not re-reading the source. Rows added after 2026-10-07 name the task and date that closed them.

Two genuine problems surfaced by the same sweeps that I could not independently re-measure, and which should be checked rather than assumed: the shipped stylesheet's size versus the frozen 25 KB / 65 KB budgets (`docs/audit/performance-budgets.md` lists budgets the project has never measured — CA-25), and the extent of unescaped interpolation into rendered HTML. Both are cheap to test; both belong in the Sprint 1 verification pass.

---

## 7. Reproducing this audit

```bash
pnpm build          # exit 2 — 152 errors in 3 files (CA-01)
pnpm test           # exit 1 — 20/48 files fail; 274 pass / 4 fail / 4 skip
pnpm lint           # exit 1 — 4 errors
git status --porcelain | wc -l          # 114 dirty paths (CA-27)
git diff --shortstat                    # 96 files, +8237 / -6555
grep -c "^model " prisma/schema.prisma  # 27
grep -rc "= new Map\|= new Set\|= {};" src --include="*.ts" | awk -F: '{s+=$2} END {print s}'  # 138 in-memory stores (CA-12)
grep -rn "rightsClearedBy" src/modules/broadcast/versions/index.ts   # CA-07
grep -rn "getScreenData" src tests --include="*.ts"                  # CA-08 (dead in src)
grep -rn "MOCK_CLIENT_PROJECTS" src --include="*.ts"                 # CA-09
```

*Every finding above cites a file:line or command verified in this working tree on 2026-10-07. Where a document's claim could not be reproduced, it is recorded as a finding rather than assumed true. This audit is read-only: no source file was modified.*
