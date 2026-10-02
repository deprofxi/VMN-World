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
   └── Documented specifications, BRD/PRD R1.2A, ADR-001..013, Canonical Data Model. (VERIFIED)
[Tier S2: Internal Sandbox] 
   └── 494 Automated unit, contract, security, a11y, and integration tests passing; 45 test files; zero typecheck errors;
   (Re-pinned 2026-10-02, TODO-DOC-05: previous pinned figures were 356/41 then 480/480; measured against the
   final-remediation working tree at candidate commit `ca303f0dea650ace92e8e0e0d331b0bbd9734ce2`
   plus its uncommitted remediation changes — `npx tsc --noEmit` clean. Remediation committed as
   `6bb519d5bd7908ff5216f5b78367ebca8b10db3e`; post-commit follow-ups (SCR-03 review-queue media
   visibility, content-editor picker wiring, golden-seed DAM backfill, EPG & channel-schedule
   episode-master surfacing) measure 494/494 across 45 files, zero skips (2026-10-02 full-suite
   re-run at default workers after host load recovered; an earlier confirming run was sharded at
   `--maxWorkers=2` while the host was under external load). Re-measure at the next commit
   boundary to keep this pin truthful.)
       225 system screens; domain invariants, 3-way reconciliation algorithms, and failure drills verified in code. (CURRENT ACTIVE TIER)
[Tier S3: Operational Staging] 
   └── Live staging deployment with Postgres container, playout integration,
       and multi-party operator rehearsal. (IN PROGRESS / TARGET)
[Tier S4: Independent Verification] 
   └── External security penetration audit, NDPR data privacy clearance, WCAG 2.2 AA automated axe audits.
[Tier S5: Binding Audited Production] 
   └── Executed StarTimes carriage contracts with live RF uplink lock, binding bank MT940 statement sync,
       and external revenue audit sign-offs.
