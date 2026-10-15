# Systems of record

**Measure date:** 2026-10-08, working tree at baseline `ce098f8` + dirty set (TSK-09's commit series
is not yet authorized, so no commit SHA can carry this state).
**Written from code, not from a plan:** every file:line below was opened on the measure date, and
§6 reproduces each count with a command. Related documents: `docs/domain/master-data-model.md`
(the intended model), `prisma/schema.prisma` (the declared model),
`docs/domain/state-machines.md` (how the same stores change state).

This answers one question per entity: **where does the authoritative copy actually live, and does it
survive a restart?** It exists because the answer is not uniform, and because three earlier
documents each assume a different one.

---

## 1. The four kinds of record in this repository

| Kind | Definition | Restart-safe? | Shared across processes? |
|:---|:---|:---|:---|
| **D1 — durable, authoritative** | A Prisma table written by application code, and read back from the table | Yes | Yes |
| **D2 — durable, with a hydrated read index** | Written to a table, but the hot path reads an in-process index rebuilt at boot | Yes (with a fail-closed window before hydration) | Writes yes; index needs re-hydration |
| **S — source-code record** | The authoritative copy is a literal in `src/`; the table, if any, is populated only by the seed script | Yes (it is source) | Yes (identical binary) |
| **M — process memory** | A module-level `Map`/`Set` or a class field; nothing is written to a table | **No** | **No** |

