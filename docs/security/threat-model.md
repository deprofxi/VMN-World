# VMN Threat Model

**Authority:** `docs/authorities/VMNL-AZP-VMN-CCPP-001-R1.1.md` §16 "THREAT MODEL PROMPT" (lines 1439–1522), which prescribes the scope areas, the STRIDE-or-equivalent method, the ten fields identified for every threat, the twenty-one explicit test vectors, and this output path.
**Method:** STRIDE categories over the implemented system, one register per §16 scope area.
**Basis:** every *current control* below is a `file:line` that was opened on 2026-10-15 and re-read; every *control gap* is either a measurement or an open item in `tasks.md`, named by its `TSK-nn`. Nothing here is inherited from a prior audit's prose.
**Verification:** `tests/unit/threat-model.test.ts` fails if a cited line stops resolving, if a §16 scope area disappears, if a threat loses any of the ten fields, or if an explicit test vector loses its status row. Re-run: `CI=1 NODE_ENV=test pnpm vitest run tests/unit/threat-model.test.ts`.

Two conventions that keep this document honest:

- A gap is written as a gap. §16 forbids fixing severe findings by hiding functionality in the UI, and `tasks.md` rule 0.4a forbids presenting sandbox state as persistence; both apply to claims about security posture.
- "Tested" means a test in this repository drives the control through the mechanism an attacker would use. `tests/security/route-authorization.test.ts` and `tests/security/route-guard-parity.test.ts` are the route-level instruments; unit tests that call a predicate directly are labelled as such, because a predicate that no route reaches is not a control (that is `TSK-58`).

---

## 1. Control inventory

| # | Control | Implementation | Enforcement point | Instrument |
|:--|:---|:---|:---|:---|
| C1 | Default-deny route guards | `src/api/router.ts:789` (`ROUTE_GUARDS`), `src/api/router.ts:753` (`assertRoutePermission`) | central dispatch before handler body | `tests/security/route-authorization.test.ts`, `tests/security/route-guard-parity.test.ts` |
| C2 | Role/permission matrix | `src/core/rbac/index.ts:80` (`ROLE_PERMISSIONS`), `:521` (`canPerform`), `:565` (`assertPermission`) | handler-scoped calls | `tests/unit/identity-and-rbac.test.ts`, `tests/unit/security-auth-rbac.test.ts` |
| C3 | CSRF: double-submit token + Origin allow-list | `src/core/websecurity/index.ts:73` (`verifyFormCsrf`), `:46` (`issueCsrfToken`), `:53` (`verifyCsrfToken`), `:101` (`extractCsrfFromForm`) | `src/api/router.ts:1173-1196` (`requiresCsrf`) — required for unsafe methods carrying a session or MFA-challenge cookie | `tests/security/route-authorization.test.ts` |
| C4 | Session tokens, revocation, adapter-first reads | `src/core/auth/index.ts:148` (`signSessionToken`), `:390` (`verifySessionToken`), `:179` (`InMemoryRevocationStore`), `:191` (`setTokenRevocationStore`), `:200` (`revokeToken`), `:205` (`isTokenRevoked`), `:227` (`useKeyValueAdapterForAuthStores`), `:434` (`primeSessionRevocation`) | every authenticated route via cookie parse | `tests/unit/auth-shared-across-instances.test.ts` |
| C5 | MFA one-time challenge, sealed seed | `src/core/auth/index.ts:34` (`signMfaLoginChallenge`), `:67` (`verifyMfaLoginChallenge`), `:79` (`consumeMfaLoginChallenge`), `:261` (`sealSensitiveField`), `:300` (`openSealedField`), `:268` (`assertSealedForStorage`) | `src/api/router.ts:1601` (`checkSharedRateLimit`), login completion path | `tests/unit/security-auth-rbac.test.ts` |
| C6 | Password hashing (bcrypt) | `src/core/auth/index.ts:131` (`hashPassword`), `:141` (`verifyPassword`), `:458` (`isBcryptPasswordHash`) | credential write/read | `tests/unit/auth.test.ts` |
| C7 | Rate limiting | `src/core/auth/index.ts:308` (`checkRateLimit`), `:350` (`checkSharedRateLimit`) | five endpoints: `src/api/router.ts:3685` (`checkSharedRateLimit`) login, `:1601` mfa, `:1690` recovery, `:1791` access request, `:1854` invitation | `tests/unit/security-auth-rbac.test.ts` |
| C8 | Inbound payment-webhook signature + durable replay claim | `src/api/router.ts:7834` (`verifyPaystackSignature`), `:7933` (`verifyFlutterwaveSignature`); `src/core/websecurity/index.ts:157` (`claimProviderEventOnce`), `:201` (`confirmProviderEventIngested`), `:226` (`releaseProviderEventClaim`) | webhook routes only | `tests/unit/durability-release-critical.test.ts`, `tests/unit/audit-remediation-regressions.test.ts` |
| C9 | Idempotency keys | `src/core/websecurity/index.ts:289` (`recordIdempotentOutcome`), `:303` (`checkIdempotency`) | `src/api/router.ts:4194`/`:4210` (enquiry), `:4293`/`:4334` (rights request) | `tests/unit/production-core-and-infrastructure.test.ts` |
| C10 | PII sealing at the write boundary | `src/core/websecurity/index.ts:383` (`SEALED_FIELD_ENVELOPE`), `:396` (`sealSensitiveField`), `:413` (`assertSealedForStorage`), `:432` (`openSealedField`) | `src/core/auth/index.ts:268` (`assertSealedForStorage`); DB-side `Person_nationalId_sealed_envelope` / `User_mfaSecret_sealed_envelope` (`prisma/schema.prisma:95`, `:119`) | `tests/unit/todo-final-remediation.test.ts`, `tests/unit/todo-remediation.test.ts` |
| C11 | Tamper-evident audit chain | `src/core/audit/index.ts:139` (`computeAuditEntryHash`), `:154` (`buildAuditHashPayload`), `:185` (`recordAuditLog`), `:275` (`verifyAuditLogChainIntegrity`), `:75` (`restoreAuditChainFromKv`), `:97` (`getAuditHealth`) | every consequential write; durable row in `AuditLog` | `tests/unit/audit.test.ts:254-257`, `tests/helpers/durable-restart-reader.mjs` |
| C12 | Bounded bodies + field narrowing | `src/api/router.ts:439` (`DEFAULT_MAX_BODY_BYTES`), `:497` (`parseJsonBody`), `:517` (`jsonTextField`), `:529` (`jsonObjectField`) | every JSON/FORM route | `tests/unit/production-core-and-infrastructure.test.ts` |
| C13 | Upload validation + threat scan | `src/core/storage/index.ts:206` (`validateMediaBuffer`), scans at `:227` → `:84` (`scanBufferForThreats`), `:126` (`generatePresignedUploadUrl`) with a MIME allow-list, `:65` (`MAX_SCAN_BUFFER_BYTES`), `:73` (`computeSha256`) | `src/api/router.ts:8082` (`validateMediaBuffer`) | `tests/unit/production-core-and-infrastructure.test.ts`, `tests/unit/public-provenance.test.ts` |
| C14 | Server-side rights gate for carriage/export | `src/modules/broadcast/rights/clearance.ts:53` (`validateScheduleRights`), `:169` (`checkRightsReadiness` on `BroadcastRightsGate`) | schedule/EGP export and clearance paths | `tests/unit/broadcast-rights-gate.test.ts`, `tests/integration/rights-clearance-e2e.test.ts` |
| C15 | Federation fails closed on unconfigured endpoints | `src/core/federation/destinations.ts:159` (`resolveNavigationUrl`), `:178` (`getConfiguredFederationOrigin`), `:183` (`approvedFallback`), `:186` — the `[DEST-07]` throw; `src/modules/federation/azeebo/links.ts:68` (`isConfigured`), `:75` — the `[LINK-01]` throw | navigation/link resolution | `tests/unit/federation-destination-registry.test.ts`, `tests/unit/public-provenance.test.ts` |
| C16 | Outbound webhook HMAC-SHA256 signing, circuit breaker, DLQ | `src/modules/federation/azeebo/bridge.ts:100` (`dispatchWebhook`) | federation dispatch only | `tests/unit/federation.test.ts:181-206` |
| C17 | Output escaping | `escapeHtml` (400 call sites across `src/web/`, re-measured 2026-10-15) | render functions | `tests/unit/html-escape-census.test.ts` (ceiling 299 unescaped interpolations), `tests/unit/rendered-html-invariants.test.ts` |
| C18 | Test-only identity harness gated by env | `src/api/router.ts:730` (`NODE_ENV === "test"` before `x-test-role` is read) | request-context resolution | `tests/security/route-guard-parity.test.ts` |
| C19 | Production/staging refusal of the auth bypass | `src/api/server.ts:73-79` (`createApiServer`) | boot | `tests/unit/config.test.ts` |

