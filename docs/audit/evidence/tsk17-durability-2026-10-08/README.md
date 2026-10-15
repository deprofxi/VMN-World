# TSK-17 closure gates — 2026-10-08

`tasks.md` Rule 0.1 requires a DONE claim to carry code, an executable behaviour test, the four gates
exit-0 **on the same tree**, and an evidence artifact. This directory is that artifact for TSK-17
(release-critical durability, `report.md` CA-12): the five gate outputs, the 16-test durability suite on
its own, and the migration state the two additive migrations were closed against.

**Baseline:** commit `ce098f8` plus the working-tree dirty set, reproduced by
`git status --porcelain | awk '{print $1}' | sort | uniq -c` — **120 modified / 56 untracked entries /
2 deleted = 178 paths** at the moment these files were written (the `178` does not count this
directory's own contents; re-run the command and it will, which is why the pin publishes the command
rather than the figure alone). The tree is **not committed**: TSK-09's commit series is deferred
pending owner authorization.

**Environment:** Postgres reachable on `localhost:5432` (`postgresql://root@localhost:5432/vmnl_enterprise`),
no Redis. Vitest sets `NODE_ENV=test` itself, so plain `pnpm test` is the correct command — sourcing
`.env` first exports `NODE_ENV=development` and fails ~80 route-guard tests (recorded in
`docs/audit/evidence/baseline-2026-10-08/README.md`; a measurement error, not a regression). The
restart tests additionally require the compiled `dist/` artifact, which `pnpm build` produced before
them.

| File | Command | Result |
|:---|:---|:---|
| `tsc.txt` | `pnpm typecheck` (`tsc --noEmit`) | exit 0, 0 errors |
| `lint.txt` | `pnpm lint` (`eslint . --max-warnings 0`) | exit 0 |
| `build.txt` | `pnpm build` (`tsc`) | exit 0 |
| `test-run1.txt` | `pnpm test` | exit 0 — **64 files / 705 tests passed, 0 failed, 0 skipped, 0 unhandled errors** |
| `test-run2.txt` | `pnpm test`, immediately again, same tree, same now-dirty database | exit 0 — **64 / 705**, identical |
| `test-coverage.txt` | `pnpm test:coverage` | exit 0 — 64/705 and **78.14 statements / 69.31 branches / 81.69 functions / 79.52 lines** against the pinned floors 73/62/77/72 (`vitest.config.ts`) |
| `durability-suite.txt` | `pnpm vitest run tests/unit/durability-release-critical.test.ts` | exit 0 — **16 tests passed** (each restart is a real child process booting `dist/src` against Postgres) |
| `migrations.txt` | `npx prisma migrate status` and `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` | **7 migrations found · Database schema is up to date!** · diff prints `-- This is an empty migration.` (zero drift) |

## Why the suite was run twice

TSK-17 turns process-memory stores into tables, and a table outlives the process that wrote it. That
made two older HTTP suites non-idempotent: SCR-19 minted `RSK-SCR19-1` / `ISSUE-SCR19-1` through the
now-durable governance routes and UX-GOV-002 decided the seeded `APV-2026-004`, so run 1 persisted
those rows, run 2's boot hydration loaded them back, and the fixtures collided (`[RISK-01]` → 422 on
the POST; an already-decided approval → 422). Both files now delete their own rows **before**
`app.start()` and again after the `stop()` flush, with no assertion changed. One run would not have
proved that; the second run is the measurement of the fix, which is why both logs are archived.

## What these logs do not show

- They are **development-database** measurements. Applying the two TSK-17 migrations to a clean,
  provisioned instance is TSK-06's job and remains `[B]` (no such instance is available here).
- They do not show production behaviour: no Redis, no `ALLOW_SANDBOX_FALLBACK`, no multi-worker
  deployment. The absent-database path is exercised separately — the durability suite prints a WARN and
  skips the restart claims rather than passing them (`Rule 0.4a`).
- `test-coverage.txt` contains `[VMNL-ALERT] HIGH_5XX_ERROR_RATE` lines emitted by the deliberate
  failure drills; they are the alert rule firing inside a test, not a gate failure.