`M` is the category that the register calls *sandbox state*, and rule **0.4a** ("sandbox state is not
persistence") exists because a screenshot of an `M` surface looks exactly like a screenshot of a `D1`
surface. Nothing in `M` survives `pnpm dev` restarting, and two workers do not share it.

A fifth, partial kind: **K — shared KV (Redis-optional)**. `src/core/cache/index.ts:175`
`resolveKeyValueAdapter()` returns a Redis adapter only when `REDIS_URL` is set and a client factory
is registered; otherwise an in-memory adapter (`:184,:191`). Anything whose durability depends on it
is conditionally durable — see §4.

---

## 2. Prisma model census — 43 declared, 30 touched by code, 26 written at runtime

`grep -c "^model " prisma/schema.prisma` → **43**. All 43 have a `CREATE TABLE` in
`prisma/migrations/*/migration.sql` — 26 of them in `0_init/migration.sql`, `DataSubjectRequest` in
`20261006120000_add_data_subject_requests`, the 9 release-critical stores in
`20261008213000_add_release_critical_durable_stores` and the CMS/ledger/sponsorship stores in
`20261008220000_add_remaining_release_critical_durable_stores`, TSK-19's `ProviderEventClaim` in
`20261009133000_add_durable_provider_event_claims` (whose second claim phase adds a column in the
additive `20261009153000_add_provider_claim_ingest_phase`), and TSK-60's `SalesDealRecord` in
`20261011220000_add_durable_sales_deal_portfolio` (an already-applied migration is never
edited — that would break its checksum — so a later change to a shipped table is always a new
migration). All are applied with `prisma migrate deploy` and verified to produce zero schema drift —
so the schema and the migrations agree; the divergence is between the **tables** and the **code**.

Accessors were counted across all of `src/**/*.ts`, matching the roots `prisma`, `client`, `db`, `tx`
and `getPrismaClient()` *including calls broken across lines* (a first attempt that required the
accessor on one line missed `getPrismaClient().dataSubjectRequest.create(...)` at
`src/api/routes/privacy.routes.ts:71`, and the audit write it then reported at
`src/core/audit/index.ts` moved out of that module with TSK-18 and is now
`src/core/database/repositories/release-critical.repository.ts:1051`; §6 has the corrected command).

| # | Model | Accessors in `src/` | Where the write/read happens | Kind |
|:--|:---|:--|:---|:---|
| 1 | `TalentProfile` | 7 | `core/database/repositories/talent.repository.ts` | D1 |
| 2 | `CommercialCampaign` | 6 | `core/database/repositories/campaign.repository.ts` | D1 |
| 3 | `BroadcastEpisode` | 5 | `core/database/repositories/schedule.repository.ts`; seeded by `db/seeds/dam-backfill.ts` | D1 |
| 4 | `Programme` | 4 | `core/database/repositories/schedule.repository.ts` | D1 |
| 5 | `Contract` | 4 | `core/database/repositories/invoice.repository.ts` | D1 |
| 6 | `Settlement` | 4 | `core/database/repositories/invoice.repository.ts` | D1 |
| 7 | `RightsRecord` | 3 | `core/database/repositories/rights.repository.ts` + boot-hydrated index `modules/broadcast/rights/registry.ts:44` | **D2** |
| 8 | `AsRunLogRecord` | 3 | `core/database/repositories/schedule.repository.ts` | D1 |
| 9 | `AuditLog` | 4 | `core/database/repositories/release-critical.repository.ts:1051` create, `:1114` findMany (both inside `persistAuditLogEntry` `:1050` / `loadAuditLogRows` `:1107`); `core/audit/index.ts:460` count, `:474` deleteMany (`pruneAuditLogs` `:451`, still zero call sites) | **D2** since TSK-18 — staged in the request's journal group and drained with it (§4) |
| 10 | `DataSubjectRequest` | 2 | `api/routes/privacy.routes.ts:71` create, `:131` findFirst | D1 with honest degradation (§4) |
| 11 | `CommercialEnquiry` | 2 | `core/database/repositories/release-critical.repository.ts` (`persistCommercialEnquiry` `:73` / `loadCommercialEnquiries` `:117`), drained by the journal at `src/api/router.ts:580`; index `modules/hub/enquiry/index.ts:89` `refreshEnquiryIndex()` | **D2** |
| 12 | `ApprovalItem` | 2 | `core/database/repositories/release-critical.repository.ts:145` / `:187`; index `core/approvals/index.ts:75` | **D2** |
| 13 | `PrivacySecurityCase` | 2 | `core/database/repositories/release-critical.repository.ts:221` / `:259`; index `core/cases/index.ts:49` | **D2** |
| 14 | `RiskRecord` | 2 | `core/database/repositories/release-critical.repository.ts:285` / `:315`; index `core/work/index.ts:200` | **D2** |
| 15 | `IssueRecord` | 2 | `core/database/repositories/release-critical.repository.ts:331` / `:360`; index `core/work/index.ts:200` | **D2** |
| 16 | `AzeeboDestination` | 2 | `core/database/repositories/release-critical.repository.ts:389` / `:422`; index `core/federation/destinations.ts:55` | **D2** |
| 17 | `MediaAssetRecord` | 2 | `core/database/repositories/release-critical.repository.ts:441` / `:480`; index `core/storage/index.ts:339` | **D2** |
| 18 | `SessionRecord` | 2 | `core/database/repositories/release-critical.repository.ts:503` / `:527`; index `core/auth/sessions.ts:70` | **D2** |
| 19 | `IdempotencyRecord` | 2 | `core/database/repositories/release-critical.repository.ts:545` / `:569`; index `core/websecurity/index.ts:255` (TTL-windowed) | **D2** |
| 20 | `ContentItemRecord` | 2 | `core/database/repositories/release-critical.repository.ts:614` (`persistContentItem` writes the item and its revision chain) / `:714`; index `core/content/index.ts:118` | **D2** |
| 21 | `ContentRevisionRecord` | 2 | written by the same persister at `:656`; loaded at `:714` | **D2** |
| 22 | `JournalEntryRecord` | 2 | `core/database/repositories/release-critical.repository.ts:770` / `:797`; `modules/finance/ledger/index.ts:231` `hydrate()` — no boot caller yet (§3.4) | D1 write, **no read index in the served process** |
| 23 | `SponsorBindingRecord` | 2 | `core/database/repositories/release-critical.repository.ts:820` / `:839`; `api/server.ts:335` hydrates the desk's engine | **D2** |
| 24 | `SponsorFulfillmentRecord` | 2 | `core/database/repositories/release-critical.repository.ts:859` / `:879`; same hydration call | **D2** |
| 25 | `ProviderEventClaim` | 4 | `core/database/repositories/release-critical.repository.ts:912` create (the *unstamped* claim) / `:918` updateMany (atomic takeover of an abandoned attempt) / `:934` updateMany (stamp once ingested) / `:947` deleteMany (release after a failed ingestion); claimed from `core/websecurity/index.ts:169`, stamped from `core/websecurity/index.ts:207`, released from `core/websecurity/index.ts:232` — the two webhook routes go through all three | **D1** write, **durable constraint — no read index by design** |
| 26 | `SalesDealRecord` | 2 | `core/database/repositories/release-critical.repository.ts:968` (`persistSalesDeal`) / `:994` (`loadSalesDeals`); `modules/finance/sales/index.ts:28` `registerDurableStore("salesDeal", …)`, staged by the one `stageDeal` helper (`:105`, whose `stageDurableWrite` is at `:106`) from all 7 Quote-to-Cash mutators; hydrated at `api/server.ts:339` into the served `context.salesEngine` | **D2** |
| 27 | `Person` | 1 | `db/migrate-and-seed.ts:158` **only** | S/seed-only |
| 28 | `BroadcastChannel` | 1 | `db/migrate-and-seed.ts:46` **only**; runtime reads `modules/broadcast/channels/index.ts:26` | **S** |
| 29 | `Project` | 1 | `db/migrate-and-seed.ts:207` **only**; client portal reads a source literal | **S** |
| 30 | `AfcaCourse` | 1 | `db/migrate-and-seed.ts:68` **only**; runtime course catalogue is `modules/hub/afca/index.ts:114` | **M** + seed-only table |
| 31–43 | `User` `Role` `Permission` `RolePermission` `UserRole` `Organisation` `CreatorProfile` `Evidence` `Agent` `FusionEvent` `EventTicket` `TalentPayoutBatch` `BankStatementRecord` | **0** | no accessor anywhere in `src/` | **M**, or nothing at all (§3) |

**Measured:** 30 models have at least one accessor; 13 have none. Of the 30, **26** are written by
application code at runtime — the other 4 are touched exclusively by the seed script
(`src/db/migrate-and-seed.ts`). 16 of those 26 are the release-critical durable stores: the 13 added
by TSK-17 (census rows 11–24 — `ContentItemRecord`/`ContentRevisionRecord` is one store written by
two tables), the 1 added by TSK-19 (`ProviderEventClaim`, row 25), the 1 added by TSK-60
(`SalesDealRecord`, row 26) and the audit ledger (`AuditLog`, row 9), registered by TSK-18 at
`src/core/audit/index.ts:177`.

---

## 3. Authoritative store per business entity

One row per entity a screen or an API route actually serves. "Store" is the variable that holds the
copy the read path uses.

### 3.1 Durable

| Entity | Authoritative store | Kind | Notes |
|:---|:---|:---|:---|
| Registered rights record | `RightsRecord` table via `core/database/repositories/rights.repository.ts`; read index `modules/broadcast/rights/registry.ts:31` (`byId`) | D2 | `modules/broadcast/rights/registry.ts:44` `refreshRegisteredRightsIndex()` clears and rebuilds `byId` (`:31`) from the table; hydrated in `api/server.ts:374` **before** the schedule seed. An id absent from `byId` fails the clearance gate closed (`RIGHTS_RECORD_NOT_REGISTERED`) — asserted in `tests/unit/broadcast-rights-gate.test.ts` |
| Episode master / programme key art | `Programme` + `BroadcastEpisode` tables via `schedule.repository.ts`; in-process projection `modules/broadcast/episode-masters.ts:121` `rowsByChannel`, `:122` `mediaAssetByEpisodeCode` | D2 | projection rebuilt by `refreshEpisodeMasterIndex()` (`:165`), called from `api/server.ts:375` |
| As-run log | `AsRunLogRecord` table (`schedule.repository.ts`) | D1 | the *proof-of-air certificate* registry next to it is not (`:115`, below) |
| Talent profile | `TalentProfile` table (`talent.repository.ts`) | D1 | `Person` is a FK value only; no runtime `person.` accessor exists |
| Commercial campaign | `CommercialCampaign` table (`campaign.repository.ts`) | D1 | |
| Contract, settlement/invoice | `Contract`, `Settlement` tables (`invoice.repository.ts`) | D1 | `updateSettlementStatus` is unguarded and has **no caller in `src/`** (`docs/domain/state-machines.md` §7) |
| Audit chain | `AuditLog` table + `core/audit/index.ts:47` `auditLogStore` array | **D2** since TSK-18 | see §4 — the entry is staged in the request's journal group and drains inside the same transaction as the request's business rows; `persistenceMode` remains the read-path truth signal |
| Data subject request | `DataSubjectRequest` table + `api/routes/privacy.routes.ts:30` `requestsByUser` | D1 best-effort | status is `RECEIVED` **only** when the row was written; otherwise `RECORD_ONLY` (`:88`) |
| Commercial enquiry (TSK-17) | `CommercialEnquiry` table via `core/database/repositories/release-critical.repository.ts:73` / `:117`; read index `modules/hub/enquiry/index.ts:66` `enquiryStore` | **D2** | hydrated at `api/server.ts:329` `refreshEnquiryIndex()` (`modules/hub/enquiry/index.ts:89`); the journal drains at `src/api/router.ts:580`, so a 201 response means the row is in Postgres — asserted by `tests/unit/durability-release-critical.test.ts` |
| Four-eyes approval item | `ApprovalItem` table (`core/database/repositories/release-critical.repository.ts:145` / `:187`); index `core/approvals/index.ts:53` `approvals` | **D2** | hydrated at `api/server.ts:330`; a rejected write rolls the index entry back and the route answers **503 `REPOSITORY_UNAVAILABLE`**, never 201 (same test file) |
| Privacy / security case | `PrivacySecurityCase` table (`core/database/repositories/release-critical.repository.ts:221` / `:259`), audit trail as JSON; index `core/cases/index.ts:28` `cases` | **D2** | hydrated at `api/server.ts:331`; the restricted queue's SLA clock and data-subject list come back from the row |
| Risk / issue registers | `RiskRecord` + `IssueRecord` tables (`core/database/repositories/release-critical.repository.ts:285`/`:315`, `:331`/`:360`); index `core/work/index.ts:166` `risks`, `:167` `issues` | **D2** | hydrated at `api/server.ts:332` `refreshRiskIssueIndex()`; `linkedRiskId` is an application-side id reference, not an FK (design rule at the head of the TSK-17 block in `prisma/schema.prisma`) |
| Azeebo+ destination registry | `AzeeboDestination` table (`core/database/repositories/release-critical.repository.ts:389` / `:422`); index `core/federation/destinations.ts:33` `destinations` | **D2** | hydrated at `api/server.ts:333` — verification state is now data, so a restart cannot resurrect `CANDIDATE` over a recorded `VERIFIED`. Routing rules (`:209`) remain **M** (§3.3) |
| DAM media asset registry | `MediaAssetRecord` table (`core/database/repositories/release-critical.repository.ts:441` / `:480`); index `core/storage/index.ts:317` `mediaAssetRegistry` | **D2** | hydrated first at `api/server.ts:326`, before the golden-DAM backfill and the CMS picker read it; `sizeBytes` is a `BigInt` column so an 8 GiB master returns exact |
| CMS content + revision chain | `ContentItemRecord` + `ContentRevisionRecord` (`core/database/repositories/release-critical.repository.ts:614` / `:714`, one persister writes both); index `core/content/index.ts:99` `contentItems` | **D2** | hydrated at `api/server.ts:334` `refreshContentIndex()`, then `ensureContentDemoSeed()` re-runs idempotently ((`api/server.ts:345`)); every superseded revision keeps its own row, so an approved publication is never silently mutated |
| Seven-way journal entry | `JournalEntryRecord` (`core/database/repositories/release-critical.repository.ts:770` / `:797`) | D1 write, no served read index | Since TSK-33 the served process **does** construct a ledger (`api/server.ts:268`, wired as `context.ledgerService` at `:299`), and the proof-of-air credit remedy posts a contra journal through it (`api/router.ts:4521`). `modules/finance/ledger/index.ts:231` `hydrate()` still has **no boot caller**, so a restarted engine starts with an empty entry list; the 7-pillar snapshot is *not* rebuilt from rows — stated limit. `postDeal`/`postPayoutBatch`/`postBroadcastBilling` still have no `src/` callsite |
| Sponsor binding + fulfilment evidence | `SponsorBindingRecord` / `SponsorFulfillmentRecord` (`core/database/repositories/release-critical.repository.ts:820`/`:839`, `:859`/`:879`) | **D2** | hydrated at `api/server.ts:335` `hydrateSponsorshipEngine(sponsorshipEngine)` into the desk's own engine instance (`api/server.ts:261`); the entitlement delivery counters stay process-side (CA-12 lists the binding, not the entitlement) |
| Session registry / revocation | `SessionRecord` table (`core/database/repositories/release-critical.repository.ts:503` / `:527`); index `core/auth/sessions.ts:42` `sessionsByUser` | **D2** | hydrated at `api/server.ts:327`. Only the `tokenId` sha-256 digest is stored, never the raw credential; `revokeSessionById` (`core/auth/sessions.ts:150`) writes the revocation through the journal, so it outlives the issuing process. Preferences/inbox/first-use (`:240`, `:290`, `:342`) are still **M** |
| Idempotency ledger | `IdempotencyRecord` table (`core/database/repositories/release-critical.repository.ts:545` / `:569`); index `core/websecurity/index.ts:255` `idempotencyStore` | **D2** | hydrated at `api/server.ts:328` **within the store's own TTL window** — an outcome the registry has already forgotten does not come back after a restart |
| Client-portal deal portfolio | `SalesDealRecord` table (`core/database/repositories/release-critical.repository.ts:968` / `:994`); index `modules/finance/sales/index.ts:64` `deals` | **D2** | hydrated at `api/server.ts:339` `hydrateSalesEngine(salesEngine)` into the very instance the routes mutate (`api/server.ts:169`). All 7 Quote-to-Cash mutators stage through `stageDeal` (`:105`), whose rollback restores the pre-call field values (`:110`), so a rejected row never leaves the index ahead of Postgres. `financeApproverId`/`financeApprovedAt`/`depositPaidAt`/`proofDocumentUrl` hydrate as **absent** when the column is NULL — a restart cannot invent an approval stamp or a proof document the deal never had. Verified across processes by `tests/unit/durability-release-critical.test.ts`. The portal projects this index (`web/portal/client-portal.ts:85` `projectClientPortfolio`); **TSK-13 (2026-10-09) deleted `MOCK_CLIENT_PROJECTS`**, so the screen shows only real deals for the caller's organisation and its honest empty state when there are none — per-flight delivery runs and per-airing certificates stay labelled NOT CONNECTED, because no canonical record joins either to a deal |

### 3.2 Source code is the record

| Entity | Authoritative store | Notes |
|:---|:---|:---|
| Broadcast channels | `modules/broadcast/channels/index.ts:26` `CANONICAL_CHANNELS` (a source literal) | `getAllActiveChannels()` (`:89`) reads the literal, never the table. The `BroadcastChannel` row exists only so a deployment can see the same values in SQL. Carriage numbers/PIDs remain provisional (`docs/audit/evidence-register.md` §"provisional") |
| Roles → permissions | `core/rbac/index.ts:80` `ROLE_PERMISSIONS` matrix | The `Role`/`Permission`/`RolePermission`/`UserRole` tables have **zero accessors**. Authorization is decided from the matrix at request time (`:423,:441,:461,:474`), so editing SQL cannot grant or revoke anything — which is also why "never rely on UI hiding as authorization" is enforced in code here |

### 3.3 Process memory — not persistence

Every store below is the *only* copy of the entity it holds. Module-level stores measured at
**40** (`^export? (const|let) … = new Map|Set` at column 0), class-field stores at **70**. Both counts
include the read indexes of the durable stores in §3.1 — `M` here means *nothing is written to a
table*, which is no longer true for approvals, cases, risks/issues, destinations, media assets,
sessions, idempotency keys, CMS content or the client-portal deal portfolio (TSK-60). The class-field figure moved 68 → 69 on 2026-10-08 when
TSK-32 added `postedInternalAllocations` (`modules/finance/ledger/posting.ts`) to the ledger, the
module-level figure 39 → 40 on 2026-10-09 when TSK-16 added `exceptions`
(`modules/broadcast/asrun/exceptions.ts:83`), the delivery-exception register behind the POA workbench,
and 69 → 70 the same day when TSK-33 added `postedCreditNotes` (`modules/finance/ledger/posting.ts:62`),
the one-posting-per-credit-note guard.

As of 2026-10-13 this table is also the **input to a machine check**, not just prose: TSK-20 copies
its rows into `sandboxState.families` in `docs/decisions/screen-register.json` and into the family →
journey parity table in `docs/audit/journey-readiness-matrix.md`, and
`tests/unit/systems-of-record.test.ts` fails if any of the three inventories diverges, if a screen's
label is not anchored in that screen's own evidence, or if a readiness-matrix Persistence cell talks
about process memory without saying `sandbox-state`. Rows 1-18 are CA-12's
release-critical list; rows 19-30 came from the sweep under the table.

| Entity | Store (file:line) | Who writes it | Recovery path |
|:---|:---|:---|:---|
| Schedule day (entries, state, revision identity) | `modules/broadcast/versions/index.ts:318` `schedules` | the lifecycle in `state-machines.md` §1 | demo seed `api/server.ts:380` `ensureScheduleDemoSeed()`; otherwise empty |
| Broadcast versions | `modules/broadcast/versions/index.ts:46` `versions` | `registerVersion`, `markReadyForAir` | none — `seed` only |
| Rights review requests | `modules/broadcast/rights/review-request.ts:63` `requests` | `createReviewRequest`, `decideReviewRequest` | none — **still `M` after TSK-17**; CA-12 named the clearance record, not the review queue |
| Proof-of-air registry | `modules/broadcast/asrun/index.ts:115` `proofOfAirRegistry` | `reconcileAsRun` path | none — **not** the `AsRunLogRecord` table |
| POA delivery exceptions (shortfall desk) | `modules/broadcast/asrun/exceptions.ts:83` `exceptions` | `raisePoaExceptionsFromAsRun` from measured as-run shortfall; `resolvePoaException` closes | none — `AsRunLogRecord` (`prisma/schema.prisma`) persists aggregate counts only, so a restart empties the desk. It re-derives from the next ingested log rather than fabricating rows (TSK-16) |
| Users, credentials, lockout, rate limit | `core/auth/index.ts:456` `userStore`, `:666` `accountLockoutStore`, `:223` `rateLimitStore`, `:32` `consumedMfaChallenges` — all four are this process's **copies** | the shared KV adapter when one is bound (TSK-27): `findUserByEmail` (`core/auth/index.ts:578`) reads it first, the lockout counters are `auth:fail:<email>`/`auth:lock:<email>` (`:666` block), one-time MFA claims are `auth:mfa-consumed:<jti>`, sessions/revocations are `session:<id>`/`revoked:<id>` | seeded profiles; a restart logs everyone in with the seed state, and without `REDIS_URL` a second instance still keeps its own copies (the boot guard refuses memory in production-like environments). `rateLimitStore` (`:223`) stays per-process **by design even with an adapter bound** — it is deliberately not mirrored, because a write-only mirror would read as a shared limit while counting per instance; the shared limiter remains TSK-20's `M` label |
| MFA secrets / recovery codes | `core/auth/totp.ts:127` `sandboxSecrets`, `core/auth/mfa.ts:20` `recoveryTokens` | enrolment flows | none |
| Invitations | `core/auth/invitations.ts:32` `invitations` | invite flow | none |
| Admissions applications | `modules/hub/afca/admissions.ts:71` `applicationLedger`, `:72` `idempotencyRegistry` | `recordDecision` (`:201`) | none — and `recordDecision` has no source-state guard (`state-machines.md` §6) |
| AFCA course/cohort/enrollment catalogue | `modules/hub/afca/index.ts:114` `courses` (+4 sibling stores) | module | none |
| Events: `FusionEvent`, tickets, offline scans | `modules/hub/events/index.ts:79,:80,:83` | events module | none. The `FusionEvent`/`EventTicket` tables are never touched |
| Payout batches | `modules/finance/payouts/index.ts:65` `batches` | payouts module | none. `TalentPayoutBatch` table never touched. TEND licence payments are the same story: `modules/hub/tend/index.ts:173` hardcodes `paymentStatus: "PENDING"` with no mutator |
| Bank statements / reconciliation | `modules/finance/reconciliation/index.ts:39,:40` | reconciliation module | none. `BankStatementRecord` table never touched |
| Talent accelerator profiles, partner hubs | `modules/hub/talent/index.ts:175,:176` | talent hub | none |
| Enquiry routing rules | `core/federation/destinations.ts:209` `routingRules` | TSK-35 routing-rule flows | none — the destination registry itself is durable now (§3.1); outbound federation still fails closed |
| Queue jobs and handlers | `core/queue/index.ts:63,:64` | `EnterpriseQueueWorker` | none — in-process queue, no broker |
| AOS agent runs | `modules/intelligence/aos/index.ts:67` `agents` | AOS | none. Unrelated to the untouched `Agent` table |
| Source mappings | `core/config/source-mappings.ts` `registry` | static map built from `REGISTRY` | it is configuration |
| VCF pitch pipeline and slate | `modules/hub/vcf/index.ts:81` `pitches`, `:82` `slate` | `submitPitch`, `evaluatePitch`, `greenlightToSlate`, `disburseCapital` | none — `new VirtualContentFundEngine()` at `api/server.ts:254`, no hydrator, and no pitch/slate table exists in `prisma/schema.prisma` |
| VTM rate cards, briefs, contracts, milestone escrow | `modules/hub/vtm/index.ts:101` `rateCards`, `:102` `briefs`, `:103` `contracts` | `registerRateCard`, `createBrief`, `createStandardContract`, `signContract`, `depositMilestoneEscrow`, `releaseMilestoneEscrow` | none — constructed per process at `api/server.ts:165`. The durable `Contract` table (§3.1) is written by the invoice repository and is **never joined** to a `VtmContract` |
| TEND catalogue, distribution licences, royalty statements | `modules/hub/tend/index.ts:66` `catalogue`, `:67` `licenses`, `:68` `statements` | `registerTitle`, `createLicense`, `ingestRoyaltyStatement` | none — `api/server.ts:256`, no hydrator |
| Community hub locations, resources, members, bookings | `modules/hub/community/index.ts:75` `locations`, `:76` `resources`, `:77` `members`, `:78` `bookings` | `addLocation`, `addResource`, `registerMember`, `bookResource` | constructor literals re-run at `:80`, so a restart restores the seeded flagship location and forgets every member registered since |
| OneStudios gear locker, bookings, call sheets | `modules/hub/onestudios/index.ts:67` `assets`, `:68` `bookings`, `:69` `callSheets` | `registerAsset`, `createBooking`, `publishCallSheet` | `seedDefaultAssets()` (`:75`) re-runs per process; a published call sheet does not survive |
| HeadSpace knowledge library | `modules/intelligence/headspace/index.ts:40` `documents` | `registerDocument` | `seedDefaultKnowledgeBase()` (`:46`) re-runs per process |
| Cr8Tech subtitle tracks and clip jobs | `modules/intelligence/cr8tech/index.ts:46` `subtitleTracks`, `:47` `clipJobs` | `generateSubtitles`, `createSocialClipJob` | none — `api/server.ts:167` |
| Broadcast billing rate cards, schedules, make-goods, credit notes | `modules/broadcast/billing/index.ts:56` `rateCards`, `:57` `billingSchedules`, `:58` `makeGoods`, `:59` `creditNotes` | `seedRateCards` (`:65`), `createBillingSchedule`, `generateBillingScheduleFromAsRun`, `linkAiredSpotToContract` | none — the served broadcast desks project `listBillingSchedules()` through `api/router.ts:411`, so a restart blanks the billing panels; only the TSK-33 credit-note contra posted to the ledger survives |
| Traffic breaks and the make-good queue | `modules/broadcast/traffic/index.ts:123` `breaks` | `createBreak`, `scheduleSpot`, `addToMakeGoodQueue`, `dischargeMakeGoodByCreditNote` | none — `api/server.ts:259` |
| Playout local playlist cache | `modules/broadcast/playout/index.ts:72` `localCache` | `cacheLocalPlaylist` | none — and the desk still holds no on-air/lock state to lose (`tasks.md` TSK-11 box 6) |
| Notification preferences, first-use profile, in-app inbox | `core/auth/sessions.ts:245` `preferencesByUser`, `:295` `firstUseProfiles`, `:347` `inboxByUser` | `saveNotificationPreferences` (`:264`), `saveFirstUseProfile` (`:298`), `deliverInAppNotification` (`:354`) | none — §3.1's session row hydrates only the session/revocation index, and `useKeyValueAdapterForSessions` (`core/auth/sessions.ts:19`) mirrors sessions, never these three maps |
| Runtime feature-flag overrides | `core/feature-flags/index.ts:380` `memoryOverrides` | `setFeatureFlagOverride`, whose write is `:439` | none — the flag *definitions* are source code; the override layer the admin console edits is this map |

**Rows 19-30 (measured 2026-10-13, TSK-20).** The first 18 rows came from CA-12's release-critical
list. The twelve added here were found by asking the opposite question: which entity types the
**register** documents a screen for have *no* Prisma model and *no* accessor anywhere in `src/`:

```bash
# 0 references each in prisma/schema.prisma and src/core/database/repositories/
for t in PitchSubmission SlateProject CatalogueTitle DistributionLicense RoyaltyStatement HubLocation \
  HubResource HubMember ResourceBooking ProductionAsset ProductionBooking DailyCallSheet VtmContract \
  TalentRateCard OpportunityBrief KnowledgeDocument; do
  printf "%-22s %s\n" "$t" "$(grep -rn "$t" prisma/schema.prisma src/core/database/repositories/ | wc -l | tr -d ' ')"
done
# → 0 for all 16
```

None of these engines has a `hydrate*` export, and each is constructed with `new` inside
`createServer` (`api/server.ts:165-167`, `:254-263`), so the table's opening claim holds for them
without qualification: the store named is the only copy.

**Three tables have no runtime counterpart of any kind**, not even a memory store:
`Organisation` (interface `core/domain/types.ts:49`, referenced only as `organisationId` columns),
`CreatorProfile` (interface `core/domain/types.ts:76`, no other mention in `src/`), and
`Evidence` (only `EvidenceType` at `core/domain/types.ts:21` and projection view models in
`web/workspace/*`). A screen labelled "Evidence & Authority Vault" therefore renders other
entities' fields, not an `Evidence` ledger.

---

## 4. Conditional durability — what depends on the environment

Three paths are honest about being conditional, and each has a measurable signal. Do not describe
any of them as durable without checking the signal.

1. **Audit log** (`core/audit/index.ts:185-247`). The in-memory chain is appended and the hash tail
   persisted synchronously, and since TSK-18 the row is **staged, not fired away**: `recordAuditLog`
   calls `stageDurableWrite` (`:220`), whose persister is
   `core/database/repositories/release-critical.repository.ts:1050` `persistAuditLogEntry`. Every
   HTTP request runs inside one journal group (`api/server.ts:586` `serveRequestInJournalGroup`,
   opened at `:303`), and the group drains before the first byte of the response
   (`api/router.ts:580` in `sendJson`, and the same gate in `sendText` `:619` / `sendHtml` `:656`),
   so the ledger row and the request's business rows commit in **one** `prisma.$transaction`.
   Consequences, both measured: a 200 response **does** prove the audit row landed, and the converse
   is the cost — with no reachable database a mutating request now answers 503
   `REPOSITORY_UNAVAILABLE` instead of 200 (`fail_closed`), and a rolled-back ledger entry is
   counted by `getAuditHealth().durableFailures` (`core/audit/index.ts:97`), which drives the
   CRITICAL `AUDIT_DURABLE_PERSISTENCE_DEGRADED` alert rule
   (`core/observability/index.ts:223`). `getAuditPersistenceMode()` is still the queryable truth,
   and `getAuditLogs` reads Postgres first with a labelled local fallback (`:320`, `:378`).
   Chain tail is restored from the KV adapter at boot (`:75`, `api/server.ts:140`) — so with no
   Redis the tail is the local process's own, and the chain is verified in-process only.
2. **DSR ledger** (`api/routes/privacy.routes.ts:70-88`). Durable-first: `status: "RECEIVED"` only
   when the row was created, `RECORD_ONLY` when it was not, with the message saying the request will
   not survive a restart. This is the pattern the rest of `M` should follow (TSK-17).
3. **Sessions / revocations / idempotency / rate limits** — mirrored to the KV adapter only if
   `REDIS_URL` is set *and* a client factory is registered (`core/cache/index.ts:179`);
   `api/server.ts:133` wires the adapter into sessions. Since TSK-17 the session registry and the
   revocation set are **durable first**: `SessionRecord` rows are hydrated at boot
   (`core/auth/sessions.ts:70`) and `revokeSessionById` (`core/auth/sessions.ts:150`) /
   `markTokenIdRevoked` (`core/auth/sessions.ts:184`) write through the journal, so a revocation
   outlives the process that issued it even with no Redis. The remaining asymmetry:
   `listSessions` (`core/auth/sessions.ts:114`) reads only the hydrated local map, and
   `isTokenIdRevokedAsync` (`core/auth/sessions.ts:199`) still prefers the KV value when Redis is
   configured, so cross-process revocation is KV-fast-path with the table as the durable floor.

**Repository mode** (`core/database/repository-mode.ts:18,:21`) is the related switch: default
`fail_closed` raises `RepositoryUnavailableError` on a Prisma failure; `ALLOW_SANDBOX_FALLBACK=true`
selects `memory_fallback`. Boot refuses the fallback in production/staging (`api/server.ts:81-94`).
The repositories' own class-field maps (3 in `schedule.repository.ts`, 2 each in
`invoice.repository.ts`, 1 each in `campaign`/`rights`/`talent`) are that fallback, not a cache in
front of a working write.

