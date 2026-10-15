# Remediation Evidence Register — retired TODO-001 register execution (2026-09-30)

> **Which register this evidences (TSK-07).** This file evidences the execution of the retired
> `todo.md` register (`VMNL-AZP-VMN-TODO-001`). The live register is **`tasks.md` —
> `VMNL-AZP-VMN-TODO-002`**, and the `TODO-SEC-* / TODO-SCR-* / TODO-BCST-* / TODO-FIN-* /
> TODO-PRC-* / TODO-GVR-* / TODO-DOC-*` identifiers used below are **inherited, not renumbered**:
> where such an item is still open it is reopened in `tasks.md` §1.3 under its original ID
> (e.g. `TODO-BCST-01` → `TSK-11`, `TODO-SEC-10` → `TSK-27`, `TODO-FIN-07` → `TSK-33`).
> `todo.md` itself is deleted by recorded decision.
>
> **Verification figures below are superseded.** The "506 passed / 45 files, zero skips ·
> `tsc --noEmit` clean" pin of 2026-10-02 described a tree that failed to compile with 152 errors
> (`report.md` §1, CA-01/CA-25). The measured pin is `tasks.md` TSK-08 /
> `docs/handoffs/LATEST.md` "Verification pin — 2026-10-07": tsc 0 errors, build 0, lint 0,
> **50 files / 588 tests, 0 skipped** (with the recorded no-Postgres environment caveat).

**Document:** `VMNL-AZP-VMN-REM-EVID-001 — R1.0`
**Authority:** TODO-PRC-09 (traceability), TODO-DOC-05/06 (evidence pinning and register updates).
**Verification run (this tree):** `npx tsc --noEmit` clean · `npx vitest run --reporter=basic` → **506 passed / 45 files, zero skips** (incl. 21 desk-rewiring tests from Round 6B and 74 final-remediation tests + 13 journey drills from Round 6C; measured 2026-10-02 after the post-commit follow-ups — review-queue media visibility, content-editor picker wiring, golden-seed DAM backfill, EPG & channel-schedule DAM master surfacing, schedule-entry episodeCode + live now/next master, schedule-review-desk channel-keyed linkage. Under host load the full suite flakes on HTTP timeouts, so the run was first confirmed sharded at `--maxWorkers=2` (96/96 contract+security+integration+a11y, 391/391 unit) and then re-confirmed at default workers once load recovered) · `eslint` 0 errors (warnings remain pre-existing unused-param style). **Commit-boundary chain (TODO-DOC-05, re-pinned 2026-10-02):** remediation `6bb519d5bd7908ff5216f5b78367ebca8b10db3e` = 480/480 · first follow-up batch `b80ba126bbfcba7510c7bf38e53caab12e40462c` = 494/494 · this working tree (uncommitted on top of `b80ba12`) = 506/506 — next pin due at the following commit boundary.

## Round 6C — Final remediation traceability (2026-10-01)

