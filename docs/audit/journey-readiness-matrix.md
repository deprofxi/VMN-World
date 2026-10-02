# Per-Journey Backend / Integration Readiness Matrix — TODO-PRC-01

**Document:** `VMNL-AZP-VMN-READINESS-001 — R1.0`
**Authority:** VMNL-AZP-VMN-UIUX-CCPP-001 §4.1 — each journey records
VERIFIED / IMPLEMENTED / BLOCKED / NOT_APPLICABLE per dimension.
**Reconciled:** 2026-09-30 against the working tree; evidence paths verified to exist.

Status legend (CCPP §4.1):
- **VERIFIED** — implemented and exercised by an executable test or drill.
- **IMPLEMENTED** — implemented; automated coverage exists but a CCPP §7 gate (drill, manual a11y, usability) is still open.
- **BLOCKED** — awaiting a human decision, contract, or external dependency (owner named).
- **NOT_APPLICABLE** — not part of this release's scope by decision record.

| Journey | Domain logic | API contract | Authorization | Persistence | Failure drill | Gate |
|---|---|---|---|---|---|---|
| J-RL1-01 Public discovery & enquiry | VERIFIED (`modules/hub/enquiry`, idempotency + durable outbox) | VERIFIED (`enquiry-failure-drill.test.ts`) | VERIFIED (rate limit, scope) | VERIFIED (enquiry store) | VERIFIED (drill) | **VERIFIED** |
| J-RL1-02 Identity: sign-in / MFA / invitations / sessions | VERIFIED (`core/auth/*`: bcrypt, RFC 6238 TOTP, invitation chain, registry revocation) | VERIFIED (`security-auth-rbac.test.ts`, `identity-and-rbac.test.ts`) | VERIFIED (RBAC matrix + route guards) | IMPLEMENTED (in-memory sandbox; Prisma User for prod; Redis adapter = TODO-SEC-10) | IMPLEMENTED (lockout + replay tests) | **IMPLEMENTED** |
| J-RL1-03 Access request / elevation | IMPLEMENTED (`/access-request` audit + RBAC) | IMPLEMENTED | VERIFIED (`route-authorization.test.ts`) | BLOCKED (elevation grants await IAM decision — owner: Head of Broadcast) | NOT_APPLICABLE | **IMPLEMENTED** |
| J-RL1-04 AFCA application journey | VERIFIED (`modules/hub/afca/admissions.ts`) | VERIFIED | VERIFIED | IMPLEMENTED (in-memory sandbox) | BLOCKED (drill suite open — TODO-PRC-03) | **IMPLEMENTED** |
| J-RL1-05 Learning / LMS | IMPLEMENTED (`afca-lms`, `AfcaAcademyService`) | IMPLEMENTED | VERIFIED | IMPLEMENTED | NOT_APPLICABLE | **IMPLEMENTED** |
| J-RL1-06 Creative hub desks (ACC/AFC/VTM/ONE/VCF/EVT/TEND) | BLOCKED (desks render labelled demo data; engines exist unwired — TODO-SCR-18) | BLOCKED (POSTs audit-intent only) | IMPLEMENTED | NOT_APPLICABLE (no canonical writes) | NOT_APPLICABLE | **BLOCKED** (owner: DEC-RL1-SCOPE-001 D-05) |
| J-RL1-07 Client counterparty portal | IMPLEMENTED (org isolation via `getClientOrgRelationship`) | IMPLEMENTED (questions ticket) | VERIFIED (`client-portal-and-operations.test.ts` incl. cross-org 403) | IMPLEMENTED | BLOCKED (drill open — TODO-PRC-03) | **IMPLEMENTED** |
| J-RL1-08 Schedule review (read-only) | VERIFIED (blocker explanations render from rights gate data) | VERIFIED | VERIFIED | VERIFIED | BLOCKED (drill open) | **IMPLEMENTED** |
| J-RL1-09 Rights review request | VERIFIED (`core/rights` lifecycle; never clears rights) | VERIFIED (`RW-*` ticket POST) | VERIFIED | IMPLEMENTED (in-memory) | BLOCKED (drill open) | **IMPLEMENTED** |
| J-RL1-10 POA exception resolution | IMPLEMENTED (audit-intent resolution; as-run engine VERIFIED) | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | BLOCKED (drill open) | **IMPLEMENTED** |
| J-RL1-11 Content publication | VERIFIED (`core/content` revision domain: approval invalidation, SOD, withdrawal consequences) | VERIFIED (`/api/v1/workspace/content*`) | VERIFIED (`content` RBAC resource derived) | IMPLEMENTED (in-memory) | BLOCKED (drill open) | **IMPLEMENTED** |
| J-RL1-12 Azeebo+ destination verification | VERIFIED (`core/federation/destinations`, https-only + HX-13 fallback) | VERIFIED | VERIFIED | IMPLEMENTED | BLOCKED (navigation drill open) | **IMPLEMENTED** |
| J-RL1-13 Enquiry routing configuration | VERIFIED (`setRoutingRule` audited) | VERIFIED | VERIFIED (update:audit role) | IMPLEMENTED | NOT_APPLICABLE | **IMPLEMENTED** |
| J-RL1-14 Four-eyes approvals | VERIFIED (`core/approvals`: authority recheck, stale revision, SOD, reason) | VERIFIED (`/api/v1/workspace/approvals*`) | VERIFIED (per-category authorized roles) | IMPLEMENTED | BLOCKED (drill open) | **IMPLEMENTED** |
| Broadcast BG0–BG9 operational desks | BLOCKED (33 screens carry labelled demonstration KPIs pending engine wiring — TODO-BCST-01) | IMPLEMENTED (validate/QC/reconcile APIs VERIFIED) | VERIFIED (screen RBAC 401/403) | BLOCKED (BG6 carriage data — owner: Carriage Platform Owner) | PARTIAL (`uat-broadcast-failure-drills`) | **BLOCKED** |
| Finance quote-to-cash | VERIFIED (delivery-gated recognition FIN-01, maker-checker FIN-02, MT940 FIN-05, ledger 7-way) | VERIFIED (`finance.test.ts`, `finance-minor-units.test.ts`) | VERIFIED (approve:finance guards) | IMPLEMENTED | BLOCKED (drill open) | **IMPLEMENTED** |
| Payment release / escrow disbursement | BLOCKED (implemented behind `FF_FINANCE_PAYMENT_RELEASE`; prod default OFF; final ruling pending — owner: Finance Controller, DEC-RL1-SCOPE-001 C-2) | IMPLEMENTED | VERIFIED | IMPLEMENTED | NOT_APPLICABLE (flag-blocked) | **BLOCKED** |

## Human decisions gating BLOCKED rows
| Decision | Owner | Record |
|---|---|---|
| RL1 scope acceptance (D-01..D-10) | Executive Sponsor | `docs/decisions/DEC-RL1-SCOPE-001.md` (PENDING_SIGNATURE) |
| Revenue-recognition ruling (FIN-01 C-2) | Finance Controller | PENDING — engine implements delivery-gated, contract-capped rule as defensible default |
| Rights override interpretation (GVR-04 C-1) | Legal / IP authority | PENDING — waiver wording replaced with review-request semantics |
| BG6 StarTimes carriage data (BCST-07) | Carriage Platform Owner | PENDING — channels remain PROVISIONAL |