---

## 5. The finding, stated plainly

- **The declared data model is ahead of the implemented one.** 43 tables, 30 models with accessors,
  26 written at runtime. 13 tables are still dead weight in every deployment today.
- **The broadcast core is the inverse of the finance core.** The entities that the PRD treats as
  release-critical — the schedule day, versions, proof of air, review requests — are all `M`, while
  invoices, settlements, campaigns, talent profiles and rights records are `D1`. The clearance
  *record* is durable and the clearance *decision* (schedule state) is not; a restart loses the
  approved day but keeps the rights window that justified it.
- **Restart-safety is not visible on any screen.** Every `M` surface renders identically to a `D1`
  surface, which is exactly the failure mode rule 0.4a was written for.
- **TSK-17 closed the durability half for the release-critical domains CA-12 named** — enquiry
  intake, approvals, restricted cases, risks/issues, destinations, the DAM registry, sessions,
  idempotency keys, the CMS revision chain, the seven-way journal and sponsor bindings/fulfilments
  are now written to tables and re-read at boot, each verified by a second OS process
  (`find tests -name 'durability*' | wc -l` → **1**). **TSK-60 (2026-10-11) added the client-portal
  deal portfolio** to that list. What is still `M`: the schedule day, broadcast
  versions, proof of air, rights review requests, users/credentials/lockout/rate limits, MFA secrets,
  invitations, admissions, the AFCA catalogue, events, payouts, bank statements, talent-hub
  profiles, the queue and AOS agent runs — plus, since the 2026-10-13 sweep, the counterparty
  creative desks the register calls IMPLEMENTED: VCF pitches, the VTM book (contracts and milestone
  escrow included), the TEND catalogue, community-hub members and bookings, OneStudios call sheets,
  the HeadSpace library, Cr8Tech jobs, broadcast billing and traffic, notification preferences,
  first-use profiles, the in-app inbox and runtime feature-flag overrides. **TSK-20 labels these on
  the screens themselves** (`sandboxState` in `docs/decisions/screen-register.json`, §3.3 parity in
  `docs/audit/journey-readiness-matrix.md`); labelling is not durability, and durability stays
  TSK-17's unfinished half for these domains.
