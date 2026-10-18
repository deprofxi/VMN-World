# Baseline pin `VMNL-EV-PIN-2026-10-18` — full battery on the working tree

**Measured:** 2026-10-18, on this checkout.
**Purpose:** re-establish a single reproducible baseline over the whole verification battery
(`tasks.md` §0.2 — no figure may be published that a command in this repository cannot reproduce),
and re-pin `docs/handoffs/LATEST.md` and `docs/audit/evidence-register.md` to numbers that come
from logs in this directory rather than from memory.

## Tree measured

| Property | Value | Reproducing command |
|:---|:---|:---|
| `HEAD` | `37d0007602fdc738e4971189ffc61689cd047082` (`37d0007`, branch `main`) | `git rev-parse HEAD` |
| Dirty set | **62 entries** = 43 modified + 19 untracked, *excluding this directory*; expanded `git ls-files --others --exclude-standard` = **23 untracked files** | `git status --porcelain \| grep -v 'baseline-2026-10-18' \| wc -l`; histogram below |
| Histogram | `43 M` · `19 ??` (this directory excluded) | `git status --porcelain \| grep -v 'baseline-2026-10-18' \| awk '{print $1}' \| sort \| uniq -c` |
| Tracked diff | 43 files changed, +1,654 / −275 | `git diff --shortstat` |
| Tracked diff SHA-256 | `4e56d657db0268d727a1039e5937827b1278e38bd9f24f65c2c794b4629fb158` | `git diff \| shasum -a 256` |
| Status SHA-256 (excluding this dir) | `e815f503b2b374363e3e433766ad771a7b34cbdfe94c2f5d3090f58daee2ae66` | `git status --porcelain \| grep -v 'baseline-2026-10-18' \| shasum -a 256` |
| Untracked list SHA-256 (excluding this dir) | `2ea49f1c8a6d211a2aaa9c882dc91635474eeb94f6b05b8387d78bfdce05b25c` | `git ls-files --others --exclude-standard \| grep -v 'baseline-2026-10-18' \| shasum -a 256` |
| The dirty set itself | `dirty-set.txt` | verbatim `git status --porcelain`, this directory excluded |

The three SHA-256 values are stable with respect to this directory's own contents, because the
`grep -v` removes every path under `docs/audit/evidence/baseline-2026-10-18/` before hashing: the
pin can be re-derived on a tree that already contains these artifacts.

**This tree is NOT committed.** Every figure below describes `37d0007` plus an uncommitted working
set, so nothing here is a commit-pinned green (`tasks.md` §0.1). It is a working-tree pin, labelled
as such everywhere it is cited.

## How the logs were produced

Each log is a verbatim capture of one command, with the exit code recorded *inside* the file by
the shell that ran it — never read back through a pipe, so the archived `EXIT_CODE` is the
command's own status rather than a filter's:

```sh
{ echo '$ pnpm test'; pnpm test; echo "EXIT_CODE=$?"; } > docs/audit/evidence/baseline-2026-10-18/test.txt 2>&1
```

The battery was run **three times** on 2026-10-18, and the sequence is the point: an earlier run
(figure trail preserved in `docs/handoffs/LATEST.md`) went green on a pre-ratchet tree; the next
run (`focused-red.txt` + the first `test.txt`) went **2-red on the completed tree** —
`tests/unit/threat-model.test.ts` caught four `src/api/router.ts` citations in the §16 threat model
whose lines had shifted +6 under this tree's own `router.ts` edits (the citation guard doing
exactly its job — `docs/security/threat-model.md` re-pinned to `:3720`/`:7869`/`:7968`/`:8117`),
and `tests/unit/screen-register-verification.test.ts` failed its `beforeAll` with a 10 s `/` probe
timeout under full-suite load (re-run isolated: 7/7, `focused-rerun.txt` — the documented
contention class, not behaviour). The logs in this directory are the **third, final-tree run**
after both fixes, with `final-battery.txt` recording `pnpm test` exit 0 in 192 s and
`pnpm test:coverage` exit 0 in 274 s. Superseded figures (test 421.36 s, coverage 554.06 s,
branches 70.80, browser 2.1 m) stay in the handoff's trail rather than here, which is exactly the
run-to-run variation the racy-figures table below names.

## Battery

