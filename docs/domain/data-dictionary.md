# Data dictionary as implemented

**Measure date:** 2026-10-08 (`ce098f8` + dirty set, committed 2026-10-15 by TSK-09).
**Scope:** the *vocabulary* the repository actually uses — enumerations, money, time, identifiers and
machine-readable codes — measured from `prisma/schema.prisma` and `src/**/*.ts`.

**Companion documents:** `docs/domain/canonical-model.md` (which declared model the code touches, and
which documented invariant is unenforced), `docs/domain/systems-of-record.md` (which store holds each
entity), `docs/domain/state-machines.md` (how those vocabularies are *transitioned*). This file records
the vocabularies themselves; transition rules are deliberately not repeated here.

`docs/domain/master-data-model.md` is the *intended* dictionary and remains authoritative for intent.
Where the two disagree, this file reports the measured state and the disagreement is registered in
`docs/domain/canonical-model.md` §4/§6 rather than resolved by editing the authority document.

Everything below is machine-checked by `tests/unit/canonical-model.test.ts`, which recomputes each
table from the schema and `src/` and fails CI on drift, including the enum-mirror identity check in §2
and every `file:line` citation in this file and in `canonical-model.md`.

---

## 1. Five vocabularies, not one

| Layer | What it is | Count | Command (§7) |
|:---|:---|--:|:---|
| Prisma `enum` | Database-enforced member sets | **10 enums / 44 members / 12 fields** | `grep -c "^enum " prisma/schema.prisma` |
| TypeScript string unions | The vocabulary the running code type-checks against | **48 distinct state-shaped union names / 224 members** | §7 |
| Bare `String` columns with an uppercase default | State carried with no enumeration at all | **11 columns** | §7 |
| `code:` response literals | Machine-readable codes returned to clients | **113 distinct** | §7 |
| Bracketed traceability tags `[FAMILY-CODE-nn]` | Register/audit identifiers embedded in code and messages | **184 distinct across 24 families** (194 occurrences) | §7 |

Only 12 of the schema's fields are enum-typed while 11 state-shaped fields are plain `String`: the
database enumerates less than the application does, and the application's real state machine is the
TypeScript union layer — which is exactly why `docs/domain/state-machines.md` had to be written from
code rather than from the schema.

---

## 2. Prisma enums and their TypeScript mirrors

All ten enums are mirrored **verbatim** as exported string unions in `src/core/domain/types.ts`
(`KycStatus:6` through `AgentStatus:22`, a contiguous block) — see §7 for the re-measure. The mirror is
the mechanism by which application code can use the same literals without importing Prisma client
types, and it is a drift risk: nothing in Prisma forces the two to stay equal. The instrument therefore
asserts set equality per enum, and all ten currently pass:

| Enum | Members | Member set | Mirror identical? | Reachable from application code? |
|:---|--:|:---|:--|:---|
| `KycStatus` | 4 | `PENDING`, `IN_REVIEW`, `VERIFIED`, `REJECTED` | yes | yes — `TalentProfile.verificationStatus` |
| `UserStatus` | 3 | `ACTIVE`, `SUSPENDED`, `DEACTIVATED` | yes | **no** — `User` has no accessor; login state lives in `src/core/auth/index.ts:456` `userStore` |
| `OrgType` | 6 | `CORPORATE`, `BROADCAST_PARTNER`, `PRODUCTION_HOUSE`, `ACADEMY_PARTNER`, `SPONSOR`, `ADVERTISER` | yes | **no** — `Organisation` has no accessor |
| `TalentTier` | 4 | `EMERGING`, `VERIFIED`, `PROFESSIONAL`, `MASTER` | yes | yes |
| `ProjectStatus` | 5 | `PROPOSED`, `APPROVED`, `IN_PRODUCTION`, `COMPLETED`, `ARCHIVED` | yes | seed only (`src/db/migrate-and-seed.ts:215`) |
| `ContractStatus` | 6 | `DRAFT`, `UNDER_REVIEW`, `APPROVED`, `SIGNED`, `EXPIRED`, `TERMINATED` | yes | seed + unwired repository — see `canonical-model.md` §4 (3.4) |
| `RightsType` | 4 | `BROADCAST_LINEAR`, `DIGITAL_STREAMING`, `SYNDICATION`, `DERIVATIVE` | yes | yes — compared at `src/modules/broadcast/rights/clearance.ts:63` |
| `SettlementStatus` | 4 | `PENDING`, `RECONCILED`, `DISPUTED`, `PAID` | yes | unwired repository — `canonical-model.md` §4 (1.4) |
| `EvidenceType` | 5 | `PROOF_OF_AIR`, `KYC_DOCUMENT`, `PAYMENT_RECEIPT`, `SIGNED_CONTRACT`, `AS_RUN_LOG` | yes | **no** — `Evidence` has no accessor |
| `AgentStatus` | 3 | `ACTIVE`, `PAUSED`, `TERMINATED` | yes | **no** for the table — runtime agent state is `src/modules/intelligence/aos/index.ts:67` `private agents = new Map…` |

