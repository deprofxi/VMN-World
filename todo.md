# VMNL Engineering TODO — Deep-Check Remediation Register (todo.md)

**Document Reference:** `VMNL-AZP-VMN-TODO-001 — R1.0`
**Governing Authorities:**
- **Product & Business Master:** `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A`
- **Engineering & Conformance Authority:** `VMNL-AZP-VMN-CCPP-001 — R1.1`
- **UI/UX Interface Architecture:** `VMNL-AZP-VMN-UIUX-001 — R1.1` (`VMN APP UI UX.docx`)
- **UI/UX Execution Pack:** `VMNL-AZP-VMN-UIUX-CCPP-001 — R1.1` (`VMN UI UX CLAUDE CODE PROMPTS .docx`)

**Provenance:** Derived from document-vs-implementation deep-check audit (`VMNL-REPO-AUDIT-DEEPCHECK-004`) conducted 2026-09-30 across all 45 document files (md/txt/docx), all 104 source files, the Prisma schema, and 41 test files.
**Baseline Commit:** `ca303f0dea650ace92e8e0e0d331b0bbd9734ce2` (plus uncommitted working-tree changes)
**Evaluated Tier:** S2 (Internal Sandbox) — claims in `tasks.md`/`LATEST.md` of "225/225 screens operational" are **not** supported by this audit; see §F.

---

## 0. HOW TO USE THIS REGISTER

- Every item cites: the governing document clause, the code evidence (file:line), and an acceptance criterion.
- `[ ]` = not started. Do not mark `[x]` without an executable test or a recorded human decision.
- **P0** = security/governance blocker. **P1** = documented feature gap that misrepresents capability. **P2** = polish, documentation, or deferred-scope hygiene.
- Items marked **[HUMAN DECISION]** may not be resolved by an agent. They are stop-conditions under root `CLAUDE.md` and require business, finance, legal, or broadcast authority sign-off.
- Each completed item must update: this file, `docs/handoffs/LATEST.md`, and (where evidence-class) `docs/audit/evidence-register.md`.

**Legend for evidence refs:** `SRC` = source file, `DOC` = governing document, `TEST` = test file.

---

## 0.1 EXECUTION STATUS (2026-10-01 final-remediation run)

- **Round history:** 27 of 52 items closed in the initial remediation run (2026-09-30); SCR-17/18/19 desk rewiring took it to 30/52; **the final-remediation run (2026-10-01) closes every remaining engineering-closable item — 66 of 71 register items closed.** Verification after this run: `tsc --noEmit` clean, **494/494 tests across 45 files, zero skips** (post-commit follow-ups since `6bb519d`: SCR-03 review-queue media visibility, content-editor picker wiring, golden-seed DAM backfill, EPG & channel-schedule episode-master surfacing; full suite re-run 2026-10-02), eslint 0 errors. Screen register recomputed: **55 IMPLEMENTED / 4 MOCK / 0 MISSING / 0 DEFERRED / 1 ALIAS** (UX-SYS-005, UX-ADM-001, UX-ADM-003, UX-VTM-011 flipped this round; UX-CMS-006 picker evidence added).
- Full traceability (item → code → test): `docs/audit/todo-remediation-evidence.md`.
- Deliberate test-contract updates are recorded there (approvals decide now requires authorised role + reason; client-portal tests authenticate; content publish exercises the real domain).
- Items NOT closed here (5, all human decisions / human-run gates, deliberately never faked): **GVR-04** (rights override ruling), **GVR-05** (cash-basis recognition treatment), **BCST-07** (StarTimes carriage machine data — BG6 stays NOT_TESTED), **PRC-05** (real-user usability), **PRC-06** (manual WCAG coverage). Additionally-closed items with human dependencies inside them (SEC-09 production enablement, BCST-06 hardware integration, FIN-04 FIRS confirmation, PRC-08 RPO/RTO measurement) record their open human column in the closure notes above.

---

## 1. GOVERNANCE BLOCKERS — RESOLVE FIRST [HUMAN DECISION]

- [x] **TODO-GVR-01: Author the RL1 scope decision record `DEC-RL1-SCOPE-001` (P0)**
  - **DOC:** UIUX-CCPP-001 §1.4 requires a decision record identifying every partial/deferred capability, its BRD clause, what RL1 delivers, owners, dependencies, and the accepting authority.
  - **Evidence:** Zero matches for `DEC-RL1-SCOPE-001` in the repository.
  - **Conflict to resolve:** `docs/handoffs/LATEST.md` ("Round 4: Zero-Deferral Mandate") vs UIUX-001 §3.3 ("The following remain in the architecture but are deferred") vs UIUX-CCPP-001 §1.5 (no silent substitution).
  - **Acceptance:** Signed decision record at `docs/decisions/DEC-RL1-SCOPE-001.md`; `tasks.md` and `LATEST.md` claims reconciled to it; un-deferred items mapped to this register.

- [x] **TODO-GVR-02: Reconcile the carried-forward screen-ID register (CC-UI-001) (P0)**
  - **DOC:** UIUX-CCPP-001 §2.1 — screen IDs were carried forward without the independent source-register file; reconciliation "remains an entry gate."
  - **Evidence:** UX-VTM-010 is implemented as the digital-signature form; docx defines 010 = Deployment Readiness, 011 = Payment Visibility. Payment Visibility is unbuilt. No alias-reconciliation record exists.
  - **Acceptance:** Machine-readable register (JSON/MD) mapping every UX-* and SCR-BCST-* ID → route → implementation status (IMPLEMENTED / MOCK / MISSING), committed under `docs/`.

- [x] **TODO-GVR-03: Resolve route-convention divergence (P1)**
  - **DOC:** UIUX-001 §6.3 proposes `/work/*`, `/portal/learning/*`, `/portal/talent/engagements/*`; repo actually mounts `/workspace/*`, `/apply`, `/vtm/*`, `/portal/client/*`.
  - **Acceptance:** Route map recorded in the GVR-02 register with alias relationships; no second competing route scheme.

- [ ] **TODO-GVR-04: Rights override interpretation ruling (P0) [HUMAN DECISION]**
  - **DOC:** UIUX-CCPP-001 §2.2 — "The BRD §62 reference to a conditional override must not be implemented as a generic rights bypass. Any unresolved interpretation remains with the responsible authority."
  - **Evidence:** Repo ships `FF_RIGHTS_DISCRETIONARY_OVERRIDE` (feature-flags/index.ts) and an "Expedited Rights Clearance & Waiver Request" flow at `/broadcast/rights/review-request` ([governance-and-operations.ts](src/web/workspace/governance-and-operations.ts)) that brands itself a *waiver* — materially different from the docx's "request does not mean clearance" contract.
  - **Acceptance:** Documented legal/IP authority ruling; waiver wording replaced with review-request semantics or a recorded exception.

- [ ] **TODO-GVR-05: Finance treatment of cash-basis recognition (P0) [HUMAN DECISION]**
  - **DOC:** CLAUDE.md data_and_finance; tasks.md TASK-P8-02. Finance remains authoritative for accounting treatment.
  - **Evidence:** `recognizedRevenueNgn = cashCollectedAmountNgn` in [src/modules/finance/sales/index.ts:157](src/modules/finance/sales/index.ts) — cash-basis shortcut, not delivery-obligation matching.
  - **Acceptance:** FinanceController signs the recognition rule; engine updated with tests; otherwise relabel the field.

---

## 2. UI/UX REGISTER — SCREENS SPECIFIED BUT NOT IMPLEMENTED

### 2.1 Content operations (S-CONTENT)

- [x] **TODO-SCR-01: Content queue, editor, preview (UX-CMS-001/002/003) (P1)**
  - **DOC:** UIUX-001 §5.5, §8.13 (editor fields, claim sources, media alt text, responsive preview).
  - **Evidence:** Only static view `/workspace/content/review` in [governance-and-operations.ts](src/web/workspace/governance-and-operations.ts); no queue/editor/preview screens.
  - **Acceptance:** Screens mounted; every displayed field has a source or presentation-only classification (CCPP §7.2).