---

## 2. Threat register

Severity is the exposure **after** the current control, not before it. `Owner` uses the roles this repository already names (`tasks.md` §5, `docs/design-debt-register.md`).

### 2.1 Identity

#### TM-IDN-01 · Spoofing · one human minted as several canonical persons
- **Asset:** `Person` and `User` records; every downstream grant keyed to `personId`.
- **Attacker:** authenticated operator with person-directory access; external applicant re-registering.
- **Attack path:** create or merge a second person for an existing human; each copy carries its own roles.
- **Impact:** canonical-law-1 breach (one person → one identity); duplicated consent, duplicated payout, split audit trail.
- **Current control:** `src/api/auth`-side normalisation is not the control; the control is the single-email lookup `src/core/auth/index.ts:578` (`findUserByEmail`, adapter-first) plus `assertRoutePermission` (`src/api/router.ts:753`) on the directory desk.
- **Control gap:** no measured uniqueness invariant at the write boundary for `Person` beyond the email index; merging is not exercised through a route.
- **Severity:** Medium.
- **Mitigation:** add a route-level duplicate/merge refusal test before any merge desk is wired; keep the guard in C1 rather than hiding the desk.
- **Test:** `tests/unit/identity-and-rbac.test.ts`; the merge-refusal case does not exist yet and is not claimed.
- **Owner:** Engineering Lead.