Reachability is *derived* (model → accessor → code), not asserted per literal: member names collide
across enums (`ACTIVE` is both a `UserStatus` and an `AgentStatus`, `VERIFIED` both a `KycStatus` and a
`TalentTier`, `APPROVED` appears in `ProjectStatus`, `ContractStatus` and `RightsType`-adjacent
workflows), so a literal grep cannot answer "is this enum reachable". `canonical-model.md` §3 records
the same derivation for the model census.

---

## 3. State carried as bare `String`

Eleven columns default to an uppercase literal but declare no enum, so the database will accept any
string:

| Model | Column | Default | Notes |
|:---|:---|:---|:---|
| `TalentProfile` | `rateCardCurrency` (`prisma/schema.prisma:203`) | `"NGN"` | typed `string` in `src/core/domain/types.ts:69`; no `Currency` union exists anywhere in `src/` |
| `Project` | `currency` (`prisma/schema.prisma:233`) | `"NGN"` | only non-NGN value in the repository is the seed's `"USD"` (`src/db/migrate-and-seed.ts:233`) |
| `Contract` | `currency` (`prisma/schema.prisma:250`) | `"NGN"` | |
| `Settlement` | `currency` (`prisma/schema.prisma:298`) | `"NGN"` | |
| `TalentPayoutBatch` | `currency` (`prisma/schema.prisma:510`) | `"NGN"` | five currency columns, no enumeration, 28 `"NGN"` literals in `src/` |
| `EventTicket` | `status` (`prisma/schema.prisma:474`) | `"ISSUED"` | |
| `CommercialCampaign` | `status` (`prisma/schema.prisma:496`) | `"BOOKED"` | |
| `TalentPayoutBatch` | `status` (`prisma/schema.prisma:512`) | `"DRAFT"` | |
| `BankStatementRecord` | `reconciledStatus` (`prisma/schema.prisma:529`) | `"UNMATCHED"` | |
| `DataSubjectRequest` | `requestType` (`prisma/schema.prisma:544`) | `"EXPORT"` | |
| `DataSubjectRequest` | `status` (`prisma/schema.prisma:545`) | `"RECEIVED"` | the runtime handler keeps its own union for this field (`src/api/routes/privacy.routes.ts:20`), which is why `systems-of-record.md` §4 distinguishes `RECEIVED` from `RECORD_ONLY` |

Line pins re-measured 2026-10-12: TSK-18's `AuditLog` edit (`tenantId`, the `@@index` and the
comment that replaces the dropped FK) moved the schema by **−1 line above** `AuditLog`
(`prisma/schema.prisma:332`) and **+6 below** it, which is why the four rows before it read 203/233/250/298.

