# VMNL Repository Deep-Check Report: Archive Documents vs. Actual Project Status

**Report Reference:** `VMNL-REPO-AUDIT-DEEPCHECK-001`
**Date of Audit:** 2026-09-28
**Scope:** Entire repository (`vmng`), with byte-level verification of `archive/raw_docs/` against the project's status documents (`tasks.md`, `docs/handoffs/LATEST.md`, `docs/audit/evidence-register.md`) and the governing authorities (`VMNL-AZP-VMN-BRD-PRD-001 — R1.2A`, `VMNL-AZP-VMN-CCPP-001 — R1.1`).
**Method:** MD5 checksum verification of all archived documents; exhaustive search of authority documents for cited requirements; execution of the full verification suite (`pnpm test`, `tsc --noEmit`, `pnpm build`); code-level inspection of every claimed deliverable path, module, and endpoint.

---

## 1. Executive Summary

The archive is byte-perfect and the engineering artifacts are real and reproducible — but the project status documents materially overstate maturity.

**Truthful position:** this is a well-tested **domain-logic prototype / specification-by-code** with genuine business-invariant coverage (115 passing tests, clean typecheck, clean build). It is **not** the "PRODUCTION-READY (ENTERPRISE S5 AUDIT GRADE)" system that `docs/handoffs/LATEST.md` declares.

Findings are classified:

| Category | Description | Count |
|---|---|---|
| **A** | Violations of the repository's own constitution (CLAUDE.md) | 4 |
| **B** | tasks.md / LATEST.md claims marked complete that the code does not fulfill | 19 |
| **C** | Document-vs-document inconsistencies | 5 |
| **D** | Minor issues | 5 |

---

## 2. What Checks Out (Independently Verified)

| Claim | Verification Result |
|---|---|
| Archive integrity — 12 files with MD5 register in `archive/raw_docs/README.md` | ✅ All 12 checksums match exactly (`legacy/` 7 × .txt, `docx/` 5 × .docx) |
| TASK-HYG-02 deduplication | ✅ Identical duplicates retained only inside the archive as mandated |
| 115/115 tests passing across 17 suites | ✅ Confirmed by execution (`vitest run`, 100% pass) |
| `tsc --noEmit` clean | ✅ 0 errors |
| `pnpm build` clean | ✅ Compiled successfully |
| 20/20 UAT failure drills, 28/28 E2E integration tests | ✅ Confirmed inside the passing suite |
| 12 ADR files in `/docs/adrs/`, 3 runbooks, forensic audit report, evidence register, `LATEST.md` | ✅ All present |
| 33-screen catalog (`/broadcast/screens`) + detail views (`/broadcast/screens/:id`) | ✅ Implemented and routed |
| OpenAPI 3.1.0 spec (`/api/v1/openapi.json`) + interactive `/docs` | ✅ Implemented |
| Operator CLI (`seed`, `gates:check`, `epg:export`, `screens:list`, `config:verify`) | ✅ Implemented |
| Golden dataset counts (3 channels / 50 programmes / 200 episodes / 14 schedule days / 10 campaigns / 10 as-run logs / 20 talent / 5 AFCA courses / 10 VCF slates / 5 TEND deals) | ✅ Match spec exactly |
| Docs tree per TASK-HYG-03 (`authorities/`, `adrs/`, `audit/`, `domain/`, `handoffs/`) | ✅ Present |

---

## 3. Category A — Violations of the Repository Constitution (CLAUDE.md)

### A-1. Hard-coded unverified StarTimes data 🔴
Channel numbers (NXTR **428 DTT / 312 DTH**, ORIS **430 / 315**, IMBD **432 / 318**), service PIDs (1042/1044/1046), and company registration "RC 642819" are hard-coded across `src/db/seeds/golden`, `src/modules/broadcast/channels`, `src/web/public/*`, `docs/runbooks/rollback-runbook.md`, and are **asserted in unit tests** (`tests/unit/broadcast.test.ts`, `tests/unit/public-surfaces.test.ts`).