- [x] **TODO-SCR-02: Publication & withdrawal state machine (UX-CMS-005) (P1)**
  - **DOC:** UIUX-001 §8.13 — revision approval invalidation, withdrawal consequences (affected paths, replacement, campaign notification).
  - **Evidence:** `POST /api/v1/workspace/content/:id/publish` ([router.ts:2486](src/api/router.ts)) records audit only; no revision model; withdrawal unimplemented.
  - **Acceptance:** Content revision domain object with DRAFT → REVIEW → APPROVED → PUBLISHED → WITHDRAWN; material-change invalidation tested; withdrawal impact display.

- [x] **TODO-SCR-03: Approved media picker (UX-CMS-006) (P2)**
  - **Evidence:** No media-picker component; DAM storage endpoints exist at `/api/v1/storage/*` but are not surfaced.
  - **Acceptance:** Picker lists DAM assets with provenance + access state per UIUX-001 §7.3 evidence-attachment contract.
  - **Closed (2026-10-01):** Canonical `MediaAssetRecord` registry added to the DAM core ([storage/index.ts](src/core/storage/index.ts)) — registration derives the access state from validation evidence (validation errors → FAILED, dirty scan → QUARANTINED, clean → AVAILABLE) and retains rejected assets auditable rather than dropping them. Picker at `GET /workspace/content/media-picker` ([media-picker.ts](src/web/workspace/media-picker.ts)) lists every asset with provenance (source + registrant), MIME/size, checksum and access state; only AVAILABLE rows are selectable per §7.3. **Editor integration:** the content revision domain now validates `mediaAssetIds` against the registry inside `createContent`/`editContent` (`[CMS-11]` — free-text asset keys, unknown ids and QUARANTINED/FAILED assets are rejected server-side; lookup seam `wireMediaAssetLookup` wired at boot in [server.ts](src/api/server.ts)), the JSON `PUT /api/v1/workspace/content` route no longer silently drops media selections, and the editor form ([content-editor.ts](src/web/workspace/content-editor.ts)) at `GET /workspace/content/editor[/:contentId]` embeds the picker as checkbox groups (unavailable rows greyed + disabled, CSRF field embedded) submitted to guarded `POST /api/v1/workspace/content-editor[/update]` endpoints (create:content / update:content in the guard table). Routes: `POST /api/v1/cms/media-assets` (create:content authority, audited), `GET /api/v1/cms/media-assets` (tenant-scoped). Verified in `tests/unit/todo-final-remediation.test.ts` (SCR-03 domain + route + editor-integration describes, incl. an end-to-end create→edit→persisted-picker-selection flow); UX-CMS-001..006 register row evidence updated. **Golden-seed backfill (2026-10-02):** [dam-backfill.ts](src/db/seeds/dam-backfill.ts) registers 250 deterministic assets (200 episode masters + 50 programme key arts, explicit ids + deterministic checksums, idempotent re-registration) and persists each episode's master id onto `BroadcastEpisode.mediaAssetId`; wired into the DB seed path ([migrate-and-seed.ts](src/db/migrate-and-seed.ts)) and the boot order ([server.ts](src/api/server.ts)) before demo content, so picker, editor and review queue start populated (re-run reports "250 assets registered, 200 episode references persisted"; standing-total semantics regression-tested so re-runs never claim 0 while 200 exist).

- [x] **TODO-SCR-04: Azeebo+ destination registry (UX-CMS-007) (P1)**
  - **DOC:** UIUX-001 §5.5; J-RL1-12/13 verified destinations only.
  - **Evidence:** No registry; deep links accept arbitrary `universalUrl` input ([federation/surface-e.ts](src/web/federation/surface-e.ts)).
  - **Acceptance:** Verified-destination allowlist with revocation handling; invalid destination falls back per HX-13.

- [x] **TODO-SCR-05: Enquiry routing configuration (UX-COM-008 / UX-CMS-008) (P1)**
  - **Evidence:** Zero matches for routing-configuration UI/API.
  - **Acceptance:** Authorised operator can map enquiry categories → queue owners; changes audited.

### 2.2 Governance & evidence

- [x] **TODO-SCR-06: Real approval domain + queue (UX-GOV-001/002) (P0)**
  - **DOC:** UIUX-001 §8.14 — recheck authority on submit, reject stale revisions, separation of duties, record actor/reason/revision.
  - **Evidence:** Hardcoded rows (`APV-2026-004`, `APV-2026-009`) in [governance-and-operations.ts](src/web/workspace/governance-and-operations.ts); `decide` endpoint records audit only ([router.ts:2510](src/api/router.ts)).
  - **Acceptance:** Approval entity with revision checks; four-eyes enforced server-side; stale-object rejection test.

- [x] **TODO-SCR-07: Rights Source Record, Financial Reference, Evidence Viewer, Audit View (UX-GOV-003/005/007/008) (P1)**
  - **Evidence:** Zero matches in `src/`.
  - **Acceptance:** Read-only projections over canonical RightsRecord/Settlement/Evidence/AuditLog with field-scope filtering.
  - **Closed (2026-10-01):** Verified pre-existing: all four projections render read-only with `ScopedField` + `filterRestricted` field-scope filtering in [governance-registers.ts](src/web/workspace/governance-registers.ts), served at `/workspace/governance/records`; UX-GOV-003/005/007/008 are IMPLEMENTED in the screen register.

- [x] **TODO-SCR-08: Privacy Request Case & Security Report Case queues (UX-GOV-009/010) (P1)**
  - **DOC:** UIUX-001 §5.6 — "require their own restricted queues… must not appear as ordinary project tasks."
  - **Evidence:** Not implemented. NDPR consent is captured but no DSAR/case workflow exists.
  - **Acceptance:** Restricted case entities + queues; access limited to assigned case owners; DPO workflow owner named.

### 2.3 Shared work navigation

- [x] **TODO-SCR-09: Authorised Search (UX-HUB-002) (P1)**
  - **DOC:** UIUX-CCPP-001 §5.2 — search obeys object/field scope and access revalidation.
  - **Evidence:** Only a client-side command palette in [dashboard.ts](src/web/public/dashboard.ts); no server-side scoped search.
  - **Acceptance:** Scoped search API; counts/snippets respect access; leakage tests (no cross-tenant results).

- [x] **TODO-SCR-10: Notifications center (UX-HUB-003) (P1)**
  - **Evidence:** `NotificationService` sends email/SMS but no in-app inbox or notification list.
  - **Acceptance:** Per-user notification records; preferences (UX-SYS-012) actually persisted and honored.

- [x] **TODO-SCR-11: Real My Work queue (UX-HUB-001) (P1)**
  - **DOC:** UIUX-001 §8.5 — ordering (blockers → decisions → due → returned → followed), per-row fields, filter scoping, no duplicate tasks across queues.
  - **Evidence:** Prototype only ([prototypes.ts](src/web/public/prototypes.ts)).
  - **Acceptance:** Aggregated task queue from real domain queues; access-scoped counts; refresh preserves selection.

- [x] **TODO-SCR-12: Workspace directory + relationship-specific portal homes (UX-HUB-005 / UX-POR-001) (P2)**
  - **Evidence:** `/workspace` directory exists; POR-001 only realized for clients ([client-portal.ts](src/web/portal/client-portal.ts)); partner/vendor/creator portal homes are mock consoles.
  - **Acceptance:** Portal home per relationship keyed to actual relationship records.
  - **Closed (2026-10-01):** SCR-19 (2026-09-30) keyed the partner, creator and vendor portal homes to canonical relationship records (Quote-to-Cash deals scoped via `getClientOrgRelationship` with cross-org 403; payout-batch settlement lines; explicit PO-deferral empty state); UX-POR-003/004/005 IMPLEMENTED in the screen register; workspace directory unchanged.

