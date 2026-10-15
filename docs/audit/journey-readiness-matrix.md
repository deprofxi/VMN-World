# Per-Journey Backend / Integration Readiness Matrix — TODO-PRC-01

**Document:** `VMNL-AZP-VMN-READINESS-001 — R1.1`
**Authority:** VMNL-AZP-VMN-UIUX-CCPP-001 §4.1 — each journey records
VERIFIED / IMPLEMENTED / BLOCKED / NOT_APPLICABLE per dimension.
**Reconciled:** 2026-09-30 against the working tree; evidence paths verified to exist.
**Re-reconciled 2026-10-13 (TSK-20):** the Persistence column now carries a data state per
`docs/domain/systems-of-record.md` §3.1 (durable) / §3.3 (process memory) rather than a bare
"IMPLEMENTED"; the nine suites this matrix cites were located and re-run on this tree — **9 files /
102 tests passed, 0 skipped** on a migrated, unseeded gates database, inside the 68-file full suite
(`docs/audit/evidence/tsk20-sandbox-state-labelling-2026-10-13/`). Closes the stale-reconcile finding
registered as TSK-38 box 1.

Status legend (CCPP §4.1):
- **VERIFIED** — implemented and exercised by an executable test or drill.
- **IMPLEMENTED** — implemented; automated coverage exists but a CCPP §7 gate (drill, manual a11y, usability) is still open.
- **BLOCKED** — awaiting a human decision, contract, or external dependency (owner named).
- **NOT_APPLICABLE** — not part of this release's scope by decision record.

**Data-state vocabulary (TSK-20, Rule 0.4a — "Sandbox state is not persistence").** The Persistence
column is a statement about *where the entity's only copy lives*, and it uses exactly three forms:

- **`D2`** — a table exists *and* a boot-hydration read index over it that fails closed for a row it
  has not loaded. **`D1`** — a table exists and is written; no served read index rebuilds it at boot.
  `docs/domain/systems-of-record.md` §3.1 is the authority for which entity is which.
- **`sandbox-state (family-id, …)`** — the entity's only copy is a process-memory `Map`/`Set`, so it
  dies with the restart and is **not** persistence. Family ids are the rows of
  `docs/domain/systems-of-record.md` §3.3, mirrored one-for-one into
  `docs/decisions/screen-register.json` `sandboxState.families[].id`.
- **`BLOCKED` / `NOT_APPLICABLE`** — a durability decision is owned elsewhere (TSK-17) or the journey
  writes nothing at all.

A cell may name both a durable store and a `sandbox-state` family: the durable half does not rescue
the labelled one, and the label does not make the row's Gate column greener. Nothing in this matrix
may read "in-memory" without saying `sandbox-state` — `tests/unit/systems-of-record.test.ts` checks
that the §3.3 families and this document's labels stay in parity.

