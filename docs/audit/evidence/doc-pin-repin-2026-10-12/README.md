# Citation re-pin sweep — 2026-10-12

**Why this exists.** TSK-11's follow-up put `buildScreenEngineSnapshot` on the render path
(`src/api/router.ts:393-429`, 36 lines) plus one import line. Every `src/api/router.ts` line
after `:392` therefore moved down by **+37**, which silently invalidated every published
`router.ts:NNN` citation written before today — the cited line still exists, still is
non-blank, and now names something else. Nothing in CI notices:
`tests/unit/canonical-model.test.ts:410` and `tests/unit/systems-of-record.test.ts:136` open
every citation they publish but only require the target line to exist and be non-blank, so the
suite stayed green across two "all gates exit 0" closures while the pins were wrong.

**Method.** Each sentence was re-opened and pinned to a fresh grep of the *symbol it names*,
not to arithmetic. That mattered: five pins were already wrong by 3–16 lines from earlier
re-pins (`:937`→`:979`, `:727` **and** `:732`→`:769` for the same call, `:680`→`:789`,
`:1093`→`:933`, `:543`→`:580`). A blanket `s/old/new/` over the register would have propagated
those errors instead of fixing them.

**Reproduce.**

```
node docs/audit/evidence/doc-pin-repin-2026-10-12/measure-pin-integrity.mjs   # from the repo root
```

It re-reads `src/api/router.ts`, opens every re-pinned citation in the seven documents, and
asserts the line still carries the symbol the sentence describes. Exit 0 = every pin resolves
to its named symbol. Current output: `checked 42 mapped pins, 0 mismatched`.

**What moved.** 39 fully-qualified `router.ts:NNN` pins and 13 bare `:NNN` continuations across
`tasks.md`, `docs/handoffs/LATEST.md`, `docs/security/route-authorization-coverage.md`,
`docs/domain/canonical-model.md`, `docs/domain/systems-of-record.md`,
`docs/domain/data-dictionary.md`, `docs/audit/todo-remediation-evidence.md`.
Five document-to-document pins moved too: `tasks.md:510` cited the §3 rights-gate exit condition
as `tasks.md:923` (a blank line; it is `:1533`), `tasks.md:586` cited the `TODO-BCST-03` census
row as `tasks.md:145` (it is `:156`), and `tasks.md:831`/`:1105`/`:1591` cited the
`LedgerPostingService` claim at `docs/handoffs/LATEST.md:19` (a blank line; the bullet is `:184`).

**What was deliberately not moved.**

| Pin | Left because |
|---|---|
| `audit.md`, `report.md` throughout | audit-time observations of the tree as found, not current-state claims |
| `docs/audit/evidence/*/README.md` | dated artifacts; each states the tree it measured |
| `tasks.md:236` `router.ts:468`, `:364` `:2496`, `:437` `:5652-5670`, `:606` working-tree pins, `:1073` "they were `:697`/`:7911`", `:1176`'s move chain | the sentence itself labels them as a former position |
| `tasks.md:1412` `router.ts:6337` | **refused, not skipped** — TSK-49 deleted the duplicate-class defect this line describes (`grep -rn 'class="[^"]*" class="' src/` → 0 hits). Re-pointing the pin at the merged-`class` line would make the sentence assert a bug that no longer exists |

**One content correction, not a number.** `docs/audit/evidence-register.md` claimed "**0 of 33**
*fully* sourced … because the router injects no engine snapshot". That became false when the
snapshot landed, so it was rewritten to the measured served census (2026-10-12,
`../tsk11-served-screen-engine-snapshot-2026-10-12/served-census.txt`): 31/33 still carry a
`NOT_CONNECTED`/`PROVISIONAL` badge, 2/33 serve a `DOMAIN_ENGINE` `SOURCE:` badge, and
**1 of 33** (SCR-BCST-20, the hydrated sponsorship audit) is fully sourced — with SCR-BCST-01's
badge-free row called out as the legacy-dashboard shadowing, not a sourced strip.

**Gates on this tree** (documents only; no `src/` change since the TSK-11 follow-up run):
`pnpm typecheck` exit **0** (`typecheck.txt`) · `pnpm lint --max-warnings 0` exit **0**
(`lint.txt`, re-run after the verifier script was added) · `pnpm build` exit **0** (`build.txt`) ·
`pnpm test` exit **0** — **68 files / 813 tests passed, 0 failed, 0 skipped**, run twice: once
before the evidence files landed (58.12 s wall, 33.18 s test time) and once on the final tree
(`full-suite.txt`: 342.86 s wall, 208.31 s test time — same 68/813, the wall difference is
external load from the ~50 `nest start --watch` processes belonging to another repository, not a
changed outcome). The doc-guard group alone: 6 files / **121 tests** (`measurements.txt`).
