# TSK-38 — stale registers and the removed phantom authority citation (2026-10-14)

**Register:** `tasks.md` TSK-38 *(CA-25)* · **Depends:** TSK-08

## What the box asked

`docs/audit/evidence-register.md:4` carried `File 1.txt §8` as an authority citation. That file has
never existed in this repository (verified and recorded in
`docs/decisions/DEC-REGISTER-SURVIVOR-001.md`, per TSK-07). The box required the citation fixed.

## What was found when the box was re-opened on 2026-10-14

The work had **already landed and was already guarded** — the box had simply been left unchecked.
Verified on the current tree, not from memory:

- `docs/audit/evidence-register.md:4` now reads
  `**Authority:** VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMNL-AZP-VMN-CCPP-001 §8`, and lines `:5-7`
  carry the removal record explaining that the `File 1.txt §8` citation names a file that never
  existed and is removed per TSK-07.
- `tests/unit/register-inheritance.test.ts` keeps it closed with three separate assertions:
  - `:252-263` — the string `File 1.txt` may appear nowhere in the repository except the two removal
    records, and even there only inside a window that says `never existed | withdrawn | removed`;
  - `:269` — the evidence register's `**Authority:**` line must **not** contain the removed phantom citation;
  - `:270` — that line must name a document that exists (`VMNL-AZP-VMN-CCPP-001`).

Reproduce:

```
CI=1 NODE_ENV=test pnpm vitest run tests/unit/register-inheritance.test.ts
```

## Honest accounting

- The box is closed by **citing the assertions that enforce it**, not by new edits. Nothing in
  `docs/audit/evidence-register.md` was re-written today; the only change to TSK-38's text in the
  register is the evidence line itself.
- All three TSK-38 boxes are now `[x]`. This artifact closes only the third; the first two were
  closed on 2026-10-13 (TSK-20's matrix re-write) and 2026-10-07 (TSK-24's screen census).
- CCPP `§8` is a *real* top-level section (the authority is numbered `N. TITLE`, sections 0–38).
  The decimal phantoms (`§2.2`, `§4.1`, `§5.2`, `§7.7`, `§1.4`, `§1.5`) are TSK-39's problem, not
  this box's, and are untouched here.
- Full-suite state at the time of this closure: **73 files / 841 tests passed, 0 failed, 0 skipped**,
  `pnpm build` exit 0, `pnpm typecheck` exit 0, `pnpm lint` exit 0, on an unseeded
  `vmnl_enterprise_gates` database.
