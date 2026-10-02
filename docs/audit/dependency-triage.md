# VMNL Dependency Vulnerability Triage & Risk Acceptance Register

**Document ID:** `VMNL-SEC-AUDIT-TRIAGE-001`  
**Governing Authority:** `VMNL-AZP-VMN-CCPP-001 §11 (Gate 1 — Clean Build & Audit Verification)`  
**Audit Source:** `pnpm audit --prod` & `pnpm audit`  
**Date of Assessment:** 2026-09-28  
**Assessor:** VMNL Security Architecture & Governance Team  
**Status:** FORMAL RISK ACCEPTANCE (Gate 1 Condition Clearance)

---

## 1. Executive Summary

A zero-tolerance forensic audit was conducted on the production dependency graph via `pnpm audit --prod`. Six (6) transitive dependency vulnerabilities were detected originating exclusively from the `@prisma/client -> prisma` toolchain bundle. No direct dependency contains known vulnerabilities.

Every identified finding has been evaluated for exploitability in the VMNL deployment runtime. Because VMNL operates exclusively on PostgreSQL (via `@prisma/adapter-pg` and `pg`) and does not expose Prisma Studio or CLI utilities to untrusted network traffic, none of the 6 vulnerabilities are exploitable in the runtime environment.

A non-blocking CI verification step (`pnpm audit --prod --audit-level high`) has been instituted with formal recorded waivers for these specific transitive CVEs.

---

## 2. Dependency Vulnerability Assessment Matrix

| Advisory / CVE | Package | Severity | Path in Dependency Tree | Runtime Exploitability in VMNL | Disposition / Decision |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GHSA-3f6p-5ww8-9rcr** | `mysql2` | High | `. > @prisma/client > prisma > mysql2` | **Zero.** VMNL uses PostgreSQL 16+ only. The MySQL2 driver is never loaded, configured, or connected in runtime. | **WAIVED WITH RATIONALE** (Transitive unused driver) |
| **GHSA-rgwj-5xj2-c3m3** | `mysql2` | Moderate | `. > @prisma/client > prisma > mysql2` | **Zero.** Decompression-bomb DoS on compressed MySQL protocol packets. MySQL protocol is completely inactive. | **WAIVED WITH RATIONALE** (Transitive unused driver) |
| **GHSA-xxjr-mmjv-4gpg** | `lodash` | Moderate | `. > @prisma/client > prisma > @prisma/studio-core > @visx/responsive > lodash` | **Zero.** Prototype pollution in `_.unset`/`_.omit` inside Prisma Studio responsive charting. Prisma Studio is a dev-only tool not deployed or exposed in production. | **WAIVED WITH RATIONALE** (Dev tooling in CLI package) |
| **GHSA-f23m-r3pf-42rh** | `lodash` | Moderate | `. > @prisma/client > prisma > @prisma/studio-core > @visx/responsive > lodash` | **Zero.** Same as above. Unused in API server runtime. | **WAIVED WITH RATIONALE** (Dev tooling in CLI package) |
| **GHSA-255c-x379-q9g6** | `lodash` | High | `. > @prisma/client > prisma > @prisma/studio-core > @visx/responsive > lodash` | **Zero.** Command injection via `_.template` in Prisma Studio. Studio is not invoked or reachable via network endpoints in production. | **WAIVED WITH RATIONALE** (Dev tooling in CLI package) |
| **GHSA-v478-f62w-92mg** | `deepmerge-ts` | High | `. > @prisma/client > prisma > deepmerge-ts` | **Zero.** Call stack exhaustion in deepmerge utility during schema compile-time AST transforms. Not in runtime request path. | **WAIVED WITH RATIONALE** (Compile-time code generation only) |

---

## 3. Formal Sign-off & Mitigation Roadmap

1. **Gate 1 Clearance:** In accordance with R1.2A §67 and CCPP-001 §11, the production release is cleared under `GO_WITH_CONDITIONS` with these 6 recorded waivers.
2. **Upstream Tracking:** Monitor Prisma releases for minor/patch updates that remove or bump `mysql2`, `@prisma/studio-core`, and `deepmerge-ts`. When a patched version is available from Prisma, upgrade `@prisma/client` and `prisma` to eliminate transitive warnings.
3. **Continuous Monitoring:** Any new CVE affecting direct dependencies or runtime PostgreSQL database drivers will block release gates unconditionally.
