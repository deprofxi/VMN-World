# ADR-001: Application Topology & Architecture Pattern

**Status:** `ACCEPTED`  
**Date:** 2026-09-27  
**Authority:** `VMNL-AZP-VMN-CCPP-001 — R1.1` (CC-ARCH-002)  
**Parent Master:** `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A`

## Context
VMNL operates across three major operational pillars: Linear Television Broadcast (Nigezie Xtreme, Orisun, Isi Mbido), the VMN Creative Economy Hub (Talent, AFCA, VTM, VCF, ONE Studios, TEND), and Azeebo+ D2C Federation. The repository forensic audit (CC-ARCH-001) revealed existing Go microservices in ravebroadcast and PHP/Laravel services in vmnlinternal. We must determine the core topology for the vmng enterprise system.

## Decision
Adopt a Modular Monolith architecture in TypeScript/Node.js (v22 LTS) with clear internal domain boundaries, structured packages, and an API Gateway layer. The modular monolith serves as the central orchestrator and canonical system of record, exposing clean REST/JSON:API endpoints while wrapping and communicating with ravebroadcast services (playout/streaming) and external platforms via dedicated adapters.

## Consequences
Positive: Single repository deployment, strong type safety across modules, simplified transaction management, clear bounded contexts. Negative: Requires strict internal discipline to prevent cross-domain coupling (enforced via barrel exports and linting).

## Compliance & Verification
- Verified against VMNL 10 Immutable Engineering Laws.
- Traceable to R1.2A requirements.
- Validated via automated test suites and operational runbooks.
