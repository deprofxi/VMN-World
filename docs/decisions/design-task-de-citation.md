# DEC: De-citation of the absent `design-task.md` design authority (TODO-DOC-02)

**Status:** `ACCEPTED` (engineering record; no material domain change)  
**Date:** 2026-09-30  
**Authority:** `VMNL-AZP-VMN-CCPP-001 — R1.1` (§24 engineering control) — recorded by the engineering contributor under the repository constitution  
**Supersedes:** all in-repo references to `design-task.md` as a governing authority document

## Context

Approximately 18 source and test files cited `design-task.md` (DT-xxx IDs, DS-nn, WS-nn tokens) as a design authority. The file does not exist anywhere in the repository (verified 2026-09-30 by repository-wide search, case-insensitive). Citing an absent document violates the evidence-before-claims law (canonical law 20) and leaves acceptance criteria unverifiable.

## Decision

1. `design-task.md` is treated as an **unavailable external working document**. It is NOT recreated synthetically — inventing its content would fabricate authority.
2. All in-repo citations are re-pointed to this record: `docs/decisions/design-task-de-citation.md (legacy "design-task" DT reference)`.
3. The substantive design authority previously attributed to it is re-anchored to the authorities that DO exist and already govern visual/UX work:
   - `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A` (product & business master — UX/visual requirements),
   - `docs/ui-copy-standards.md` and `docs/design-debt-register.md` (in-repo design standards and deviation tracking),
   - WCAG 2.2 AA (canonical law 19).
4. DT-nn / DS-nn / WS-nn identifiers remain as stable **internal labels only** (e.g. "legacy design-task DT-103 reference"). They confer no acceptance authority; tests that cite them take their normative force from the tests' own assertions and from the authorities above.
5. If the original `design-task.md` is later provided by its owner, a follow-up record must reconcile or supersede this decision before any DT citation is restored as authority.

## Consequences

- No behavioural code changes; comment/header and doc re-pointing only.
- TODO-DOC-02 closes as "de-cited" (the "locate" branch was exhausted: the file is not in the repo, the archive, or the handoff records).
