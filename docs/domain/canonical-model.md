# Canonical model as implemented

**Measure date:** 2026-10-11 (`ce098f8` + dirty set; no authorized commit exists yet — TSK-09).
**Reconciles:** `docs/domain/master-data-model.md` (`VMNL-AZP-VMN-CDDS-001 — R1.0`, the *intended*
model, which remains authoritative for intent and is not edited here) against
`prisma/schema.prisma` (43 models, 10 enums), `src/**/*.ts`, and `tests/`.

**Companion documents:** `docs/domain/systems-of-record.md` (which store actually holds each entity),
`docs/domain/state-machines.md` (how those entities change state). This file answers the remaining
question: *what does the declared model claim, and what does the code do about it.*

Everything below is machine-checked. `tests/unit/systems-of-record.test.ts` recomputes the accessor
census and opens every citation; `tests/unit/canonical-model.test.ts` recomputes the §2 table, the
§3 enum-reachability derivation and §1's headline counts from the schema and `src/`.

---

## 1. The divergence, in three numbers

| Count | Meaning | Command |
|--:|:---|:---|
| **43** | models declared in `prisma/schema.prisma`, each with a `CREATE TABLE` in `prisma/migrations/` | `grep -c "^model " prisma/schema.prisma` |
| **30** | models with at least one Prisma delegate accessor in `src/` — of which **26** are written by application code at runtime and 4 (`Person`, `Project`, `BroadcastChannel`, `AfcaCourse`) only by `src/db/migrate-and-seed.ts` | §6 of `systems-of-record.md` |
| **29** | models **not named anywhere in `master-data-model.md`** — the intended model predates the broadcast, hub, finance and (since TSK-17) durable-release-critical tables the code actually built, plus TSK-19's `ProviderEventClaim` and TSK-60's `SalesDealRecord` | `docs/domain/canonical-model.md` §2 table |

13 models have **no** accessor at all: `User`, `Role`, `Permission`, `Organisation`,
`CreatorProfile`, `Evidence`, `Agent`, `UserRole`, `FusionEvent`, `EventTicket`,
`TalentPayoutBatch`, `BankStatementRecord`, `RolePermission`. Of those, only
`RolePermission`, `FusionEvent`, `EventTicket`, `TalentPayoutBatch` and `BankStatementRecord` are
also absent from the intended model's page — the identity core the document does describe
(`User`, `Role`, `Permission`, `Organisation`, `CreatorProfile`, `Evidence`, `Agent`) is declared,
migrated, documented and **never touched by code**. The broadcast entities that are load-bearing for
shipped surfaces (`Programme`, `BroadcastEpisode`, `AsRunLogRecord`) are partly in the code and
**absent from the intended model's own page**. The document describes a CRM/identity core; the
repository grew a broadcast core plus the TSK-17 durable stores for the release-critical domains.
Neither half was reconciled to the other.

---

## 2. Model census

Counting rule for "fields": lines inside the model block declaring a scalar of type `String`, `Int`,
`Float`, `Decimal`, `Boolean`, `DateTime`, `Json` or one of the 10 enums. Relation lines, `@@`
attributes, comments and blanks are excluded. `uniq` counts `@unique` + `@@unique` occurrences;
`idx` counts `@@index`. `code` = at least one Prisma accessor in `src/` ("seed" = only
`src/db/migrate-and-seed.ts`). `in doc` = the model name appears in `master-data-model.md`.