- **Open work this document feeds:** TSK-11 (the 33 operational screens that reach no engine), TSK-06 (migrations deployable from a
  clean database — unverified, so "the tables exist" is a statement about the SQL in
  `prisma/migrations/`, not about a provisioned instance).

---

## 6. Re-measure commands

**Enforced, not just printed:** `tests/unit/systems-of-record.test.ts` (9 tests, inside `pnpm test`,
therefore CI) recomputes §2's accessor counts from `src/`, checks that the grouped "zero accessors"
row names exactly the models with no accessor, opens every `` `file.ts:NN` `` citation in this
document — including `:NN,:MM` continuations — and requires each cited line to carry the symbol
printed beside it. Since TSK-20 it also holds the two copies of §3.3 to parity — the `sandboxState`
block in `docs/decisions/screen-register.json` and the family table in
`docs/audit/journey-readiness-matrix.md` — and fails on a screen label its evidence cannot anchor, on
an anchor that resolves to no file/line/symbol, and on a Persistence cell that talks about process
memory without saying `sandbox-state`. A figure in this file that stops being true fails the suite.

Each block below is the exact command used on 2026-10-11, with the output it produced.

```bash
# 43 declared models
grep -c "^model " prisma/schema.prisma
# → 43

# models with at least one Prisma accessor anywhere in src (multi-line aware) → 30 names
perl -0777 -ne 'while(/\b(?:prisma|client|db|tx|getPrismaClient\s*\(\s*\))\s*\.\s*([a-z][A-Za-z0-9_]*)\s*\.\s*(createMany|create|updateMany|update|upsert|deleteMany|delete|findMany|findFirst|findUnique|count|aggregate|groupBy)\b/g){print "$1\n"}' \
  $(find src -name '*.ts') | sort -u | tr '\n' ' '
# → afcaCourse approvalItem asRunLogRecord auditLog azeeboDestination broadcastChannel
#   broadcastEpisode commercialCampaign commercialEnquiry contentItemRecord contentRevisionRecord contract
#   dataSubjectRequest idempotencyRecord issueRecord journalEntryRecord mediaAssetRecord person
#   privacySecurityCase programme project providerEventClaim rightsRecord riskRecord
#   salesDealRecord sessionRecord settlement sponsorBindingRecord sponsorFulfillmentRecord talentProfile

# which files hold those accessors (seed-only models stand out)
grep -rln "prisma\.\(project\|person\|broadcastChannel\|afcaCourse\)\." --include='*.ts' src
# → src/db/migrate-and-seed.ts

# store counts: 40 module-level, 70 class-field
grep -rncE "^(export )?(const|let) [A-Za-z_0-9]+\??\s*(:[^=;]*)?=\s*new (Map|Set)" --include='*.ts' src | awk -F: '{s+=$2} END {print "module-level:",s}'
grep -rncE "^\s+(private|public|protected)?\s*(readonly )?[A-Za-z_0-9]+\??\s*(:[^=;]+)?=\s*new (Map|Set)" --include='*.ts' src | awk -F: '{s+=$2} END {print "class-field:",s}'

# per-entity restart durability suite (TSK-17)
find tests -name 'durability*' | wc -l
# → 1   (tests/unit/durability-release-critical.test.ts — 19 tests, each reading the record back
#        from a second OS process: node tests/helpers/durable-restart-reader.mjs <entity> <key>)
```

**Not verified by this document:** whether the migrations apply cleanly to an empty database
(TSK-06, `[B]`), anything about a production instance, and any figure that depends on an authorized
commit (TSK-09). Where this file says "durable" it means *the code writes to a table when the
database is reachable* — which is a statement about `src/`, not about an environment.
