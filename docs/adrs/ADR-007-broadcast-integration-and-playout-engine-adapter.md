# ADR-007: Broadcast Integration & Playout Engine Adapter

**Status:** `ACCEPTED`  
**Date:** 2026-09-27  
**Authority:** `VMNL-AZP-VMN-CCPP-001 — R1.1` (CC-ARCH-002)  
**Approver:** `VMNL Enterprise Architecture Board (EAB)`  
**Parent Master:** `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A`

## Context
The forensic audit confirmed ravebroadcast contains working Go scheduling and FFmpeg/Liquidsoap playout services. We must integrate these rather than rebuilding playout from scratch.

## Decision
The vmng Broadcast domain acts as the master authority for Channels, Programmes, Rights Verification, and Approved Daypart Schedules. vmng exports approved 24-hour playout playlists to the ravebroadcast scheduler service via an adapter API. ravebroadcast returns raw as-run logs to vmng for three-way reconciliation and Proof-of-Air generation.

## Consequences
Positive: Preserves functioning broadcast playout infrastructure while establishing rights and commercial governance. Negative: Requires maintaining API contract between Node.js orchestrator and Go playout service.

## Compliance & Verification
- Verified against VMNL 10 Immutable Engineering Laws.
- Traceable to R1.2A requirements.
- Validated via automated test suites and operational runbooks.