#### TM-IDN-02 · Tampering · audit trail reattributed to a different actor
- **Asset:** audit chain (C11) — the evidence graph of canonical law 6.
- **Attacker:** operator with database write access, or a compromised service account.
- **Attack path:** rewrite an `AuditLog` row's actor or change set after the fact.
- **Impact:** every downstream conformance claim becomes unverifiable.
- **Current control:** entry hash over the joined payload (`src/core/audit/index.ts:154`, `:139`), chain verification (`:275`), boot restore of the tail (`:75`); `tenantId` is the seventh hashed component (`tasks.md` TSK-58 box 4 closure).
- **Control gap:** the chain is recomputable only because the hashed payload travels with the row; a writer that bypasses `recordAuditLog` can append an unchained row (relaxation recorded in `prisma/migrations/20261012120000_relax_audit_ledger_actor_identity/`).
- **Severity:** High.
- **Mitigation:** keep every consequential write inside the business transaction (TSK-18) and treat any new writer as a defect until it is covered by the restart reader.
- **Test:** `tests/unit/audit.test.ts:254-257`; `tests/unit/durability-release-critical.test.ts` (second OS process).
- **Owner:** Engineering Lead.

### 2.2 Authentication

#### TM-ATH-01 · Spoofing · credential stuffing against login
- **Asset:** session issuance (`src/core/auth/index.ts:148`).
- **Attacker:** anonymous internet client.
- **Attack path:** replay leaked password lists.
- **Impact:** full account takeover for any role, including SuperAdmin.
- **Current control:** bcrypt verification (`:131`/`:141`), lockout counter (`:308`, shared variant `:350`), `checkSharedRateLimit` at `src/api/router.ts:3685`, MFA challenge (`:34`/`:67`/`:79`).
- **Control gap:** rate/lockout state is shared only through the KV adapter; a deployment without Redis falls back to the in-process map, so limits are per-instance (recorded honestly under TSK-27 / TSK-20 sandbox-state labelling).
- **Severity:** Medium.
- **Mitigation:** require the KV adapter for production deploys rather than degrading silently; label the degraded mode in `/readyz`.
- **Test:** `tests/unit/auth-shared-across-instances.test.ts`, `tests/unit/security-auth-rbac.test.ts`.
- **Owner:** Engineering Lead.

#### TM-ATH-02 · Information disclosure · session cookie over plaintext HTTP
- **Asset:** `vmnl_session` cookie.
- **Attacker:** network-position adversary on the operator's path.
- **Attack path:** strip TLS; read the cookie.
- **Impact:** session theft.
- **Current control:** `HttpOnly; SameSite=Lax` and `Secure` (`src/core/auth/index.ts:382-385`).
- **Control gap:** the `Secure` flag is emitted only when `NODE_ENV` is exactly `production`; a misspelled or unset value ships a session cookie without `Secure`. The same exact-string dependency governs the test-role harness at `src/api/router.ts:730` and the dev fallback secrets (`audit.md` AUD-11, `src/api/server.ts:73-79`).
- **Severity:** High.
- **Mitigation:** treat any `NODE_ENV` other than `development`/`test` as production for cookie flags, secret fallback and the `x-test-role` read; fail boot on a default secret outside an explicit opt-in.
- **Test:** not asserted today; `tests/unit/config.test.ts` covers boot validation only.
- **Owner:** Engineering Lead.

### 2.3 Authorization

#### TM-AUT-01 · Elevation of privilege · route added without a guard
- **Asset:** every operational desk.
- **Attacker:** authenticated low-privilege user.
- **Attack path:** call a newly added mutating endpoint that no guard row covers.
- **Impact:** write access outside the role matrix.
- **Current control:** default-deny table (`src/api/router.ts:789`) with central `assertRoutePermission` (`:753`) and `assertPermission` (`src/core/rbac/index.ts:565`).
- **Control gap:** 55 routes are handler-scoped and self-declared; parity is enforced by `tests/security/route-guard-parity.test.ts`, which fails when a handler stops calling `assertRoutePermission` — the residual risk is a route that no test enumerates, not a silent guard removal.
- **Severity:** Medium.
- **Mitigation:** keep the parity suite a gate (TSK-29 / TSK-44) and never relax an exemption row to make it pass.
- **Test:** `tests/security/route-authorization.test.ts`, `tests/security/route-guard-parity.test.ts`.
- **Owner:** Engineering Lead.

#### TM-AUT-02 · Repudiation / broken object authorization · cross-tenant read of another organisation's rows
- **Asset:** all tenant-owned operational data.
- **Attacker:** authenticated user of a different tenant.
- **Attack path:** enumerate identifiers on a reading or mutating route.
- **Impact:** multi-tenant isolation claim (`docs/domain/master-data-model.md` §1) is false in practice.
- **Current control:** the only central tenant predicate is `src/core/rbac/index.ts:531-535`; the storage read path fails closed on unowned assets (`src/core/storage/index.ts:438-442`, closed by TSK-58 box 2).
- **Control gap:** `tenantId` exists on **3 of 43** Prisma models, and every external `canPerform` call omits the fourth `context` argument that carries it (`src/api/router.ts:769`, `src/api/routes/enquiry.routes.ts:25`), so the central predicate is unreachable from HTTP — **TSK-58 box 1 open**: no mutating-route cross-tenant refusal test exists.
- **Severity:** High.
- **Mitigation:** either give the guard table an expressible tenant dimension or reconcile the documents that claim the scope (TSK-58 box 3, owner decision).
- **Test:** `tests/unit/todo-final-remediation.test.ts:1327`-`:1407` cover read routes only (a filtered 200 is refusal by omission); the predicate-level cases at `tests/unit/rbac.test.ts:61-70` never traverse a route.
- **Owner:** Engineering Lead (schema) / EAB (scope decision).

### 2.4 Client portal

