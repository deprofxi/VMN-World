# DEC-CCPP-SECTION3-STRUCTURE-001 — the §3 governance tree as adapted, not as copied

**Status:** ACCEPTED · **Date:** 2026-10-15 · **Register:** `tasks.md` TSK-41 box 3 (`report.md CA-23`)
**Authority:** `docs/authorities/VMNL-AZP-VMN-CCPP-001-R1.1.md` §3 `REPOSITORY AUTHORITY ARCHITECTURE`
(`:195-249`), whose two operative sentences are `:247` "The precise structure may adapt to the real
stack." and `:249` "The governance relationships may not."

## Why this record exists

CA-23 recorded that the repository does not hold the directory tree CCPP §3 prescribes. The naive
fix is `mkdir`: eleven empty directories would make the *tree* true and the *governance* false, which
is the same substitution CA-23 was written about. This record therefore does two things: it names, per
prescribed path, where the relationship is actually carried today, and it states plainly which
prescribed paths have no content anywhere and are therefore **not** created.

## Measured census (2026-10-15, this tree)

```bash
find docs -maxdepth 1 -type d | sort                      # 11 lines: `docs` + its 10 subdirectories
for d in docs/api docs/broadcast docs/azeebo docs/privacy docs/testing \
         docs/migrations docs/operations docs/prompts \
         tests/domain tests/e2e tests/migration; do [ -d "$d" ] || echo "ABSENT $d"; done
                                                          # 11 lines, all ABSENT
ls docs/adrs | wc -l                                      # 14 (13 ADRs + README)
find docs/audit -type f | wc -l                           # 217
find docs/domain docs/security docs/events docs/runbooks docs/decisions -type f | wc -l   # 16, this record included
```

## Prescribed path → where the relationship lives today

| CCPP §3 prescribes | Carried by | Verdict |
|:---|:---|:---|
| `docs/authorities/{PRD, CEMP, CEEP, domain-boundaries, architecture-locks}` | `docs/authorities/VMNL-AZP-VMN-BRD-PRD-001-R1.2A.md`, `…-CCPP-001-R1.1.md`, `…-EXEC-001.md`; the boundary/lock content is `docs/adrs/ADR-004-domain-boundaries-and-modular-context-mapping.md` and `ADR-001`, `ADR-003` | **ADAPTED** — three of §3's five files are summarised into authority documents that exist under their own VMNL IDs; the other two are ADRs, not summaries |
| `docs/architecture/{overview,domains,integrations,deployment}.md`, `adr/` | `docs/adrs/` (13 ADRs + README), `docs/domain/canonical-model.md`, `docs/architecture/descoped-modules.json`, `docs/runbooks/*` for deployment, `CLAUDE.md` for the top-level map | **ADAPTED** — §3's `architecture/adr/` is at the sibling path `docs/adrs/`; the four narrative files are distributed across ADRs and `docs/domain` |
| `docs/domain/{canonical-model, data-dictionary, state-machines, systems-of-record}.md` | all four exist, each guarded (`tests/unit/canonical-model.test.ts`, `tests/unit/systems-of-record.test.ts`, `tests/unit/state-machine-doc-pins.test.ts`) | **SATISFIED** |
| `docs/api/` | `docs/security/route-authorization-coverage.md` (route/guard census), `docs/adrs/ADR-005-api-pattern-and-contract-standard.md`, and the contract suite `tests/contract/openapi-contract.test.ts` — which binds a real server rather than a spec file | **ADAPTED** — no standalone OpenAPI document exists; the contract is executable, not descriptive |
| `docs/events/` | `docs/events/catalogue.md`, derived from the queue by `tests/unit/event-catalogue.test.ts` | **SATISFIED** |
| `docs/broadcast/` | `docs/domain/state-machines.md` §1/§8 (the schedule machine), `docs/audit/desk-census.md`, `docs/audit/journey-readiness-matrix.md`, `docs/decisions/screen-register.json` | **ADAPTED** — the broadcast governance documents are audit/domain artefacts with instruments attached |
| `docs/azeebo/` | `docs/adrs/ADR-008-azeebo+-external-federation-protocol.md`, `src/modules/federation/azeebo/` (`bridge.ts`, `links.ts`, `attribution.ts`, `metadata.ts`), guarded by `tests/unit/federation-destination-registry.test.ts` | **ADAPTED** |
| `docs/security/` | `docs/security/threat-model.md` (CCPP §16 artifact), `docs/security/route-authorization-coverage.md` | **SATISFIED** |
| `docs/privacy/` | the privacy behaviour is in code and tests (`src/api/routes/privacy.routes.ts`, `tests/integration/enquiry-failure-drill…`), the DSR lifecycle in `docs/domain/state-machines.md` §5, the threat surface in `docs/security/threat-model.md` | **NOT CREATED** — no privacy document exists to move, and an empty directory would claim one |
| `docs/testing/`, `tests/domain`, `tests/e2e` | `vitest.config.ts` (pools, floors), `.github/workflows/ci.yml`, and the suites themselves: `tests/unit` (67 files), `tests/integration` (4), `tests/security` (3), `tests/contract` (1), `tests/a11y` (3); domain behaviour is asserted inside `tests/unit/*` rather than a separate folder | **NOT CREATED** — §3's split is a packaging preference; the relationships (unit/domain/integration/contract/security/a11y all execute in CI) hold under the current names |
| `docs/migrations/` | `prisma/migrations/` (13 directories + `migration_lock.toml`), `prisma.config.ts`, and the deploy-from-empty evidence `docs/audit/evidence/migrations-2026-10-07/`, `docs/audit/evidence/tsk09-commit-series-2026-10-15/migrate-deploy-from-empty.txt` | **ADAPTED** — migration knowledge sits beside the schema it describes |
| `docs/operations/` | `docs/runbooks/{disaster-recovery,observability,rollback-runbook}.md`, `docker-compose.yml`, `.github/workflows/ci.yml` | **ADAPTED** — §3's `operations` is this repository's `runbooks` |
| `docs/prompts/` | `CLAUDE.md` (repository instruction file) | **ADAPTED** — one root file, not a directory |

## What stays open, and who owns it

* **`docs/privacy/`** is the one prescribed area with no artifact at all. The privacy *controls* exist
  (TSK-30 sealed write boundary, TSK-31 DSR intake), but nobody has written the policy document §3
  implies. Writing it is a DPO-owned decision (`tasks.md` §5, `HD-04`, `HD-05` key ownership), not a
  directory creation, so it is left as an open gap rather than filled with a placeholder.
* **A standalone OpenAPI document** (`docs/api/openapi.yaml`, citation:absent — never written) does not exist; `ADR-005` describes the
  contract standard and `tests/contract/openapi-contract.test.ts` enforces behaviour against a live
  server. Producing the spec file is `tasks.md` TSK-56's scope (single error contract + status
  documentation), and this record does not claim it.
* **A `deployment.md` narrative** is not written; `ADR-012`, the CI workflow and the runbooks carry the
  relationship. TSK-57 (compose hardening, verified by an actual `docker compose up`) is the gate that
  would make such a document more than aspirational — no Docker binary exists on this machine
  (`docker info` → exit 127), so it is not written here.

## Deliberately not claimed

This record satisfies TSK-41 box 3's *stated alternative* ("a decision record cites CCPP's adaptation
clause for each omission"). It does **not** make CCPP §3's tree literally true, does not close TSK-39
box 1 (importing the four missing authority documents), and confers no status on any row marked
**NOT CREATED** above. `docs/domain/systems-of-record.md` and
`docs/audit/evidence-register.md` remain the places that record what is verified.