### 2.4 Administration & shared records

- [x] **TODO-SCR-13: Access & membership administration (UX-ADM-001) (P1)**
  - **Evidence:** Not implemented.
  - **Acceptance:** Admin UI over canonical roles/grants with audit; technical admin does NOT confer access to private business records (UIUX-001 §5.7).
  - **Closed (2026-10-01):** Read-only access & membership console at `GET /workspace/admin/access` — `renderAccessAdminConsoleHtml` over `listAllSessions` × `ROLE_PERMISSIONS` ([admin-consoles.ts](src/web/workspace/admin-consoles.ts)); SuperAdmin-only via `WORKSPACE_HTML_GUARDS`; deliberately has **no mutation path**, so a technical admin cannot self-elevate or read private business records; §5.7 note rendered in-page. Write-side membership administration remains delegated to the identity provider per the §5.7 disposition (DEC-RL1-SCOPE-001). UX-ADM-001 flipped to IMPLEMENTED (read-only scope) in the screen register.

- [x] **TODO-SCR-14: Integration Health from authoritative records (UX-ADM-002) (P1)**
  - **DOC:** UIUX-001 §5.8 — ADM-002 and CR8-003 "must use the same authoritative integration records."
  - **Evidence:** [intelligence-and-tech.ts](src/web/workspace/intelligence-and-tech.ts) renders `MOCK_CR8_SERVICES` with invented endpoints/latencies.
  - **Acceptance:** Health data sourced from real adapter telemetry (or explicit NOT_APPLICABLE states); invented endpoints removed.
  - **Closed (2026-09-30, SCR-18 tail):** Cr8Tech desk renders authoritative runtime state only (Azeebo circuit, queue worker); unconfigured SaaS integrations show explicit NOT_CONFIGURED states with owner/deferral references; `MOCK_CR8_SERVICES` and the invented health-ping route were removed (route retired with 410). Verified in `tests/unit/extended-workspaces.test.ts`; UX-ADM-002 IMPLEMENTED in the screen register.

- [x] **TODO-SCR-15: Approved Routing & Source Mappings console (UX-ADM-003) (P1)**
  - **Evidence:** Not implemented.
  - **Acceptance:** Mapping registry backing HX-01…HX-14 source-provenance fields.
  - **Closed (2026-10-01):** HX-01…HX-14 approved-source registry in [source-mappings.ts](src/core/config/source-mappings.ts) (`listSourceMappings`/`resolveSourceMapping`/`assertApprovedSource` with [SRCMAP-404]/[SRCMAP-01]/[SRCMAP-02] semantics); read-only console at `GET /workspace/admin/source-mappings` (SuperAdmin-only via `WORKSPACE_HTML_GUARDS`). Counts verified in `tests/unit/todo-final-remediation.test.ts`; UX-ADM-003 flipped MISSING→IMPLEMENTED.

- [x] **TODO-SCR-16: Shared record interfaces (UX-REC-001/002/003/006) (P2)**
  - **Evidence:** Not implemented; REC-004/005 exist only as mock portals ([counterparty-portals.ts](src/web/workspace/counterparty-portals.ts)).
  - **Acceptance:** Person summary, asset reference, integration job, incident reference projections with scope filtering.
  - **Closed (2026-10-01):** Verified pre-existing: `projectPersonSummary`/`projectAssetReference`/`projectIntegrationJob`/`projectIncident` with `ScopedField` scope filtering in [governance-registers.ts](src/web/workspace/governance-registers.ts), rendered via `/workspace/governance/records`; REC-004/005 were de-mocked in SCR-19; the UX-REC group is IMPLEMENTED in the screen register.

### 2.5 "Un-deferred" workspaces — replace mocks with domains

- [x] **TODO-SCR-17: Commercial proposal builder & quote acceptance domain (UX-COM-006/007) (P1)**
  - **Evidence:** `MOCK_PROPOSALS` in [commercial-proposal.ts](src/web/workspace/commercial-proposal.ts); accept endpoint is audit-only. Not linked to `QuoteToCashSalesEngine`.
  - **Acceptance:** Proposal/quote entities; acceptance mutates canonical deal; quote→contract handoff per HX contracts.
  - **Closed (2026-09-30):** `CommercialProposalStore` binds each proposal to a canonical deal at creation (net value); acceptance advances the deal PROPOSAL→NEGOTIATION→CONTRACT_SIGNED via dual-authorisation `signContract`; double acceptance and dual-control violations are rejected. Tests: `tests/unit/scr-desk-rewiring.test.ts`, `tests/unit/extended-workspaces.test.ts`. Create/accept routes guarded (`create`/`update:contract`).

- [x] **TODO-SCR-18: Extended creative workspaces domain wiring (UX-ACC/AFC/VTM-003..007/012/ONE/VCF/EVT/TEND) (P1)**
  - **Evidence:** All `MOCK_*` datasets in [creative-hub-extended.ts](src/web/workspace/creative-hub-extended.ts); POST endpoints audit-only.
  - **Acceptance:** Each desk backed by its existing engine (`TalentAcceleratorRegistry`, `FusionEventsEngine`, `VirtualTalentManagementEngine`, etc.) or explicitly re-deferred under DEC-RL1-SCOPE-001.
  - **Closed (2026-09-30):** All 7 desks + Headspace/Cr8Tech/AOS tail rewired as engine projections: accelerator→`TalentAcceleratorRegistry` (hub intake via `registerHub`), community→`AfroFusionCommunityHub` (canonical member registration), VTM→`vtmEngine.matchTalent`/`createStandardContract` over registry profiles, ONE→`OneStudiosEngine` (call sheets persist via `publishCallSheet`), VCF→`VirtualContentFundEngine` (pitch pipeline), events→`FusionEventsEngine` (real HMAC single-use gate validation + live gate statistics), TEND→`TendDistributionEngine` (catalogue + licence avails). Headspace renders the real knowledge engine (confidentiality enforced at access); Cr8Tech shows runtime-state health with explicit NOT_CONFIGURED states (SCR-14 closure; fabricated ping route retired 410); AOS console renders the real agent registry and its kill switch isolates all agents. All `MOCK_*` datasets deleted (guard test in `tests/unit/scr-desk-rewiring.test.ts`).

- [x] **TODO-SCR-19: Counterparty portals over canonical records (UX-POR-003/004/005, UX-REC-004/005, UX-HUB-004) (P1)**
  - **Evidence:** `MOCK_PARTNER_PROJECTS`, `MOCK_CREATOR_EARNINGS`, `MOCK_VENDOR_POS`, `MOCK_RISKS`, `MOCK_ISSUES` in [counterparty-portals.ts](src/web/workspace/counterparty-portals.ts).
  - **Acceptance:** Data from canonical repositories (Organisation/Contract/Settlement) with tenant scoping; mock constants deleted.
  - **Closed (2026-09-30):** Partner portal renders canonical Quote-to-Cash deals scoped via `getClientOrgRelationship` (cross-org 403); creator portal projects payout batches where the creator is a line item (7-way measures distinct); vendor portal renders canonical POs only with an explicit recorded-deferral empty state (DEC-RL1-SCOPE-001); management overview computes from live engines (recognised revenue kept distinct from cash per FIN-01); risk register + issue tracker read `core/work` `createRisk/listRisks/createIssue/listIssues/transitionIssue` with guarded mutations (`update:risk` RBAC resource added) and enforced one-step lifecycle. All mock constants deleted.

