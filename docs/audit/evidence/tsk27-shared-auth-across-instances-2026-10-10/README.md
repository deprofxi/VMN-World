# TSK-27 — Adapter-first reads for auth/session stores (`report.md` CA-26, `audit.md` AUD-03/04)

Closed 2026-10-10 (code + tests) · gates re-run on the finished tree 2026-10-11 05:54–08:06 UTC ·
baseline `ce098f8` + the dirty working set (**192** `git status --porcelain` entries = 127 `M` /
63 `??` / 2 `D`, **268** individual files with `--untracked-files=all`). **Nothing here is committed
and `git remote -v` prints nothing** — commit series is TSK-09 and pushing is the owner's decision.

## The finding, in one sentence

`TODO-SEC-10` was closed on 2026-10-02 claiming "auth rate-limit/lockout stores run the adapter
seam", but `kvGetJson` read the **process Map first** and wrote the adapter second, so a wired Redis
was a write-only mirror (CA-26): instance B could not see a revocation, a lockout, an enrolment or a
spent MFA challenge that instance A had recorded.

## What changed (all pins opened in `measurements.txt`)

| Behaviour | Where |
|:---|:---|
| Adapter-first user reads; confirmed-miss repairs the local copy | `findUserByEmail` `src/core/auth/index.ts:578` |
| Registration claims its key atomically, so a race yields one account | `registerUser` `:615` → `setIfAbsent` `:644` |
| One serialization choke point for every `user:` payload (TSK-30's invariant, now shared by both writers) | `sealedUserPayload` `:265`, assert `:268`, `persistUserToSharedStore` `:272` |
| Lockout accumulates fleet-wide: `INCR` on `auth:fail:<email>`, TTL'd `auth:lock:<email>`, both deleted on success | `recordLoginFailure` `:722` (`:726`, `:731`), `getRemainingLockoutMsAsync` `:697` |
| A login MFA challenge is spendable **once per fleet** and fails closed when the shared backend errors | `consumeMfaLoginChallenge` `:79` → `setIfAbsent` `:88`, refusal `:89-90` |
| A revocation written by another instance is seen before any handler runs | `primeSessionRevocation` `:434` → `primeRevocationFromSharedStore` `src/core/auth/sessions.ts:203`, awaited at `src/api/router.ts:1111` |
| The raw-token / token-id contract violation that made logout revocations unmatchable | `src/api/router.ts:1427` + `:1430`; the dead `isTokenIdRevokedAsync` is deleted |
| Memory KV refuses to boot in production-like environments, as a unit-tested function | `assertSharedKvBackendForEnvironment` `src/core/cache/index.ts:210`, called `src/api/server.ts:137` |
| An unreachable shared backend takes the pod out of rotation | `/readyz` `src/api/router.ts:3559`, decision `:3570-3572`, `kvGating` `:3593` |

Deleted rather than left presenting as a control: `kvGetJson`, `kvSetJson`, `kvDelJson`,
`isTokenIdRevokedAsync` (`grep` counts are in `measurements.txt`).

## Tests

`tests/unit/auth-shared-across-instances.test.ts` — **12 tests**, two simulated instances bound to
one `MemoryKeyValueAdapter` through the `_resetSharedAuthStateForTesting` seam
(`src/core/auth/index.ts:235`). The behaviour it proves, not the mocks it uses:

- three wrong passwords spread across two instances lock a **third** instance that observed none of
  them, on the **correct** password (`lockedForMs > 0`);
- a successful login clears the shared counters for every instance;
- an MFA challenge is accepted once fleet-wide and refused everywhere after; a `setIfAbsent` that
  throws refuses the login rather than falling back;
- a registration race against the same address fulfils exactly one promise;
- revocation is honoured across instances from **both** writers (`revokeToken`, `revokeSessionById`)
  and when the record is written straight to the KV, bypassing every in-process Map;
- `assertSharedKvBackendForEnvironment` matrix (production/staging × memory/redis × opt-out);
- a `WITH_DB` boot against an unreachable Redis returns **503** with `kvHealthy: false`,
  `kvGating: "enforced"`, then **200** under `KV_READINESS_GATING=false`;
- three source-wiring assertions pin the seams a later "simplification" would silently drop (the boot
  guard call, the entry-point prime, the awaited MFA claim).

`tests/unit/auth.test.ts` — 15 tests (the challenge-consumption test converted to the async claim).

## Gates, same tree, serial, output to files (never piped through `tail`)

| Command | Exit | Measured |
|:---|:---|:---|
| `pnpm typecheck` | 0 | `typecheck.txt` — 0 errors |
| `pnpm lint` (`--max-warnings 0`) | 0 | `lint.txt` |
| `pnpm test` | 0 | `full-suite.txt` — **66 files / 765 tests passed, 0 failed, 0 skipped**, 550.16 s |
| `pnpm test:coverage` | 0 | `coverage.txt` — **66 / 765**, **78.65 stmts / 70.10 branch / 82.38 funcs / 79.94 lines** against floors 73/62/77/72, 391.63 s |
| `pnpm build` | 0 | `build.txt` |
| `npx vitest run` auth + register + doc guards | 0 | `focused-run.txt` — **5 files / 53 tests** |
| `npx vitest run` the four document-guard suites after the final re-pins | 0 | 4 files / **107 tests** (`systems-of-record`, `canonical-model`, `register-inheritance`, `todo-final-remediation`) |

`coverage-attempt1-contended.txt` is kept, not deleted: the first coverage attempt failed one test
(`tests/unit/security-auth-rbac.test.ts:90`) with *Test timed out in 60000ms* after the fork had been
waiting 978 s, in a window where the previous full suite's teardown was still releasing the shared
Postgres — the run's own import phase measured 959 s, which is machine starvation, not application
behaviour. The re-run on an idle machine passed the same 66/765. Stated because Rule 0.4a forbids
reporting only the green run.

## Register and document fallout closed with this item

- `tasks.md` §1.3 and §1.4: `TODO-SEC-10` → **CLOSED**; the inherited-ID census re-measured to
  **CLOSED 61 · REOPENED 1** (`TODO-BCST-01`→TSK-11), and `tests/unit/register-inheritance.test.ts`'s
  reopened expectation narrowed to match — the assertion was not relaxed, it still requires every
  remaining reopen row to name a task that carries an unresolved box.
- `docs/audit/journey-readiness-matrix.md:17` identity cell rewritten from "in-memory sandbox …
  Redis adapter = TODO-SEC-10" to what is now true, including the half that is not.
- `docs/handoffs/LATEST.md`: new TSK-27 entry; `src/api/server.ts:328` → `:325`; webhook stamp cites
  → `router.ts:7863` / `:7955`.
- Citation repair forced by this change set (every one re-measured, none deleted to make a guard
  pass): `src/api/router.ts` line **3559** split into two statements shifted every later line by +1, so
  20+ published pins across `tasks.md`, `docs/domain/{canonical-model,systems-of-record,data-dictionary}.md`
  and the handoff were re-opened and re-pinned; four of them were *already* silently wrong
  (`:7819`/`:7911` → `:7839`/`:7931`, `:7443` → `:7454`, `:6846` → `:6936`) and are corrected to truth,
  not to "+1".

## Limits this closure does not hide

1. **The rate limiter is still per-process.** `checkRateLimit` (`src/core/auth/index.ts:223`) is
   deliberately not mirrored: a write-only mirror would read as a shared limit while counting per
   instance. `TODO-SEC-10` closes on the stores CA-26 named; the shared limiter stays under **TSK-20**
   with its `M` label.
2. **Identity is still not the `User` table.** `grep -rn "prisma.user" src/` → **0** runtime writes;
   the durable copy of a user is the sealed `user:<email>` KV record, and KV is a cache-tier store
   whose durability depends on the deployment's Redis persistence settings.
3. **Redis was not reachable for these runs.** The multi-instance proof runs two instances over one
   `MemoryKeyValueAdapter`; the Redis-backed paths are asserted through the injected
   `MinimalRedisClient` fake and the unreachable-backend boot test. A real two-pod-one-Redis drill
   belongs to TSK-57's Docker Compose environment, not to this suite.
4. `KV_READINESS_GATING=false` is an operator opt-out, mirroring the pre-existing
   `STORAGE_READINESS_GATING` contract. With it set, a dead shared backend no longer blocks traffic.