#### TM-CP-01 · Information disclosure · one counterparty sees another's deal terms
- **Asset:** client deal, delivery and money views.
- **Attacker:** authenticated counterparty user.
- **Attack path:** substitute a deal identifier in the portal request.
- **Impact:** commercial confidentiality breach; false delivery claims across counterparties.
- **Current control:** the portal reads canonical deals (TSK-13) through `src/web/portal/client-portal.ts` with `escapeHtml` on rendered fields (C17), and payment visibility is separated in `src/web/portal/vtm-payment-visibility.ts`.
- **Control gap:** portal authorisation inherits TM-AUT-02 — there is no tenant-scoped predicate reachable from HTTP; the delivery half's canonical join is TSK-60 boxes 1–2.
- **Severity:** High.
- **Mitigation:** wire the delivery join and add the route-level cross-tenant refusal before the portal is exposed beyond sandbox.
- **Test:** `tests/unit/client-portal-and-operations.test.ts`.
- **Owner:** Engineering Lead.

### 2.5 Learner data

#### TM-LRN-01 · Information disclosure · learner records exposed to non-AFCA roles
- **Asset:** admissions and LMS records (canonical law 11: students are learners first).
- **Attacker:** any authenticated enterprise role.
- **Attack path:** traverse the LMS desks or an API surface by identifier.
- **Impact:** exposure of education records; privacy-review obligation (law 12) unmet.
- **Current control:** dedicated guard rows for the AFCA desks in `src/api/router.ts:789`; LMS surfaces are permission-checked in `src/web/workspace/afca-lms.ts`.
- **Control gap:** data-subject-request fulfilment is TSK-31 (`BLOCKED_HUMAN`, HD-06); export exists as a route, not as a verified delivery path, so a DSRefusal cannot be proven either way.
- **Severity:** Medium.
- **Mitigation:** keep the DSR item open with its human owner rather than marking export "delivered".
- **Test:** `tests/unit/admissions.test.ts`, `tests/security/route-authorization.test.ts`.
- **Owner:** DPO (HD-06) / Engineering Lead.

### 2.6 Talent profiles

#### TM-TAL-01 · Spoofing · engagement recorded without a commercial mandate
- **Asset:** talent profiles and deployment records (canonical law 10).
- **Attacker:** internal user with talent-desk access.
- **Attack path:** create an engagement row without the gating commercial record.
- **Impact:** unauthorised deployment; downstream payment obligations with no mandate.
- **Current control:** talent repository `src/core/database/repositories/talent.repository.ts`, role-checked through C1/C2.
- **Control gap:** law 10's precondition is enforced per-desk, not as a single server-side invariant; there is no measured cross-check that an engagement cannot exist without a mandate.
- **Severity:** Medium.
- **Mitigation:** express the precondition in the domain write path and assert the refusal in a test.
- **Test:** `tests/unit/hub-talent.test.ts` (positive cases only today).
- **Owner:** Engineering Lead.

### 2.7 Talent bank details

#### TM-BNK-01 · Information disclosure · payout identifiers stored in the clear
- **Asset:** bank/nuban identifiers for talent payout (canonical law 12).
- **Attacker:** anyone with read access to the datastore or a dump.
- **Attack path:** store or read a payout identifier through any unsealed column.
- **Impact:** direct financial fraud against individuals; privacy breach.
- **Current control:** **the field does not exist.** `prisma/schema.prisma` has no `bankAccount`/`nuban`/`payee` column (measured 2026-10-15: grep returns nothing), so nothing is stored, and the sealing machinery that would protect it is real (`src/core/websecurity/index.ts:383`/`:396`/`:413`).
- **Control gap:** the absence is not a control. When payout details are introduced they must arrive with the sealed-envelope migration and a write-boundary assertion, the way `Person.nationalId` and `User.mfaSecret` did (`prisma/schema.prisma:95`, `:119`).
- **Severity:** Low today, High on introduction.
- **Mitigation:** make the introduction conditional on TSK-30's write-boundary pattern; record it as a dependency rather than discovering it later.
- **Test:** none possible against a non-existent field; `tests/unit/todo-final-remediation.test.ts` covers the sealing rule for existing fields.
- **Owner:** DPO / Engineering Lead.

### 2.8 Payments

#### TM-PAY-01 · Tampering / repudiation · forged payment webhook credited to a deal
- **Asset:** ledger postings and deal state.
- **Attacker:** external party able to POST to the webhook route.
- **Attack path:** craft a body with a valid-looking reference and no signature.
- **Impact:** false settlement, revenue misstatement (canonical law 5).
- **Current control:** signature verification at `src/api/router.ts:7834` (Paystack) and `:7933` (Flutterwave), durable single-claim at `src/core/websecurity/index.ts:157` with confirm/release (`:201`, `:226`), kobo-exact arithmetic (`src/core/domain/types.ts`, asserted by `tests/unit/finance-minor-units.test.ts`).- **Control gap:** if the durable claim store is unreachable the handler records `webhook_durable_claim_degraded_total` and proceeds on the KV mirror (TSK-19), so a Redis loss plus restart converts a re-delivery into a first sighting; the metric is the notice, not the fix.
- **Severity:** High.
- **Mitigation:** keep the degradation metric scrapeable and treat a sustained degraded period as an incident, not a fallback mode.
- **Test:** `tests/unit/durability-release-critical.test.ts` (real HTTP + second process), `tests/unit/audit-remediation-regressions.test.ts` (crash between phases).
- **Owner:** Engineering Lead.