| # | Command | Exit | Key output | Log |
|:-:|:---|:-:|:---|:---|
| 1 | `pnpm typecheck` | **0** | `tsc --noEmit` + `tsc --noEmit -p tests/browser`, 0 errors | `typecheck.txt` |
| 2 | `pnpm lint` | **0** | `eslint . --max-warnings 0`, 0 problems | `lint.txt` |
| 3 | `pnpm run audit:check` | **0** | 0 advisories; 6 historical records registered | `audit-check.txt` |
| 4 | `pnpm run audit:threshold` | **0** | critical 0 / high 0 / moderate 0 / low 0 | `audit-threshold.txt` |
| 5 | `pnpm run any:budget` | **0** | `explicit-any occurrences in src: 108 (budget 108)` — PR-27 ratchet from 135, measured after 26 `catch (err: any)` annotations were replaced by typed `err: unknown` boundaries and `instanceof Error` narrowing | `any-budget.txt` |
| 6 | `pnpm build` | **0** | `tsc` compiled to `dist/` | `build.txt` |
| 7 | `node dist/src/cli/index.js gates:check` | **1** | refuses: manifest `ca303f0` ≠ `HEAD 37d0007` | `gates-check.txt` |
| 8 | `pnpm test` | **0** | **85 test files / 951 tests passed, 0 failed, 0 skipped** (171.94 s) | `test.txt` |
| 9 | `pnpm test:coverage` | **0** | **79.47 statements / 70.77 branches / 83.39 functions / 80.77 lines** vs floors 73 / **70** / 77 / 72 (245.46 s) — branch floor raised 62 → 70 with its own measurement (PR-27) | `test-coverage.txt` |
| — | `npx vitest run tests/unit/threat-model.test.ts tests/unit/screen-register-verification.test.ts` | **1 → 0** | the first-attempt reds (above), then green after the citation re-pin and an isolated screen-register run | `focused-red.txt`, `focused-rerun.txt` |
| — | 13 doc-guard suites (every suite that reads `tasks.md`/docs, re-run after the handoff and threat-model edits) | **1 → 0** | 197/198 passed in the parallel run with two contention reds on a loaded machine (PR-07's TLS-wire capture race `expected 0 to be greater than 0`, and the same `/` probe timeout); each re-run isolated: PR-07 31/31, screen-register 7/7 — and both suites are green in the final full battery above | `doc-guards.txt` |
| 10 | `pnpm test:browser` | **0** | **13 passed**, 0 failed (2.9 m, Playwright chromium against the built server) | `test-browser.txt` |

**Row 7's exit code 1 is a control working, not a regression.** `gates:check` fails closed on manifest/HEAD
divergence by design (`src/cli/index.ts`, the PR-03 fix). It clears only when
`release-manifest.json` is re-pinned to a commit that carries the work (`scripts/repin-manifest.mjs`,
run after the working set is committed) or when `--allow-sha-drift` is passed as an explicit,
loudly-recorded override. CI deliberately runs the gate **without** that override.

## Racy figures — reproducible by command, moveable by the tree

These numbers are facts about *this* tree on *this* day. They are published with the command that
regenerates them; none of them may be quoted as a standing constant.

| Figure | Value today | Reproduces with | Moves when |
|:---|:---|:---|:---|
| Test files / tests | 85 / 951, 0 skipped | `pnpm test` | suites are added, renamed or re-sharded; it has grown 78/872 → 81/886 → 85/951 since 2026-10-15 |
| Explicit-`any` count | 108 of budget 108 | `pnpm run any:budget` | any `any` is added or removed in `src/` — ratcheted 135 → 108 on 2026-10-18 (PR-27) and only ever allowed to fall |
| Coverage percentages | 79.47 / 70.77 / 83.39 / 80.77 | `pnpm test:coverage` | moves in hundredths between runs of one tree on the shared Postgres (the first run of this pin read 70.80 branches); the branch floor **was** moved — 62 → 70, together with the measurement that clears it (PR-27), never to meet one that didn't |
| Browser spec count | 13 tests / 3 specs | `pnpm test:browser` | specs are added under `tests/browser/` |
| Full-suite wall time | 172 s (test), 245 s (coverage) | the logs above | machine load — the same pin took 344 s / 316 s earlier the same day, and an earlier tree took 293 s for the same 951 tests |

## Deliberately not run here, and therefore not claimable

| Step | Why not | Blocked on |
|:---|:---|:---|
| `docker build`, Trivy image scan, SBOM generation, `docker compose up` | `docker info` exits 127 on this host — no Docker binary | a Docker-capable host (`TSK-57`) |
| gitleaks secret scan | runs as a GitHub Actions step, not a local script | a configured remote (`PR-02`, `TSK-57`) |
| GitHub Actions `verify-and-test` run | **`git remote -v` prints nothing** — no pipeline has ever seen this code | the owner adding a remote and pushing |

A local green is not a CI-verified green (`docs/handoffs/LATEST.md`, `tasks.md` §1.2). This pin
makes no CI claim.

## Environment recorded with the pin

- Postgres reachable on `localhost:5432`; Vitest's `tests/global-setup.ts` provisions its own
  `<db>_test` database, so the suite does not depend on the development database's seed state.
- `NODE_ENV` left at Vitest's own `test` value; sourcing `.env` first exports
  `NODE_ENV=development` and fails ~80 guard tests — an environment fact, not a regression
  (`tests/helpers/test-database-url.ts`).
- No Redis; no MinIO; `docker info` → 127 (above).

*Every figure in this file is regenerable from the logs beside it. Nothing here is a commit pin,
and nothing here is a CI green.*