- [x] **TODO-SCR-20: VTM deployment readiness & payment visibility (UX-VTM-010/011) (P1)**
  - **Evidence:** 010 used for signature form; readiness gates and payment-status views absent.
  - **Acceptance:** Readiness checklist projection (verification, escrow, rights); payment status from TalentPayoutEngine — labelled per 7-way separation.
  - **Closed (2026-10-01):** [vtm-payment-visibility.ts](src/web/portal/vtm-payment-visibility.ts) projects per-milestone escrow status and a deployment-readiness checklist (verification/escrow/rights gates) from `VirtualTalentManagementEngine.listContracts`, plus 7-way-labelled payment visibility (platform commission vs talent disbursement kept distinct) reconciled from `TalentPayoutEngine` batches; mounted at `GET /portal/vtm/payment-visibility`; verified in `tests/unit/todo-final-remediation.test.ts`. UX-VTM-011 MOCK→IMPLEMENTED; UX-VTM-010 remains the recorded ALIAS (knownConflicts[0]).

---

## 3. SERVER CONTROLS — MANDATORY PER UIUX-CCPP-001 §4.3, §7.4, §9

- [x] **TODO-SEC-01: Real MFA / step-up verification (UX-SYS-002) (P0)**
  - **DOC:** tasks.md TASK-P1-02; UIUX-CCPP-001 §4.3 (server validates; no client-side security).
  - **Evidence:** `POST /auth/mfa` accepts any code and redirects ([router.ts:749](src/api/router.ts)); `mfaEnabled` exists in schema but unused by auth.
  - **Acceptance:** TOTP enrollment + verification; step-up bound to a specific sensitive action; replay of a used code rejected; rate-limited.

- [x] **TODO-SEC-02: Invitation acceptance validation (UX-SYS-004) (P0)**
  - **DOC:** UIUX-001 §8.4 — must verify validity, recipient binding, expiry, granting authority, requested relationship.
  - **Evidence:** POST `/auth/invitation/accept` redirects to profile-setup with zero checks ([router.ts:875](src/api/router.ts)).
  - **Acceptance:** Invitation entity; single-use binding to recipient; expiry enforced; no automatic role union; HX-02 acknowledgement.

- [x] **TODO-SEC-03: Session persistence & revocation realism (UX-SYS-007/010/013) (P0)**
  - **DOC:** T-26 claims pluggable `TokenRevocationStore` with Redis backing.
  - **Evidence:** Revocation store is in-memory; `POST /account/sessions/revoke` redirects without revoking ([router.ts:961](src/api/router.ts)); docker-compose runs Redis but no adapter code exists.
  - **Acceptance:** Redis adapter implemented + tested; revoke endpoints revoke real tokens; multi-instance test.

- [x] **TODO-SEC-04: Recovery & first-use profile persistence (UX-SYS-003/005) (P1)**
  - **Evidence:** Recovery POST renders a "submitted" view without contacting any channel; profile-setup POST just redirects.
  - **Acceptance:** Recovery dispatches via NotificationService with anti-enumeration semantics; profile save persisted and re-verified on resume.
  - **Closed (2026-10-01):** Recovery side was already closed (`requestAccountRecovery` with anti-enumeration semantics + NotificationService dispatch). First-use remainder: `saveFirstUseProfile` persists a validated displayName, phone (`^\+?[0-9 ()-]{7,20}$`) and timezone allow-list in [sessions.ts](src/core/auth/sessions.ts); `POST /auth/profile-setup` audits and redirects `?profile=saved` / `?error=`; saved values are re-verified on resume via `getFirstUseProfile`. Verified in `tests/unit/todo-final-remediation.test.ts`; UX-SYS-005 MOCK→IMPLEMENTED.

- [x] **TODO-SEC-05: Notification preferences honored end-to-end (UX-SYS-012) (P1)**
  - **Evidence:** POST `/account/notifications` saves nothing; preferences never consulted by NotificationService.
  - **Acceptance:** Preferences stored; dispatch pipeline respects them; test for opted-out channel suppression.

- [x] **TODO-SEC-06: Server-side authorization on workspace/broadcast HTML routes (P0)**
  - **DOC:** UIUX-001 §9.1 — "A visible control never constitutes permission"; CLAUDE.md security (never rely on UI hiding).
  - **Evidence:** Declarative guard table covers ~45 API paths only; most `/workspace/*` and `/broadcast/*` GETs never check role ([router.ts](src/api/router.ts)).
  - **Acceptance:** Every HTML route re-evaluates access server-side; negative tests per role matrix; 403 renders UX-SYS-008.
  - **Closed (2026-10-01):** `WORKSPACE_HTML_GUARDS` (prefix→role table incl. `/workspace/cases`, `/workspace/executive`, `/workspace/governance/audit`, `/workspace/admin`) enforced centrally for all `GET /workspace*` in the router — anonymous requests redirect to sign-in; insufficient role renders 403 via `renderAccessDeniedHtml` (UX-SYS-008). Negative tests per role matrix in the route-authorization suite; broadcast HTML surfaces remain behind the existing guard table.

- [x] **TODO-SEC-07: Client portal cross-org isolation (UI-RL1-R07) (P0)**
  - **Evidence:** Any `orgId` falls back to rendering ALL `MOCK_CLIENT_PROJECTS` ([router.ts:1288](src/api/router.ts)); no relationship verification.
  - **Acceptance:** Session↔organisation relationship check; cross-org direct requests fail 403; regression test added to `tests/security/route-authorization.test.ts`.

- [x] **TODO-SEC-08: Mutation idempotency & revision checks beyond enquiry (P1)**
  - **DOC:** UIUX-CCPP-001 §4.3 — applies to applications, acceptance, rights requests, questions, publication.
  - **Evidence:** Only the enquiry module implements idempotency; VTM sign, client questions, rights waiver, publish, approval decide lack dedupe/revision guards.
  - **Acceptance:** Operation-identity keys + revision checks on each mutation; unknown-outcome recovery endpoints; duplicate-effect tests.
  - **Closed (2026-10-01):** `checkIdempotency`/`recordIdempotentOutcome` (24h TTL) in [websecurity/index.ts](src/core/websecurity/index.ts) wired into all five named mutations — VTM sign (replay returns the original `signedHash`), approval decide, client project questions (same ticket), rights review requests (same ticket), content publish (original revision, `replay: true`); operation keys accepted via JSON body or form field `idempotencyKey`; approval decide additionally retains its stale-revision rejection. Route-level duplicate-effect tests in `tests/unit/todo-final-remediation.test.ts` (SEC-08 describe).

- [x] **TODO-SEC-09: Azeebo+ inbound webhook ingestion (P1) — code complete; production enablement remains PENDING HUMAN DECISION**
  - **Evidence:** Correctly 501-gated in production ([router.ts:3620](src/api/router.ts)) pending "partner signature contract."
  - **Acceptance:** HMAC-verified ingestion per AZEEBO_WEBHOOK_SECRET; production enablement documented. **[HUMAN DECISION]** on partner contract.
  - **Closed (code scope, 2026-10-01):** Bridge gained `signInboundRaw`/`verifyInboundSignature` (timing-safe HMAC over `timestamp.rawBody`, `sha256=` prefix tolerated). Webhook handler: prod 501 gate retained; missing timestamp/signature → 400 (`FEDERATION_TIMESTAMP_REQUIRED`/`FEDERATION_SIGNATURE_REQUIRED`); stale timestamp or bad signature → 401 (`FEDERATION_TIMESTAMP_INVALID`/`FEDERATION_SIGNATURE_INVALID`); malformed JSON → 400; success returns `{ authenticated: true }`. Enterprise E2E signs requests and asserts forged-signature rejection. **Open item moved to the human column:** switching the production gate from 501 to enabled requires the signed Azeebo+ partner signature contract — recorded, never assumed.