| Register item | Implementation | Test / evidence |
|---|---|---|
| SEC-04 remainder (first-use profile) | `saveFirstUseProfile/getFirstUseProfile` (`src/core/auth/sessions.ts`) + router `POST /auth/profile-setup` (audited, redirect contract) | `tests/unit/todo-final-remediation.test.ts` — profile describe |
| SEC-06 workspace HTML guards | `WORKSPACE_HTML_GUARDS` + central `GET /workspace*` enforcement in `src/api/router.ts` (anonymous redirect; 403 `renderAccessDeniedHtml`) | route-authorization suite + `todo-remediation.test.ts` SEC-06 describes |
| SEC-08 mutation idempotency | `checkIdempotency/recordIdempotentOutcome` wired into VTM sign, approval decide, client questions, rights review, content publish (replay returns original ticket/hash/revision) | `todo-final-remediation.test.ts` — SEC-08 route-level describe (port 4261 harness) |
| SEC-09 webhook code scope | `signInboundRaw/verifyInboundSignature` (timing-safe) + full status contract (400/401/`authenticated:true`); prod 501 gate retained pending partner contract | enterprise E2E (signed + forged-signature assertions) |
| SEC-10 cache adapters | `src/core/cache/index.ts`: `KeyValueAdapter`, `MemoryKeyValueAdapter`, `RedisKeyValueAdapter` (injected `MinimalRedisClient`), `configureRedisAdapterFactory`/`resolveKeyValueAdapter`; auth rate-limit/lockout stores run `useKeyValueAdapterForAuthStores` | `todo-final-remediation.test.ts` — SEC-10 describe; `auth.test.ts`, `security-auth-rbac.test.ts` green |
| SEC-11 CSRF | double-submit token + Origin allow-list + central urlencoded-POST enforcement; `GET /auth/csrf`; body stash | `todo-final-remediation.test.ts` — CSRF describes; security fuzz suite |
| SCR-13 access console | `renderAccessAdminConsoleHtml` (`src/web/workspace/admin-consoles.ts`); `GET /workspace/admin/access` (SuperAdmin-only, read-only) | `todo-final-remediation.test.ts` — SCR-13 describe |
| SCR-15 source mappings | `src/core/config/source-mappings.ts` HX-01…14 + `GET /workspace/admin/source-mappings` | `todo-final-remediation.test.ts` — SCR-15 describe (counts + `[SRCMAP-*]`) |
| SCR-20 payment visibility | `src/web/portal/vtm-payment-visibility.ts`; `GET /portal/vtm/payment-visibility` | `todo-final-remediation.test.ts` — SCR-20 describe |
| BCST-03 schedule lifecycle | **re-measured 2026-10-08 (TSK-12).** `src/modules/broadcast/versions/index.ts` now implements the PRD §15 chain, not the Round-6C subset: DRAFT→PROGRAMMING_REVIEW→RIGHTS_CHECK→TRAFFIC_READY→APPROVED→PLAYLIST_GENERATED→ON_AIR→AS_RUN_RECONCILED→ARCHIVED, plus the controls AMENDED/LOCKED; revision identity (`…#R1`, `#R2` on amendment, frozen entry sets); ON AIR and AS-RUN RECONCILED accept only verified operational evidence. `PENDING_APPROVAL` is gone from this machine. The Round-6C description ("upsert→submit→approve→lockout(T-30m)→amend") was the finding CA-14, not the requirement | `tests/unit/broadcast-schedule-lifecycle.test.ts` (13 tests: PRD-vs-code instrument, every stage in order, 11 guarded transitions, blocked candidate, anonymous-authority refusals, revision identity/freeze, amendment→R2→re-export, evidence-only ON AIR, reconciliation, LOCKED/AMENDED export) + `tests/unit/todo-final-remediation.test.ts` BCST-03 describe + drill: amendment-after-lock; machine described in `docs/domain/state-machines.md` §1 |
| BCST-06 cache contract | `AutonomousCacheContract` + `evaluateAutonomousCacheContract`/`simulateDrill20CacheOutage` (`playout/index.ts`); hardware stays human/supplier | `todo-final-remediation.test.ts` — BCST-06 describe; drill: cache-outage contract |
| BCST-08/09 presentation | `src/web/public/schedule-presentation.ts` (approved-schedules-only now/next, viewer TZ + `GOVERNING_TIMEZONE` label, honest unavailable state); widget on `/channels/nxtr|orisun|isimbido` | `todo-final-remediation.test.ts` — BCST-08/09 describe |
| BCST-10 offline gate scans | `FusionEventsEngine.signOfflineScanToken/verifyOfflineScanToken/recordOfflineScan/syncOfflineScans` (single-use + fraud invariants preserved through sync) | `todo-final-remediation.test.ts` — BCST-10 describe; drill: offline expiry |
| BCST-12 sponsor bindings | `SponsorBinding` + `createBinding/listBindings/recordBindingFulfillment/getFulfillmentReport` (`sponsorship/index.ts`) | `todo-final-remediation.test.ts` — BCST-12 describe |
| FIN-03 ledger posting | `LedgerPostingService` (`src/modules/finance/ledger/posting.ts`) — balanced journals, kobo-exact, idempotent deltas | `todo-final-remediation.test.ts` — FIN-03 reconciliation describe |
| FIN-04 WHT remittance | `buildWhtRemittanceSchedule`/`renderWhtAdviceSlip` (`payouts/index.ts`); FIRS-format confirmation left to Finance | `todo-final-remediation.test.ts` + drills — WHT describes |
| FIN-07 billing←as-run | billing built only from matched as-run logs (`src/modules/broadcast/billing/index.ts:161-240`) + make-good credit notes that are actually posted to the ledger as contra-revenue (`modules/finance/ledger/posting.ts:235`, wired into the served process at `api/server.ts:299` and reached from the proof-of-air resolve route) — closed 2026-10-09 by TSK-16 + TSK-33 | `todo-final-remediation.test.ts` — FIN-07 describe; `tests/unit/poa-delivery-exceptions.test.ts` (13 tests, incl. the law-5 "a credit never becomes revenue" assertion) |
| FIN-08 royalty CSV | `TendDistributionEngine.parseRoyaltyStatementCsv` (per-row validation, commission + licence withholding) | `todo-final-remediation.test.ts` — FIN-08 describe; drill: bad-row recovery |
| PRC-02 gate closure records | `docs/audit/design-gate-closure-records.md` (CLOSED + OPEN-with-owner recorded honestly) | — (documentation evidence) |
| PRC-03 journey drills | `tests/integration/journey-failure-drills.test.ts` (13 drills) | green in full run |
| PRC-07 rollback TARGET | `docs/runbooks/rollback-runbook.md` STATUS block with preconditions | — (documentation evidence) |
| PRC-08 backup automation | `docker/backups/backup.sh` + compose `postgres-backup` service + `docs/audit/backup-restore-drill.md` — **DRILL-01 executed 2026-10-01: restore 0.132 s, 26/26 table parity, app 200 from restored copy; WAL/PITR RPO target still open** | — (job + executed-drill evidence) |
| PRC-09 AC-ID index | `docs/audit/ac-traceability-index.md` | — (documentation evidence) |
| DOC-01…07 | taskss.md phantom withdrawn; design-task.md de-cited (`docs/decisions/design-task-de-citation.md`); DR runbook DB name fixed; ADR-013 corrected; evidence re-pinned 480/45 @ `ca303f0`+tree; claims downgraded | grep-verifiable in-repo |
| DOC-05 evidence re-pin (TSK-08) | `docs/audit/evidence-register.md` Tier S2 block + §5 "What is NOT verified" DB bullet; `docs/handoffs/LATEST.md` verification pin; `audit.md` §5 supersession pointer — all re-measured 2026-10-08 to **tsc 0 · build 0 · lint 0 · 63 files / 689 tests / 0 skipped / 0 unhandled errors** over `ce098f8` + 167 dirty paths (114 M / 51 ?? / 2 D). `release-manifest.json:4` still names `ca303f0` and is recorded as BLOCKED on TSK-09 rather than re-pinned to a SHA that does not exist | `git status --porcelain \| awk '{print $1}' \| sort \| uniq -c` · `pnpm test` · `tests/unit/register-inheritance.test.ts` (prints the §1.4 census it enforces) |
| TSK-17 durable release-critical stores (report.md CA-12) | 14 tables in two purely additive migrations (`20261008213000_add_release_critical_durable_stores`: 9 tables / 17 indexes; `20261008220000_add_remaining_release_critical_durable_stores`: 5 tables / 8 indexes), zero drift re-checked afterwards; one persist/load pair per store in `src/core/database/repositories/release-critical.repository.ts`; write-behind journal `src/core/database/durable-journal.ts` staged by each domain mutator, drained at `sendJson` (`src/api/router.ts:573`) and at `server.stop()` (`src/api/server.ts:422`); boot hydration dependency-ordered at `src/api/server.ts:326-339` and `:374-375`; `fail_closed` default with the sandbox path counted as `sandboxDeferred` | `tests/unit/durability-release-critical.test.ts` (**19 tests**, each restart a real second OS process — `tests/helpers/durable-restart-reader.mjs` — that boots `dist/src` and reports only what Postgres returned; `database: false` fails the test rather than passing an unmeasurable run); fail-closed proven twice (injected journal rejection + real HTTP `POST /api/v1/workspace/approvals` → **503 `REPOSITORY_UNAVAILABLE`** with the optimistic index entry rolled back); gate logs `docs/audit/evidence/tsk17-durability-2026-10-08/` (tsc/lint/build 0, `pnpm test` **64/705 twice**, coverage 78.14/69.31/81.69/79.52, `migrate status` + empty diff) |
| SCR-03 media picker + editor integration | `registerMediaAsset`/`listApprovedMediaAssets` (`src/core/storage/index.ts`) + `src/web/workspace/media-picker.ts` + `src/web/workspace/content-editor.ts`; `GET /workspace/content/media-picker`, `POST/GET /api/v1/cms/media-assets`, `GET /workspace/content/editor[/:id]`, guarded `POST /api/v1/workspace/content-editor[/update]`; `[CMS-11]` registry validation wired via `wireMediaAssetLookup`; **review-queue media-reference column** (`renderQueueMediaCell` in governance-and-operations.ts resolves each row against the CMS store + DAM registry, flagging quarantined/failed/unregistered refs and phantom demo rows) | `todo-final-remediation.test.ts` — SCR-03 describes (provenance/access-state contract, tenant scoping, 401/route authority, `[CMS-11]` rejections, review-queue badge/empty/phantom-row assertions, CSRF-flow create→edit→persisted-picker-selection E2E) |

