# VMN Enterprise Evidence Register: S1 to S5 Progression Ladder

**Authority:** VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMNL-AZP-VMN-CCPP-001 §8 / File 1.txt §8  
**Audit Reference:** `VMNL-REPO-AUDIT-DEEPCHECK-001`  
**Current Evaluated Maturity Tier:** **Tier S2 (Internal Sandbox)**  
**Audited Date:** 2026-09-28  

---

## 1. The Five-Tier Production Evidence Ladder

Virtual Media Network Limited enforces continuous evidence progression from conceptual architecture to legally binding operational execution:

```
[Tier S1: Architecture & Assumptions] 
   └── Documented specifications, BRD/PRD R1.2A, ADR-001..012, Canonical Data Model. (VERIFIED)
[Tier S2: Internal Sandbox] 
   └── 140+ Automated unit and integration tests passing; 21 test suites; zero typecheck errors;
       domain invariants, 3-way reconciliation algorithms, and failure drills verified in code. (CURRENT ACTIVE TIER)
[Tier S3: Operational Staging] 
   └── Live staging deployment with Postgres container, playout integration,
       and multi-party operator rehearsal. (IN PROGRESS / TARGET)
[Tier S4: Independent Verification] 
   └── External security penetration audit, NDPR data privacy clearance, WCAG 2.2 AA automated Lighthouse/axe audits.
[Tier S5: Binding Audited Production] 
   └── Executed StarTimes carriage contracts with live RF uplink lock, binding bank MT940 statement sync,
       and external revenue audit sign-offs.
```

---

## 2. Evidence Register Ledger (Truthful S2 Sandbox Audit)

| Evidence ID | Domain / Capability | Target Tier | Current Evaluated Tier | Verification Artifact / Output | Status |
|---|---|---|---|---|---|
| `EVD-01-ARCH` | Architecture Authority | S1 | **S1** | `docs/adrs/` (12 ADRs with EAB approval), `CLAUDE.md` | **VERIFIED** |
| `EVD-02-CORE` | Canonical Data & Auth | S2 | **S2** | `tests/unit/domain.test.ts`, `tests/unit/auth.test.ts`, Prisma Schema | **VERIFIED (Sandbox)** |
| `EVD-03-RBAC` | Multi-Tenant PEP/PDP | S2 | **S2** | `tests/unit/rbac.test.ts` (10 enterprise roles + 17 R1.2A §48 broadcast roles) | **VERIFIED (Sandbox)** |
| `EVD-04-BCST` | Linear Broadcast Systems | S3 | **S2** | `tests/unit/broadcast.test.ts`, `src/modules/broadcast/playout/index.ts`, `src/modules/broadcast/export/index.ts` | **VERIFIED (Prototype)** |
| `EVD-05-DRIL` | 20 UAT Failure Drills | S3 | **S2** | `tests/unit/uat-broadcast-failure-drills.test.ts` (20/20 green) | **VERIFIED (Sandbox)** |
| `EVD-06-TLNT` | Talent & AFCA Academy | S2 | **S2** | `tests/unit/hub-talent.test.ts` (rubrics, certificates, rate cards) | **VERIFIED (Sandbox)** |
| `EVD-07-PROD` | VCF, ONE Studios, TEND | S2 | **S2** | `tests/unit/hub-production.test.ts` (waterfalls, avails, tickets) | **VERIFIED (Sandbox)** |
| `EVD-08-INTL` | HeadspaceNG, Cr8Tech, AOS | S2 | **S2** | `tests/unit/intelligence.test.ts` (kill switch, WebVTT, policy gates) | **VERIFIED (Sandbox)** |
| `EVD-09-FEDR` | Azeebo+ Federation L1-L4 | S3 | **S2** | `tests/unit/federation.test.ts` (circuit breaker, deep links, webhooks) | **VERIFIED (Sandbox)** |
| `EVD-10-A11Y` | Web Surfaces & Contrast | S4 | **S2** | `tests/unit/public-surfaces.test.ts` (semantic markup, 44px targets) | **VERIFIED (Prototype)** |
| `EVD-11-FINC` | 7-Way Finance & MT940 | S5 | **S2** | `tests/unit/reconciliation-mt940.test.ts`, `tests/unit/finance.test.ts` | **VERIFIED (Algorithmic Prototype)** |
| `EVD-12-GATE` | R1.2A §67 Release Gates | S4 | **S2** | `tests/unit/quality-gates.test.ts` (BG0–BG9 gates evaluator) | **VERIFIED (Sandbox S2 Cleared)** |

---

## 3. Truthful Maturity Attestation

The VMNL enterprise repository (`vmng`) is currently certified at **Tier S2 (Internal Sandbox)**.
- **What is verified:** 140+ automated tests across 21 test suites passing 100%; clean TypeScript compilation; all business invariants (7-way financial separation, rights window gates, 20/20 broadcast failure drills, 3-way reconciliation logic, MT940 SWIFT parsing) verified by automated execution in sandbox conditions.
- **What is provisional / pending operational staging (S3) and production (S5):**
  - StarTimes carriage channel assignments (Ch 428/430/432) and service PIDs are marked provisional pending final execution of StarTimes carriage contracts and NBC frequency allocations.
  - Playout automation relies on native standard playout engines (SMPTE-2067, BXF, Harris CSV, Grass Valley) pending live master control network deployment.
  - Live bank feeds and Paystack/Flutterwave production webhooks require operational deployment and live API secrets.
