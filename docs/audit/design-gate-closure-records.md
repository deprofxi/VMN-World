# Design Gate Closure Records — DG-RL1-01…10 (TODO-PRC-02)

**Authority:** `VMNL-AZP-VMN-CCPP-001 — R1.1` §3.6 — a design gate closes only when the artifact exists, its revision is recorded, an owner is identified, the affected screens are listed, and the owner has accepted. Where those conditions are not met, the gate stays explicitly **OPEN** with an owner and a review expiry recorded here and mirrored in [design-debt-register.md](../design-debt-register.md).

**Honesty note:** gates marked CLOSED here record *engineering* readiness (artifact + revision + screens listed). Owner acceptance signatures are the named human's action; where a signature has not been sighted in-repo the gate is marked CLOSED-ENGINEERING / PENDING-SIGNATURE rather than fully closed. No gate is claimed accepted without a recorded acceptance.

| Gate | Scope | Artifact (exists in repo) | Revision | Owner | Screens | Status |
|---|---|---|---|---|---|---|
| DG-RL1-01 | Design tokens & primitives | `src/web/components/tokens.ts` + `tests/unit/tokens-contrast.test.ts` | current working tree @ candidate SHA | Lead Frontend Architect | all surfaces (foundation) | **CLOSED-ENGINEERING** (contrast ≥ 4.5:1 automated; visual sign-off pending) |
| DG-RL1-02 | Iconography | `src/web/components/icons.ts` + `tests/unit/styleguide.test.ts` | current | Lead Frontend Architect | all surfaces | **CLOSED-ENGINEERING** |
| DG-RL1-03 | Typography & copy standards | `docs/ui-copy-standards.md` + token tests | current | Lead Frontend Architect | all surfaces | **CLOSED-ENGINEERING** |
| DG-RL1-04 | Surface A public web (20 pages) | `src/web/public/*` renderers + `tests/unit/public-surfaces.test.ts` | current | Frontend lead + Product | `/`, `/channels/*`, `/hub/*`, portals | **CLOSED-ENGINEERING** |
| DG-RL1-05 | Surface B/C workspace desks | `src/web/workspace/*` + `tests/unit/extended-workspaces.test.ts`, `scr-desk-rewiring.test.ts` | Round 6B (desks rewired to canonical engines) | Operations product owner | `/workspace/*` (60 tracked groups, screen register) | **CLOSED-ENGINEERING** (19 MOCK-labelled demo groups remain; see screen register) |
| DG-RL1-06 | Broadcast operational screens (33) | `src/web/broadcast/index.ts` + `tests/unit/broadcast-screens.test.ts` | current | Broadcast Director | SCR-BCST-01..33 | **OPEN** — screens carry labelled demonstration KPIs pending engine wiring (TODO-BCST-01 lineage); owner review expiry 2026-10-31 |
| DG-RL1-07 | Counterparty portals | `src/web/portal/*` (client/partner/creator/vendor/VTM visibility) + `client-portal-and-operations.test.ts` | SCR-19/SCR-20 round | Product + Finance | `/portal/*` | **CLOSED-ENGINEERING** |
| DG-RL1-08 | Federation gateway surfaces | `src/web/federation/surface-e.ts` | current | Platform lead | `/azeebo/*` | **CLOSED-ENGINEERING** |
| DG-RL1-09 | Low-bandwidth & mobile profile | `docs/audit/performance-budgets.md` (budgets frozen) + DEBT-008 | TARGET (no measurement artifact yet) | Lead Frontend Architect | public + broadcast screens | **OPEN** — budgets frozen but unmeasured (PRC-04); expiry 2026-10-31 |
| DG-RL1-10 | Accessibility conformance (WCAG 2.2 AA) | `tests/a11y/*` (automated) | current | QA + Accessibility owner | public + material operating workflows | **OPEN** — automated pass only; manual §7.5 coverage NOT_RUN (PRC-06, human-run); expiry 2026-11-30 |

## Register integrity

- The OPEN rows above are mirrored in `docs/design-debt-register.md` (DEBT entries) so that no gate is silently dropped.
- Closure rule per CCPP §3.6: an OPEN gate moves to CLOSED only when artifact + revision + owner + screens + owner acceptance are all recorded. Engineering closure alone does not flip the status column here.
