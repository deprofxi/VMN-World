# ADR-005: API Pattern & Contract Standard

**Status:** `ACCEPTED`  
**Date:** 2026-09-27  
**Authority:** `VMNL-AZP-VMN-CCPP-001 — R1.1` (CC-ARCH-002)  
**Approver:** `VMNL Enterprise Architecture Board (EAB)`  
**Parent Master:** `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A`

## Context
APIs must support internal web dashboards, partner integrations, EPG consumers, and external federation contracts.

## Decision
Standardize on RESTful APIs adhering to OpenAPI 3.1 specifications. All request payloads and query parameters must be validated at the boundary using Zod schemas. Error responses must strictly conform to RFC 7807 (Problem Details for HTTP APIs).

## Consequences
Positive: Deterministic contract testing, automatic Swagger/OpenAPI documentation generation, type-safe client SDK generation. Negative: Minor boilerplate for schema declarations.

## Compliance & Verification
- Verified against VMNL 10 Immutable Engineering Laws.
- Traceable to R1.2A requirements.
- Validated via automated test suites and operational runbooks.