| Model | fields | uniq | idx | code | in doc |
|:---|--:|:--|--:|:--|:--|
| `Person` | 9 | yes | 0 | seed | yes |
| `User` | 10 | yes | 0 | **no** | yes |
| `Role` | 5 | yes | 0 | **no** | yes |
| `Permission` | 4 | yes | 0 | **no** | yes |
| `RolePermission` | 3 | yes | 1 | **no** | **no** |
| `UserRole` | 6 | yes | 1 | **no** | yes |
| `Organisation` | 9 | yes | 0 | **no** | yes |
| `TalentProfile` | 12 | yes | 0 | **yes** | yes |
| `CreatorProfile` | 8 | yes | 0 | **no** | yes |
| `Project` | 12 | yes | 0 | seed | yes |
| `Contract` | 14 | yes | 0 | **yes** | yes |
| `RightsRecord` | 15 | **none** | 0 | **yes** | yes |
| `Settlement` | 15 | yes | 0 | **yes** | yes |
| `Evidence` | 9 | **none** | 0 | **no** | yes |
| `Agent` | 11 | yes | 0 | **no** | yes |
| `AuditLog` | 10 | **none** | 4 | **yes** | **no** |
| `BroadcastChannel` | 13 | yes | 0 | seed | **no** |
| `Programme` | 10 | yes | 1 | **yes** | **no** |
| `BroadcastEpisode` | 13 | yes | 2 | **yes** | **no** |
| `AsRunLogRecord` | 10 | **none** | 1 | **yes** | **no** |
| `AfcaCourse` | 11 | yes | 0 | seed | **no** |
| `FusionEvent` | 12 | yes | 1 | **no** | **no** |
| `EventTicket` | 11 | yes | 2 | **no** | **no** |
| `CommercialCampaign` | 11 | yes | 2 | **yes** | **no** |
| `TalentPayoutBatch` | 10 | yes | 1 | **no** | **no** |
| `BankStatementRecord` | 9 | **none** | 2 | **no** | **no** |
| `DataSubjectRequest` | 10 | yes | 2 | **yes** | **no** |
| `CommercialEnquiry` | 18 | yes | 2 | **yes** | **no** |
| `ApprovalItem` | 18 | **none** | 2 | **yes** | **no** |
| `PrivacySecurityCase` | 12 | **none** | 2 | **yes** | **no** |
| `RiskRecord` | 11 | **none** | 2 | **yes** | **no** |
| `IssueRecord` | 11 | **none** | 2 | **yes** | **no** |
| `AzeeboDestination` | 12 | **none** | 2 | **yes** | **no** |
| `MediaAssetRecord` | 13 | **none** | 2 | **yes** | **no** |
| `SessionRecord` | 8 | **none** | 2 | **yes** | **no** |
| `IdempotencyRecord` | 5 | **none** | 1 | **yes** | **no** |
| `ContentItemRecord` | 8 | **none** | 1 | **yes** | **no** |
| `ContentRevisionRecord` | 18 | yes | 2 | **yes** | **no** |
| `JournalEntryRecord` | 10 | **none** | 2 | **yes** | **no** |
| `SponsorBindingRecord` | 11 | **none** | 2 | **yes** | **no** |
| `SponsorFulfillmentRecord` | 10 | yes | 1 | **yes** | **no** |
| `ProviderEventClaim` | 6 | yes | 1 | **yes** | **no** |
| `SalesDealRecord` | 18 | **none** | 2 | **yes** | **no** |

**Notable:** `RightsRecord` — the release-critical entity the rights gate depends on — has **no
unique constraint**, so nothing at the database level prevents two records claiming the same
`assetId`/window; the gate resolves that by registry id, and
`src/core/database/repositories/rights.repository.ts:123` lists them with `findMany({ orderBy: { id:
"asc" } })` and no `where` clause. `Evidence`, `AuditLog`, `AsRunLogRecord` and
`BankStatementRecord` likewise declare no unique key. The 14 TSK-17 rows continue that deliberate
pattern: 11 of them declare **no** unique key because their primary key *is* the application-minted
domain id, and `SponsorFulfillmentRecord`/`ContentRevisionRecord` carry a composite `@@unique` rather
than a surrogate. TSK-60's `SalesDealRecord` joins the 11 — its `id` is the minted `SD-*` deal id, so a
second unique column would assert a constraint nothing owns — making **26 of 43** models with a unique
constraint and 17 without.

Index provenance: `grep -c "^CREATE INDEX" prisma/migrations/0_init/migration.sql` → **0**, i.e. all
44 `CREATE INDEX` statements come from the six later migrations:
`20261002140000_add_read_path_indexes` (9), `20261002150000_add_finance_event_indexes` (8),
`20261006120000_add_data_subject_requests` (2, which also created the table itself),
`20261008213000_add_release_critical_durable_stores` (17, with the 9 release-critical tables),
`20261008220000_add_remaining_release_critical_durable_stores` (8, with the CMS, ledger and
sponsorship tables) and
`20261013142927_add_composite_keyset_indexes` (2 DROP + 2 CREATE, replacing single-column
indexes on `Programme(channelCode)` and `BroadcastEpisode(programmeCode)` with composite
indexes `(channelCode, code)` and `(programmeCode, episodeCode)` respectively, measured in TSK-22).
`20261007191447_add_rights_record_channel_scope` adds a column, not an index.

---

## 3. Enum reachability, derived rather than asserted

