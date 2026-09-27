# ADR-006: Event-Driven Architecture & Message Bus

**Status:** `ACCEPTED`  
**Date:** 2026-09-27  
**Authority:** `VMNL-AZP-VMN-CCPP-001 — R1.1` (CC-ARCH-002)  
**Parent Master:** `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A`

## Context
Broadcast as-run log reconciliation, EPG export notifications, commercial billing triggers, and Azeebo+ webhook dispatches require reliable background processing.

## Decision
Adopt Redis Streams with BullMQ for reliable, persistent asynchronous job processing, scheduled tasks, and event broadcasting. All events must follow a standardized envelope schema with unique event IDs, idempotency keys, source provenance, and ISO-8601 timestamps.

## Consequences
Positive: Prevents blocking HTTP requests, provides automatic retries with exponential backoff, dead-letter queues (DLQ), and task visibility. Negative: Adds Redis runtime dependency.

## Compliance & Verification
- Verified against VMNL 10 Immutable Engineering Laws.
- Traceable to R1.2A requirements.
- Validated via automated test suites and operational runbooks.
