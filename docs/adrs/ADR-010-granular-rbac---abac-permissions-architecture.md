# ADR-010: Granular RBAC / ABAC Permissions Architecture

**Status:** `ACCEPTED`  
**Date:** 2026-09-27  
**Authority:** `VMNL-AZP-VMN-CCPP-001 — R1.1` (CC-ARCH-002)  
**Approver:** `VMNL Enterprise Architecture Board (EAB)`  
**Parent Master:** `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A`

## Context
VMNL enterprise involves sensitive workflows: schedule locking, broadcast playout overrides, escrow release, and contract execution. UI hiding is strictly forbidden as authorization.

## Decision
Implement a server-side Policy Enforcement Point (PEP) and Policy Decision Point (PDP). Roles include SuperAdmin, ExecutiveLeader, BroadcastDirector, TrafficManager, PlayoutOperator, RightsManager, TalentManager, AcademyDirector, FinanceController, and Auditor. Fine-grained attributes (e.g. monetary limits, schedule lock windows) are evaluated via ABAC policies.

## Consequences
Positive: Robust security, complete auditability, defense-in-depth. Negative: Requires thorough policy test suites covering all role/permission permutations.

## Compliance & Verification
- Verified against VMNL 10 Immutable Engineering Laws.
- Traceable to R1.2A requirements.
- Validated via automated test suites and operational runbooks.