Ten Prisma enums. Rather than grep each member literal (ambiguous: `"CORPORATE"` also exists as a
`BeneficiaryTaxType`, `"ACTIVE"` as a `CohortStatus`, and so on), reachability is **derived** from
two measured facts: which models reference the enum, and whether those models have any accessor in
`src/`. `tests/unit/canonical-model.test.ts` recomputes exactly this chain.

| Enum | members | referenced only by | reachable by application code? |
|:---|--:|:---|:---|
| `KycStatus` | 4 | `Person` (seed), `Organisation` (**none**), `TalentProfile` (**yes**) | yes, via `TalentProfile.verificationStatus` |
| `UserStatus` | 3 | `User` (**none**) | **no** — the status the login path checks lives in `src/core/auth/index.ts:456` `userStore`, a process Map; the `User` table is never read or written |
| `OrgType` | 6 | `Organisation` (**none**) | **no** — unreachable by construction |
| `TalentTier` | 4 | `TalentProfile` (**yes**) | yes |
| `ProjectStatus` | 5 | `Project` (seed only) | only `src/db/migrate-and-seed.ts:215` |
| `ContractStatus` | 6 | `Contract` (**yes**, but see §4) | seed writes `SIGNED` (`src/db/migrate-and-seed.ts:231`); the repository path exists but is unwired (§4) |
| `RightsType` | 4 | `RightsRecord` (**yes**) | yes — compared in `src/modules/broadcast/rights/clearance.ts:63-64` |
| `SettlementStatus` | 4 | `Settlement` (**yes**, unwired) | only through `InvoiceRepository`, which no production file instantiates (§4) |
| `EvidenceType` | 5 | `Evidence` (**none**) | **no** — unreachable by construction |
| `AgentStatus` | 3 | `Agent` (**none**) | **no** for the table; the enforced runtime agent lives in `src/modules/intelligence/aos/index.ts:67` `private agents = new Map…` — the kill-switch guard is real (`:135` `[AOS-EXEC-01]`, `:140` `[AOS-EXEC-02]`) but its state is process memory, not the `Agent` row |

---

## 4. `master-data-model.md` §1/§3, principle by principle

