# ADR-013: Formal Supersession of Legacy System Integration Dispositions (CC-ARCH-001)

**Status:** `ACCEPTED`  
**Date:** 2026-09-28  
**Authority:** `VMNL-AZP-VMN-CCPP-001 — R1.1` (§24)  
**Approver:** `VMNL Enterprise Architecture Board (EAB)`  
**Sign-off Authority:** `Femi Aderibigbe (Principal Broadcast & Enterprise Architect, VMNL EAB)`  
**Parent Master:** `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A`  
**Supersedes:** Dispositions for `ravebroadcast`, `vmnl_control`, and `vmnltalentaccelerator` in `docs/audit/CC-ARCH-001-forensic-report.md` §4

---

## 1. Context & Background

In the initial architectural audit report (`CC-ARCH-001`), dispositions were tentatively assigned to adjacent legacy repositories in `/Users/deprof/www/`:
1. `ravebroadcast`: Classified as `INTEGRATE / EXTEND` (Scheduler) and `KEEP / WRAP` (Streaming).
2. `vmnl_control` (43 PostgreSQL tables): Classified as `MIGRATE / CONSOLIDATE`.
3. `vmnltalentaccelerator`: Classified as `INTEGRATE / EXTEND`.

During detailed implementation and governance review under R1.2A (§19, §46, §67), the Enterprise Architecture Board (EAB) determined that:
- Linear broadcast automation must be standardized on open, vendor-agnostic broadcast specifications (SMPTE-2067, Broadcast eXchange Format [BXF], Harris CSV, Grass Valley XML) rather than coupled to proprietary Go/Liquidsoap microservices in an external workspace.
- The 43 tables of legacy `vmnl_control` reflect deprecated relational structures that conflict with the clean canonical schema defined in `prisma/schema.prisma` and the 10 Immutable Engineering Laws (Law 1: Schema Authority, Law 6: Zero Phantom Data).
- Talent and cohort lifecycle operations are natively handled by the canonical `TalentAcceleratorRegistry`, `AfcaAcademyService`, and `TalentRepository`.

## 2. Architectural Decision

The VMNL Enterprise Architecture Board (EAB) hereby formally:
1. **Supersedes `ravebroadcast` Integration:** Descope all runtime adapters and network calls to `ravebroadcast`. All broadcast scheduling, daypart grid allocation, rolling 7-day EPG syndication (XMLTV), and 3-way as-run reconciliation are implemented as native, self-contained components in `src/modules/broadcast/`.
   **Correction (2026-09-30, TODO-DOC-04/TODO-BCST-11):** the earlier wording also claimed native "SCTE-35 insertion cues". That claim is withdrawn — no SCTE-35 engine exists in this codebase. Per the product master, SCTE-35 signalling is an MCR automation interchange capability (TARGET): cue-point export alongside the playlist adapters is deferred to the MCR integration workstream and is NOT claimed as implemented. The 48-hour playout cache is likewise a contract + Drill-20 simulator only (`PlayoutAutomationEngine.evaluateAutonomousCacheContract` / `simulateDrill20CacheOutage`); hardware integration remains with the MCR/StarTimes owner (TODO-BCST-06).
2. **Supersedes `vmnl_control` Direct Database Migration:** Descope the legacy 43-table migration. Authoritative enterprise persistence is governed strictly by `prisma/schema.prisma` with robust, fail-safe database repositories (`src/core/database/repositories/`) and golden test datasets (`src/db/seeds/golden/`).
3. **Supersedes `vmnltalentaccelerator` Adapter Dependency:** Unify talent profiles, student verification, course enrollments, and distinction certificates directly in the core modular domain (`src/modules/hub/talent/`, `src/modules/hub/afca/`).
4. **Maintains Azeebo+ Federation Boundaries:** Reaffirms ADR-008: Azeebo+ remains direct-to-consumer and is accessed solely via Level 1–4 external federation contracts (Universal Links, HMAC webhooks).

## 3. Consequences

### Positive
- **Vendor & Infrastructure Agnostic:** Native compliance with broadcast industry standards (SMPTE, BXF, XMLTV) ensures seamless interchange with any standard Master Control Room (MCR) automation system.
- **Zero Extraneous Attack Surface:** Eliminates untracked RPCs, microservice networking latency, and dependency vulnerabilities from external codebases.
- **Strict Database Integrity:** Prevents legacy data contamination and schema drift, guaranteeing 100% type safety and relational clarity.

### Operational Adjustments
- Operational staff must utilize the unified Surface B & C enterprise desks (`/workspace/mcr`, `/workspace/traffic`, `/workspace/epg`, `/workspace/asrun`) rather than legacy dashboards.
- StarTimes DTT/DTH carriage endpoints remain provisionally documented pending live physical uplink telemetry verification (governed under Release Gate `BG6_CARRIAGE: NOT_TESTED` in sandbox).

## 4. Formal Sign-Off

Signed and ratified on behalf of the VMNL Enterprise Architecture Board:

- **Name:** Femi Aderibigbe  
- **Role:** Principal Broadcast & Enterprise Architect / Document Authority  
- **Date:** 2026-09-28  
- **Signature Reference:** `EAB-SIG-ADR-013-20260928-NATIVE-AUTOMATION`
