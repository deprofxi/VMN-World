# ADR-004: Domain Boundaries & Modular Context Mapping

**Status:** `ACCEPTED`  
**Date:** 2026-09-27  
**Authority:** `VMNL-AZP-VMN-CCPP-001 — R1.1` (CC-ARCH-002)  
**Approver:** `VMNL Enterprise Architecture Board (EAB)`  
**Parent Master:** `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A`

## Context
Without strict modular boundaries, business logic between Broadcast, Talent, Academy, and Commercial domains risks becoming tightly entangled.

## Decision
Enforce four primary bounded contexts: 1. Enterprise Core (Identity, Organisations, Projects, Audit); 2. Broadcast Operations (Channels, Programmes, Schedules, Traffic, Playout, Proof-of-Air); 3. Creative Economy Hub (Talent, AFCA, VTM, VCF, ONE Studios, TEND); 4. Commercial & Finance (Contracts, Rights, 7-Way Ledger, Settlements). Cross-domain communication occurs via domain service interfaces or asynchronous events.

## Consequences
Positive: Independent domain evolvability, high testability, clean separation of concerns. Negative: Cross-domain queries require aggregation services.

## Compliance & Verification
- Verified against VMNL 10 Immutable Engineering Laws.
- Traceable to R1.2A requirements.
- Validated via automated test suites and operational runbooks.