#### TM-PAY-02 · Repudiation · settlement that violates the separation invariants
- **Asset:** consolidated financial truth (law 5, law 7).
- **Attacker:** internal writer.
- **Attack path:** write a settlement that inflates external revenue with internal allocations.
- **Impact:** misstated consolidated revenue.
- **Current control:** `validateSettlementInvariants` (`src/core/domain/types.ts:218`) is called on the only writer of the canonical `Settlement` columns — `assertSettlementInvariants` (`src/core/database/repositories/invoice.repository.ts:65`) refuses before anything reaches Postgres, and `createSettlement` is at `:238` (TSK-59).
- **Control gap:** the validator's coverage is the write paths enumerated by TSK-59; a new writer bypasses it silently, and `InvoiceRepository` wiring is still TSK-59's open box.
- **Severity:** Medium.
- **Mitigation:** finish the repository wiring or delete the dead path; assert law 7's consolidation at the ledger level as TSK-32 does.
- **Test:** `tests/unit/finance-minor-units.test.ts`, `tests/unit/reconciliation-mt940.test.ts`.
- **Owner:** Engineering Lead.

### 2.9 Rights records

#### TM-RGT-01 · Tampering · clearance status bypassed to exploit unlicensed content
- **Asset:** rights records and exploitation schedules (canonical law 8).
- **Attacker:** scheduling user under commercial pressure.
- **Attack path:** place an item in a schedule or EPG export whose rights are not cleared.
- **Impact:** contractual and regulatory exposure; the exact §16 vector "rights-status bypass".
- **Current control:** `validateScheduleRights` (`src/modules/broadcast/rights/clearance.ts:53`) and `BroadcastRightsGate.checkRightsReadiness` (`:169`) enforced server-side (TSK-10); approved-export path in `src/modules/broadcast/export/approved-schedules.ts`.
- **Control gap:** carriage/compliance entities that the gate must consult are still TSK-15 (`BLOCKED_HUMAN`); the gate can only enforce what the schema can carry.
- **Severity:** High.
- **Mitigation:** keep the gate on the authoritative path and do not soften its refusal into a UI warning.
- **Test:** `tests/unit/broadcast-rights-gate.test.ts`, `tests/integration/rights-clearance-e2e.test.ts`.
- **Owner:** Engineering Lead / Brand Owner (HD for carriage data).

### 2.10 Unreleased content

#### TM-UNC-01 · Information disclosure · unpublished asset reachable through an unscoped link
- **Asset:** unreleased masters, stills and episode versions.
- **Attacker:** unauthenticated party with a guessed asset identifier.
- **Attack path:** request a presigned URL or media asset without a tenant scope.
- **Impact:** leak of unreleased programming.
- **Current control:** asset listing fails closed on unowned rows (`src/core/storage/index.ts:438-442`); presigned issuance allow-lists MIME and bounds size (`:126`); provenance banners badge engine vs. demo data (`tests/unit/broadcast-provenance-coverage.test.ts`).
- **Control gap:** `generatePresignedUploadUrl` binds a key, not a viewer; object-level read authorisation is delegated to the storage driver, and the driver's ACL is not asserted by any test in this repository. Also: the golden backfill leaves 1427 of 1585 `MediaAssetRecord` rows unowned (TSK-58 box 2 consequence), so they are invisible to every tenant session — a fail-closed outcome that is correct but unreviewed by the owner.
- **Severity:** High.
- **Mitigation:** assert the driver ACL in an integration test once credentials exist; get the owner's ruling on re-homing the seeded library.
- **Test:** `tests/unit/production-core-and-infrastructure.test.ts` (validation), no ACL test exists.
- **Owner:** Engineering Lead / EAB (library scope).

### 2.11 Broadcast infrastructure

#### TM-BCS-01 · Denial of service · schedule or EPG generation starved by a large payload
- **Asset:** playout schedule, EPG generation, transmission handoff.
- **Attacker:** authenticated operations user.
- **Attack path:** submit oversized or repeated generation requests.
- **Impact:** schedule outage; the 48-hour cache contract is the only buffer.
- **Current control:** bounded request bodies (`src/api/router.ts:439`, `:497`), queue-based EPG generation (`src/core/queue/index.ts`), MCR filler budget measured in `tests/unit/performance-budget-measurement.test.ts`.
- **Control gap:** the queue is an in-process `Map` with a 1 h terminal TTL (`docs/events/catalogue.md` §1) — a restart loses pending work, and ADR-006's durable substrate is unimplemented (TSK-17 remainder / TSK-21's recorded decision). Rate limiting is not applied to generation routes.
- **Severity:** Medium (sandbox), High (production).
- **Mitigation:** implement or formally supersede ADR-006; that decision carries an `Approver: EAB` line and is not the engineer's to take.
- **Test:** `tests/unit/broadcast-advances.test.ts`, `docs/events/catalogue.md` guards the substrate description.
- **Owner:** EAB (ADR-006) / Engineering Lead.

### 2.12 Azeebo+ federation

