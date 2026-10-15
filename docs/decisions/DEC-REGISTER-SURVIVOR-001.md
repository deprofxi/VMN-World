# DEC: The surviving task register (`tasks.md` — VMNL-AZP-VMN-TODO-002)

**Status:** `ACCEPTED` (engineering record; no domain behaviour changes)
**Date:** 2026-10-07
**Register item:** `tasks.md` TSK-07 (`report.md` CA-06, P0)
**Authority:** `VMNL-AZP-VMN-CCPP-001 — R1.1` §24 engineering control; CLAUDE.md canonical law 20
(evidence before claims) and `<stop_conditions>` (do not invent authority documents)

## Context

The project was managed from two registers that are tracked in git but no longer exist in the
working tree:

| File | Document reference | Working-tree state (2026-10-07) |
|:---|:---|:---|
| `todo.md` | `VMNL-AZP-VMN-TODO-001 — R1.0` | deleted, uncommitted (`git status --porcelain todo.md` → ` D`) |
| `tasks.md` (old content, same path) | `VMNL-AZP-VMN-TASK-001 — R1.0` | replaced wholesale by the current register, uncommitted |

`report.md` CA-06 recorded the consequence: four living documents still pointed at the deleted
files (`docs/handoffs/LATEST.md`, `docs/audit/todo-remediation-evidence.md`,
`docs/decisions/DEC-RL1-SCOPE-001.md`, `docs/runbooks/disaster-recovery.md`), and every
`TODO-SEC-nn / TODO-SCR-nn / TODO-BCST-nn / TODO-FIN-nn / TODO-PRC-nn / TODO-GVR-nn / TODO-DOC-nn`
identifier used in source comments, tests and audit documents resolved to nothing. A third citation,
`docs/audit/evidence-register.md` → `File 1.txt §8`, named a file that has never existed in this
repository at any commit.

CA-06's instruction was to decide deliberately rather than leave a half-deleted register: restore
the registers, or make the deletion intentional and repoint all traceability to a surviving register.

## Decision

1. **`tasks.md` — `VMNL-AZP-VMN-TODO-002 — R1.0` is the single surviving engineering register.**
   It is the file every status, dependency and evidence claim resolves to.
2. **The `todo.md` deletion is deliberate, not half-applied.** `VMNL-AZP-VMN-TODO-001` is *retired*,
   not restored: its 71 items were executed in Rounds 6/6B/6C and its per-item closure notes already
   live in a tracked, living document (`docs/audit/todo-remediation-evidence.md`). The remaining
   content — the item list itself, with each item's governing clause and closure note — is
   recoverable by a command in this repository: `git show 85aad76:todo.md` — the last commit whose tree
   still carries the file. The deletion itself landed on 2026-10-15 as part of `tasks.md` TSK-09's
   owner-authorized commit series; this record is what makes that
   commit a decision rather than an accident.
3. **`VMNL-AZP-VMN-TASK-001` is superseded by this register.** Its `TASK-P<n>-<nn>` identifiers stay
   as stable historical labels (same treatment `docs/decisions/design-task-de-citation.md` gives
   `DT-nn`): they confer no status, and any live claim of completion resolves through
   `VMNL-AZP-VMN-TODO-002`.
4. **Inherited `TODO-*` identifiers are not renumbered.** They resolve through the complete census in
   `tasks.md` §1.4, which maps every retired item to one of: a live evidence row in
   `docs/audit/todo-remediation-evidence.md`, a reopening task (`TSK-nn`), or a human decision
   (`HD-nn`). `tasks.md` §1.3 remains the reopen mapping for items the audit found still open.
5. **`File 1.txt` is removed as a citation and never reconstructed.** `docs/audit/evidence-register.md`
   §Authority now names `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A` / `VMNL-AZP-VMN-CCPP-001 §8`; the former
   citation is kept only inside that file's withdrawal note.

## Enforcement

`tests/unit/register-inheritance.test.ts` (runs in `pnpm test`, therefore in CI) reads the §1.4
census as data and fails when:

- an inherited `TODO-*` identifier is cited anywhere in `src/`, `tests/`, `docs/`, `scripts/`,
  `audit.md`, `CLAUDE.md`, `tasks.md` or `report.md` and has no census row;
- a census row's resolution does not exist — a `TSK-nn` heading absent from `tasks.md`, an `HD-nn`
  absent from `tasks.md` §5, or an evidence-row label absent from
  `docs/audit/todo-remediation-evidence.md`;
- a document depends on `todo.md` as a live source instead of naming it as retired — every mention
  must carry a historical marker on its own line;
- `File 1.txt` appears anywhere outside `docs/audit/evidence-register.md`'s withdrawal note and
  this record.

## Consequences

- Traceability tags in code and tests (`TODO-SEC-08`, `TODO-BCST-03`, …) keep their meaning; nothing
  has to be renumbered and no history is rewritten.
- A new dangling inherited identifier is a build failure, not a silent drift — the failure mode that
  let CA-06 survive for a whole release cycle.
- This decision is reversible by restoring `todo.md` from git and recording a superseding decision;
  no content was discarded.
