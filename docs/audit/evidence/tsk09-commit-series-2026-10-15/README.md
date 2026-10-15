# TSK-09 — the working tree landed as a concern-separated commit series (2026-10-15)

TSK-09 is `report.md CA-27`: the register's own commits pinned SHAs that did not
contain the work they described, because the tree had been accumulating for a
week without landing. This artifact records what was measured before and after
the series, in the order the commands were run.

## The claim, measured rather than asserted

A probe over each revision's own tracked files (`git ls-tree -r <rev>` for the
file list, `git show <rev>:<path>` for the contents, relative `from "."` imports
resolved against that same list) printed:

```
rev 61355c6: tracked src/tests files importing something absent at that rev: 10
rev 85aad76: tracked src/tests files importing something absent at that rev: 0
```

So immediately before this series, ten modules that tracked code imported did
not exist in the repository at all: a fresh checkout could not `pnpm build`, and
every CI step after `pnpm install --frozen-lockfile` was unreachable. On disk the
same gap read as **15** absent modules, because the dirty working tree referenced
more than the committed code did. 60 new files landed here (18 under `src/`,
30 under `tests/` and `scripts/`, 12 under `prisma/`).

## The series

| Commit | Concern | Content |
| --- | --- | --- |
| `be8dff9` | runtime source | durable journal + release-critical/rights repositories, the rights consolidation (including the deliberate deletion of the parallel `src/core/rights/index.ts`), extracted route/schema modules, broadcast exception/EPG paths, client bundle / public route registry / generated utilities |
| `99ade46` | schema | eleven untracked migration directories + `migration_lock.toml` + `prisma.config.ts` |
| `2ce8fab` | verification | the suites the register cites as gates, their helpers, `vitest.config.ts`, the three new gate scripts, `package.json` + lockfile |
| `85aad76` | CI / container | SHA-pinned actions, `permissions: contents: read`, coverage + audit + any-ratchet steps, image build and Trivy scan, `.dockerignore`, `.trivyignore`, `.env.example` placeholder hygiene, `docker-compose.yml` |
| the two commits that close this row | **domain-doc instrument** — `tests/unit/state-machine-doc-pins.test.ts` (7 tests, TSK-41 box 2) plus the drift it found in `docs/domain/state-machines.md`, and `docs/decisions/DEC-CCPP-SECTION3-STRUCTURE-001.md` (box 3). **register + docs** — the register closures, the documents the closures cite, the 17 previously-untracked evidence archives, the recorded deletion of the retired `todo.md` register, and the two guards that pin its recovery command (`tests/unit/register-inheritance.test.ts`, `tests/unit/citation-integrity.test.ts`) re-pointed at `85aad76`, the last commit whose tree carries the blob. |

The gate numbers above are the **final** tree, not the code tip: the guard's 7
tests and the probe's `.cjs` → `.mjs` rename (the repo's lint config gives Node
globals to `**/*.mjs` only, so the archived helper was a lint failure until it
was renamed — the fix was the rename, not a config exception) both landed after
`85aad76`, which is why this census reads 78/872 where the code tip read 77/865.

## Gates on the tip of the code series

| Gate | Result |
| --- | --- |
| `CI=1 pnpm lint` (`--max-warnings 0`) | exit 0 |
| `CI=1 pnpm typecheck` | exit 0 |
| `CI=1 pnpm build` | exit 0 |
| `CI=1 … NODE_ENV=test pnpm test` | 78 files / 872 tests passed, 0 skipped, exit 0 (`full-suite.txt`) |
| `CI=1 … pnpm test:coverage` | exit 0 — **79.09 statements / 70.43 branches / 82.92 functions / 80.43 lines** against floors 73 / 62 / 77 / 72 (`test-coverage.txt`) |
| `node scripts/audit-check.js`, `audit-threshold.js`, `explicit-any-budget.js` | each exit 0, re-run on the final tree (`exits.txt`) |
| `prisma migrate deploy` on an empty scratch database | exit 0, **13** migrations applied, **44** public tables (`migrate-deploy-from-empty.txt`); the scratch database was dropped afterwards |

`vitest.config.ts` is what makes TSK-44's coverage floors real in CI, and it was
committed only after the coverage run above cleared them — committing it against a
failing number would have handed the next person a red pipeline instead of a gate.

## Not claimed

- **Nothing was pushed.** `git log` is local; push is the owner's decision.
- **Intermediate commits are not independently green.** The split is by concern,
  as the box asks; after `be8dff9` the source has no tests or migrations beside it
  yet. The gates above were measured on the tip, and the tree they were measured
  on is the tree that landed.
- **The `docker build` and Trivy steps are definitions, not proofs.** `docker
  info` on this machine exits 127 (`command not found`) — no Docker binary — so
  TSK-57's eleven boxes, including "verified by an actual `docker compose up`",
  stay open. Committing a CI step nobody ran is exactly the kind of claim this
  register has been built to retract, so it is stated here instead of ticked.
- **`pages.pdf` was deliberately left untracked.** It is the output of
  `scripts/generate-pages-pdf.mjs`; nothing in the register cites it, and
  generated binaries in history would be a permanent cost with no evidence value.
- **`.env` remains untracked.** `git check-ignore -v .env` → `.gitignore:65`
  (the `*.env` rule). The box text pins `:60`, which drifted; re-pinned at
  closure rather than left pointing at an unrelated rule.
- **The register's `.log` blind spot is unchanged.** `.gitignore:3` is `*.log`,
  which is why every artifact in this directory is `.txt`; the TSK-06 closure
  note records the earlier rename for the same reason.
