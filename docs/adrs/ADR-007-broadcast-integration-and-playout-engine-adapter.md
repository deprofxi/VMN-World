# ADR-007: Broadcast Integration & Playout Engine Adapter

**Status:** `ACCEPTED`  
**Date:** 2026-09-27  
**Authority:** `VMNL-AZP-VMN-CCPP-001 — R1.1` (CC-ARCH-002)  
**Approver:** `VMNL Enterprise Architecture Board (EAB)`  
**Parent Master:** `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A`

## Context
Linear broadcast playout automation requires strict schedule execution, frame-accurate timing, emergency filler insertion, and seamless failover. We must standardize playout integration on industry-standard automation specifications rather than proprietary single-vendor dependencies.

## Decision
The vmng Broadcast domain acts as the master authority for Channels, Programmes, Rights Verification, and Approved Daypart Schedules. vmng exports approved 24-hour playout playlists natively in industry-standard broadcast formats: SMPTE-2067, Broadcast eXchange Format (BXF), Harris Automation CSV, and Grass Valley automation schedules. Playout automation engines return raw as-run logs to vmng for three-way reconciliation (Traffic vs Playout vs Carrier Telemetry) and Proof-of-Air generation.

## Consequences
Positive: Ensures vendor-agnostic playout compatibility across multiple master control automation systems; enforces rights gates and daypart rate rules before playlist compilation; guarantees standardized 3-way reconciliation. Negative: Requires maintaining serializers and parsers for multiple broadcast automation formats.

## Compliance & Verification
- Verified against VMNL 10 Immutable Engineering Laws.
- Traceable to R1.2A requirements.
- Validated via automated test suites and operational runbooks.
