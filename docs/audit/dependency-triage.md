# VMNL Dependency Vulnerability Triage Register

**Document ID:** `VMNL-SEC-AUDIT-TRIAGE-001`  
**Governing Authority:** `VMNL-AZP-VMN-CCPP-001 §11 (Gate 1 — Clean Build & Audit Verification)`  
**Audit Source:** `pnpm audit --prod` & `pnpm audit`  
**Date of Historical Assessment:** 2026-09-28

**Current Recheck:** 2026-10-05 (`pnpm audit --prod --json`: zero advisories; `pnpm audit --json`: zero advisories)

**Assessor:** VMNL Security Architecture & Governance Team  
**Status:** Historical 2026-09-28 decision record; current applicability, package exposure, and approval have not been independently revalidated.

---

## 1. Executive Summary

The 2026-09-28 assessment recorded six transitive dependency advisories associated with the Prisma toolchain. Its exploitability and release conclusions are historical assertions and have not been revalidated as part of the 2026-10-05 repository remediation. The current automated check confirms that live advisory IDs appear in this register; it does not establish package reachability, exploitability, substantive waiver approval, or release suitability.

---

## 2. Dependency Vulnerability Assessment Matrix

| Advisory / CVE | Package | Severity | Path in Dependency Tree | Runtime Exploitability in VMNL | Disposition / Decision |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GHSA-3f6p-5ww8-9rcr** | `mysql2` | High | `. > @prisma/client > prisma > mysql2` | **Not independently revalidated.** The historical record asserted PostgreSQL-only use; current runtime/package reachability was not reviewed. | **Historical recorded waiver; revalidation required** |
| **GHSA-rgwj-5xj2-c3m3** | `mysql2` | Moderate | `. > @prisma/client > prisma > mysql2` | **Not independently revalidated.** The historical record asserted PostgreSQL-only use; current runtime/package reachability was not reviewed. | **Historical recorded waiver; revalidation required** |
| **GHSA-xxjr-mmjv-4gpg** | `lodash` | Moderate | `. > @prisma/client > prisma > @prisma/studio-core > @visx/responsive > lodash` | **Not independently revalidated.** Prisma Studio/runtime exposure assumptions require review against installed packages and deployment artifacts. | **Historical recorded waiver; revalidation required** |
| **GHSA-f23m-r3pf-42rh** | `lodash` | Moderate | `. > @prisma/client > prisma > @prisma/studio-core > @visx/responsive > lodash` | **Not independently revalidated.** Prisma Studio/runtime exposure assumptions require review against installed packages and deployment artifacts. | **Historical recorded waiver; revalidation required** |
| **GHSA-r5fr-rjxr-66jc** | `lodash` | High | `. > prisma > @prisma/studio-core > @visx/responsive > lodash` | **Assessment not independently revalidated.** Upstream describes template-import code injection; triage exposure must be verified against the installed/runtime package composition. | **Existing recorded waiver; revalidation required** |
| **GHSA-ggr8-5vv4-36mx** | `deepmerge-ts` | High | `. > prisma > @prisma/config > deepmerge-ts` | **Assessment not independently revalidated.** Upstream describes stack exhaustion on recursive object graphs; triage exposure must be verified against the installed/runtime package composition. | **Existing recorded waiver; revalidation required** |
| **GHSA-qxg6-89mg-rqv8** | `@vitest/mocker` | Moderate | `. > vitest > @vitest/mocker` | Development toolchain only; manual mock registration is not exposed to unauthenticated network inputs in production. | **Documented dev dependency advisory; non-production exposure** |
| **GHSA-xp26-3454-mjgp** | `@vitest/mocker` | Moderate | `. > vitest > @vitest/mocker` | Development toolchain only; Windows path traversal not applicable in macOS/Linux server runtime. | **Documented dev dependency advisory; non-production exposure** |
| **GHSA-mrhx-c7xc-m3w5** | `zod` | High | `. > zod` | Constrained collection size validation; bounded by request body payload limits (max 100KB) at HTTP server gateway. | **Monitored; mitigated by gateway payload limits** |
| **GHSA-w74x-v6f9-j3xg** | `fast-uri` | Moderate | `. > ajv > fast-uri` | Transitive JSON schema URI validation; schema parsing uses strict canonical validators. | **Documented transitive parser advisory; monitored** |
| **GHSA-xhq7-xmqj-769h** | `fast-uri` | Low | `. > ajv > fast-uri` | Relative reference normalization in AJV validation; no user-supplied schemas executed at runtime. | **Documented transitive parser advisory; monitored** |
| **GHSA-wjr9-j795-jxcr** | `fast-uri` | Moderate | `. > ajv > fast-uri` | Host confusion via WHATWG canonicalization; internal schema refs only. | **Documented transitive parser advisory; monitored** |
| **GHSA-333x-w4r6-6crp** | `fast-uri` | Low | `. > ajv > fast-uri` | Scheme injection via unescaped first-segment colon; non-networked schema references. | **Documented transitive parser advisory; monitored** |
| **GHSA-g3hv-75wg-m249** | `minimatch` | Moderate | `. > eslint > minimatch` | Development linter toolchain; ESLint file globbing executed during build/CI only. | **Documented build-time dev dependency advisory** |
| **GHSA-7589-6fvf-x4pw** | `effect` | High | `. > effect` | Transitive library dependency; template literal regex ReDoS evaluated in isolated environments. | **Documented transitive dependency advisory; monitored** |

---

## 3. Current Recheck & Historical Decision Record

The current lockfile applies pnpm overrides for `lodash@4.18.1`, `deepmerge-ts@8.0.2`, and `mysql2@3.24.5`. On 2026-10-05, the production-only and full dependency audit commands both reported zero advisories; the frozen-lockfile install and Prisma client generation also succeeded in the local workspace. The prior six advisory rows below are retained as historical findings and no longer describe the current installed versions. This recheck is point-in-time and does not substitute for SBOM inspection, transitive runtime reachability review, license review, or an enforced CI vulnerability threshold. The `audit:check` script validates registration of live advisory IDs only; it does not evaluate remediation or approve release risk.

The overrides are dependency constraints under review, not a Prisma upgrade. Validate upstream compatibility on dependency updates and re-run application, generation, and database integration checks.

### Historical Decision Record & Mitigation Roadmap

1. **Historical Decision Record:** The gate-clearance statement records the assessment made on 2026-09-28; the 2026-10-05 dependency scan does not re-authorize a release or independently validate underlying exploitability assumptions.
2. **Upstream Tracking:** Monitor Prisma releases for updates to transitive dependencies and verify the affected package path and runtime exposure before selecting a remediation.
3. **Continuous Monitoring:** Any new CVE affecting direct dependencies or runtime PostgreSQL database drivers should be reviewed under the release authority; the audit script only verifies that current advisory IDs match the register, not that a waiver is substantively approved.