**Violation:** CLAUDE.md `<broadcast>` law: *"Do not hard-code unverified: channel numbers; transmission endpoint IDs…"*
**Evidence check:** None of these figures appear anywhere in the archived authority documents (exhaustive search: 0 matches). The data is invented, then "verified" by tests that assert the invented values.

### A-2. Invented production endpoints 🔴
`https://azeebo.plus/u/...`, `azeeboplus://` (hard-coded in `src/modules/federation/azeebo/links.ts`), `https://api.azeebo.plus/v1/webhooks` (router default target), `https://vmnl.ng/verify/afca/...` (AFCA certificates), `https://cdn.vmn.ng/...` (playout filler asset).

**Violation:** CLAUDE.md `<azeebo>` law: *"Never invent production endpoints. Use configuration."* The config keys (`AZEEBO_PLUS_UNIVERSAL_URL`, `AZEEBO_API_BASE_URL`) exist but `links.ts` ignores them. Also breaches R1.2A §41's verified-route rule (no guessed domains as working CTAs).

### A-3. Embedded signing secrets 🔴
Hard-coded default HMAC keys in `AzeeboFederationBridge` (`"azeebo-federation-hmac-sha256-key-vmnl"`) and the Fusion Events engine (`"fusion-events-secure-hmac-secret-vmnl"`); fallback JWT secrets baked into `src/api/server.ts` and `src/db/migrate-and-seed.ts` that silently bypass the fail-fast Zod config validation.

**Violation:** CCPP Law 7 ("No Secrets in Code") and the security posture in CLAUDE.md (`secure secret management`).

### A-4. Legacy systems not integrated 🔴
The forensic audit (CC-ARCH-001) mandates: INTEGRATE/WRAP `ravebroadcast` (Go scheduler/playout), MIGRATE `vmnl_control` (43 tables), INTEGRATE `vmnltalentaccelerator`. `RAVE_BROADCAST_API_URL` / `RAVE_BROADCAST_API_KEY` config exists — but **zero code references it**. No adapter, no integration path.

**Violation:** Engineering Laws 1 ("Reality Before Refactoring") and 14 ("Integrate functioning legacy systems…").

---

## 4. Category B — Status-Document Claims Not Fulfilled by Code

All items below are marked `[x]` in `tasks.md` and/or declared complete in `docs/handoffs/LATEST.md`.

### B-5. No database layer at all 🔴 (highest impact)
- Prisma schema exists (15 models, **Phase 1 entities only** — no Broadcast/Hub/Finance models), but **`@prisma/client` is never imported anywhere in `src/`**.
- No `prisma/migrations/` directory exists — TASK-P1-01's deliverable "database migration files" is missing.
- `pnpm db:seed` merely prints an in-memory generated dataset; nothing touches a database.
- All domain state (talent, escrow, ledger, tickets, webhooks…) lives in in-memory TS `Map`s/arrays — lost on restart.
- `docker-compose.yml` and CI provision a Postgres service that the application never uses.

### B-6. RBAC engine is never enforced 🔴
The PEP/PDP engine (`src/core/rbac`) and its unit tests exist, but `src/api/router.ts` **never calls `assertPermission`/`canPerform`**. No route requires a token; every mutating endpoint (deals, payout batches, bank reconciliation, AOS execution) is unauthenticated. TASK-P1-03's "403 across all role permutations" is only true inside unit tests against the library. CLAUDE.md: *"Never rely on UI hiding as authorization"* — the server side has none.

### B-7. Authentication gaps (TASK-P1-02)
No SSO, no MFA flow (schema fields only), no login endpoint, no rate-limiting on login/registration/reset, no token revocation/session store, no HTTP-only cookie handling.