#### TM-FED-01 · Tampering · an invented production endpoint shipped in code
- **Asset:** partner trust and the outbound link/navigation surface.
- **Attacker:** contributor, or a misconfigured deployment.
- **Attack path:** a default origin silently pointing at a guessed domain.
- **Impact:** user traffic and metadata sent to an unrelated host; prohibited by `CLAUDE.md`'s `<azeebo>` block and PRD §41.
- **Current control:** resolution throws `[DEST-07]` when no origin is configured (`src/core/federation/destinations.ts:178`, `:183`, `:186`), links throw `[LINK-01]` (`src/modules/federation/azeebo/links.ts:68`, `:75`), and CORS no longer trusts a partner origin by default. Measured in TSK-35's closure: `grep -rn "azeebo\.plus" src/` returns 2 comment lines and 0 executed literals.
- **Control gap:** none known; the guard is the registry test suite.
- **Severity:** Low.
- **Mitigation:** keep `[DEST-07]` as the designed outcome until the operator states `AZEEBO_PLUS_UNIVERSAL_URL`.
- **Test:** `tests/unit/federation-destination-registry.test.ts`, `tests/unit/public-provenance.test.ts`.
- **Owner:** Engineering Lead.

#### TM-FED-02 · Repudiation · outbound event reported as delivered without leaving the process
- **Asset:** the partner's belief that VMN syndicated content, and VMN's own delivery record.
- **Attacker:** none required — the defect is self-inflicted.
- **Attack path:** `dispatchWebhook` called without a transport: `const success = mockTransport ? mockTransport(webhook) : true;` (`src/modules/federation/azeebo/bridge.ts:134`) — no HTTP request is made, yet the status becomes `DELIVERED`. Reached from HTTP at `src/api/router.ts:6953`, whose reply is the ternary at `:6958` (`webhook.status === "DELIVERED" ? 200 : 503`), so the 503 branch is unreachable without a transport and every unconfigured call answers **200** with that webhook body.
- **Impact:** a delivery claim with no artifact — canonical law 20 violated in production code, not in a document.
- **Current control:** HMAC signing of the payload and a circuit breaker with DLQ (`src/modules/federation/azeebo/bridge.ts:100`ff) exist, but neither performs the call.
- **Control gap:** no transport is wired at all; §16's "webhook spoofing" has an inverse here — *delivery spoofing*. Recorded as a defect rather than silently patched (TSK-21 closure note, `docs/events/catalogue.md` §3).
- **Severity:** High.
- **Mitigation:** require an injected transport and return an explicit not-configured state when absent, mirroring `[DEST-07]`; pin the change with a route test.
- **Test:** `tests/unit/event-catalogue.test.ts` fails loudly the moment the assumption is paid off so §3 must be updated; no delivery test exists today.
- **Owner:** Engineering Lead.

### 2.13 TEND (external licensing and syndication)

#### TM-TND-01 · Spoofing · a syndication offer made for uncleared rights
- **Asset:** external rights-market position (PRD: "TEND — external licensing, syndication and rights-market distribution").
- **Attacker:** internal commercial user, or a partner acting on a stale offer.
- **Attack path:** expose an asset in a TEND surface whose clearance has lapsed.
- **Impact:** offering rights VMN does not hold (law 8).
- **Current control:** the same clearance gate as TM-RGT-01 (`src/modules/broadcast/rights/clearance.ts:53`), plus flag-gated TEND surfaces in `src/web/public/surface-a.ts` and `src/web/workspace/surface-bc.ts`.
- **Control gap:** TEND's own carriage/compliance entities are absent (TSK-15), so the gate cannot check what was never modelled; there is no route-level test proving a lapsed clearance removes an offer.
- **Severity:** High.
- **Mitigation:** model the entities (owner data), then add the lapse-refusal test.
- **Test:** none specific to TEND today; the rights gate is tested generically.
- **Owner:** Brand Owner / Engineering Lead.

### 2.14 File uploads

#### TM-UPL-01 · Tampering · malicious or oversized payload accepted
- **Asset:** the media library and every consumer of a stored object.
- **Attacker:** authenticated user with upload rights.
- **Attack path:** POST a payload whose declared type differs from its bytes, or one large enough to skip scanning.
- **Impact:** stored-content attack against every renderer, or an unscanned object served to partners.
- **Current control:** `validateMediaBuffer` (`src/core/storage/index.ts:206`) invoked at `src/api/router.ts:8082`, calling `scanBufferForThreats` (`:84`) at `:227`; sha256 fingerprinting (`:73`); MIME allow-list and size ceiling at presign (`:126`); 1 MB body bound on JSON routes (`src/api/router.ts:439`).
- **Control gap:** the scanner reads at most `MAX_SCAN_BUFFER_BYTES` = 20 MB (`src/core/storage/index.ts:65`) while presign permits up to 50 GB, so any object above the scan cap is accepted unscanned; the signature is `scanBufferForThreats`'s own heuristic, not an external engine (`docs/audit/dependency-triage.md`).
- **Severity:** Medium.
- **Mitigation:** make the cap explicit at the boundary — refuse, or quarantine pending scan, rather than accept silently.
- **Test:** `tests/unit/production-core-and-infrastructure.test.ts`; no over-cap case is asserted.
- **Owner:** Engineering Lead.

### 2.15 Admin interfaces

#### TM-ADM-01 · Elevation of privilege · role header minted by a caller
- **Asset:** every admin desk.
- **Attacker:** any HTTP client.
- **Attack path:** send `x-test-role: SuperAdmin` to a deployment whose `NODE_ENV` is `test` by mistake.
- **Impact:** instant full privilege, no credentials.
- **Current control:** the header is read only under `NODE_ENV === "test"` (`src/api/router.ts:730`), and the harness user carries **no** `tenantId` (`:731-735`), which is why TSK-58's tenant cases had to mint signed sessions instead.
- **Control gap:** the guard is a single exact-string comparison, the same class as TM-ATH-02 and AUD-11: an unset or typo'd `NODE_ENV` yields both no `Secure` cookie and a role-minting backdoor.
- **Severity:** High (conditional on deployment hygiene).
- **Mitigation:** fail boot when `NODE_ENV` is not one of the three recognised values, or gate the harness on an explicit opt-in flag rather than an absence.
- **Test:** `tests/unit/config.test.ts` covers validation of known values, not this refusal.
- **Owner:** Engineering Lead.