None of the six *state*-shaped ones (`ISSUED`, `BOOKED`, `DRAFT`, `UNMATCHED`, `EXPORT`, `RECEIVED`) is
enforced by a `CHECK` constraint, and `grep -c "^CREATE INDEX" prisma/migrations/0_init/migration.sql`
is **0**, so nothing in the initial schema constrains them at all.

---

## 4. Money

**The rule.** All financial arithmetic is performed on integer minor units, branded as `Kobo`
(`src/core/domain/types.ts:243`, comment at `:238-242`: "All financial arithmetic MUST be performed on
integer minor units to eliminate floating-point drift"). Six helpers, all in that file:

| Helper | Line | Contract |
|:---|--:|:---|
| `toKobo(majorUnits)` | `src/core/domain/types.ts:245` | `Math.round(major * 100)` — rounds, so a fractional input is coerced, not rejected |
| `isWholeKobo(value)` | `src/core/domain/types.ts:255` | `Number.isFinite && Number.isInteger` — the AUD-25 guard |
| `requireKoboExact(value)` | `src/core/domain/types.ts:265` | API-boundary normalizer; throws `[VMNL-MONEY-ERROR]` above 2dp |
| `fromKobo(minorUnits)` | `src/core/domain/types.ts:279` | `(minor / 100).toFixed(2)` → major units as `number` |
| `parseDecimalToKobo(decimalStr)` | `src/core/domain/types.ts:283` | string → kobo, comma-tolerant, truncates to 2dp |

**The storage side is major units.** Every money column is `Decimal @db.Decimal(14, 2)`: **23 such
columns** (`grep -cE '^\s+\w+\s+Decimal' prisma/schema.prisma`), of which 3 came from the TSK-17 durable
block — `financialScopeNgn` (`prisma/schema.prisma:601`), `totalDebitNgn` (`:805`) and
`totalCreditNgn` (`:800`) — and 5 more from TSK-60's `SalesDealRecord` (`:887`, `:892`, `:894`, `:895`,
`:896`). There are **zero** `Int`/`Float` money columns, so the only representation
in the database is major units at 2dp. The naming convention that signals the unit is a `Ngn` suffix:
**13 of the 23 columns carry it** (`tuitionNgn`, `pricePaidNgn`, `totalContractValueNgn` ×2 — the
`CommercialCampaign` column at `:489` and the new deal column at `:887`,
`totalAmountNgn`, `amountNgn`, the three TSK-17 columns above, and the four deal counters
`depositAmountNgn`, `invoicedAmountNgn`, `cashCollectedAmountNgn`, `recognizedRevenueNgn`) and **10 do not** (`budget`,
`contractValue` ×2, `gmvAmount`, `invoicedAmount`, `recognizedAmount`, `cashCollectedAmount`,
`talentPayableAmount`, `partnerShareAmount`, `rateCardAmount`). A `Kobo` value written straight into
one of those ten would be 100× too large, and nothing — no column name, no constraint, no runtime
assert — would notice. The TSK-17 split is deliberately the *other* way round: the ledger row's
`currency` column is written as `"NGN"` by the persister and hydration refuses any other value, so a
journal column's unit is stated twice (name + column) rather than assumed.

**How the wired path handles it.** The modules that do run convert on the way in and out rather than
storing minor units: `src/modules/finance/ledger/index.ts:77-78` accumulates `toKobo(line.debitNgn)` /
`toKobo(line.creditNgn)`, asserts the balance in kobo (`[LEDGER-02]` at `:84`), then writes majors back
with `fromKobo` (`:90-91`), and every snapshot pillar is updated as
`fromKobo(toKobo(x) + toKobo(y))` (`:102-120`). `src/modules/finance/reconciliation/mt940.ts` does the
same for parsed bank statements (`:87-88`, `:136`, `:144`, `:180-181`, `:199-206`). So the kobo discipline
is real **inside** the finance modules; the `*Ngn` fields are the wire format, and `Decimal(14,2)` is
the store.