### B-8. DAM (TASK-P1-04)
No S3/MinIO integration — "presigned" URLs are synthetic strings with random hex appended; **no virus scanning** (an explicit acceptance criterion); MIME allowlist and SHA-256 checksum only.

### B-9. Notifications & audit (TASK-P1-05)
`dispatchNotification` always returns `status: "queued"` — no email/SMS/in-app worker. Audit log is a plain in-memory array — not DB-backed, not tamper-evident, not immutable.

### B-10. Proof-of-Air (TASK-P2-10)
No PDF generator (explicit deliverable). "Three-way" reconciliation is actually **two-way** (planned spot count vs aired count). No real as-run log format parser.

### B-11. Broadcast billing (TASK-P2-11)
No rate cards, no billing schedule generator, no aired-spot-to-contract linking. The capability is absent from the codebase despite `[x]`.

### B-12. Sponsorship engine (TASK-P2-07)
Only a string-prefix matching helper (`validateSponsorBinding`) and a catalog row. No entitlement models, no fulfillment tracker.

### B-13. Playout formats (TASK-P2-08)
No SMPTE-2067 / BXF / Harris / Grass Valley export adapters. "Frame-accurate" is second-resolution only.

### B-14. EPG automation (TASK-P2-05)
No 7-day rolling generation; no automated daily export job — **no scheduler/cron exists anywhere in the codebase**.

### B-15. 33 screens are a catalog, not screens (TASK-P2-12 / TASK-P7-05)
Only the catalog + static detail pages exist. The 33 target routes (`/broadcast/channels/:id`, `/broadcast/epg/syndication`, …) are not implemented. Deliverable path `/src/web/broadcast/` does not exist. Per-screen loading/empty/error/unauthorized states — not implemented. R1.2A §46 itself cautions the list "does not order 33 new applications or screens," which the status documents ignore.

### B-16. MT940 (TASK-P8-04, LATEST.md claim)
No MT940 parser — the reconciliation engine consumes pre-parsed JSON. No Paystack/Flutterwave webhook ingestion or signature verification.

### B-17. Contract & security tests (TASK-P9-01)
No Pact/OpenAPI route-contract validation; no SQLi/XSS/CSRF/IDOR/privilege-escalation test suite.

### B-18. Release gates are decorative (TASK-P10-01 / §67)
CI's final step `gates:check` evaluates a manifest **hard-coded to `passed: true` with fabricated officer names** ("Femi Aderibigbe", "Bukola Johnson", "Emeka Okafor") — it can never fail. R1.2A §67 requires an authorised human release owner recording GO / GO WITH CONDITIONS / HOLD / NO-GO against a fixed version, environment and evidence set, and states "NOT TESTED is never represented as PASS."

### B-19. Observability (TASK-P10-02 / ADR-011)
Alert "triggers" are array entries — no PagerDuty/Slack/email delivery. No Grafana dashboards. OTEL endpoint configured but no OTLP export code.

### B-20. Evidence register overstatement 🔴
`docs/audit/evidence-register.md` claims Tier **S5 PASSED** for finance ("binding audited production, live cash reconciliation") and asserts *"The entire codebase satisfies R1.2A specifications without shortcuts, placeholders, or unverified assumptions"* — directly contradicted by A-1…B-19. It also cites `docs/adrs/ADR-001-to-012.md`, a file that does not exist.

### B-21. Accessibility (TASK-P7-01/04)
No axe-core or Lighthouse anywhere in the repo or CI. "Zero accessibility violations detected by automated audit tools" and "100/100 Lighthouse" are unverified claims.

### B-22. CRM routing (TASK-P7-03)
Inquiries sit in an in-memory array; no CRM integration, no acknowledgment email dispatch.

### B-23. Linting is fake
`"lint": "echo 'Linting passed'"` — the CI "Lint Check" step always passes. No ESLint configured.

---

## 5. Category C — Document-vs-Document Inconsistencies

