# Baseline gate logs — 2026-10-08

`docs/audit/evidence-register.md`'s Tier S2 pin and `tasks.md` §7 require the four gate outputs to be
archived as an artifact, not merely quoted in prose. This directory is that artifact, written at the
2026-10-08 re-pin (TSK-08; the figures here are the ones TSK-52 box 1 and TSK-53 closed on).

**Baseline:** commit `ce098f8` plus the working-tree dirty set — **114 modified / 51 untracked entries /
2 deleted = 167**, reproduced by `git status --porcelain | awk '{print $1}' | sort | uniq -c`. Those 51
untracked entries include whole new directories (`docs/security/`, `src/api/routes/`, this one), so
`git status --porcelain --untracked-files=all` expands the set to **184** individual paths; both figures
are published because the first is the command the pin names and the second is the count of files that
would actually be added. The tree is **not committed**: TSK-09's commit series is deferred pending owner
authorization, so this pin names the dirty set instead of asserting a clean status.

**Environment:** Postgres reachable on `localhost:5432`; `NODE_ENV=test` is set by Vitest itself, so
plain `pnpm test` is the correct command (sourcing `.env` first exports `NODE_ENV=development`, which
disables the `x-test-role` path in `resolveSessionUser` and fails ~80 guard tests — a measurement
error, recorded so it is not chased again).

| File | Command | Result |
|:---|:---|:---|
| `tsc.txt` | `npx tsc --noEmit` | exit **0**, 0 errors (2026-10-07 morning: 152 errors across 3 files) |
| `build.txt` | `pnpm build` | exit **0** |
| `lint.txt` | `pnpm lint` (`eslint . --max-warnings 0`) | exit **0** |
| `test.txt` | `pnpm test` | exit **0** — **63 test files / 689 tests passed, 0 failed, 0 skipped, 0 unhandled errors** |

**Not claimed by this artifact:** that CI executed (it has not — TSK-06 is `[B]`), that the migrations
deploy to a fresh database in this environment (TSK-06, evidence in `../migrations-2026-10-07/`), or
that these logs correspond to a commit SHA. Rule 0.4a: sandbox state and an uncommitted tree are not
persistence, which is exactly why the dirty-set count is published rather than hidden.