| Journey | Domain logic | API contract | Authorization | Persistence | Failure drill | Gate |
|---|---|---|---|---|---|---|
| J-RL1-01 Public discovery & enquiry | VERIFIED (`modules/hub/enquiry`, idempotency + durable outbox) | VERIFIED (`enquiry-failure-drill.test.ts`) | VERIFIED (rate limit, scope) | **D2** — `CommercialEnquiry` table via `core/database/repositories/release-critical.repository.ts:73`, boot-hydrated read index `modules/hub/enquiry/index.ts:66`; a 201 means the row is in Postgres (`tests/unit/durability-release-critical.test.ts`) | VERIFIED (drill) | **VERIFIED** |
| J-RL1-02 Identity: sign-in / MFA / invitations / sessions | VERIFIED (`core/auth/*`: bcrypt, RFC 6238 TOTP, invitation chain, registry revocation) | VERIFIED (`security-auth-rbac.test.ts`, `identity-and-rbac.test.ts`) | VERIFIED (RBAC matrix + route guards) | Split. **D2** for the session registry (`SessionRecord` + `core/auth/sessions.ts:42`, TSK-17). **`sandbox-state (auth-process-copies, mfa-secrets, invitations, session-side-stores)`** for everything else: identity lives in the auth Map + its adapter-first shared mirror, not the `User` table (`findUserByEmail` reads `user:<email>` before the Map at `core/auth/index.ts:578`, sealed by TSK-30), lockout/MFA/revocation are fleet-atomic (TSK-27 closed 2026-10-10) — while `grep -rn "prisma.user" src/` still shows no runtime `User` writes. `rateLimitStore` (`core/auth/index.ts:223`) is per-process **by design** even with an adapter bound | IMPLEMENTED (lockout + replay tests) | **IMPLEMENTED** |
| J-RL1-03 Access request / elevation | IMPLEMENTED (`/access-request` audit + RBAC) | IMPLEMENTED | VERIFIED (`route-authorization.test.ts`) | BLOCKED (elevation grants await IAM decision — owner: Head of Broadcast) | NOT_APPLICABLE | **IMPLEMENTED** |
| J-RL1-04 AFCA application journey | VERIFIED (`modules/hub/afca/admissions.ts`) | VERIFIED | VERIFIED | `sandbox-state (admissions-applications)` — `applicationLedger` (`modules/hub/afca/admissions.ts:71`) and the module's own `idempotencyRegistry` (`:72`) are the only copies; the durable `IdempotencyRecord` table (§3.1) guards HTTP replays, not this ledger. `recordDecision` has no source-state guard (`docs/domain/state-machines.md` §6) | BLOCKED (drill suite open — TODO-PRC-03) | **IMPLEMENTED** |
| J-RL1-05 Learning / LMS | IMPLEMENTED (`afca-lms`, `AfcaAcademyService`) | IMPLEMENTED | VERIFIED | `sandbox-state (afca-catalogue)` — `courses` and its sibling stores at `modules/hub/afca/index.ts:114`; the `AfcaCourse` table exists but its only write anywhere in `src/` is the seed script (`src/db/migrate-and-seed.ts:68`), never the served process | NOT_APPLICABLE | **IMPLEMENTED** |
| J-RL1-06 Creative hub desks (ACC/AFC/VTM/ONE/VCF/EVT/TEND) | BLOCKED (desks render labelled demo data; engines exist unwired — TODO-SCR-18) | BLOCKED (POSTs audit-intent only) | IMPLEMENTED | `sandbox-state (vcf-pipeline, vtm-book, tend-catalogue, community-hub, onestudios-gear, events-fusion, talent-registry)` — the POSTs do write, but only into per-process engine Maps constructed inside `createServer` (`src/api/server.ts:165`, `:254-256`), so "no canonical writes" was never the honest form of this cell. No `PitchSubmission`/`VtmContract`/`DistributionLicense`/`HubLocation`/`ProductionBooking`/`DailyCallSheet` model exists at all, and `TalentProfile` (D1) is never joined to the accelerator Maps (`modules/hub/talent/index.ts:175,:176`) | NOT_APPLICABLE | **BLOCKED** (owner: DEC-RL1-SCOPE-001 D-05) |
| J-RL1-07 Client counterparty portal | IMPLEMENTED (org isolation via `getClientOrgRelationship`) | IMPLEMENTED (questions ticket) | VERIFIED (`client-portal-and-operations.test.ts` incl. cross-org 403) | **D2** — `SalesDealRecord` + the desk's own index (`modules/finance/sales/index.ts:64`), hydrated at boot into the instance the routes mutate; a rejected write rolls the index back (TSK-13 deleted `MOCK_CLIENT_PROJECTS`). Per-flight delivery runs and per-airing certificates stay NOT CONNECTED — no canonical record joins either to a deal | BLOCKED (drill open — TODO-PRC-03) | **IMPLEMENTED** |
| J-RL1-08 Schedule review (read-only) | VERIFIED (blocker explanations render from rights gate data) | VERIFIED | VERIFIED | Split. **D2** for what the blockers read: the `RightsRecord` registry index and the episode-master projection over `Programme`/`BroadcastEpisode`. `sandbox-state (schedule-day, broadcast-versions)` for the entity under review — the schedule day (`modules/broadcast/versions/index.ts:318`) has no table, so a restart returns the reviewed schedule to the demo seed. The screen UX-BR-012 is deliberately *not* labelled in the register because it renders channel/episode-master state and fixed blocker copy, not that Map; this cell is about the journey's entity, not that screen's data path | BLOCKED (drill open) | **IMPLEMENTED** |
| J-RL1-09 Rights review request | VERIFIED (`modules/broadcast/rights`: one context owns the review workflow (`review-request.ts`) and the clearance gate (`clearance.ts`); opening a request never clears rights, an evidence-backed resolution writes the record the gate reads — `tests/integration/rights-clearance-e2e.test.ts`. Since TSK-10 that registered record is also what the **lifecycle** decides on: `approveSchedule`/`amendSchedule` re-check every entry (`[SCHED-RIGHTS-03]`), XMLTV/StarTimes export re-checks at export time (`RIGHTS_NOT_CLEARED_AT_EXPORT`), the route refuses caller-authored rights facts (`RIGHTS_RECORD_FIELDS_NOT_TRUSTED`), and free-text `rightsClearedBy` is an attestation annotation only — `tests/unit/broadcast-rights-gate.test.ts`) | VERIFIED (open / transition / resolve POSTs; the former `core/rights` module no longer exists) | VERIFIED (guards `create`/`update:rights`; anonymous 401 and `PlayoutOperator` 403 asserted in the E2E suite) | VERIFIED when Postgres is reachable — resolution writes `RightsRecord` and an independent repository instance reads the extended window back; the suite prints which path ran and never reports the in-memory sandbox as persistence. The gate's read index is a boot-hydration **cache over that store** and fails closed for a row it has not loaded (`refreshRegisteredRightsIndex`, called from `src/api/server.ts`). The **review queue** is separately `sandbox-state (rights-review-requests)` — `requests` at `modules/broadcast/rights/review-request.ts:63`; CA-12 named the clearance record, not the queue, and TSK-17 did not change that | BLOCKED (drill open) | **IMPLEMENTED** |
| J-RL1-10 POA exception resolution | IMPLEMENTED (audit-intent resolution; as-run engine VERIFIED) | IMPLEMENTED | IMPLEMENTED | Split. **D1** for the as-run log (`AsRunLogRecord`). `sandbox-state (proof-of-air-registry, poa-delivery-exceptions)` for the certificate registry (`modules/broadcast/asrun/index.ts:115`) and the shortfall desk (`modules/broadcast/asrun/exceptions.ts:83`) — the table persists aggregate counts only, so a restart empties the desk and TSK-16's contract is that it re-derives from the next ingested log rather than fabricating rows | BLOCKED (drill open) | **IMPLEMENTED** |
| J-RL1-11 Content publication | VERIFIED (`core/content` revision domain: approval invalidation, SOD, withdrawal consequences) | VERIFIED (`/api/v1/workspace/content*`) | VERIFIED (`content` RBAC resource derived) | **D2** — `ContentItemRecord` + `ContentRevisionRecord`, one persister for both (`core/database/repositories/release-critical.repository.ts:614`), index `core/content/index.ts:99` hydrated at `src/api/server.ts:334`; every superseded revision keeps its own row. **Corrected 2026-10-13:** this cell read `IMPLEMENTED (in-memory)` from before TSK-17 made the CMS durable (its release-critical list maps `ContentRevision` — CMS SCR-01/02 — onto those two tables, `tasks.md:829`) — an understatement, not an overstatement, but the same class of stale claim | BLOCKED (drill open) | **IMPLEMENTED** |
| J-RL1-12 Azeebo+ destination verification | VERIFIED (`core/federation/destinations`, https-only + HX-13 fallback) | VERIFIED | VERIFIED | **D2** — `AzeeboDestination` + index `core/federation/destinations.ts:33`, hydrated at `src/api/server.ts:333`, so verification state is data and a restart cannot resurrect `CANDIDATE` over a recorded `VERIFIED` | BLOCKED (navigation drill open) | **IMPLEMENTED** |
| J-RL1-13 Enquiry routing configuration | VERIFIED (`setRoutingRule` audited) | VERIFIED | VERIFIED (update:audit role) | `sandbox-state (routing-rules)` — `routingRules` at `core/federation/destinations.ts:209`, in the same file as the durable destination registry above but with entirely different durability: this half has no table | NOT_APPLICABLE | **IMPLEMENTED** |
| J-RL1-14 Four-eyes approvals | VERIFIED (`core/approvals`: authority recheck, stale revision, SOD, reason) | VERIFIED (`/api/v1/workspace/approvals*`) | VERIFIED (per-category authorized roles) | **D2** — `ApprovalItem` + index `core/approvals/index.ts:53`, hydrated at `src/api/server.ts:330`; a rejected write rolls the index entry back and the route answers 503 `REPOSITORY_UNAVAILABLE`, never 201 | BLOCKED (drill open) | **IMPLEMENTED** |
| Broadcast BG0–BG9 operational desks | BLOCKED (33 screens carry labelled demonstration KPIs pending engine wiring — TODO-BCST-01) | IMPLEMENTED (validate/QC/reconcile APIs VERIFIED) | VERIFIED (screen RBAC 401/403) | BLOCKED (BG6 carriage data — owner: Carriage Platform Owner), and **`sandbox-state (schedule-day, broadcast-versions, proof-of-air-registry, poa-delivery-exceptions, broadcast-billing, broadcast-traffic, playout-cache)`** for the rest of what these desks read: the served billing panels project `listBillingSchedules()` from the rate-card/schedule Maps (`src/api/router.ts:411` → `modules/broadcast/billing/index.ts:56-59`), so a freshly booted instance shows an empty strip. Only the as-run aggregate (`AsRunLogRecord`, D1) and the hydrated sponsorship bindings (§3.1) survive a restart | PARTIAL (`uat-broadcast-failure-drills`) | **BLOCKED** |
| Finance quote-to-cash | VERIFIED (delivery-gated recognition FIN-01, maker-checker FIN-02, MT940 FIN-05, ledger 7-way) | VERIFIED (`finance.test.ts`, `finance-minor-units.test.ts`) | VERIFIED (approve:finance guards) | Split. **D2** `SalesDealRecord`; **D1** `Contract`/`Settlement`; **D1 write** `JournalEntryRecord` (the served process builds a ledger at `src/api/server.ts:268` but `hydrate()` has no boot caller, so a restarted engine starts with an empty entry list — stated limit). `sandbox-state (payout-batches, bank-reconciliation)`: FIN-05's MT940 ingest writes `modules/finance/reconciliation/index.ts:39,:40` and payout batches `modules/finance/payouts/index.ts:65`, while the `TalentPayoutBatch` and `BankStatementRecord` tables have **no accessor anywhere in `src/`** — the tables exist, nothing reads or writes them | BLOCKED (drill open) | **IMPLEMENTED** |
| Payment release / escrow disbursement | BLOCKED (implemented behind `FF_FINANCE_PAYMENT_RELEASE`; prod default OFF; final ruling pending — owner: Finance Controller, DEC-RL1-SCOPE-001 C-2) | IMPLEMENTED | VERIFIED | `sandbox-state (vtm-book, feature-flag-overrides)` — `releaseMilestoneEscrow` mutates the VTM contract Map (`modules/hub/vtm/index.ts:103`), and the durable half of the request is the audit entry (`finance.escrow.released`, `src/api/router.ts:7790`) plus the journal, not the milestone; the kill switch the release depends on is itself the override Map at `core/feature-flags/index.ts:380`. Durable `Contract` rows are never joined to a `VtmContract` | NOT_APPLICABLE (flag-blocked) | **BLOCKED** |

