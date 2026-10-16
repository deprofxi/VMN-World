# VMNL Engineering Task Register — Completion Remediation

**Document:** `VMNL-AZP-VMN-TODO-002 — R1.0`
**Title:** Completion Remediation Register (Phase 7)
**Derived from:** `report.md` — `VMNL-REPO-COMPLETION-AUDIT-001` (2026-10-07)
**Supersedes:** `todo.md` (deleted, uncommitted) and `tasks.md` (deleted, uncommitted) as the *live* register. Historical `TODO-SEC-*`, `TODO-SCR-*`, `TODO-BCST-*`, `TODO-FIN-*`, `TODO-PRC-*`, `TODO-GVR-*`, `TODO-DOC-*` identifiers are **inherited, not renumbered** — where an inherited item is still open it is reopened here under its original ID (see §1.3).
**Governing Authorities:** `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A` · `VMNL-AZP-VMN-CCPP-001 — R1.1` · `VMNL-AZP-VMN-EXEC-001` · `CLAUDE.md`
**Classification:** Living task register. This is the spine of the evidence system; it must not be left half-deleted (CA-06).
**Date opened:** 2026-10-07
**Baseline commit:** `ce098f8` + 96 modified / 18 untracked paths

---

## 0. Rules of engagement

Read these before closing any task. They are inherited from `CLAUDE.md` and `CCPP-001`, not invented here.

**0.1 — Closing protocol.** A task moves to `DONE` only when all four are true:
1. the code change exists at the cited location;
2. an executable test asserts the *business behaviour* (not that a function was called);
3. `pnpm build`, `pnpm lint` and `pnpm test` all exit 0 on the same commit;
4. the evidence artifact in §7 exists in the tree at that commit.

**0.2 — Evidence before claims (canonical law 20).** No task may be closed, and no register may be re-pinned, on a number that cannot be reproduced by a command in this repository. The failure mode this register exists to prevent is the one recorded in `report.md §1`: `docs/handoffs/LATEST.md:13` and `docs/audit/evidence-register.md:18,27,78` asserted "506/506 tests, zero skips, `tsc --noEmit` clean" while the tree failed to compile.

**0.3 — Never weaken a gate to pass it.** Do not delete, skip, or relax an assertion to achieve green. If an assertion is genuinely stale (e.g. `TSK-04` below), replace it with an assertion of equivalent strength against the new mechanism and record why in the commit message.

**0.4 — Honest states only.** Allowed task statuses: `OPEN`, `IN_PROGRESS`, `BLOCKED_HUMAN` (owner named in §5), `BLOCKED_ENV` (dependency named), `DONE`, `WONT_DO` (decision record cited). `NOT_TESTED` is never rendered as `PASS` — the rule `src/modules/quality/gates.ts:129-218` already applies to BG6.

**0.4a — Sandbox state is not persistence.** Where a task cannot yet be made durable, label it `sandbox-state` in the register rather than implying storage. The claim "`persists 200 episode master references`" (`docs/handoffs/LATEST.md:13`) against a `new Map()` store (`src/core/storage/index.ts:317`) is the pattern to avoid.

**0.5 — Scope discipline.** Do not refactor the router (`TSK-45`) concurrently with a functional fix. Do not re-run the style migration (`TSK-48`) concurrently with anything that edits `src/web/**`.

**0.6 — Ordering is binding.** §6 dependency graph gates the tracks. Track A must reach `DONE` before Track B/C/D claims are permitted in any register, because nothing is currently verifiable.

---

## 1. Register summary

### 1.1 Counts

Measured 2026-10-09 by parsing this file's own `#### TSK-nn · Pn ·` headings (`node -e` over the
headings, per track) — the columns below are the register **as it now stands**, not the audit's
original plan. The 2026-10-07 version of this table (65 tasks, Track A P0 6 / P1 2 / P2 1, Track D 5,
Track F 3, total 65) was written before any task had been re-prioritised or before the new-finding
items existed, and had silently drifted from the document it summarises; that is why it is replaced
rather than footnoted. Track A's P0 count is 8 because `TSK-01`…`TSK-08` were all landed at P0, and
`TSK-58`/`TSK-59`/`TSK-60` are counted in their own tracks.

| Track | Scope | Tasks | P0 | P1 | P2 | P3 |
|:---|:---|:---|:---|:---|:---|:---|
| A — Build & verification integrity | restore a trustworthy baseline | 9 | 8 | 1 | 0 | 0 |
| B — Rights & broadcast compliance | canonical law 8, PRD §15/§46/§62 | 7 | 0 | 7 | 0 | 0 |
| C — Persistence / system of record | PRD §37, ADR-003, law 6 | 6 | 0 | 4 | 2 | 0 |
| D — Surfaces, desks & provenance | PRD §46, §27–34 | 5 | 0 | 4 | 1 | 0 |
| E — Security & privacy | law 12, PRD §49/§55/§56 | 6 | 0 | 5 | 1 | 0 |
| F — Finance integrity | PRD §42, FIN-03/07 | 4 | 0 | 3 | 1 | 0 |
| G — Federation (Azeebo+) | PRD §40–41, ADR-008 | 2 | 0 | 2 | 0 | 0 |
| H — Governance & document integrity | CCPP §3/§8/§16 | 6 | 0 | 2 | 4 | 0 |
| I — Testing, traceability & a11y | CCPP §14/§29/§33 | 5 | 0 | 2 | 3 | 0 |
| J — Operations, performance, observability | CCPP §18/§19/§21 | 5 | 0 | 0 | 4 | 1 |
| K — Hygiene | P3 | 5 | 0 | 0 | 0 | 5 |
| **Total** | | **60** | **8** | **30** | **16** | **6** |

Plus **12 human decisions** (§5, not engineerable — verified by counting the `HD-nn` rows in that
table) and **4 scope deferrals** (§6).

### 1.2 Immediate posture

| Dimension | Value |
|:---|:---|
| Release posture | **BLOCKED — no green *verified* baseline.** As audited 2026-10-07: CI fails at `.github/workflows/ci.yml` step 3 (`pnpm run typecheck`). Re-measured 2026-10-09: typecheck, lint, build and the full suite pass **locally** on the working tree (see the pin in `docs/handoffs/LATEST.md`), and re-measured 2026-10-15 the same gates are green on the committed series (`docs/audit/evidence/tsk09-commit-series-2026-10-15/`: lint/typecheck/build `0`, `pnpm test` 77 files / 865 tests `0`, `pnpm test:coverage` `0`), but CI has still never run on any of it — `TSK-06` and `TSK-09` closed on the tree, `TSK-57` (the CI runs themselves) is the open half — so the posture is unchanged and a local green may not be published as a verified green. |
| Maturity tier claim | The "Tier S2" claim in `docs/audit/evidence-register.md:77` is **withdrawn pending Track A** — S2 presumes a reproducible verification baseline and this tree has none. |
| Highest-value single fix | `TSK-10` (rights gate enforcement) — described in `report.md CA-07` as "the single highest-value functional fix in the project". **Delivered 2026-10-07**; the row is kept as the audit's original finding. |
| Estimated Track A effort | 1–2 days (`report.md §5` Sprint 0). **Actual:** Track A landed 2026-10-07/08; `TSK-06` and `TSK-09` closed 2026-10-15 with the commit series (`6c44cc7`…`85aad76` + the docs/register commit), so all nine Track A tasks are `DONE` — none of them has been seen by CI, which is `TSK-57`. |

### 1.3 Inherited open items (reopened, not renumbered)

| Inherited ID | Where it is still marked open | Reopened as | Note |
|:---|:---|:---|:---|
| `TODO-BCST-01` | `docs/decisions/screen-register.json:87` "engine wiring remains open"; `docs/audit/design-gate-closure-records.md:14` DG-RL1-06 **OPEN**, expiry 2026-10-31; the provenance label at `src/web/broadcast/index.ts:1088` | `TSK-11` | Reopened 2026-10-07 because `docs/handoffs/LATEST.md:54` claimed it closed as a "provenance layer" while **0 of 33** screens reached an engine. **6 of 7 boxes closed 2026-10-11:** the fabricated per-screen KPI table, the invented carrier bar, the empty-string playlist hash, the invented advertiser as-run rows and the invented revenue panel are deleted and instrument-guarded; the entry stays `MOCK` because, measured at the route on 2026-10-12 after the router began supplying its engine snapshots, **31/33** screens still render at least one `NOT_CONNECTED`/`PROVISIONAL` badge and only **2/33** emit a `DOMAIN_ENGINE` one, and the register cannot express that state until TSK-60 box 4 lands. |
| `TODO-SEC-10` | `docs/audit/journey-readiness-matrix.md:17` "Redis adapter = TODO-SEC-10" | `TSK-27` | Reopened 2026-10-07 because the boot-wired Redis was a **write-only mirror** (`audit.md §5.2`, CA-26). **Closed 2026-10-10:** the Map-first `kvGetJson` is deleted (`grep -rn "kvGetJson" src/` → 0) and every auth/session read is adapter-first (`findUserByEmail` `src/core/auth/index.ts:578`, entry-point prime `src/api/router.ts:1148`); lockout and the one-time MFA claim are atomic (`:726` `incrBy`, `:91` `setIfAbsent`, fail-closed). |
| `TODO-FIN-07` | reopened here 2026-10-08 after `docs/handoffs/LATEST.md` claimed it closed | `TSK-16` + `TSK-33` | Both reopen causes are now closed: `resolveMakeGood` rebooks real inventory (`src/modules/broadcast/traffic/index.ts:200-260`), and a make-good credit note is journaled as a contra item before the exception closes (`modules/finance/ledger/posting.ts:235`, wired at `api/server.ts:299`). |
| `TODO-SCR-19` | claimed closed in `docs/handoffs/LATEST.md:30` | `TSK-13` | Reopened 2026-10-07 because the client counterparty portal had never been rewired and `MOCK_CLIENT_PROJECTS` fed it (CA-09). **Closed 2026-10-09:** the fixture is deleted with a guard test and the portal projects canonical `QuoteToCashSalesEngine` deals. The two halves no canonical record can answer are registered as **TSK-60** rather than left implied. |
| `TODO-GVR-04` | open as human decision (`docs/handoffs/LATEST.md:21`) | `HD-02` | Retained as human decision; note it does **not** excuse `TSK-10`, which is pure server-side enforcement. |
| `TODO-PRC-05`, `TODO-PRC-06` | open as human decisions (`docs/handoffs/LATEST.md:21`) | `HD-08`, `HD-09` | Manual usability and manual WCAG coverage. |
| `TODO-DOC-05` | evidence re-pinning (`docs/audit/evidence-register.md:18`) | `TSK-08` | Pin is stale by five commits and states figures the tree cannot produce. |

### 1.4 Inherited identifier census — the retired register's 71 items *(TSK-07)*

**Measured 2026-10-08** (re-derives the 2026-10-07 snapshot as items closed: `TODO-BCST-03` when
TSK-12 landed the §15 machine, `TODO-DOC-05` when TSK-08 re-pinned the evidence documents):
71 register items = **72 identifiers** (`TODO-BCST-08/09` is one item covering two IDs) · 71 census
rows · **0** cited identifier without a row · dispositions
CLOSED 58 · CLOSED-with-open-human-column 4 · REOPENED 4 · HUMAN 5.

**Decision record:** `docs/decisions/DEC-REGISTER-SURVIVOR-001.md` — this register
(`VMNL-AZP-VMN-TODO-002 — R1.0`) is the surviving register; `VMNL-AZP-VMN-TODO-001` (`todo.md`) is
retired, and `VMNL-AZP-VMN-TASK-001` (the previous `tasks.md` content) is superseded with its
`TASK-P<n>-<nn>` labels kept as historical, non-normative tags.

Every `TODO-*` identifier cited by code, tests or documents resolves here. Dispositions:
**CLOSED** — the retired register recorded the item closed and the named row in
`docs/audit/todo-remediation-evidence.md` carries the item → code → test traceability;
**CLOSED · open human column** — closed for the engineering scope with a named human dependency left
open; **REOPENED** — this register reopens it as the cited `TSK-nn` (see §1.3 for why);
**HUMAN** — not engineerable, tracked as the cited `HD-nn` in §5.
`CLOSED` is the retired register's own record of closure, not an independent re-verification by this
audit; where the audit measured the claim and found it false, the row is `REOPENED` and §1.3 names the
evidence. Enforced by `tests/unit/register-inheritance.test.ts`.

The retired register's own text — each item's governing clause, acceptance criterion and closure note
— is recoverable by a command in this repository. The TSK-09 series lands the deletion, so `HEAD` no
longer carries it; `git show 85aad76:todo.md` prints the retired register unchanged.

| Inherited ID | Retired register item | Disposition | Resolves to |
|:---|:---|:---|:---|
| `TODO-GVR-01` | Author the RL1 scope decision record DEC-RL1-SCOPE-001 (P0) | CLOSED | docs/decisions/DEC-RL1-SCOPE-001.md |
| `TODO-GVR-02` | Reconcile the carried-forward screen-ID register (CC-UI-001)… | CLOSED | “GVR-02/03 register” |
| `TODO-GVR-03` | Resolve route-convention divergence (P1) | CLOSED | “GVR-02/03 register” |
| `TODO-GVR-04` | Rights override interpretation ruling (P0) [HUMAN DECISION] | **HUMAN** | `HD-02` |
| `TODO-GVR-05` | Finance treatment of cash-basis recognition (P0) [HUMAN… | **HUMAN** | `HD-04` |
| `TODO-SCR-01` | Content queue, editor, preview (UX-CMS-001/002/003) (P1) | CLOSED | “SCR-01/02 CMS domain” |
| `TODO-SCR-02` | Publication & withdrawal state machine (UX-CMS-005) (P1) | CLOSED | “SCR-01/02 CMS domain” |
| `TODO-SCR-03` | Approved media picker (UX-CMS-006) (P2) | CLOSED | “SCR-03 media picker + editor integration” |
| `TODO-SCR-04` | Azeebo+ destination registry (UX-CMS-007) (P1) | CLOSED | “SCR-04 destinations” |
| `TODO-SCR-05` | Enquiry routing configuration (UX-COM-008 / UX-CMS-008) (P1) | CLOSED | “SCR-05 routing config” |
| `TODO-SCR-06` | Real approval domain + queue (UX-GOV-001/002) (P0) | CLOSED | “SCR-06 approvals” |
| `TODO-SCR-07` | Rights Source Record, Financial Reference, Evidence Viewer,… | CLOSED | “SCR-07/16 records console” |
| `TODO-SCR-08` | Privacy Request Case & Security Report Case queues… | CLOSED | “SCR-08 cases” |
| `TODO-SCR-09` | Authorised Search (UX-HUB-002) (P1) | CLOSED | “SCR-09/11 search & My Work” |
| `TODO-SCR-10` | Notifications center (UX-HUB-003) (P1) | CLOSED | “SCR-10 notifications inbox” |
| `TODO-SCR-11` | Real My Work queue (UX-HUB-001) (P1) | CLOSED | “SCR-09/11 search & My Work” |
| `TODO-SCR-12` | Workspace directory + relationship-specific portal homes… | CLOSED | retired register §2.3 closure note (no citation outside this register) |
| `TODO-SCR-13` | Access & membership administration (UX-ADM-001) (P1) | CLOSED | “SCR-13 access console” |
| `TODO-SCR-14` | Integration Health from authoritative records (UX-ADM-002)… | CLOSED | “SCR-14/18 tail Cr8Tech” |
| `TODO-SCR-15` | Approved Routing & Source Mappings console (UX-ADM-003) (P1) | CLOSED | “SCR-15 source mappings” |
| `TODO-SCR-16` | Shared record interfaces (UX-REC-001/002/003/006) (P2) | CLOSED | “SCR-07/16 records console” |
| `TODO-SCR-17` | Commercial proposal builder & quote acceptance domain… | CLOSED | “SCR-17 proposal→deal handoff” |
| `TODO-SCR-18` | Extended creative workspaces domain wiring… | CLOSED | “SCR-18 accelerator” |
| `TODO-SCR-19` | Counterparty portals over canonical records… | CLOSED | “SCR-19 client portal” (`TSK-13`, 2026-10-09 — client portal projects canonical deals; the unbound delivery feeds are registered as TSK-60) |
| `TODO-SCR-20` | VTM deployment readiness & payment visibility… | CLOSED | “SCR-20 payment visibility” |
| `TODO-SEC-01` | Real MFA / step-up verification (UX-SYS-002) (P0) | CLOSED | “SEC-01 MFA step-up” |
| `TODO-SEC-02` | Invitation acceptance validation (UX-SYS-004) (P0) | CLOSED | “SEC-02 invitations” |
| `TODO-SEC-03` | Session persistence & revocation realism (UX-SYS-007/010/013)… | CLOSED | “SEC-03 session registry” |
| `TODO-SEC-04` | Recovery & first-use profile persistence (UX-SYS-003/005) (P1) | CLOSED | “SEC-04 remainder (first-use profile)” |
| `TODO-SEC-05` | Notification preferences honored end-to-end (UX-SYS-012) (P1) | CLOSED | “SEC-05 notification prefs” |
| `TODO-SEC-06` | Server-side authorization on workspace/broadcast HTML routes… | CLOSED | “SEC-06 workspace HTML guards” |
| `TODO-SEC-07` | Client portal cross-org isolation (UI-RL1-R07) (P0) | CLOSED | “SEC-07 client portal isolation” |
| `TODO-SEC-08` | Mutation idempotency & revision checks beyond enquiry (P1) | CLOSED | “SEC-08 mutation idempotency” |
| `TODO-SEC-09` | Azeebo+ inbound webhook ingestion (P1) — code complete;… | CLOSED · open human column | “SEC-09 webhook code scope” · partner-contract column |
| `TODO-SEC-10` | Queue & session stores on Redis (P1) — adapter + first stores… | CLOSED | `TSK-27` (this register, 2026-10-10) |
| `TODO-SEC-11` | CSRF protection on form mutations (P1) | CLOSED | “SEC-11 CSRF” |
| `TODO-BCST-01` | Wire 33 broadcast screens to domain engines; remove invented… | **REOPENED** | `TSK-11` (this register) |
| `TODO-BCST-02` | EPG export & StarTimes push endpoints (TASK-P2-05) (P1) | CLOSED | “BCST-02 EPG honesty gate” |
| `TODO-BCST-03` | Schedule authoring, approval & lock-out (TASK-P2-04) (P1) | CLOSED | “BCST-03 schedule lifecycle” (`TSK-12`, 2026-10-08 — machine in `docs/domain/state-machines.md`) |
| `TODO-BCST-04` | Media master inventory & versioning (TASK-P2-02 partial) (P1) | CLOSED | “BCST-04/05 versions & RFA” |
| `TODO-BCST-05` | Closed captions / subtitle tracks in QC gate (P2) | CLOSED | “BCST-04/05 versions & RFA” |
| `TODO-BCST-06` | 48-hour autonomous playout cache (R1.2A §57) (P1) — software… | CLOSED · open human column | “BCST-06 cache contract” · HD-11 |
| `TODO-BCST-07` | StarTimes carriage machine interface (BG6) (P0 → remains… | **HUMAN** | `HD-03` |
| `TODO-BCST-08 / 09` | Viewer-timezone presentation + On-Air-Now/Up-Next widget… | CLOSED | “BCST-08/09 presentation” |
| `TODO-BCST-10` | Offline-capable event gate scanning (TASK-P4-04) (P2) | CLOSED | “BCST-10 offline gate scans” |
| `TODO-BCST-11` | SCTE-35 cue generation (ADR-013 §2.1 claim) (P2) | CLOSED | “DOC-01…07” |
| `TODO-BCST-12` | Promos/interstitials & sponsorship binding engine… | CLOSED | “BCST-12 sponsor bindings” |
| `TODO-FIN-01` | Delivery-based revenue recognition (TASK-P8-02) (P0) | CLOSED | “FIN-01 recognition” |
| `TODO-FIN-02` | Maker-checker payout approval API (TASK-P8-03) (P0) | CLOSED | “FIN-02 payout approve/NIP” |
| `TODO-FIN-03` | Ledger integration — post real journal entries (P0) | CLOSED | “FIN-03 ledger posting” |
| `TODO-FIN-04` | WHT remittance schedules & payment advice slips (TASK-P8-03)… | CLOSED · open human column | “FIN-04 WHT remittance” · HD-12 |
| `TODO-FIN-05` | MT940 statement ingestion route (TASK-P8-04) (P1) | CLOSED | “FIN-05 MT940 ingest” |
| `TODO-FIN-06` | Payment release / escrow disbursement wiring (P1) | CLOSED | “FIN-06 escrow behind flag” |
| `TODO-FIN-07` | Broadcast billing ← as-run linkage (TASK-P2-11) (P1) | CLOSED | `TSK-16` + `TSK-33` (delivery-based billing, real rebooking, credit notes journaled) |
| `TODO-FIN-08` | TEND royalty statement parser (TASK-P4-03 partial) (P2) | CLOSED | “FIN-08 royalty CSV” |
| `TODO-PRC-01` | Per-journey backend/integration readiness records (P1) | CLOSED | “PRC-01 readiness matrix” |
| `TODO-PRC-02` | Design gates DG-RL1-01…10 closure records (P1) | CLOSED | “PRC-02 gate closure records” |
| `TODO-PRC-03` | Failure drills for J-RL1-04…14 (P1) | CLOSED | “PRC-03 journey drills” |
| `TODO-PRC-04` | Frozen performance budgets + measurement harness (P1) | CLOSED | “PRC-04 budgets” |
| `TODO-PRC-05` | Real-user usability & AT validation (G5) (P1 → S3/S4 gate) | **HUMAN** | `HD-08` |
| `TODO-PRC-06` | Manual WCAG 2.2 AA process coverage (G4 accessibility) (P1) | **HUMAN** | `HD-09` |
| `TODO-PRC-07` | Canary/rollback pipeline reality (TASK-P10-01) (P1) | CLOSED | “PRC-07 rollback TARGET” |
| `TODO-PRC-08` | Backup/PITR automation (TASK-P10-03) (P1) — job + DRILL-01… | CLOSED · open human column | “PRC-08 backup automation” · RPO/RTO column |
| `TODO-PRC-09` | Traceability — acceptance-criterion IDs across all journeys… | CLOSED | “PRC-09 AC-ID index” |
| `TODO-DOC-01` | Remove or restore taskss.md | CLOSED | “DOC-01…07” |
| `TODO-DOC-02` | Locate or de-cite design-task.md | CLOSED | “DOC-01…07” |
| `TODO-DOC-03` | Fix DR runbook database name (vmnl_control → canonical DB)… | CLOSED | “DOC-01…07” |
| `TODO-DOC-04` | Correct ADR-013 component-claims (SCTE-35, playout cache) or… | CLOSED | “DOC-01…07” |
| `TODO-DOC-05` | Re-run and pin test-count evidence | CLOSED | “DOC-05 evidence re-pin (TSK-08)” (`TSK-08`, 2026-10-08) |
| `TODO-DOC-06` | Update tasks.md / LATEST.md / evidence-register.md after each… | CLOSED | “DOC-01…07” |
| `TODO-DOC-07` | Downgrade unsupportable claims to TARGET status | CLOSED | “DOC-01…07” |

---

## 2. Task register — detail

Status legend: `[ ]` OPEN · `[~]` IN_PROGRESS · `[B]` BLOCKED · `[x]` DONE

---

### TRACK A — Build & verification integrity (P0)

> Goal: a green, reproducible baseline. **No other track may report completion until Track A is `DONE`.**

#### TSK-01 · P0 · Repair the three corrupted template-literal sites
**Source:** `report.md CA-01` · **Depends:** none · **Owner:** Platform Engineering · **Blocks:** everything
The inline-style→class migration (`scripts/migrate-inline-styles.mjs`, untracked) rewrote string *expressions* as well as markup, replacing the selected-class operand inside ternaries with a generated token and destroying the syntax. `tsc` reports 152 errors across three files (123 / 16 / 13). All three are imported by the router, so the server cannot be built or started.

Corrupted sites:
- `src/web/public/screens-view.ts:36`, `:40` — `${!selectedRole ?  s-zTjcEp-kWU"btn-primary" : "btn-outline"}`
- `src/web/public/admin-feature-flags.ts:27`, `:31`, `:77` — same pattern (`s--wJWanX93Y`, `s-BLW…`)
- `src/web/public/auth-screens.ts:566` and onward — same pattern (`s-xpqECJulZc`)

- [x] Every ternary restored to a valid conditional class expression, keeping the generated class where it is genuinely the selected value — all four sites now read `class="btn s-… ${cond ? "btn-primary" : "btn-outline"}"` (`src/web/public/screens-view.ts:36,40`, `src/web/public/admin-feature-flags.ts:27,31,77`, `src/web/public/auth-screens.ts:566` onward)
- [x] `git show HEAD:src/web/public/screens-view.ts:36` used as the reference for intended semantics (the HEAD line is valid and also carried `min-height:44px`) — HEAD carries `${!selectedRole ? "btn-primary" : "btn-outline"}` plus the inline `min-height:44px`; the generated class `s-zTjcEp-kWU` is that rule's token successor, so the inline style stays retired
- [x] Conditional semantics preserved — note the corruption also **flipped** the condition's meaning by substituting a class for the string operand; diff the rendered output, not just the syntax — current conditionals match HEAD operand-for-operand (`!selectedRole`/`!filterDomain` → primary; `isSelected`/`isCurrent` → primary), and each repaired file is rendered by the current suite (`tests/a11y/responsive.test.ts:32-33` renders `renderScreensCatalogHtml()`/`renderScreenDetailHtml()` through the restored ternary)
- [x] `pnpm build` exits 0 — measured 2026-10-07
- [x] `npx tsc --noEmit` reports 0 errors — measured 2026-10-07, exit 0

**Alternative (preferred if the fix is non-trivial):** `git checkout HEAD -- src/web/public/screens-view.ts src/web/public/admin-feature-flags.ts src/web/public/auth-screens.ts` and re-apply the migration under `TSK-48`.
*Not taken:* reverting would have discarded the AUD-20 token classes the migration correctly applied and re-opened TSK-48's scope; the ternaries were repaired in place (Rule 0.3 — the gate was fixed by restoring the mechanism, not by deleting the migrated markup).

**Evidence:** build log at commit; before/after render diff for `/broadcast/screens` and `/admin/feature-flags`.
**Recorded (TSK-01, 2026-10-07):** `pnpm build` exit 0 · `npx tsc --noEmit` exit 0 (was 152 errors / 3 files) · `pnpm lint` exit 0 · `pnpm test` 56 files / 624 tests, 0 failed, 0 skipped. Both corrupted surfaces are served and asserted by that suite: `/broadcast/screens` over real HTTP (`tests/integration/enterprise-end-to-end.test.ts:151-152`) and rendered under HTML invariants (`tests/unit/rendered-html-invariants.test.ts:86`), `/admin/feature-flags` through the admin guard surface list (`tests/security/route-authorization.test.ts:190`).

#### TSK-02 · P0 · Confirm the 17-file test cascade clears
**Source:** `report.md CA-02` · **Depends:** TSK-01
Every `Transform failed with 1 error: … screens-view.ts:36:73` failure is TSK-01, not an independent defect: all 3 `tests/a11y/*`, `tests/contract/openapi-contract.test.ts`, both `tests/security/*`, `tests/integration/enterprise-end-to-end.test.ts`, and 11 unit files.

- [x] Re-run `pnpm test` after TSK-01 — **do not triage these 17 files individually** — 2026-10-07: `pnpm test` = 56 files / 624 tests, 0 failed, 0 skipped. The 17 cascade files (3 × `tests/a11y`, `tests/contract/openapi-contract.test.ts`, 2 × `tests/security`, `tests/integration/enterprise-end-to-end.test.ts`, 11 unit files) all load and pass on the restored syntax alone
- [x] File count failing reduced from 20 to ≤3 (the genuine failures: TSK-04, TSK-05, plus any that surface) — measured **0** failing files. TSK-04's re-anchored assertion and TSK-05's FK-ordering fixtures both closed, so no genuine failure remained
- [x] Record the post-fix counts verbatim for TSK-08's re-pin — see §"Recorded (TSK-01)" above and the re-pinned `docs/handoffs/LATEST.md` / `docs/audit/evidence-register.md` baselines, re-pinned again 2026-10-15 against the committed tree (`docs/audit/evidence/handoff-repin-2026-10-15/`)

**Evidence:** `pnpm test` output captured at the commit; failure count delta.
**Recorded (TSK-02, 2026-10-07):** 20 failing files / 4 skips → **0 failing / 0 skipped, 56 files, 624 tests**; `pnpm build` and `npx tsc --noEmit` exit 0. Reproduce with `pnpm build && pnpm lint && pnpm test`.

#### TSK-03 · P0 · Clear the lint gate
**Source:** `report.md CA-05` · **Depends:** TSK-01
- [x] Remove the dead `isStringRecord` helper at `src/api/router.ts:468` (declared, never used) — grep of `src/api/router.ts` returns no occurrence of `isStringRecord`
- [x] The three parsing errors are gone (they are TSK-01) — `pnpm build` / `npx tsc --noEmit` exit 0
- [x] `pnpm lint` (`eslint . --max-warnings 0`) exits 0 — measured 2026-10-07

**Evidence:** lint output at commit.
**Recorded (TSK-03, 2026-10-07):** `pnpm lint` exit 0 (was 4 errors: 1 unused-var + 3 parse failures).

#### TSK-04 · P0 · Re-anchor the DT-202 touch-target assertion to the token mechanism
**Source:** `report.md CA-03` · **Depends:** TSK-01
`tests/unit/styleguide.test.ts:107` asserts the literal string `min-height: 44px` on rendered buttons. The migration moved that rule from an inline attribute into a generated class (`src/web/styles/generated-utilities.ts`); 44px is still declared in `src/web/styles/index.ts` and as `minTouchTargetPx: 44` in the token module. **The control is intact; the assertion checks the retired delivery mechanism.** This is the only genuine assertion regression independent of the build break.

- [x] Replace the inline-string assertion with an assertion that the emitted class **resolves** to a ≥44px min-height in the shipped stylesheet (parse `CANONICAL_STYLESHEET`, look up the class, assert the rule) — `tests/unit/styleguide.test.ts:111` asserts `effectiveTouchTargetPx(btn).minHeight >= 44`; the helper resolves the emitted `vmn-btn-state-*`/utility classes against `CANONICAL_STYLESHEET` imported at `:13`
- [x] Do **not** delete the assertion or lower the threshold (Rule 0.3) — the control still fails a button whose resolved `min-height` is under 44px; only the delivery mechanism it reads changed (inline attribute → shipped stylesheet)
- [x] `tests/unit/styleguide.test.ts` passes — in the 2026-10-07 `pnpm test` run (56 files / 624 tests, 0 failed, 0 skipped)
- [x] Same re-anchoring applied if any other test still asserts touch-target styling inline (note: `tests/a11y/accessibility-audit.test.ts` asserts a 44×44 *configuration* at `:51-52` and does **not** need this change — see §16) — grep of `tests/**` for `min-height: 44px` returns only the two synthetic stylesheets inside `tests/unit/stylesheet-resolution.test.ts:16,38`, which are the resolver's own inputs, not product markup; every product-surface check now goes through `effectiveTouchTargetPx` (`tests/helpers/stylesheet.ts:120`, used at `tests/unit/styleguide.test.ts:111` and `tests/unit/public-surfaces.test.ts:57`)

**Evidence:** updated test + a stylesheet-resolution helper under test.
**Recorded (TSK-04, 2026-10-07):** DT-202 re-anchored to `tests/helpers/stylesheet.ts` (`parseStylesheet` + `effectiveTouchTargetPx`), covered by `tests/unit/stylesheet-resolution.test.ts`; all three suites green in the 56-file run.

#### TSK-05 · P0 · Fix DB-backed repository test fixtures (FK ordering)
**Source:** `report.md CA-04` · **Depends:** TSK-01, TSK-07
`tests/unit/production-core-and-infrastructure.test.ts:55,121,197` throw `RepositoryUnavailableError` caused by Prisma `P2003` FK violations — `TalentProfile_personId_fkey`, `Programme_channelCode_fkey`. A database **is** reachable in this environment, so this is not an environment excuse; the seed writes a child before its parent. Fail-closed mode (`src/core/database/repository-mode.ts:21,50`) is correctly converting this into a hard failure — do not "fix" it by turning fail-closed off.

- [x] Test fixture creates `Person` (and `Organisation` where required) **before** `TalentProfile`, and the channel before `Programme` — `tests/helpers/db-parents.ts` (`ensureFixtureChannels`, `ensureFixturePerson`) runs in `beforeAll` before any repository write; no `Organisation` parent is required by these three fixtures
- [x] Prefer a transactional fixture that seeds parents then rolls back — **not done, and the alternative is stronger**: `resetFixtureScope()` deletes in FK order (episode → programme → channel, talent → person) in both `beforeAll` and `afterAll`, so an interrupted run cannot leave rows behind. A rolled-back transaction would not exercise the durable write path the evidence line demands.
- [x] All three tests pass against a real Postgres — `tests/unit/production-core-and-infrastructure.test.ts` **21/21 green**, banner line `[TSK-05] repository path under test: Postgres (fail_closed)`. The original failures were at `:86` (`per-001`), `:120` (`PRG-URBAN-01`) and `:221` (`psn-001-seun`).
- [x] Determined and recorded: **fixture ordering**, not a schema constraint defect. `TalentProfile.personId → Person.id` and `Programme.channelCode → BroadcastChannel.code` are correct, enforced FKs (`prisma/schema.prisma:198,210` and `:376,384`) and cascade deletes are declared. No TSK-15 escalation.

Additionally, and required by Rule 0.4a: the fixture assertion `expect(["DB","MEMORY"]).toContain(source)` accepted a silent memory fallback and proved nothing. It is now `expect(source).toBe(expectedSource())` — `"DB"` when Postgres is reachable, `"MEMORY"` only when it is not — applied to every repository write in the three originally-failing tests. When the database is reachable the tests then read **past** the repository through Prisma: the `TalentProfile` row with its `person` relation (`findUnique` + FK + rate card, then deleted and re-read as `null`), the `Programme` row with its `channel` parent and its `episodes` (`:185-213`), and an `asRunLogRecord` count keyed on the fixture's certificate hash. `CampaignRepository` and `InvoiceRepository` were left asserting only through the repository — neither has an FK parent fixture, so neither is part of this finding.

**Evidence:** green run of `tests/unit/production-core-and-infrastructure.test.ts` with the DB path exercised, not skipped — banner line `[TSK-05] repository path under test: Postgres (fail_closed)`, **21/21 passing**, `tsc --noEmit` exit 0. Fail-closed mode left intact (`ALLOW_SANDBOX_FALLBACK` unset; `repository-mode.ts` unchanged).

#### TSK-06 · P0 · Verify migrations deploy from clean
**Source:** `report.md §5 Sprint 0 item 8`, `CA-27` · **Depends:** TSK-01
Three of the four migrations are **untracked** (`20261002140000_add_read_path_indexes`, `20261002150000_add_finance_event_indexes`, `20261006120000_add_data_subject_requests`, plus `migration_lock.toml`). A delegated claim that `prisma migrate deploy` fails with P3006/P2022 could **not** be verified — Prisma 7 requires `datasource.shadowDatabaseUrl` in `prisma.config.ts` to diff a migrations directory (`report.md §6`). Treat deploy status as NOT_VERIFIED until this task closes it.

**Measured 2026-10-07:** the NOT_VERIFIED flag is lifted. Deploy from empty succeeds and both diff directions are empty; the P3006/P2022 claim is refuted, not merely unproven. The task stays open on the one checkbox that is not an engineer's call — the untracked migrations land under TSK-09.

- [x] All migration files and `migration_lock.toml` are committed (see TSK-09) — landed in `99ade46`; `git ls-files prisma/migrations | wc -l` prints **14** (13 `migration.sql` directories + `migration_lock.toml`), against **2** tracked paths before the series. Deploy was then re-run against that commit from an empty database: `docs/audit/evidence/tsk09-commit-series-2026-10-15/migrate-deploy-from-empty.txt` (`exit 0`, `13 migrations found`, `44` tables). TSK-06 is `DONE`; Tier S2 maturity is still withheld because the series has not been seen by CI (TSK-57), not because anything is untracked.
- [x] `prisma migrate deploy` run against a scratch Postgres from empty succeeds and creates all **27** models — PostgreSQL 18.3, Prisma CLI 7.10.0: `4 migrations found` → `All migrations have been successfully applied`; **28** base tables (`27` models + `_prisma_migrations`); the model-name list diffed against the deployed table list (`grep -vxF`) returns **zero** missing.
- [x] `prisma migrate diff` between deployed state and `prisma/schema.prisma` reports empty (set `shadowDatabaseUrl` in `prisma.config.ts` as a scoped, reviewed config change) — both directions exit `0` with `No difference detected.`: `--from-migrations ./prisma/migrations --to-schema` (via the new `datasource.shadowDatabaseUrl`, since Prisma 7 removed `--shadow-database-url`, `--from-url` and `--to-schema-datamodel`) and `--from-config-datasource --to-schema` against the scratch DB **and** against `vmnl_enterprise`. Getting there required a real fix: `20261002150000_add_finance_event_indexes` created **8** indexes in raw SQL that the datamodel never declared, so the first drift run returned 8 `DROP INDEX` statements. The `@@index` blocks now exist on `BankStatementRecord`, `CommercialCampaign`, `TalentPayoutBatch`, `EventTicket` and `FusionEvent`. No migration was written and no SQL changed — the indexes were already deployed; the declaration makes the schema match reality. The 9 indexes from `20261002140000_add_read_path_indexes` were already declared.
- [x] Result recorded either way — including confirmation that the "20–26 undeployed `Person` columns" claim is false — **the delegated P3006/P2022 deploy-failure claim is also false.** `Person` deploys exactly **9** scalar columns (`id, email, phone, firstName, lastName, kycStatus, nationalId, createdAt, updatedAt`), all present; the other five datamodel fields (`user`, `talentProfile`, `creatorProfile`, `contracts`) are relation fields with no column by design. Full write-up: `docs/audit/evidence/migrations-2026-10-07/README.md`.

**Evidence:** deploy log + diff output archived under `docs/audit/evidence/migrations-2026-10-07/` (`deploy-from-empty.txt`, `drift-migrations-dir-vs-schema.txt`, `drift-deployed-db-vs-schema.txt`, `inventory.txt`). The deploy artifact was renamed from `deploy-from-empty.log` on 2026-10-09: `.gitignore:3` (`*.log`) made the original invisible to `git status`, so the evidence for this row could never have been committed. Task status `VERIFIED-DEPLOYS-CLEAN`; **not** `DONE` while the migrations remain untracked.

#### TSK-07 · P0 · Resolve the deleted task registers
**Source:** `report.md CA-06` · **Depends:** none · **Blocking for:** every traceability task in Track H/I
`tasks.md` and `todo.md` are tracked in HEAD but show as ` D` (deleted, uncommitted). Four living documents still cite them — `docs/handoffs/LATEST.md`, `docs/audit/todo-remediation-evidence.md`, `docs/decisions/DEC-RL1-SCOPE-001.md`, `docs/runbooks/disaster-recovery.md` — and `docs/audit/evidence-register.md:4` cites `File 1.txt §8`, which has never existed in the repo. Every `TODO-SEC-nn / TODO-SCR-nn / TODO-BCST-nn / TODO-FIN-nn / TODO-PRC-nn` identifier used throughout the audit documents currently resolves to nothing.

- [x] Decision recorded: this file (`tasks.md`, `VMNL-AZP-VMN-TODO-002`) is the surviving register; `todo.md` deletion is committed deliberately, not left half-applied
- [x] Every inherited `TODO-*` identifier still cited anywhere resolves — via §1.3 reopen mapping, or by repointing the citation
- [x] `docs/audit/todo-remediation-evidence.md` gains a header stating which register it evidences and that historical IDs are inherited
- [x] `File 1.txt §8` citation removed from `docs/audit/evidence-register.md:4` or replaced with the real authority
- [x] `grep -rn "todo\.md\|File 1\.txt" docs audit.md CLAUDE.md` returns only historical/contextual references, never a live dependency

**Evidence:** this section + citation sweep output.

**Closure evidence (measured 2026-10-07, working tree — the commit itself is TSK-09's, by design):**

- *Decision recorded* — `docs/decisions/DEC-REGISTER-SURVIVOR-001.md`: `VMNL-AZP-VMN-TODO-002`
  (`tasks.md`) is the single surviving register; `VMNL-AZP-VMN-TODO-001` (`todo.md`) is **retired**,
  not restored, because its 71 items' closure traceability already lives in a tracked living document
  (`docs/audit/todo-remediation-evidence.md`) and the item text itself is recoverable with
  `git show 85aad76:todo.md`; `VMNL-AZP-VMN-TASK-001` (the previous `tasks.md` content) is superseded,
  its `TASK-P<n>-<nn>` labels kept as non-normative historical tags — the same treatment
  `docs/decisions/design-task-de-citation.md` gives `DT-nn`. The box's second clause is *not*
  overclaimed: landing the deletion commit is named as TSK-09's in the record, which is what makes the
  working-tree ` D` a decision with an owner instead of an accident. No commit was created here —
  the commit series needs the owner's sign-off (TSK-09).
- *Every cited inherited ID resolves* — new **§1.4 Inherited identifier census**: 71 rows covering the
  retired register's 71 items / **72 identifiers** (`TODO-BCST-08/09` is one item, two IDs), each with
  a disposition and a resolution that exists. Measured 2026-10-07 as **CLOSED 56** (named row in
  `docs/audit/todo-remediation-evidence.md`), **CLOSED · open human column 4** (`TODO-SEC-09`,
  `TODO-BCST-06`→HD-11, `TODO-FIN-04`→HD-12, `TODO-PRC-08`), **REOPENED 6** (`TODO-BCST-01`→TSK-11,
  `TODO-BCST-03`→TSK-12, `TODO-DOC-05`→TSK-08, `TODO-FIN-07`→TSK-33, `TODO-SCR-19`→TSK-13,
  `TODO-SEC-10`→TSK-27), **HUMAN 5** (HD-02/03/04/08/09). Re-measured 2026-10-08 after two of those
  reopenings closed — `TODO-BCST-03` (TSK-12, the §15 machine) and `TODO-DOC-05` (TSK-08, the evidence
  re-pin): **CLOSED 58 · REOPENED 4** (`TODO-BCST-01`→TSK-11, `TODO-FIN-07`→TSK-33,
  `TODO-SCR-19`→TSK-13, `TODO-SEC-10`→TSK-27), still **a subset of** §1.3's mapping rather than equal to
  it — §1.3 carries five TSK reopens plus the human-decision rows, and three of the five are now closed
  (`TODO-DOC-05` TSK-08, `TODO-FIN-07` TSK-16+TSK-33, `TODO-SCR-19` TSK-13).
  Re-measured again 2026-10-09 after `TODO-FIN-07` closed (TSK-16 + TSK-33): **CLOSED 59 · REOPENED 3**
  (`TODO-BCST-01`→TSK-11, `TODO-SCR-19`→TSK-13, `TODO-SEC-10`→TSK-27); and after `TODO-SCR-19` closed
  (TSK-13, 2026-10-09): **CLOSED 60 · REOPENED 2** (`TODO-BCST-01`→TSK-11, `TODO-SEC-10`→TSK-27), and after `TODO-SEC-10` closed (TSK-27, 2026-10-10): **CLOSED 61 · REOPENED 1** (`TODO-BCST-01`→TSK-11).
  `TODO-SCR-12` is the one item
  whose closure note exists only in the retired register, and the census says so instead of inventing a
  live pointer.
- *Instrument* — `tests/unit/register-inheritance.test.ts` (7 tests, inside `pnpm test`, therefore CI)
  reads §1.4 as data and fails on: a cited `TODO-*` with no census row; a `REOPENED` row pointing at a
  `TSK-nn` with no heading; a reopened task whose boxes are all closed (a reopen must still be a
  reopen); an `HD-nn` absent from §5; an evidence-row label absent from
  `docs/audit/todo-remediation-evidence.md`; a cited file path that does not exist; a `todo.md` /
  `File 1.txt` mention that is neither marked historical nor a traceability tag whose ID the census
  covers; `File 1.txt` cited outside the two records of its removal; and the Authority line of
  `docs/audit/evidence-register.md` naming anything but documents that exist. Pins are the measured
  values (`rows 71 · IDs 72 · cited 72 · uncited rows 0`), and the file excludes itself from its own
  citation corpus for the reason TSK-43 established: it carries IDs as test data.
- *Repointed live dependencies* — the four pointers that told a reader to go read a deleted file now
  name the surviving authority: `docs/audit/todo-remediation-evidence.md` title (": todo.md execution"
  → ": retired TODO-001 register execution") and its two §headings (`per §0 of todo.md`,
  `see todo.md closure notes`); `docs/handoffs/LATEST.md` Round 6 milestone, Round 6C opening,
  Round 6 summary heading and both "per todo.md §0" labels.
- *Sweep output* — `grep -rn "todo\.md\|File 1\.txt" docs audit.md CLAUDE.md` → **20 lines**, of which
  8 are inside `DEC-REGISTER-SURVIVOR-001.md` (the record that retires them) and 12 each carry a
  retirement marker on the line or the sentence it continues into (`retired`, `deleted by recorded
  decision`, `VMNL-AZP-VMN-TODO-001`, `never existed`, `ROUND 6`). Zero instruct a reader to open
  `todo.md` as a live source. `audit.md` and `CLAUDE.md` return no hits at all.
- *Box 4* — `docs/audit/evidence-register.md` Authority line reads
  `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMNL-AZP-VMN-CCPP-001 §8`; the phantom citation survives only
  inside that file's withdrawal note, which the instrument pins open-endedly (it must state the file
  "has never existed").
- *Gate:* `pnpm build` exit **0** · `pnpm lint` exit **0** · `pnpm test` exit **0** —
  **58 files / 639 tests passed, 0 failed, 0 skipped** (from 57/632; +1 file, +7 tests).
  Reproduce with `pnpm vitest run tests/unit/register-inheritance.test.ts`.
- *Unblocked by this:* the Track H/I traceability tasks §1.4 makes checkable (TSK-39 authorities,
  TSK-40 design debt, TSK-42 sweep claims, TSK-52 domain docs), and TSK-08, whose re-pinning the
  census now protects against drift.

#### TSK-08 · P0 · Re-pin every evidence document to measured truth
**Source:** `report.md §1`, `CA-25`, inherited `TODO-DOC-05` · **Depends:** TSK-02
Replace every stated figure with one reproducible from a command in this repo, and delete figures that are not.

| Location | Current claim | Required action |
|:---|:---|:---|
| `docs/handoffs/LATEST.md:13` | "506/506 tests across 45 files, zero skips"; "`tsc --noEmit` clean"; "eslint 0 errors" | **DONE (TSK-08, re-measured 2026-10-08)** — pin table now states tsc 0 / build 0 / lint 0 / **63 files · 689 tests · 0 failed · 0 skipped · 0 unhandled errors**, with the same-day progression; the false 506/506 claim is explicitly withdrawn in the same file |
| `docs/audit/evidence-register.md:18,27,78` | "506 automated … tests passing; 45 test files; zero typecheck errors" | **DONE (TSK-08, 2026-10-07; re-pinned 2026-10-08)** — Tier S2 block now carries the four command outputs and the dirty-path count; the historical pins are retained *as* a labelled superseded trail, including the sentence that the 506/506 pin was false when written |
| `docs/audit/evidence-register.md:31` | "225 system screens" | **DONE (TSK-24, 2026-10-07)** — replaced by measured figures: 60 register entries = 226 documented IDs, 40 reachable HTML surfaces on register-declared routes, 111 literal HTML-serving routes repository-wide. The "≈166" estimate in the previous column was itself unmeasured and is withdrawn |
| `audit.md:454-456` (§5, dated 2026-10-06) | "typecheck exit 0, lint exit 0 … 47 files / 556 tests, all passing" | **DONE (2026-10-07, pointer corrected 2026-10-08)** — annotated SUPERSEDED, regressed 2026-10-06/07, and now points at the live pin heading and its measured 61/671 rather than a stale 50/588 |
| `docs/handoffs/LATEST.md:26,31` | "every `MOCK_*` dataset on these surfaces is deleted" | **DONE (2026-10-07, re-measured 2026-10-09)** — corrected in place when it was false: `MOCK_CLIENT_PROJECTS` was live (`src/web/portal/client-portal.ts:55`, read at `src/api/router.ts:2496`), tracked as TSK-13. **TSK-13 closed it the same day:** `grep -rnE "^(export )?const MOCK_" src --include="*.ts"` → **0 matches** (three doc comments still *name* the deleted datasets, which is provenance, not data), and `tests/unit/client-portal-and-operations.test.ts` keeps the portal's fixture deleted. The original sentence is now true; the correction stays as the record of when it was not |
| `docs/handoffs/LATEST.md:341` (`:137` at the 2026-10-08 pin, re-pinned 2026-10-15) | "Zero raw OS emoji across 100% of `src/web/`" | **DONE (2026-10-07)** — the downgrade is no longer needed: `tests/unit/token-discipline.test.ts` loads and passes, so the claim is now verified by an executable guard, and LATEST says so |
| `release-manifest.json:4` | `gitCommitSha: ca303f0` | **STILL BLOCKED, and the reason changed (re-checked 2026-10-15)** — "there is no authorized commit" no longer holds: the TSK-09 series is on `main` locally. What blocks the re-pin now is that this field is covered by a *human* release decision — `release-manifest.json:6-12` carries the Chairman's `GO_WITH_CONDITIONS` signature dated 2026-09-28, and moving the SHA to a tree that post-dates that signature would assert an approval nobody gave. So the field still reads `ca303f0`; every evidence pin states `ce098f8`/the series plus the dirty set by command, and the SHA update is the release owner's action (`TSK-57`'s CI evidence is the other precondition) |

- [x] Each row above updated — rows 1–6 replaced by measured figures; row 7 cannot be re-pinned
      without a commit, so it is recorded as BLOCKED with its reason, which is what an honest evidence
      document does with a figure it cannot produce (rule 0.2/0.4)
- [x] Every surviving number carries the command that produces it
- [x] `git status` is clean at the pinning commit, **or** the pin explicitly names the dirty set —
      satisfied by the second branch (167 paths, command in both documents; re-measured whenever a
      closure changes the tree, which is why this figure moved 138 → 161 → 163 → 167 across 2026-10-07/08)

**Evidence:** updated registers + a pin block recording commit, date, command, output — and, as of this
re-pin, the §7 artifact that prose alone had been standing in for: `docs/audit/evidence/baseline-2026-10-08/`
carries the four verbatim gate logs plus a README with the commands and the baseline. The directory did
not exist before 2026-10-08 (`docs/audit/evidence/` held only `migrations-2026-10-07/`), so the row is
recorded as newly satisfied rather than as having been satisfied when TSK-02 first closed.

**Closure evidence (measured 2026-10-08, working tree — the TSK-09 commit series landed
2026-10-15):**

- *Pin block* — `docs/audit/evidence-register.md` Tier S2 and `docs/handoffs/LATEST.md` "Verification
  pin" both carry: baseline `ce098f8`, date, dirty set (**114 modified / 51 untracked / 2 deleted =
  167 paths**, reproduced by `git status --porcelain | awk '{print $1}' | sort | uniq -c`), and the
  four gate outputs `npx tsc --noEmit` **0** · `pnpm build` **0** · `pnpm lint` **0** ·
  `pnpm test` **exit 0, 63 files / 689 tests / 0 failed / 0 skipped / 0 unhandled errors**.
- *Figures deleted rather than re-dressed* — the "225 system screens" and "≈166" estimates are gone
  (TSK-24), the 506/506 pin is retained only as a labelled false historical pin, and the
  "no reachable Postgres (`P1001`)" bullet in `evidence-register.md` §5 was corrected: Postgres
  **was** reachable and the DB branch is exercised (`tests/unit/broadcast-rights-gate.test.ts` prints
  `rights gate path under test: Postgres (fail_closed)`; FK-ordered parents in
  `tests/helpers/db-parents.ts` are used by 4 suites), while what genuinely remains unverified —
  per-entity durability coverage (`tests/unit/durability-*.test.ts` **does not exist**, TSK-17) and
  migrations-from-clean (TSK-06, `[B]` then and closed 2026-10-15 below) — is now stated as such.
  *Follow-up (2026-10-08, TSK-17 closure):* the first of those two is no longer true —
  `tests/unit/durability-release-critical.test.ts` exists with **16 tests**, one durable loop per
  release-critical entity, each measured through a **second OS process**;
  `find tests -name 'durability*' | wc -l` now prints **1**, which is the figure
  `docs/domain/systems-of-record.md` §6 re-publishes. Migrations-from-clean (TSK-06 `[B]`) closed 2026-10-15: `99ade46` lands all **14** `prisma/migrations` paths; deploy-from-empty re-run on that tree → `exit 0`, **44** tables.
- *Every surviving number in the documents touched today carries its command:* the schedule-machine
  figures in `docs/domain/state-machines.md` §1/§8 (49 refusal codes, eleven transitions, the three
  `grep` re-measures), the register census in `tasks.md` §1.4 (**CLOSED 57 · CLOSED-with-human 4 ·
  REOPENED 5 · HUMAN 5 = 71 rows / 72 identifiers**, printed by
  `tests/unit/register-inheritance.test.ts` on every run), and the test/gate counts above.
- *Not claimed:* Tier S2 maturity is still withdrawn (`evidence-register.md` §1 heading): TSK-06 landed
  in `99ade46` on 2026-10-15, but no CI run has seen this series (`TSK-57` — `docker info` → exit 127 on
  this host), and `release-manifest.json:4` still names `ca303f0` — see the row-7 note above.

#### TSK-09 · P1 · Land the working tree as a coherent commit series
**Source:** `report.md CA-27` · **Depends:** TSK-01…TSK-06
114 dirty paths (96 modified + 18 untracked) including `scripts/`, `vitest.config.ts`, three Prisma migrations, `src/api/routes/`, `src/api/schemas/`, `audit.md`, and `prisma/migrations/migration_lock.toml`. Evidence documents pin SHAs that do not contain the work they describe.
**Re-measured 2026-10-09:** `git status --porcelain | wc -l` = **189** (126 modified + 61 untracked entries + 2 deleted); with `--untracked-files=all` = **246** individual files (126 M + 118 `??` + 2 D). The list above still holds, only larger — the whole tree is the problem now, and `TSK-08` re-pins the documents to it. One measured hygiene point: `docs/audit/evidence/*/*.log` artifacts are invisible to `git status` because `.gitignore:3` is `*.log`, so the TSK-44 set (and `migrations-2026-10-07/deploy-from-empty.txt`) are written with a `.txt` extension — evidence that cannot be staged is not evidence at a commit.

- [x] Commit series separated by concern — landed 2026-10-15, locally only (push is the owner's call): `6c44cc7` TSK-58 route refusals + tests · `61355c6` gate-log re-pin · `be8dff9` the runtime source the already-published commits import (18 added / 1 modified / 78 rewritten paths) · `99ade46` migrations + `prisma.config.ts` · `2ce8fab` tests, `vitest.config.ts`, `scripts/`, `package.json`/lockfile · `85aad76` CI workflow, Docker/Trivy hardening, `.env.example`. The concern split differs from the four-way split sketched above: the tree's actual defect was **untracked modules that tracked code already imported** (`head-self-containment.txt`: `61355c6` → **10** absent modules, `85aad76` → **0**), so the series is ordered by dependency (source → schema → tests → CI) instead of by change kind.
- [x] No secrets staged — each commit was built with explicit `git add <paths>` (no `git add -A`); the 35 dirty paths, expanded to **191** files, were scanned for AWS/PEM/GitHub/Google/Stripe key shapes and JDBC URLs with embedded passwords (`grep -rlE …` → no matches, `measurements.txt` §4). `git status` after every add was read before committing.
- [x] `.env` remains untracked (`.gitignore:60` `.env`, and `:65` `*.env` — `git check-ignore -v .env` resolves to `.gitignore:65:*.env`) — verified good, preserved as-is (`report.md CA-29`); the only tracked `.env*` path is `.env.example`, whose credential-shaped defaults were replaced with `CHANGE_ME_…` placeholders in this series.
- [x] Untracked migrations committed (gate for TSK-06) — `99ade46`, **14** tracked paths under `prisma/migrations` (13 `migration.sql` + `migration_lock.toml`) against **2** before; `prisma migrate deploy` from empty on that tree exits `0` and creates **44** tables. TSK-06 is closed by this row.
- [x] `vitest.config.ts` committed so coverage thresholds apply in CI — `2ce8fab` carries `vitest.config.ts` (floors at `:24-29`: statements 73 / branches 62 / functions 77 / lines 72) and `package.json` carries `test:coverage`; `85aad76` changes `.github/workflows/ci.yml` from plain `pnpm test` to `pnpm run test:coverage` (`:95`) plus `audit:check`, `audit:threshold` and `any:budget`. This unblocks the tooling half of `TSK-44`'s box 2; the CI-run half stays open under `TSK-57` (measured: `docker info` → exit 127, no Docker binary on this host, so the workflow's image steps are definitions, not proofs).

**Evidence:** `git log --oneline -7` prints the series above; `docs/audit/evidence/tsk09-commit-series-2026-10-15/` (`README.md`, `measurements.txt`, `self-containment-probe.mjs`, `head-self-containment.txt`, `migrate-deploy-from-empty.txt`, `test-coverage.txt`, `full-suite.txt`, `lint.txt`, `typecheck.txt`, `build.txt`, `exits.txt`). `git status --porcelain | wc -l` was **35** on the code tip before the two commits that close this row (17 previously-untracked evidence archives, 8 other untracked paths — `audit.md`, three audit/security documents, two decision records, the TSK-41 guard and `pages.pdf` —, 9 modified documents and tests, and the retired register's recorded deletion); after them the only dirty path is `pages.pdf` — a generated binary deliberately left untracked — and any later closure edit re-dirties the tree by design, so this row claims the series, not a permanently clean working tree. The series is **not pushed**: pushing is the owner's decision.

---

### TRACK B — Rights & broadcast compliance (P1)

> Goal: make canonical law 8 — "No rights clearance → no exploitation" — true in the code.

#### TSK-10 · P1 · Enforce the rights gate server-side *(highest-value fix in the project)*
**Source:** `report.md CA-07` · **Depends:** TSK-01, TSK-14 (needs a durable `RightsRecord` read path) · **Owner:** Broadcast Engineering + Legal/IP Ops
Four independent defects compose this finding:

1. `src/modules/broadcast/versions/index.ts:187-188` — schedule validation only requires `rightsClearedBy` to be a **non-empty free-text string** (`[SCHED-RIGHTS-01]`). No `RightsRecord` is looked up; no window/territory/channel check occurs.
2. `src/modules/broadcast/versions/index.ts:260-275` — `approveSchedule()` validates lifecycle state, requires a non-empty `approvedBy`, computes lock-out, sets `APPROVED`. **It never consults the rights gate.**
3. `src/api/router.ts:5652-5670` *(the endpoint's position then; it is `src/api/router.ts:6065` now, and **TSK-10 closed this** — the same sentence describes the defect as measured, not as shipped today)* — the "rights validation" endpoint constructs the entire `RightsRecord` (`rightsType`, `territory`, `startDate`, `expiryDate`, `channelCode`) **from the request body**. The caller asserts its own rights facts; the server validates the arithmetic of a claim, not the claim.
4. The real engine exists and is correct — `validateScheduleRights` (`src/modules/broadcast/rights/clearance.ts:53`), `BroadcastRightsGate.checkRightsReadiness` (`clearance.ts:169`) — but is never invoked on the authoritative path. `src/core/rights/index.ts` (citation:absent — deleted by TSK-14; audit-time state) implements only a *review-request* workflow, not clearance.

- [x] `approveSchedule` calls `validateScheduleRights` per entry and rejects approval with a stable error code when any entry fails
- [x] The rights-validation route resolves the `RightsRecord` **by id from the durable store**; body-supplied rights fields are rejected, not trusted
- [x] XMLTV / StarTimes export paths re-check clearance at export time (never trust an approval timestamp alone)
- [x] Free-text `rightsClearedBy` retained only as an attestation *annotation*, never as the gate
- [x] Negative tests: expired window, wrong territory, wrong channel, wrong `rightsType`, missing record, caller-supplied spoofed record — each rejected server-side
- [x] Test asserts the *business outcome* (schedule not approved / export blocked), not that a function was called (Rule 0.1.2)

**Evidence:** `tests/unit/broadcast-rights-gate.test.ts` (new) + AC IDs `AC-UI-RL1-R07-13…18`; `docs/domain/state-machines.md` entry (TSK-52).

**Closure evidence (measured 2026-10-07, working tree — commit series landed 2026-10-15 as TSK-09):**

- *The gate is reachable from the lifecycle.* `approveSchedule` and `amendSchedule`
  (`src/modules/broadcast/versions/index.ts:323,:377`) call `clearScheduleEntries()` →
  `src/modules/broadcast/rights/schedule-clearance.ts` (new) → `validateScheduleRights`, and throw
  `[SCHED-RIGHTS-03]` **before any mutation**. `[SCHED-RIGHTS-01]` still requires the attestation and
  `[SCHED-RIGHTS-02]` (new) refuses an entry that names no `RightsRecord` — an attestation string can
  no longer clear a slot. `ScheduleEntry.rightsRecordId` is the only rights fact an entry may carry.
- *The route decides from the store, not the request.* `/api/v1/broadcast/rights/validate` now answers
  400 `RIGHTS_RECORD_FIELDS_NOT_TRUSTED` when the body carries any clearance field
  (`RIGHTS_RECORD_CLEARANCE_FIELDS` / `RIGHTS_RECORD_NESTED_FIELDS`), 400 `RIGHTS_RECORD_ID_REQUIRED`
  with no id, and 404 `RIGHTS_RECORD_NOT_REGISTERED` for an id the store does not have. The
  `CALLER_SUPPLIED_COPY` branch is **deleted** — `recordProvenance.source` can only ever be
  `REGISTERED_RIGHTS_RECORD`, and exclusive windows are derived from the register
  (`findExclusiveWindowsForAsset`), not from the caller.
- *Durability without making the lifecycle async* (defect 4's real blocker): `src/modules/broadcast/rights/registry.ts`
  (new) owns one `RightsRepository` with an `onWritten` hook and a synchronous read index hydrated at
  boot (`refreshRegisteredRightsIndex()`, called from `src/api/server.ts` before
  `ensureScheduleDemoSeed()`). A row written by another process is invisible to the index, so approval
  **fails closed** (`RIGHTS_RECORD_NOT_REGISTERED`) until hydration — asserted, not assumed.
- *Export re-checks.* `exportXmltv`/`pushToStarTimes` (`src/modules/broadcast/export/epg.ts`) call
  `recheckClearanceAtExport()` against the approved slots they are about to publish; the status
  `RIGHTS_NOT_CLEARED` with code `RIGHTS_NOT_CLEARED_AT_EXPORT` and no xml payload is returned even
  while the schedule is still `APPROVED` with an `approvedAt`. `tests/unit/todo-remediation.test.ts`
  BCST-02 asserts the same slot exports when the record covers it and refuses when it does not.
- *Negative tests assert business outcomes.* `tests/unit/broadcast-rights-gate.test.ts` — **11 tests**,
  labelled `AC-UI-RL1-R07-13…18` (expired window ×2, territory, channel, `rightsType`, missing vs
  unregistered record, fail-closed hydration, forged attestation) plus a positive control. Every refusal
  is asserted as state, not as a call: `state === "PENDING_APPROVAL"`, `approvedBy`/`approvedAt`/`lockoutAt`
  undefined, `exportXmltv(...).xmltv === undefined`. A forged `rightsClearedBy` of
  "Cleared and signed off by General Counsel — full window, all channels, all territories" still
  refuses, and dropping the annotation still fails `[SCHED-RIGHTS-01]`.
- *Persistence proven, not sandbox state* (Rule 0.4a): the suite prints
  `[TSK-10] rights gate path under test: Postgres (fail_closed)` and its fixtures are written through
  `RightsRepository` to Prisma, then read back by the gate's own index; `afterAll` deletes them.
- *Consequential honesty fixes.* `ensureScheduleDemoSeed` (`src/modules/broadcast/schedule-demo.ts`)
  previously approved a golden day whose entries carried only `rightsClearedBy` — i.e. the demo itself
  was the CA-07 defect. It now refuses **before any side effect** when a master's asset has no
  registered record, reporting `unclearedChannels`, and its entries carry `rightsRecordId`. The seed
  test asserts the refusal state first (`{channelsSeeded: 0, entries: 0, skipped: 2, unclearedChannels: 1}`,
  `listSchedules("NXTR")` empty) and only then the cleared path.
- *AC census moved with the evidence:* `docs/audit/ac-traceability-index.md` gains the
  `AC-UI-RL1-R07-13…18` row (**VERIFIED**, 6 of 6 labelled) and `tests/unit/ac-traceability.test.ts`
  is repinned to the re-measured **16 rows / 103 claimed / 17 labelled / 86 unlabelled**. The ordinals
  are the ones TSK-10 itself names in this register, not a new assignment — UIUX-001 is still absent
  (TSK-39), so every other R07 row keeps its prior status.
- *Not closed here:* `docs/domain/state-machines.md` does not exist yet — the schedule-approval
  transition entry is **TSK-52**, still open, so it is not cited as evidence anywhere. TSK-12
  (schedule lifecycle, reopened as `TODO-BCST-03`) and TSK-17 (durable tables for the other
  release-critical domains) are now unblocked by this gate but remain open.
  *Follow-up (2026-10-08):* TSK-12 closed the lifecycle against this gate and wrote
  `docs/domain/state-machines.md` §1 (measured machine, guards and refusal codes) and §3 (rights
  request vs clearance records); the census row cited at the "AC census moved with the evidence"
  bullet above is re-measured in §1.4. TSK-17 remains open — the schedule day is still sandbox Map
  state, and that is recorded as a finding in the document rather than as a completion.
  *Follow-up (2026-10-08, TSK-17 closure):* TSK-17 is now closed for the **14** stores CA-12 named as
  release-critical, and `docs/domain/systems-of-record.md` §3.1 records each one's table and read index.
  The **schedule day is still Map state** and stays so: `modules/broadcast/versions/index.ts:318` was
  deliberately not converted here, because TSK-12's lifecycle, its revision identity and its evidence
  gates would each need a durable equivalent of the in-process checks before a table could replace them
  — that is TSK-20's labelling job now and a separate piece of engineering, not a box in this task.
- *§3 exit-gate line for this task is deliberately not ticked.* `tasks.md:1567` ("the rights gate
  demonstrably blocks approval and export — TSK-10 negative tests green") is now locally true, but the
  §3 preamble requires every condition to hold **simultaneously on one commit** with all four CI steps
  on the same SHA. This work landed in the TSK-09 series on 2026-10-15; what still fails the gate is
  that CI has never run here (`TSK-57`, no Docker binary), so it is recorded here, not checked there.
- *Gate for this task:* `pnpm build` exit **0** · `pnpm lint` exit **0** ·
  `pnpm test` exit **0** — **59 files / 650 tests passed, 0 failed, 0 skipped**
  (from 58/639 before this task: +1 file, +11 tests). Reproduce with
  `pnpm vitest run tests/unit/broadcast-rights-gate.test.ts`.
- *Docs repaired to match:* `docs/audit/evidence-register.md` (the "Rights window gates" NOT-verified
  bullet → closed, pin 59/650), `docs/audit/journey-readiness-matrix.md` J-RL1-09 row (engine +
  durability columns), `docs/audit/ac-traceability-index.md` (new VERIFIED row + census),
  `docs/handoffs/LATEST.md` ("rights windows (TSK-10) — no" → yes, instruments list, pin).

#### TSK-11 · P1 · Wire the 33 broadcast operational screens to the engine *(reopens `TODO-BCST-01`)* — **IN_PROGRESS 2026-10-11: 6 of 7 boxes closed** · **2026-10-12: the dated box-6 follow-up landed** (the route now injects `buildScreenEngineSnapshot(context)`; billing + sponsorship project, as-run + playout stay honestly unbound) — the entry still does not move
**Source:** `report.md CA-08` · **Depends:** TSK-01, TSK-17 · **Owner:** Broadcast Engineering · **Gate:** DG-RL1-06, expiry **2026-10-31**
As raised (measured 2026-10-07): `src/web/broadcast/index.ts` carried `SCREEN_DECISIONS` with hardcoded per-screen KPIs for all 33 screens ("Carriage Uptime 99.98%", "Daily Yield ₦18.4M", "Prime Fill Rate 98.2%"), a generic invented fallback ("SLA Compliance 100% / Gate Cleared"), the SHA-256 **of the empty string** (`e3b0c442…`) presented as a "cryptographic playlist hash", static schedule-grid / playout-monitor / as-run-diff / yield panels, a fabricated carrier bar (`11,554 MHz StarTimes`, `PID 0x1021`) and an invented partner endpoint (`api.startimes.com/v2/epg/vmn`) — while the honest provenance layer (`getScreenData` / `renderScreenKpis`, `src/modules/broadcast/screens/data.ts:51`, `:150`) had **zero production call sites**.

- [x] All 33 screens sourced through `getScreenData`; the fabricated KPI table deleted — `src/web/broadcast/index.ts:839` builds the context (`buildScreenDataContext` `:50`) and `:840` renders `renderScreenKpis`. `SCREEN_DECISIONS` is gone (`grep -rn "SCREEN_DECISIONS" src/` → **0**); its **33** single-line `kpis: [...]` literals were removed in place and what remains is `SCREEN_DECISION_TEXT` (`:301`), which carries a decision sentence and an action label and asserts no value. Measured after the rewiring: **0** `kpis:` literals left in the renderer, **33/33** screens serve a provenance-badged strip.
- [x] The empty-string playlist hash removed — `renderPlaylistLockViewHtml` (`:613`) now computes `createHash("sha256")` over the **frozen approved revision entry set** (`:631`) and prints it per channel-day; with no approved revision it renders NOT_CONNECTED instead ("a hash of nothing is not evidence of a playlist"). The four invented playlist rows and the `Gate BG6 Cleared` badge are deleted.
- [x] Schedule grid and playout monitor read live engine state or render an explicit not-connected state — `renderScheduleGridTimelineHtml` (`:524`) renders `approvedScheduleEntries()` (`:87`), which reads the schedule store's approved revisions only (channel, date, window, revision id, rights-record authority per entry); `renderLivePlayoutMonitorHtml` (`:578`) shows engine on-air/lock state **only** when a caller supplies `engines.playoutStatus`, else NOT_CONNECTED. The standard desk table lost its three fabricated records (`REC-…-01/02/03`) and now lists real entries or an honest no-records row.
- [x] No fabricated numeric KPI remains reachable from any `/broadcast/*` route — guarded by enumeration, not by hope: `tests/unit/broadcast-provenance-coverage.test.ts` renders all **33** screens × 4 states and fails on any of **25** named literals (frequencies, PIDs, `Eutelsat 16A`, `Channel 142`, `api.startimes.com`, `99.98%`, `19,240,000`, `98.2%`, `SLA Compliance`, `TRANSMITTING ON AIR`, the advertiser names in the old as-run table, the empty-string hash). The carrier bar reads from the channel registry (`:1073`), which keeps carriage fields unset and prints `CARRIAGE UNVERIFIED` (CLAUDE.md `<broadcast>` law); the EPG inspector (`:716`) states that no syndication endpoint is configured rather than naming one; the yield panel (`:752`) prints a supplied billing snapshot or nothing.
- [x] Provenance banner verified on **every** screen branch *(answered by TSK-25, same file)* — the six bespoke panels are `:524`, `:578`, `:613`, `:689`, `:716`, `:752` and each substitutes only `panelContent`; **33 of 33** screens serve `vmn-provenance-banner`. After this wiring the banner is also *correct*: it is now conditional on the same `fullySourced` census the strip prints (`:844-846`), so a fully engine-sourced screen loses the demonstration label rather than keeping it.
- [ ] Register entry `UX-BR-001..033` status changes from `MOCK` only when screens emit `DOMAIN_ENGINE` for real sources — **deliberately not moved.** Measured 2026-10-11 (same instrument, printed on every run): **1 / 33** screens emit any `SOURCE:` badge (SCR-BCST-02, from the live channel registry) and **33/33** still carry at least one `NOT_CONNECTED`/`PROVISIONAL` badge, because carriage is unverified and no playout/billing/as-run snapshot is supplied by the router. **Re-measured 2026-10-12 at the route** (`docs/audit/evidence/tsk11-served-screen-engine-snapshot-2026-10-12/served-census.txt`: all 33 routes served over HTTP with `role = screen.primaryRole`): **2 / 33** now serve a `DOMAIN_ENGINE` `SOURCE:` badge — SCR-BCST-02 and **SCR-BCST-20**, whose whole strip reads the durable sponsorship bindings hydrated at boot — and **31 / 33** still carry an unsourced badge. The renderer-level 33/33 figure in `tests/unit/broadcast-provenance-coverage.test.ts` is unchanged and is now labelled for what it measures (no snapshot injected at the renderer); the served figure is measured separately. Flipping the entry to `IMPLEMENTED` would still be the same overstatement CA-08 was: booked revenue on SCR-BCST-21/31 reads `NOT_CONNECTED` on a freshly booted instance because `CommercialBillingSchedule` is not a durable store, and as-run/playout have no source at all. The state that is now actually true — "authorization-gated, renders its canonical fields, and shows an explicit NOT CONNECTED section for the unbound feeds" — is not expressible in the register's vocabulary; that is **TSK-60 box 4**, and this box moves with it.
- [x] Guard test asserting `SCREEN_DECISIONS` and fabricated KPI literals stay deleted — `tests/unit/broadcast-provenance-coverage.test.ts` (31 tests) fails on `src` containing `SCREEN_DECISIONS`, on any `^\s*kpis: [` literal in the renderer, and on the fabricated-label set above. `tests/unit/broadcast-screens.test.ts` (16 tests, was 11) seeds a **real approved day** through the lifecycle (`registerFixtureRights` → `registerVersion` → `markReadyForAir` → `upsertDraftSchedule` → `approvePreAirChain`) and asserts the grid renders that entry, the digest equals the same SHA-256 recomputed in the test, and the unseeded screens render NOT_CONNECTED. Six assertions that previously enforced the fabricated content were **moved to the corrected contract** (Rule 0.3: none was deleted or weakened — each now asserts both the honest text *and* the absence of the invention).

**Depends on / blocks:** nothing blocked by this increment; box 6 is gated on TSK-60's register vocabulary and on the remaining panels acquiring a real source (an ingestion decision, not a wiring one).
**Residual, recorded:** (1) *closed 2026-10-12:* the router passed no `engines`, so the only live `SOURCE:` badge served was the channel registry's. `src/api/router.ts:406` now builds `buildScreenEngineSnapshot(context)` and the screen route passes it at `:3553`, projecting billing totals and the hydrated sponsorship audit; the as-run and playout panels are deliberately left unsupplied (no as-run ingestion in `src/`, no on-air/lock state in the playout engine — reasons and greps in the evidence dir). What that left outstanding is recorded in box 6 above, not here; (4) **found while measuring 2026-10-12, not fixed:** `/broadcast/dashboard` is answered at `src/api/router.ts:2973` by the legacy `renderDashboardHtml()` page *before* the screen matcher at `:3512`, so SCR-BCST-01's provenance-badged strip is never served on its own route. The legacy page is authenticated (anonymous rejected — `tests/security/route-authorization.test.ts:189`) and prints no invented figures ("Telemetry unavailable … illustrative metrics are intentionally withheld", `src/web/public/dashboard.ts:621`), so this is a surface duplication, not a data-integrity defect; deleting one of the two handlers is the owner's call; (2) `SCREEN_GATES` labels (`src/web/broadcast/index.ts:254`) and the per-screen `decision` sentences remain editorial content; (3) the `empty`/`error`/`loading` state templates are still demonstration affordances reached by `?state=` (DT-404), not engine states.

**Closure evidence (2026-10-11, all gates on one tree):** `pnpm typecheck` 0 · `pnpm lint` (`--max-warnings 0`) 0 · `pnpm test` 0 — **67 files / 798 tests**, 0 failed, 0 skipped · `pnpm build` 0 · `pnpm test:coverage` — the same **67 files / 798 tests** passed and the report cleared the floors (**78.93 statements / 70.34 branches / 82.64 functions / 80.22 lines** vs 73/62/77/72), but both attempts exited **1** on an unrelated vitest worker teardown (`EnvironmentTeardownError: Closing rpc while "onUserConsoleLog" was pending`, attributed to `tests/unit/admissions.test.ts`) while the machine ran under a load average above 200; recorded here as **not yet a clean exit-0 coverage run**, and re-run under the final tree rather than reported as green. Artifacts: `docs/audit/evidence/tsk11-broadcast-screens-wired-2026-10-11/` (`coverage.txt` = the teardown-flagged attempt, `coverage-attempt-contended.txt` = the earlier attempt, both retained). `tests/unit/broadcast-screens.test.ts` 16 + `tests/unit/broadcast-provenance-coverage.test.ts` 31 = **47 tests** in the two instrument files.

**Closure evidence addendum (2026-10-12, box 6 wiring, all gates on one tree):** `docs/audit/evidence/tsk11-served-screen-engine-snapshot-2026-10-12/` — `pnpm typecheck` 0 · `pnpm lint` (`--max-warnings 0`) 0 · `pnpm build` 0 · `pnpm test` 0 — **68 files / 813 tests**, 0 failed, 0 skipped, 27.39 s · **`pnpm test:coverage` exit 0** — the same **68 / 813** with **79.04 statements / 70.50 branches / 82.94 functions / 80.33 lines** against floors 73/62/77/72, none of them moved. That is the clean exit-0 coverage run the 2026-10-11 note above recorded as *not yet achieved*; the two teardown-flagged attempts are retained in the older directory, not replaced. Focused instrument run: 5 files / **76** tests (`broadcast-screens` 20, `broadcast-provenance-coverage` 31, `screen-register-verification`, `desk-census`, `route-authorization`). Changed instrument counts: `broadcast-screens.test.ts` **16 → 20** tests (4 added: builder projection, renderer-with-snapshot, and two served-over-HTTP drills), `broadcast-provenance-coverage.test.ts` 31 tests with **no threshold moved** — its 33/33 figure is renderer-level prose, re-worded to say so because the route now injects a snapshot. Census reproduction: `node …/measure-served-census.mjs` (serves all 33 routes against the compiled `dist/src` with a live Postgres; `served-census.txt`). That insertion then invalidated the register's own `router.ts` pins — swept, re-opened symbol by symbol and recorded under §9.9 with its own evidence dir, `docs/audit/evidence/doc-pin-repin-2026-10-12/`.
#### TSK-12 · P1 · Reconcile the schedule state machine with PRD §15
**Source:** `report.md CA-14` · **Depends:** TSK-10
`src/modules/broadcast/versions/index.ts:144` defines `ScheduleState = DRAFT | PENDING_APPROVAL | APPROVED | AMENDED | LOCKED`. The PRD chain (PROGRAMMING REVIEW → RIGHTS CHECK → TRAFFIC READY → ON AIR → AS-RUN RECONCILED → ARCHIVED) and schedule revision identity are absent (0 grep hits). `docs/handoffs/LATEST.md:211` declares BCST-03 closed on the strength of the shorter machine.

- [x] Either the machine is extended to the PRD chain, or a decision record states RL1 ships the reduced lifecycle with named owner sign-off
- [x] Schedule revision identity implemented or formally deferred
- [x] Whichever is chosen, `docs/domain/state-machines.md` (TSK-52) documents the real machine, not the aspirational one
- [x] `TODO-BCST-03` status in the register matches the delivered machine

**Evidence:** state machine doc + transition tests for every edge.

**Closure evidence (measured 2026-10-08, working tree — commit series landed 2026-10-15 as TSK-09):**

- *The branch chosen is "extend the machine".* The alternative required a named owner signature
  stating RL1 ships the reduced lifecycle; that signature does not exist and this register does not
  manufacture one. `ScheduleState` (`src/modules/broadcast/versions/index.ts:193`) is now the nine
  PRD §15 states (`:179-189`) plus `AMENDED`/`LOCKED`, declared as **implementation controls** rather
  than stages (`:192`), and the old `PENDING_APPROVAL` stage is gone (`grep -rn '"PENDING_APPROVAL"' src/ | grep -v commercial-proposal` → no output).
- *Every transition is guarded* — eleven of them, 49 distinct refusal codes
  (`grep -o "SCHED-[A-Z]*-[0-9]*\|SCHED-01" src/modules/broadcast/versions/index.ts | sort -u | wc -l` → 49),
  each asserted as an outcome in `tests/unit/broadcast-schedule-lifecycle.test.ts` (**13 tests**): the
  blocked candidate cannot pass RIGHTS_CHECK *and* is separately refused at approval, playlist and
  export; a day that was never handed to playout cannot go ON AIR; reconciliation is all-or-nothing
  per entry; `ARCHIVED` requires a reconciled day.
- *Rights check moved to its PRD position.* `RIGHTS_CHECK` is now the stage that decides
  (`passRightsCheck` → `[SCHED-RIGHTS-03]` `:477`), `APPROVED` re-runs the same gate as defence in
  depth (`:555`), and `TRAFFIC_READY` is entered *by the gate clearing* while a named officer's
  attestation is recorded against it (`passTrafficCheck` `:492`; approval refuses without it —
  `[SCHED-APR-03]` `:550`). `tests/unit/broadcast-rights-gate.test.ts` was re-pointed to that
  ordering (**12 tests**, all refusals now asserted at the stage that owns them, plus a new test that
  a window lapsing between RIGHTS_CHECK and APPROVED blocks approval at `revision 0`).
- *Revision identity implemented, not deferred.* `revision`/`revisionId` (`SCHED-…#R1`, `#R2` on
  amendment), `revisions[]` history with frozen entry sets, `getScheduleRevision`/`getApprovedRevision`
  (`:867`); exports name their source revision (`<source-revision>` in the XMLTV payload,
  `ApprovedScheduleDay.revisionId`, and `SCHEDULE_REVISION_IDENTITY_MISSING` refusing an
  unattributed day) — `tests/unit/todo-remediation.test.ts` BCST-02.
- *ON AIR / AS-RUN RECONCILED are evidence-only*, per §15 `:719`: verified against the proof-of-air
  certificate registry, with `[SCHED-AIR-05/06/07/08/09]` refusing an unknown, unsigned,
  contradicting, off-day or wrong-channel artifact. No planning flag can produce either state.
- *The machine is documented as delivered* — `docs/domain/state-machines.md` §1 (states, transitions,
  guards, and §1.4 "What is NOT true of this machine": TRAFFIC_READY is an attestation, not a
  computed control; the day is still sandbox Map state, which stays TSK-17's finding). §2–§7 of the
  same document cover the other six lifecycles TSK-52 asked for, including the three that are **not**
  machines at all and the unguarded writes found in admissions, escrow deposit and sales staging.
- *`TODO-BCST-03` matches the delivered machine*: census row `tasks.md:156` → CLOSED with evidence row
  "BCST-03 schedule lifecycle" in `docs/audit/todo-remediation-evidence.md:34`, whose Round-6C text
  ("upsert→submit→approve→lockout→amend") is now recorded as the CA-14 finding rather than the
  requirement. `tests/unit/register-inheritance.test.ts` re-pinned to the re-measured
  **CLOSED 57 / REOPENED 5**, and the reopened set is now exactly §1.3's mapping.
- *Callers follow the machine:* `src/modules/broadcast/export/approved-schedules.ts`
  and `src/web/public/schedule-presentation.ts` filter on `isApprovedForAir` (`:206`) instead of the
  single old `APPROVED`/`PENDING_APPROVAL` comparison; `ensureScheduleDemoSeed`
  (`src/modules/broadcast/schedule-demo.ts`) walks the whole pre-air chain with sandbox-declared
  authorities; `tests/helpers/rights-fixtures.ts` `approvePreAirChain` is the shared walk for suites
  whose subject is not the lifecycle.
- *Gate for this task:* `pnpm build` exit **0** · `pnpm lint` exit **0** (0 errors, 0 warnings under
  `--max-warnings 0`) · `pnpm test` exit **0** — **60 files / 665 tests passed, 0 failed, 0 skipped,
  0 unhandled errors** (from 59/650 before: +1 file, +15 tests). Reproduce with
  `npx vitest run tests/unit/broadcast-schedule-lifecycle.test.ts`.
- *§3 exit-gate lines are deliberately not ticked,* for the same recorded reason as TSK-10: this work
  landed in the TSK-09 series on 2026-10-15 and CI has still never run on it (`TSK-57`).

#### TSK-13 · P1 · Rewire the client counterparty portal to canonical deals *(reopens part of `TODO-SCR-19`)*
**Source:** `report.md CA-09` · **Depends:** TSK-01, TSK-17
**Measured then (2026-10-07/08):** `src/web/portal/client-portal.ts:55` defined `MOCK_CLIENT_PROJECTS` (verified against HEAD `ce098f8`), served live from the client-portal branches of `src/api/router.ts` — working-tree positions `:2496` (list) and `:2541` (detail) as re-measured 2026-10-09, `:2395`/`:2437` in `report.md`, `:2026`/`:2083` in HEAD; the file has grown between each measurement, which is why the citations are dated rather than absolute. `docs/decisions/screen-register.json` marked UX-POR-001 / UX-PRJ-002 / UX-COM-010 **IMPLEMENTED** while the page contained no demo/provenance banner (0 hits for banner/provenance/canonical-note in the file) and its 403 copy referred to "canonical records". **Closed 2026-10-09** — see the evidence block below the boxes.

- [x] Portal projects from `QuoteToCashSalesEngine` deals scoped by `getClientOrgRelationship` (helper already exists)
- [x] `MOCK_CLIENT_PROJECTS` deleted, with a guard test keeping it deleted
- [x] Cross-org access still 403 (regression preserved)
- [x] If full rewire is out of RL1 scope: register entries downgraded to `MOCK` **and** a provenance banner added — **premise did not hold, so this branch was not taken**; recorded rather than silently dropped, see closure evidence

**Evidence:** `tests/unit/client-portal-and-operations.test.ts` (24 tests) — the rewire, the deletion guard and the cross-org/leak regressions; `docs/audit/evidence/tsk13-canonical-client-portal-2026-10-09/`.

**Closure evidence (measured 2026-10-09, working tree — commit series landed 2026-10-15 as TSK-09):**

- *The fixture was worse than empty, and that is why it is gone.* `MOCK_CLIENT_PROJECTS` rendered
  per-airing "certificates" with invented `certificateNumber`, `carrier`, `asRunTimestamp` and a
  `complianceSignature` presented as a "Cryptographic Playout Hash" on a **counterparty** surface —
  fabricated transmission evidence shown to a client as their own proof of performance. Nothing in the
  deleted shape matches the real type (`ProofOfAirCertificate`, `src/modules/broadcast/asrun/index.ts:47`:
  `certificateId`/`airedTimestamp`/`cryptographicSignature`), so it was not a stale projection of it
  either. `Project` (`prisma/schema.prisma:226`) has zero `prisma.project` accessors, so no canonical
  table existed to project.
- *Box 1 — what the portal now reads.* `projectClientPortfolio` (`src/web/portal/client-portal.ts:85`)
  filters `context.salesEngine.listDeals()` on the canonical `clientOrgId`, and `toClientProject`
  (`:60`) copies fields or derives `status` from `stage` through one stated rule
  (`statusFromStage`, `:54`) — no value is manufactured at render time. The organisation scoping is
  still enforced upstream by `getClientOrgRelationship` (`src/api/router.ts:979`), which returns only
  STAFF_ACCESS / FORBIDDEN / UNAUTHENTICATED; the list branch reads at `:2496` and the detail branch
  projects-then-finds at `:2541`, so a foreign `projectId` under a valid `orgId` is a 404, not another
  client's deal. Each page now carries a `SOURCE:` line naming the engine and the scope predicate.
- *Box 2 — the guard, not a grep.* `tests/unit/client-portal-and-operations.test.ts` asserts
  `Object.keys(clientPortalModule)` contains no `MOCK_*` export, that neither `export const MOCK_` nor
  `const MOCK_` survives in the portal source, and that `src/api/router.ts` no longer references
  `MOCK_CLIENT_PROJECTS`. Three further tests assert specific fabricated strings (`CERT-TX-2026-09228`,
  the playout-hash label, the Eutelsat carrier line, `PRJ-VMN-2026-088`) never appear in a rendered
  detail page, so re-adding the fixture under a new name still fails the suite.
  **Recorded, not hidden (Rule 0.3):** two tests were retired here — `renders client projects list HTML
  accurately with approved scope and status` and `renders client project detail HTML with commitments
  table and released proof reports`, both present at HEAD `ce098f8`. They asserted the *fixture's*
  content (`COMM-DAG-8842`, `45,000,000`, `CERT-TX-2026-09228`, `Eutelsat 16A …`) and could not survive
  the fixture's deletion; each was replaced by a canonical-deal equivalent with the same coverage —
  scoped portfolio render (₦18,000,000 collected, `IN_RECONCILIATION`), honest empty portfolio, and the
  detail render that now asserts the fabricated strings are **absent**. The file went 19 tests at HEAD →
  **24** (6 added, 2 retired), and no security assertion was loosened to accommodate the change.
- *Box 3 — regression preserved, and strengthened.* The pre-existing 401/403/503 tests are unchanged
  (Rule 0.3: nothing was relaxed). Added: a real deal created through the guarded
  `POST /api/v1/finance/deals` route is then requested over HTTP as an anonymous caller, a
  domain-guessing `AcademyLearner`, and an `ExecutiveLeader`; none of those responses may contain the
  new deal's commercial ref, deal id, name or amount. This replaces a magic-string probe with a live
  leakage probe on data the repository actually holds in memory.
- *Box 4 — why the downgrade branch was not taken.* §3's exit-gate line requires
  `MOCK_CLIENT_PROJECTS` **absent with guards**, which a `MOCK` status + banner would have contradicted;
  and the register's own precedent (`TODO-SCR-19`'s other portals, `docs/audit/todo-remediation-evidence.md`
  "SCR-19 …" rows) is to project canonical state and state the gap honestly. So the identity/money half
  is bound to the engine and the register entries stay `IMPLEMENTED` with corrected evidence prose, while
  the two halves no canonical record can answer — per-deliverable channel/daypart/run commitments and
  per-airing certificates — render an explicit **NOT CONNECTED** section naming the missing join, and
  the proof section shows only the deal's own `proofDocumentUrl` when
  `proofOfPerformanceVerified && proofDocumentUrl`. The delivery-commitments link points at the one
  mounted surface (`/broadcast/asrun/exceptions`); it does not claim per-client exception data.
- *Stated limits (this is why TSK-60 exists).* Measured: `CommercialSpot` identifies its client only by
  free-text `clientName` (`src/modules/broadcast/traffic/index.ts:19`) and `CommercialCampaign` likewise
  (`prisma/schema.prisma:492` `clientName`), so nothing joins a booked deliverable to a `SalesDeal` or an
  `Organisation`; `ProofOfAirCertificate.clientName` is free text too. And `QuoteToCashSalesEngine`
  stored deals in a process `Map` with no `salesDeal` entry in `registerDurableStore` — measured then:
  **13** `registerDurableStore<…>(` call sites across `src/`
  (sessionRecord, privacySecurityCase, contentItem, mediaAssetRecord, riskRecord, issueRecord,
  azeeboDestination, approvalItem, idempotencyRecord, journalEntry, commercialEnquiry, sponsorBinding,
  sponsorFulfillment), none a sales deal, so the portfolio was a true projection of *current process
  state*: a restart emptied it. **That half is closed — TSK-60 box 3, 2026-10-11** (portfolio now
  registers `salesDeal`, 14 call sites; see TSK-60). The deliverable↔deal join is still open.
- *Gate for this task (same tree, same session):* `pnpm typecheck` exit **0** · `pnpm lint` exit **0**
  (0 errors, 0 warnings under `--max-warnings 0`) · `pnpm build` exit **0** · `pnpm test` exit **0** twice
  — **65 files / 746 tests passed, 0 failed, 0 skipped, 0 unhandled errors** both runs (742 → 746: the
  portal suite's 6 added − 2 retired) · `pnpm test:coverage` exit **0** — **78.47 statements / 69.89
  branches / 82.19 functions / 79.74 lines** against the pinned floors 73/62/77/72. Log files and the
  reproduction commands are in `docs/audit/evidence/tsk13-canonical-client-portal-2026-10-09/`. Focused
  reproduction: `npx vitest run tests/unit/client-portal-and-operations.test.ts` (24 tests).
- *§3 exit-gate lines are deliberately not ticked,* for the same recorded reason as TSK-12: this work
  landed in the TSK-09 series on 2026-10-15 and CI has never run on it (`TSK-57`).

#### TSK-14 · P1 · Consolidate the two parallel rights implementations
**Source:** `report.md CA-32` · **Depends:** none · **Blocks:** TSK-10's durability
`src/core/rights/index.ts` (review-request workflow; citation:absent — deleted by TSK-14) and `src/modules/broadcast/rights/index.ts` (clearance engine) **were** separate, non-communicating modules with overlapping names. This is precisely how CA-07 went unnoticed — the review-request half is wired and tested, so the domain *looks* covered while the gate is not.

- [x] One rights context owns both request workflow and clearance
- [x] Review-request resolution writes to the same durable `RightsRecord` the gate reads
- [x] Naming collision removed so a future reader cannot mistake request-tracking for clearance
- [x] Test proving a cleared review request actually satisfies the gate (end-to-end, not unit-isolated)

**Evidence:** module consolidation diff + the E2E clearance test.

**Closure evidence (measured 2026-10-07, working tree — commit series landed 2026-10-15 as TSK-09):**

- *One context.* `src/modules/broadcast/rights/` is now `clearance.ts` (the gate, moved verbatim
  out of `rights/index.ts`), `review-request.ts` (the workflow, moved out of the deleted
  `src/core/rights/`) and `index.ts` as the barrel that re-exports both. `src/core/rights/` is
  removed; `tests/integration/rights-clearance-e2e.test.ts` asserts both halves: the directory is
  absent, and the context directory contains exactly those three files.
- *Durability.* `src/core/database/repositories/rights.repository.ts` (new) writes `RightsRecord`
  through Prisma in the repository-mode policy (`fail_closed` → 503, never a silent memory write).
  The durable row needed the gate's own scope fields, so `channelCode String?` was added
  additively and migrated: `prisma/migrations/20261007191447_add_rights_record_channel_scope/migration.sql`.
  `migrate diff` against the live schema is empty in both directions, and `migrate deploy` applied it.
  `resolveRightsReviewRequest(… RESOLVED_CLEARED_BY_SOURCE)` calls `repository.applyReviewWindow`,
  and `/api/v1/broadcast/rights/validate` loads the record through the same repository when the
  caller names a `rightsRecordId`.
- *Reachability (CA-32's "wired-looking domain").* The workflow had modelled transitions no route
  could reach. `POST /api/v1/broadcast/rights/review-requests/{id}/transition` and `…/{id}/resolve`
  are new, both guarded `update:rights` in `ROUTE_GUARDS`; resolution is the only route that can
  change a `RightsRecord`. `ROUTE_GUARDS.length` moved 73 → **75**, mutating dispatch sites
  115 → **117** (API 102 → 104), inline-enforced 57 → **59** — re-measured and repinned in
  `tests/security/route-guard-parity.test.ts:245`, recorded in `docs/security/route-authorization-coverage.md`.
- *Naming collision removed from the product, not just the filesystem.* The UI heading, submit
  button, desk links, page title, success panel and audit action names no longer say "waiver" or
  "expedited rights waiver" (`RIGHTS_REVIEW_REQUEST_OPENED` replaces
  `EXPEDITED_RIGHTS_WAIVER_REQUESTED`); the invented ticket number and the 30-minute SLA claim were
  deleted from the success panel. `tests/unit/client-portal-and-operations.test.ts` asserts the
  rendered form carries the four workflow fields the domain requires and
  `expect(html).not.toMatch(/waiver/i)`.
  HD-02 (BRD §62 C-1 override) is deliberately **not** implemented and no wording claims it:
  clearing from source evidence is not an override.
- *Gate stays a gate.* Opening a request writes nothing — the E2E suite re-checks the slot after
  `POST /review-requests` and still gets `POST_EXPIRY_DATE`. A `RESOLVED_BLOCK_RETAINED` decision
  asserts `rightsRecord: null` and an unchanged expiry. Clearing without an evidence reference is
  refused (`RRR-06`), with a note under 8 chars (`RRR-05`), and against an unregistered record id
  (`RRR-09`); none of the three leaves the request in a resolved state.
- *The proof is end-to-end.* Same record id, same slot, over HTTP: blocked →
  `POST /review-requests` → `/transition` ×2 → `/resolve` with evidence → the identical gate call
  returns `allowed: true`. Run against live Postgres (`fail_closed`):
  `[TSK-14] rights clearance path under test: Postgres (fail_closed)`, and a **second**
  `RightsRepository()` instance — its own empty Map — reads the extended `expiryDate` and
  `channelCode` back from the database, so the claim is persistence and not sandbox state (Rule 0.4a).
  Negative authorization: anonymous `…/resolve` → 401, `PlayoutOperator` → 403, and after both the
  gate still blocks. The caller-supplied-copy path is still reachable (TSK-10 owns closing it) and
  is now labelled `recordProvenance.source: "CALLER_SUPPLIED_COPY"` instead of passing as a
  clearance of the record of account.
  *Follow-up (TSK-10, same day):* that sentence was true at this measurement and is no longer — the
  `CALLER_SUPPLIED_COPY` branch has since been deleted, the route refuses body-supplied clearance
  fields outright, and `recordProvenance.source` can only ever read `REGISTERED_RIGHTS_RECORD`.
  Recorded rather than rewritten so each task's evidence stays tied to what it measured.
- *Not closed here.* TSK-10 (schedule approval must consult the gate server-side) and TSK-17
  (durable request store — request state is still per-process, stated in the module header) stay
  open; this task is the durable-record precondition TSK-10 was waiting on.
  *Follow-up:* TSK-10 closed 2026-10-07 against this precondition; TSK-17 remains open.
  *Follow-up (2026-10-08):* TSK-17 closed — but **not this store**. The 14 tables it added cover the
  entities CA-12 named, and the durable `RightsRecord` is among them; the **rights review *request***
  ledger (`modules/broadcast/rights/review-request.ts:63`) was not, so it is still per-process and is
  listed as `M` in `docs/domain/systems-of-record.md` §3.3. A resolved request therefore survives only
  as the `RightsRecord` its resolution wrote.
- *Gate for this task:* `pnpm build` exit **0** · `pnpm lint` exit **0** ·
  `pnpm test` exit **0** — **57 files / 632 tests passed, 0 failed, 0 skipped**
  (from 56/624 before this task: +1 file, +8 tests). Reproduce with
  `pnpm vitest run tests/integration/rights-clearance-e2e.test.ts`.
- *Docs repaired to match:* `docs/decisions/screen-register.json` UX-GOV-004 evidence (cited the
  `src/core/rights/index.ts` (citation:absent — deleted by TSK-14); the check failed until repointed),
  `docs/audit/journey-readiness-matrix.md` J-RL1-09 row, `docs/handoffs/LATEST.md` §Round 4
  "Rights Waiver & Clearance" heading, `docs/audit/evidence-register.md` rights bullet.

#### TSK-15 · P1 · Add the missing carriage/compliance entities
**Source:** `report.md CA-12` (PRD-mandated entities with neither model nor code) · **Depends:** TSK-17
`CarriageAgreement`, `CarriageEndpoint`, `TrafficInstruction`, `EPGEntry`, `AdSpot`, `CampaignBooking`, `PromoAsset`, `ChannelEditorialProfile`, `BroadcastComplianceRecord` — 0 grep hits each. `src/modules/broadcast/carriage/index.ts:22-95` does real incident/SLA arithmetic but has no agreement or endpoint entity behind it (PRD §13/§21/§36).

- [ ] Entities modelled per PRD §13/§36, or each explicitly deferred by decision record with owner
- [ ] Carriage entities remain `PROVISIONAL` and are never rendered as authoritative while BG6 is `NOT_TESTED`
- [ ] Do **not** fabricate StarTimes technical data — CLAUDE.md `<broadcast>` forbids hard-coding unverified channel numbers, endpoint IDs, and carriage economics (`audit.md` AUD-09, genuinely closed: defaults removed from `src/core/config/index.ts`)

**Evidence:** schema diff + register entries citing PRD section per entity.

#### TSK-16 · P1 · Implement real make-good rebooking *(see TSK-33 for the finance side)*
**Source:** `report.md CA-16` · **Depends:** TSK-17
- [x] `src/modules/broadcast/traffic/index.ts:200-260` rebooks inventory instead of dequeuing and returning `resolved: true`
- [x] Shortfall/credit linkage visible on the exception workbench `/broadcast/asrun/exceptions`

**Closure evidence (2026-10-09, line numbers re-measured after TSK-33 landed on the same tree):**
- `resolveMakeGood` (`src/modules/broadcast/traffic/index.ts:200-260`) now books through the same
  `scheduleSpot` gate as a normal booking and only de-queues after inventory actually moved (`:251`), so
  a full target break fails with `[MG-05]` (`:236`) and the item stays queued. `addToMakeGoodQueue`
  (`:182-187`) validates the record (`[MG-01]` `:184`); `:203` `[MG-02]` (not queued), `:225` `[MG-03]`
  (no approved creative identity) and `:231` `[MG-04]` (no such break) refuse; an unknown action falls
  through to the inventory action rather than silently dismissing the obligation.
  `dischargeMakeGoodByCreditNote` (`:267-273`, `[MG-06]` at `:270`) withdraws the inventory claim only
  when a credit note already exists — the removed CA-16 stub has no successor.
- New register `src/modules/broadcast/asrun/exceptions.ts` (`raisePoaExceptionsFromAsRun` `:112`,
  `resolvePoaException` `:241`) derives each exception from measured as-run shortfall
  (`expected - actual`, raised only for `AIRED_PARTIAL`/`TECHNICAL_ERROR`/`PREEMPTED`/zero-air items),
  links it to the billing make-good produced by `generateBillingScheduleFromAsRun`, and owns nothing:
  it calls the traffic and billing engines and never books or credits by itself. Re-ingesting the same
  log cannot re-open a closed exception.
- Workbench `renderPoaExceptionsWorkbenchHtml` (`src/web/workspace/governance-and-operations.ts:374`)
  renders Shortfall (planned vs as-run), discrepancy nature and the `makeGoodId`/`creditNoteId`
  linkage from the register; the canned rows and the false "counterparty notification logged to
  ledger" copy are deleted. `/broadcast/asrun/exceptions` (GET `src/api/router.ts:3028`),
  `/api/v1/broadcast/asrun/exceptions/{id}/resolve` (POST `:4435`, guarded `update:broadcast`) reports
  the engine's actual verdict — 303 with `?resolutionError=` and an open obligation on refusal — and
  `/api/v1/broadcast/asrun/reconcile` (`:5917`) raises the exceptions as part of reconciliation.
- **Tests:** `tests/unit/poa-delivery-exceptions.test.ts` — **13** tests, all passing
  (raise + linkage, idempotent re-ingest, rebooking closes only on real inventory (`[TRAFFIC-DUP-01]`
  proves the 8s was booked), credit-note close, `[MG-04]`/`[MG-03]` refusals leave the row `OPEN`,
  `[POA-EXP-01..03]`, zero-second shortfall, renderer empty state + resolved banner + refused alert,
  and the three TSK-33 ledger cases below).
  `tests/unit/uat-broadcast-failure-drills.test.ts` grew 20 → **29** (Drill 12 strengthened, not
  relaxed; new `[MG-01..05]` describe). `tests/unit/client-portal-and-operations.test.ts` now raises a
  real 8s shortfall through the reconcile route, asserts the workbench row plus the 401/400 paths, and
  (TSK-33) drives the credit remedy through the route to the journal entry the served ledger holds.
- **Gates on this tree:** `pnpm typecheck` exit 0; `eslint` on the touched files
  `--max-warnings 0` exit 0; the affected suites green.
- **Stated limit (Rule 0.4a):** the exception register is per-process state; `AsRunLogRecord`
  (`prisma/schema.prisma`) persists aggregate counts only, so a restart empties the desk. Documented
  in the module header, not hidden. Ledger posting of make-good credit notes was **TSK-33**'s scope and
  is *not* claimed by TSK-16 itself — it is delivered on this tree and evidenced under TSK-33.

---

### TRACK C — Persistence / system of record (P1)

> Goal: canonical law 6 ("one evidence graph") and PRD §37. `report.md CA-12` measures **138** module-level in-memory store declarations; Prisma is consulted in only 4 repositories + `src/core/audit` + seed scripts; the schema has 27 models. **Those are CA-12's 2026-10-06 figures and the tree has moved since:** re-measured 2026-10-08 after TSK-17 the schema declares **41** models (`grep -c "^model " prisma/schema.prisma`), **28** have at least one Prisma accessor and **24** are written at runtime, while the store census is **40** module-level + **70** class-field `new Map()`/`new Set()` declarations (`docs/domain/systems-of-record.md` §2/§3.3, commands in §6, enforced by `tests/unit/systems-of-record.test.ts`; 39 → 40 and class-field 68 → 70 on 2026-10-09, when TSK-16 added the POA delivery-exception register and TSK-33 added the ledger's credit-note posting guard). The 138 is retained because it is what CA-12 measured, not because it is current.

#### TSK-17 · P1 · Durable tables for the release-critical domains
**Source:** `report.md CA-12`, `report.md §4` (persistence ~20%) · **Depends:** TSK-06 · **Blocks:** TSK-10, TSK-13, TSK-16, TSK-18, TSK-20
Confirmed absent from the schema (verified by direct grep; `prisma_model=0` in every case):

| Entity | Currently claimed closed by | Durable table (read index stays in the module) |
|:---|:---|:---|
| `Enquiry` — the flagship VS-RL1-01 slice | `docs/audit/ac-traceability-index.md:7` VERIFIED | `CommercialEnquiry` (`prisma/schema.prisma:571`); index `src/modules/hub/enquiry/index.ts:66` |
| `ApprovalItem` — four-eyes SCR-06 | `docs/handoffs/LATEST.md:16` | `ApprovalItem` (`:579`); index `src/core/approvals/index.ts:53` |
| `ContentRevision` — CMS SCR-01/02 | `docs/handoffs/LATEST.md:16` | `ContentItemRecord` + `ContentRevisionRecord` (`:738`, `:754`) — one row per revision, so a superseded revision is still readable; index `src/core/content/index.ts:96` |
| `MediaAsset` — DAM picker SCR-03 (12 src files depend on it) | `docs/handoffs/LATEST.md:16` | `MediaAssetRecord` (`:680`), `sizeBytes` as `BigInt`; index `src/core/storage/index.ts:317` |
| `LedgerPosting` / `JournalEntry` — FIN-03 | `docs/handoffs/LATEST.md:189` | `JournalEntryRecord` (`:782`), lines as JSON with `Decimal(14,2)` totals; engine hydrate `src/modules/finance/ledger/index.ts:166` |
| `PrivacySecurityCase` — SCR-08 | `docs/handoffs/LATEST.md:16` | `PrivacySecurityCase` (`:604`) incl. its append-only audit trail; index `src/core/cases/index.ts:28` |
| `RiskRecord` / `IssueRecord` | `docs/handoffs/LATEST.md:30` | `RiskRecord` + `IssueRecord` (`:623`, `:641`); index `src/core/work/index.ts:166-167` |
| `AzeeboDestination` | `docs/handoffs/LATEST.md:16` | `AzeeboDestination` (`:660`) — verification state is data now; index `src/core/federation/destinations.ts:33` |
| `SponsorBinding` — BCST-12 | `docs/handoffs/LATEST.md:18` | `SponsorBindingRecord` + `SponsorFulfillmentRecord` (`:811`, `:829`); the desk's engine is hydrated at `src/api/server.ts:335` |
| `SessionRecord` / `IdempotencyKey` | SEC-03/SEC-08 | `SessionRecord` (`:701`, sha-256 digest only) and `IdempotencyRecord` (`:717`, hydrated inside its own TTL window); indexes `src/core/auth/sessions.ts:42`, `src/core/websecurity/index.ts:255` |

- [x] Model + additive migration + repository for each, wired with `fail_closed` as the default mode — **14 tables in two purely additive migrations**: `prisma/migrations/20261008213000_add_release_critical_durable_stores` (9 tables, 17 indexes) and `prisma/migrations/20261008220000_add_remaining_release_critical_durable_stores` (5 tables, 8 indexes). Both generated with `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma` (so the SQL is exactly the delta against the live database), applied with `prisma migrate deploy`, and re-diffed afterwards to **zero drift**. No `DROP`, no `ALTER`, no backfill of existing rows, no foreign keys and no column defaults for state — the design rules are stated at the head of the schema block (`prisma/schema.prisma:555`) and repeated in `docs/domain/data-dictionary.md` §6. Persistence is one function pair per store in `src/core/database/repositories/release-critical.repository.ts`; the write path is the journal below, and mode stays `fail_closed` unless `ALLOW_SANDBOX_FALLBACK=true` (`src/core/database/repository-mode.ts:21`).
- [x] Restart-durability test per entity: write → restart process → read back — `tests/unit/durability-release-critical.test.ts` (**16 tests** at this closure; **17** measured 2026-10-09, after TSK-19 added the provider-claim loop) closes every loop through a **second OS process** (`tests/helpers/durable-restart-reader.mjs`), which boots the compiled `dist/src` artifact, hydrates its own read index from Postgres and reports what the database alone told it. An in-process read-back could not detect CA-12 at all, since the Map always returns what it wrote. The child also reports `database: false` when it cannot reach Postgres, and the test fails on that rather than calling an unmeasurable run a pass (Rule 0.4a); without a reachable Postgres the whole suite **skips with a WARN naming what is unverified**.
- [x] No repository silently degrades to memory in production (`ALLOW_SANDBOX_FALLBACK` already refused at boot — verified good, keep) — kept, and now additionally proven at the write layer: a durable write rejected by a **reachable** database throws `RepositoryUnavailableError` (503) and its optimistic read-index entry is rolled back, asserted twice — at the journal level with an injected rejection, and over the real HTTP path where `POST /api/v1/workspace/approvals` with a `1e13` NGN scope returns **503 `REPOSITORY_UNAVAILABLE`** (numeric overflow on `Decimal(14,2)`) and `listAllApprovals()` then contains no such item. An **absent** database still takes the documented sandbox path and is counted as `sandboxDeferred`, never as `persisted`.
- [x] Register text for each closed item updated to name the durable store, not the Map — the table above, plus `docs/domain/systems-of-record.md` §2 (census re-measured: 41 models, 28 with accessors, 24 written at runtime, 13 with none) and §3.1/§3.3, which now move these 14 stores out of the process-memory table; `docs/domain/canonical-model.md` §1/§2/§5 and `docs/domain/data-dictionary.md` §4/§5/§6 carry the same re-measured figures. `tests/unit/systems-of-record.test.ts` and `tests/unit/canonical-model.test.ts` are the instruments that keep them true (**19 tests** across the two files).

**Evidence:** migrations + durability tests + `docs/domain/systems-of-record.md` (TSK-52).

**Closure evidence (measured 2026-10-08, working tree — commit series landed 2026-10-15 as TSK-09):**

- *Mechanism.* The domain mutators stayed synchronous: each one calls `stageDurableWrite` (`src/core/database/durable-journal.ts:62`) against a store registered at module load (`:54`), coalescing repeats by `store:key`, with an explicit rollback closure for the optimistic index entry. The journal is drained at the single async choke point every response passes — `sendJson` (`src/api/router.ts:573`) — and again on `server.stop()` (`src/api/server.ts:422`). Rewriting ~50 synchronous call sites to `async` to thread a transaction through them would have been a larger behavioural change than durability required, so the invariant bought here is "a 2xx response means the row is in Postgres", asserted directly.
- *Boot hydration is dependency-ordered and fails soft.* `src/api/server.ts:326-339` hydrates media assets first (the golden-DAM backfill and the CMS picker read them), then sessions, idempotency, enquiry, approvals, cases, risks/issues, destinations, the CMS revision chain, the sponsorship engine and the deal portfolio; `:374-375` hydrates rights and episode masters before the demo schedule seed. The deterministic seeds then re-run against the hydrated registry (`:344-345`), idempotent by id, so durable rows win and only genuinely missing demo data is added. An unreachable database leaves the stores empty and the surfaces show the honest empty state — never a fabricated record, never a boot that blocks.
- *What the restart tests pin is business behaviour, not plumbing:* an enquiry keeps its `ENQ-YYYYMMDD-XXXX` reference and `RECEIVED` submission status; an approval's NGN scope comes back exact through `Decimal(14,2)` (12345678.91, not a float approximation); a restricted case keeps its audit trail in order (`CASE_OPENED`, `CASE_ASSIGNED`, `TRANSITION_TRIAGED`) and its SLA instant; an issue keeps its `linkedRiskId` verbatim across the no-FK boundary; a destination stays `VERIFIED` with its verifier, and cannot be resurrected as `CANDIDATE`; an 8 GiB master returns with exact `BigInt` bytes; a session row contains **only** the sha-256 digest — the test asserts the raw token is absent from the serialised row; an idempotency replay answers with the recorded outcome *and* response body; the CMS chain comes back with revision 1 still carrying its `approvedAt`/`approvedBy` while revision 2 carries the edit, plus the publication record; a journal entry comes back balanced to the kobo with both lines; a sponsor binding comes back with its `fulfilledPlacements` counter at 2 and its per-airing evidence, including `fulfillmentPercent` and the completion flag.
- *A durable store makes its fixtures someone's responsibility.* Once the risk/issue registers and the approval queue became real tables, two HTTP-level suites stopped being idempotent: `tests/unit/extended-workspaces.test.ts` (SCR-19) minted `RSK-SCR19-1`/`ISSUE-SCR19-1` and `tests/unit/client-portal-and-operations.test.ts` (UX-GOV-002) decided the seeded `APV-2026-004`. The first run wrote those rows to Postgres, boot hydration loaded them back on the second run, and the fixtures collided — `createRisk` raised `[RISK-01]` and the decide endpoint returned **422** instead of 201/200. Both files now own their rows (`deleteMany` before `app.start()`, so hydration cannot see them, and again after the `stop()` flush): **this is fixture hygiene, not a relaxed assertion — every original expectation is unchanged.** Measured with `pnpm test` run twice back-to-back against that now-dirty development database: **64 files / 705 tests passed, 0 failed, 0 skipped, 0 unhandled errors** both times (`RUN1_EXIT=0`, `RUN2_EXIT=0`).
- *Gates on this tree (Rule 0.1, all on the same final tree, 2026-10-08):* `pnpm typecheck` **0** · `pnpm lint` (`--max-warnings 0`) **0** · `pnpm test` **0** (twice, see above) · `pnpm test:coverage` **0** — 64/705 with **78.14 statements / 69.31 branches / 81.69 functions / 79.52 lines** against the pinned floors 73/62/77/72 · `pnpm build` **0**.
- *Stated limits, not gaps hidden by prose.* (1) `JournalEntryRecord` is written and `SevenWayLedgerEngine.hydrate()` (`src/modules/finance/ledger/index.ts:166`) is exercised by the restart test, but **no file in `src/` constructs `LedgerPostingService`** (`src/modules/finance/ledger/posting.ts:42`), so the served process has no ledger to hydrate; `hydrate()` also does **not** rebuild the seven-pillar snapshot, because deriving a pillar from an account code would invent a mapping no authority supplies. (2) Entitlement delivery counters remain process-side — CA-12 named the binding, and the binding plus its fulfilment evidence are what the tables hold. (3) Still `M` after this task, and therefore TSK-20's labelling job: the schedule day (TSK-12's own note), broadcast versions, proof of air, rights review requests, users/credentials/lockout/rate limit, MFA secrets, invitations, admissions, the AFCA catalogue, events, payout batches, bank statements, talent-hub profiles, the queue and AOS agent runs. (4) Every restart measurement requires a reachable Postgres; without one the suite skips and says so. (5) Migrations were applied and drift-checked against the development database; that is **not** the clean-instance verification TSK-06 owns, which remains `[B]`.

#### TSK-18 · P1 · Durable audit ledger atomic with the business write
**Source:** `report.md §3` (chain exists and works) + `audit.md` AUD-05 open half · **Depends:** TSK-17
Verified good, do not rebuild: SHA-256 chain, chain tail persisted/restored through the KV adapter at boot, `/readyz` exposing `auditPersistence`/`auditChainSequence`. Closed here: audit writes now share the consequential business write's Prisma transaction, and `getAuditLogs` reads the durable store.

- [x] Audit entry written in the same Prisma transaction as the business write (or transactional outbox + relay)
- [x] `getAuditLogs` reads the durable store
- [x] `prisma_error` degradation surfaces via `/readyz` **and** an alert rule (the WARN already emits — TSK-44)

**Evidence:** `tests/unit/audit.test.ts` extended with a crash-between-writes scenario.

**Closure evidence (measured 2026-10-12, working tree — commit series landed 2026-10-15 as TSK-09):**

- *Mechanism: a journal **group** per request, and one transaction per group.* TSK-17's write-behind journal drained *whatever was staged when a response happened to be written*, which is not the same thing as "the same transaction". The unit of durability is now the request: `createServer` (`src/api/server.ts:303-306`) runs every request inside `withJournalGroup(nextJournalGroup(), …)`, `stageDurableWrite` stamps each write with the group current in `AsyncLocalStorage` (`src/core/database/durable-journal.ts:113-121`), and `flushDurableJournal()` partitions the batch by group and drains each partition inside **one** `prisma.$transaction` (`:162-196`). Inside that transaction `getPrismaClient()` returns the scoped transaction client (`src/core/database/index.ts:26`, `:36-38`), so all **14** existing persisters plus the new `auditLog` store join it with no call-site changes — which is why ~50 synchronous mutators did not have to become `async`. A request's `sendJson`/`sendText`/`sendHtml` each still perform the drain (`src/api/router.ts:579`, `:638`, `:700`); `sendText`/`sendHtml` are now choke points too, because a group that nothing drains would be stranded by the next request, whose flush only takes its own group plus the server-side backlog. The `finally` backstop at `src/api/server.ts:586-603` drains the group for paths that answer without passing a choke point (the 303 desk redirects) or throw mid-handler, so no group can leak staged rows.
- *Why the foreign key had to go first, measured rather than argued.* Putting the ledger row in the business transaction makes an audit insert **gating**. `AuditLog_userId_fkey` refused any write whose actor had no `User` row — and the dev database said the constraint was already doing damage: **1783 of 1783** durable rows carried `userId = NULL`, because `onDelete: SetNull` erased the actor from rows whose user was later deleted. A column that is NULL for every row is not verifying anything; it was destroying the evidence it claimed to protect, and with the ledger write now gating it would have 503'd every synthetic- or system-actor request (the `x-test-role` identity `test-user-id`, `src/api/router.ts:733`, and actors like `SYSTEM_RELEASE_GATE`). Migration `prisma/migrations/20261012120000_relax_audit_ledger_actor_identity` drops the constraint and adds `tenantId String?` + `@@index([tenantId, createdAt])`; purely additive on the data (no row touched, no column dropped). The cost is stated: actor attribution is now an application-side id reference with **no referential guarantee a `User` row exists**, and `docs/security/route-authorization-coverage.md` §6 records the trade.
- *The read is a durable read.* `getAuditLogs` (`src/core/audit/index.ts:320`) reaches Postgres through `loadAuditLogRows` (`src/core/database/repositories/release-critical.repository.ts:1107`) and rebuilds the domain entry in the audit module, and both call sites await it (`src/api/router.ts:3810` for `GET /api/v1/audit/logs`, `:7351` for the governance register desk). The in-process chain remains only as the labelled fallback — a read that has to take it is announced (`"Audit durable read failed; answering from the in-process chain"`) and `getAuditPersistenceMode()` reports `memory`, because a local chain is sandbox state, not persistence (Rule 0.4a). Proven, not asserted by prose: `tests/unit/audit.test.ts` "lands the business row and its ledger entry in one transaction, and reads the ledger from Postgres" **removes the entry from the writing process's own chain** before reading, so the answer can only have come from the table; and `tests/unit/durability-release-critical.test.ts`'s 201-enquiry case asks a **second OS process** (new `auditLedger` reader, `tests/helpers/durable-restart-reader.mjs:141-163`) for the ledger row the response path drained, so the entry that attests the enquiry is durable across a restart.
- *Crash-between-writes, the scenario the box asks for.* `tests/unit/audit.test.ts` "crash between writes: the ledger entry rolls back with the rows it attests" stages a real business row (through the production `persistIdempotencyRecord` persister, under a test-owned store name), records the ledger entry, stages a **second** business row that also lands, then a write the reachable database rejects. The abort is asserted where it matters: both business rows are absent from Postgres (they were inserted and then rolled back, not skipped), `loadAuditLogRows` and `getAuditLogs` both return **nothing** for the attested action, every optimistic index entry is rolled back, the journal counts the failed writes, `pendingDurableWrites()` is 0, and the caller gets `RepositoryUnavailableError` → 503. Before this task the ledger row had its own transaction, so exactly this sequence left a durable entry attesting an action the database never committed. What is deliberately **not** deleted is the local chain entry: an audit row is append-only, and removing it from a hash chain would break the chain to represent a write that did not happen — the ledger that queries read is the table, and the table never received it.
- *Box 3 has two surfaces now, not one.* `/readyz` publishes `auditDurableFailures` alongside the pre-existing `auditPersistence`/`auditChainSequence`/`auditBufferedEntries` (`src/api/router.ts:3627`, from `getAuditHealth()` at `src/core/audit/index.ts:98`), and the alert path is wired for real: `reportDurableFailure` (`src/core/audit/index.ts:255`) emits the structured WARN **and** calls the degradation listener, `wireAuditDegradationAlerting` (`src/api/server.ts:569`) turns each call into `audit_durable_degraded_total`, and rule 4 (`src/core/observability/index.ts:223-233`) fires `AUDIT_DURABLE_PERSISTENCE_DEGRADED` at CRITICAL through whichever dispatcher the deployment configured (`ConsoleAlertDispatchAdapter`, or `WebhookAlertDispatchAdapter` on `ALERT_WEBHOOK_URL`). Asserted at the rule level in `tests/unit/observability.test.ts` ("alerts when the durable audit ledger degrades, and only on a real degradation" — value 0 must **not** page, the counter must also be scrapeable through `exportPrometheusMetrics`) and at the signal level in the crash case, where the listener is asserted to have been called exactly once and with the aborted entry's own id.
- *The hash covers the scope it stores (TSK-58 box 4).* `buildAuditHashPayload` (`src/core/audit/index.ts:154-165`) joins nine components including `tenantId`, and the exact hashed bytes travel into the durable row as `changesJson.auditHashPayload` (`src/core/database/repositories/release-critical.repository.ts:1065-1071`). That storage is not decoration: a jsonb column does not preserve key order, so re-serialising `changes` cannot reproduce the payload — measured on the same database, only **668 of 1783** pre-existing durable rows could be recomputed from their own columns, and **0 of 1783** had a `createdAt` equal to their own event timestamp (the read now prefers the payload instant, `src/core/audit/index.ts:348-374`). The new test recomputes `sha256(auditHashPayload) === auditEntryHash` from the row alone and pins that `tenantId` and the action instant are components of those bytes.
- *Gates on this tree (Rule 0.1, all on the same final tree, re-measured 2026-10-13):* `docs/audit/evidence/tsk18-durable-audit-transaction-2026-10-12/README.md` + `gate-summary.txt` — `pnpm typecheck` 0, `pnpm lint` 0, `pnpm build` 0, **`pnpm test` 0 with 68 files / 819 tests / 0 skipped**, `pnpm test:coverage` 0 at 78.96 statements / 70.15 branches / 82.95 functions / 80.32 lines against floors of 73 / 62 / 77 / 72 (untouched), plus `focused-gates-db.txt` (7 files / 76 tests: the three doc-guard instruments, the durability suite, `audit`, `audit-remediation-regressions`, `observability`) and `migrate-deploy.txt` / `migrate-deploy-fresh-database-2026-10-13.txt` (12 migrations, the new one applied) / `migrate-diff-drift.txt` (`-- This is an empty migration.`).
- *A citation sweep this change set forced, and what it found (`measurements.txt`).* Edits to `src/api/server.ts`, `prisma/schema.prisma`, `src/core/audit/index.ts` and the durability suite shifted roughly 35 published `file:line` pointers across `docs/domain/systems-of-record.md`, `docs/domain/state-machines.md`, `docs/domain/canonical-model.md`, `docs/handoffs/LATEST.md`, `docs/audit/todo-remediation-evidence.md`, three TSK evidence READMEs and this register. Every one was re-opened and re-pinned to measured truth (Rule 9); four sentences that *exist* to record a past position — `docs/handoffs/LATEST.md:167`, `tasks.md:1090`, `:1477-1478`, `:1676`, `:1691` — were deliberately left quoting the old numbers, and the decision is written down. The three doc-guard suites (28 tests) are what turn that from a promise into a measurement.
- *Two environment facts that decide what a green run means here, both measured (`measurements.txt`).* (1) `pnpm db:seed` and the count-asserting repository suites cannot share a database: with the golden seed loaded, `tests/unit/production-core-and-infrastructure.test.ts:129`/`:164`/`:213` and `tests/unit/todo-final-remediation.test.ts:1829`/`:2207` report the seed's rows (6 VERIFIED talent, 11 ACTIVE campaigns, 52 programmes / 203 episodes in the episode-master index) and the full suite exits 10-red — filed as `full-suite-golden-seeded-dev-db.txt`, not as a TSK-18 regression, because the same tree is 819/819 on a migrated, unseeded database (`vmnl_enterprise_gates`, added additively rather than deleting the seed rows). (2) Sourcing `.env` before `pnpm test` fabricates failures: `.env` sets `NODE_ENV=development`, which survives into the test process and disables the `x-test-role` harness at `src/api/router.ts:730`, turning six authenticated route tests into 401/302 on the first restored-cluster run. `DATABASE_URL=… pnpm test` selects the database without touching `NODE_ENV`, because `dotenv.config()` (`src/core/config/index.ts:5`) is called without `override`. Neither run weakened an assertion (Rule 0.3); the local Postgres had to be rebuilt after the 23:22:24 reboot, and `full-suite-server-down.txt` / `full-suite-wrong-cluster.txt` (794 passed, **25 skipped**, exit 0 both) are kept so the green run is not read as the only run.
- *Stated limits, not gaps hidden by prose.* (1) Atomicity is per **request**: a business write and an audit entry recorded in the same request share a transaction, and nothing claims the same for two requests or for a write staged outside any request (the server-side backlog drains in its own `ungrouped` transaction, deliberately, so a one-time seed failure cannot destroy a healthy request's rows — but that also means a backlog failure during a request's flush can turn that request's response into a 503 after its own group committed). (2) `verifyAuditLogChainIntegrity` still walks the **in-process** chain. A `verifyDurableAuditChain` over the table was considered and rejected: rows from many processes interleave, so a link-by-link walk of the table would report breakage that is not tampering. Cross-process verification of the chain is therefore **not** offered, and the durable rows are individually verifiable instead (the stored payload above). (3) The durable read is a windowed read (`DEFAULT_AUDIT_READ_WINDOW = 1000`, most recent entries, oldest-first), not a full-table answer. (4) `AuditLog` still has no retention job: `pruneAuditLogs` (`src/core/audit/index.ts:451`) keeps **zero** call sites, so this table grows without bound (already recorded as a TSK-19 limit). (5) The FK removal is a one-way door for the rows already written: 1783 durable rows carry `userId = NULL` and no re-link is attempted, because inventing an actor for them would be the fabrication the register forbids. (6) Migration applied and drift-checked against the development database, and against two databases created empty on 2026-10-13 (`migrate-deploy-fresh-database-2026-10-13.txt`: 12 migrations, `All migrations have been successfully applied.`) — still not the clean-instance verification TSK-06 owns, which remains `[B]`.

#### TSK-19 · P1 · Durable webhook event dedup
**Source:** `report.md §3`, `audit.md` AUD-07 partially closed · **Depends:** TSK-17
KV `setIfAbsent` claims are done at the single production ingestion path (7-day TTL) — verified good, kept as the fast mirror. Delivered here: a durable unique provider-event-ID constraint, so replay across a Redis loss + restart cannot double-credit.

- [x] Unique constraint on provider event id; replay rejected transactionally before ingestion
- [x] Replay test spanning a simulated restart boundary

**Evidence:** `prisma/migrations/20261009133000_add_durable_provider_event_claims/` + `20261009153000_add_provider_claim_ingest_phase/`, `tests/unit/durability-release-critical.test.ts`, `tests/unit/audit-remediation-regressions.test.ts`.

**Closure evidence (measured 2026-10-09, working tree — commit series landed 2026-10-15 as TSK-09):**

- *What the constraint replaces.* Dedup used to live only in the KV `setIfAbsent` mirror, whose authority is a Redis that can be flushed; a Redis loss plus a restart turned a re-delivered webhook into a first sighting, i.e. a double credit. `ProviderEventClaim` (`prisma/schema.prisma:862`) puts the decision in the database under `@@unique([provider, eventId])`, and the two production handlers (`src/api/router.ts:7876` Paystack, `:7968` Flutterwave) now claim there before touching the engine.
- *Two-phase, because a one-phase claim would have been a new bug.* Phase one is the single INSERT, which is the whole race resolution — two instances, or one instance either side of a restart, get exactly one winner with no read-then-write window (`claimProviderEvent` `src/core/database/repositories/release-critical.repository.ts:908`, create at `:912`). A loser's retry is then one conditional UPDATE restricted to `ingestedAt: null` (`:917`), which is what makes the refusal safe: an attempt that claimed the event and died **before** reaching the engine is taken over and re-delivered (ingestion is idempotent per transaction id), while an attempt that stamped its ingestion (`markProviderEventIngested` `:931`, called from `src/core/websecurity/index.ts:207` by `confirmProviderEventIngested` at `router.ts:7900` and `:7992`) is a true replay and is refused. `releaseProviderEventClaim` (`:945`, `deleteMany` restricted to `ingestedAt: null`) rolls back a failed attempt so the provider's retry is not refused as a duplicate — it can never "un-ingest" a completed one. The orchestration wrapper is `src/core/websecurity/index.ts` (`claimProviderEventOnce` :157 → durable call :169; `releaseProviderEventClaim` :226 → :232).
- *The restart assertion pins the stamp, not just the row.* `tests/unit/durability-release-critical.test.ts` drives a real signed Paystack webhook through HTTP, reads the row back from Postgres, and then asks a **second OS process** (`tests/helpers/durable-restart-reader.mjs:116`) what the database alone tells it: `replayRefused: true` **and** a parseable `ingestedAt`. The three-way distinction matters — a new process that saw an unstamped claim would take the event over, so proving refusal proves the phase-two stamp survived. The same test then replays in-process and expects the KV mirror's `duplicate: true` marker. `tests/unit/audit-remediation-regressions.test.ts` covers the crash-between-phases case directly: an attempt that claims and never ingests is reprocessed by the retry, not refused.
- *Degrade-noticeably, never silently.* If the durable claim cannot be reached, the handler records `webhook_durable_claim_degraded_total` (`router.ts:7883`, `:7975`) and proceeds on the KV mirror; the metric name is a `layer: "CACHE"` degradation signal, so a Redis-only period is visible rather than claimed as persistence (Rule 0.4a).
- *Gates on this tree (Rule 0.1, all on the same final tree, 2026-10-09):* `pnpm typecheck` **0** · `pnpm lint` (`--max-warnings 0`) **0** · `pnpm test` **0** twice back-to-back against the now-dirty database — **65 files / 742 tests passed, 0 failed, 0 skipped, 0 unhandled errors** both runs · `pnpm test:coverage` **0** — 65/742 with **78.48 statements / 69.86 branches / 82.24 functions / 79.76 lines** against the pinned floors 73/62/77/72 · `pnpm build` **0** · the two TSK-19 suites standalone **29 tests** (17 + 12) · `npx prisma migrate status` → **9 migrations, schema up to date**, `migrate diff --from-config-datasource --to-schema prisma/schema.prisma` → `-- This is an empty migration.` Full artifacts in `docs/audit/evidence/tsk19-durable-provider-claims-2026-10-09/`.
- *Stated limits, not gaps hidden by prose.* (1) The table is **append-only with no retention job**: claims accumulate forever, because no prune task exists for it and the one precedent in the codebase, `pruneAuditLogs` (`src/core/audit/index.ts:451`), has **zero call sites** — so this inherits an unresolved housekeeping gap rather than solving it. (2) The unique constraint covers **one database**; two regions writing to separate schemas would still each accept the same event id. (3) Dedup is per `(provider, eventId)`; a provider that renumbers its event id for the same underlying transaction is a re-delivery this table cannot see — the per-transaction idempotency inside the engine is what actually prevents the double credit. (4) Migrations were applied and drift-checked against the development database, which is **not** the clean-instance verification TSK-06 owns (`[B]`).

#### TSK-20 · P1 · Sandbox-state labelling for everything not made durable in TSK-17 — **CLOSED 2026-10-13**
**Source:** Rule 0.4a, `report.md CA-12` · **Depends:** TSK-17
- [x] Remaining in-memory families explicitly labelled `sandbox-state` in the screen register and readiness matrix — **both halves, as an instrument rather than a list.** `docs/domain/systems-of-record.md` §3.3 is the authority and was extended from 18 to **30** measured families (rows 19-30 added only after proving zero Prisma-model/repository references for each: `# → 0 for all 16` entity types, no `hydrate*` export, each engine constructed with `new` inside `createServer`). The register now publishes `sandboxState` (`authority`/`measuredAt`/`meaning`/`derivation`/30 `families`/`coverage`/`limits`) mirroring §3.3 **row-for-row**, and **30** entries carry `dataState: "sandbox-state"` + `sandboxFamilies`, which expands to **147 of the 226** documented IDs. Labels are *derived*, not asserted: a family is attached to an entry only when the entry's own `evidence` text contains one of that family's anchors, every anchor must resolve to a real file/`file:NN`/symbol, and `computeSandboxCoverage()` (`src/core/config/screen-register.ts`) recomputes every tally. `docs/audit/journey-readiness-matrix.md` is bumped to **R1.1** with a data-state vocabulary (`D2`/`D1`/`sandbox-state`/`BLOCKED`), **16 of its 17** Persistence cells rewritten (only `J-RL1-03`, already an honest `BLOCKED`, was left alone) — including the two that were wrong in the *optimistic* direction (`J-RL1-06` claimed `NOT_APPLICABLE (no canonical writes)` while seven engines accept POSTs into Maps; `J-RL1-08` claimed `VERIFIED` for a reviewed entity that has no table) and the one that was wrong in the *pessimistic* direction (`J-RL1-11` still said `IMPLEMENTED (in-memory)` after TSK-17 made the CMS durable) — plus a 30-row family → journey parity table.
- [x] No handoff sentence implies persistence for a labelled store — swept `docs/handoffs/LATEST.md` (the only handoff file) and corrected eight sentences, each against measured code: SEC-04's "first-use profile persistence" (`firstUseProfiles`, `src/core/auth/sessions.ts:295`), SEC-05's "preferences **persisted**" (`:245`, and the `DEFAULT_PREFS` read at `:261` is what a restart returns you to), SCR-18's "call sheets persist" (`src/modules/hub/onestudios/index.ts:69`) plus a collective note that "rewired" means *the desk reads the engine*, never *the state survives* (`sandbox-state` × 11 families on that line), SCR-19's payout-batch projection (`src/modules/finance/payouts/index.ts:65`, `TalentPayoutBatch` has **0** accessors in `src/`), the rights-review bullet now names its own queue as `sandbox-state (rights-review-requests)` (`src/modules/broadcast/rights/review-request.ts:63`) beside the durable `RightsRecord`, and the two "Known Operating Conditions" bullets that framed process memory as a persistence *mode* are rewritten — sessions are durable-first with Redis as a fast path, and for the §3.3 families the Map is not a fallback from a table but the only copy.
- [x] Seed summaries truthful (`ensureScheduleDemoSeed` in-memory families already honestly labelled — keep) — kept, and the *reasoning* corrected. `seedStatLabel` (`src/db/migrate-and-seed.ts:288`) and its two labels are unchanged because they are right and are pinned by `tests/unit/todo-final-remediation.test.ts:2269-2272`: `schedules` → `IN-MEMORY SCHEDULE AUTHORITY (no Postgres table)` is exactly true (no schedule or version model exists in `prisma/schema.prisma`), and `damAssets` → `DAM REGISTRY (in-memory)` is exactly true *of this CLI*: `registerMediaAsset` stages through `stageDurableWrite` (`src/core/storage/index.ts:328`) and the seed never drains, `flushDurableJournal` runs at boot (`src/api/server.ts:422`). The comment claimed both families "never touch a table", which TSK-17 made false for DAM — rewritten to say why the count still lands in process memory. `ensureScheduleDemoSeed`'s own honesty contract is unchanged and still refuses to seed a channel whose masters carry no registered rights.

**Evidence:** `docs/audit/evidence/tsk20-sandbox-state-labelling-2026-10-13/` — `README.md`, `sandbox-state-inventory.txt` (every figure recomputed by `inventory.mjs` through the module that serves the register), `instrument-runs.txt` (16 tests across the two instruments, plus two mutation runs that fail and revert), `full-suite.txt`, `coverage.txt`. Reproduce the guard: `pnpm vitest run tests/unit/systems-of-record.test.ts tests/unit/screen-register-verification.test.ts`.

- *Gates on this tree (Rule 0.1, same final tree):* `pnpm typecheck` 0 · `pnpm lint` 0 · `pnpm build` 0 · **`pnpm test` 0 with 68 files / 822 tests / 0 skipped** · `pnpm test:coverage` 0 at **78.97 statements / 70.16 branches / 82.97 functions / 80.32 lines** against floors 73 / 62 / 77 / 72, none moved. The 822 is 819 (TSK-18's pin) + 3 tests this task added to `systems-of-record.test.ts` (6 → 9: register parity, label derivation, matrix parity); the register's own document count and the readiness matrix were not re-pinned by editing a gate.
- *What makes this a check rather than prose (Rule 0.2).* Nine tests in one file now fail when the documents and the code diverge, and both new assertions were demonstrated red on purpose: renaming a family id in the matrix's parity table fails `§3.3 families the matrix never names`, and deleting a `sandbox-state` label from a Persistence cell fails `Persistence cells that describe process memory without labelling it`. The label derivation runs in **both** directions, so an *under*-labelled screen is as red as an unsupported label — which is how `UX-BR-012` was found: it was first labelled, then un-labelled after reading `renderBroadcastScheduleReviewHtml` and seeing it render channel/episode-master state plus fixed blocker copy and touch neither Map.
- *A citation sweep this change set forced (Rule 9).* `src/core/config/screen-register.ts` grew the `SandboxStateFamily`/`SandboxCoverage` types and `computeSandboxCoverage`, shifting `computeScreenRegisterCounts` from `:69-82` to **`:112-127`**; `tasks.md:934` is annotated with the new pin and `report.md:102` is left quoting `:69-82` because that line *is* the historical finding. Pins into `src/db/migrate-and-seed.ts` (`:46`, `:68`, `:158`, `:207`, `:215`, `:231`) sit above the comment that was rewritten and were re-opened unchanged; the file's own `seedStatLabel` moved `:279` → **`:288`**, and the one document that pinned it by line number — `docs/handoffs/LATEST.md:153`, the 2026-10-12 "it was `:279`" quote chain — was re-pinned to **`:141`**, the bullet that quote lives in now (measured, not computed: the file shed 12 lines above it when the pin chain was collapsed by handoff-retirement). Pins **into** this register were swept too, and the sweep found far less than this bullet expected: excluding the dated `docs/audit/evidence/*/` artifacts, exactly **3** document-to-`tasks.md` line pointers exist on this tree — `docs/audit/journey-readiness-matrix.md:50` → `tasks.md:829` (TSK-17's `ContentRevision` release-critical row; re-opened, still names that row, and TSK-20's closure bullets at `:895`+ sit below it so nothing moved), and two inside the 2026-10-12 sweep record at `docs/handoffs/LATEST.md:173`. Of those, `tasks.md:510` still resolves (the TSK-10 bullet that declines to tick its §3 line), and `tasks.md:1412` **does not** — line 1412 is now the TSK-11 "13 journey failure drills" bullet, and the `router.ts:6337` refused-pin decision that pointer was meant to reach survives only inside §9.9 at `:1683`. Both are left as written, because the sentence carrying them exists to record what that sweep found; the drift is stated here instead of silently re-pointed. `seedStatLabel` is pinned only by `docs/handoffs/LATEST.md:18`, and that pin already reads `:279` → `:288`. Four live document-to-document pointers *inside* this register did move, because `docs/handoffs/LATEST.md` grew by 28 lines when its pin block was extended: `:544` `LATEST.md:18`→`:211` (the BCST-03 declaration), `:1125` and `:1613` `:189`→`:216` (the `LedgerPostingService` bullet), `:1612` `:18`→`:215` (BCST-06 software scope), `:1408` `:71`→`:275` (the WCAG manual-coverage downgrade). Two more were already stale before this closure and are corrected with that stated: §9.9's own citation of the systems-of-record instrument, `:136` → **`:168-184`** (TSK-20's two added top-of-file constants explain 2 of those 32 lines, so the 2026-10-12 sweep published a pin ~30 lines adrift), and the 2026-10-12 record at `docs/handoffs/LATEST.md:173` still names `tasks.md:1533` for the §3 exit-gate header, which is `:1548` today — `tasks.md:510` itself already points there correctly, so the stale number is inside a sentence whose job is to record that earlier sweep, and it is annotated rather than rewritten. **This bullet is itself a Rule 0.2 correction:** it was first written naming nine `tasks.md` pins across four documents as re-pinned by this closure; those files (`docs/audit/state-transitions.md`, `docs/audit/pending-questions.md` — citation:absent) are not in this repository and the edits were never on the tree. Re-running the sweep against the actual files replaced the claim with the measured counts above. Recorded because a register whose only guard is prose cannot catch a confident wrong sentence, and 0.2 is not selective. `docs/audit/evidence-register.md` gained pin VMNL-EV-PIN-2026-10-13 (§1), row `EVD-25-DATASTATE` (§2) and the correction of a §2 row that still claimed "no `tests/unit/durability-*.test.ts` exists" — false since TSK-17 and contradicted by that document's own §1; its four dangling `§1a` cross-references now point at §1, the only section they can have meant. Re-counted on this tree: **52** fully-qualified + **19** bare `router.ts` pins across `tasks.md`, `docs/handoffs/LATEST.md` and the three domain documents, against the **39** + **13** §9.9 recorded on 2026-10-12 — the same pass re-measured, not a list that grew. `measure-pin-integrity.mjs` re-run: **45 mapped pins, 0 mismatched, exit 0**.
- *Stated limits, not gaps hidden by prose.* (1) **Four §3.3 families have no register screen whose evidence names them** — `proof-of-air-registry`, `bank-reconciliation`, `broadcast-traffic`, `playout-cache` — because those stores are reached through engines, fixtures and the ledger rather than a documented surface; recorded in `sandboxState.limits` and in the inventory, not hidden. (2) **Five §3.3 families have no journey row** in the readiness matrix (`queue-jobs`, `aos-agent-runs`, `headspace-library`, `cr8tech-jobs`, `source-mappings`); promoting them to journeys is a `DEC-RL1-SCOPE-001`-class scope decision, so they are named rather than invented into rows. (3) Labelling is not durability: nothing in this task moves an entity from `M` to a table, which stays TSK-17's unfinished half, and the migrations that would carry it are TSK-06's `[B]`. (4) `source-mappings` is the weakest row in §3.3 — its own recovery path says "it is configuration", so its label means *not hot-reloadable*, not *user data at risk*. (5) Two screens were deliberately **not** labelled (`UX-BR-012`, `UX-SYS-013`) with the reasoning written into `sandboxState.limits`; a future reader cannot tell from the JSON alone whether that was judgement or omission, so both reasons are in the file. (6) The matrix's Gate column is unchanged for all 15 rows — this task made the documents say less, not more.

#### TSK-21 · P2 · Implement or supersede the §39 canonical event catalogue
**Source:** `report.md CA-13` · **Depends:** TSK-17
`grep` for documented `broadcast.*` event names across `src` returns 0 matches. ADR-006 and PRD §39 describe an event-driven architecture; what exists is `src/core/queue` with 4 registered handlers. **The documented domain model and the code's domain model are different systems.**

- [x] Either the catalogue is implemented (event names as emitted by the queue) or ADR-006/§39 are superseded by recorded decision — **closed 2026-10-14 on the first branch, as the box words it: the catalogue is implemented as *the event names as emitted by the queue*.** `docs/events/catalogue.md` derives every claim from the code: the `JobType` union (`src/core/queue/index.ts:16-19`, **4** types), the **4** handler registrations (`src/api/server.ts:192`, `:210`, `:218`, `:228`), the producer census — `EPG_GENERATION` **2** (`src/api/server.ts:394` boot, `src/core/queue/index.ts:306` via `configureRollingEpgScheduler`, 24 h, wired at `src/api/server.ts:392`), `NOTIFICATION_DELIVERY` **1** (`src/web/public/hub.ts:209`), and **`WEBHOOK_DISPATCH` and `RECONCILIATION_RUN` have zero producers in `src/`**: registered handlers that nothing enqueues, one of which returns `{dispatched: true}` without touching the network. §39's **16** candidates are each assessed and all sixteen are `NOT_EMITTED` — the CA-13 grep still returns zero, and the three look-alike strings that do exist in code (`broadcast.schedule_state` at `src/core/config/source-mappings.ts:68`, `broadcast.epg.push_attempted` at `src/api/router.ts:5941`, `broadcast.version.rfa` at `:7467`) are a provenance field id and two audit action labels, not events, and are named so nobody reads them as evidence of implementation. ADR-006 is recorded as **not implemented in RL1**, with the divergence stated in the document itself: no Redis Streams/BullMQ, the envelope has no idempotency key or provenance field, and the jobs `Map` is in-process, TTL-pruned and restart-lossy (rule 0.4a — sandbox state is not persistence). **What is deliberately *not* claimed:** that superseding ADR-006 is an engineering decision. It carries an `Approver: EAB` line, so the catalogue describes the gap and leaves the supersede-or-build choice where the register already puts it — with the owner. TSK-21's boxes were about the catalogue; the queue's durability is ADR-006's own unfinished business and is tracked by TSK-17/TSK-57, not silently inherited here.
- [x] `docs/events/` created with the real catalogue (CCPP §3, TSK-51) — **`docs/events/catalogue.md`** (5 sections: substrate vs ADR-006, the four job types with handler/producer citations, the outbound federation events, §39's sixteen assessed, and what the document does not claim). Guarded by `tests/unit/event-catalogue.test.ts` (**5 tests**), which re-derives the union from `src/core/queue/index.ts` rather than trusting this register, checks that each documented handler citation still points at the line that registers that type, pins the producer census in **both directions** (a type cannot gain an `enqueue`/`scheduleRecurring` site without the catalogue changing, and a handler cannot be deleted to tidy the census), reads the sixteen names out of the PRD itself and fails if §39 changes shape, scans all of `src/` for any candidate emission, and fails if `bridge.ts` stops assuming delivery while the §3 warning row is still in the document — the same "pay the debt then delete the claim" ratchet used by `tests/unit/performance-budget-measurement.test.ts`.

**Evidence:** `docs/events/catalogue.md` + `tests/unit/event-catalogue.test.ts`; reproduction `CI=1 NODE_ENV=test pnpm vitest run tests/unit/event-catalogue.test.ts`. **One new defect recorded, not fixed:** `src/modules/federation/azeebo/bridge.ts:134` — `const success = mockTransport ? mockTransport(webhook) : true;` means a caller that injects no transport gets `200 {status: "DELIVERED"}` for an event that never left the process. No endpoint was invented and no delivery was claimed; the row is quoted verbatim in §3 and pinned by the fifth test. Owner task: the federation/production-wiring track (TSK-35's registry, TSK-36, TSK-57). **Decision recorded 2026-10-15, and deliberately no new register item** (Rule 2: it already has both a source — ADR-008's Level 4 decision record and `docs/security/threat-model.md:260` `TM-FED-02` — and an owner track, and `tests/unit/event-catalogue.test.ts:139` keeps the defect visible in the document while it is present in the code). The fail-closed variant was assessed and **not taken unilaterally**: refusing at `src/modules/federation/azeebo/bridge.ts:134` when no transport is injected is a few lines, but no transport is configurable anywhere in production today (`src/api/server.ts:147` constructs the bridge with the secret only; the transport is a per-call parameter the route never passes), so `src/api/router.ts:6958` would answer **503 on every request in this deployment** and `tests/integration/enterprise-end-to-end.test.ts:711`, which today certifies 200 + `DELIVERED`, would have to be rewritten to certify the opposite. Whether the demo path keeps reporting success or the route goes honestly dark is the owner's call, and it is the same call as supplying the endpoint — inventing one is refused. The defect stays recorded at `docs/events/catalogue.md:56` and in `TM-FED-02` until that call is made.

#### TSK-22 · P2 · Keyset/N+1 verification at volume
**Source:** `report.md §6`, `audit.md` AUD-15 · **Depends:** TSK-06 (closed 2026-10-15)
Bounded-concurrency fan-out (8 in flight) is done. Composite indexes eliminate per-page Sort on episodes, reducing refresh from 74–107 s to 7.2–9.0 s at scale 100 (15k programmes). Batching deferred as beyond scope per Rule 0.5.

- [x] `refreshEpisodeMasterIndex` (`src/modules/broadcast/episode-masters.ts:165-206`) EXPLAINed with representative data — composite `@@index([programmeCode, episodeCode])` enables Index Only Scan with no Sort and zero heap fetches; `Programme_channelCode_code_idx` added but Postgres prefers `Programme_code_key` for empty-cursor queries due to ORDER BY mismatch. Evidence: `docs/audit/evidence/tsk22-keyset-volume-2026-10-13/stdout-after-scale100.txt`, `README.md`.
- [x] Latency baseline recorded under `docs/audit/evidence/` — measurements show 10× speedup (74–107 s → 7.2–9.0 s), round-trips unchanged at 30,153; candidate batch query would reduce to 1,353 at 25 programmes per batch but is not implemented. Evidence: `docs/audit/evidence/tsk22-keyset-volume-2026-10-13/measurements-{before,after}-scale100.json`, `stdout-before-batchprobe.txt`, `README.md`.

---

### TRACK D — Surfaces, desks & provenance (P1)

#### TSK-23 · P1 · Produce an authoritative engine-backed desk count
**Source:** `report.md CA-10` · **Depends:** TSK-01
`src/web/workspace/surface-bc.ts` registers exactly 48 `ENTERPRISE_WORKSPACES` — the count is real. But `renderWorkspaceDeskHtml` (`:671+`) is a presentation shell with static metadata, a frozen date string ("2026-09-28") and an unconditional "Synchronized" badge. Two independent sweeps counted engine-backed desks at 10 and 15 of 48 (recurring set: accelerator, guilds, events, tend, vcf, one, headspace, cr8tech, aos, vtm, content, approvals, cases, work, governance).

- [x] Definitive count established by inspection, not by two divergent sweeps — **measured 2026-10-07** by `tests/unit/desk-census.test.ts`: the router is booted on an ephemeral port and every registered key is requested for real (`GET /workspace/{key}` as SuperAdmin, anonymously, and as PlayoutOperator). A response is a shell iff it carries the panel only `renderWorkspaceDeskHtml` emits — behavioural classification, no reading-and-guessing. Output: `registered: 48 · presentation shell: 47 · dedicated handler answered: 1`
- [x] Register states plainly: **48 = registered desk routes, 1 = engine-backed** (`afca`). The divergent 10 and 15 counted desks whose *domain* has engine-backed surfaces elsewhere; neither is a desk route that renders engine state. `ENGINE_BACKED_DESK_KEYS` (`src/web/workspace/surface-bc.ts`) is the single source of the figure and the census test asserts it equals what the router actually served, so it cannot drift silently. Full table: `docs/audit/desk-census.md`
- [x] Frozen date and unconditional "Synchronized" badge removed — a shell must not assert currency it cannot know. Also removed with the same reasoning (each was a claim the shell cannot verify): `Mode: LIVE OPERATING`, `Online & Gated` + "Audit trail logging active with SHA-256 HMAC…", the per-workflow `Ready` badges, and the directory's `48 of 48 Desks Operational` / `100% RBAC / ABAC Protected`. Replacements state the wiring honestly (`Presentation shell — no bound operational feed`, `Not bound`, `1 of 48 desks bound to engine state`). Pinned by two tests, so re-adding any claim turns the suite red
- [x] Remaining desks either implemented or listed with owner + target (do not fake wiring) — `docs/audit/desk-census.md §6` lists all **47** unbound desks grouped, each with the register task that would bind its domain and its precondition (`TSK-17` in every case). **Owner: unassigned — nomination required**; this record does not invent one, and the nomination is the same class of human decision as `HD-01`'s per-allocation owners.

**Evidence:** desk census table in `docs/audit/` + register update — `docs/audit/desk-census.md` (method, 48-row measured table, claim-removal table, unbound-desk targets, security reading). Reproduce: `pnpm vitest run tests/unit/desk-census.test.ts` (prints the table to stdout).

Residual carried forward: privilege scoping. Measured in the same run — **47 of 48** desk pages answer `200` for a PlayoutOperator, `1` (`executive`) answers `403`; **0** are anonymous-readable (all `302`). So this is a scoping gap, not an exposure gap. Deciding which desks are public / staff-only / role-scoped remains a business decision (`HD`-class), now made against a measured table rather than an assumption.

#### TSK-24 · P1 · Make the screen register a verification instrument *(CA-11)*
**Source:** `report.md CA-11` · **Depends:** TSK-08
`computeScreenRegisterCounts` (`src/core/config/screen-register.ts:69-82` — **re-pinned 2026-10-13**, TSK-20's `sandboxState` types moved it to `:112-127`, Rule 9) only tallies JSON objects. 23 of 60 entries collapse an ID range into one tally; `"UX-PUB-001..028"` counts 28 documented screens as 1; `"SCR-BCST-01...33"` counts 33 as 1. It checks no evidence path, no route mount, no data source.
Fair record: **all 60 cited evidence paths do exist**, and spot-checked IDs are genuinely present in the cited files (`UX-BR-012` in `governance-and-operations.ts`, `UX-COM-010` in `client-portal.ts`). The register is not fabricated — it is simply not verification.

- [x] Ranges expanded to discrete per-ID entries — `expandScreenRegister` (`src/core/config/screen-register.ts`) resolves `PREFIX-0nn..0mm` into the IDs it stands for; measured **60 entries → 226 documented IDs** (`computeDocumentedIdCounts`), pinned in `tests/unit/screen-register-verification.test.ts` together with `UX-PUB-001..028` → 28 IDs and the negative (`UX-PUB-029` absent).
- [x] For each ID: assert the route is mounted and the evidence file exists — the router's dispatch surface is now **229 literal paths + 52 prefix branches** (the "232 + 35" figure in this task's own text was a hand count and is corrected). Measured: **0 entries declare an unmounted route, 0 IMPLEMENTED entries declare no route, 0 broken evidence citations**. Evidence resolution accepts repo-relative paths *and* bare filenames resolved against an index of `src/ docs/ prisma/ tests/ scripts/`, so `destinations.ts routing rules` is checkable, not decorative.
- [x] For each ID: assert provenance class — measured **75 DOMAIN_ENGINE / 4 NOT_CONNECTED / 147 NOT_VERIFIED**, plus 0 PROVISIONAL and 0 MOCK by this reading. Classification is positive-evidence only: a marker in the served page (`SOURCE:`, `>PROVISIONAL<`, `>NOT CONNECTED<`, `vmn-provenance-banner`, the TSK-23 shell label), else domain state read by the handler that serves the path, else **NOT_VERIFIED**. An earlier draft counted "200 with no demonstration banner" as engine-backed and reported 175 — that upgrade was withdrawn under Rule 0.4; closing the 147 means shipping provenance into the pages (TSK-11/TSK-17), not editing a classifier.
- [x] Recomputed counts re-pinned; "225 system screens" corrected **everywhere it appears** — the "≈166 reachable HTML surfaces" estimate in this task's own text is also withdrawn, replaced by two measured figures: **40** register-declared paths answered `200 text/html` to a SuperAdmin session, and **111** of the router's 229 literal paths serve HTML repository-wide (a floor: parameterised literals are not probeable without an entity). Updated at `docs/audit/evidence-register.md`, `docs/handoffs/LATEST.md` (corrections list + Round 4 historical line + Round 5 status), `docs/decisions/DEC-RL1-SCOPE-001.md`.
- [x] `docs/decisions/DEC-RL1-SCOPE-001.md:16` and `docs/audit/evidence-register.md:31` reconciled — the decision record still repudiates "225/225 operational" and now states what replaced it, without signing anything (`PENDING_SIGNATURE` unchanged; this task manufactures no approval).

**Evidence:** `docs/audit/screen-register-verification.md` (method, measured table for all 60 entries, residuals) + `tests/unit/screen-register-verification.test.ts` (7/7). Register bumped to **R1.2** with `summary.documentedIds` asserted against the expansion.

**Defect found and fixed while building the instrument (not in the original scope):** the AUD-32 `/workspace/` catch-all sat ahead of every specific GET handler and answered 404 for `/workspace/my-work`, `/workspace/search`, `/workspace/notifications`, `/workspace/governance/records`, `/workspace/cases/privacy` and `/workspace/cases/security` — six documented IMPLEMENTED surfaces were dead code behind it. Moved to the end of the dispatch chain (`src/api/router.ts`); all six answer 200 HTML, an unregistered desk path is still a truthful 404, and the behaviour is pinned by a test. Full gate on this tree: `pnpm build` 0 · `pnpm lint` 0 · `NODE_ENV=test pnpm test` **55 files / 617 tests**.

**Fair record, corrected:** this task's opening line claimed all 60 cited evidence paths exist. Measured against *path-shaped* citations, **13 entries named no file at all** (engines cited by prose: `AfroFusionCommunityHub`, `TendDistributionEngine`, "rendered by router"). They are not fabricated — every bare filename they used resolves — but nothing in them was machine-checkable. Twelve were given their handler/engine path (`src/modules/hub/*/index.ts`, `src/modules/intelligence/*/index.ts`, `src/web/workspace/counterparty-portals.ts`, `src/api/router.ts`, `src/web/workspace/surface-bc.ts`), each verified by grep to contain the symbol its prose names. `UX-VTM-010` cites `knownConflicts[0]` and is exempt as an ALIAS.

**Residual, recorded not fixed:** route ranges still collapse in the register's `route` field (33 broadcast IDs share one entry), and per-ID names cannot be expanded without `VMNL-AZP-VMN-UIUX-001`, which is absent from `docs/authorities/` — that is **TSK-39**, not this task. Three counterparty portals answer **503** to an authorised operator; whether that is fail-closed provisioning or a broken surface is not settled here, so they are NOT_VERIFIED rather than assumed working.

#### TSK-25 · P2 · Verify broadcast screens render 0% engine data claim before/after TSK-11 — **CLOSED 2026-10-11**
**Source:** `report.md §6` (UNCONFIRMED item) · **Depends:** TSK-11
- [x] Confirm whether the 6 bespoke panels bypass `renderMockDataBanner` (`src/web/broadcast/index.ts:846`) — establish the real coverage figure rather than repeating the unsubstantiated "3 of 33" — **answered by rendering, not by reading: `tests/unit/broadcast-provenance-coverage.test.ts` (5 tests) walks `BROADCAST_SCREEN_INVENTORY` and serves every screen through `renderBroadcastScreenHtml` for a role its own authorization rule admits.**

**Measured census (2026-10-11, this tree):**

| Figure | Value | How |
|:---|:---|:|
| Registered broadcast screens | **33** | `BROADCAST_SCREEN_INVENTORY.length` |
| Screens serving `vmn-provenance-banner` | **33 / 33** | marker counted in the returned bytes, `default` + `empty` + `error` + `loading` |
| Bespoke domain panels | **6** — `SCR-BCST-12` `src/web/broadcast/index.ts:524`, `-23` `:578`, `-22` `:613`, `-24` `:689`, `-14` `:716`, `-31` `:752` (re-pinned after TSK-11 moved them; they were `:449`/`:539`/`:593`/`:680`/`:761`/`:816` at the first measurement) | branches extracted from the dispatcher, so a seventh is measured not missed |
| Do the bespoke panels bypass the banner? | **No** — they substitute only `panelContent`; the banner is in the outer template | the audit's open question, closed |
| Screens served with an engine-sourced `DOMAIN_ENGINE` KPI strip | **0 / 33** *at this measurement* | `vmn-kpi-strip` absent from every render; `getScreenData` / `renderScreenKpis` had **0** production call sites — TSK-11 later put them on the render path, see the re-measured rows below |
| Screens taking the invented `SLA Compliance 100%` fallback (was `:918-922`) | **0** even before the rewiring — every registered screen declared its own entry | table parsed from the renderer and diffed against the inventory |
| *Re-measured after TSK-11 wired the same renderer:* provenance-badged KPI strips | **33 / 33** (was 0 — the layer had no production caller) | `vmn-kpi-strip` counted in the same 33 renders |
| *Re-measured after TSK-11:* screens still carrying a `NOT_CONNECTED` / `PROVISIONAL` badge | **33 / 33** | the figure that keeps the register entry at `MOCK` (TSK-11 box 6) |
| `kpis:` literals left in the renderer | **0** | `grep -E "^\\s*kpis: \\[" src/web/broadcast/index.ts` |
| Anonymous request | **403 render, no banner, no KPI block** | the label never substitutes for authorization |

**What this changes about the claim.** `report.md:303` was right to refuse "3 of 33", and the corrected
figure is more damning than either side of the argument: the demonstration *label* is on every screen,
so nothing here is dishonest-by-stealth, and the *engine data* is on none of them, so
`report.md:90`'s "**0 of 33** screens show engine data" is confirmed — with its mechanism now named (and that mechanism is what TSK-11 closed the same day: **33/33** screens now serve the provenance-badged strip and **0** carry a fabricated `kpis` literal, while **33/33** still show at least one `NOT_CONNECTED`/`PROVISIONAL` badge, so no screen is fully engine-sourced yet)
(the honest provenance layer exists, is tested, and is unreachable from any served page). That is why
`TODO-BCST-01` stays reopened under TSK-11 and why TSK-11's remaining boxes are wiring work, not
labelling work.
**Also corrected:** `docs/audit/todo-remediation-evidence.md:95` credits "BCST-01 provenance |
`renderMockDataBanner` on all 33 screens; `getScreenData` provenance service" — the first half is now
verified true, the second half never states that the service has no production caller, so the row
carries that qualifier. §10's UNCONFIRMED row is struck with these figures.
**Evidence:** `tests/unit/broadcast-provenance-coverage.test.ts` (5 → **7** tests with the false-currency guards), printed census
`[TSK-25] screens 33 · banner 33 · without 0 · bespoke panels 6 · invented-KPI fallback 0`. Gates on one tree 2026-10-11:
`pnpm typecheck` 0 · `pnpm lint` 0 · `pnpm test` 0 — **67 files / 772 tests**, 0 failed, 0 skipped · `pnpm test:coverage` 0 —
**78.65 / 70.11 / 82.38 / 79.94** against floors 73/62/77/72 · `pnpm build` 0. Artifacts (including the
contended first coverage attempt, kept per Rule 0.4a): `docs/audit/evidence/tsk25-provenance-census-and-false-currency-2026-10-11/`.
`[TSK-25] screens 33 · banner 33 · without 0 · bespoke panels 6 · invented-KPI fallback 0`.
**Found by this census and fixed the same day (2026-10-11).** The inventory pages asserted the
opposite of what the census measures: `src/web/public/screens-view.ts` rendered a
`33 of 33 Screens Ready` badge, a `PRD R1.2A (§46) Verified` badge on every screen spec, and a
four-badge `Audit & Quality Gate Clearance` block claiming the surface is "registered in the VMNL release gate registry (Gate 0, Gate 1, Gate 2, Gate 3) and validated
under tri-party sign-off protocols (CEO, COO, StarTimes Lead)" — while
`docs/audit/design-gate-closure-records.md:14` records **DG-RL1-06 as OPEN** (owner Broadcast
Director, expiry 2026-10-31) with no sign-off recorded, and the same file printed the
**withdrawn** S2 tier as a live operating stat. Three tests were enforcing those strings
(`tests/unit/public-surfaces.test.ts:282`, `tests/integration/enterprise-end-to-end.test.ts:162`,
`tests/a11y/visual-regression-baseline.test.ts:117`). They now assert the honest status and assert
the fabricated labels are **absent** — the assertions were not weakened, they were moved to the
corrected contract — and `tests/unit/broadcast-provenance-coverage.test.ts` (5 → **7** tests)
fails if any of those labels returns.
**Limit:** the census measures the *registered* inventory through the shared renderer; a screen reached
only by a bespoke HTML route (not via `renderBroadcastScreenHtml`) is outside it, and TSK-24's
mount/provenance census is the instrument for that set.

#### TSK-26 · P1 · Complete route/feature parity for the 403 render path
**Source:** `report.md CA-17` context · **Depends:** TSK-01
`WORKSPACE_HTML_GUARDS` enforcement on `GET /workspace*` exists (SEC-06) but its suite cannot load.

**Measured 2026-10-07:** the suite loads and the 403 path renders. The previous test only accepted `[302, 401, 403]` as a disjunction over a hand-picked path list — a silent degradation of the sign-in redirect into a bare 403 would have passed it.
- [x] Re-verify anonymous redirect + 403 render after Track A — `tests/security/route-authorization.test.ts:186-230` now iterates `WORKSPACE_HTML_GUARDS` itself and asserts each branch separately: anonymous → `302` **with `Location: /sign-in?returnUrl={path}` preserved exactly**; a role outside that prefix's `roles` → `403` carrying forbidden markup; SuperAdmin → neither. All **5** prefixes pass, including the `/admin` alias exercised through `/admin/feature-flags` (`ADMIN_ALIASES`, `src/api/router.ts:1207`, canonicalises it onto `/workspace/admin/…` before the table is consulted, so the alias is not a way around the guard). Suite: 13/13 green.

Residual, recorded not fixed: the table lists **5** prefixes while `renderWorkspaceDeskHtml` serves many more desks, and the predicate is `method === "GET"` on a *listed* prefix, so an unlisted desk is authentication-optional by construction. **Measured 2026-10-07** by `tests/unit/desk-census.test.ts` (`docs/audit/desk-census.md §7`): of the 48 registered desk routes, **0** are anonymous-readable (every one answers `302 /sign-in?returnUrl=…`), exactly **1** (`executive`) is role-scoped (`403` for a PlayoutOperator) and the remaining **47** open to any authenticated operator — so the exposure is privilege scoping, not anonymity. Classifying each desk (public / staff-only / role-scoped) is a business decision and is folded into **TSK-23**, the authoritative desk census.

#### TSK-60 · P1 · The client portal's delivery half has no canonical join, and its money half is not durable *(new finding, 2026-10-09)*
**Source:** raised by TSK-13's closure measurement; no inherited `TODO-*` identifier, therefore **no §1.4 census row** (same convention as TSK-58/TSK-59 — `tests/unit/register-inheritance.test.ts` pins that census at 71 rows / 72 IDs and must not be padded for this).
TSK-13 deleted `MOCK_CLIENT_PROJECTS` and bound the portal's identity/money half to `QuoteToCashSalesEngine`. Two halves remain genuinely unanswerable, and the screen now says so instead of the register pretending otherwise:
- **No deliverable↔deal join.** `CommercialSpot` identifies its client only as free text (`src/modules/broadcast/traffic/index.ts:19` `clientName`), and `CommercialCampaign` likewise (`prisma/schema.prisma:492` `clientName String`, no `organisationId`, no `salesDealId` — the model spans `:483-498` with no FK). `ProofOfAirCertificate.clientName` (`src/modules/broadcast/asrun/index.ts:50`) is free text too. The one repository that could carry campaign identity, `CampaignRepository` (`src/core/database/repositories/campaign.repository.ts:25`), is constructed **only** by `tests/unit/production-core-and-infrastructure.test.ts:143` — no `src/` call site — the same unwired-repository defect TSK-59 records for `InvoiceRepository`. So nothing in the booked-inventory or as-run path carries a `clientOrgId`/deal reference that could be scoped to the counterparty making the request, so the portal's per-deliverable table and per-airing certificate list render **NOT CONNECTED**. Joining them by name matching would invent an identity mapping on a legal-evidence surface.
- **No durability** *(closed by box 3, 2026-10-11)*. `QuoteToCashSalesEngine` kept deals in a process `Map` and no `salesDeal` store was registered with `registerDurableStore` (measured then: 13 registration call sites in `src/`, none for sales). The `Project` model (`prisma/schema.prisma:226`) still has zero `prisma.project` accessors in runtime code.
- [ ] A canonical join exists and is written by the booking path — an additive migration putting `organisationId` (and/or a nullable `salesDealId`) on `CommercialCampaign`, plus a production write path that populates it when a deal books inventory (`CampaignRepository` wired into the traffic/campaign flow rather than test-only, or deleted per Rule 0.5), with the free-text `clientName` retained only as a display label — and a **route-level** test then asserts the portal's deliverable table renders real rows for that deal's organisation (not for a name match)
- [ ] Per-airing proof is scoped by that same key: `ProofOfAirCertificate` reaches the portal through the campaign/organisation FK rather than `clientName`, or the counterparty-proof requirement is declared out of RL1 scope under `HD`-class with a dated owner — **one or the other, not both left implied** (mirrors TSK-59's box 1 form)
- [x] `salesDeal` gains a durable store (`registerDurableStore` + boot hydration + a restart-boundary test in the `tests/helpers/durable-restart-reader.mjs` style) so the portfolio survives a process restart; the portal's `SOURCE:` line then names the durable store instead of the in-memory engine. This is the sales-pipeline entry of `docs/domain/systems-of-record.md` §3.3's `M` list — **closed 2026-10-11**; the entity moved to §3.1 as **D2** and §3.3 no longer lists it
- *Box 3 — delivered (2026-10-11).* Model `SalesDealRecord` (`prisma/schema.prisma:888`): 18 fields, the five money counters `totalContractValueNgn`/`depositAmountNgn`/`invoicedAmountNgn`/`cashCollectedAmountNgn`/`recognizedRevenueNgn` all `Decimal(14,2)` and all `Ngn`-named, `id String @id` = the minted `SD-*` deal id, indexed `[clientOrgId, stage]` + `[updatedAt]`. Additive migration `prisma/migrations/20261011220000_add_durable_sales_deal_portfolio/migration.sql`, applied with `prisma migrate deploy` (exit **0**, "11 migrations found"), never edited in place. Repository pair `persistSalesDeal` (`src/core/database/repositories/release-critical.repository.ts:968`, upsert by deal id) / `loadSalesDeals` (`:994`, `orderBy: { createdAt: "asc" }`, `Number(row.<Decimal>)` on read). **NULLs hydrate as absent fields**, so a restarted process cannot manufacture a `financeApproverId`, an approval timestamp or a `proofDocumentUrl` the deal never had — the register's "this record does not manufacture missing business approval" rule, asserted as a test rather than promised. Wiring: `registerDurableStore<SalesDeal>("salesDeal", persistSalesDeal)` (`src/modules/finance/sales/index.ts:28`) — `registerDurableStore<…>(` call sites across `src/` now **14**, the 13 above plus sales — and all **7** Quote-to-Cash mutators (`createDeal:94`, `advanceStage:125`, `signContract:151`, `recordDeposit:168`, `generateInvoice:189`, `recordCashPayment:215`, `recognizeRevenue:263`) stage through one `stageDeal` helper (`:105`) whose rollback (`:110-116`) restores the pre-call field values for a mutation and deletes the index entry for a create, so a row Postgres rejects never stays projected. Boot hydration `hydrateSalesEngine(salesEngine)` at `src/api/server.ts:339` fills the *same instance* the routes mutate (`:169`, exposed as `context.salesEngine`), so hydration is not a second copy. Restart boundary: `tests/unit/durability-release-critical.test.ts:529` "persists a signed deal through cash and recognition with every money counter exact" and `:578` "does not invent an approval stamp or proof document a deal never had" — each drains the journal, then spawns `node tests/helpers/durable-restart-reader.mjs salesDeal <id>` (branch `:91`) as a **fresh OS process** against compiled `dist/src`, asserts `database: true` and reads the record back through the engine's own `hydrate()`; the first test pins 7,500,000.50 contract / 2,500,000.25 deposit / 5,000,000.25 invoice / 5,000,000.00 cash / 0.25 recognized **to the kobo** (values chosen as multiples of 0.25 so no assertion relies on float tolerance), stage `REVENUE_RECOGNIZED`, `createdAt`/`clientOrgId`/`dealName`/`proofDocumentUrl` exact, and law 7's cap `recognizedRevenueNgn ≤ totalContractValueNgn`. The suite's journal census rose to `persisted ≥ 14` with `failed = 0` and `sandboxDeferred = 0` — i.e. every staged deal write was reported persisted, none deferred. Portal provenance now names the store, not the engine: `src/web/portal/client-portal.ts:106` (list) and `:245` (detail). Documents re-pinned to the measured tree: `docs/domain/systems-of-record.md` §2 census row 26 + the new §3.1 row (and §3.3's `M` entry deleted), `docs/domain/canonical-model.md` §1/§2/§3/§5, `docs/domain/data-dictionary.md` §4/§6/§8 — all re-verified by `tests/unit/systems-of-record.test.ts` and `tests/unit/canonical-model.test.ts`, which recompute the census and open every citation. **Not claimed:** that the delivery half is bound (boxes 1–2 stay open), that a deal's per-airing certificate exists, or that any of this is durable in an environment where the database is unreachable — with no database the journal defers and the surfaces say so. **Gates re-run on the finished tree (2026-10-12, serial, every output to a file, nothing piped through `tail`):** `pnpm typecheck` exit **0**, `pnpm lint` (`--max-warnings 0`) **0**, `pnpm build` **0**, `prisma migrate status` **0** ("11 migrations found / Database schema is up to date!"), `pnpm test` **0** — **67 files / 800 tests passed, 0 failed, 0 skipped**, 354.91 s — and `pnpm test:coverage` **0** (All files **78.96** stmts / **70.36** branches / **82.84** funcs / **80.26** lines against floors 73/62/77/72; no floor was moved to achieve this). The focused five — durability, client-portal, enterprise e2e and the two doc guards — pass together: 104 tests, 8.95 s (`focused-run.txt`). *Reported, not smoothed:* two earlier full-suite runs on this same tree each lost exactly one test to `Error: Test timed out in 60000ms` (`full-suite-contended-1.txt` rights-clearance-e2e, `full-suite-contended-2.txt` enterprise-end-to-end); both files pass in isolation (`rights-clearance-isolated.txt`: 8 tests, 1.39 s, run alone 2026-10-12; `focused-run.txt`: enterprise-end-to-end 42 tests, 0.55 s), and the contention is external — **50** `nest start --watch` processes belonging to another repository (`/Users/deprof/www/YCN`) were alive all session, load averages 8.28 → 19.15. The per-test timeout was not raised. Evidence: `docs/audit/evidence/tsk60-durable-sales-portfolio-2026-10-11/` (`README.md`, `measurements.txt`, and the gate outputs above).
- [ ] Register vocabulary: `docs/decisions/screen-register.json` gets an expressible state for "surface exists, authorization-gated, renders its canonical fields and an explicit NOT CONNECTED section for the unbound feeds". Today that state must be recorded as either `IMPLEMENTED` (overstates the binding) or `MOCK` (falsely implies fabricated data still ships), and TSK-13 had to choose the former with corrected evidence prose. The fix is a status/vocabulary change plus the `tests/unit/screen-register-verification.test.ts` classifier following it — **a schema decision for the owner, recorded here, not a silent doc edit**

**Evidence:** the migration + route-level scoping test + the restart-boundary portfolio test, or the dated scope decision. **Depends:** TSK-17 (durable stores) and TSK-15 (the missing carriage/compliance entities are where campaign identity belongs). Blocks nothing — the portal is honest as it stands.

---

### TRACK E — Security & privacy (P1)

#### TSK-27 · P1 · Adapter-first reads for auth/session stores *(reopens `TODO-SEC-10` remainder)* — **CLOSED 2026-10-10**
**Source:** `report.md CA-26`, `audit.md` AUD-03/04 half-open · **Depends:** TSK-09
Wired and verified good before this round: boot-time Redis factory injection when `REDIS_URL` is set, `resolveKeyValueAdapter()`, auth/session stores bound, production/staging boot refusing memory-only KV unless deliberately opted in, `/readyz` surfacing `kvBackend` + `kvHealthy`, shared fixed-window limiter via atomic `incrBy`.
The reopening cause was the mirror: `kvGetJson` read the process Map **first**, so a wired Redis was write-only — a second instance could not see a revocation, a lockout or an enrolment the first one had written. `kvGetJson` no longer exists (`grep -rn "kvGetJson" src/` → **0**); every read below goes to the adapter before the Map.

- [x] Adapter-first read path for the auth store — `findUserByEmail` (`src/core/auth/index.ts:578`) reads `user:<email>` from the adapter, opens the sealed payload through TSK-30's `decryptUserSecretsFromStore`, and only then falls back to the Map; a confirmed miss repairs the Map from the durable row. `registerUser` (`:615`) does the adapter-first existence check **and** claims the row with `setIfAbsent`, so two instances racing on the same address produce exactly one account. Revocation is now single-path: `primeSessionRevocation` (`:434` → `primeRevocationFromSharedStore` `src/core/auth/sessions.ts:203`) is awaited once at the request entry (`src/api/router.ts:1148`, via `sessionTokenFrom` `:709`), which is what lets the **93** synchronous `resolveSessionUser` call sites (all in `src/api/router.ts`) agree without an async refactor of the router. The raw-token/token-id contract violation that made logout revocations unmatchable is fixed at both writers (`router.ts:1464`/`:1467`), and the dead `isTokenIdRevokedAsync` that presented as a control is deleted.
- [x] Atomic lockout + one-time MFA consumption via `setIfAbsent`/`INCR` — `recordLoginFailure` (`src/core/auth/index.ts:722`) issues `incrBy` on `auth:fail:<email>` (`:726`) and writes `auth:lock:<email>` with a TTL (`:731`); `getRemainingLockoutMsAsync` (`:697`) reads both from the adapter and warms the local `accountLockoutStore` (`:666`); `recordLoginSuccess` deletes both. `consumeMfaLoginChallenge` (`:79`) claims `auth:mfa-consumed:<jti>` with `setIfAbsent` (`:88`) and **fails closed** — an adapter error returns `null` (`:89-90`), refusing the login rather than falling back to the process Map, because a fallback here converts a backend outage into a second-factor bypass.
- [x] KV backend failure propagates to readiness; production refuses boot on memory backend — the inline boot check is now the unit-testable `assertSharedKvBackendForEnvironment` (`src/core/cache/index.ts:210`), called from `src/api/server.ts:137`; `/readyz` gates on `kvHealthy` (`src/api/router.ts:3596`, decision `:3608-3609`) and publishes `kvGating: "enforced" | "disabled"`, with `KV_READINESS_GATING=false` as the operator opt-out that mirrors the existing `STORAGE_READINESS_GATING` contract.
- [x] Multi-instance test proving revocation and lockout are shared — `tests/unit/auth-shared-across-instances.test.ts` (**12 tests**) binds two simulated instances to one `MemoryKeyValueAdapter` through the `_resetSharedAuthStateForTesting` seam (`src/core/auth/index.ts:235`) and asserts the fleet behaviours: three failures spread over two instances lock a **third** instance that has seen none of them, a success clears the shared counters, an MFA challenge is spendable once fleet-wide, an unusable adapter refuses the MFA login, registration races yield exactly one fulfilled promise, and revocation is honoured across instances from **both** writers (`revokeToken` and `revokeSessionById`) plus when the record is written straight to the KV. A `WITH_DB` test boots the real server against an unreachable Redis and asserts `/readyz` **503** + `kvHealthy:false` + `kvGating:"enforced"`, then **200** with the opt-out. Three source-wiring assertions pin the seams that a later "simplification" would silently drop: the boot guard call, the entry-point prime, and the awaited MFA claim.

**Evidence:** `tests/unit/auth-shared-across-instances.test.ts` (new, 12 tests) + `tests/unit/auth.test.ts` (15, the challenge-consumption test converted to the async claim). Gates, coverage and artifacts: `docs/audit/evidence/tsk27-shared-auth-across-instances-2026-10-10/`.
**Stated limit, not a gap hidden by prose:** the rate limiter (`checkRateLimit`, `src/core/auth/index.ts:223`) is deliberately **not** adapter-backed — it counts per instance, and a write-only mirror would read as a shared limit. `TODO-SEC-10` therefore closes on the stores CA-26 named (users, lockout, MFA challenges, sessions/revocations); the shared-limiter work is recorded under **TSK-20** with its `M` label, not implied here.

#### TSK-28 · P1 · Re-verify server-side authorization *(CA-17)*
**Source:** `report.md CA-17` · **Depends:** TSK-02
`ROUTE_GUARDS` (`src/api/router.ts:789`) is a real default-deny table — **75** method+path entries (re-measured 2026-10-09) — and `tests/security/route-authorization.test.ts` exercises it, but that file currently fails to import, so authorization is *unverified*, not verified. CLAUDE.md `<security>` requires proof.
- [x] Suite green; record the guard count and the passing assertion count verbatim — `npx vitest run tests/security` → **3 files passed, 27 tests passed, zero skips** (`route-authorization.test.ts` 13, `route-guard-parity.test.ts` 6, `abuse-and-fuzzing.test.ts` 8). Guard count measured, not inherited: **73** entries over **115** mutating dispatch sites (**102** under `/api/`), of which 57 enforce inline, 55 are documented handler-scoped and 11 are public-by-design with a stated reason. The report's "71 guards / 106 routes" was close but unmeasured. Coverage write-up: `docs/security/route-authorization-coverage.md`.
- [x] Pin the guard-count assertion so silent guard deletion fails the build — `tests/security/route-guard-parity.test.ts:245` asserts `ROUTE_GUARDS.length === 73`. Two more pins accompany it, because a size alone is not coverage: duplicate `method + pathname` entries fail, and every guard must name a route the router actually dispatches (dead configuration fails).

Residual, recorded rather than fixed: `AuditLog_userId_fkey` violations during this suite (`src/api/router.ts:733` returns the synthetic `test-user-id`, which has no `User` row) are pre-existing and were assigned to TSK-17; **TSK-17 closed 2026-10-08 without touching them**, and the reason is recorded rather than buried — it added the durable *stores* CA-12 named, while a durable audit *identity* needs `User`/`Person` rows that no runtime code creates at all (`docs/domain/systems-of-record.md` §2: those two models still have **0** accessors, and `src/core/auth/index.ts:456` `userStore` is the real identity source). The fix remains a durable audit identity, not a relaxed FK; the store it depends on is labelled `M` under TSK-20.

#### TSK-29 · P2 · Mutating-route ↔ guard parity contract test *(CA-31)*
**Source:** `report.md CA-31` · **Depends:** TSK-28
71 guards against 106 `/api/...` routes; lookup at `:997-1000` matches method+path only — **no tenant/org dimension**. Cross-org isolation lives in handler code (`getClientOrgRelationship`), not at the central enforcement point. Defensible, but undocumented and untested for coverage.
- [x] Contract test fails when a mutating route lacks a guard — `tests/security/route-guard-parity.test.ts` (6 tests). It parses `src/api/router.ts` and asserts every mutating `/api/` dispatch site is guarded, inline-enforced, or named with a reason; and it fails if the *scan itself* degenerates (`≥110` sites / `≥100` API sites), which is what would otherwise make a coverage assertion pass vacuously on an empty result set.
- [x] Handler-scoped routes documented as such — `HANDLER_SCOPED_ROUTES` carries **55** routes, each with an enforcement reason, and the suite fails when one stops existing, stops calling `assertRoutePermission`, or is documented as guarded while absent from the table. `PUBLIC_BY_DESIGN_ROUTES` carries **11** exemptions with reasons (signature-verified payment webhooks, public form intake, CI gate evaluation, one retired 410 endpoint) and is checked the same way.
- [x] Consider (or decide against) an org/tenant predicate in the guard table — **decided against, for now, and the reason is recorded.** The matcher (`COMPILED_ROUTE_GUARDS`) keys on `method` + path pattern only. A `tenantId`/`orgId` predicate cannot be evaluated at that point without resolving the path parameter to its owning organisation, i.e. a datastore read *before* dispatch for every guarded route — a new availability dependency on the authorization path, paid for on every request. Cross-org isolation therefore stays in the handlers (`getClientOrgRelationship`), which do have the loaded row. What this task changed is that the arrangement is now **enumerated and tested** rather than folklore: the 55 handler-scoped routes are individually asserted to enforce, and the two body-scoping gaps the scan exposed were closed by requiring authority first (`POST /api/v1/client/projects/{id}/questions` takes a caller-supplied `orgId`, and an anonymous caller could file an inquiry against any organisation; CMS publication recorded `"anonymous"` as the publisher). The remaining hole was stated plainly in §6 of `docs/security/route-authorization-coverage.md`: a guard-table entry cannot express organisation scoping, so a route that accepts an org identifier **in its body** is only as safe as its handler. **Pointer corrected 2026-10-12:** that section is now the `AuditLog_userId_fkey` defect TSK-18 closed, and the org-scoping constraint is **not restated anywhere in that document** — its only expression today is §1 point 2 (inline RBAC exists for what "the central table cannot express") and this register item. That is exactly the discrepancy TSK-58 box 3 puts to the owner rather than papering over. That is a design constraint to revisit with TSK-17's durable read paths, not something to bolt on by guessing.

#### TSK-30 · P1 · Enforce PII/MFA sealing at the write boundary *(CA-18)*
**Source:** `report.md CA-18`, `audit.md` AUD-06 half-closed · **Depends:** TSK-17, `HD-05`
**Closed 2026-10-09 for boxes 1–2. Box 3 is not an engineering item and stays `[B]`.**
`prisma/schema.prisma:101,122` — `Person.nationalId` and `User.mfaSecret` are still `String?` in the
Prisma DSL, because Prisma cannot express a `CHECK`; what changed is that the columns are now
envelope-only in the **database** as well as at the writer. `mfaSecret` was sealed at the KV boundary
(AES-256-GCM, fail-closed decrypt) and `nationalId` was *documented* as envelope-only — documentation
is a mitigation, not enforcement, so enforcement was added in two layers.
- [x] Write path rejects an unsealed value (fail closed), rather than relying on convention — **two independent layers.**
  - *Application.* `sealedUserPayload` (`src/core/auth/index.ts:265`) is the only serializer of a `user:` payload and `persistUserToSharedStore` (`:272`) the only async writer of that key; the seed (`:562`) and `updateUserMfaEnrollment` (`:612`) both go through it, and TSK-27's atomic registration claim (`setIfAbsent` at `:644`) passes the same `sealedUserPayload` output, so a call site that forgets to seal cannot exist. Before `kvAdapter.set` it calls `assertSealedForStorage("User.mfaSecret", …)` (`:268`) and (`src/core/websecurity/index.ts:413`), which throws `[VMNL-PII-01]` on any value that is not `enc:v1:<ct-hex>:<iv-hex(24)>:<tag-hex(32)>` (`SEALED_FIELD_ENVELOPE` `:383`); `null`/`undefined` pass, because absent is not leaked. Sealing goes through `sealSensitiveField` (`:396`), which refuses a second seal over an existing envelope (`[VMNL-PII-02]` `:398`) — the double-encryption bug class that made enrolled seeds unreadable by design.
  - *Database.* Migration `20261009200000_add_pii_sealed_envelope_checks` (`prisma/migrations/…/migration.sql:17`, `:20`) adds `Person_nationalId_sealed_envelope` and `User_mfaSecret_sealed_envelope`, each `col IS NULL OR col ~ '^enc:v1:…$'`. `prisma/schema.prisma:90-100` / `:118-121` carry the pointer comment naming the constraint, because the DSL has no place to say it.
  - *Test.* `tests/unit/auth.test.ts:187` (4 app-level tests) and `:297`/`:308`/`:333` (3 tests against **real Postgres**: `pg_constraint` rows present, `person.create`/`user.create` with a plaintext value fail with code `23514`, the sealed value is accepted). The DB block is `describe.skipIf(!WITH_DB)` and `WITH_DB` was **true** for the recorded run — this is not a sandbox-state claim (rule 0.4a).
- [x] Decryption access logged — `openSealedField` (`src/core/websecurity/index.ts:432`) returns an outcome (`opened` | `malformed` | `auth_failed`) instead of throwing, and `recordSecretAccess` (`src/core/auth/index.ts:282`) writes one tamper-evident ledger entry per attempt (`auth.mfa_secret_decrypted` / `auth.mfa_secret_decrypt_refused`, `resource: "User.mfaSecret"`, `resourceId: <email>`) through `recordAuditLog` (`src/core/audit/index.ts:185`) before the caller gets a value back. `decryptUserSecretsFromStore` (`:298`, opening at `:300`, logging at `:301`) hands back `mfaSecret: null` on any non-`opened` outcome, so a refusal is both logged and inert. Asserted in `tests/unit/auth.test.ts:210` (entry carries `changes.outcome` + `algorithm: "aes-256-gcm"`, and the serialised entry contains **neither the plaintext seed nor the ciphertext slice**) and `:251` (refused open logs `outcome: "malformed"`, no usable secret).
  *Recorded rather than hidden:* the entry is written with `userId: null` deliberately. `AuditLog_userId_fkey` rejects the synthetic ids the in-process identity minted, and that violation was **silently dropping the decryption entries** — i.e. the control looked implemented while recording nothing. A durable audit *identity* is `TSK-20`'s open item, not this one; the subject is identified by resource + email instead.
- [B] Key versioning/rotation owned — **`HD-05` (DPO).** The envelope carries a `v1` marker, so a version can be introduced, but there is no rotation procedure, no re-seal job, and no named owner for `PII_ENCRYPTION_KEY`; `getFieldEncryptionKey` only refuses to *start* without it in production/staging. Sealing under one un-rotated key is not key management, and no amount of code here manufactures the missing business decision.

*Not in scope, stated so nobody reads it as covered:* the two named columns only — `CommercialEnquiry.phone`/`fullName`/`email`, `Person.phone` and audit `changes` payloads remain unsealed, and expanding the envelope to them is an owner scoping call. The `User` `CHECK` guards a table the application never writes (`User` is one of the 13 models with **0** accessors, `docs/domain/systems-of-record.md:86`), so today it is defence for future writes and direct SQL; `Person.nationalId` has no write path at all (`src/db/migrate-and-seed.ts:158` is the only `Person` writer and does not set it). Both columns are empty in every local database, which is what made an additive constraint safe to deploy. Migration applied to `vmnl_enterprise` (`prisma migrate deploy`, `migrate status` → "Database schema is up to date!") and to the test database `vmn_enterprise` (`psql -f`; `migrate deploy` refuses that one with `P3005` — no migration bookkeeping). **Commit/push not performed — owner's decision.**

Evidence: `docs/audit/evidence/tsk30-pii-sealed-write-boundary-2026-10-09/` (`gates.txt`, `focused-run.txt`, `full-suite.txt`, `coverage.txt`, `migrations.txt`, `measurements.txt`). Gate line: typecheck exit 0 · lint exit 0 · build exit 0 · `pnpm test` → 65 files / **753** tests, 0 failed, 0 skipped · `pnpm test:coverage` exit 0 at 78.51/69.94/82.25/79.77. The census this increment moved is re-pinned, not relaxed: bracketed tags **181 → 183** distinct / **189 → 192** occurrences (24 families), `tests/unit/canonical-model.test.ts:377-380` and `docs/domain/data-dictionary.md` §1/§7/§8 agree with the measurement.

#### TSK-31 · P1 · Deliver or formally descope DSR export fulfilment *(CA-19)*
**Source:** `report.md CA-19` · **Depends:** TSK-17, `HD-06`
`src/api/routes/privacy.routes.ts:15,108` honestly state archive generation is not implemented; a durable `DataSubjectRequest` ledger row now exists (migration `20261006120000_add_data_subject_requests`). Still absent: export generator, SLA clock, operator status transitions. Canonical law 12 and NDPR obligations are unmet **in substance** even though the interface is truthful.
- [ ] Export generator built on the existing queue handler, or `HD-06` records that DSR export is out of RL1 scope with a dated owner
- [ ] No path returns `QUEUED` for work that can never run — retain `RECORD_ONLY` until it can

#### TSK-58 · P1 · Tenant scoping is unreachable from the central authorization point *(new finding, 2026-10-08)*
**Source:** `docs/domain/canonical-model.md` §4, principle 1.2 — raised by TSK-52's measurement, not inherited from `TODO-001`, so it correctly has **no §1.4 census row** (that census tracks inherited identifiers only; `tests/unit/register-inheritance.test.ts` pins it at 71 rows / 72 IDs and must not be padded to cover this).
`master-data-model.md` §1 states each `Organisation` defines a multi-tenant isolation scope. Re-measured 2026-10-09 (the 2026-10-08 figures are kept below where they still hold): `tenantId` is a column on **3 of 43** models — `UserRole` (`prisma/schema.prisma:170`, nullable), `Organisation` (`:188`) and, since TSK-17, `MediaAssetRecord` (`:695`, nullable) — and on none of `Contract`, `RightsRecord`, `Settlement`, `Project`, `Evidence`; `grep -rn tenantId src/core/database/repositories/` returns only the TSK-17 media-asset block (`release-critical.repository.ts:451`, `:466`, `:486`). The one real predicate (`src/core/rbac/index.ts:531-535`) reads a fourth `context` argument that **every external `canPerform` call omits** (`src/api/router.ts:769`, `:8093`, `src/api/routes/enquiry.routes.ts:25`, `:49` — positions re-pinned 2026-10-09 and again 2026-10-12; they were `:697`/`:7911` when raised), so it cannot be reached from HTTP. Isolation that does exist is ad hoc and per-handler (`src/core/work/index.ts:116`, `src/core/storage/index.ts:438-442`; positions re-pinned 2026-10-15 — TSK-58 box 1's guard inserted 30 lines above them, they read `:408-412` when raised). The storage one **leaked** when this item was raised — `:441` read `!a.tenantId || a.tenantId === params.tenantId`, which handed every tenant-less ("unowned") row to every tenant — and box 2 below closed it on 2026-10-12; the branch is now `a.tenantId === params.tenantId`. TSK-29 recorded this constraint as a design decision and deferred it here; the unit tests that pass (`tests/unit/rbac.test.ts:61-70`) exercise the predicate directly, never through a route.
- [x] Cross-tenant access refused **through an HTTP route** in a test, not only at the predicate: at least one mutating and one reading route per tenant-bearing surface, asserting 403/404 for a foreign-tenant subject *(closed 2026-10-15; the two vectors were found by reading the route first, then fixed, then asserted at the route)*. **What was actually reachable and unguarded:** `POST /api/v1/cms/media-assets` took the key from the body, so a tenant session could (i) register inside another tenant's `tenants/<id>/` namespace — the very prefix the presigner writes (`src/core/storage/index.ts:142`) — and (ii) re-post an existing foreign key, which the registry's idempotency lookups answered by **returning the foreign record**: a write route that read another tenant's title, checksum and provenance back to the caller with a 201. **Fix, in the domain so no caller can forget it:** `[MEDIA-ASSET-07]` at `src/core/storage/index.ts:379-383` (namespace) and `:361-366` + `:389` / `:395` (the two idempotency branches), surfacing as **403** at `src/api/router.ts:8134`. **Route-level assertions** — `tests/unit/tenant-scoping-routes.test.ts`, 8 tests, **signed** tenant sessions because the `x-test-role` harness mints a user with no `tenantId` (`src/api/router.ts:733`) and cannot stand in for a tenant subject: squat refused *and the row never created*; foreign-key re-registration refused with no foreign bytes in the body and no twin minted; the tenant's **own** re-registration still 201s, so the guard is demonstrably not a blanket refusal; an **unowned** platform row cannot be adopted through the write route either, which extends box 2's fail-closed read rule to writes. **Reading-route half, per surface:** the organisation surface answers **403** to a foreign-tenant subject and **503** to a staff-shaped session (`/portal/client/organisations/{orgId}/projects`, `src/api/router.ts:2528`, `:2524`; asserted alongside the pre-existing `tests/unit/client-portal-and-operations.test.ts:284`). **Read-by-reference, the vector this box had not named:** the CMS editor binds `mediaAssetIds` and `[CMS-11]` checked only registration + AVAILABLE, never whose it was, so a tenant could attach another tenant's master to its own revision and the review queue would render its title and provenance (`src/web/workspace/media-picker.ts:85`); now refused in `requireRegisteredMediaAssets` (`src/core/content/index.ts:33`, called at `:152`, `:196`) with the **same message an unknown id gets**, so the route is not an existence oracle — asserted by comparing the two response bodies, not by reading the code. The routes pass the session tenant at `src/api/router.ts:4704`, `:4743`, `:4774`, `:4813`; `POST /api/v1/workspace/content` then answers 422 and `PUT` 404. **Not claimed:** `UserRole`'s `tenantId` has **no HTTP writer** (`grep -rn "userRole\." src/api/router.ts src/core/rbac/index.ts` → **0** hits; roles arrive on session claims), so that surface is recorded rather than tested against an absent route; the central predicate at `src/core/rbac/index.ts:531-535` is still bypassed by every caller that omits `context`, which is box 3's owner decision; and where the platform's unowned library lives is still the owner's call — the new write guard refuses adoption, it does not resolve that.
- [x] The unscoped-asset branch at `src/core/storage/index.ts:441` made fail-closed (an asset with no `tenantId` visible to no one but a super admin), with the change covered by the existing storage-scoping tests rather than a new exemption *(closed 2026-10-12; positions re-pinned 2026-10-15 — this box was raised against `:381`, which is now `:411`, and the leak line moved from `:411` to `:441` when box 1's guard was inserted above them)*. The box cited `:381`; re-opening it found `:381` is the record builder's `tenantId: params.tenantId` and the leak lived on the read path one function lower — `:411` read `!a.tenantId || a.tenantId === params.tenantId`, now `a.tenantId === params.tenantId`. Covered by the existing storage-scoping family, not by an exemption: its unit test is rewritten to assert the refusal (`tests/unit/todo-final-remediation.test.ts:1236`) and three route-level tests run the same rule through `GET /api/v1/cms/media-assets` and the picker desk with **signed** tenant sessions (`:1327` describe, `:1386` a tenant sees only its own rows, `:1396` the unowned row appears in no tenant's list, `:1407` the desk's HTML). The `x-test-role` harness mints a user with **no** `tenantId` (`src/api/router.ts:733`), i.e. exactly the unscoped caller under test, so it cannot stand in for a tenant subject. **Stricter than the box, said rather than smoothed:** the box asks for "no one but a super admin", but today a SuperAdmin *session* carries `tenantId: "vmnl-hq"` (`src/core/auth/index.ts:497`, `:557`, `:637`), so no authenticated HTTP session of any role sees an unowned row — only unscoped server-side code and the development/test bypass do. **Consequence measured on this tree, not hidden by re-ticking:** the golden backfill registers 250 masters/stills with no `tenantId` (`src/db/seeds/dam-backfill.ts:41`–`:66`; `grep -c tenantId` on that file → **0**) and `MediaAssetRecord` holds **1427 unowned of 1585** rows in the local database, of which 959 are `AVAILABLE`, so a normal operator session (`tenantId: "vmnl-hq"`) now lists **0** assets on the picker desk where it previously listed the whole shared library; EPG, channel-schedule and episode-master paths resolve by `assetId` through `getMediaAsset` (`src/core/storage/index.ts:427`) and are unchanged. Whether the seeded library is re-homed onto a tenant, promoted to an explicit grantable platform-library scope, or left out of tenant desks is the owner's call and is deliberately not taken in code here.
- [ ] Either the guard table gains an expressible tenant dimension, or `docs/security/route-authorization-coverage.md` **§1 point 2** (the inline-RBAC escape hatch, the section that states the central table cannot express what depends on request data — the tenant scope is exactly that) and `master-data-model.md` §1 are reconciled so the register stops claiming a scope the schema cannot carry — **a decision for the owner, recorded under this item, not a silent doc edit**. Pointer corrected 2026-10-12: this box was raised against "§6", and §6 turned out to document the `AuditLog_userId_fkey` defect, which TSK-18 closed the same day, so the section this box needs no longer exists under that number.
- [x] `tenantId` added to the hashed audit payload *(closed 2026-10-12, as part of TSK-18)*. The box cited `src/core/audit/index.ts:124-133` for the payload and `:184-193` for the row; re-opening the file found the payload builder at `:154-165` and the row write moved **out** of the audit module to `persistAuditLogEntry` (`src/core/database/repositories/release-critical.repository.ts:1050-1074`). `tenantId` is now the seventh of the nine joined components (`src/core/audit/index.ts:162`) **and** a column on the durable row (`prisma/schema.prisma:341`), and the exact bytes that were hashed travel with that row as `changesJson.auditHashPayload` — not decoration but necessity, because jsonb does not preserve key order, so re-serialising `changes` cannot reproduce the payload. Measured on the local database before the change: **668 of 1783** durable rows were recomputable from their own columns and **0 of 1783** had a `createdAt` equal to their own event instant; the read now takes the instant from the payload (`src/core/audit/index.ts:348-374`). Asserted from the table alone in `tests/unit/audit.test.ts:254-257`, with the event-instant component at `tests/unit/audit.test.ts:277` — `sha256(auditHashPayload) === auditEntryHash`, with payload components 1/6/7 pinned to the entry id, the tenant and the timestamp — and re-read by a **second OS process** through the `auditLedger` restart reader (`tests/helpers/durable-restart-reader.mjs:141-163`). **What is deliberately not claimed:** hashing a scope is not enforcing one. Boxes 1 and 3 below stay open, and `docs/domain/canonical-model.md` §1.5 records this gap as closed rather than deleted.

**Evidence:** box 1 — `docs/audit/evidence/tsk58-cross-tenant-route-refusal-2026-10-15/` (`measurements.txt` + the same-tree gate logs) and `tests/unit/tenant-scoping-routes.test.ts` (8 route-level cases on three tenant-bearing surfaces: the mutating `POST /api/v1/cms/media-assets` → **403 `MEDIA-ASSET-07` with the row never created**, the read-by-reference CMS paths → **422 whose message is byte-identical to the unknown-id message** (no existence oracle) **and which leaves no row in `ContentItemRecord`** (the durable read was added 2026-10-16 after a starved run wrote one through an expired transaction — `docs/audit/evidence/tsk51-rollback-rehearsal-2026-10-15/gate-database-leftover-rows.txt`) and **404** on a foreign `PUT`, and the reading org route → **403** for a non-staff subject / **503** fail-closed for staff; `UserRole` has **no** HTTP writer, which is recorded in the box rather than counted as covered). Box 2 — `docs/audit/evidence/tsk58-fail-closed-unscoped-assets-2026-10-12/` (`measurements.txt` + the same-tree gate logs) and the storage-scoping cases it re-pins (`tests/unit/todo-final-remediation.test.ts:1236` unit, `:1327` route describe). Box 4 — `docs/audit/evidence/tsk18-durable-audit-transaction-2026-10-12/` (`measurements.txt` carries the 668/1783 and 0/1783 pre-change counts) and `tests/unit/audit.test.ts:253-257`. Box 3 still needs exactly what it asked for when raised: the owner's ruling on giving the guard table a tenant dimension versus reconciling `docs/security/route-authorization-coverage.md` §6 with `master-data-model.md` §1. Depends on TSK-17 (the durable read paths are what make a central predicate evaluable without a pre-dispatch datastore read).

---

### TRACK F — Finance integrity (P1)

> Verified good and **not** in scope for rework: kobo-exact arithmetic, MT940 parsing, WHT schedule, delivery-gated recognition, `tests/unit/finance-minor-units.test.ts` and `reconciliation-mt940.test.ts` passing (`report.md §3`).
>
> **Corrected 2026-10-08 (TSK-52 measurement):** this preamble previously listed "7-way separation enforced in the domain (`src/core/domain/types.ts:141-157`)" among the verified-good items. The validator exists; **nothing in `src/` calls it**, and its only writer repository is unwired — see **TSK-59**. The claim was a reading of the type file, not of a call path, which is exactly the failure mode Rule 0.2 exists to catch.
>
> **Re-measured 2026-10-09 (TSK-59, three of its four boxes closed):** the first sentence of that
> correction is now false and is replaced, not restated. `validateSettlementInvariants`
> (`src/core/domain/types.ts:218`) **is** called on every settlement write — `createSettlement`
> (`src/core/database/repositories/invoice.repository.ts:272`) and both branches of
> `updateSettlementStatus` (`:384` durable, `:419` in-process) refuse the write with
> `[VMNL-SETTLEMENT-INVARIANT]` — and the `&& gmvAmount > 0` waiver that let a zero-GMV row owe talent
> and rightsholder money silently is gone. What is **still** true, and is the reason TSK-59 is not
> marked closed: the second half of the correction stands — `InvoiceRepository` is instantiated by no
> production file, so the guard protects a write path no request can take, the `Settlement` columns
> still carry no `CHECK` constraint (`prisma/schema.prisma:292-298`), and the governance desk that
> would show settlements renders `settlements: []` (`src/api/router.ts:7357`). Separation *of the wired
> money* remains enforced where it is enforced: the seven-way ledger's own balanced-entry and
> law-5/law-7 assertions (TSK-32, TSK-33), which are a different model with different field names.

#### TSK-32 · P1 · Durable ledger postings *(FIN-03 truthfulness)*
**Source:** `report.md CA-12` · **Depends:** TSK-17
`LedgerPostingService` is claimed complete (`docs/handoffs/LATEST.md:216`) but has no Prisma model — journals exist in memory only, so "one consolidated financial truth" (law 5) does not survive a restart.
- [x] `LedgerPosting`/`JournalEntry` tables + repository; balanced journals asserted against the durable store
- [x] Consolidation assertion: internal unit allocations never inflate external revenue (law 7)

**Closure evidence (2026-10-08, measured on this tree):**
- *Box 1 — delivered under TSK-17, re-verified here.* `JournalEntryRecord` (`prisma/schema.prisma:793-807`): application-minted `id`, `reference`, `description`, `lines Json` (the pair set that makes the entry balance), explicit `currency`, `totalDebitNgn`/`totalCreditNgn` as `Decimal(14,2)`, `isBalanced` **written rather than implied**, `postedAt`, `updatedAt`, indexed on `[reference]` and `[postedAt]`. Repository `persistJournalEntry` (`src/core/database/repositories/release-critical.repository.ts:770`, upsert) and `loadJournalEntries` (`:797`), which **refuses** a row whose currency is not the column's declared unit. Wired at `src/modules/finance/ledger/index.ts:83` (`registerDurableStore("journalEntry", …)`), staged per post with a rollback that removes the optimistic entry (`index.ts:99-141`), boot hydration `hydrate()` (`index.ts:231`). Asserted against the **durable store across a real process restart** — not in-process — by `tests/unit/durability-release-critical.test.ts:429`: the two lines, their account codes, both `Decimal(14,2)` totals, `totalDebitNgn === totalCreditNgn`, `isBalanced` and `postedAt` all come back identical to the kobo from Postgres in a fresh child process.
- *Box 2 — the law-7 guard, implemented and asserted.* The authority is `CLAUDE.md:24` / PRD §14 (`docs/authorities/VMNL-AZP-VMN-BRD-PRD-001-R1.2A.md:1610`) / CCPP §18 (`docs/authorities/VMNL-AZP-VMN-CCPP-001-R1.1.md:374`): "Internal unit allocations must never inflate consolidated external revenue." Before this change the sentence existed only as a comment (`posting.ts:18`) and nothing in `src/` distinguished an inter-unit charge from external revenue. Now:
  - the snapshot carries an eighth accumulator, `internalAllocationsNgn` (`index.ts:36`), documented as the consolidation **elimination** bucket and not as an eighth pillar;
  - `recordPillarAmounts(amounts, scope)` (`index.ts:154`) takes `PillarScope = "EXTERNAL" | "INTERNAL_ALLOCATION"` (`index.ts:41`) and calls `assertConsolidationScope` (`index.ts:189`), which **throws `[LEDGER-03]`** when an internal amount touches any of `EXTERNAL_REVENUE_PILLARS` (`index.ts:44-50`: contract, GMV, invoiced, recognised, cash), when an internal call omits the elimination amount, or when an external call tries to move the elimination bucket. Refusals leave the snapshot untouched, so a rejected booking cannot half-apply.
  - `LedgerPostingService.postInternalUnitAllocation` (`posting.ts:220`) is the only path that books one: it rejects a non-positive charge (`[LEDGER-04]`), a same-unit on both sides (`[LEDGER-05]`) and a replayed allocation id (`[LEDGER-06]` — a duplicated elimination entry is an audit finding, not an idempotency success), posts the balanced pair `9100_INTERUNIT_ALLOCATION` / `9200_INTERUNIT_RECHARGE` (`posting.ts:46-47`) and advances **only** `internalAllocationsNgn`.
  - Six tests in `tests/unit/todo-final-remediation.test.ts` ("TSK-32: inter-unit allocations are eliminated, never booked as external revenue") assert: an elimination entry is balanced and moves no external pillar; **mirror-booked charges between two VMN units leave consolidated external revenue at 600 000 invoiced / 400 000 recognised while the elimination bucket carries both** (the law-7 outcome, stated as numbers rather than as a `toBeDefined()`); a rejected scope call advances nothing; no `INTERUNIT` entry has a line on receivable, recognised-revenue, contract-asset or bank; kobo exactness over 100 repeated 0.1 NGN charges. `pnpm typecheck` 0 · `pnpm lint` (`--max-warnings 0`) 0 · the finance/test trio 89 tests exit 0.
- *Stated limit — measured, not implied.* `grep -rn "new LedgerPostingService" src/` → **0**, and `new SevenWayLedgerEngine` in `src/` → **1**, the default parameter at `posting.ts:50`. `postDeal`/`postPayoutBatch`/`postBroadcastBilling`/`postInternalUnitAllocation` are called from **no `src/` file**; `/api/v1/finance/deals` (`src/api/router.ts:7491`) creates a sales deal but posts no journal, and `loadJournalEntries` is consulted only by `tests/helpers/durable-restart-reader.mjs:84`. So the journal is durable and the law-7 guard is enforced **wherever the engine is used**, but at runtime today no request reaches it: "one consolidated financial truth" is not yet a live property of the product. Same class of finding as **TSK-59** (an unenforced invariant is not future-proofing); recorded here as the dated follow-up rather than quietly wired, because connecting the ledger to the deal/billing/payout routes changes financial behaviour and belongs to the TSK-33 billing work that consumes it.
- *Also measured for accuracy:* the engine's `getSnapshot()` is **not** rebuilt at boot (`index.ts:218-230` documents why), so pillar totals — including the new elimination accumulator — return only when the posting service replays them. The durable half is the journal, which is what the pillars are audited against.
- *Census side effect (Rule 0.2):* `postedInternalAllocations` is a new class-field store, so the store census moved **68 → 69** class-field. `docs/domain/systems-of-record.md` §3.3/§6, this register's Track C preamble and `docs/handoffs/LATEST.md` are re-pinned to 39 / 69, and `tests/unit/systems-of-record.test.ts` — which recomputes the census from `src/` and requires the document to publish it — caught the drift on the first run and passes on the corrected figures.

#### TSK-33 · P1 · Make-good credit notes *(reopens part of `TODO-FIN-07`)*
**Source:** `report.md CA-16` · **Depends:** TSK-16, TSK-32
- [x] Billing built only from matched as-run logs **and** make-good credit notes actually posted to the ledger
- [x] `TODO-FIN-07` register status corrected to match delivered behaviour

**Closure evidence (2026-10-09, measured on this tree):**
- *Billing built only from matched as-run logs.* `generateBillingScheduleFromAsRun`
  (`src/modules/broadcast/billing/index.ts:161-240`) recognises a spot only when
  `status === "AIRED_FULL" && actualDurationSeconds >= expectedDurationSeconds` (`:197`); every other
  record becomes an `OPEN` make-good instead (`:205-213`), and it refuses to build anything without
  delivery evidence (`[BIL-ASRUN-01]` `:179`) or with a duplicate spot (`[BIL-ASRUN-03]` `:192`). The
  projection records `recognizedRevenueNgn` = matched value and `totalContractValueNgn: 0` by design
  (`:228`, contract value lives on the deal). Covered by `tests/unit/todo-final-remediation.test.ts`
  "FIN-07: billing schedule generated only from matched as-run records" (3 tests now).
- *Credit notes actually reach the ledger.* `postMakeGoodCreditNote`
  (`src/modules/finance/ledger/posting.ts:235-265`) books the balanced pair
  **Dr `4090_CONTRA_REVENUE_ALLOWANCES` / Cr `2400_CLIENT_CREDIT_PAYABLE`** — the mechanical reading of
  this module's own rule that "a credit note is a contra item, never revenue"
  (`billing/index.ts:158`). Guards: `[LEDGER-07]` refuses a non-positive amount, `[LEDGER-08]` refuses a
  replayed `creditNoteId` (`:248`), and the entry id `CREDIT:<creditNoteId>` is deterministic, so a
  re-post after a restart writes the same `JournalEntryRecord` (`release-critical.repository.ts:787`
  upserts by id) rather than a second one.
- *It is a served path, not a test-only one.* `api/server.ts:268` constructs
  `new LedgerPostingService(new SevenWayLedgerEngine())` and exposes it as `context.ledgerService`
  (`:310`); `resolvePoaException` (`asrun/exceptions.ts:241`) takes the ledger as a **required**
  collaborator (structurally typed as `MakeGoodCreditLedger`, `:225`, so the broadcast register does not
  import the finance module) and journals the note *before* the exception may close.
  `POST /api/v1/broadcast/asrun/exceptions/{id}/resolve` (`api/router.ts:4494`) returns and audits
  `journalEntryId` (`:4554`, `:4535`), and the workbench banner names it
  (`web/workspace/governance-and-operations.ts:374`). This is the first `src/` callsite of the posting
  service; TSK-32's residual ("no request reaches the ledger") is now narrowed to
  `postDeal`/`postPayoutBatch`/`postBroadcastBilling`, which still have none.
- **Tests:** `tests/unit/poa-delivery-exceptions.test.ts` +3 → **13** (the credit path posts one
  balanced contra entry with the exact account pair and records `journalEntryId`; canonical law 5 —
  **all eight pillar fields stay 0** after a credit; a rebooking posts nothing; `[POA-EXP-01/02]`
  refusals post nothing; re-ingesting a closed log cannot produce a second journal).
  `tests/unit/todo-final-remediation.test.ts` +1 → **81** (`[LEDGER-07]`/`[LEDGER-08]`,
  `getCreditedMakeGoodsNgn`). `tests/unit/client-portal-and-operations.test.ts` drives the credit remedy
  through HTTP and asserts the served ledger's entry list contains
  `CREDIT:CN-CMP-DAG-2026-SPT-CLIP-01` — 20/20 green.
- *Accounting treatment recorded, not invented.* No pillar advances, because which revenue stream a
  make-good credit nets against is Finance's ruling (PRD §43 "Contract and Finance authority determine
  invoicing and accounting treatment"; HD-04 → **TSK-34**). The durable journal is the evidence;
  the P&L classification is stated as pending.
- *Recorded, not fixed (out of this task's scope):* the resolve route is guarded by
  `update:broadcast`, so a BroadcastDirector can issue a credit note. Credit *authority* is a Finance
  question (`[BIL-MG-03]`'s own comment), and changing the guard table for a money-movement route needs
  the owner's ruling — flagged here for the same reason TSK-58/TSK-59 were raised.
- *Guard instruments re-pinned to measured truth (Rule 0.2).* `tests/unit/canonical-model.test.ts`
  failed on its first run after this work landed, exactly as an instrument should: the dictionary's
  censuses had drifted. Re-measured with the dictionary's own published `grep` commands in `§8` and
  re-pinned in `docs/domain/data-dictionary.md` §1/§5/§7/§8 — state-shaped TS unions **46 → 48** /
  members **219 → 224** (the exception register's three vocabulary unions; `ProposalStatus` is declared
  twice, so 49 declarations are 48 distinct names), `new Date()` lines **249 → 251**, bracketed tags
  **176 → 181** across **23 → 24** families / **184 → 189** occurrences (the whole `POA` family is new,
  `[POA-EXP-01..05]`), API `code:` literals **111 → 112** (`POA_EXCEPTION_RAISE_FAILED`).
  `docs/domain/canonical-model.md`'s evidence-vault pointer moved `src/api/router.ts:7198` → `:7299` → `:7320` → `:7357`
  (the line the insertions shifted), and `systems-of-record.md`'s `router.ts:531` → `:539`,
  `:2466` → `:2493` plus every `api/server.ts` hydration cite **+8** were re-measured the same way.
- **Gates (all re-run on this tree, 2026-10-09):** `pnpm typecheck` exit 0; `pnpm lint` (repo-wide,
  `--max-warnings 0`) exit 0; `pnpm build` exit 0; `pnpm test` → **65 files / 737 tests, 0 failed, 0
  skipped, 0 unhandled errors**, run back-to-back twice on this tree with exit 0 both times;
  `pnpm test:coverage` exit 0 at **78.33 / 69.51 / 81.99 / 79.68** against floors 73/62/77/72. One
  intermediate run of the first pair exited non-zero on **2 unhandled errors with all 737 tests
  passing**; its error text was lost because the command was piped through `tail`, and it did not
  recur in the three later full runs — recorded as an unreproduced flake rather than folded into the
  claim. `docs/handoffs/LATEST.md`'s verification pin carries the same figures.
- *Census side effect (Rule 0.2):* `postedCreditNotes` is a new class-field store, so the census moved
  **69 → 70** class-field (module-level stays 40). `docs/domain/systems-of-record.md` §3.3/§6, the Track
  C preamble and `docs/handoffs/LATEST.md` are re-pinned, and `tests/unit/systems-of-record.test.ts`
  caught the drift on its first run. That document's §3.1 journal row was also corrected: it still
  claimed *"no production file constructs `LedgerPostingService`"*, and its `hydrate()` citation pointed
  at `ledger/index.ts:166` instead of `:231`.

#### TSK-34 · P2 · Accounting ruling dependency
**Source:** `report.md §5` human decisions · **Blocks:** TSK-32 closure language
Delivery-gated, contract-capped recognition is implemented as a defensible default; the final treatment awaits `HD-04` (Finance Controller). Record the dependency in the register — do not present the default as Finance's ruling.

#### TSK-59 · P1 · The canonical settlement invariants are dead code *(new finding, 2026-10-08)*
**Source:** `docs/domain/canonical-model.md` §4, principle 1.4 — raised by TSK-52's measurement; no inherited `TODO-*` identifier, therefore **no §1.4 census row** by design.
This track's preamble asserted "7-way separation enforced in the domain (`src/core/domain/types.ts:141-157`)". Measured 2026-10-08, that is half true and the half that is true is not wired: the seven columns exist (`prisma/schema.prisma:292-298`) **with no `CHECK` constraint**, `validateSettlementInvariants` (`src/core/domain/types.ts:218`) is referenced **only** by `tests/unit/domain.test.ts:73` and `:95`, and `InvoiceRepository` (`src/core/database/repositories/invoice.repository.ts:48`) — the only writer of those columns — is **instantiated in no `src/` file** (barrel re-export `repositories/index.ts:10`; the sole construction is `tests/unit/production-core-and-infrastructure.test.ts:242`). Meanwhile the money that *does* flow uses a different model with different field names (`src/modules/finance/sales/index.ts:39-40` `invoicedAmountNgn`/`cashCollectedAmountNgn`, pillars in `src/modules/finance/ledger/`). Two further defects sit inside the validator itself: `types.ts:219` (its line as measured then; TSK-59 has since removed the rule from there) requires `gmvAmount > 0`, so a zero-GMV settlement waives the talent/partner sum rule silently, and `tests/unit/production-core-and-infrastructure.test.ts:241` is titled "enforces 7-Way Financial Separation in Contracts & Settlements" while asserting only value round-trip (it also persists a `SIGNED` contract with no `signedAt`).
- [x] The validator called on every write path that can create or amend a `Settlement`, or the canonical `Settlement` model declared out of scope and the `master-data-model.md` §1 principle marked deferred with a dated owner — **one or the other, not both left implied** *(first option delivered 2026-10-09; see closure evidence)*
- [ ] `InvoiceRepository` wired to a route/desk or deleted from `src/` (Rule 0.5: an unwired repository is not "future-proofing", it is an unenforced invariant) — **still open, and it is why this item is not closed**: see the recorded decision under *Residual* below
- [x] The `gmvAmount > 0` waiver (at `types.ts:219` as measured then) closed, with a test that a zero-GMV settlement **cannot** silently pass the talent/partner sum rule
- [x] Track F's preamble corrected to the measured statement, and the mis-titled test at `:241` renamed to what it actually asserts (Rule 0.3: do not weaken the assertions — fix the name and add the missing assertion)

**Closure evidence (2026-10-09, measured on this tree; 3 of 4 boxes — the item stays IN_PROGRESS):**
- *The guard is on the write path.* `validateSettlementInvariants` (`src/core/domain/types.ts:218`) is
  called by `InvoiceRepository.assertSettlementInvariants` (`src/core/database/repositories/invoice.repository.ts:65`)
  from `createSettlement` (`:272`, before `checkDatabaseConnection()` so neither Postgres nor the
  in-process index is touched by a refused row) and from **both** branches of `updateSettlementStatus`
  (`:384` durable, `:419` in-process). The durable branch reads the stored row first and asserts outside
  the `try`, so an invariant refusal surfaces as `[VMNL-SETTLEMENT-INVARIANT]` instead of being
  downgraded by `handleRepoError` to a repository outage. No other file writes `prisma.settlement`
  (`grep -rn "\.settlement\." src/` → `invoice.repository.ts` only), so there is no second writer left unguarded.
- *The waiver is gone.* `types.ts:228` now reads `talentPayableAmount + partnerShareAmount > gmvAmount`
  with no `gmvAmount > 0` conjunct; a zero-GMV row that owes talent money is refused, while a
  zero-GMV row that owes nothing still passes (`tests/unit/domain.test.ts:120` and `:142` —
  `domain.test.ts` 4 → **6** tests). No fixture in `src/` or `tests/` carried a zero GMV with a non-zero
  payable (`grep -rn gmvAmount`), so closing the waiver broke nothing that was legitimately relying on it.
- *Tests that fail when a settlement violates the separation.*
  `tests/unit/production-core-and-infrastructure.test.ts:241` is renamed from "enforces 7-Way Financial
  Separation in Contracts & Settlements" to what it actually does — a contract/settlement round-trip —
  with the enforcement half **added** rather than swapped in: an over-committed settlement is refused,
  `getSettlement` then returns `null`, and the in-memory index count is unchanged; the zero-GMV case is
  refused by message. A second test (`:315`) inserts a violating row **straight into Postgres** —
  because the repository can no longer produce one — and asserts that reconciling it is refused, the
  row stays `PENDING` with `reconciledAt` null, and the fixture is deleted afterwards; it returns
  honestly when no database is reachable rather than passing vacuously.
  **Rule 0.3 respected:** no assertion was removed or relaxed — the two original round-trip assertions
  and the `SIGNED`-without-`signedAt` contract (the §3.4 gap `canonical-model.md` records) are unchanged.
- *Documents corrected to the measured statement.* Track F's preamble above; `docs/domain/canonical-model.md`
  §4 row 1.4 and its coverage table now say "guarded at its only writer, database still permits anything"
  with the re-measured cites (`types.ts:218`, `invoice.repository.ts:272/:384/:419`,
  `src/api/router.ts:7357` `settlements: []`); `docs/domain/data-dictionary.md` §6's money paragraph was
  rewritten from "called from `src/` nowhere" to the call path with its line numbers.
- **Residual (recorded, not silently chosen).** `InvoiceRepository` is still constructed by no
  production file, so the guard protects a path no HTTP request takes. The two options the box offers
  are not symmetric: deleting the repository removes the only writer of the canonical 7-way columns and
  the fixture the (now corrected) test measures, and wiring it means a settlement-creating route/desk —
  new public surface on a RESTRICTED-scope financial object (`governance-registers.ts:66-67` marks
  talent payables and partner share RESTRICTED), which needs the same owner ruling TSK-58 records for
  the guard table before a money-movement route can be added. Left open on that basis rather than
  closed by a doc edit.
- **Gates (this increment, all measured 2026-10-09 on one tree):** `pnpm typecheck` exit 0;
  `pnpm lint` (`eslint . --max-warnings 0`) exit 0; `npx vitest run tests/unit/domain.test.ts
  tests/unit/production-core-and-infrastructure.test.ts` → **28 passed** against real Postgres in
  `fail_closed` mode; the five document guards (`canonical-model`, `systems-of-record`,
  `register-inheritance`, `desk-census`, `ac-traceability`) → **38 passed** after re-pinning §4's kobo
  helper cites, which this change moved by nine lines (`types.ts:243/:245/:255/:265/:279/:283`);
  `pnpm test` → **65 files / 740 tests, 0 failed, 0 unhandled errors**, run twice back-to-back with
  exit 0 both times; `pnpm test:coverage` exit 0 at **78.48 / 69.80 / 82.06 / 79.82** against floors
  73/62/77/72; `pnpm build` exit 0.
  **Measurement correction, stated because it is the interesting part:** the first attempt at this
  pair reported 66 files / 743 tests with 2 unhandled errors. Two full suites were running at the
  same time against the same Postgres — the second had been launched while the first was still
  alive, so both were contending for the same rows and ports. The figures above are from a strictly
  serial re-run after the duplicate processes were terminated, and they supersede the 66/743 pair.
  The same mechanism is the leading explanation for the "unreproduced flake" recorded at the TSK-33
  and TSK-17 pins: every run that reported unhandled errors was one I had started while another full
  suite was still in flight.

**Evidence:** the callsite plus tests that fail when a settlement violates the separation; the corrected Track F preamble. Depends on TSK-32 (durable ledger postings) for the write path this validator should guard.

---

### TRACK G — Federation (P1)

#### TSK-35 · P1 · Harden the Azeebo+ destination registry *(CA-15)*
**Source:** `report.md CA-15` · **Depends:** TSK-17
`src/core/federation/destinations.ts:17` in-memory `Map`; `:51-87` statuses limited to `VERIFIED`/`REVOKED` where §41 requires `CANDIDATE`/`DEPRECATED`/`BLOCKED`; `:74` hard-codes fallback `https://azeebo.plus` — a **guessed production domain** prohibited by CLAUDE.md `<azeebo>` ("Never invent production endpoints") and PRD §41.
- [x] Guessed default removed; explicit configuration required, fail closed when absent
- [x] Full status set implemented
- [x] Registry persisted (TSK-17 scope)
- [x] Federation failure cannot corrupt VMN canonical records (assert in a drill)

**Closure evidence (2026-10-08, measured on this tree):**
- *Guessed default.* The CA-15 body cited `destinations.ts:74`; there is no fallback literal there any more. `resolveNavigationUrl` (`src/core/federation/destinations.ts:159`) delegates an unusable destination to `approvedFallback` (`:183`), which reads `getConfiguredFederationOrigin()` (`:178` → `AZEEBO_PLUS_UNIVERSAL_URL`, declared `optionalUrl` at `src/core/config/index.ts:44`, default-free) and **throws** `[DEST-07] … no endpoint may be invented` when it is unset (`:186`). `AzeeboLinkGateway` is the same shape: `isConfigured()` (`src/modules/federation/azeebo/links.ts:68`) and `[LINK-01]` (`:75`). CORS no longer trusts the partner origin by default (`ALLOWED_ORIGINS` default has no partner domain, `src/core/config/index.ts:50-53`), and `/api/v1/federation/*` answers 503-style "not configured" rather than a fabricated URL (`src/api/router.ts:6973`, `src/api/server.ts:148-161`).
- *The two remaining literals were this session's find, and they were in scope.* The registry was not the only place the domain was shipped: `renderAzeeboGatewayPageHtml` printed `href="https://azeebo.plus"` on the public `/azeebo` page, and the corporate pillar carried it as a rendered `route` (`src/web/public/dashboard.ts:411` emits `p.route` into an `<a href>`). Both are now configuration-driven: the page renders the outbound anchor **only** when `getConfiguredFederationOrigin()` returns a value and otherwise renders "Outbound federation disabled — no Azeebo+ origin is configured for this deployment" (`src/web/public/surface-a.ts:276-283`), and the pillar routes through the internal information page (`src/web/public/corporate.ts:54`). **Measured:** `grep -rn "azeebo\.plus" src/` returns **2** lines and both are comments that *state the prohibition* (`src/core/config/index.ts:41`, `:52`) — **0** rendered or executed occurrences: no code default, no shipped literal. `tests/unit/federation.test.ts:14` and `uat-broadcast-failure-drills.test.ts:274` still pass that domain to the gateway **as a test fixture**, which is the permitted direction: a deployment stating a value, not the product inventing one.
- *Full status set.* `AzeeboDestinationStatus` = `CANDIDATE | VERIFIED | DEPRECATED | BLOCKED | REVOKED` (`:19`), with transitions `registerDestination`/`verifyDestination`/`revokeDestination`/`deprecateDestination`/`blockDestination` (`:66`, `:97`, `:115`, `:119`, `:124`). Registration is not verification: a new destination is `CANDIDATE` and `isVerifiedDestination` (`:139`) stays false until a **named** operator verifies it; non-https and relative origins are rejected before entering the registry.
- *Registry persisted.* `registerDurableStore("azeeboDestination", persistAzeeboDestination)` (`:41`), staged per write with a rollback that deletes the optimistic index entry (`:43-52`), boot hydration `refreshDestinationIndex()` (`:55`) called from `src/api/server.ts:333`. Proved across a **real process restart**, not in-process: `tests/unit/durability-release-critical.test.ts:286` "keeps Azeebo+ destination verification state durable, registrant included" spawns a fresh reader child against compiled `dist/src`.
- *Drill (box 4).* `tests/unit/federation-destination-registry.test.ts:181-209` — a rejected `DEST-04`/`DEST-03`/`LINK-01` transition leaves the registry record byte-identical to its snapshot (`toEqual`, status and `verifiedBy` included), and a navigation failure is a thrown condition that does not rewrite the stored `universalUrl`.
- *Tests.* `tests/unit/federation-destination-registry.test.ts` **20 tests** (was 17; +3 this session for the public-page box), `tests/unit/public-provenance.test.ts` 6, `tests/unit/public-surfaces.test.ts` 18 — 3 files / 44 tests, exit 0. The three new assertions are behavioural, not textual: with no origin configured the page emits **no** `<a href="http…">` at all, with an origin configured it emits exactly that origin, and the corporate pillar's route is the internal page.
- *Not claimed:* no destination record exists in this repository for any real partner universe; seeding one remains an operator action through the registry desk, and `[DEST-07]` is the designed outcome until `AZEEBO_PLUS_UNIVERSAL_URL` is stated.

#### TSK-36 · P1 · OTLP export wired in production *(CA-20)*
**Source:** `report.md CA-20` · **Depends:** TSK-09
`logStructured` emits to stdout (`src/core/observability/index.ts:160-181`) — AUD-16 genuinely fixed. The OTLP exporters are referenced **only by tests**, so ADR-011's standard is unmet in a real deployment.
- [ ] OTLP metric/log export wired under production config
- [ ] A runnable check proves a span/metric leaves the process (not a unit test of the serializer)
- [ ] Alert rules for audit-persistence degradation and KV backend loss

---

### TRACK H — Governance & document integrity (P1/P2)

#### TSK-37 · P1 · Resolve the signed-release / unsigned-scope contradiction *(CA-24)*
**Source:** `report.md CA-24` · **Depends:** `HD-01` · **Blocks:** any promotion claim
`release-manifest.json` records `decision: GO_WITH_CONDITIONS`, `humanReleaseOwner.signedAt: 2026-09-28`, `conditionsAcceptance.acceptedBy: "Femi Aderibigbe"`. `docs/decisions/DEC-RL1-SCOPE-001.md:8` is still `PENDING_SIGNATURE` with **all ten** allocations D-01…D-10 `[PENDING]` and the acceptance box unchecked (line 52). The project has recorded executive acceptance of a release whose scope has no executive acceptance.
- [ ] Either the D-01…D-10 signatures are obtained (`HD-01`), or the manifest decision is set to `NOT_APPROVED`
- [ ] Never manufacture the signature — `DEC-RL1-SCOPE-001.md:8` states the record "does not manufacture missing business approval"
- [ ] Manifest SHA re-pinned; CI's `gates:check` step runs without `--allow-sha-drift` against code that actually exists

#### TSK-38 · P1 · Fix the stale registers *(CA-25)* · **Depends:** TSK-08
- [x] `docs/audit/journey-readiness-matrix.md:6` re-reconciled ("Reconciled 2026-09-30" while five cited suites cannot load) — **closed 2026-10-13 by TSK-20's re-write of this document.** The line now carries a second date and states what was checked. All **nine** suites the matrix cites were located and re-run on this tree (`enquiry-failure-drill`, `security-auth-rbac`, `identity-and-rbac`, `route-authorization`, `client-portal-and-operations`, `rights-clearance-e2e`, `broadcast-rights-gate`, `finance`, `finance-minor-units`): **9 files / 102 tests passed, 0 skipped** on the migrated, unseeded gates database (`vmnl_enterprise_gates`); the same nine files are inside the final-tree full-suite run recorded above. No cited suite was deleted or renamed to make the sentence true, and no path was invented — each was found by `find tests -name <suite>.test.ts` before being run.
- [x] `docs/audit/evidence-register.md:31` "225 system screens" corrected — closed by TSK-24 on 2026-10-07: the row now states 60 entries = 226 documented IDs, measured provenance (75 DOMAIN_ENGINE / 4 NOT_CONNECTED / 147 NOT_VERIFIED) and measured HTML surfaces (40 register-declared, 111 literal repository-wide), pointing at `docs/audit/screen-register-verification.md`
- [x] `docs/audit/evidence-register.md:4` `File 1.txt §8` citation fixed (also TSK-07) — **verified closed 2026-10-14, not re-edited.** The Authority line now reads `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMNL-AZP-VMN-CCPP-001 §8` and the phantom citation is recorded as removed in the note beneath it (`docs/audit/evidence-register.md:4-7`), per `docs/decisions/DEC-REGISTER-SURVIVOR-001.md`. Three assertions in `tests/unit/register-inheritance.test.ts` keep it closed: the phrase may appear nowhere except the two removal records (`:252-263`), the Authority line must not contain it (`:269`), and that line must name a document that exists (`:270`). Re-opened here only to cite the guard, since the box had been left unchecked while its work was already landed and tested. **Evidence:** `docs/audit/evidence/tsk38-phantom-citation-2026-10-14/README.md.

#### TSK-39 · P2 · Import or repoint the missing authorities *(CA-22)*
**Source:** `report.md CA-22` · **Blocks:** TSK-41, TSK-52
`docs/authorities/` holds exactly three files, yet documents and code cite as if available: `VMNL-AZP-VMN-UIUX-001` (2×, incl. `DEC-RL1-SCOPE-001.md:5`), `VMNL-AZP-VMN-UIUX-CCPP-001` (5×, incl. the readiness matrix's §4.1 and the perf budget's §7.7), `VMNL-AZP-VMN-UIUX-REG-001`, `VMNL-AZP-VMN-DESIGN-TASK-001` (2× — the source of every `DT-*` rule), `VMNL-AZP-VMN-CDDS-001` (cited at `docs/domain/master-data-model.md:3` as the data-model authority), `VMNL-AZP-VMN-TODO-001`.
Phantom sub-sections: `CCPP §2.2`, `§4.1`, `§5.2`, `§7.7`, `§1.4`, `§1.5` do not exist (the CCPP is numbered as top-level `N. TITLE` sections 0–38 with no decimals; §16/§18/§19 are real). PRD is numbered to §77; the "§283"/"§158" subsections named in commit history appear nowhere in the PRD or in any `src/` citation.
- [ ] Missing authorities imported into `docs/authorities/`, **or** every citation repointed at the section that actually says what is claimed
- [ ] Decimal phantom citations rewritten to real locators
- [x] A CI check fails on a citation to a non-existent file/section — **closed 2026-10-15.** `tests/unit/citation-integrity.test.ts` (5 tests) is that check, and it runs in CI because CI runs the suite (`.github/workflows/ci.yml:94-95` `pnpm run test:coverage`). Two rules of deliberately different strength. **(1) Zero tolerance on repository paths:** every `src/…`|`tests/…`|`docs/…`|`scripts/…`|`prisma/…`|`docker…`|`pages/…` token ending in a code or document extension must resolve on this tree — **1823** citations across **282** live files (`src` + `tests` + `docs` + `scripts` + this register, excluding `docs/audit/evidence/**`, which is dated transcript and would be falsified by rewriting it, and excluding the guard itself). The only escape is the literal annotation `citation:absent` on that line, and a second test refuses an annotation that no longer sits on a genuinely absent path, because a stale exemption is a hiding place for the next phantom. **9** annotated lines exist, each one found by this guard's first run: three sites citing `src/core/rights/index.ts` (deleted by TSK-14), `docs/audit/state-transitions.md` + `pending-questions.md`, the already-withdrawn forensic report at `tasks.md:1416`, the `route-guard-parition.test.ts` typo, the `screen-provenance.md` table row (replaced by the instrument that measures it, `tests/unit/broadcast-provenance-coverage.test.ts`), `tests/unit/p1-router-suites.test.ts:167` (`git log --all --` on it returns nothing), and `docs/runbooks/disaster-recovery.md:37-38`, whose runbook ordered operators to run a script that has never existed and now carries the catalog query instead. **(2) Ratchets where clearing is a business decision:** `PRD §n` and `CCPP §n` must name a section the authority actually has (PRD 0–77, CCPP 39 top-level `N. TITLE` sections), so `§374` is a hard failure — and it was live in two of my own headers when the guard first ran (`tests/unit/todo-final-remediation.test.ts:250`, `tests/a11y/responsive.test.ts:3`; `grep -rn "§374" src tests docs tasks.md` → **0** now, both repointed, along with four `Authority:` headers citing `tasks-9.md`/`report-9.md` in `src/core/domain/types.ts:240`, `tests/unit/finance-minor-units.test.ts:3`, `tests/unit/wiring.test.ts:3`). Decimal CCPP locators (**29** sites), lines citing authority documents that are not in `docs/authorities/` (**28**), sites naming the renamed constitution file (**10**) and sites naming the retired register (**45**) are ceilings that may not grow, each printed on every run — the guard counts lines, so this sentence deliberately does not spell those two file names out again. **What this box does not buy:** the check proves a locator *exists*, never that the sentence about it is true — that is what `tests/unit/threat-model.test.ts`'s symbol-anchor and `tests/unit/canonical-model.test.ts`'s read-the-line rules address for their own documents, and why Rule 9 remains a human duty. Boxes 1 and 2 stay open because clearing them means deciding which authority a decimal claim belongs to and whether the six missing documents get imported; choosing a locator to make a count go down would be a fabricated citation with a green test behind it. Evidence: `docs/audit/evidence/tsk39-citation-integrity-2026-10-15/`.

#### TSK-40 · P2 · Complete the design-debt register *(CA-25, CA-22)*
- [x] Each `DT-*` key either resolvable or re-keyed (blocked by TSK-39) — **closed 2026-10-14; the stated dependency did not block it.** The keys are not resolvable — `design-task.md` has never existed in this repository — so the box was satisfied on its *re-keyed* branch, which `docs/decisions/design-task-de-citation.md` (status `ACCEPTED`, 2026-09-30) already authorises: the ids survive as internal labels only and confer no acceptance authority. TSK-39 owns a different set of phantoms (`UIUX-*`, decimal `CCPP §x.y` subsections); nothing in this box depends on importing those files. Measured census: **42 distinct `DT-*` keys across 21 live files** (`src/` + `tests/` `.ts`, plus the three documents that key debt by `DT-*`: `docs/design-debt-register.md`, `docs/ui-copy-standards.md`, `docs/design-review-gate.md`). Seven live files cited a key with no pointer to the record; six now carry it (`src/api/router.ts:3`, `src/web/public/hub.ts:3`, `tests/unit/broadcast-screens.test.ts:3`, `tests/unit/public-surfaces.test.ts:54`, `tests/unit/stylesheet-resolution.test.ts:4`, `tests/helpers/stylesheet.ts:5`) — **every one an in-place, line-count-neutral edit inside an existing comment**, because 729 `src/api/router.ts:NNNN` pins are published across this register and the handoffs and any inserted line would invalidate them (Rule 9). The seventh, `src/db/seeds/golden/index.ts:120`, is a **false positive**: the string is the AFCA course code `AFCA-EDT-201`, and the guard's key regex excludes a letter-prefixed `DT-` so data cannot be read as a citation. `tests/unit/dt-decitation-keys.test.ts` (4 tests) now walks the same tree and fails on a bare citation, on a missing de-citation record, and on any file presenting `design-task.md` as live authority; it prints the census on every run. **Excluded on purpose:** dated transcripts in `docs/audit/evidence/` and `report.md` — editing them to add a pointer would falsify the evidence they record.
- [ ] **DEBT-004 expires 2026-10-31** (24 days) at `[PROVISIONAL COMPLIANCE DD-4]` — renew, resolve, or accept the block; §2.2 of that register makes expired debt block BG gate clearance — **not engineerable; owner decision, 17 days from this writing.** Recorded rather than pre-empted: the three allowed outcomes are business choices, and "renew" without the Brand Owner/Engineering Lead named in §2.2 would manufacture an approval. What an engineer can do is state the consequence honestly, which `docs/design-debt-register.md` §2.2 already does — an expired item blocks BG gate clearance — so closing TSK-09's push does not clear this and the debt must be decided before the next gate review.
- [x] DEBT-008 remains `TARGET` until TSK-46 produces an artifact — **closed 2026-10-14 with the cross-reference corrected in the open.** The artifact exists and the row no longer reads `TARGET`: DEBT-008 is now `[MEASURED MISS 2026-10-14]` in `docs/design-debt-register.md:22` with the four byte budgets restated from measurements (served `/assets/styles.css` 212,853 B uncompressed / 40,611 B gzip; public shells 20,308 B and 17,945 B; SCR-BCST-01 21,162 B; one operational view 250,409 B over identity encoding, 47,352 B gzipped) and reproduced by `tests/unit/performance-budget-measurement.test.ts`. **This box cited the wrong task.** DEBT-008 is the low-bandwidth mobile payload budget, which is TSK-42's subject; TSK-46 is accessibility conformance claim hygiene and produced no stylesheet artifact — its artifact (`tests/unit/a11y-claim-hygiene.test.ts`) closes TSK-46's own boxes. The box was closed on the substance (measurement landed, guard exists, register row updated), and the mis-citation is recorded here instead of being quietly reinterpreted. Paying the debt off is the *other* open item — `TSK-50` box 3, which stays open because the stylesheet still overruns and that test deliberately fails loudly if it ever stops doing so.

**Evidence:** `docs/audit/evidence/tsk40-design-debt-2026-10-14/README.md` (per-file census as the guard prints it, the six re-keyed sites with their line-preserving form and why 729 router pins forced it, the `AFCA-EDT-201` false positive, the TSK-46/TSK-42 mis-citation, and what the closure does not claim).

#### TSK-41 · P2 · CCPP §3 governance structure *(CA-23)* · **Depends:** TSK-39
`CCPP-001-R1.1.md:195-249` prescribes a governance layer. Missing: `docs/architecture/{overview,domains,integrations,deployment}.md` (dir holds only `descoped-modules.json`), `docs/domain/{canonical-model,data-dictionary,state-machines,systems-of-record}.md`, and the directories `docs/api`, `docs/events`, `docs/broadcast`, `docs/azeebo`, `docs/security`, `docs/privacy`, `docs/testing`, `docs/migrations`, `docs/operations`, `docs/prompts`. Test dirs `tests/domain`, `tests/e2e`, `tests/migration` absent (`contract`/`a11y` exist under other names).
CCPP permits structural adaptation to the real stack — but the **relationships** are substantive and genuinely missing, and are the same root cause as CA-12/CA-14.
- [x] `docs/security/threat-model.md` written (required by CCPP §16, line 1439+) before the next gate review — **closed 2026-10-15.** §16 re-opened on the current tree: it runs `docs/authorities/VMNL-AZP-VMN-CCPP-001-R1.1.md:1439-1522` and prescribes nineteen `<scope>` areas, ten fields per threat, twenty-one explicit vectors, the output path, and "Do not fix severe findings by hiding functionality in the UI." The artifact (410 lines) is that shape and nothing else: **19** register sections (§2.1–§2.19), **24** `#### TM-*` threat blocks each carrying all ten §16 fields and a STRIDE class, a **19**-control inventory (§1, `C1`–`C19`) in which every control is a `file:line` on this tree rather than an intention, §3's status row for each of the 21 vectors — **7 `EXERCISED`, 10 `PARTIAL`, 4 `NOT_EXERCISED`**, with severity census **11 High / 11 Medium / 2 Low** — and §4 stating what the document does not claim. `tests/unit/threat-model.test.ts` (6 tests) holds it there: the area and vector lists are **parsed from the CCPP text** rather than copied into the test (which matters — §16 ends each list with a full stop, and a `;$` parser silently returned 18 and 19), every one of the **166** `path:line` pins is opened, the **67** symbol-anchored ones are checked for the identifier within ±3 lines (a stale-but-in-range pin is Rule 9's failure mode, and this is the only check in the repository that catches it for this document), an `EXERCISED` row must name an instrument that exists, the tally sentences must equal the measured tallies (they were wrong once while this was written: "six `PARTIAL`" where the rows count ten), and no mitigation may be a UI hide. Severe findings are recorded for their tracks, not patched into this commit and not hidden: **TM-FED-02** `High` — `src/modules/federation/azeebo/bridge.ts:134` reports `DELIVERED` for a webhook no transport was given, and `src/api/router.ts:6958`'s `? 200 : 503` therefore never reaches 503, its Rule 2 source being the ADR-008 Level 4 decision record; **TM-ATH-02/TM-ADM-01** `High` — the `Secure` cookie flag, the `x-test-role` read and the dev fallback secrets all key off an exact `NODE_ENV` string; **TM-AUT-02** `High` — the tenant predicate TSK-58 records as unreachable from HTTP. *"Before the next gate review" is satisfied in the sense the box can be: the artifact exists and is guarded; it does not clear a gate, because the four `NOT_EXERCISED` vectors and the owner-side items (TSK-09's push, TSK-15, TSK-36, TSK-31, TSK-45) are unchanged by writing it.* Evidence: `docs/audit/evidence/tsk39-citation-integrity-2026-10-15/`.
- [x] `docs/domain/state-machines.md` and `docs/domain/systems-of-record.md` written **from the real code** — **closed 2026-10-15, by instrument rather than by re-reading.** `systems-of-record.md` has been guarded since TSK-52 (`tests/unit/systems-of-record.test.ts` recomputes the 43-model census and opens every pin); the state-machine document had no equivalent, so `tests/unit/state-machine-doc-pins.test.ts` (7 tests) is that equivalent: every `path:line` citation (**30** measured) must open on a non-blank line, every `[TAG]` `:NN` pin (**54**) must point at a line that actually carries that refusal code somewhere in `src/`, every `symbol` `:NN` pin (**12**) likewise, §1.2's eleven transition rows and §8's **49** refusal codes are counted out of `src/modules/broadcast/versions/index.ts`, §8's Durable column is checked against the set the process registers with `registerDurableStore` (that set is itself pinned to **15** names, so a new durable store cannot appear without a document row), and §8's three re-measure commands still produce what the document claims. **Running it found real drift, which is the point:** four §8 rows still read `no` for lifecycles TSK-17/TSK-60 made durable (approval, content revision, case, sales deal), six pins had slid (`registerVersion` `:73`→`:59`, `CaseStatus` `:9`→`:12`, `TRANSITIONS` `:74-80`→`:104-110`, `transitionCase` `:89`→`:120`, `assignCase` `:82`→`:112`, `[CASE-03]` `:92-93`→`:124`, `[VTM-ESC-06]` `:325-328`→`:326-328`, `[BIL-MG-02]` `:249`→`:258`), three sections described a pre-TSK-17 `new Map()` as the store of record, and two citations were relative-short (`rights/registry.ts`, `quality/gates.ts`) so no tool could resolve them. All are re-pinned to measured lines and the sentences rewritten; the document's header now records the 2026-10-15 re-measure and names its guard. *What this does not buy:* the guard proves a pin lands, never that the sentence about it is true (Rule 9 stays human), and it deliberately asserts nothing about whether each machine is correct. Evidence: `docs/audit/evidence/tsk41-state-machine-doc-pins-2026-10-15/` (`README.md`, `guard-run.txt`).
- [x] Remaining directories created with real content, or a decision record cites CCPP's adaptation clause for each omission — **closed 2026-10-15 on the record branch.** `docs/decisions/DEC-CCPP-SECTION3-STRUCTURE-001.md` re-opens `CCPP-001-R1.1.md:195-249` on this tree, quotes the two operative sentences (`:247` "The precise structure may adapt to the real stack." / `:249` "The governance relationships may not."), then maps every prescribed path to the file or suite that carries the relationship today — `docs/adrs/` (13 ADRs + README) for `architecture/adr`, `docs/runbooks/` (3) for `operations`, `docs/security/` (2) for `security`, `prisma/migrations` + the TSK-06/TSK-09 deploy artifacts for `migrations`, `docs/security/route-authorization-coverage.md` + `ADR-005` + `tests/contract/openapi-contract.test.ts` for `api`, and so on — and states the measured census by command (`find docs -maxdepth 1 -type d` → 11; the eleven prescribed paths `docs/{api,broadcast,azeebo,privacy,testing,migrations,operations,prompts}` and `tests/{domain,e2e,migration}` → **all ABSENT**). **No empty directory was created**, which was the failure mode CA-23 described: three rows are recorded as **NOT CREATED** with the reason and the task that owns the real artifact — `docs/privacy/` (DPO-owned, `HD-04`/`HD-05`; the controls exist in code, the policy document does not), a standalone OpenAPI spec (TSK-56's scope), and a `deployment.md` narrative (TSK-57, unrunnable here: `docker info` → exit 127). *Dependency assessed, not assumed:* this row names `TSK-39` as its `Depends`, and TSK-39 boxes 1–2 are still open — but box 2 measures code and box 3 records structure, neither reads the missing authority documents, so the dependency did not block them; what TSK-39 *does* still gate is any claim that §3's `docs/authorities/` set is complete, which this row explicitly does not make.

#### TSK-42 · P2 · Prioritize the un-substantiated sweep claims
**Source:** `report.md §6` · **Owner:** whoever runs the next audit
- [x] Check the two open sweep items that could not be re-measured: shipped stylesheet size vs the frozen 25 KB / 65 KB budgets, and the extent of unescaped interpolation into rendered HTML — as tests, not opinions — **measured 2026-10-14.** Stylesheet: the page budgets are **met** (`/` 20,308 B, `/channels/nxtr` 17,945 B ≤ 25 KB; SCR-BCST-01 21,162 B ≤ 65 KB) and the **stylesheet is not** — `/assets/styles.css` ships **212,853 B** identity (40,611 B gzip as the server encodes it), 8.3× DEBT-008's single-stylesheet wording, and one operational view totals **250,409 B** against the 120 KB budget (47,352 B only once gzip is negotiated). Interpolation: **299** bare `${x}`/`${a.b}` sites on markup lines that do not mention `escapeHtml(`, across **32** files, top eight carrying 163 — recorded as a **ceiling, not a defect count** (numeric fields, CSS tokens and already-escaped locals are inside it; nothing is claimed exploitable), with the escape mechanism itself proven on text/attribute/URL break-out characters (`escapeHtml`, 395 call sites). Tests: `tests/unit/performance-budget-measurement.test.ts` (5) and `tests/unit/html-escape-census.test.ts` (4, ratchet-pinned like `scripts/explicit-any-budget.js`). Timing budgets are measured in the artifact but **not asserted in the suite** — a sandbox TTFB assertion would make the gate environment-dependent. Miss is DEBT-008 (`MEASURED MISS`, owner Lead Frontend Architect, expiry 2026-12-31); census is DEBT-009. No budget was relaxed to accommodate the stylesheet (Rule 0.3).
- [x] Keep §6 of `report.md` as a standing "do not re-investigate" list so effort is not spent on disproven claims — the table now states that convention under its own heading and carries the two new rows with the task and date that closed them, each naming the test to re-run instead of the source to re-read. §6 remains the audit's own record; nothing in it was deleted to make a column tidy.

**Evidence:** `docs/audit/evidence/tsk42-budget-sweep-2026-10-14/` (method, environment, per-surface rows with re-run reproduction, the two-gzip-number reconciliation, the 403 row kept rather than dropped, census rule restated, and what the sweep does *not* claim) + `measurements.txt` + `measure-perf.mjs`.

**Residual handed to the frontend track, not closed here:** triaging which of the 299 sites receive externally-sourced strings, and the CSS pipeline work (split/purge/minify) that would actually pay off DEBT-008.

---

### TRACK I — Testing, traceability & accessibility (P1/P2)

#### TSK-43 · P1 · Make the AC traceability index true *(CA-21)*
**Source:** `report.md CA-21` · **Depends:** TSK-02
`docs/audit/ac-traceability-index.md` marks journeys **VERIFIED** with AC-ID blocks. Grep of the literal IDs in `tests/` finds only `AC-UI-RL1-R03-01…06,08,11` and `AC-SCR-03-01…03`. **Claimed but absent from every test file:** `R03-07/09/10/12` (while that row claims "12 criteria — full AC coverage"); **all** of `R02-01…14`, `R05-01…09`, `R06-01…12`, `R07`, `R08`, `R09`, `R10`, `R11`; `AC-SCR-03-04`, `AC-SCR-03-05`; `AC-PRC-08-01`. The file's own maintenance rule (`:25`) invalidates a completeness claim without an indexed AC block — by that rule most of the index is currently invalid.
- [x] For each row: literal AC IDs present as assertion labels in the cited test, **or** the row downgraded to `IMPLEMENTED`/`PARTIAL`
- [x] A CI check greps claimed AC IDs against the tests and fails on a mismatch
- [x] No row claims "full AC coverage" without every ID present

**Evidence (2026-10-07, TSK-43):** `tests/unit/ac-traceability.test.ts` (7 tests, runs inside `pnpm test`
therefore in CI) parses the index table, expands every claimed ID range into discrete IDs, greps each literal
ID across `tests/`, and fails on: a `VERIFIED` row with an unlabelled ID or no declared ID; any row whose
status cell asserts full coverage while an ID is missing; a cited evidence path that does not resolve; a
`DRILL-VERIFIED` row with no artifact. Measured census — 15 rows · **97** claimed IDs · **11** labelled
(`AC-UI-RL1-R03-01…06,08,11`, `AC-SCR-03-01…03`) · **86** unlabelled · **0** rows eligible for `VERIFIED`;
pins are `expect(claimed).toBe(97)` / `expect(labelled).toBe(11)`.
The index now carries those measured statuses (R03 `PARTIAL` 8/12, SCR-03 `PARTIAL` 3/5, PRC-08
`DRILL-VERIFIED`, 8 journeys `IMPLEMENTED`, R13 `NOT_RUN`, R12 `PARTIAL`, R14 `NOT_TESTED`) — no `VERIFIED`
row remains, because none is provable. The label corpus **excludes this suite's own file**: the ID literals it
uses as test *data* were counted as assertion labels in the first run (`R03-07` read as covered), which is the
same range-read-as-census error CA-21 reports. Two further instrument defects were fixed the same way: the row
parser absorbed the new prose tables as claims, and the ID regexes matched no 4-segment ID.
Not closable here: assigning the 86 unlabelled ordinals requires `VMNL-AZP-VMN-UIUX-001`, absent from
`docs/authorities/` (**TSK-39**) — promoting a journey to `VERIFIED` by guesswork is refused (Rule 0.3).
Gate on this commit: `pnpm build` 0 · `pnpm lint` 0 · `pnpm test` 56 files / 624 tests, 0 skipped.
Artifact: `docs/audit/ac-traceability-index.md` (Measured census section).

#### TSK-44 · P1 · Restore the security and contract suites as gates *(CA-02/CA-17)* · **Depends:** TSK-02
**Closed 2026-10-09 except the commit half of box 3, which `TSK-09` landed 2026-10-15 — TSK-44 is now `DONE` for its engineering scope.** CA-02/CA-17 recorded that
the security, contract and a11y suites were not gates. Two of the three boxes are measured green on
this tree. The third bundled two different claims that did not come out the same way, so it is split
and the unachievable half is marked blocked rather than ticked (Rule 0.3).

- [x] `tests/security/*`, `tests/contract/openapi-contract.test.ts`, `tests/a11y/*`, `tests/integration/enterprise-end-to-end.test.ts` all load and pass — **measured 2026-10-09**: `npx vitest run tests/security tests/contract tests/a11y tests/integration` → **11 files / 127 tests passed, 0 failed, 0 skipped**, exit 0 (34.5s against real Postgres). Per file: `security/abuse-and-fuzzing` 8 · `security/route-authorization` 13 · `security/route-guard-parity` 6 · `contract/openapi-contract` 10 · `a11y/accessibility-audit` 6 · `a11y/responsive` 6 · `a11y/visual-regression-baseline` 6 · `integration/enterprise-end-to-end` 42 · `integration/enquiry-failure-drill` 9 · `integration/journey-failure-drills` 13 · `integration/rights-clearance-e2e` 8. The four glob families are 8 files; the run carries the three neighbouring integration suites as well, because a claim about a directory has to hold over the directory. The same 11 files load inside the default `pnpm test` (65 files / 746 tests — `docs/audit/evidence/tsk13-canonical-client-portal-2026-10-09/test-run3.txt`), so they gate every suite rather than running by explicit invitation.
  **What this does not mean:** the a11y family asserts against rendered HTML strings (`tests/a11y/accessibility-audit.test.ts:20-22` builds `renderMasterLayout(...)` and inspects the bytes) — no browser is involved, so this closes CA-02, not `TSK-45`/`HD-10`. The contract suite does bind a real server (`tests/contract/openapi-contract.test.ts:17`).
- [x] Coverage threshold gates (`vitest.config.ts:24-29`: lines 72 / branches 62 / functions 77 / statements 73) enforced **on this tree** — the run clears them at **78.47 / 69.89 / 82.19 / 79.74** (`docs/audit/evidence/tsk13-canonical-client-portal-2026-10-09/test-coverage.txt`), the gated step exists in the workflow (`.github/workflows/ci.yml:94-95` → `pnpm run test:coverage`, script `package.json:16`, provider dependency `@vitest/coverage-v8` `package.json:57`), and the serial pool settings the DB suites depend on are in the same file (`vitest.config.ts:14-16`, TSK-05).
- [x] **"…and the config committed (TSK-09)"** — closed 2026-10-15 on the commit series. Re-run of the two commands that made this box unsatisfiable: `git status --porcelain vitest.config.ts .github/workflows/ci.yml package.json` → **0 lines**, and `git cat-file -e HEAD:vitest.config.ts` → exit **0** (`2ce8fab`). A CI checkout now sees the gate: `git show HEAD:.github/workflows/ci.yml` line **95** is `run: pnpm run test:coverage` and `git show HEAD:package.json` line **16** is `"test:coverage": "vitest run --coverage"`. What this still does **not** claim: no workflow has *executed* — the green numbers are local runs of the same commands CI runs (`docs/audit/evidence/tsk09-commit-series-2026-10-15/`), and the first real CI result is `TSK-57`.
- [x] Zero skips, or each skip justified in the register — **measured 2026-10-09**: 0 skipped / 0 todo in the focused run, 746 passed / 0 skipped in the full run, and `grep -rnE '\b(xit|xdescribe|xtest|it\.skip|test\.skip|describe\.skip|it\.todo|test\.todo)\b' tests` → **0** matches. The 4 skips the audit recorded were cascade artifacts of `TSK-01`, which closed them.

Gate on this increment, all measured on one tree after these edits landed: `pnpm typecheck` exit 0 ·
`pnpm lint` (`eslint . --max-warnings 0`) exit 0 · `pnpm test` → **65 files / 746 tests passed, 0
failed, 0 skipped**, exit 0. No `src/**` or `tests/**` file was edited — this is measurement plus
these entries — so the pin in `docs/handoffs/LATEST.md` (78.47 / 69.89 / 82.19 / 79.74 coverage) is
unchanged and still current. Evidence:
`docs/audit/evidence/tsk44-suites-as-gates-2026-10-09/` (`README.md`, `focused-run.txt`,
`measurements.txt`, `test-final.txt`, `typecheck.txt`, `lint.txt`).

#### TSK-45 · P2 · Real-browser accessibility run *(AUD-19)* · **Depends:** TSK-09, `HD-10`
`pnpm test:a11y` is `playwright test`, and `@playwright/test` is a devDependency — but **the browser run is not wired**: there is no `playwright.config.*` in the repository root (re-measured 2026-10-16). **Correction 2026-10-16 (TSK-63): this stem's "no `axe-core` dependency" was true of its 2026-10-14 measurement and is no longer true of the tree** — `package.json` now carries `@playwright/test` ^1.63.0 and `@axe-core/playwright` ^4.13.0 as devDependencies, so the dependencies exist and the gap is the wiring, not the install. `pnpm test:a11y` was repointed from `playwright test` (no config to read, and Playwright's default matcher would have picked the three Vitest files under `tests/a11y/` up as browser specs) to `vitest run tests/a11y`, so the script runs what exists while this item writes the real browser suite. Those three files are Vitest suites (HTML-shape, responsive, visual baseline) that already run inside `pnpm test`. So this item does not need a run of something that exists — it needs the config, the axe wiring, and the six-viewport scenario written first. No browser verification has run in this environment.
- [ ] Playwright config wired (the browser dependencies — `@playwright/test`, `@axe-core/playwright` — are already installed as of 2026-10-16), then the suite executed across the six target viewports with keyboard-path and focus-restoration tests
- [ ] Results archived; automated-only status stated as automated-only until `HD-09` closes — the qualifier is already propagated through `docs/handoffs/LATEST.md`, `docs/audit/evidence-register.md` (`EVD-10-A11Y` now reads `NOT_PROVEN` for the browser run) and two source comments, and `tests/unit/a11y-claim-hygiene.test.ts` keeps it attached

#### TSK-46 · P2 · Accessibility conformance claim hygiene
- [x] "WCAG 2.2 AA compliance verified" never appears without distinguishing automated from manual — the downgrade at `docs/handoffs/LATEST.md:275` is correct; propagate it — **propagated 2026-10-14 and now guarded, not just re-worded.** Swept every `.md` under `docs/` and every `.ts` under `src/` for the conformance phrases (`AA compliant`, `AA compliance verified`, `AA conformant`, `AA conformance verified`): four carried them without a qualifier and each is now qualified — `docs/handoffs/LATEST.md:315` (token contrast + HTML shape are what the suite checks; manual coverage `NOT_RUN`), `docs/audit/evidence-register.md:157` (`EVD-10-A11Y` states automated-only, manual §7.5 `NOT_RUN`, browser run `NOT_PROVEN`), `src/web/public/screens-view.ts:8` and `src/web/styles/index.ts:5` (source comments read by operators, so the same rule applies to them). `tests/unit/a11y-claim-hygiene.test.ts` recounts the sweep by that rule and fails on any unqualified claim, so a future page cannot re-grow the bare assertion. Two phrases were left alone deliberately: `docs/decisions/design-task-de-citation.md:19` states the *requirement* (canonical law 19), not an achieved state. **One "exception" this bullet first published was itself a phantom, and it is withdrawn rather than kept:** the sweep record cited `docs/audit/forensic-report-va-mnl-csrm-cloud.md:79` (citation:absent) as a third party's claim inside a forensic report. No such file exists in this repository — `ls docs/audit/*forensic*` returns exactly one row, `CC-ARCH-001-forensic-report.md`, and its line 79 is the fifth site the guard caught. Same line number, same word "forensic", different document: a confident citation to a path that was never opened, which Rule 0.2 treats as a defect in my own text and not as a rounding error. **The guard then caught a fifth site the first sweep had missed** — `docs/audit/CC-ARCH-001-forensic-report.md:79`, a build-target cell reading "Extract Figma/PDF token design systems into WCAG 2.2 AA compliant React/Web components". It is an instruction, not an achieved-state claim, so rather than file it as an exception the wording now reads "React/Web components built to WCAG 2.2 AA.", which states the same target without asserting conformance. After that edit the sweep reports **0** unqualified sites across `docs/**.md` and `src/**.ts`.
- [x] Manual §7.5 coverage recorded as `NOT_RUN` until `HD-09` — recorded in both documents the test reads (`docs/handoffs/LATEST.md:275`, `:453` and the `EVD-10-A11Y` row), and asserted by `tests/unit/a11y-claim-hygiene.test.ts` so the state cannot silently upgrade. **`HD-09` remains open: this box records the absence of manual coverage, it does not provide any.**

**Evidence:** `tests/unit/a11y-claim-hygiene.test.ts` (4 tests: the claim sweep, the `NOT_RUN` record, the browser-run `NOT_PROVEN` record, and the wiring check below) + `docs/audit/evidence/tsk46-a11y-claim-hygiene-2026-10-14/README.md` (the five sites and their before/after, the two phrases left alone with reasons, the two corrections to my own first draft of the test, and what the closure does not claim — including that it provides no manual coverage).

**Found while checking the claim, and it changes TSK-45's premise:** `pnpm test:a11y` is `playwright test` and `@playwright/test` is a devDependency, but there is **no `playwright.config.*` at the repository root and no `axe-core` dependency** — so "(Playwright + axe) exists" was only true of the npm script name. *(Superseded 2026-10-16 by TSK-63: the dependency half has since changed — `@playwright/test` and `@axe-core/playwright` are now installed devDependencies and `test:a11y` runs the Vitest a11y suites — while the wiring half is untouched: still no Playwright config and no browser run.)* The wiring gap is recorded in TSK-45's stem and pinned by this file's fourth test; TSK-45 stays open because writing the config, the axe wiring and the six-viewport scenarios is the work, and it depends on `TSK-09` and `HD-10`.

#### TSK-47 · P2 · Failure-drill coverage for newly durable domains · **Depends:** TSK-17 — **CLOSED 2026-10-12**
13 journey failure drills exist and pass when the tree compiles. The durable set this item was raised
against has grown since: TSK-17's ten domains, plus TSK-19's provider claim, TSK-32's ledger, TSK-16's
sponsorship pair, TSK-60 box 3's deal portfolio and TSK-18's audit ledger.
- [x] Each domain made durable in TSK-17 gains a restart/failure drill — **all 16 durable domains have a restart drill, and the claim is now an instrument rather than a sentence.** `tests/unit/durability-drill-coverage.test.ts` (**9 tests**) reads the three places the claim lives and fails when they stop agreeing: the `registerDurableStore<…>("key"…)` call sites in `src/` (**15**, discovered from the tree, not listed from memory), the restart reader's branches (**16**), and the `restartRead("<entity>"` calls in `tests/unit/durability-release-critical.test.ts` (**18** across all 16 entities — `enquiry` and `salesDeal` are restarted twice). It fails in both directions: a store registered in `src/` with no row in the domain table **and** a reader branch no domain claims are both orphans, so the only way to add a durable domain is to give it a drill in the same change. Census printed on every run: enquiry 2 · approval 1 · case 1 · risk 1 · issue 1 · destination 1 · mediaAsset 1 · session 1 · idempotency 1 · content 1 · journal 1 · sponsorBinding 1 · sponsorFulfillment 1 · salesDeal 2 · auditLedger 1 · providerClaim 1 *(the claim is a unique row, not a journal-staged store, and is labelled as such).* **How this row re-measured on 2026-10-12, the honest way:** TSK-18 registered a fifteenth store and the instrument went **red in two places** — the domain table had no row for it, and the `auditLedger` reader branch was an orphan — which is precisely the failure this file was written to make loud. The row was added, not the assertion; the audit domain's restart drill is the 201-enquiry case (`durability-release-critical.test.ts:697`), which asks a child process for the ledger entry that attests the enquiry, and its failure half is the crash-between-writes case in `tests/unit/audit.test.ts:287`.
  - *The failure half, not just the restart half.* The same file requires the drills that answer "what happens when the write does not land": the rejected-row **503** + rollback drill (`durability-release-critical.test.ts:703`), the journal-level rollback/`RepositoryUnavailableError` drill (`:802`), the sandbox-deferred census drill (`:603`), the cross-process provider replay drill (`:724`) and the unregistered-store refusal (`:828`), each matched by label and, for the last two, by the seam itself (`stageDurableWrite` throwing for an unknown store key). **Added 2026-10-16 (TSK-61's single-flight regression): the concurrent-drain serialization drill (`:834`) — a gated persister holds one flush inside its transaction while a second arrives, pinning that a queued drain can never take the in-flight one's batch (the interleaving that once answered 201 for a rolled-back row); the declared-count pin moved 19 → 20 with it.** Positions re-pinned 2026-10-16 (the serialization drill was inserted above the unregistered-store case, moving it `:828` → `:894`, the journal rollback `:802` → `:808` and the replay drill `:724` → `:723`); before that, TSK-18's `auditLedger` restart read grew the 201-enquiry case by ten lines, which moved every drill below it.
  - *A restart must be a restart.* Three source-shape pins, because the defect CA-12 described was a Map echoing itself: the suite must spawn the reader (`execFileSync(process.execPath, [RESTART_READER…`), must treat `database: false` as a failed measurement rather than an empty record (`expect(result.database…).toBe(true)`), and must rebuild `dist/` when `src/` is newer (`ensureCompiledArtifact` → `TSC_BIN`) so a stale artifact cannot be certified as durable.
  - *The register's own number is now guarded.* The preamble above says **13** journey failure drills; the test parses that sentence out of `tasks.md` and compares it with the `it("DRILL-` count in `tests/integration/journey-failure-drills.test.ts` (13, ids printed per run: `APP-01/02, SCHED-01, RIGHTS-01, RECON-01/02, PUB-01, NAV-01, FIN-01/02/03, GATE-01, TRAFFIC-01`). Editing the prose without the drills, or deleting a drill without the prose, fails.
  - *Not claimed:* that a drill exists for every field of every store (each drill pins the business contract its domain's register item names, not the whole row), and that these measurements mean anything without Postgres — the suite warns and skips rather than passes (`Rule 0.4a`); the recorded run had a reachable database.

---

### TRACK J — Operations, performance & observability

#### TSK-48 · P2 · Finish the style migration safely *(CA-26, AUD-20)* · **Depends:** TSK-01
This migration is the direct cause of CA-01. 37 `style="` occurrences remain — **measured 2026-10-07: 31**, all of them inside `${…}` (`grep -roE 'style="[^"]*\$\{' src/web src/api | wc -l` = 31; static = 0). *(That ${…}-only sweep was itself superseded: re-measured across all of `src/` on 2026-10-16 at **56 occurrences / 52 lines / 19 files**, ratchet-pinned — see the atomic-change bullet below.)*
- [x] `scripts/migrate-inline-styles.mjs` hardened to skip expressions inside `${…}` and to reject duplicate `class` attributes (see TSK-49) before it is re-run — **measured 2026-10-07**: the transform now walks whole tags (the old line-local merge is what emitted `class="a" class="b"`), skips any tag containing `${` or a backtick, refuses to run on a runaway match, merges into an existing `class` instead of appending a second one, and validates every file before the first write. `node scripts/migrate-inline-styles.mjs --dry-run` → `files changed: 0 · migrated static attributes: 0 · utility classes in the sheet: 1399 · inline style attributes remaining: 31`, exit 0
- [x] Property-based/fixture test on the transform: valid TS in ⇒ valid TS out, semantics preserved — `tests/unit/inline-style-codemod.test.ts` (7 tests): multi-line merge pins exactly one `class` per element with the utility class appended; a `${…}` tag is byte-identical after the transform; an element with no `class` gets one inserted without losing `href`; a source that would emit `class x2` throws before any write; and the CLI is driven over a temp fixture tree for `--dry-run` (source and sheet untouched) plus a second run asserting `files changed: 0` (idempotence). `Test Files 53 passed (53) / Tests 605 passed (605)`, `pnpm build` 0, `pnpm lint` 0
- [ ] Remaining inline styles migrated, then `style-src 'unsafe-inline'` dropped from the CSP as one atomic change — **still open**: the remaining sites are runtime-computed styles, so they cannot be codemod-covered; each needs a hand-written whitelisted variant class. Until the last one is gone the CSP must keep `unsafe-inline`, so this stays unchecked even though the tool is now safe to re-run. **Re-measured 2026-10-16 (TSK-63): 56 `style=\"` occurrences across 52 lines and 19 files under `src/`** — the register's earlier "31" counted only `${…}`-interpolated sites in `src/web src/api` and had drifted from the tree uncounted. Both halves of the atomic change are now pinned by `tests/unit/style-migration-ratchet.test.ts`: the census may not grow past the recorded ceiling of 56, and `style-src 'unsafe-inline'` (`src/api/router.ts:1128`) may not disappear while any occurrence remains — nor survive the last one.

#### TSK-49 · P3 · Fix the two dropped-attribute render sites *(CA-30)*
`src/web/broadcast/index.ts:596` renders `class="s-sj5T5qvyn0" class="vmn-pulse-dot"`; `src/api/router.ts:6337` renders `class="s-NpaiBgA8Dx" class="card"`. HTML parsers keep the **first** duplicate and ignore the rest, so `vmn-pulse-dot` and `card` are silently lost and those elements render unstyled even after the build is fixed.
- [x] Merged into a single `class` attribute at both sites — **measured 2026-10-07**: `src/web/broadcast/index.ts` renders `class="s-sj5T5qvyn0 vmn-pulse-dot"`, `src/api/router.ts` renders `class="s-NpaiBgA8Dx card"`; both pinned by `tests/unit/rendered-html-invariants.test.ts`
- [x] Lint or test rule rejecting duplicate attributes in rendered HTML — **measured 2026-10-07**: `findDuplicateAttributes()` runs over **rendered bytes** (a static scan of TS templates is defeated by `${cond ? \`class="x"\` : ""}`, which is how CA-30 survived review) and is asserted across every shell, all `BROADCAST_SCREEN_INVENTORY` screens via `renderBroadcastScreenHtml`, and all `ENTERPRISE_WORKSPACES` desks via `renderWorkspaceDeskHtml`; a third test scans every `src/**/*.ts` line for the same-line `attr="…" attr="…"` signature. 3/3 green; the same guard is now inside the codemod (TSK-48), so the defect cannot be re-introduced by a future migration run.

#### TSK-50 · P2 · Performance budget measurement *(CA-25)*
`docs/audit/performance-budgets.md` fixes five budgets (≤65 KB critical HTML, ≤25 KB public shell, ≤120 KB per operational screen view, TTFB ≤200 ms, MCR filler ≤3 s) and a four-step measurement procedure. All remained **TARGET** and `docs/audit/evidence/perf-<date>/` did not exist. **Measured 2026-10-14** — see the table now appended to `docs/audit/performance-budgets.md` and the artifact directory below. Of the four *byte* budgets (the three above plus DEBT-008's 25 KB single stylesheet): the critical-HTML and public-shell budgets are **met**, the per-view budget is **met only once gzip is negotiated** (47,352 B; 250,409 B over identity encoding, so it is recorded as a miss for the transport the client may not negotiate), and the stylesheet budget is **missed by 8.3×**. TTFB measures 11–15 ms but **sandbox-only**, and the ≤3 s MCR interactive budget is still unmeasured — it needs a real browser, which is TSK-45.
- [x] Procedure steps 1–3 executed; medians archived with the candidate SHA — **done against the compiled bundle, not a production-environment boot, and the difference is stated rather than glossed.** `pnpm build` then `createApiServer(0)` on loopback, three samples per surface, identity encoding, medians in `docs/audit/evidence/tsk42-budget-sweep-2026-10-14/measurements.txt` with the candidate HEAD recorded at its top. Reproduced on a second run: every byte figure identical, TTFB 5–15 ms. Step 1's `docker-compose` / `NODE_ENV=production node dist/api/server.js` variant was **not** run: production boot requires the strict config path and real secrets this sandbox does not hold, so these remain sandbox numbers (Rule 0.4a) and no production claim is made from them.
- [x] Any miss recorded as a named debt with owner and expiry in `docs/design-debt-register.md` — **DEBT-008** moved from `TARGET` to `MEASURED MISS 2026-10-14` with its owner (Lead Frontend Architect) and expiry (2026-12-31) unchanged and the measured bytes recorded in its status cell; **DEBT-009** opened for the 299-site unescaped-interpolation ceiling with the same owner and expiry 2027-01-31. The budget text was not edited to make the measurement pass (Rule 0.3).
- [ ] G-gate §7.7 flips from `NOT_RUN` only on artifacts — **not flipped, deliberately.** The artifacts now exist, but the per-view budget misses outright over identity encoding (250,409 B vs 120 KB) and the only TTFB figure available is a warm loopback sandbox number, so a `PASSED` on §7.7 would not be evidence-backed. The stylesheet-transfer check this box asked for **is** done (TSK-42). Closing the box requires either the CSS pipeline work that pays off DEBT-008 or a human decision to re-budget — owner unnamed here because the register's own §5 lists no frontend owner; inventing one would be the defect CA-25 describes.

#### TSK-51 · P2 · Rollback/canary rehearsal *(PRC-07, CCPP §21)*
- [ ] `docs/runbooks/rollback-runbook.md` moved from TARGET to rehearsed, with preconditions executed on a scratch deployment — **the §3 half is now measured; the box stays open because the deployment half is not engineerable here.** Executed 2026-10-15 on PostgreSQL 18.3 against two scratch databases (`docs/audit/evidence/tsk51-rollback-rehearsal-2026-10-15/`, scripts + raw log in-tree): 13 migrations deploy onto an empty database in **27.38 s** (44 tables / 470 columns / 122 indexes), `pg_dump -Fc` snapshot in **0.51 s** (**104,960** bytes, 250 seeded rows), `pg_restore --exit-on-error --single-transaction` in **0.65 s**, and the restored target diffs **0 lines** against the source on columns, indexes, journal rows and data rows. The injected incident (newest journal row left unclean, as a mid-flight failure records it) makes `migrate status` exit 1 and `migrate deploy` refuse with **`P3009`**; the runbook's §3.3 command then clears it, and the full recovery path — revert DDL, `migrate resolve --rolled-back`, `migrate deploy` — measured **11.44 s** wall and left the schema identical with all 250 rows intact. **What the drill changed in the runbook:** §3.3 as written is *not* a rollback. Run alone, with the DDL never reverted, `resolve --rolled-back` exits 0 (it only rewrites `_prisma_migrations`) and the next `deploy` fails **`P3018` / SQLSTATE `42704`** (index `BroadcastEpisode_programmeCode_idx` does not exist) and re-enters the failed state — a loop, because this repository's migration SQL is bare `DROP INDEX`/`CREATE INDEX` with no `IF EXISTS`. §3.3 now prints the three ordered halves and the libpq `?schema=` trap the first two attempts fell into (recorded, not hidden). **Still outside the box, and not code:** §1's telemetry triggers and §2's `kubectl set selector` / `scale deployment/vmn-canary` switchback were not exercised — `vmn-canary`, `vmn-app-service` and `infra/k8s/*` do not exist, so there is no canary to roll back; precondition (1) is met only in the compose sense (`docker-compose.yml` committed) and the stack was never brought up because there is no Docker binary here (`docker info` exit 127 — the TSK-57 blocker), so this was a scratch-*database* drill on the local server, not a scratch-*deployment* one; precondition (2) needs a CI canary stage and (4) needs the owner to name an on-call. The runbook's STATUS stays TARGET and no readiness gate moved. *Observed while measuring:* the gate database `vmnl_enterprise_gates` carries **12** applied migrations against **13** directories and still holds the two pre-migration indexes — it is one index-only migration behind `prisma/migrations` while the suite passes either way; the rehearsal verified it was not modified (0 rehearsal rows, journal unchanged) and did not silently bring it up to date, because that would change what the next `pnpm test` measures.

#### TSK-52 · P2 · Domain documentation written from real code *(CA-23, blocks on TSK-39)*
- [x] `docs/domain/canonical-model.md` + `data-dictionary.md` reconciled with `docs/domain/master-data-model.md` and the actual model set *(the box said "the actual 27 models" when raised; `grep -c "^model " prisma/schema.prisma` is **42** as re-measured 2026-10-09 — TSK-17's five tables and TSK-19's `ProviderEventClaim` landed after this box closed, and `docs/domain/systems-of-record.md` §2 plus `canonical-model.md` §1 carry the live census — **28 of 42** then unnamed in `master-data-model.md` (re-measured 2026-10-11 after TSK-60's `SalesDealRecord`: **43 declared, 29 of 43 unnamed**, money columns **23** — 13 `Ngn`-named, 10 not — `DateTime` **110**, `@unique` in **26 of 43**) — enforced by `tests/unit/systems-of-record.test.ts` and `tests/unit/canonical-model.test.ts`. Written and guarded 2026-10-08. **The divergence, measured:** 27 declared models → **13 of them are not named anywhere in `master-data-model.md`** (`RolePermission`, `AuditLog`, `BroadcastChannel`, `Programme`, `BroadcastEpisode`, `AsRunLogRecord`, `AfcaCourse`, `FusionEvent`, `EventTicket`, `CommercialCampaign`, `TalentPayoutBatch`, `BankStatementRecord`, `DataSubjectRequest`), and **15 of 27 have no interface in `src/core/domain/types.ts` at all** — three of those 15 (`Role`, `Permission`, `UserRole`) *are* described by the intended model, so for the identity core the two sides share no vocabulary. The box's original note ("~13 core entities vs ~138 stores") is retired: 138 was a store count from an unanchored regex and has been replaced by the measured 37 module-level + 68 class-field stores in `systems-of-record.md` §3.3 (re-measured 2026-10-08 after TSK-32: **39 / 69** — §3.3 carries the live figure, and `tests/unit/systems-of-record.test.ts` enforces it). `canonical-model.md` reconciles §1/§3 of the intended model principle-by-principle and finds four of its five core principles **unenforced in code**: identity keyed on a process Map with synthesised `personId` (1.1), tenant scope unreachable from the guard (1.2 → new **TSK-58**), the 7-way separation validator never called (1.4 → new **TSK-59**), the evidence graph absent while a vault screen renders `evidence: []` (1.5), and contract `SIGNED` writable with no `signedAt` (3.4, protected only by the 503 at `src/api/router.ts:4154`). `data-dictionary.md` records five vocabulary layers — 10 Prisma enums/44 members/12 enum-typed fields, all ten mirrored verbatim as TS unions (drift-guarded), 46 state-shaped TS unions/219 members *(re-measured 2026-10-09 after TSK-16/TSK-33: **48 unions / 224 members** and **181 tags across 24 families / 189 occurrences**, the +3 unions and the whole `POA` family being the exception register's own vocabulary — §7 and §1 of `data-dictionary.md` carry the live figures and `tests/unit/canonical-model.test.ts` enforces them)*, **11 bare `String` columns carrying state defaults with no enum and no `CHECK`**, 111 `code:` response literals, 176 bracketed traceability tags across 23 families — plus money (15 `Decimal(14,2)` columns, **10 of which do not name their unit**, against a `Kobo` minor-unit brand nothing writes), time (65 `DateTime`, 26 `@default(now())`, no clock abstraction) and identifiers (27/27 `uuid()` PKs, 11 `randomUUID()` sites, 22/27 models with any natural key).)*
- [x] `state-machines.md` covering schedule, rights request, approval, content revision, case, admission, payment lifecycles as implemented *(written 2026-10-08 as TSK-12's box-3 deliverable: `docs/domain/state-machines.md` §1 schedule / §2 approvals / §3 rights request + clearance records / §4 content revision / §5 case / §6 admission / §7 payment-invoice-escrow, plus a §8 guarded-vs-unguarded census. Coverage note: the seven lifecycles this box names are all documented; the same §2–§7 also record the labels that turn out not to be machines at all — `MembershipStatus`, DSR, TEND delivery/payment, settlement (no caller in `src/`) — and the unguarded writes in admissions `recordDecision`, VTM `depositMilestoneEscrow` and sales `advanceStage`.)*
- [x] `systems-of-record.md` naming the authoritative store per entity (durable or sandbox-state) *(written and guarded 2026-10-08 — `docs/domain/systems-of-record.md`: four record kinds (D1 durable-authoritative, D2 durable-with-hydrated-index, S source-code-as-record, M process memory), a Prisma model census, an entity-by-entity authoritative store table with file:line for every store, the conditional-durability section (audit fire-and-forget write, DSR `RECORD_ONLY`, session/revocation KV asymmetry), and re-measure commands. **Measured 2026-10-08:** 27 declared models → 14 with at least one Prisma accessor in `src/` → only **10** written by application code at runtime (`Person`, `Project`, `BroadcastChannel`, `AfcaCourse` are touched by `src/db/migrate-and-seed.ts` only) → **13 never touched** (`User` `Role` `Permission` `RolePermission` `UserRole` `Organisation` `CreatorProfile` `Evidence` `Agent` `FusionEvent` `EventTicket` `TalentPayoutBatch` `BankStatementRecord`). **Re-measured 2026-10-09 (the §2 heading of `systems-of-record.md` carries this as the live figure):** **42** declared → **29** with at least one accessor → **25** written by application code at runtime → the **same 13** never touched — the 15 added models were all accessors, none of them closed the identity gap; three of those 13 have no runtime counterpart at all (`Organisation`, `CreatorProfile`, `Evidence` — interfaces in `src/core/domain/types.ts` and nothing else); 37 module-level + 68 class-field stores at the 2026-10-08 measurement (39 / 69 after TSK-17 and TSK-32, the current figures in §3.3)*

**Evidence:** *box 2* — `docs/domain/state-machines.md`, every line reference opened on the measuring
date, with re-measure commands in §8. `tests/unit/broadcast-schedule-lifecycle.test.ts:185` pins §1
against PRD §15 by parsing the authority itself, so the document cannot silently drift from the code.
*box 3* — `docs/domain/systems-of-record.md` plus `tests/unit/systems-of-record.test.ts` (**6 tests**,
inside `pnpm test`, therefore CI): the §2 accessor counts are recomputed from `src/` with a
multi-line-aware delegate regex, the grouped "zero accessors" row must equal the measured untouched
model set, every `` `file.ts:NN` `` citation in the document (including `:NN,:MM` continuations) is
opened and must be a non-blank line, each cited line must contain the symbol printed beside it, and
the published store counts (37/68) are re-derived. The first run of that instrument caught three of
this session's own errors before they shipped: `DataSubjectRequest` has no `CREATE TABLE` in
`0_init` (it arrives in `20261006120000_add_data_subject_requests`), two citations used bare
filenames that resolve to nothing, and an unanchored regex read 56 module-level stores instead of 37.
The accessor census itself also corrected an earlier undercount: a single-line regex had missed
`getPrismaClient().dataSubjectRequest.create` (`src/api/routes/privacy.routes.ts:71`) and the chained
`.auditLog.create(` (then `src/core/audit/index.ts:183`, since TSK-18
`src/core/database/repositories/release-critical.repository.ts:1051`), which is why `DataSubjectRequest`
and `AuditLog` are D1 rather than "untouched" (the audit ledger became **D2** with TSK-18 —
`systems-of-record.md` §2 row 9).
*box 1* — `docs/domain/canonical-model.md` + `docs/domain/data-dictionary.md`, both written from
measurement on 2026-10-08 and both guarded by `tests/unit/canonical-model.test.ts` (**13 tests**, so
inside `pnpm test`, therefore CI). The instrument recomputes: §2's whole model table (field counts by
the documented counting rule, `@unique`/`@@index` presence, `code` = accessor / seed-only / none, `in
doc` = the model name in `master-data-model.md`), §1's three headline numbers against that table, §3's
enum→model→accessor reachability chain, the data dictionary's five vocabulary counts, the §3
bare-`String` table **including the schema line number each column is cited at**, the money split
(15 `Decimal` / 5 unit-named / 10 unitless, zero `Int`/`Float` money), the six `Kobo` helper line
numbers, §5/§6's time and identifier counts, §7's code censuses and the three schedule counting rules,
and **every `file.ts:NN` / `file.prisma:NN` citation in both documents** (ranges and `:NN,:MM`
continuations included) must open on a non-blank line that carries the symbol printed beside it.
*What the instrument caught before it went green — five of this session's own errors:* the §2 row
parser read a 6-column table as 7 cells and matched nothing; the enum-typed-field regex let `\s+`
cross newlines and counted the ten `enum X {` declarations as fields (22 instead of 12); `types.ts:219`
and `repositories/index.ts:10` were cited as bare filenames, which resolve to nothing;
`src/modules/finance/sales/index.ts:93-112` ended on a blank line (the block is `:93-111`); and
`prisma/schema.prisma:283-285` pointed at the wrong span for the seven separation columns (measured then
`:281-287`, comment at `:280`; on the 2026-10-09 tree they sit at `prisma/schema.prisma:292-298`). The earlier draft's `RIGHTS_NOT_CLEARLED_AT_EXPORT` was a typo for the
real code `RIGHTS_NOT_CLEARED_AT_EXPORT` (`src/modules/broadcast/export/epg.ts:96`), its
`tests/security/route-guard-parition.test.ts` (citation:absent — a typo for the real `route-guard-parity.test.ts`) named a file that does not exist, and its "two entities
have no TypeScript interface" contradicted its own list — measured, it is **fifteen of 27**.
*Blocking note, stated rather than hidden:* this task's heading says "blocks on TSK-39". TSK-39 is
still open (`VMNL-AZP-VMN-UIUX-001` is absent from `docs/authorities/`), and it did **not** block these
two documents: a canonical-model/data-dictionary reconciliation compares the schema and `src/` against
`master-data-model.md` §1/§3, which is present locally. What TSK-39 does still gate is any claim that
this vocabulary matches the *UI* authority, so no such claim is made here.
*New register items raised by this measurement:* **TSK-58** (tenant scope unreachable from the central
guard, Track E) and **TSK-59** (canonical settlement invariants are dead code, Track F). Neither
inherits a `TODO-*` identifier, so neither gets a §1.4 census row, and the census stays pinned at 71
rows / 72 IDs. Track F's "verified good" preamble was corrected in place.

**Gate at this closure (2026-10-08, all four re-run on the same tree after every box in this task was
ticked):** `npx tsc --noEmit` 0 · `pnpm build` 0 · `pnpm lint` 0 · `pnpm test` exit **0** —
**63 files / 689 tests / 0 failed / 0 skipped / 0 unhandled errors** (from 61/671: +2 files, +18 tests —
`canonical-model.test.ts` +13 and `hygiene-guards.test.ts` +5, the latter being TSK-53's instrument).
TSK-52's three boxes are now all ticked, so this task is **DONE** under Rule 0.1; its work landed in
the TSK-09 series on 2026-10-15. What remains outside it is CI execution (`TSK-57`), which no
document in this repository may claim as done.

---

### TRACK K — Hygiene (P3)

#### TSK-53 · P3 · Preserve the verified-good hygiene
**Source:** `report.md CA-29` — do not regress these while fixing other things:
- [x] `.env` untracked and gitignored (`.gitignore:60`); `.env.example` free of live values; gitleaks in CI — **re-measured 2026-10-08**: `git ls-files .env | wc -l` → **0**; `git check-ignore -v .env` → ignored (rule `.gitignore:65` `*.env`, with `.env` itself at `:60` and `!*.env.example` at `:66` keeping the template tracked); `.env.example` carries **12+ secret-named slots and zero live values** (every secret-shaped value is empty or `${…}`); gitleaks is pinned to an immutable SHA in `.github/workflows/ci.yml:72` (`gitleaks/gitleaks-action@ff98106e4c7b2bc287b24eaf42907196329070c7 # v2.3.9`), not a floating tag. Guarded by `tests/unit/hygiene-guards.test.ts:43,:52`
- [x] `.env.example` shipping `ALLOW_SANDBOX_FALLBACK=false` (`:74`) and `ALLOW_MEMORY_KV_IN_PRODUCTION=false` (`:111`), with boot refusing fallback in production/staging — **both lines re-read on the measuring date**; the refusal is `src/api/server.ts:81-94`, which throws rather than degrading, and is asserted by `tests/unit/audit-remediation-regressions.test.ts:314` (boot) and `tests/unit/audit-implementation-hardening.test.ts:70` (memory-only KV). `tests/unit/hygiene-guards.test.ts:62` re-pins the two example defaults
- [x] `logStructured` emitting (`src/core/observability/index.ts:160-181`) — `console.log(serialized)` at `:180` is asserted by a real emission test, not a call-shape check: `tests/unit/hygiene-guards.test.ts:76` spies stdout and drives it through `new TelemetryService({})`, so a future refactor that builds the line and discards it goes red
- [x] Fail-closed repository mode as the default; per-deployment `ALLOW_SANDBOX_FALLBACK` decision, never a silent fallback — `src/core/database/repository-mode.ts:20-21` is `ALLOW_SANDBOX_FALLBACK === "true" ? "memory_fallback" : "fail_closed"`, i.e. **absent env resolves to fail-closed**; `getRepositoryMode() === "fail_closed"` under the test environment is pinned at `tests/unit/hygiene-guards.test.ts:71`

**Evidence:** `tests/unit/hygiene-guards.test.ts` (**5 tests**, in `pnpm test`, therefore CI) is the new
preservation instrument: a secret-shaped value in `.env.example`, a floating gitleaks ref, a flipped
default in the shipped example, a silent-fallback default in `repository-mode.ts`, or a `logStructured`
that stops emitting each fails the suite. The two boot refusals were already guarded
(`audit-remediation-regressions.test.ts:314`, `audit-implementation-hardening.test.ts:70`) and are
left exactly where they were rather than duplicated.

**Not claimed:** that gitleaks actually ran on a commit — CI has never executed on this branch (no Docker
binary here, `TSK-57`; TSK-09 landed 2026-10-15, unpushed) — what is verified is the *workflow file's* pinned, non-floating
scanner step and the local invariants it exists to protect. `.env` remains untracked and no secret was
committed in this pass.

#### TSK-54 · P3 · Router decomposition *(CA-28, AUD-18)* · **Depends:** TSK-09
`src/api/router.ts` is **8,245** lines (`wc -l src/api/router.ts`, measured 2026-10-15; 7,687 when CA-28 was raised — the monolith grew by 558 lines while Tracks B–E landed); `src/api/server.ts` registers no routes (delegates to `handleApiRequest`, imported `:38`, awaited `:593`); `src/api/routes/` still hosts only two domain routers (`enquiry.routes.ts`, `privacy.routes.ts`) beside `index.ts`/`types.ts`. Route ownership lives in three places.
- [ ] Domain routers extracted behind the existing `RouteDefinition` pattern, sequenced so the suite never goes red between steps
- [ ] No functional change bundled into the split (Rule 0.5)

#### TSK-55 · P3 · Typed request boundaries *(AUD-12)* · **Depends:** TSK-54
- [ ] `parseJsonBody` returns `Promise<unknown>`; Zod at every mutating boundary (41 call sites in the monolith alone)
- [ ] `@typescript-eslint/no-explicit-any` re-enabled with a ratchet budget (`eslint.config.js:21` currently disables it; `scripts/explicit-any-budget.js` gate exists)

#### TSK-56 · P3 · One error contract *(AUD-13)* · **Depends:** TSK-54
Modular routes return RFC 9457 `application/problem+json`; the monolith returns ad-hoc `{error, message, code}`. Verified good: the terminal 500 mapper does not leak internals (`{error, message, traceId}`, stack only in dev logs).
- [ ] Single problem+json mapper with stable codes and request IDs; OpenAPI status documentation updated; contract test extended

#### TSK-57 · P3 · Compose hardening *(AUD-22)* · **Depends:** TSK-09, Docker availability
- [ ] Authenticated Redis (`requirepass`), non-root backup job, SBOM + provenance signing; verified by an actual `docker compose up`

---

## 3. Definition-of-done exit gate

Track K items are not release-blocking; **Tracks A, B, C, D, E, F, G and I are.** The register may not claim Tier S2 again until all of the following hold simultaneously on one commit:

- [ ] `pnpm build` exits 0 · `pnpm lint` exits 0 · `pnpm test` exits 0 with **zero skips**
- [ ] All four CI verification steps pass in GitHub Actions on the same SHA (not locally only)
- [ ] `prisma migrate deploy` from empty succeeds; durability tests pass for every TSK-17 entity
- [ ] The rights gate demonstrably blocks approval and export (TSK-10 negative tests green)
- [ ] No fabricated KPI reachable from any route; `SCREEN_DECISIONS` and `MOCK_CLIENT_PROJECTS` absent, with guards keeping them absent — *now met in the tree, still unproven in CI:* `MOCK_CLIENT_PROJECTS` is deleted with a guard (`tests/unit/client-portal-and-operations.test.ts`), and `SCREEN_DECISIONS` measures **0** occurrences in `src/` (re-measured 2026-10-16: `grep -rn "SCREEN_DECISIONS" src/ | wc -l` → 0 — TSK-11's deletion landed, and `tests/unit/broadcast-provenance-coverage.test.ts` fails if it reappears). The line stays unticked until CI proves both absences on one SHA
- [ ] Every AC row in `docs/audit/ac-traceability-index.md` has its literal IDs present in the cited tests, or is downgraded
- [ ] Screen register verified per-ID, with provenance class recorded for each
- [ ] Every evidence document states only numbers reproducible from a command in this repo, pinned to a commit that contains the work
- [ ] `release-manifest.json` SHA re-pinned and its decision consistent with `DEC-RL1-SCOPE-001` signature state
- [ ] `docs/security/threat-model.md`, `docs/domain/state-machines.md`, `docs/domain/systems-of-record.md` exist and describe the code as built

---

## 4. Dependency graph (ordering is binding)

```
TSK-01 (build repair) ─┬─► TSK-02 (test cascade) ─┬─► TSK-04 (DT-202)
                       │                           ├─► TSK-28 (authz re-verify) ─► TSK-29 (guard parity)
                       │                           ├─► TSK-43 (AC traceability)
                       │                           └─► TSK-44 (suites as gates)
                       ├─► TSK-03 (lint) ─► TSK-09 (commit series) ─┬─► TSK-06 (migrations deploy)
                       │                                            ├─► TSK-54/55/56 (router work)
                       │                                            └─► TSK-57 (compose)
                       └─► TSK-05 (fixtures) ──► requires TSK-07

TSK-07 (register resolution) ──► gates ALL Track H and I traceability tasks
TSK-06 ──► TSK-17 (durable tables) ─┬─► TSK-10 (rights gate)  ◄── highest-value fix
                                     ├─► TSK-13 (client portal)
                                     ├─► TSK-18, TSK-19, TSK-32 (audit/dedup/ledger)
                                     ├─► TSK-30, TSK-31 (PII / DSR)  ◄── also HD-05, HD-06
                                     └─► TSK-35 (federation registry)
TSK-17 ──► TSK-21 (events) ──► TSK-47 (drills)
TSK-10 ──► TSK-12 (state machine) ──► TSK-52 (domain docs)
TSK-11 (screen wiring) ──► TSK-23 (desk census), TSK-24 (register per-ID), TSK-25
TSK-39 (authorities) ──► TSK-40 (design debt), TSK-41 (structure), TSK-52
TSK-48 (migration redo) must NOT overlap any src/web/** edit — including TSK-01's repairs
HD-01 ──► TSK-37 (release manifest decision)
```

**Critical path to a trustworthy register:** `TSK-01 → TSK-02 → TSK-07 → TSK-09 → TSK-06 → TSK-17 → TSK-10`.
**Parallelizable after TSK-02:** TSK-04, TSK-28, TSK-43, TSK-44.

---

## 5. Human decisions — not engineerable (`BLOCKED_HUMAN`)

These cannot be closed by code. Do **not** attempt to infer or manufacture them (CLAUDE.md `<stop_conditions>`).

| ID | Decision | Owner | Blocks | Record |
|:---|:---|:---|:---|:---|
| `HD-01` | RL1 scope acceptance, allocations D-01…D-10 | Executive Chairman + named owners per allocation | TSK-37, any promotion claim | `docs/decisions/DEC-RL1-SCOPE-001.md` — `PENDING_SIGNATURE`, all `[PENDING]` |
| `HD-02` | Rights override interpretation (§62 C-1) | General Counsel | override wording, not `TSK-10` | inherited `TODO-GVR-04` |
| `HD-03` | StarTimes carriage machine data (BG6) | Carriage Platform Owner | BG6, TSK-16 carriage surfaces | inherited `TODO-BCST-07`; `release-manifest.json` `NOT_TESTED` |
| `HD-04` | Cash-basis revenue recognition treatment (C-2) | Finance Controller | TSK-34 closure language | inherited `TODO-GVR-05` / `TODO-FIN-01` |
| `HD-05` | Key-management ownership for sealed PII | DPO | TSK-30 rotation/access logging | `audit.md` §5.2 AUD-06 |
| `HD-06` | DSR SLA clock + archive policy | DPO | TSK-31 | `audit.md` §5.2 AUD-08 |
| `HD-07` | Error-contract client change | Platform/API owner | TSK-56 | `audit.md` §5.2 AUD-13 |
| `HD-08` | Real-user usability validation (participant matrix) | Product + research | J-RL1-13 row | inherited `TODO-PRC-05`, `docs/audit/ac-traceability-index.md:19` `NOT_RUN` |
| `HD-09` | Manual WCAG 2.2 AA coverage (§7.5) | Accessibility lead | TSK-46 full closure | inherited `TODO-PRC-06`, index line 20 `PARTIAL` |
| `HD-10` | Playwright/browser dependencies under the zero-dependency policy — `@playwright/test` ^1.63.0 and `@axe-core/playwright` ^4.13.0 are already installed in `package.json` (measured 2026-10-16), so the open decision is now ratify-or-remove, not add | Architect + ops | TSK-45 | `audit.md` §5.3 AUD-19 |
| `HD-11` | Broadcast hardware integration (BCST-06) | Supplier / MCR | hardware scope | `docs/handoffs/LATEST.md:215` — software scope closed, hardware remains human/supplier |
| `HD-12` | FIRS remittance format confirmation | Finance Controller | WHT filing claim | `docs/handoffs/LATEST.md:216` TODO-FIN-04 |

---

## 6. Deferred / out-of-scope by decision

| ID | Item | Basis | Not to be re-litigated without a new decision |
|:---|:---|:---|:---|
| `DEF-01` | Azeebo+ L3 federated SSO | `DEC-RL1-SCOPE-001` D-08, awaiting partner contract (`HD-03`-class dependency) | inbound ingestion remains 501-gated |
| `DEF-02` | Consequential agent automation expansion | D-09 — permanent control, §58 | AOS remains draft/classify/recommend/flag only |
| `DEF-03` | Automated admissions / certification decisions | D-05, §58 policy | human-only by design |
| `DEF-04` | Live MCR machine control / transmission switching | D-02, BG6 | presentation + emergency-filler domain only |

---

## 7. Evidence artifacts required at closure

| Artifact | Path | Created by |
|:---|:---|:---|
| Baseline pin block (commit, date, command, output) | `docs/audit/evidence-register.md` | TSK-08 |
| Build/lint/test logs at pin | `docs/audit/evidence/baseline-2026-10-08/` (**written 2026-10-08**: `tsc.txt`, `build.txt`, `lint.txt`, `test.txt` + a README naming the commands, the commit-plus-dirty-set baseline and the 63/689 result) — the earlier `baseline-<date>/` row was a requirement with no artifact behind it, which is recorded here rather than back-dated | TSK-02, TSK-08 |
| Migration deploy + diff | `docs/audit/evidence/migrations-<date>/` | TSK-06 |
| Durability tests per entity | `tests/unit/durability-*.test.ts` | TSK-17 |
| Rights gate negative tests | `tests/unit/broadcast-rights-gate.test.ts` | TSK-10 |
| Screen provenance census (33 screens × source class) | `tests/unit/broadcast-provenance-coverage.test.ts` (the `docs/audit/screen-provenance.md` row this replaces was citation:absent — no such table was ever written; the census is computed by that test, and TSK-25's numbers come from running it) | TSK-11 |
| Desk census table (48 registered, N engine-backed) | `docs/audit/desk-census.md` | TSK-23 |
| AC-ID ↔ test grep report | `docs/audit/ac-traceability-index.md` | TSK-43 |
| Threat model | `docs/security/threat-model.md` | TSK-41 |
| State machines / systems of record / canonical model / data dictionary | `docs/domain/state-machines.md`, `systems-of-record.md`, `canonical-model.md`, `data-dictionary.md` (all four written from measurement, the last three each with a recomputing instrument in `tests/unit/`) | TSK-52 |
| Performance medians | `docs/audit/evidence/perf-<date>/` | TSK-50 |
| Rollback rehearsal log | `docs/audit/evidence/tsk51-rollback-rehearsal-2026-10-15/` (**written 2026-10-15**: `rehearsal.sh`, `seed.sql`, `undo.sql`, `drill.sh`, `counterfactual.sh`, `rehearsal-timings.txt`, `coverage-attempt-1-starved-fork.txt`, `gate-database-leftover-rows.txt`, `gate-battery.txt`, README (**battery re-run 2026-10-16**: lint/typecheck/build/test each exit 0 on the final tree, coverage exit 0 at 79.09/70.44/82.92/80.43, and the one full-battery attempt that went red on three files is recorded red with its `spawnSync ETIMEDOUT` signatures rather than dropped) — §3.3 measured on scratch databases, §1/§2 unrehearsed) against `docs/runbooks/rollback-runbook.md` | TSK-51 |
| Completion audit follow-up | `report.md` §5 status column updated | all tracks |

---

## 8. Verification commands (the only admissible evidence)

```bash
pnpm build                    # must exit 0 (currently exit 2, 152 errors / 3 files)
pnpm lint                     # must exit 0 (currently exit 1, 4 errors)
pnpm test                     # must exit 0, zero skips (currently 20/48 files fail)
pnpm run typecheck
pnpm run test:coverage        # thresholds: lines 72 / branches 62 / functions 77 / statements 73
pnpm run audit:threshold      # dependency vulnerability gate
pnpm run any:budget           # explicit-any ratchet (re-enable per TSK-55)
npx prisma migrate deploy     # against scratch Postgres (TSK-06)
node dist/src/cli/index.js gates:check   # BG0-BG9, no --allow-sha-drift once pinned

# finding-specific greps
grep -rn "rightsClearedBy" src/modules/broadcast/versions/index.ts      # TSK-10
grep -rn "getScreenData" src tests --include="*.ts"                     # TSK-11 (dead in src today)
grep -rn "SCREEN_DECISIONS" src --include="*.ts"                         # TSK-11 (must vanish)
grep -rnE "^(export )?const MOCK_" src --include="*.ts"                  # TSK-13: 0 matches since 2026-10-09 (guard: client-portal-and-operations.test.ts)
grep -rc "= new Map\|= new Set\|= {};" src --include="*.ts" | awk -F: '{s+=$2} END {print s}'  # TSK-17/20
grep -c "^model " prisma/schema.prisma                                    # 42 as of 2026-10-09 (was 27 when raised)
git status --porcelain | wc -l                                            # 189 on 2026-10-09 (246 with --untracked-files=all) → 0 at pin
```

---

## 9. Maintenance rules

1. **Every closure updates this file in the same commit** — status, evidence path, commit SHA. A closure not recorded here did not happen.
2. **No new task without a source.** Cite a `report.md` CA finding, an `audit.md` AUD finding, a PRD/CCPP section, or a decision record.
3. **Never renumber inherited `TODO-*` identifiers.** Add `TSK-*` and map the relationship (§1.3).
4. **Reopening is allowed and expected.** §1.3 reopens four items on evidence. A wrongly-closed item is a defect in the register, not a reason to hide it.
5. **Numbers in this file come from commands, not from other documents.** If a command's output changes, update §8 and the §1.1 counts in the same commit.
6. **Track A blocks all claims.** Until Track A is `DONE`, no other track may be reported complete anywhere in `docs/`.
7. **Do not work the §10 do-not-fix list.**
8. When this register is emptied of P0/P1, `report.md` gets a status column added and a follow-up completion audit is scheduled; Tier claims resume only against §3.
9. **A `file:line` pin is re-opened, not re-verified by eye, after any insertion that shifts it.** *Recorded 2026-10-12:* adding `buildScreenEngineSnapshot` (`src/api/router.ts:393-429`) plus one import shifted every router.ts line after `:392` by **+37**, which silently invalidated **39** fully-qualified and **13** bare `router.ts` pins across `tasks.md`, `docs/handoffs/LATEST.md`, `docs/security/route-authorization-coverage.md`, `docs/domain/{canonical-model,systems-of-record,data-dictionary}.md` and `docs/audit/todo-remediation-evidence.md`. Each new number came from a fresh grep of the *symbol the sentence names*, not from arithmetic — five were already wrong by 3–16 lines from earlier re-pins (`:937`→`:979`, `:727`/`:732`→`:769`, `:680`→`:789`, `:1093`→`:933`, `:543`→`:580`). Deliberately left alone: `audit.md` and `report.md` (audit-time observations, not current-state claims), the dated `docs/audit/evidence/*/README.md` artifacts, and this register's own labelled trails (`:236` `:468`, `:364` `:2496`, `:437` `:5652-5670`, `:606` dated working-tree pins, `:1073` "they were `:697`/`:7911`", `:1176`'s move chain). One pin was *refused* rather than moved: `tasks.md:1412` `router.ts:6337`, because TSK-49 deleted the duplicate-class defect it describes — re-pointing it would make the sentence assert a bug that is gone. **Document-to-document pins drift the same way and are swept in the same pass:** five were stale on this tree — `tasks.md:510` cited the §3 rights-gate exit line as `tasks.md:923` (a blank line; it is `:1533`), `tasks.md:586` cited the `TODO-BCST-03` census row as `tasks.md:145` (the `TODO-SEC-03` row; it is `:156`), and `tasks.md:831`/`:1105`/`:1591` cited the `LedgerPostingService` claim at `docs/handoffs/LATEST.md:19` (a blank line; the bullet is `:184`). **Why this is a human rule:** the doc guards do not catch this drift. `tests/unit/canonical-model.test.ts:410` and `tests/unit/systems-of-record.test.ts:136` open every citation but only assert the cited line exists and is non-blank, so a stale-but-in-range pin passes green — which is exactly how five of the pins above stayed wrong through two "all gates exit 0" closures. Evidence and the reproducible verifier: `docs/audit/evidence/doc-pin-repin-2026-10-12/` (`measure-pin-integrity.mjs` exits 0 only when every pin resolves to the symbol its sentence names). **Re-swept 2026-10-13 (TSK-20).** The same insertion pattern repeated here: TSK-20's edits to `docs/handoffs/LATEST.md` grew its pin block by 28 lines, and four *live* document-to-document pointers were re-opened and re-pinned by grep of the sentence's own subject — `tasks.md:544` `LATEST.md:18`→`:211` (the BCST-03 declaration), `:1125` and `:1613` `:189`→`:216` (the `LedgerPostingService` bullet), `:1612` `:18`→`:215` (BCST-06 software scope), `:1408` `:71`→`:275` (the WCAG manual-coverage downgrade). Two more were found stale beyond what this closure moved and are re-pinned with that stated: this rule's own `tests/unit/systems-of-record.test.ts:136` is the citation-opening instrument at `:168-184` — TSK-20's two top-of-file constants account for 2 of those 32 lines, so the 2026-10-12 sweep wrote a pin ~30 lines adrift — Left as written, per the same convention: `tasks.md:24`/`:30`/`:81`/`:360`/`:365`/`:1701` (audit-time positions the register quotes when it explains why it exists) and the dated `docs/audit/evidence/*/` artifacts. Re-counted on this tree: **52** fully-qualified + **19** bare router.ts pins across `tasks.md`, `docs/handoffs/LATEST.md` and the three domain documents (51 of the 52 resolve to `src/api/router.ts`; the 52nd is `tests/unit/p1-router-suites.test.ts:167` (citation:absent — re-measured 2026-10-15: `git log --all -- tests/unit/p1-router-suites.test.ts` returns nothing, so no such file has ever been on this tree; the §1.4 correction table it points at is `TODO-DOC-*` rows and carries no such pin, which makes this a phantom locator published by the sweep itself rather than a pin that moved), quoted in the §1.4 correction table). These are **not** the 2026-10-12 figures recountable — that entry's **39** + **13** came from a pattern this file does not reproduce, so the two censuses are stated separately instead of reconciled, and the difference is recorded as measurement method, not as pins that appeared. `measure-pin-integrity.mjs` re-run on the final tree: **45 mapped pins, 0 mismatched, exit 0**.

---

## 10. DO NOT FIX — claims examined and not substantiated

Reproduced from `report.md §6`. These were investigated and found **false or unsupported**; do not spend effort re-deriving them.

| Claim | Status | Why |
|:---|:---|:---|
| "Production boot is impossible — `AUTH_BYPASS_ENABLED=true` satisfies config but `server.ts` throws unconditionally" | **FALSE** | `src/api/server.ts:74-80` throws only when bypass is `true` **and** env is `production`/`staging` — the intended control. `src/core/config/index.ts:78-79` gates on the same two envs. Untestable while TSK-01 blocks the build, but not disproven. |
| "20–26 `Person` columns exist in schema but in no migration" | **FALSE (measured 2026-10-07)** | 9 scalar columns in schema and 9 in `migrations/0_init/migration.sql`; a clean `migrate deploy` to a scratch database produced all **9** on the `Person` table (`id, email, phone, firstName, lastName, kycStatus, nationalId, createdAt, updatedAt`). The 4 apparent extras (`user`, `talentProfile`, `creatorProfile`, `contracts`) are **relation fields** — they generate no columns. |
| "`ensureScheduleDemoSeed` never called at boot, schedule surfaces empty" | **FALSE** | Imported `src/api/server.ts:52`, called `src/api/server.ts:380` (positions re-pinned 2026-10-12; they were `:49`/`:307` when the claim was audited). |
| "5 register entries cite evidence files containing none of their UX IDs" | **FALSE** | All 60 evidence paths exist; `UX-BR-012` present in `governance-and-operations.ts`, `UX-COM-010` in `client-portal.ts`. |
| "HTML layout shell lost `<!DOCTYPE html>` / `<html lang>`" | **FALSE** | `src/web/public/dashboard.ts:200` emits doctype, `<html lang="en">`, viewport meta and stylesheet link. The a11y suites fail from TSK-01, not a broken shell. |
| "`tests/a11y/accessibility-audit.test.ts:141-149` asserts stale inline touch-target styles" | **FALSE** | File is 123 lines and asserts a 44×44 *configuration* (`:51-52`). The real stale assertion is `tests/unit/styleguide.test.ts:107` → TSK-04. |
| "Only 3 of 33 broadcast screens emit the mock-data banner" | **FALSE — measured 2026-10-11** | TSK-25 renders all 33 registered screens: **33/33** carry `vmn-provenance-banner` (the six bespoke panels substitute only their `panelContent`, never the outer template), **0/33** serve an engine-sourced KPI strip because `getScreenData`/`renderScreenKpis` have **0** production callers, and **0** take the `:918-922` invented `SLA Compliance 100%` default. Instrument: `tests/unit/broadcast-provenance-coverage.test.ts`. "0 of 33 show engine data" (`report.md:90`) is confirmed, mechanism now named. **Re-measured 2026-10-11 after TSK-11, same instrument: 33/33 now serve the provenance-badged strip, 0 fabricated `kpis` literals remain, 1/33 (SCR-BCST-02) emits a live `SOURCE:` badge from the channel registry, and 0/33 are fully engine-sourced** — the demonstration banner is now conditional on that `fullySourced` census rather than hardcoded.
| "`prisma migrate deploy` fails (P3006/P2022); database unreachable at runtime" | **REFUTED (measured 2026-10-07)** | Against a scratch PostgreSQL 18.3 database created empty, `prisma migrate deploy` applied all 4 migrations and produced **28** base tables for **27** models; both `migrate diff` directions report `No difference detected.` The P3006/P2022 claim could not be reproduced. `datasource.shadowDatabaseUrl` is now set in `prisma.config.ts` — Prisma 7 removed `--shadow-database-url`, `--from-url` and `--to-schema-datamodel` from `migrate diff`, so a migrations-directory diff is only possible through that config key. Residual drift found and fixed: 8 finance/event indexes existed in SQL but not in the datamodel. Evidence: `docs/audit/evidence/migrations-2026-10-07/`. |
| "506/506 tests, zero skips, `tsc --noEmit` clean" | **FALSE today** | `docs/handoffs/LATEST.md:13`, `docs/audit/evidence-register.md:18,27,78` — the claims that triggered this audit. See TSK-08. |
| CSS pipeline "pages are visually broken because `s-*` classes are never shipped" | **FALSE** | 1,399 generated utilities compile into `CANONICAL_STYLESHEET` (`src/web/styles/index.ts:2518`), served at `/assets/styles.css` (`src/api/router.ts:2660-2677`), linked by the single shell; 1,332 classes used, **0 undefined**. Only TSK-01 and TSK-49 are real defects here. |

---

## 11. What is verified good — preserve, do not rebuild

Recorded so remediation does not re-litigate working foundations (`report.md §3`, `§6`):

- **Financial integrity model** — 7-way separation enforced in the domain (`src/core/domain/types.ts:141-157`), kobo-exact; MT940 parsing; webhook replay protection; `tests/unit/finance-minor-units.test.ts`, `reconciliation-mt940.test.ts` passing.
- **Honest release gates** — `src/modules/quality/gates.ts:129-218` treats `NOT_TESTED` as never-PASS; `BG6_CARRIAGE: NOT_TESTED` in the manifest; `docs/audit/*` registers consistently name human owners (`journey-readiness-matrix.md:34-40`). This is unusually disciplined and matches canonical law 20.
- **Security control set** — RFC 6238 TOTP with anti-replay (`src/core/auth/totp.ts`), session registry with revocation, double-submit CSRF with Origin allow-list (`src/core/websecurity/index.ts`), idempotency keys, default-deny `ROUTE_GUARDS`, tamper-evident SHA-256 audit chain with boot-restored tail, bcrypt with seed credentials decoupled from source.
- **Genuinely closed AUD items** — AUD-10 (`ALLOW_SANDBOX_FALLBACK=false` + boot refusal), AUD-11 (strict env detection), AUD-16 (`logStructured` emits), AUD-21 (threshold gate), AUD-25 (advisory override), AUD-15 (bounded concurrency), AUD-23 (indexable-route parity contract test).
- **Fail-closed repository policy** (`src/core/database/repository-mode.ts`) — correct design; CA-04's failures are the policy *working*.
- **Breadth of working engines** — 144 source files across broadcast, finance, hub, federation, intelligence, quality; 20 UAT broadcast failure drills and 13 journey failure drills that pass when the tree compiles.
- **Design-token CSS pipeline** — sound in structure (see §10).
- **Secrets hygiene** — `.env` untracked and gitignored, no live values in `.env.example`, gitleaks in CI.

---

*Register opened 2026-10-07 against `VMNL-REPO-COMPLETION-AUDIT-001`. 65 engineering tasks, 12 human decisions, 4 scope deferrals. Track A blocks all other completion claims until the tree builds, tests and lints green at a single commit.*
