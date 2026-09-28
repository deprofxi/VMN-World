# ADR-008: Azeebo+ External Federation Protocol

**Status:** `ACCEPTED`  
**Date:** 2026-09-27  
**Authority:** `VMNL-AZP-VMN-CCPP-001 — R1.1` (CC-ARCH-002)  
**Approver:** `VMNL Enterprise Architecture Board (EAB)`  
**Parent Master:** `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A`

## Context
R1.2A explicitly states that Azeebo+ is a federated external platform, NOT an internal database table of VMN. Federation must prevent cascade failures.

## Decision
Implement 4-level federation via explicit contracts: Level 1: Universal Deep Links & dynamic UTM QR codes; Level 2: Outbound content metadata sync; Level 3: Conversion attribution tracking; Level 4: HMAC-SHA256 authenticated webhooks. A circuit breaker pattern ensures complete isolation: if Azeebo+ goes down, VMN broadcast and hub operations continue unaffected.

## Consequences
Positive: Clean architectural decoupling, independent scaling, resilient fault isolation. Negative: Asynchronous metadata eventual consistency.

## Compliance & Verification
- Verified against VMNL 10 Immutable Engineering Laws.
- Traceable to R1.2A requirements.
- Validated via automated test suites and operational runbooks.