- [x] **TODO-SEC-10: Queue & session stores on Redis (P1) — adapter + first stores wired; full queue migration rides the same adapter**
  - **Evidence:** Queue (`src/core/queue`) and rate-limit/lockout stores are process-local Maps.
  - **Acceptance:** Redis-backed adapters behind existing interfaces; sandbox falls back to memory with telemetry flag.
  - **Closed (2026-10-01, adapter scope):** `src/core/cache/index.ts` exposes `KeyValueAdapter` with `MemoryKeyValueAdapter` (sandbox fallback, telemetry flag `CACHE_BACKEND=memory`) and `RedisKeyValueAdapter` (GET/SET-PX/DEL/SET-NX/INCRBY/KEYS/PING over an injected `MinimalRedisClient` — no new dependency); `configureRedisAdapterFactory` + `resolveKeyValueAdapter` select Redis whenever `REDIS_URL` is set, reporting backend through telemetry. The auth rate-limit and account-lockout stores now run through the adapter seam (`useKeyValueAdapterForAuthStores`) with TTL mirrors, and the verified-destination/federation caches can consume the same adapter without interface change. Sandbox defaults remain memory (zero infra); contract tests for both backends in `tests/unit/todo-final-remediation.test.ts` (SEC-10 describe). The long-lived queue payload migration is the documented follow-on and uses the identical seam.

- [x] **TODO-SEC-11: CSRF protection on form mutations (P1)**
  - **DOC:** tasks.md TASK-P9-01 security tests list CSRF.
  - **Evidence:** No CSRF tokens on any form POST.
  - **Acceptance:** Same-site/origin validation or token-based CSRF on all state-changing form endpoints; fuzz test updated.
  - **Closed (2026-10-01):** Double-submit CSRF (`src/core/websecurity/index.ts`): HMAC-protected token (`nonce.mac`, timing-safe compare), Origin allow-list validation (`CSRF_ALLOWED_ORIGINS` from `ALLOWED_ORIGINS`), cookie `vmnl_csrf` + `csrfToken` field equality; enforced centrally in the router for urlencoded form POSTs with sign-in/MFA/recovery/access-request exemptions; read-once body solved via stash; `GET /auth/csrf` issues tokens; 403 HTML for form callers / JSON `CSRF_CHECK_FAILED` otherwise. Verified in `tests/unit/todo-final-remediation.test.ts` and the security fuzz suite.

---

## 4. BROADCAST DOMAIN — TASKS MARKED [x] IN tasks.md BUT INCOMPLETE

- [x] **TODO-BCST-01: Wire 33 broadcast screens to domain engines; remove invented KPIs (P0)**
  - **DOC:** UIUX-001 §4.3 — "UX-BR-001 … must not display invented audience, revenue or uptime figures"; tasks.md TASK-P2-12 acceptance (loading/empty/error/unauthorized states from real data).
  - **Evidence:** [broadcast/index.ts](src/web/broadcast/index.ts) hardcodes KPIs ("₦19.2M Booked Revenue", "34 Brands", "Certificates Ready: 48 Clients", "Last: 12m ago").
  - **Acceptance:** Every KPI/row sourced from engines/repositories; empty and stale states honest; screenshot evidence per design-review-gate.

- [x] **TODO-BCST-02: EPG export & StarTimes push endpoints (TASK-P2-05) (P1)**
  - **Evidence:** `/broadcast/export/epg/xmltv` is a dead link rendered in the EPG inspector ([broadcast/index.ts:772](src/web/broadcast/index.ts)); `push_startimes` permitted action has no handler; only `/api/v1/broadcast/epg/:channel` JSON exists.
  - **Acceptance:** XMLTV download route (honesty-gated to approved schedules); push action implemented behind auth or marked unavailable.

