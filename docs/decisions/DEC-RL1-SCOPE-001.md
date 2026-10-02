# DEC-RL1-SCOPE-001 — VMN-UX-RL1 Scope Allocation & Deferral Decision Record

**Document ID:** `DEC-RL1-SCOPE-001 — R1.0`
**Authority Required By:** `VMNL-AZP-VMN-UIUX-CCPP-001 — R1.1` §1.4 (Deferral authority)
**Parent Masters:** `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A` (§68), `VMNL-AZP-VMN-UIUX-001 — R1.1`
**Date Prepared:** 2026-09-30
**Prepared By:** Engineering Conformance Agent (Buffy / Freebuff)
**Status:** `PENDING_SIGNATURE` — prepared for accountable human acceptance. This record does not manufacture approval (CCPP §1.4: "The revision authorises preparation of this allocation. It does not manufacture missing business approval.")

---

## 1. Purpose

UIUX-CCPP-001 §1.4 requires a decision record identifying, for every partial or deferred capability of Release VMN-UX-RL1: the source BRD clause, what RL1 actually delivers, the remaining requirement, owners, dependencies, the next review point, and the authority accepting the allocation. The repository previously contained contradictory claims ("zero-deferral mandate" in `docs/handoffs/LATEST.md` vs. explicit deferrals in the governing UIUX-001 R1.1). This record supersedes both readings and establishes the authoritative allocation.

**Precedence rule (CCPP §6.1):** This decision, once signed, is a Level-3 "approved release-scope decision" and resolves the conflict. Until signed, the governing docx deferrals remain in force and `tasks.md`/`LATEST.md` claims of "225/225 screens operational / zero deferred dead-ends" must not be relied on for release decisions.

## 2. Allocation Values (per CCPP §1.1)

`INCLUDED` — intended in RL1 · `PARTIAL` — a defined portion included · `DELEGATED` — delivered via verified existing system · `DEFERRED` — required but outside RL1 · `BLOCKED` — intended, dependency unavailable.

## 3. Deferral & Partial Allocation Register

| # | Capability | Source BRD clause | RL1 delivers | Remaining requirement | Business owner | Delivery owner | Dependencies | Next review | Accepting authority |
|---|---|---|---|---|---|---|---|---|---|
| D-01 | Schedule writes / operational playlist exports | §15–16, §20 | Read-only schedule review (UX-BR-012) | Schedule authoring, approval, lock-out, playout export | Broadcast Director | Platform Engineering | Approved schedule source; MCR integration | 2026-12-01 | [PENDING] Executive Chairman |
| D-02 | Playout commands, live-source switching, transmission control | §20–21 | Playout status presentation + emergency-filler domain engine (no live control) | Live MCR machine interface | Broadcast Director | Broadcast Engineering | StarTimes carriage uplink (BG6) | 2026-12-01 | [PENDING] Executive Chairman |
| D-03 | Payment release, bank-detail changes, accounting policy | §42–44, §70 | 7-way ledger engines; maker-checker payout domain; no disbursement UI | Disbursement execution + Finance sign-off | Finance Director | Finance Engineering | Finance authority decision (see DEC condition C-2) | 2026-11-15 | [PENDING] Finance Director |
| D-04 | New rights grants / discretionary overrides | §45, §49, §62 | Rights review-request workflow only | Rights authoring + ruling on §62 override interpretation | General Counsel | Legal/IP Ops | Legal interpretation ruling (condition C-1) | 2026-11-15 | [PENDING] General Counsel |
| D-05 | Automated admissions / certification / consequential talent decisions | §27–28 | Multi-step application + staff queue with rubric scoring | Automated decisioning (remains human-only per R1.2A §58) | Academy Director | Hub Engineering | None (policy choice) | 2027-01-31 | [PENDING] Academy Director |
| D-06 | Full learning delivery & assessment (AFCA LMS depth) | §28 | Application journey + LMS/grading/certificate presentation shells | Live cohort delivery, attendance, full assessment ops | Academy Director | Hub Engineering | D-05 cohort configuration | 2027-01-31 | [PENDING] Academy Director |
| D-07 | Full creator/production/events/distribution operations | §31–34 | Presentation desks over existing engines (VCF/ONE/EVT/TEND); mock data flagged | Full operational workflows for each vertical | Chief Operating Officer | Hub Engineering | Per-vertical owner sign-off | 2026-12-15 | [PENDING] COO |
| D-08 | Azeebo+ identity federation (L3 SSO) | §40–41, §71 | Universal links + HMAC webhooks; inbound ingestion 501-gated | Federated identity exchange; partner contract | Chief Product Officer (Azeebo+) | Federation Engineering | Azeebo+ partner signature contract (condition C-3) | 2026-12-15 | [PENDING] CPO Azeebo+ |
| D-09 | Consequential agent automation | §58 | AOS HITL queue + kill switch; agents draft/recommend only | No expansion — permanent control | Principal Architect | AI Governance | None (governance invariant) | Annual | [PENDING] EAB |
| D-10 | Enterprise-wide executive reporting | §9, §54 | Management overview shells with provenance-marked mock data | Approved metric definitions + live sources | CFO | Data Engineering | Metric dictionary approval | 2026-12-15 | [PENDING] CFO |

## 4. Conditions Attached to this Decision

- **C-1 (Rights):** The BRD §62 conditional-override reference must be ruled upon by General Counsel before any waiver/override wording remains in production UI. The current "Expedited Rights Waiver" screen wording must either be re-labeled to review-request semantics or covered by the ruling.
- **C-2 (Finance):** FinanceController must ratify the revenue-recognition rule (delivery-obligation based, not cash-basis) implemented in `QuoteToCashSalesEngine` before any S3+ promotion.
- **C-3 (Azeebo+):** `AZEEBO_WEBHOOK_INGESTION_ENABLED` may only be set true after the partner signature contract is verified and recorded.
- **C-4 (No silent substitution):** Public pages must not imply deferred transactional services are live (CCPP §1.5). Mock-data surfaces must carry provenance notices (implemented via `renderProvenanceNotice`).

## 5. Acceptance Block [HUMAN DECISION REQUIRED]

| Field | Value |
|---|---|
| Decision accepted by | ______________________ |
| Role / authority | ______________________ |
| Date | ______________________ |
| Signature reference | `EAB-SIG-DEC-RL1-SCOPE-001-<YYYYMMDD>` |
| Allocations accepted (D-01…D-10) | ☐ All ☐ With amendments (attached) |
| Conditions accepted (C-1…C-4) | ☐ Yes |

> Per VMNL-AZP-VMN-CCPP-001 §1.4 and the repository constitution (`CLAUDE.md` agents/stop_conditions), no agent may complete this block. Until signed: RL1 remains scoped exactly as the governing docx deferrals define, and any "MVP complete" claim is prohibited.