## Round 6B — SCR-17/18/19 desk rewiring traceability (2026-09-30)

| Register item | Implementation | Test evidence |
|---|---|---|
| SCR-17 proposal→deal handoff | `CommercialProposalStore` (`src/web/workspace/commercial-proposal.ts`); routes `POST /api/v1/commercial/proposals` + `/:id/accept` (guarded create/update:contract) | `tests/unit/scr-desk-rewiring.test.ts` — SCR-17 describes (net-value binding, CONTRACT_SIGNED handoff, `[PROP-04]` double-accept, `[QTC-AUTH-01]` dual control) + `extended-workspaces.test.ts` HTTP path |
| SCR-18 accelerator | `TalentAcceleratorRegistry.listHubs/filterTalent/registerHub` projection + guarded hub intake | `scr-desk-rewiring.test.ts` — hub registration + `[TALENT-HUB-01]`; `extended-workspaces.test.ts` — desk renders `HUB-LOS-001` |
| SCR-18 community | `AfroFusionCommunityHub` projection (`listMembers/listResources/listBookings`) + canonical member registration | `scr-desk-rewiring.test.ts` — member write-through |
| SCR-18 VTM workbench | `vtmEngine.getBrief/matchTalent/createStandardContract` over registry profiles; cast route drafts escrow-backed contract | `scr-desk-rewiring.test.ts` — contract-from-brief; `extended-workspaces.test.ts` — populated match snapshot |
| SCR-18 ONE Studios | `OneStudiosEngine.getAvailableAssets/publishCallSheet`; call-sheet route persists canonical sheets | `scr-desk-rewiring.test.ts` — call-sheet retrieval |
| SCR-18 VCF | `VirtualContentFundEngine.getAllPitches/getActiveSlate/submitPitch`; submission enters evaluation pipeline | `scr-desk-rewiring.test.ts` — pitch + greenlight evaluation |
| SCR-18 events | `FusionEventsEngine.listEvents/listTicketsForEvent/getGateStatistics/scanGateTicket` — real HMAC single-use validation | `scr-desk-rewiring.test.ts` — admit/reuse-ALREADY_CHECKED_IN/TICKET_NOT_FOUND; `extended-workspaces.test.ts` — unknown ticket `verified:false` |
| SCR-18 TEND | `TendDistributionEngine.getCatalogueTitles/listLicenses/registerTitle`; avails enforced at licence creation | `scr-desk-rewiring.test.ts` — `[TEND-LIC-02]` overlap block |
| SCR-18 tail Headspace | `HeadspaceKnowledgeEngine.listDocuments` catalogue; confidentiality enforced at access; guarded doc registration | `scr-desk-rewiring.test.ts` — seed docs + `[HSP-AUTH-01]` |
| SCR-14/18 tail Cr8Tech | Runtime-state health (Azeebo circuit, queue worker) + explicit NOT_CONFIGURED rows; `POST /cr8tech/test-all` retired 410 | `extended-workspaces.test.ts` — no invented endpoints; 410 regression |
| SCR-18 tail AOS | `AgenticOperatingSystem.listAgents` registry + audit trail; kill switch `engageGlobalKillSwitch` really isolates | `scr-desk-rewiring.test.ts` — fail-closed isolation; `extended-workspaces.test.ts` — `bot-001` renders |
| SCR-19 partner portal | Canonical deals scoped via `getClientOrgRelationship`; cross-org 403 | `extended-workspaces.test.ts` — scoped GET; scoping logic unit-covered in SCR-19 describes |
| SCR-19 client portal | Canonical `QuoteToCashSalesEngine` deals projected by `clientOrgId` (`projectClientPortfolio`); `MOCK_CLIENT_PROJECTS` deleted 2026-10-09 (TSK-13); the per-deliverable and per-airing feeds state NOT CONNECTED rather than being invented, with the join registered as TSK-60 | `client-portal-and-operations.test.ts` — scoped portfolio render + honest empty state + fixture-deletion guard + 401/403/503 with a live-deal leak probe |
| SCR-19 creator portal | `TalentPayoutEngine.listBatches` → beneficiary-scoped settlement lines (gross/fee/WHT/net distinct) | `scr-desk-rewiring.test.ts` — beneficiary scoping excludes other creators |
| SCR-19 vendor portal | Canonical PO records only; explicit recorded-deferral empty state (DEC-RL1-SCOPE-001) | `extended-workspaces.test.ts` — "does not fabricate POs" |
| SCR-19 management overview | Computed from engines (channels, pipeline contract/cash/recognition kept distinct per FIN-01) | `extended-workspaces.test.ts` — computed-figure render |
| SCR-19 risk/issue registers | `core/work` domain + guarded routes; new `update:risk` RBAC resource (derived perms) | `scr-desk-rewiring.test.ts` — `[RISK-01]`/`[ISSUE-04]` lifecycle; `extended-workspaces.test.ts` — end-to-end guarded flow incl. 401 |
| Mock deletion guarantee | All 16 `MOCK_*` dataset names absent from the four rewired surface files | `scr-desk-rewiring.test.ts` — deletion guard describe |
| Register reconciliation | 13 screen-register entries MOCK→IMPLEMENTED; summary 51/6/1/1/1 verified against `computeScreenRegisterCounts` | `tests/unit/todo-remediation.test.ts` — GVR-02 count test green |