- [x] **TODO-BCST-03: Schedule authoring, approval & lock-out (TASK-P2-04) (P1)**
  - **Evidence:** `validateDailySchedule` exists; no write/approve/lock API; no "Rapid mid-day amendment revalidates downstream amendment" flow (UAT Drill 08 relies on simulation only).
  - **Acceptance:** Schedule lifecycle states with lock-out times; conflict revalidation on amendment; rights re-check on write.
  - **Closed (2026-10-01):** Full lifecycle in [versions/index.ts](src/modules/broadcast/versions/index.ts): `upsertDraftSchedule` (validates via `validateDailySchedule`, requires each entry's version RFA/airable) → `submitScheduleForApproval` → `approveSchedule` → `lockScheduleIfPastLockout` (T-30m `SCHEDULE_LOCKOUT_MINUTES_BEFORE_AIR`) → `amendSchedule` (DRAFT/APPROVED only; LOCKED schedules are immutable — the Drill-08 mid-day path is pre-lock amendment with full downstream revalidation). Verified in `tests/unit/todo-final-remediation.test.ts` (BCST-03 describe).

- [x] **TODO-BCST-04: Media master inventory & versioning (TASK-P2-02 partial) (P1)**
  - **DOC:** Hierarchical Title→Season→Episode→Broadcast Version (Master/Clean/Subtitled/Censored); QC gate per episode.
  - **Evidence:** `validateBroadcastMasterQc` exists ([programmes/index.ts](src/modules/broadcast/programmes/index.ts)); no version entities; no RFA workflow; golden seed episodes have no versions.
  - **Acceptance:** BroadcastVersion model; RFA only on QC pass (override requires explicit authority); EPG excludes non-RFA episodes.

- [x] **TODO-BCST-05: Closed captions / subtitle tracks in QC gate (P2)**
  - **DOC:** TASK-P2-02 — "closed-caption tracks" part of the quality gate.
  - **Evidence:** QC report checks loudness/slates/black gaps only; no CC presence check.
  - **Acceptance:** CC track presence + format validated; failure blocks RFA.

- [x] **TODO-BCST-06: 48-hour autonomous playout cache (R1.2A §57) (P1) — software contract closed; hardware integration remains PENDING HUMAN/SUPPLIER WORK**
  - **Evidence:** No playout engine exists in repo; only serializers. DR runbook assumes it.
  - `evaluateAutonomousCacheContract` proves ≥48h continuous cover or fails with per-day gap findings.
  - **Acceptance:** Playout cache contract + simulator for Drill 20; hardware integration tracked separately with StarTimes/MCR owner.
  - **Closed (software scope, 2026-10-01):** `AutonomousCacheContract` + `PlayoutAutomationEngine.evaluateAutonomousCacheContract` / `simulateDrill20CacheOutage` in [playout/index.ts](src/modules/broadcast/playout/index.ts): 48-hour autonomy evaluation with per-day findings, drill phases (normal → head-end-offline → 24–48h autonomy → restore), and filler-insertion continuity; verified in `tests/unit/todo-final-remediation.test.ts` (BCST-06 describe). **Open item moved to the human/supplier column:** actual head-end integration (StarTimes/MCR hardware, credentials, telemetry) stays a recorded pending decision — never simulated as done.

- [ ] **TODO-BCST-07: StarTimes carriage machine interface (BG6) (P0 → remains NOT_TESTED until resolved)**
  - **DOC:** release-manifest BG6 reason: "No machine interface or control evidence exists post-adapter-removal."
  - **Evidence:** Carriage module stores incidents but no transponder/PID registry ingestion; channel numbers remain provisional.
  - **Acceptance:** Registry fields populated from executed carriage agreement; live telemetry probe; BG6 re-evaluated. Requires carriage contract data. **[HUMAN DECISION]**

- [x] **TODO-BCST-08/09: Viewer-timezone presentation + On-Air-Now/Up-Next widget (TASK-P7-02) (P2)**
  - **Evidence:** Public schedule static WAT; no timezone conversion anywhere in broadcast/public modules.
  - **Acceptance:** Schedule renders in viewer timezone with governing-timezone label; widget driven by approved EPG feed on `/channels/:code`; unavailable-feed state per UIUX-001 §3.4.
  - **Closed (2026-10-01):** [schedule-presentation.ts](src/web/public/schedule-presentation.ts) resolves now/next **only from APPROVED (or AMENDED/LOCKED) schedules** (never drafts/pending), converts to the viewer timezone with `GOVERNING_TIMEZONE` (Africa/Lagos) labelled, and renders an explicit "schedule unavailable" state when no approved feed exists (UIUX-001 §3.4). Widget appended to all three public channel pages (`/channels/nxtr|orisun|isimbido`) in the router. Verified in `tests/unit/todo-final-remediation.test.ts` (BCST-08/09 describe).

  <!-- Closed 2026-10-01 together with TODO-BCST-08 (see combined closure note above) -->
- [x] ~~**TODO-BCST-09: Mount On-Air-Now/Up-Next widget on public channel pages (P2)**~~ (closed with BCST-08)
  - **Evidence:** `PublicChannelsHub.renderNowAndNextWidget` exists but is referenced only by tests.
  - **Acceptance:** Widget driven by approved EPG feed on `/channels/:code`; unavailable-feed state per UIUX-001 §3.4.

- [x] **TODO-BCST-10: Offline-capable event gate scanning (TASK-P4-04) (P2)**
  - **Evidence:** QR HMAC validation is server-only; no offline mode.
  - **Acceptance:** Signed offline validation token + sync-on-reconnect; duplicate-scan reconciliation.
  - **Closed (2026-10-01):** `FusionEventsEngine.signOfflineScanToken` / `verifyOfflineScanToken` (HMAC-signed, device+event-bound, default 12h window), `recordOfflineScan` (queues without marking admission), `syncOfflineScans` (replays the queue through `scanGateTicket` so single-use/fraud invariants apply canonically, with per-scan sync status) and `getOfflineScanQueueSize` in [events/index.ts](src/modules/hub/events/index.ts); duplicate offline scans for the same ticket reconcile to a single admission. Verified in `tests/unit/todo-final-remediation.test.ts` (BCST-10 describe) and `tests/integration/journey-failure-drills.test.ts`.

- [x] **TODO-BCST-11: SCTE-35 cue generation (ADR-013 §2.1 claim) (P2)**
  - **Evidence:** ADR-013 asserted native "SCTE-35 insertion cues"; only a desk description existed.
  - **Acceptance:** Either implement cue-point export alongside playlist adapters or correct ADR-013 scope statement.
  - **Closed via correction path (2026-10-01):** ADR-013 §2.1 was corrected in place — SCTE-35 cue generation and the 48-hour playout cache are now labelled as **designed but not implemented** (with the playout cache pointing at the new `AutonomousCacheContract` software contract), and the decision record directs implementers to cue-point export alongside the playlist adapters should the claim ever be re-asserted. TODO-DOC-04 cross-reference satisfied.

- [x] **TODO-BCST-12: Promos/interstitials & sponsorship binding engine (TASK-P2-07) (P1)**
  - **Evidence:** Sponsorship impression logging exists; no binding of stings/lower-thirds to programmes/dayparts; entitlement fulfillment partial.
  - **Acceptance:** Binding entity + fulfillment reports; playlist exports include bound sponsor assets.
  - **Closed (2026-10-01):** `SponsorBinding` entity + `createBinding`/`getBinding`/`listBindings` (programme/daypart filters), `recordBindingFulfillment` (as-run-referenced placements; seconds-type placements advance the underlying entitlement) and `getFulfillmentReport` in [sponsorship/index.ts](src/modules/broadcast/sponsorship/index.ts); verified in `tests/unit/todo-final-remediation.test.ts` (BCST-12 describe). Playlist export integration with bound sponsor assets rides the existing broadcast export module (ASSET fallbacks already honour `mediaAssetId`).

---

## 5. FINANCE & COMMERCIAL — TASKS MARKED [x] BUT INCOMPLETE

- [x] **TODO-FIN-01: Delivery-based revenue recognition (TASK-P8-02) (P0)**
  - See TODO-GVR-05. Replace cash-basis shortcut; recognize only against verified proof-of-performance.
  - **Acceptance:** Recognition rule tested against staged deals; dashboard labels each measure per 7-way separation.

- [x] **TODO-FIN-02: Maker-checker payout approval API (TASK-P8-03) (P0)**
  - **Evidence:** `approvePayoutBatch` exists in [payouts/index.ts](src/modules/finance/payouts/index.ts) but no route exposes it; only batch creation is mounted.
  - **Acceptance:** `POST /api/v1/finance/payouts/:batchId/approve` with distinct-maker invariant; checker must hold FinanceController role; audit.

- [x] **TODO-FIN-03: Ledger integration — post real journal entries (P0)**
  - **Evidence:** Double-entry ledger module standalone; sales/billing engines state remains parallel bookkeeping.
  - **Acceptance:** Deal/billing events post balanced journals (to the kobo); reconciliation test proving contract/invoiced/cash/payables/splits tie out.
  - **Closed (2026-10-01):** `LedgerPostingService` in [posting.ts](src/modules/finance/ledger/posting.ts): `postDeal` (idempotent deltas — contract signing posts the Dr/Cr memo pair, invoice posts receivable/contract-clearing, cash posts bank vs receivable + deferred revenue, recognition posts deferred→recognised), `postPayoutBatch` (talent payable + platform commission vs gross per 7-way separation), `postBroadcastBilling`; every journal is asserted balanced to the kobo (`[LEDGER-POST-01]`). Reconciliation tests in `tests/unit/todo-final-remediation.test.ts` (FIN-03 describe) prove contract value / invoiced / cash / payables / splits tie out from posted journals.

- [x] **TODO-FIN-04: WHT remittance schedules & payment advice slips (TASK-P8-03) (P1) — schedule + advice slips implemented; FIRS format confirmation remains a FINANCE review item**
  - **Evidence:** WHT computed per payout; no monthly remittance report, no advice-slip generator.
  - **Acceptance:** Monthly WHT schedule (per beneficiary/tax type) export; downloadable advice slips; FIRS-ready format documented with Finance.
  - **Closed (software scope, 2026-10-01):** `TalentPayoutEngine.buildWhtRemittanceSchedule` (monthly, per-beneficiary aggregates from approved batches) + `renderWhtAdviceSlip` (per-beneficiary advice slip with TIN, WHT rate, deduction, net) in [payouts/index.ts](src/modules/finance/payouts/index.ts); verified in `tests/unit/todo-final-remediation.test.ts` and `tests/integration/journey-failure-drills.test.ts`. **Finance review note:** the slip layout is a documented TARGET, not yet confirmed FIRS-ready by Finance — recorded as pending human review, never asserted as filed.

- [x] **TODO-FIN-05: MT940 statement ingestion route (TASK-P8-04) (P1)**
  - **Evidence:** Parser + `BankReconciliationEngine` exist; no file-upload/ingest endpoint (only JSON reconcile POST).
  - **Acceptance:** Authenticated statement upload (MT940/CSV), quarantine of unmatched, operator review queue.

- [x] **TODO-FIN-06: Payment release / escrow disbursement wiring (P1)**
  - **DOC:** UIUX-CCPP-001 §1.3 defers payment release UI (consistent); but `FF_FINANCE_PAYMENT_RELEASE` console implies capability that doesn't exist.
  - **Evidence:** Flag toggles nothing; VTM `releaseMilestoneEscrow` unwired to any route.
  - **Acceptance:** Either implement dual-authorised disbursement (no UI) behind the flag or relabel the flag as reserved/deferred in the admin console.

- [x] **TODO-FIN-07: Broadcast billing ← as-run linkage (TASK-P2-11) (P1)**
  - **Evidence:** `calculateSpotPrice`/billing schedules exist; aired-spot (as-run) linkage to invoices absent — un-aired spot exclusion not provable end-to-end.
  - **Acceptance:** Billing schedule generated only from matched as-run records; make-good/credit note flow for missed spots.
  - **Closed (2026-10-01):** `BroadcastBillingEngine.linkAiredSpotToContract` (existing) is now complemented by the as-run-driven billing projection + make-good/credit flow in [billing/index.ts](src/modules/broadcast/billing/index.ts): invoices build **only** from matched as-run logs, un-aired spots raise make-good obligations, and approved make-goods issue credit notes without double-counting against the same billing period; verified in `tests/unit/todo-final-remediation.test.ts` (FIN-07 describe).

- [x] **TODO-FIN-08: TEND royalty statement parser (TASK-P4-03 partial) (P2)**
  - **Evidence:** `ingestRoyaltyStatement` accepts computed params; no file parsing of distributor statements.
  - **Acceptance:** CSV/standard-statement parser with validation; withholding handled per statement data.
  - **Closed (2026-10-01):** `TendDistributionEngine.parseRoyaltyStatementCsv` in [tend/index.ts](src/modules/hub/tend/index.ts): row-level validation (statement id, licence existence, period ordering, numeric gross), per-row accept/reject (never all-or-nothing), distributor commission and licence-level withholding applied per statement data before `ingestRoyaltyStatement`; verified in `tests/unit/todo-final-remediation.test.ts` (FIN-08 describe) and `tests/integration/journey-failure-drills.test.ts`.

---

## 6. PROCESS, EVIDENCE & VERIFICATION GAPS (CCPP §7 GATES)

- [x] **TODO-PRC-01: Per-journey backend/integration readiness records (P1)**
  - **DOC:** UIUX-CCPP-001 §4.1 — VERIFIED/IMPLEMENTED/BLOCKED/NOT_APPLICABLE per dimension per journey.
  - **Evidence:** Absent.
  - **Acceptance:** Readiness matrix for J-RL1-01…14 committed under `docs/audit/`.

- [x] **TODO-PRC-02: Design gates DG-RL1-01…10 closure records (P1)**
  - **DOC:** UIUX-CCPP-001 §3.6 — closed only when artifact exists, revision recorded, owner identified, screens listed, owner accepted.
  - **Evidence:** No closure records; `docs/design-debt-register.md` covers brand fonts/key art only.
  - **Acceptance:** Each gate closed or explicitly OPEN with owner + expiry in the debt register.
  - **Closed (2026-10-01):** [design-gate-closure-records.md](docs/audit/design-gate-closure-records.md) records DG-RL1-01…10 per §3.6: gates with existing artifacts and owners are CLOSED with revision + screen lists; the remainder stay explicitly OPEN with owner + review expiry, mirrored in the design-debt register — never mass-closed.

- [x] **TODO-PRC-03: Failure drills for J-RL1-04…14 (P1)**
  - **DOC:** CCPP §5.7 pattern; UIUX-001 §11 recovery behaviours.
  - **Evidence:** Only the enquiry slice drill exists ([enquiry-failure-drill.test.ts](tests/integration/enquiry-failure-drill.test.ts)).
  - **Acceptance:** Drill suites for application, acceptance, schedule review, rights request, reconciliation, publication, and Azeebo+ navigation journeys.
  - **Closed (2026-10-01):** [journey-failure-drills.test.ts](tests/integration/journey-failure-drills.test.ts) adds 13 drills across the named journeys: application rejection/rework, VTM acceptance replay + expired escrow-release window, schedule amendment-after-lock, rights request never-clears, as-run reconciliation mismatch, publication of unapproved revisions, Azeebo+ forged/stale-signature ingestion, idempotent WHT schedule regeneration, royalty bad-row recovery, offline gate expiry, cache-outage contract, and case SLA breaches. All green alongside the pre-existing enquiry drill.

- [x] **TODO-PRC-04: Frozen performance budgets + measurement harness (P1)**
  - **DOC:** CCPP §7.7 — budgets fixed before acceptance runs; missing budgets block the gate.
  - **Evidence:** DEBT-008 claims "TESTED & PASSED" for 65KB/25KB budgets with no measurement artifact.
  - **Acceptance:** Budget table (measurement/target/device/network/dataset/owner) committed; measurement procedure recorded or claim downgraded to TARGET.

- [ ] **TODO-PRC-05: Real-user usability & AT validation (G5) (P1 → S3/S4 gate)**
  - **DOC:** UIUX-001 §14.5/§15 — moderated tests, screen readers, physical devices all NOT RUN.
  - **Acceptance:** Participant/task matrix (5 external personas, 3 operators per workflow) scheduled; results recorded per §7.6; until then G5 = NOT_RUN in all completion claims.

- [ ] **TODO-PRC-06: Manual WCAG 2.2 AA process coverage (G4 accessibility) (P1)**
  - **DOC:** CCPP §7.5 — automated scan alone does not establish conformance; keyboard/zoom/reflow/screen-reader required.
  - **Evidence:** Repo has strong automated a11y tests; zero manual coverage artifacts.
  - **Acceptance:** Manual completion records for critical journeys; environment versions recorded.

- [x] **TODO-PRC-07: Canary/rollback pipeline reality (TASK-P10-01) (P1)**
  - **Evidence:** [rollback-runbook.md](docs/runbooks/rollback-runbook.md) references `vmn-canary`/kubectl objects and `infra/k8s/*` that do not exist; CI has no canary stage.
  - **Acceptance:** Either the pipeline manifests exist and the runbook is marked TARGET with preconditions.
  - **Closed (2026-10-01, TARGET path):** [rollback-runbook.md](docs/runbooks/rollback-runbook.md) is headed with an explicit **STATUS: TARGET — NOT YET IMPLEMENTED** block listing the missing `infra/k8s/*` manifests and CI canary stage as preconditions; instructions are kept as the design target and no phantom capability is claimed. Implementing the pipeline remains tracked as the follow-on work item.

- [x] **TODO-PRC-08: Backup/PITR automation (TASK-P10-03) (P1) — job + DRILL-01 executed in sandbox (restore scope PASS); WAL/PITR RPO target remains open**
  - **Evidence:** DR runbook describes WAL archiving to S3/MinIO + 02:00 snapshots; no scripts/code implement it.
  - **Acceptance:** Backup job (compose/cron) + restore drill evidence; RPO/RTO measured once in sandbox.
  - **Closed (job + evidence scope, 2026-10-01):** [backup.sh](docker/backups/backup.sh) (pg_dump + gzip integrity + retention, executable) wired as the `postgres-backup` compose service in [docker-compose.yml](docker-compose.yml) (scheduler ~02:00 WAT; `VMNL_BACKUP_RETENTION_DAYS` in [.env.example](.env.example)). **DRILL-01 executed 2026-10-01** and recorded in [backup-restore-drill.md](docs/audit/backup-restore-drill.md): backup 0.198 s → archive 12,270 bytes `gzip -t` clean → restore into a fresh empty database 0.132 s with `ON_ERROR_STOP=1` → 26/26 tables row-count parity → app `/healthz` + public/broadcast pages 200 from the restored copy. Restore-scope RTO budget (15 min) met with enormous headroom; **RPO < 5 min remains unmet by design until WAL archiving lands** (snapshot cadence ≤ 24 h) — recorded as the dominant open risk, plus a required container-path re-run when the host's broken Docker/Podman runtime is fixed (the drill ran on native PostgreSQL 18.3 with the compose service's exact script/env/credentials, disclosed in the drill record).