## §3.3 family → journey parity (TSK-20, measured 2026-10-13)

Every one of the **30** `sandbox-state` families in `docs/domain/systems-of-record.md` §3.3 is listed
here with the row(s) that now name it. The register's copy of the same inventory is
`docs/decisions/screen-register.json` `sandboxState.families[]`; `tests/unit/systems-of-record.test.ts`
fails if §3.3, the register and this table diverge, and fails if a Persistence cell says "in-memory"
without a family id.

| Family id | §3.3 store | Named by |
|:---|:---|:---|
| `schedule-day` | `modules/broadcast/versions/index.ts:318` | J-RL1-08, BG0–BG9 |
| `broadcast-versions` | `modules/broadcast/versions/index.ts:46` | J-RL1-08, BG0–BG9 |
| `rights-review-requests` | `modules/broadcast/rights/review-request.ts:63` | J-RL1-09 |
| `proof-of-air-registry` | `modules/broadcast/asrun/index.ts:115` | J-RL1-10, BG0–BG9 |
| `poa-delivery-exceptions` | `modules/broadcast/asrun/exceptions.ts:83` | J-RL1-10, BG0–BG9 |
| `auth-process-copies` | `core/auth/index.ts:456` (and `:666`, `:223`, `:32`) | J-RL1-02 |
| `mfa-secrets` | `core/auth/totp.ts:127`, `core/auth/mfa.ts:20` | J-RL1-02 |
| `invitations` | `core/auth/invitations.ts:32` | J-RL1-02 |
| `session-side-stores` | `core/auth/sessions.ts:245`, `:295`, `:347` | J-RL1-02 |
| `admissions-applications` | `modules/hub/afca/admissions.ts:71`, `:72` | J-RL1-04 |
| `afca-catalogue` | `modules/hub/afca/index.ts:114` | J-RL1-05 |
| `events-fusion` | `modules/hub/events/index.ts:79`, `:80`, `:83` | J-RL1-06 |
| `talent-registry` | `modules/hub/talent/index.ts:175`, `:176` | J-RL1-06 |
| `vcf-pipeline` | `modules/hub/vcf/index.ts:81`, `:82` | J-RL1-06 |
| `vtm-book` | `modules/hub/vtm/index.ts:101`, `:102`, `:103` | J-RL1-06, Payment release / escrow |
| `tend-catalogue` | `modules/hub/tend/index.ts:66`, `:67`, `:68` | J-RL1-06 |
| `community-hub` | `modules/hub/community/index.ts:75`–`:78` | J-RL1-06 |
| `onestudios-gear` | `modules/hub/onestudios/index.ts:67`, `:68`, `:69` | J-RL1-06 |
| `routing-rules` | `core/federation/destinations.ts:209` | J-RL1-13 |
| `payout-batches` | `modules/finance/payouts/index.ts:65` | Finance quote-to-cash |
| `bank-reconciliation` | `modules/finance/reconciliation/index.ts:39`, `:40` | Finance quote-to-cash |
| `broadcast-billing` | `modules/broadcast/billing/index.ts:56`–`:59` | BG0–BG9 |
| `broadcast-traffic` | `modules/broadcast/traffic/index.ts:123` | BG0–BG9 |
| `playout-cache` | `modules/broadcast/playout/index.ts:72` | BG0–BG9 |
| `feature-flag-overrides` | `core/feature-flags/index.ts:380` | Payment release / escrow |
| `queue-jobs` | `core/queue/index.ts:63`, `:64` | **no journey row** — infrastructure, reached from every write path; durability belongs to TSK-21's event catalogue, not a journey |
| `aos-agent-runs` | `modules/intelligence/aos/index.ts:67` | **no journey row** — `/workspace/aos/console` is a registered screen (UX-AGT-001..009) with no RL1 journey |
| `headspace-library` | `modules/intelligence/headspace/index.ts:40` | **no journey row** — UX-HSP desk screen only |
| `cr8tech-jobs` | `modules/intelligence/cr8tech/index.ts:46`, `:47` | **no journey row** — UX-CR8 desk screen only |
| `source-mappings` | `core/config/source-mappings.ts` `registry` | **no journey row** — and the weakest claim in the table: §3.3's own recovery path is "it is configuration", so its `M` label means *not hot-reloadable*, not *user data at risk* |

