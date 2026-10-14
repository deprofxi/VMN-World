# CC-ARCH-001: Forensic Repository & System Audit Report

**Audit Authority:** `VMNL-AZP-VMN-CCPP-001 — R1.1` (§24)  
**Governing Standard:** `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A`  
**Date of Audit:** 2026-09-27  
**Auditor / Agent:** Antigravity / Engineering Conformance Agent  
**Audit Scope:** Local workspace (`vmng`), adjacent institutional repositories in `/Users/deprof/www/`, running PostgreSQL database instances, broadcast services, and external integrations.

---

## 1. Executive Summary

In strict accordance with the VMNL engineering law **"Reality Before Refactoring"**, this forensic audit was executed before writing material new code. The audit identified that VMNL is **not** a greenfield system. It comprises an active, heterogeneous technology landscape across broadcast automation, enterprise resource planning, talent cohort management, and consumer streaming databases.

This report establishes the baseline facts of the operating environment, catalogs all existing assets, evaluates technical debt, and assigns a definitive disposition (`KEEP`, `EXTEND`, `REFACTOR`, `WRAP`, `INTEGRATE`, `MIGRATE`, `CONSOLIDATE`, `RETIRE`, or `MISSING`) to each component.

---

## 2. Infrastructure & Runtime Environment

### 2.1 Host System
- **Operating System:** macOS 26.6.2 (Darwin Kernel 25.6.0 arm64, Apple Silicon)
- **Node.js Runtime:** `v22.23.2` (Active LTS)
- **Package Managers:** `pnpm 10.33.2`, `npm 10.9.8`
- **Python Runtime:** `Python 3.9.6`
- **Database Engine:** PostgreSQL 18.3 (active on local socket `/tmp:5432`)
- **Version Control:** Git 2.50.1

### 2.2 Active Database Landscape
The active PostgreSQL cluster hosts **55 databases**, including:
1. `vmnl_control`: 43 tables representing enterprise operations, campaigns, equipment, departments, invoices, and RACI matrices.
2. `azeebo_*` (34 distinct databases): Database cluster for the Azeebo+ consumer ecosystem (`azeebo_auth`, `azeebo_content`, `azeebo_creator`, `azeebo_movie`, `azeebo_vertical`, `azeebo_wallet`, etc.).
3. `rave`, `rave_broadcast`, `ravepulse`: Broadcast scheduling, streaming, and pulse metric stores.
4. `faantv`, `ycn_api`, `youth_connect_nigeria`: Partner and project databases.

---

## 3. Discovered Institutional Assets & Repositories

| Repository / Asset Path | Technology Stack | Functional Domain | Audit Findings & State |
|---|---|---|---|
| `/Users/deprof/www/ravebroadcast` | Go (Microservices), React/Vite, Liquidsoap, FFmpeg, Icecast, MinIO, Redis, K8s, Terraform | **Broadcast & Playout** | Highly developed broadcast stack with Go `scheduler`, `streaming`, `media`, and `billing` microservices. Automated playlist generation and media processing present. |
| `/Users/deprof/www/vmnlinternal` & `/vmnl-new` | PHP 8.2+, Laravel 11/12, Blade, Tailwind CSS, PostgreSQL (`vmnl_control`) | **Corporate Centre & ERP** | 42 migrations. Manages campaigns, deliverables, equipment checkouts, cashflow entries, invoices, daily/weekly reports, checklists, and RACI assignments. |
| `/Users/deprof/www/vmnltalentaccelerator` | PHP 8.2+, Laravel, MySQL/Postgres dual-driver, Tailwind CSS | **Talent Accelerator & AFCA** | Implements cohort-based training, applicant selection state machine, attendance (QR code), assignments, rubrics, points ledger, badges, and fellowship records. |
| `/Users/deprof/www/afca` & `/afca-landing` | PHP, HTML5, CSS3, Vector Design Assets | **AFCA Academy Portal** | High-fidelity UI design assets (`AFCA Desktop Homepage Light/Dark Mode.pdf`) and public landing pages. |
| `/Users/deprof/www/azeebo+` & `/azeebo+v2` | Node.js / React / Next.js / Laravel / Postgres | **Azeebo+ D2C Platform** | Standalone direct-to-consumer platform across 8 universes. Must remain **federated via contracts**, not embedded. |
| `/Users/deprof/www/vmng` | Markdown / Document Authority / Clean Git Baseline | **Unified Enterprise Orchestrator** | Contains the supreme R1.2A BRD/PRD, CCPP-001 Prompt Pack, and root CLAUDE.md constitution. |

---