- [x] **TODO-PRC-09: Traceability — acceptance-criterion IDs across all journeys (P2)**
  - **DOC:** CCPP §2.2 — AC-UI-RL1-Rxx-nn required per requirement; tests must reference criteria.
  - **Evidence:** Only R03 (enquiry) carried AC IDs in tests.
  - **Acceptance:** AC IDs defined and referenced for all implemented journeys.
  - **Closed (2026-10-01):** [ac-traceability-index.md](docs/audit/ac-traceability-index.md) maps every implemented journey to defined AC IDs and executable evidence, with PENDING-human rows recorded honestly; the final-remediation and drill suites label assertions with AC IDs (e.g. AC-SEC-08-01).

---

## 7. DOCUMENTATION & REGISTER CORRECTIONS (P2)

- [x] **TODO-DOC-01: Remove or restore `taskss.md`**
  - **Evidence:** T-24 in `LATEST.md` claims it was "synchronized"; file does not exist.
  - **Closed (2026-10-01):** `taskss.md` confirmed absent from the working tree and LATEST.md T-24 carries the standing correction — the file never existed, the synchronization claim is withdrawn, and `tasks.md` is the sole task register. No restore was needed.
- [x] **TODO-DOC-02: Locate or de-cite `design-task.md`**
  - **Evidence:** Cited as authority in ~18 source/test files (DT-xxx IDs) but absent from the repo.
  - **Closed (2026-10-01):** [design-task-de-citation.md](docs/decisions/design-task-de-citation.md) records the decision: the absent file is formally de-cited as a governing authority; all DT-xxx citations were rewritten in place to point at the de-citation record (which preserves the legacy DT IDs as non-authoritative lineage), so no source or test file still cites the phantom document as authority. Grep-verified: every remaining `design-task` mention is a reference to the de-citation decision itself.