**Five families have no journey row.** That is a coverage residual of this matrix (CCPP §4.1
enumerates journeys, and four of the five are intelligence/queue surfaces added to the register after
the journey list was cut), not a clean bill of health: the screens exist, the operator can write to
them, and the write dies with the process. Making them journeys is a scope decision
(`DEC-RL1-SCOPE-001` D-05 class), so they are named here rather than invented into rows.

**What this labelling does not do.** It does not make any row greener — every Gate value is unchanged
from R1.0. It does not decide durability: making a labelled family survive a restart is TSK-17's
unfinished half plus the migrations TSK-06 owns, both open. And it is a different inventory from the
register's per-screen labelling, which is anchored on each screen's own evidence text: **30** register
entries carry `dataState: "sandbox-state"` as at 2026-10-13, and four §3.3 families have **no** screen
whose evidence names them (`proof-of-air-registry`, `bank-reconciliation`, `broadcast-traffic`,
`playout-cache` — recorded in the register's `sandboxState.limits`). This matrix covers those four
(finance and BG rows) but leaves **five** others with no journey row. Two residuals, stated separately,
so neither is read as closing the other.

## Human decisions gating BLOCKED rows
| Decision | Owner | Record |
|---|---|---|
| RL1 scope acceptance (D-01..D-10) | Executive Sponsor | `docs/decisions/DEC-RL1-SCOPE-001.md` (PENDING_SIGNATURE) |
| Revenue-recognition ruling (FIN-01 C-2) | Finance Controller | PENDING — engine implements delivery-gated, contract-capped rule as defensible default |
| Rights override interpretation (GVR-04 C-1) | Legal / IP authority | PENDING — waiver wording replaced with review-request semantics |
| BG6 StarTimes carriage data (BCST-07) | Carriage Platform Owner | PENDING — channels remain PROVISIONAL |
