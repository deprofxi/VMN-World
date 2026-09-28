# ADR-002: Canonical Identity & Authentication Architecture

**Status:** `ACCEPTED`  
**Date:** 2026-09-27  
**Authority:** `VMNL-AZP-VMN-CCPP-001 — R1.1` (CC-ARCH-002)  
**Approver:** `VMNL Enterprise Architecture Board (EAB)`  
**Parent Master:** `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A`

## Context
Multiple isolated user tables exist across legacy databases (vmnl_control, azeebo_auth, vmnltalentaccelerator). R1.2A mandates: 'One person -> one canonical identity -> multiple legitimate roles'.

## Decision
Implement a unified Canonical Identity model where a single Person entity maps to one or more user accounts, profiles, and enterprise roles. Authentication uses secure HTTP-only cookies with rotating JWT session tokens and Argon2id password hashing. Multi-tenant access is governed by organizational tenant IDs and contextual role assignments.

## Consequences
Positive: Eliminates identity fragmentation; enables seamless cross-platform privileges (e.g. an AFCA mentor who is also a VTM talent and broadcast presenter). Negative: Requires migration mapping for existing user tables.

## Compliance & Verification
- Verified against VMNL 10 Immutable Engineering Laws.
- Traceable to R1.2A requirements.
- Validated via automated test suites and operational runbooks.