## 4. Component Classification Matrix

> [!IMPORTANT]
> **GOVERNANCE AMENDMENT (2026-09-28):**
> Dispositions for `ravebroadcast`, `vmnl_control`, and `vmnltalentaccelerator` below are **SUPERSEDED** by formal EAB decision recorded in [ADR-013](file:///Users/deprof/www/vmng/docs/adrs/ADR-013-legacy-system-integration-supersede.md).
> Open-standard native broadcast automation (SMPTE-2067, BXF, Harris CSV, Grass Valley XML) and canonical Prisma database repositories now govern these domains natively without legacy microservice or direct database dependencies.

In accordance with Section 2 of `VMNL-AZP-VMN-EXEC-001`, initial system component classifications were recorded as follows:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 CLASSIFICATION MATRIX                                  │
├──────────────────────────┬──────────────┬──────────────────────────────────────────────┤
│ Component                │ Classification│ Strategic Architectural Action               │
├──────────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ ravebroadcast Scheduler  │ INTEGRATE /  │ Wrap Go scheduling microservice via REST/gRPC│
│                          │ EXTEND       │ to ingest VMN approved schedule grids.       │
├──────────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ ravebroadcast Streaming  │ KEEP / WRAP  │ Retain Liquidsoap/FFmpeg/Icecast playout and │
│ (FFmpeg/Liquidsoap)      │              │ streaming engine; integrate as-run logging.  │
├──────────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ vmnl_control Database    │ MIGRATE /    │ Migrate core enterprise records (equipment,  │
│ (43 tables)              │ CONSOLIDATE  │ campaigns, invoices) into canonical schemas. │
├──────────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ vmnltalentaccelerator    │ INTEGRATE /  │ Retain and connect cohort management and     │
│ (Cohorts & Rubrics)      │ EXTEND       │ applicant evaluation to VMN Canonical ID.    │
├──────────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ afca Landing Assets      │ EXTEND       │ Extract Figma/PDF token design systems into  │
│                          │              │ React/Web components built to WCAG 2.2 AA.   │
├──────────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ Azeebo+ Direct Endpoints │ WRAP /       │ Connect strictly through Level 1–4           │
│                          │ INTEGRATE    │ Federation Contracts (Universal links, webhooks).│
├──────────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ Rights & Window Engine   │ MISSING      │ Build the canonical Rights & Exploitation    │
│                          │ (NEW BUILD)  │ Engine in vmng core to gate all scheduling.  │
├──────────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ 7-Way Finance Separation │ MISSING      │ Build dedicated financial ledger separating  │
│ Engine                   │ (NEW BUILD)  │ GMV, Invoiced, Cash, Payables, Splits.       │
├──────────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ As-Run 3-Way Proof-of-   │ EXTEND /     │ Build automated Proof-of-Air certificate     │
│ Air Engine               │ NEW BUILD    │ generator matching playout logs to contracts.│
└──────────────────────────┴──────────────┴──────────────────────────────────────────────┘
```

---

## 5. Technical Debt & Risk Analysis

1. **Fragmented Identity:** Multiple independent user tables across `vmnl_control`, `vmnltalentaccelerator`, `azeebo_auth`, and `ravebroadcast`. A unified Canonical Identity (`Person` -> multiple roles) with Single Sign-On (SSO) or federated token mapping is urgently required.
2. **Missing Rights Gate in Legacy Playout:** `ravebroadcast` schedules media based on file existence without validating legal broadcast rights windows, territorial exclusivity, or StarTimes transmission agreements.
3. **Financial Conflation:** Existing invoice and cashflow tables in `vmnl_control` do not enforce the mandatory 7-way financial separation (GMV vs. Contract Value vs. Invoiced vs. Recognized vs. Cash vs. Payables vs. Splits).
4. **Disparate Tech Stacks:** Microservices exist in Go, ERP in Laravel/PHP, broadcast web in React/Vite, and mobile in Flutter. `vmng` must act as the **governing orchestrator and API gateway**, leveraging clean contracts without forced rewriting of working low-level engines.

---

## 6. Audit Conclusion & Next Directives

- **Conclusion:** The existence of `ravebroadcast` and `vmnltalentaccelerator` confirms that VMNL has strong working assets in linear streaming and talent cohorts. Development in `vmng` must **orchestrate and unify** these assets via canonical domain models, rigorous rights verification, and federated integration rather than rebuilding low-level streaming engines from scratch.
- **Immediate Next Action:** Lock the 12 Architecture Decision Records (`ADR-001` through `ADR-012`) to formally define the integration boundaries and technology standards.