### 2.16 AI agents

#### TM-AIA-01 · Tampering / repudiation · an autonomous consequential action with no accountable human
- **Asset:** any workflow where headspace or an intelligence surface can act (canonical law 13).
- **Attacker:** prompt-injected upstream content, or a misconfigured automation.
- **Attack path:** agent output drives a consequential write without an approval record.
- **Impact:** irreversible business action with no accountable authority; law 13 breach.
- **Current control:** consequential paths remain human-gated: approvals live in `src/core/approvals/index.ts` (four-eyes), and the register's own rule set forbids manufacturing approval — `docs/decisions/DEC-RL1-SCOPE-001.md:8` states "This record does not manufacture approval", quoting the allocation authority's "It does not manufacture missing business approval."
- **Control gap:** no dedicated agent tool-abuse or prompt-injection control is implemented or tested; the `tasks.md` grep for such a control returns nothing (measured 2026-10-15), so the protection is architectural (agents are advisory) rather than enforced.
- **Severity:** Medium today, High as agent capability grows.
- **Mitigation:** keep consequential writes behind the approval desk; state this constraint wherever an agent surface gains a write path.
- **Test:** none; recorded as unproven rather than assumed safe.
- **Owner:** EAB (law 13 allocations) / Engineering Lead.

### 2.17 Webhooks (inbound, all providers)

#### TM-HBK-01 · Spoofing / replay · a captured provider event replayed
- **Asset:** payment and provider state transitions.
- **Attacker:** party able to re-send a previously valid request.
- **Attack path:** replay within the replay window.
- **Impact:** double credit or reversed settlement.
- **Current control:** durable `ProviderEventClaim` with a unique `(provider, eventId)` index (`prisma/schema.prisma:868`), claim/confirm/release at `src/core/websecurity/index.ts:157`/`:201`/`:226` with a 7-day window supplied by the callers (`7 * 24 * 60 * 60 * 1000` at `src/api/router.ts:7876`, `:7968`), signature verification per provider (C8), and a 7-day replay window on the ingestion path.
- **Control gap:** signature secrets come from configuration; with `NODE_ENV` unset, `src/api/server.ts:73`-adjacent dev fallbacks inject known defaults (`audit.md` AUD-11), so a mislabelled deployment verifies against a public secret.
- **Severity:** High (deployment-dependent), Low with correct env.
- **Mitigation:** refuse boot on a placeholder secret outside an explicit development opt-in.
- **Test:** `tests/unit/durability-release-critical.test.ts` proves refusal across a real restart; the secret-fallback refusal is not asserted.
- **Owner:** Engineering Lead.

### 2.18 Event processing

#### TM-EVT-01 · Denial of service / tampering · event pipeline loss presented as durability
- **Asset:** EPG generation, notifications, reconciliation, webhooks dispatch.
- **Attacker:** none (reliability threat) or an operator reading `/readyz`.
- **Attack path:** process restart with queued jobs.
- **Impact:** silently dropped work; a false claim that events were processed.
- **Current control:** `docs/events/catalogue.md` states the substrate honestly — `JobType` has **4** types, handlers exist for all four, `WEBHOOK_DISPATCH` and `RECONCILIATION_RUN` have **zero** producers, and the jobs store is an in-process `Map` with TTL pruning (`src/core/queue/index.ts:63`, `:69-78`); sandbox-state labelling (TSK-20) marks non-durable families rather than claiming persistence.
- **Control gap:** no idempotency key or provenance field on the job envelope; ADR-006 (Redis Streams + BullMQ) not implemented; none of PRD §39's 16 canonical event candidates is emitted.
- **Severity:** Medium (sandbox) / High (production claim).
- **Mitigation:** build or supersede ADR-006 — an EAB decision, already recorded as such.
- **Test:** `tests/unit/event-catalogue.test.ts` re-derives every count from source each run.
- **Owner:** EAB.

### 2.19 Third-party vendors

#### TM-TPV-01 · Information disclosure · dependency or vendor surface shipped without triage
- **Asset:** everything a vendor dependency can read or reach.
- **Attacker:** supply-chain adversary.
- **Attack path:** an unmaintained or vulnerable transitive dependency, or an unreviewed vendor credential.
- **Impact:** data exposure through a trusted code path.
- **Current control:** `docs/audit/dependency-triage.md` records the triage; lockfile-frozen installs (`CI=1`); the CI pipeline builds the image and scans it with Trivy at `.github/workflows/ci.yml:106-115` — `exit-code: 1`, `vuln-type: os,library`, `severity: CRITICAL,HIGH`, with `.trivyignore` honoured at `:113`; no telemetry is exported (OTLP wiring is TSK-36 and unimplemented, so no endpoint is invented).
- **Control gap:** that scan covers the **container image only** — there is no `pnpm audit`/SBOM step anywhere in the workflow (measured 2026-10-15: grep for `pnpm audit|npm audit|sbom` in `.github/workflows/ci.yml` and `package.json` returns nothing), so a dependency introduced without changing the image layers can pass, and `.trivyignore` is an allow-list whose entries are not re-justified by any test. Vendor credential handling for StarTimes/carriage data is TSK-15 (`BLOCKED_HUMAN`).
- **Severity:** Medium.
- **Mitigation:** add a dependency-tree audit to the same workflow; keep the ignore file's entries individually justified rather than inherited.
- **Test:** none for the dependency tree; the image scan is a CI step, not a repository test.
- **Owner:** Engineering Lead.

