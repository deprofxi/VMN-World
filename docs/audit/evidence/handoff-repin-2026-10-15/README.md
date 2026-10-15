# Handoff re-pin — the 2026-10-15 verification pin (2026-10-15)

`tasks.md` rule 9 says a `file:line` pin is re-opened, not re-read, after anything shifts it. The
TSK-09 commit series shifted the whole premise of the handoff and of four other documents: they were
written while the tree was dirty and said so in the present tense. This artifact records the re-pin
and the gates measured on the tree the re-pin produced.

## What was false, and what it says now

| Document | Statement | Why it became false |
| --- | --- | --- |
| `docs/handoffs/LATEST.md:51` | "The tree is not committed — `tasks.md` TSK-09 (commit series) is deliberately deferred pending owner authorization" | the series landed: `6c44cc7 61355c6 be8dff9 99ade46 2ce8fab 85aad76 fd0d91b 88b6cb1` |
| `docs/handoffs/LATEST.md:68-74` | "`vitest.config.ts` is `??` untracked … at HEAD the test step is plain `pnpm test` … a CI checkout enforces neither the thresholds nor the serial pool settings" | `2ce8fab` tracks `vitest.config.ts` and `package.json`; `85aad76` makes `.github/workflows/ci.yml:95` run `pnpm run test:coverage` |
| `docs/handoffs/LATEST.md:11,18-21` | the pin table's 68 files / 822 tests and 78.97 / 70.16 / 82.97 / 80.32 coverage | re-measured on the committed tree: **78 / 872** and **79.09 / 70.43 / 82.92 / 80.43** |
| `docs/audit/evidence-register.md:26,102` | "not yet committed — see `tasks.md` TSK-09", "Nothing committed, nothing pushed" | same; the 2026-10-13 pin is kept and labelled as that pin |
| `tasks.md:382,449,553,602,615,682,695,845,864,886,513` | "commit series awaits TSK-09 owner authorization" / "this work is uncommitted (TSK-09 pending owner authorization) and CI has not run (TSK-06 `[B]`)" | the series is on `main`; the remaining reason those §3 exit-gate lines stay unticked is that **CI has never run** (`TSK-57`), not that the work is uncommitted |
| `tasks.md:397,918` | `TSK-06` cited as `[B]` | TSK-06 closed 2026-10-15 (`99ade46`, deploy-from-empty) |
| `tasks.md:1516,1538` | "what remains outside it is the commit series (TSK-09) and CI execution (TSK-06 `[B]`)" | both halves moved; CI remains the open one |
| `docs/domain/canonical-model.md:3`, `docs/domain/data-dictionary.md:3`, `docs/domain/systems-of-record.md:3,341` | "no authorized commit exists yet — TSK-09", "whether the migrations apply cleanly to an empty database (TSK-06, `[B]`)" | committed on 2026-10-15; deploy-from-empty verified |

## Line-count discipline

`tasks.md` is pinned at **1733** lines by six doc-to-register citations, and `docs/handoffs/LATEST.md`
is cited by line number from `tasks.md` (`:13`, `:16`, `:18`, `:21`, `:30`, `:137`, `:153`, `:167`,
`:173`, `:189`, `:211`, `:215`, `:216`, `:275`, `:315`), so both were edited line-neutrally:

```bash
wc -l tasks.md                   # → 1733 (unchanged)
wc -l docs/handoffs/LATEST.md    # → 456 (unchanged)
git diff --numstat docs/handoffs/LATEST.md   # → 19 added / 19 deleted
```

The new 2026-10-15 figures went **into** the existing pin table cells rather than as added rows, which
is why the handoff's own line numbers did not move and none of the citations above needed re-pointing.
`docs/audit/evidence-register.md` and the two `docs/domain/` headers are not line-cited, so they gained
lines (`VMNL-EV-PIN-2026-10-15` is a new block in the tier tree).

## Gates on this tree

```bash
CI=1 pnpm lint                        → exit 0   (lint.txt)
CI=1 pnpm typecheck                   → exit 0   (typecheck.txt)
CI=1 pnpm build                       → exit 0   (build.txt)
CI=1 NODE_ENV=test pnpm test          → exit 0, 78 files / 872 tests, 0 failed, 0 skipped (full-suite.txt)
CI=1 NODE_ENV=test pnpm test:coverage → exit 0, 79.07 | 70.4 | 82.92 | 80.41 (coverage.txt)
node scripts/audit-check.js           → exit 0   \
node scripts/audit-threshold.js       → exit 0    } exits.txt
node scripts/explicit-any-budget.js   → exit 0   /
```

`DATABASE_URL` pointed at the migrated, unseeded `vmnl_enterprise_gates` on `localhost:5432` and `.env`
was never sourced. Floors (`vitest.config.ts:24-29`) and every guard threshold are untouched; the
retired-register citation census stayed at **44/45** and the CCPP locator census at **29/29**
(`tests/unit/citation-integrity.test.ts` output in `guard-censuses.txt`).

## Not claimed

- **No CI green.** These are local runs. `docker info` exits 127 on this host, so `TSK-57` stays open
  and `tasks.md` §2 keeps release posture BLOCKED.
- **Nothing pushed.** `git remote -v` prints nothing; push remains the owner's decision.
- **No per-file attribution** of the 68/822 → 78/872 delta, because the earlier pin was taken on a dirty
  tree and the arithmetic would be folklore (rule 0.2).
- **`pages.pdf` is still untracked** and the guard suites were not weakened to accommodate any of this.

## The two red attempts, kept rather than discarded

Reaching the green log above took three attempts, and the two failures are part of this artifact
because they are environment facts, not code facts:

1. A `pnpm test` attempt failed `tests/unit/todo-final-remediation.test.ts > SEC-10 … memory adapter`
   after **102545 ms**; the same file run alone passed **84 tests in 7.64 s**.
2. A second attempt passed 77 files / 865 tests and then died before starting the 78th:
   `Error: [vitest-pool]: Failed to start forks worker for test files
   tests/unit/register-inheritance.test.ts`, caused by `Timeout waiting for worker to respond`, with the
   run reporting **1067.51 s** instead of the ~190 s the clean run took.

Both are the starvation mode the handoff already documents (2026-10-10: a fork waited 978 s while the
previous suite released the shared Postgres). The load here came from outside this repository — a
dev server and lint run in a sibling project held CPU through the window — and neither process was
touched. Discipline applied: one suite at a time, no `| tail`, and the failing log is overwritten only
by a run that passes for the right reason (`full-suite.txt` is the third attempt: 78 files / 872 tests,
189.51 s, exit 0). Nothing was skipped, filtered out, or given a longer timeout to make the run green.

