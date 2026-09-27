# ADR-009: File & Digital Asset Management (DAM) Strategy

**Status:** `ACCEPTED`  
**Date:** 2026-09-27  
**Authority:** `VMNL-AZP-VMN-CCPP-001 — R1.1` (CC-ARCH-002)  
**Parent Master:** `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A`

## Context
Broadcast video masters, promo assets, student assignments, and legal contracts require secure, high-capacity object storage with integrity verification.

## Decision
Implement an S3-compatible storage abstraction (MinIO for development/staging, AWS S3 / Cloud Storage for production). Clients upload via short-lived presigned URLs. The ingestion pipeline computes cryptographic checksums (MD5/SHA256) and validates media formats against broadcast master specs (1080i50, EBU R128 audio).

## Consequences
Positive: Scalable, zero storage load on application servers, tamper-evident media tracking. Negative: Large broadcast video files require dedicated network bandwidth.

## Compliance & Verification
- Verified against VMNL 10 Immutable Engineering Laws.
- Traceable to R1.2A requirements.
- Validated via automated test suites and operational runbooks.