**The canonical `Settlement` side is guarded at its only writer, not at the database.** The seven
mandatory separation columns are `Decimal(14,2)` majors (`prisma/schema.prisma:292-298`) and still have
no `CHECK` constraint. Since TSK-59 `validateSettlementInvariants` (`src/core/domain/types.ts:218`) is
called before every settlement write — `createSettlement` (`src/core/database/repositories/invoice.repository.ts:272`)
and both branches of `updateSettlementStatus` (`:384`, `:419`) — so a row whose cash exceeds its invoice,
or whose talent + rightsholder share exceeds its GMV (including at GMV 0, the waiver that half of the
rule used to carry), is refused before it reaches Postgres or the in-process index. What remains true is
the other half of the finding: `InvoiceRepository` (`:48`) is still instantiated by no production file,
so the guard protects a write path no request takes. Recorded in `canonical-model.md` §4 (1.4) and
registered as TSK-59.

---

## 5. Time

| Fact | Count | Source |
|:---|--:|:---|
| `DateTime` columns | **110** | `prisma/schema.prisma` |
| …with `@default(now())` | 26 | `grep -c "@default(now())" prisma/schema.prisma` |
| …with `@updatedAt` | 18 | `grep -c "@updatedAt" prisma/schema.prisma` |
| `new Date()` lines in `src/` | 258 | `grep -rn "new Date()" --include='*.ts' src/ \| wc -l` — re-measured 2026-10-17 (+1: the release gate's evidence-freshness policy needs a clock, `src/modules/quality/gates.ts`; 257 after PR-08's SigV4 AMZ date and 254 at the 2026-10-12 pin). The register's closed tasks move this number on every increment, so it is a measurement, not a constant |
| `.toISOString()` lines | 110 | §7 — re-measured 2026-10-17 (+2: the signed release manifest serialises `signedAt` and `evaluatedAt` so the signature covers the instants it attests, `src/modules/quality/artifact.ts`; 108 after PR-08's SigV4 date string, 107 at the 2026-10-12 pin) |
| `Date.now()` lines | 134 | §7 — re-measured 2026-10-16 (132 at the 2026-10-10 pin, +2: the readiness probe's cache TTL and its probe deadline) |

Counts are **matching lines**, the rule `grep -rn … | wc -l` applies, not total occurrences.

There is no clock abstraction: timestamps are taken from the process clock at 258 `new Date()` lines,
which is why
every lifecycle test in `tests/` that needs a window boundary injects explicit ISO dates into the
fixture rather than relying on wall time (`tests/unit/broadcast-schedule-lifecycle.test.ts`,
`tests/unit/broadcast-rights-gate.test.ts`). No column is `@db.Timestamptz`-annotated beyond Prisma's
default mapping, so a stored instant carries no zone; the code compensates by serialising ISO strings
with an explicit offset where a consumer parses them
(`src/modules/broadcast/export/epg.ts` writes `dateIso`, and the schedule day key is a date string, not
an instant).

---

## 6. Identifiers

| Fact | Measured state |
|:---|:---|
| Primary keys | **27 of the 43 models** declare `id String @id @default(uuid())`; the other 16 are the TSK-17 release-critical block, TSK-60's `SalesDealRecord` and TSK-19's `ProviderEventClaim`, which declare `id String @id` with **no database default** on purpose — the domain mints the id, so the durable row and the in-process read index address a record identically (`prisma/schema.prisma:572`). There is no composite or natural primary key anywhere, so no business code is forced to mint an id |
| Application-minted ids | 11 `randomUUID()` call sites across 7 files in `src/` |
| Prefixed ids | 4 template prefixes actually used: `` `usr-${…}` ``, `` `per-${…}` ``, `` `msg-${…}` ``, `` `rrr-${…}` ``. Identity is the clearest case — `src/core/auth/index.ts:632` mints `` personId: `per-${randomUUID()}` `` for a `Person` row that is never created (`canonical-model.md` §4, 1.1) |
| Literal business codes | 18 distinct `"XXX-YYYY"` literals in `src/` (e.g. `CHN-NXTR` `src/db/seeds/golden/index.ts:33`), i.e. code-like ids exist but are seeded, not generated |
| Channel codes | A single source of truth: `CANONICAL_CHANNELS` (`src/modules/broadcast/channels/index.ts:26`) defines exactly three — `NXTR` `:30`, `ORIS` `:50`, `IMBD` `:67`. The public site repeats the same three as its own union (`src/web/public/channels.ts:10`), so the vocabulary is consistent while the *declaration* is duplicated |
| Non-`id` natural keys | `@unique`/`@@unique` appears in **26 of 43** model blocks (§2 of `canonical-model.md` prints it per model); the 17 that have **no unique key at all** are `RightsRecord`, `Evidence`, `AuditLog`, `AsRunLogRecord`, `BankStatementRecord` and, from the TSK-17 block, `ApprovalItem`, `PrivacySecurityCase`, `RiskRecord`, `IssueRecord`, `AzeeboDestination`, `MediaAssetRecord`, `SessionRecord`, `IdempotencyRecord`, `ContentItemRecord`, `JournalEntryRecord`, `SponsorBindingRecord` and TSK-60's `SalesDealRecord` — their primary key *is* the application-minted domain id, so a second unique column would assert a constraint nothing owns. Which is what makes the rights registry's id-based resolution (`src/core/database/repositories/rights.repository.ts:123`) the only thing standing between duplicate windows and a cleared slot |

---

## 7. Codes: two conventions, and they do not overlap

**Bracketed traceability tags** — `[FAMILY-CODE-nn]`, the register/audit identifiers. In `src/`:
**184 distinct tags across 24 families, 194 occurrences.**

| Family | Distinct | Family | Distinct | Family | Distinct |
|:---|--:|:---|--:|:---|--:|
| `SCHED` | 39 | `ONE` | 9 | `TRAFFIC` | 3 |
| `AFCA` | 21 | `TEND` | 8 | `SPONSOR` | 3 |
| `TALENT` | 11 | `AOS` | 8 | `HSP` | 3 |
| `COMM` | 11 | `BIL` | 7 | `WHT` | 2 |
| `QTC` | 10 | `VCF` | 6 | `ROUTE` | 2 |
| `VTM` | 9 | `PAY` | 6 | `HUB` | 2 |
| `POA` | 5 | `EVT` | 5 | `CRM` | 2 |
|  |  | `MEDIA` | 5 | `AZP` | 2 |
|  |  | `VMNL` | 5 |  |  |

The numbering is **not dense and deliberately so.** `docs/domain/state-machines.md` §8 measures the
schedule family three ways and all three are reproducible: 48 distinct bare `SCHED-*` identifiers in
`src/modules/broadcast/versions/index.ts`, 39 of them appearing in bracket form there, and the
`[SCHED-VAL-05]` / `[SCHED-REC-03]` numbers absent because the transitions they would have numbered
were removed rather than renamed. A code identifies an implemented refusal, not a row in a spec table.

**Machine-readable API codes** — `UPPER_SNAKE` values returned as `code`. **117 distinct** in `src/`,
emitted as object literals (`code: "RIGHTS_NOT_CLEARED_AT_EXPORT"`
`src/modules/broadcast/export/epg.ts:96`, `code: "CANONICAL_CONTRACT_WORKFLOW_UNAVAILABLE"`
`src/api/router.ts:4185`, `code: "AUTH_TOKEN_REQUIRED"`). This set includes three values that are
channel codes rather than errors (`NXTR`, `ORIS`, `IMBD`, `src/web/public/channels.ts:10`) — the same
`code` field name is used for both, which is a naming collision worth knowing before a client tries to
branch on it.

*113 until 2026-10-17. The increment is the release gate's four evidence-finding codes —
`MISSING_EVIDENCE`, `UNRESOLVED_EVIDENCE_PATH`, `PROSE_ONLY_EVIDENCE`, `STALE_EVIDENCE`, all in
`src/modules/quality/gates.ts` — which are returned to the caller as part of the gate's answer rather
than written as log prose, so they belong in this set.*

**The two conventions do not intersect:** no bracketed tag is also a returned `code`, and no returned
code carries a bracketed register id. A message may cite both
(`[VMNL-MONEY-ERROR]` is thrown as prose at `src/core/domain/types.ts:267` and `:273`, never returned as
a structured `code`).

---

## 8. Re-measure commands

```bash
# §1 layer counts
grep -c "^enum " prisma/schema.prisma                                   # → 10
grep -c "^model " prisma/schema.prisma                                  # → 43
grep -cE '@default\("[A-Z][A-Z0-9]{2,}"\)' prisma/schema.prisma           # → 11
grep -rhoE '\[[A-Z]{2,12}-[A-Z0-9]{2,12}-[0-9]{2,4}\]' --include='*.ts' src/ \
  | tr -d '[]' | sort -u | wc -l                                          # → 184 (drop `sort -u` for occurrences → 194)
grep -rhoE '\[[A-Z]{2,12}-[A-Z0-9]{2,12}-[0-9]{2,4}\]' --include='*.ts' src/ \
  | tr -d '[]' | sed 's/-.*//' | sort -u | wc -l                          # → 24
grep -rhoE 'code:\s*"[A-Z][A-Z0-9_]{3,60}"' --include='*.ts' src/ \
  | grep -oE '"[A-Z][A-Z0-9_]+"' | tr -d '"' | sort -u | wc -l            # → 113

# §2 enum mirror identity (member sets equal per enum) — the test asserts this per enum, not as a count
grep -n "^enum " prisma/schema.prisma

# §4 money — anchored, because `SalesDealRecord`'s doc comment names `Decimal(14,2)` in prose and
# a plain `grep -c "Decimal"` would count it (→ 24)
grep -cE '^\s+\w+\s+Decimal' prisma/schema.prisma                         # → 23
grep -cE '^\s+\w*(Ngn|Kobo)\w*\s+(Int|Float)' prisma/schema.prisma        # → 0
grep -rhoE '\b[a-zA-Z_]\w*Ngn\b' --include='*.ts' src/ | sort -u | wc -l  # → 96

# §5 time / §6 identifiers
grep -cE '^\s+\w+\s+DateTime' prisma/schema.prisma                       # → 110
grep -c "@default(uuid())" prisma/schema.prisma                          # → 27
grep -rn "randomUUID()" --include='*.ts' src/ | wc -l                    # → 11

# §7 schedule family, three ways (see state-machines.md §8 for why all three are published)
grep -oE 'SCHED-[A-Z0-9]+-[0-9]+' src/modules/broadcast/versions/index.ts | sort -u | wc -l   # → 48
grep -oE '\[SCHED-[A-Z0-9]+-[0-9]+\]' src/modules/broadcast/versions/index.ts | sort -u | wc -l # → 39
grep -o "SCHED-[A-Z]*-[0-9]*\|SCHED-01" src/modules/broadcast/versions/index.ts | sort -u | wc -l # → 49
```

`tests/unit/canonical-model.test.ts` is the instrument: it recomputes the §1 counts, the §2
enum→model→accessor derivation **and the §2 mirror-identity check**, the §3 String-default table
(model, column, default), §4's helper line numbers and the 23/13/10 money-column split, §5's and §6's
counts, and §7's code censuses, then opens every citation in this file and in
`docs/domain/canonical-model.md`.

**Not claimed by this document:** that any enum-typed column is ever written by a running request
(§2 answers reachability, TSK-17 owns durability); that the unenumerated `String` states in §3 are
consistent across modules; that the `Kobo` discipline reaches the canonical `Settlement` columns (§4
records that it does not); or that a code published here is a stable API contract — `report.md` and the
evidence register pin code lists per release, and this file counts them.