## Item → code + test traceability

| Register item | Implementation | Test evidence |
|---|---|---|
| SEC-01 MFA step-up | `src/core/auth/totp.ts` (RFC 6238 + anti-replay), router `POST /auth/mfa`, `POST /auth/mfa/enroll` | `tests/unit/todo-remediation.test.ts` — SEC-01 describe |
| SEC-02 invitations | `src/core/auth/invitations.ts` (5-step chain, single-use), router accept + issuance routes | SEC-02 describe |
| SEC-03 session registry | `src/core/auth/sessions.ts` + `verifySessionToken` consults revoked ids; revoke endpoints revoke real tokens | SEC-03 describe |
| SEC-04 recovery dispatch | `src/core/auth/mfa.ts` + router POST `/auth/recovery` (NotificationService, anti-enumeration) | covered by mfa unit + router path |
| SEC-05 notification prefs | `saveNotificationPreferences` + `deliverInAppNotification` suppression | SEC-05 describe |
| SEC-07 client portal isolation | `getClientOrgRelationship` — fallback leak removed; cross-org 403 | `tests/unit/client-portal-and-operations.test.ts` — cross-org regression |
| SCR-01/02 CMS domain | `src/core/content/index.ts` + `/api/v1/workspace/content*` lifecycle routes | content describes + publish/422 regression tests |
| SCR-04 destinations | `src/core/federation/destinations.ts` + routes | destinations describe |
| SCR-05 routing config | routing rules + `/api/v1/enquiries/routing-config` | routing describe |
| SCR-06 approvals | `src/core/approvals/index.ts` + real decide endpoint + queue renderer w/ demo seed labels | approvals describes + decide regression |
| SCR-07/16 records console | `src/web/workspace/governance-registers.ts` + `/workspace/governance/records` | renderer exercised via route; projections unit-pure |
| SCR-08 cases | `src/core/cases/index.ts` + routes + `/workspace/cases/{privacy,security}` | cases describes |
| SCR-09/11 search & My Work | `authorisedSearch`/`aggregateMyWork` + pages + APIs | work describes |
| SCR-10 notifications inbox | in-app records + `/workspace/notifications` | suppression test |
| BCST-01 provenance | `renderMockDataBanner` on all 33 screens — **verified 2026-10-11 by TSK-25: 33/33 served screens carry the banner, all four state variants included**; `getScreenData` provenance service — **at that measurement it had 0 production call sites, so 0/33 screens served an engine-sourced KPI strip** (`tests/unit/broadcast-provenance-coverage.test.ts`). **Re-measured 2026-10-11 after TSK-11: 33/33 serve the strip, 1/33 emits a live `SOURCE:` badge, 0/33 fully engine-sourced** | screen-data describe; broadcast-screens tests still green |
| BCST-02 EPG honesty gate | `src/modules/broadcast/export/epg.ts` + `/broadcast/export/epg/xmltv` + push route | EPG describes |
| BCST-04/05 versions & RFA | `src/modules/broadcast/versions/index.ts` + routes | versions describes |
| FIN-01 recognition | delivery-gated, contract-capped `recognizeRevenue` + `recalculateRecognizedRevenue` | FIN-01 describes; legacy `finance.test.ts` unchanged & green |
| FIN-02 payout approve/NIP | guarded routes `POST /api/v1/finance/payouts/:id/approve` + `/nip-csv` | `route-authorization.test.ts` guards + engine tests |
| FIN-05 MT940 ingest | `POST /api/v1/finance/mt940/ingest` (parse → recon) | `reconciliation-mt940.test.ts` + guards |
| FIN-06 escrow behind flag | `/api/v1/vtm/contracts/:id/milestones/:m/release-escrow` gated `FF_FINANCE_PAYMENT_RELEASE` | flag guard (`sendFeatureDisabled`) |
| GVR-02/03 register | `docs/decisions/screen-register.json` + loader `src/core/config/screen-register.ts` | register describes (counts recomputed & verified) |
| PRC-01 readiness matrix | `docs/audit/journey-readiness-matrix.md` | — (documentation evidence) |
| PRC-04 budgets | `docs/audit/performance-budgets.md` (DEBT-008 → TARGET) | — (documentation evidence) |

