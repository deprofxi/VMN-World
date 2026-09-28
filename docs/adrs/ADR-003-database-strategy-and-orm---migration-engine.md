# ADR-003: Database Strategy & ORM / Migration Engine

**Status:** `ACCEPTED`  
**Date:** 2026-09-27  
**Authority:** `VMNL-AZP-VMN-CCPP-001 — R1.1` (CC-ARCH-002)  
**Approver:** `VMNL Enterprise Architecture Board (EAB)`  
**Parent Master:** `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A`

## Context
PostgreSQL 18.3 is actively running locally. We need a performant, type-safe database access layer that guarantees zero-downtime, expand-contract schema migrations.

## Decision
Standardize on PostgreSQL as the primary enterprise database engine. Use Prisma ORM / Kysely for type-safe query building and schema migrations. All migrations must strictly adhere to the Expand-Contract pattern (Add Column -> Dual Write -> Backfill -> Cutover -> Drop Column) with zero destructive operations without explicit sign-off.

## Consequences
Positive: Full TypeScript type generation, compile-time query safety, auditable SQL migrations. Negative: Requires careful index tuning for high-throughput broadcast schedule queries.

## Compliance & Verification
- Verified against VMNL 10 Immutable Engineering Laws.
- Traceable to R1.2A requirements.
- Validated via automated test suites and operational runbooks.