---

## 3. §16 explicit test vectors — status

§16 lists twenty-one vectors to "explicitly test for". This table states, for each, whether a test **in this repository** exercises it through the mechanism named, and cites it. Anything not exercised is `NOT_EXERCISED`; no vector is marked covered on the strength of a control existing.

| # | Vector | Status | Exercised by |
|:--|:---|:---|:---|
| 1 | IDOR / broken object authorization | `PARTIAL` | read routes only: `tests/unit/todo-final-remediation.test.ts:1327`-`:1407`; mutating case absent (TSK-58 box 1) |
| 2 | Privilege escalation | `EXERCISED` | `tests/security/route-authorization.test.ts`, `tests/unit/security-auth-rbac.test.ts` |
| 3 | Cross-role data leakage | `PARTIAL` | `tests/unit/identity-and-rbac.test.ts`; tenant dimension unreachable (TM-AUT-02) |
| 4 | Insecure direct file links | `PARTIAL` | fail-closed unowned-asset branch tested; object ACL unasserted (TM-UNC-01) |
| 5 | Malicious uploads | `PARTIAL` | `validateMediaBuffer` cases in `tests/unit/production-core-and-infrastructure.test.ts`; over-cap path unasserted (TM-UPL-01) |
| 6 | Webhook spoofing | `EXERCISED` | signature refusal cases, `tests/unit/durability-release-critical.test.ts` |
| 7 | Replay | `EXERCISED` | durable claim + restart reader, `tests/helpers/durable-restart-reader.mjs` |
| 8 | CSRF | `EXERCISED` | `tests/security/route-authorization.test.ts` over the C3 gate |
| 9 | XSS | `PARTIAL` | `escapeHtml` proven on break-out characters (`tests/unit/html-escape-census.test.ts`); the 299-site interpolation ceiling is untriaged (DEBT-009) |
| 10 | Injection | `PARTIAL` | Prisma parameterisation by construction; no dedicated injection suite exists |
| 11 | Mass assignment | `PARTIAL` | field narrowing helpers (`src/api/router.ts:517`, `:529`) are asserted indirectly; `jsonObjectField` still forwards provider payloads verbatim |
| 12 | Rate abuse | `PARTIAL` | five endpoints (`C7`); generation and list routes unthrottled (TM-BCS-01) |
| 13 | Credential stuffing | `EXERCISED` | lockout + shared-limit cases, `tests/unit/auth-shared-across-instances.test.ts` |
| 14 | Session theft | `PARTIAL` | revocation exercised (`C4`); cookie-flag/env dependency unasserted (TM-ATH-02) |
| 15 | Payment diversion | `NOT_EXERCISED` | no test drives a payout-destination change; bank-detail area is TM-BNK-01 |
| 16 | Unsafe account merging | `NOT_EXERCISED` | no merge refusal exists (TM-IDN-01) |
| 17 | Agent prompt injection | `NOT_EXERCISED` | no control or test (TM-AIA-01) |
| 18 | Agent tool abuse | `NOT_EXERCISED` | as above |
| 19 | Secret exposure | `PARTIAL` | `.env` untracked and `.env.example` credential-free (`tests/unit/hygiene-guards.test.ts`); dev fallback secret injection unasserted (TM-HBK-01) |
| 20 | Rights-status bypass | `EXERCISED` | `tests/unit/broadcast-rights-gate.test.ts`, `tests/integration/rights-clearance-e2e.test.ts` |
| 21 | Broadcast schedule-rights bypass | `EXERCISED` | `tests/unit/broadcast-rights-gate.test.ts` on `src/modules/broadcast/rights/clearance.ts:53` (`validateScheduleRights`), `tests/integration/rights-clearance-e2e.test.ts:189` (slot blocked on the registered record) |

Four vectors are `NOT_EXERCISED`, ten are honest `PARTIAL` and seven are `EXERCISED` (measured from this table, not asserted: `grep -c` of each status token). That is the model's current ceiling, and it is written here rather than smoothed: a threat model that reports only its controls is a marketing document, not a security artifact. Severities carry the same discipline — **11 High, 11 Medium, 2 Low** across the 24 threat blocks, counted by the same command.

---

## 4. What this document does not claim

- It does not claim the system is secure, penetration-tested, or free of severe findings. Severe items with open register rows are named above with their `TSK-nn`: TSK-58 (tenant enforcement), TSK-15 (carriage data), TSK-36 (OTLP), TSK-31 (DSR), TSK-57 (compose hardening).
- It does not assert any control that is not a `file:line` on this tree; `tests/unit/threat-model.test.ts` re-opens every citation on each run, and a citation that stops resolving fails the suite instead of silently ageing.
- It does not fix anything. §16's output instruction is the document itself; the two `High` gaps it newly names (TM-FED-02 delivery spoofing at `src/modules/federation/azeebo/bridge.ts:134`, TM-ADM-01 env-string gating) are recorded for their existing tracks, not patched in this pass.
- It does not replace `docs/security/route-authorization-coverage.md`, which remains the authoritative route-by-route guard census.