| # | Principle / invariant (as written) | Status | Evidence |
|:--|:---|:---|:---|
| 1.1 | One `Person` per human, linked to `User`, `TalentProfile`, `CreatorProfile` | **Partly modelled, not implemented.** The FKs and 1:1s exist (`prisma/schema.prisma:113` `User.personId @unique`, `:198` `TalentProfile.personId @unique`, `:215` `CreatorProfile.personId @unique`) and the schema even enforces `User.personId` uniqueness | Identity at runtime is `src/core/auth/index.ts:456` `userStore` (a Map), seeded from `VMNL_SEED_USERS_JSON` or the dev sandbox list (`:469` `seedDefaultUsers`), and its `personId` is **synthesised** (`:492`, `:552`, and `:632` `personId: \`per-${randomUUID()}\`` in `registerUser`) — no `Person` row, no `User` row is ever created. Only `TalentProfile` genuinely keys on a real `personId` (`src/core/database/repositories/talent.repository.ts:63`) against a `Person` row that exists only because the seed made it |
| 1.2 | Each `Organisation` defines a multi-tenant isolation scope (`tenantId`) | **Not enforceable as written.** `tenantId` is a column on exactly **3 of 43** models — `UserRole` `prisma/schema.prisma:170`, nullable), `Organisation` (`:188`) and, since TSK-17, `MediaAssetRecord` (`:695`, nullable) — and on none of `Contract`, `RightsRecord`, `Settlement`, `Project`, `Evidence` | The only real predicate is `src/core/rbac/index.ts:532-536` (deny unless `SuperAdmin` when `context.tenantId !== user.tenantId`), and **every external `canPerform` call omits the fourth argument**: `src/api/router.ts:769`, `src/api/router.ts:8093`, `src/api/routes/enquiry.routes.ts:25`, `:49` — so the predicate is unreachable from HTTP. Isolation that does exist is per-handler and ad hoc: `src/core/work/index.ts:116` (silent drop), `src/core/storage/index.ts:438-442` — where `:441` used to read `!a.tenantId || a.tenantId === params.tenantId` and so leaked every tenant-less ("unowned") row to every tenant; **TSK-58 box 2 closed that on 2026-10-12** and the branch is now `a.tenantId === params.tenantId`, which no tenant session can widen (positions re-pinned 2026-10-15; they read `:408-412`/`:411` before TSK-58 box 1's guard was inserted above them). `grep tenantId src/core/database/repositories/` → the TSK-17 media-asset block only (`core/database/repositories/release-critical.repository.ts:451`). Covered by unit tests of the predicate (`tests/unit/rbac.test.ts:61-70`) and of search scoping (`tests/unit/todo-remediation.test.ts:479`); storage scoping is now additionally covered **end-to-end through a route** with signed tenant sessions (`tests/unit/todo-final-remediation.test.ts:1236` unit, `:1327` route describe, `:1386`/`:1396`/`:1407` cases), and **TSK-58 box 1 closed on 2026-10-15** put the same rule on the write side: `[MEDIA-ASSET-07]` refuses a tenant registration that targets another tenant's `tenants/<id>/` namespace or re-posts a foreign key (`src/core/storage/index.ts:379-383`, `:389`, `:395`, answered 403 at `src/api/router.ts:8134`), and a CMS `mediaAssetId` belonging to another tenant is refused with the unknown-id message (`src/core/content/index.ts:33`) — asserted at the route in `tests/unit/tenant-scoping-routes.test.ts`. What remains unreachable is the **central predicate**: `src/core/rbac/index.ts:531-535` is still bypassed by every caller that omits `context`, which is box 3's owner decision. |
| 1.3 | Rights before exploitation | **Enforced, and it checks the window, not mere existence** | `src/modules/broadcast/rights/clearance.ts` codes `INVALID_RIGHTS_TYPE` `:68`, `MEDIA_TYPE_MISMATCH` `:78`, `TERRITORY_MISMATCH` `:93`, `CHANNEL_NOT_PERMITTED` `:103`, `SUBLICENSE_NOT_PERMITTED` `:113`, `PRE_START_DATE`, `POST_EXPIRY_DATE` (compares the *air end* against `expiryDate`), `EXCLUSIVE_WINDOW_CONFLICT`, `INACTIVE_RIGHTS`; `isRightsActive` throws on `expiryDate <= startDate` (`src/core/domain/types.ts:202-207`). Consulted at RIGHTS_CHECK, re-run at APPROVED and AMENDED, and again at export, where the refusal is `RIGHTS_NOT_CLEARED_AT_EXPORT` (`src/modules/broadcast/export/epg.ts:96`) — see `docs/domain/state-machines.md` §1.2 and `docs/domain/systems-of-record.md` §3.1. Tests: `tests/unit/broadcast-rights-gate.test.ts`, `tests/integration/rights-clearance-e2e.test.ts` |
| 1.4 | Mandatory 7-way financial separation on every `Settlement` | **Guarded at its only writer; the database still permits anything** | All seven columns are real (`prisma/schema.prisma:292-298`, with the `// Mandatory 7-Way Financial Separation` comment at `:291`) and still carry **no `CHECK` constraint**. TSK-59 wired the rule into the writer: `validateSettlementInvariants` (`src/core/domain/types.ts:218`) is now called before every settlement write — `createSettlement` (`src/core/database/repositories/invoice.repository.ts:272`) and both branches of `updateSettlementStatus` (`:384` durable, `:419` in-process) — and a refusal writes nothing (`[VMNL-SETTLEMENT-INVARIANT]`, asserted in `tests/unit/production-core-and-infrastructure.test.ts:241`). The waiver the rule used to carry (`&& gmvAmount > 0`, so a zero-GMV settlement silently owed talent and rightsholder money) is gone, with `tests/unit/domain.test.ts:120` pinning it. **Still open:** `InvoiceRepository` (`src/core/database/repositories/invoice.repository.ts:48`) is instantiated by no production file (barrel re-export `src/core/database/repositories/index.ts:10`; construction only in tests), so no route can reach the guard, and the governance desk that would display settlements renders an empty list (`src/api/router.ts:7357` `settlements: []`). Money that *is* wired still lives in a different, differently-named model: `src/modules/finance/sales/index.ts:54-55` `invoicedAmountNgn` / `cashCollectedAmountNgn` and the ledger pillars in `src/modules/finance/ledger/` |
| 1.5 | Immutable evidence graph (`Evidence` + SHA-256) | **Not implemented as a graph** | No `.evidence.` accessor exists anywhere in `src/`; the route that renders the vault returns a literal empty list (`src/api/router.ts:7358` `evidence: []`). Hashing exists in three unrelated forms: a genuine **chain** in the audit ledger (`computeEntryHash` `src/core/audit/index.ts:168`, SHA-256 `:169`, exported as `computeAuditEntryHash` `:139` over the nine-component `buildAuditHashPayload` `:154`, `previousHash` threading `:188`/`:201`, tail persisted through the KV adapter `:59`, restored at boot `:75`, verified by `verifyAuditLogChainIntegrity` `:275` — tests `tests/unit/audit.test.ts:44-56`, `tests/unit/audit-implementation-hardening.test.ts:110,:119-121`); **one-way digests** on media assets (`src/core/storage/index.ts:71`), VTM contracts, talent badges, AFCA certificates, AOS proposals; and proof-of-air certificates that are signed but carry no `previousHash` (`src/modules/broadcast/asrun/index.ts:115` registry, consumed by the ON AIR evidence gate at `src/modules/broadcast/versions/index.ts:705-719`). One gap in the chain worth naming — **closed by TSK-18 (TSK-58 box 4), 2026-10-12**: `tenantId` was on the in-memory entry but neither in the hashed payload nor the persisted row, so a durable audit row's hash could not be recomputed from its own columns. It now is the seventh of the nine hashed components (`src/core/audit/index.ts:154-165`, `:162`) **and** a nullable column (`prisma/schema.prisma:341`), and the exact bytes that were hashed are written verbatim into `changesJson.auditHashPayload` by `persistAuditLogEntry` (`src/core/database/repositories/release-critical.repository.ts:1050-1074`) — jsonb does not preserve key order, so the row keeps its own pre-image instead of a re-derivation rule. `sha256(auditHashPayload) === auditEntryHash` for a row read back from Postgres is asserted in `tests/unit/audit.test.ts:254-257` |
| 3.4 | A contract cannot become `SIGNED` without `signedDocumentUrl` and `signedAt` | **Not enforced** | `signedDocumentUrl` appears in `src/` only as a type field (`src/core/domain/types.ts:114`); `createContract` does not accept it (`src/core/database/repositories/invoice.repository.ts:73-84`), and the Prisma write passes the caller's status straight through (`:112` and `:125` `status: record.status`) with no transition guard. The seed demonstrates the gap: `src/db/migrate-and-seed.ts:231` writes `status: "SIGNED"` with no `signedAt` and no document. The nearest real controls enforce *other* rules — `src/modules/finance/sales/index.ts:133-153` dual-authorisation (`[QTC-AUTH-01]`, distinct signers, `stage = "CONTRACT_SIGNED"` with no document precondition) and `src/modules/hub/vtm/index.ts:259-276` two-party signing. What protects production today is a refusal, not an invariant: `src/api/router.ts:4154` returns `503 CANONICAL_CONTRACT_WORKFLOW_UNAVAILABLE` for the signing route, and that route is registered as handler-scoped in `tests/security/route-guard-parity.test.ts:127-128`. |

`tests/unit/production-core-and-infrastructure.test.ts:241` is titled "enforces 7-Way Financial
Separation in Contracts & Settlements" and asserts `:3.4` -adjacent behaviour; reading it, it asserts
only that values round-trip, and it persists a `SIGNED` contract with no `signedAt`. A test name that
promises a rule the assertions do not check is how an invariant stays unenforced while looking
covered, so it is recorded here rather than left as folklore.

---

## 5. What the code has that the intended model does not mention

`Programme`, `BroadcastEpisode`, `AsRunLogRecord`, `BroadcastChannel`, `CommercialCampaign`,
`AuditLog`, `AfcaCourse`, `DataSubjectRequest`, `FusionEvent`, `EventTicket`, `TalentPayoutBatch`,
`BankStatementRecord`, `RolePermission`, plus the 14 release-critical stores TSK-17 added
(`CommercialEnquiry`, `ApprovalItem`, `PrivacySecurityCase`, `RiskRecord`, `IssueRecord`,
`AzeeboDestination`, `MediaAssetRecord`, `SessionRecord`, `IdempotencyRecord`,
`ContentItemRecord`, `ContentRevisionRecord`, `JournalEntryRecord`, `SponsorBindingRecord`,
`SponsorFulfillmentRecord`), plus TSK-19's `ProviderEventClaim` (`prisma/schema.prisma:862`) and
TSK-60's `SalesDealRecord` (`prisma/schema.prisma:882`) — §2's
`in doc = no` column, **29 models** in total. **22** of them are
written by runtime code and are therefore load-bearing for surfaces that ship. They are modelled in
`docs/domain/state-machines.md` and `docs/domain/systems-of-record.md`, which exist because
`master-data-model.md` does not cover them.

**Thirty-one of the 43 declared models have no interface in the canonical domain file at all**
(`src/core/domain/types.ts` exports exactly 12 `*Entity` interfaces: `PersonEntity:24`,
`UserEntity:36`, `OrganisationEntity:49`, `TalentProfileEntity:61`, `CreatorProfileEntity:76`,
`ProjectEntity:87`, `ContractEntity:102`, `RightsRecordEntity:119`, `SettlementEntity:141`,
`EvidenceEntity:159`, `AgentEntity:171`, `AuditLogEntity:185`, plus the `Kobo` money brand at `:234`).
Thirty of those are `Role`, `Permission`, `RolePermission`, `UserRole`, `BroadcastChannel`,
`Programme`, `BroadcastEpisode`, `AsRunLogRecord`, `AfcaCourse`, `FusionEvent`, `EventTicket`,
`CommercialCampaign`, `TalentPayoutBatch`, `BankStatementRecord`, `DataSubjectRequest`, the 14
TSK-17 models listed above and TSK-19's `ProviderEventClaim`; TSK-60's `SalesDealRecord` is the
thirty-first. Three of them (`Role`, `Permission`, `UserRole`) **are** described by
`master-data-model.md`, so for the identity core the intended model and the code have no shared
vocabulary at all: authorization has its own runtime shape (`UserRecord`,
`src/core/auth/index.ts:441`), privacy has a second, local `DataSubjectRequest` interface
(`src/api/routes/privacy.routes.ts:20`) that is not the Prisma type, and the broadcast entities are
typed only by their module-local config/record interfaces. The TSK-17 stores follow the same
convention on purpose: their record types stay module-local (`EnquiryRecord`, `ApprovalItem`,
`ContentItem`, `JournalEntry`, `SponsorBinding`, …) and the durable block in
`src/core/database/repositories/release-critical.repository.ts` maps to them without introducing a
second vocabulary in the canonical file.

---

## 6. Consequences, and where they are already registered

| Gap in this file | Register item |
|:---|:---|
| Release-critical state is process memory, not a table — **closed for the 14 stores TSK-17 named** (enquiry, approvals, cases, risks, issues, destinations, media assets, sessions, idempotency, CMS revisions, journal, sponsor bindings/fulfilments); still open for the schedule day, broadcast versions, proof of air and rights review requests | TSK-17 (durability) |
| `MOCK_CLIENT_PROJECTS` stood in for the `Project` table — **closed 2026-10-09 (TSK-13)**: the fixture is deleted and the portal now projects `QuoteToCashSalesEngine` deals scoped by `clientOrgId`. The `Project` table still has zero accessors, and the deals live in the engine's Map, so what replaced the fixture is process memory rather than persistence — stated in `systems-of-record.md` §3.3 | TSK-13 (closed), durability half still TSK-17's `M` list |
| No per-entity durability coverage in `tests/` — **closed for those 14 stores** by `tests/unit/durability-release-critical.test.ts`, which reads each record back from a second OS process | TSK-17 |
| Tenant isolation unreachable from the route guard (new finding, §1.2) | **new** — registered as TSK-58 |
| `InvoiceRepository` unwired, so the newly enforced settlement guard sits on a write path no route reaches (TSK-59, §1.4 — **partially closed 2026-10-09**: `validateSettlementInvariants` is now called on every settlement write and the zero-GMV waiver is gone; the wiring/ownership half stays open) | **TSK-59 open** |
| Contract `SIGNED` invariant unenforced, signing route fail-closed at 503 (§3.4) | covered by TSK-17's durable write paths + the 503; recorded in §4 rather than double-counted |
| `Evidence` table never written while a vault screen exists (§1.5) | TSK-17 (evidence durability) and the screen register's honesty checks |

**Not claimed by this document:** that the migrations apply cleanly to an empty database (TSK-06,
`[B]`), that any tenant-isolation statement holds in a deployment, or that the untouched tables are
useless — several are the target state for open tasks (the `Agent`, `Evidence` and `User` rows are
exactly what TSK-17/TSK-35 would need to write to). A table that nothing reads is a *statement about
`src/`*, not about the business.
