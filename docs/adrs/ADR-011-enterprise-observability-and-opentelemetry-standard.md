# ADR-011: Enterprise Observability & OpenTelemetry Standard

**Status:** `ACCEPTED`  
**Date:** 2026-09-27  
**Authority:** `VMNL-AZP-VMN-CCPP-001 — R1.1` (CC-ARCH-002)  
**Parent Master:** `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A`

## Context
System stability, API latencies, queue backlogs, and broadcast transmission outages must be observable in real-time.

## Decision
Adopt OpenTelemetry standards for structured JSON logging, distributed tracing (TraceID/SpanID propagation), and Prometheus metrics instrumentation. Key business metrics (ad fill rate, schedule drift, as-run discrepancy count, escrow volume) will be exposed on dedicated health endpoints.

## Consequences
Positive: Real-time incident detection, rapid root-cause analysis, verifiable SLOs. Negative: Moderate instrumentation overhead in application code.

## Compliance & Verification
- Verified against VMNL 10 Immutable Engineering Laws.
- Traceable to R1.2A requirements.
- Validated via automated test suites and operational runbooks.