## Deliberate test-contract updates (recorded under rule §0 of the retired `todo.md` register — `VMNL-AZP-VMN-TODO-001`, decision record `docs/decisions/DEC-REGISTER-SURVIVOR-001.md`)

1. `client-portal-and-operations.test.ts` decide POST now authenticates as SuperAdmin with a reason — required because the four-eyes domain (SCR-06) rechecks authority server-side; MCRSupervisor is not authorised for RATE_CARD_OVERRIDE and an added negative test asserts exactly that.
2. Client-portal GETs now send a session (`x-test-role`), because SEC-07 requires a relationship check; a cross-org 403 regression was added.
3. Content publish POST now authenticates; the seeded demo item (`CNT-LAGOS-201`) is APPROVED with author ≠ publisher so the real domain publishes it; a second publish asserts the honest 422.

## Remaining open (not silently deferred) — as of Round 6C (2026-10-01)

All engineering-closable register items are closed (the per-item tables above are the closure notes; the retired `todo.md` register itself is recoverable with `git show 85aad76:todo.md`, the last commit whose tree carries it — the TSK-09 series commits the deletion, so `HEAD` no longer does): **66 of 71 register items closed**. Five remain open, each requiring a human decision or human-run process:

- **GVR-04** — rights override interpretation ruling (board/legal).
- **GVR-05** — finance treatment of cash-basis recognition (Finance authority).
- **BCST-07** — StarTimes carriage machine interface (requires executed carriage contract data; BG6 stays NOT_TESTED).
- **PRC-05 / PRC-06** — real-user usability + manual WCAG 2.2 AA process coverage (human-run sessions/audits).
