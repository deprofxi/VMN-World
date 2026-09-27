# VMNL Master Canonical Domain Data Model & Invariants

**Authority Reference:** `VMNL-AZP-VMN-CDDS-001 — R1.0`  
**Governing Master:** `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A` (§35, §36, §37)  
**Schema Implementation:** [`prisma/schema.prisma`](file:///Users/deprof/www/vmng/prisma/schema.prisma)

---

## 1. Domain Principles & Laws

1. **One Person → One Canonical Identity:** A physical human being possesses exactly one `Person` record in the VMNL ecosystem. That `Person` can link to:
   - A system `User` (with credentials and authentication).
   - A `TalentProfile` (for actors, directors, cinematographers, crew).
   - A `CreatorProfile` (for digital content creators with social metrics).
   - Direct contractual engagements across projects.
2. **Canonical Organisation:** Represents corporate clients, broadcast partners (e.g. StarTimes), production houses, and advertisers. Each organization defines a multi-tenant isolation scope (`tenantId`).
3. **Rights Before Exploitation:** A `RightsRecord` defines the legal exploitation boundaries (Medium, Territory, Start Date, Expiry Date, Exclusivity). Content cannot be scheduled or aired without an active rights record.
4. **Mandatory 7-Way Financial Separation:** In every commercial transaction, the `Settlement` record strictly segregates:
   - `contractValue`: Legal binding transaction value.
   - `gmvAmount`: Platform gross merchandise value.
   - `invoicedAmount`: Total billed to client.
   - `recognizedAmount`: Revenue earned against verified delivery.
   - `cashCollectedAmount`: Actual cash in bank.
   - `talentPayableAmount`: Amounts owed to cast/crew/creators.
   - `partnerShareAmount`: External partner royalty/revenue share.
5. **Immutable Evidence Graph:** The `Evidence` entity binds cryptographic checksums (SHA-256) to Proof-of-Air certificates, signed agreements, and audit trails.

---

## 2. Core Entities & Relationships

```
┌─────────────────┐        1:1       ┌──────────────────┐
│     Person      ├──────────────────┤       User       │
└────────┬────────┘                  └────────┬─────────┘
         │                                    │ 1:N
         ├───────────────┐ 1:1                ▼
         │ 1:1           ▼            ┌──────────────────┐
         │       ┌───────────────┐    │     UserRole     │
         ▼       │CreatorProfile │    └────────┬─────────┘
┌──────────────┐ └───────────────┘             │ N:1
│TalentProfile │                               ▼
└──────────────┘                      ┌──────────────────┐
                                      │       Role       │
                                      └────────┬─────────┘
                                               │ N:M
                                               ▼
                                      ┌──────────────────┐
                                      │    Permission    │
                                      └──────────────────┘

┌─────────────────┐        1:N       ┌──────────────────┐
│  Organisation   ├──────────────────┤     Project      │
└────────┬────────┘                  └──────────────────┘
         │ 1:N
         ▼
┌─────────────────┐        1:N       ┌──────────────────┐
│    Contract     ├──────────────────┤    Settlement    │
└─────────────────┘                  │ (7-Way Financial)│
                                     └──────────────────┘

┌─────────────────┐                  ┌──────────────────┐
│  RightsRecord   │                  │     Evidence     │
│ (Window/Terr.)  │                  │  (Cryptographic) │
└─────────────────┘                  └──────────────────┘
```

---

## 3. Invariants & Validation Rules

1. **Rights Invariant:** `RightsRecord.expiryDate > RightsRecord.startDate`. Any exploitation after `expiryDate` is hard-blocked.
2. **Settlement Invariant:** `cashCollectedAmount <= invoicedAmount`. `talentPayableAmount + partnerShareAmount <= gmvAmount`.
3. **Agent Invariant:** If `Agent.killSwitchEngaged == true` or `Agent.status != 'ACTIVE'`, all agent tool executions are rejected immediately.
4. **Contract Invariant:** A contract cannot be transitioned to `SIGNED` without a valid `signedDocumentUrl` and `signedAt` timestamp.