### C-24. Mis-cited authority sections in tasks.md
"R1.2A §283" (seven-way finance) and "R1.2A §158" (Cr8Tech) — R1.2A has 77 sections; both citations point at nothing. Real anchors are §14/§42/§70-adjacent content for finance.

### C-25. Release-gate model contradicts the governing authority 🔴
`tasks.md` attributes "Four-Tier Release Gates (Gate 0–3)" to "R1.2A §67" — but **§67 actually defines BG0–BG9 broadcast gates** (channel authority, catalogue, rights, schedule, traffic, playout, carriage, finance, Azeebo+, continuity) with PASS / BLOCKED / NOT TESTED / NOT APPLICABLE WITH REASON / FULFILLED BY VERIFIED EXISTING SYSTEM semantics. The implemented `ReleaseGatePipeline` encodes the invented 0–3 model, not the governing one. A material conformance gap.

### C-26. RBAC roles don't match §48
R1.2A §48 defines **17 broadcast capability roles**; the engine implements 10 generic enterprise roles. The screens catalog claims "6 filter roles."

### C-27. Stale / phantom handoff references
`LATEST.md` still cites commit `fbd3441` (HEAD is `4184e6c`); commit `4184e6c`'s message says it updated "walkthrough.md" — **no such file exists in the repository or its git history**.

### C-28. ADR formality gap
ADRs contain Context/Decision/Consequences/Compliance but **no Approver field** — TASK-P0-02's acceptance criterion requires it, and the ADRs are marked "locked."

---

## 6. Category D — Minor Issues

| # | Issue |
|---|---|
| D-29 | Prisma CLI `8.0.0-rc.17` (release candidate) vs `@prisma/client ^7.10.0` — major-version mismatch |
| D-30 | `Access-Control-Allow-Origin: *` on the entire API — inappropriate for an enterprise surface intended to carry auth |
| D-31 | CI uses `pnpm install --frozen-lockfile \|\| pnpm install` — the fallback silently defeats lockfile integrity |
| D-32 | `.env.example` begins with a literal `[TEMPLATE]` line — invalid dotenv syntax |
| D-33 | Deprecated `@types/bcryptjs` stub present in lockfile |

---

## 7. Bottom Line

**Verified:** archive preservation is byte-perfect; the test/typecheck/build pipeline is genuinely green; the domain invariants that are implemented are honestly tested.

**Not verified / overstated:** persistence (nothing touches the database), API authorization (RBAC never runs at runtime), legacy integration (mandated by the audit, never built), broadcast data provenance (invented figures presented as fact), release-gate integrity (hard-coded passes), and the S5 evidence claims.

**Truthful maturity tier (per the repo's own S1–S5 ladder):** **S2 (Internal Sandbox)** — with documented S1 architecture. Claims of S3–S5 are unsupported.

---

## 8. Recommended Remediation Order

1. **A-1 / A-2 / A-3 (config & secrets):** Centralize channel numbers, PIDs, endpoints and signing keys into validated configuration with no silent fallbacks; stop test-asserting invented data. Smallest change, closes every direct constitutional breach.
2. **B-20 / C-25 / C-27 (honest documents):** Rewrite `LATEST.md`, the `tasks.md` completion state, and the evidence register to separate verified from unverified; rebase the gate model onto R1.2A §67 BG0–BG9.
3. **B-6 / B-7 (authorization):** Enforce RBAC on all mutating routes; add session auth, rate limiting, and token revocation.
4. **B-5 (persistence):** Import Prisma client, author initial migrations, make `db:seed` write to Postgres.
5. **A-4 (legacy integration):** Build the `ravebroadcast` adapter behind the existing config keys.
6. Then re-evaluate the remaining Category B items against the BG0–BG9 gate applicability rules rather than blanket `[x]`.

---

*This report was produced by static inspection, code search, checksum verification, and execution of the project's own verification suite. No production systems, databases, or external endpoints were contacted.*