```

---

## 2. Evidence Register Ledger (Truthful S2 Sandbox Audit)

| Evidence ID | Domain / Capability | Target Tier | Current Evaluated Tier | Verification Artifact / Output | Status |
|---|---|---|---|---|---|
| `EVD-01-ARCH` | Architecture Authority | S1 | **S1** | `docs/adrs/` (13 ADRs including ADR-013), `CLAUDE.md`, `release-manifest.json` | **VERIFIED** |
| `EVD-02-CORE` | Canonical Data & Auth | S2 | **S2** | `tests/unit/domain.test.ts`, `tests/unit/auth.test.ts`, Prisma Schema, `tests/unit/security-auth-rbac.test.ts` | **VERIFIED (Sandbox)** |
| `EVD-03-RBAC` | Multi-Tenant PEP/PDP | S2 | **S2** | `tests/unit/rbac.test.ts` (10 enterprise roles + 19 §48 broadcast roles incl. MCRSupervisor & Operator) | **VERIFIED (Sandbox)** |
| `EVD-04-BCST` | Linear Broadcast Systems | S3 | **S2** | `tests/unit/broadcast.test.ts`, `src/modules/broadcast/playout/index.ts`, `src/modules/broadcast/export/index.ts` | **VERIFIED (Prototype)** |
| `EVD-05-DRIL` | 20 UAT Failure Drills | S3 | **S2** | `tests/unit/uat-broadcast-failure-drills.test.ts` (20/20 green) | **VERIFIED (Sandbox)** |
| `EVD-06-TLNT` | Talent & AFCA Academy | S2 | **S2** | `tests/unit/hub-talent.test.ts` (rubrics, certificates, rate cards, public verification `/verify/afca/:id`) | **VERIFIED (Sandbox)** |
| `EVD-07-PROD` | VCF, ONE Studios, TEND | S2 | **S2** | `tests/unit/hub-production.test.ts` (waterfalls, avails, tickets, POA `/verify/poa/:id`) | **VERIFIED (Sandbox)** |
| `EVD-08-INTL` | HeadspaceNG, Cr8Tech, AOS | S2 | **S2** | `tests/unit/intelligence.test.ts` (kill switch, WebVTT, policy gates) | **VERIFIED (Sandbox)** |
| `EVD-09-FEDR` | Azeebo+ Federation L1-L4 | S3 | **S2** | `tests/unit/federation.test.ts` (circuit breaker, deep links, webhooks) | **VERIFIED (Sandbox)** |
| `EVD-10-A11Y` | Web Surfaces & Contrast | S4 | **S2** | `tests/a11y/accessibility-audit.test.ts`, `tests/unit/public-surfaces.test.ts` (WCAG 2.2 AA compliant tokens, 44px targets) | **VERIFIED (Sandbox)** |
| `EVD-11-FINC` | 7-Way Finance & MT940 | S5 | **S2** | `tests/unit/reconciliation-mt940.test.ts`, `tests/unit/finance.test.ts`, `BankReconciliationEngine` replay safety | **VERIFIED (Algorithmic Prototype)** |
| `EVD-12-GATE` | R1.2A §67 Release Gates | S4 | **S2** | `tests/unit/quality-gates.test.ts`, `release-manifest.json` (BG0–BG9 gates evaluator, BG6: NOT_TESTED, GO_WITH_CONDITIONS) | **VERIFIED (Sandbox S2 Cleared)** |
| `EVD-13-REPO` | Repositories & Invariants | S2 | **S2** | `src/core/database/repositories/*.ts`, `tests/unit/production-core-and-infrastructure.test.ts` (Database-authoritative, DB/MEMORY flag) | **VERIFIED (Library/Sandbox)** |
| `EVD-14-QUEU` | Background Queue Worker | S2 | **S2** | `src/core/queue/index.ts`, `src/api/server.ts` (EPG, notifications, webhooks, reconciliation handlers) | **VERIFIED (Sandbox)** |
| `EVD-15-AUDT` | Cryptographic Audit Chain | S2 | **S2** | `src/core/audit/index.ts`, `tests/unit/audit.test.ts` (SHA-256 hash chaining, out-of-band tamper detection) | **VERIFIED (Sandbox)** |
| `EVD-16-NOTF` | Multi-Provider Notification | S2 | **S2** | `src/core/notifications/index.ts`, `tests/unit/production-core-and-infrastructure.test.ts` (SMTP/SES, Termii, sandbox isolation) | **VERIFIED (Sandbox)** |
| `EVD-17-BCST-SCR` | 33 Operational Screens | S3 | **S2** | `src/web/broadcast/index.ts`, `tests/unit/broadcast-screens.test.ts` (All 33 SCR-BCST routes with RBAC enforcement) | **VERIFIED (Sandbox)** |
| `EVD-18-CNTR` | OpenAPI Spec & Abuse Tests | S4 | **S2** | `tests/contract/openapi-contract.test.ts`, `tests/security/abuse-and-fuzzing.test.ts` (OpenAPI 3.1.0 schema, fuzzing, tamper verification) | **VERIFIED (Sandbox)** |
| `EVD-19-OTEL` | Observability & OTEL Export | S3 | **S2** | `src/core/observability/index.ts`, `tests/unit/observability.test.ts` (OTLP/HTTP metrics exporter, webhook alert dispatch adapter) | **VERIFIED (Sandbox)** |
| `EVD-20-SECD` | Dependency Triage & CVEs | S4 | **S2** | `docs/audit/dependency-triage.md`, `package.json` (`audit:check` script) | **VERIFIED** |
| `EVD-21-WORKSPACES` | Extended Workspaces & Desks | S2 | **S2** | `src/web/workspace/*.ts`, `tests/unit/extended-workspaces.test.ts` (28 tests: Proposal Builder, Term Sheets, LMS Rubrics, Video Submissions, Gear Locker, Call Sheets, AOS Killswitch) | **VERIFIED (Sandbox)** |
| `EVD-22-SCREENS` | 225 Screen Unified Surface Matrix | S2 | **S2** | `src/web/public/screens-view.ts`, `tests/unit/broadcast-screens.test.ts`, `tests/unit/prototypes-and-shells.test.ts`, `tests/unit/extended-workspaces.test.ts` (All 225 canonical screen IDs active and mounted) | **VERIFIED (Sandbox)** |
| `EVD-23-DESIGN-TOKEN` | Zero-Emoji & WCAG Token Discipline | S4 | **S2** | `tests/unit/token-discipline.test.ts`, `tests/unit/tokens-contrast.test.ts`, `tests/unit/styleguide.test.ts` (Zero raw OS emojis, strictly SVG icons, 4.5:1 text contrast) | **VERIFIED (Sandbox)** |
| `EVD-24-ADMISSIONS` | AFCA Multi-Step Intake Flow | S2 | **S2** | `src/modules/hub/afca/admissions.ts`, `src/web/public/admissions.ts`, `tests/unit/admissions.test.ts` (Multi-step validation, portfolio submission, audit trails) | **VERIFIED (Sandbox)** |

---

## 3. Truthful Maturity Attestation

The VMNL enterprise repository (`vmng`) is currently certified at **Tier S2 (Internal Sandbox)**.
- **What is verified:** 480 automated tests across 45 test files passing 100% (re-pinned 2026-10-01 at candidate commit `ca303f0` + uncommitted remediation changes); clean TypeScript compilation (`tsc --noEmit`); ESLint with zero errors (pre-existing unused-parameter warnings excepted); all business invariants (7-way financial separation, rights window gates, broadcast failure drills including the 13 new journey drills, 3-way reconciliation logic, MT940 SWIFT parsing, 33 operational broadcast screens, the 60-entry screen register at 55 IMPLEMENTED / 4 MOCK / 1 ALIAS, HMAC webhook validation, idempotent mutations, and tamper-evident audit ledger) verified by automated execution in sandbox conditions.
- **What is provisional / pending operational staging (S3) and production (S5):**
  - StarTimes carriage channel assignments (Ch 428/430/432) and service PIDs are marked provisional (`BG6_CARRIAGE: "NOT_TESTED"`) pending final execution of StarTimes carriage contracts and NBC frequency allocations.
  - Playout automation relies on native standard playout engines (SMPTE-2067, BXF, Harris CSV, Grass Valley) pending live master control network deployment.
  - Live bank feeds and Paystack/Flutterwave production webhooks require operational deployment and live API secrets.
