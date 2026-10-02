# Remediation Evidence Register — todo.md execution (2026-09-30)

**Document:** `VMNL-AZP-VMN-REM-EVID-001 — R1.0`
**Authority:** TODO-PRC-09 (traceability), TODO-DOC-05/06 (evidence pinning and register updates).
**Verification run (this tree):** `npx tsc --noEmit` clean · `npx vitest run --reporter=basic` → **480 passed / 45 files** (incl. 21 desk-rewiring tests from Round 6B and 48 final-remediation tests + 13 journey drills from Round 6C) · `eslint` 0 errors (warnings remain pre-existing unused-param style).

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
| BCST-03 schedule lifecycle | `versions/index.ts`: upsert→submit→approve→lockout(T-30m)→amend (LOCKED immutable) | `todo-final-remediation.test.ts` — BCST-03 describe; drill: amendment-after-lock |
| BCST-06 cache contract | `AutonomousCacheContract` + `evaluateAutonomousCacheContract`/`simulateDrill20CacheOutage` (`playout/index.ts`); hardware stays human/supplier | `todo-final-remediation.test.ts` — BCST-06 describe; drill: cache-outage contract |
| BCST-08/09 presentation | `src/web/public/schedule-presentation.ts` (approved-schedules-only now/next, viewer TZ + `GOVERNING_TIMEZONE` label, honest unavailable state); widget on `/channels/nxtr|orisun|isimbido` | `todo-final-remediation.test.ts` — BCST-08/09 describe |
| BCST-10 offline gate scans | `FusionEventsEngine.signOfflineScanToken/verifyOfflineScanToken/recordOfflineScan/syncOfflineScans` (single-use + fraud invariants preserved through sync) | `todo-final-remediation.test.ts` — BCST-10 describe; drill: offline expiry |
| BCST-12 sponsor bindings | `SponsorBinding` + `createBinding/listBindings/recordBindingFulfillment/getFulfillmentReport` (`sponsorship/index.ts`) | `todo-final-remediation.test.ts` — BCST-12 describe |
| FIN-03 ledger posting | `LedgerPostingService` (`src/modules/finance/ledger/posting.ts`) — balanced journals, kobo-exact, idempotent deltas | `todo-final-remediation.test.ts` — FIN-03 reconciliation describe |
| FIN-04 WHT remittance | `buildWhtRemittanceSchedule`/`renderWhtAdviceSlip` (`payouts/index.ts`); FIRS-format confirmation left to Finance | `todo-final-remediation.test.ts` + drills — WHT describes |
| FIN-07 billing←as-run | billing built only from matched as-run logs + make-good credit notes (`billing/index.ts`) | `todo-final-remediation.test.ts` — FIN-07 describe |
| FIN-08 royalty CSV | `TendDistributionEngine.parseRoyaltyStatementCsv` (per-row validation, commission + licence withholding) | `todo-final-remediation.test.ts` — FIN-08 describe; drill: bad-row recovery |
| PRC-02 gate closure records | `docs/audit/design-gate-closure-records.md` (CLOSED + OPEN-with-owner recorded honestly) | — (documentation evidence) |
| PRC-03 journey drills | `tests/integration/journey-failure-drills.test.ts` (13 drills) | green in full run |
| PRC-07 rollback TARGET | `docs/runbooks/rollback-runbook.md` STATUS block with preconditions | — (documentation evidence) |
| PRC-08 backup automation | `docker/backups/backup.sh` + compose `postgres-backup` service + `docs/audit/backup-restore-drill.md` — **DRILL-01 executed 2026-10-01: restore 0.132 s, 26/26 table parity, app 200 from restored copy; WAL/PITR RPO target still open** | — (job + executed-drill evidence) |
| PRC-09 AC-ID index | `docs/audit/ac-traceability-index.md` | — (documentation evidence) |
| DOC-01…07 | taskss.md phantom withdrawn; design-task.md de-cited (`docs/decisions/design-task-de-citation.md`); DR runbook DB name fixed; ADR-013 corrected; evidence re-pinned 480/45 @ `ca303f0`+tree; claims downgraded | grep-verifiable in-repo |
| SCR-03 media picker + editor integration | `registerMediaAsset`/`listApprovedMediaAssets` (`src/core/storage/index.ts`) + `src/web/workspace/media-picker.ts` + `src/web/workspace/content-editor.ts`; `GET /workspace/content/media-picker`, `POST/GET /api/v1/cms/media-assets`, `GET /workspace/content/editor[/:id]`, guarded `POST /api/v1/workspace/content-editor[/update]`; `[CMS-11]` registry validation wired via `wireMediaAssetLookup` | `todo-final-remediation.test.ts` — SCR-03 describes (provenance/access-state contract, tenant scoping, 401/route authority, `[CMS-11]` rejections, CSRF-flow create→edit→persisted-picker-selection E2E) |

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
| BCST-01 provenance | `renderMockDataBanner` on all 33 screens; `getScreenData` provenance service | screen-data describe; broadcast-screens tests still green |
| BCST-02 EPG honesty gate | `src/modules/broadcast/export/epg.ts` + `/broadcast/export/epg/xmltv` + push route | EPG describes |
| BCST-04/05 versions & RFA | `src/modules/broadcast/versions/index.ts` + routes | versions describes |
| FIN-01 recognition | delivery-gated, contract-capped `recognizeRevenue` + `recalculateRecognizedRevenue` | FIN-01 describes; legacy `finance.test.ts` unchanged & green |
| FIN-02 payout approve/NIP | guarded routes `POST /api/v1/finance/payouts/:id/approve` + `/nip-csv` | `route-authorization.test.ts` guards + engine tests |
| FIN-05 MT940 ingest | `POST /api/v1/finance/mt940/ingest` (parse → recon) | `reconciliation-mt940.test.ts` + guards |
| FIN-06 escrow behind flag | `/api/v1/vtm/contracts/:id/milestones/:m/release-escrow` gated `FF_FINANCE_PAYMENT_RELEASE` | flag guard (`sendFeatureDisabled`) |
| GVR-02/03 register | `docs/decisions/screen-register.json` + loader `src/core/config/screen-register.ts` | register describes (counts recomputed & verified) |
| PRC-01 readiness matrix | `docs/audit/journey-readiness-matrix.md` | — (documentation evidence) |
| PRC-04 budgets | `docs/audit/performance-budgets.md` (DEBT-008 → TARGET) | — (documentation evidence) |

## Deliberate test-contract updates (recorded per §0 of todo.md)

1. `client-portal-and-operations.test.ts` decide POST now authenticates as SuperAdmin with a reason — required because the four-eyes domain (SCR-06) rechecks authority server-side; MCRSupervisor is not authorised for RATE_CARD_OVERRIDE and an added negative test asserts exactly that.
2. Client-portal GETs now send a session (`x-test-role`), because SEC-07 requires a relationship check; a cross-org 403 regression was added.
3. Content publish POST now authenticates; the seeded demo item (`CNT-LAGOS-201`) is APPROVED with author ≠ publisher so the real domain publishes it; a second publish asserts the honest 422.

## Remaining open (not silently deferred) — as of Round 6C (2026-10-01)

All engineering-closable register items are closed (see todo.md closure notes): **66 of 71 register items closed**. Five remain open, each requiring a human decision or human-run process:

- **GVR-04** — rights override interpretation ruling (board/legal).
- **GVR-05** — finance treatment of cash-basis recognition (Finance authority).
- **BCST-07** — StarTimes carriage machine interface (requires executed carriage contract data; BG6 stays NOT_TESTED).
- **PRC-05 / PRC-06** — real-user usability + manual WCAG 2.2 AA process coverage (human-run sessions/audits).