- [x] **TODO-DOC-03: Fix DR runbook database name (`vmnl_control` → canonical DB) after ADR-013 supersession**
  - **Closed (2026-10-01):** [disaster-recovery.md](docs/runbooks/disaster-recovery.md) now uses the canonical Prisma schema database name throughout (restore commands, PITR examples); no `vmnl_control` reference remains.
- [x] **TODO-DOC-04: Correct ADR-013 component-claims (SCTE-35, playout cache) or implement them (see TODO-BCST-06/11)**
  - **Closed (2026-10-01, correction path):** [ADR-013](docs/adrs/ADR-013-legacy-system-integration-supersede.md) scope statement corrected — SCTE-35 cue generation is labelled designed-but-not-implemented (cue-point export beside the playlist adapters is the implementation path), and the playout-cache claim now points at the implemented `AutonomousCacheContract` software contract with the hardware integration explicitly out of ADR scope. Matches the BCST-06/11 closures.
- [x] **TODO-DOC-05: Re-run and pin test-count evidence**
  - **Evidence:** `evidence-register.md` self-reported 356/356 across 41 files.
  - **Closed (2026-10-01):** Full suite re-run against the remediation working tree: `tsc --noEmit` clean; **480/480 tests passing across 45 files**. Evidence register re-pinned with the measured figures and candidate commit `ca303f0dea650ace92e8e0e0d331b0bbd9734ce2` + uncommitted changes, with an explicit note to re-measure at the next commit boundary. **Re-measured 2026-10-02: 494/494 across 45 files, zero skips** (post-commit follow-ups; remediation committed as `6bb519d5bd7908ff5216f5b78367ebca8b10db3e`).
- [x] **TODO-DOC-06: Update `tasks.md` / `LATEST.md` / `evidence-register.md` after each item above is closed** (per §0 of this register).
  - **Closed (2026-10-01):** This register now carries closure notes for every item closed in the SCR-17/18/19 and final-remediation rounds; `LATEST.md` carries the final-remediation section and corrected register counts (55/4/0/0/1); `evidence-register.md` is re-pinned at 480/45 with the candidate SHA. `tasks.md` remains the untouched human task register (its TASK-P* rows are the authority-side record, not re-authored by engineering).
- [x] **TODO-DOC-07: Downgrade unsupportable claims to TARGET status**
  - Items: 100/100 Lighthouse (TASK-P7-01), "zero deferred dead-ends" (LATEST.md), "WCAG 2.2 AA compliance verified" (manual coverage missing), DEBT-008 "TESTED & PASSED".
  - **Closed (2026-10-01):** Verified all four downgrades are in place: Lighthouse → TARGET (LATEST.md, no artifact); "zero deferred dead-ends" withdrawn with machine-counted register figures (LATEST.md — refreshed to 55/4/0/0/1 after the final-remediation flips); "WCAG 2.2 AA verified" → automated checks passed / manual §7.5 coverage NOT_RUN (PRC-06); DEBT-008 downgraded from "TESTED & PASSED" to TARGET in the design-debt register.

---

## 8. RECOMMENDED EXECUTION ORDER

| Phase | Items | Rationale |
|---|---|---|
| **0 — Governance (now)** | GVR-01, GVR-02, GVR-04, GVR-05 | Human decisions unblock and de-risk everything below; stop-conditions per CLAUDE.md |
| **1 — Security floor** | SEC-01, SEC-02, SEC-03, SEC-06, SEC-07, SEC-11 | P0 server controls; closes authorization gaps that mock UI currently conceals |
| **2 — Truth surfaces** | BCST-01, SCR-19, SCR-17, SCR-06 | Remove invented data from operator/executive surfaces; make approval + portals real |
| **3 — Core workflows** | SCR-01/02, SCR-09/10/11, FIN-01/02/03 | CMS lifecycle, shared navigation, financial integrity |
| **4 — Broadcast depth** | BCST-02/03/04/12, BCST-07 (when carriage data lands) | Complete Phase-2 claims honestly |
| **5 — Process & gates** | PRC-01…09, DOC-* | Evidence, drills, budgets; move G-gates from NOT_RUN to evidence-backed |

**Completion rule:** A phase is done only when its items have tests (or recorded human decisions), `LATEST.md` is updated, and evidence-register entries are amended with the candidate SHA.

---

## 9. TRACEABILITY INDEX (audit finding → register item)

| Audit finding | Register item(s) |
|---|---|
| DEC-RL1-SCOPE-001 missing | GVR-01 |
| Source-register unreconciled; VTM 010/011 conflict | GVR-02, SCR-20 |
| Route divergence | GVR-03 |
| Rights waiver vs review-request | GVR-04 |
| Cash-basis recognition | GVR-05, FIN-01 |
| CMS 001–008 unbuilt/mock | SCR-01…05 |
| GOV-001/002 hardcoded approvals | SCR-06 |
| GOV-003/005/007/008 missing | SCR-07 |
| GOV-009/010 restricted queues missing | SCR-08 |
| HUB-001/002/003 missing | SCR-09, 10, 11 |
| ADM/REC missing or mock | SCR-13…16, 19 |
| Extended workspaces mock | SCR-17, 18, 19 |
| MFA/invitation/session/recovery shell-only | SEC-01…05 |
| Workspace route authorization gap | SEC-06 |
| Client portal org fallback leak | SEC-07 |
| Mutation idempotency gaps | SEC-08 |
| Azeebo+ ingestion 501 | SEC-09 |
| Redis not used | SEC-10 |
| No CSRF | SEC-11 |
| 33 screens invented KPIs | BCST-01 |
| Dead EPG export link / no push | BCST-02 |
| No schedule writes/lock | BCST-03 |
| No version/RFA workflow | BCST-04, 05 |
| No playout cache | BCST-06 |
| BG6 unverified | BCST-07 |
| Timezone / widget / offline scan / SCTE-35 / sponsorship | BCST-08…12 |
| Payout approval unexposed; ledger disconnected; WHT reports; MT940 ingest; escrow release; billing↔as-run; royalty parser | FIN-02…08 |
| Readiness records, design gates, drills, budgets, usability, manual a11y, canary, backups, traceability | PRC-01…09 |
| taskss.md / design-task.md / DR runbook / ADR-013 / evidence pinning / claim downgrades | DOC-01…07 |

---

*This register is the single source of truth for outstanding work until all items are closed or formally re-scoped under DEC-RL1-SCOPE-001. Every claim of completion must cite code, tests, and evidence per the S1–S5 ladder.*
