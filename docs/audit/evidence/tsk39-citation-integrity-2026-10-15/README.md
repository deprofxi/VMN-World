# TSK-39 box 3 / TSK-41 box 1 — citation integrity as a CI check, and the CCPP §16 threat model (2026-10-15)

**Register:** `tasks.md` TSK-39 *(CA-22)* box 3, TSK-41 *(CA-23)* box 1 · **Depends:** TSK-39 boxes 1–2 stay open by design

## What the two boxes asked

- TSK-39 box 3: *"A CI check fails on a citation to a non-existent file/section."*
- TSK-41 box 1: *"`docs/security/threat-model.md` written (required by CCPP §16, line 1439+) before the next gate review."*

They were taken together because the second box's artifact is the first box's first customer: a
threat model is a document made almost entirely of `file:line` claims about security controls, and
every one of those claims is exactly the kind the first box says must stop being trustable.

## What was built

**`tests/unit/citation-integrity.test.ts` (5 tests).** Rule 1 is zero-tolerance on repository paths:
every path-shaped citation in `src/`, `tests/`, `docs/`, `scripts/` and `tasks.md` must resolve, with
one escape — the literal `citation:absent` annotation on that line — and a second test that refuses an
annotation which no longer sits on a genuinely absent path. Rule 2 is ratchets on the locator classes
whose clearing needs a business decision (which real CCPP section a `§x.y` claim belongs to; whether
the six absent authorities get imported; whether `AGENTS.md` is a rename of `CLAUDE.md`; whether the
retired register may still be named). Ceilings are printed on every run so the number, not the
comment, is what a reader sees. It runs in CI because CI runs the suite (`.github/workflows/ci.yml:94-95`).

**`docs/security/threat-model.md` (410 lines) + `tests/unit/threat-model.test.ts` (6 tests).** The
document is CCPP §16's prescribed shape — 19 scope sections, 24 threat blocks carrying all ten §16
fields and a STRIDE class, a 19-control inventory where every control is a `file:line` on this tree,
a status row for each of §16's 21 explicit vectors, and a §4 that states what the document does not
claim. The guard parses the scope areas and the vector list **out of the CCPP text** rather than
restating them, opens all **166** pins, checks the **67** symbol-anchored ones for the identifier
within ±3 lines, requires an `EXERCISED` row to name an instrument that exists, forbids a mitigation
that is a UI hide (§16's own output clause, asserted as a property of the document), and requires the
tally sentences to equal the measured tallies.

## What the checks caught, in the order they caught it

1. **Two live phantom sections in my own previous work** — `CCPP §374` in
   `tests/unit/todo-final-remediation.test.ts:250` and `tests/a11y/responsive.test.ts:3`. The CCPP has
   39 top-level `N. TITLE` sections and no decimals, so §374 resolves nowhere. Repointed; `grep -rn "§374" src tests docs tasks.md` → **0**.
2. **Nine un-annotated paths to deleted or never-existing files**, listed in `measurements.txt` §2 —
   three of them to `src/core/rights/index.ts`, which TSK-14 deleted, and one a runbook instruction to
   run `src/core/domain/integrity-check.ts`, a script that has never existed. The runbook now carries the
   catalog query that does the job (`SELECT count(*) FROM pg_constraint WHERE contype = 'f' AND NOT convalidated`).
   The third rights site was found on the **re-run**, after the first pass had annotated only two of three.
3. **My own §16 parsers were reading a shorter authority than the authority is**: `;$`-terminated
   matching silently returned 18 scope areas and 19 vectors instead of 19 and 21, because §16 ends each
   list's last item with a full stop. Had that shipped, the document could have passed while missing
   "third-party vendors" and "Broadcast schedule-rights bypass".
4. **A tally sentence that was wrong** — §3 claimed "six honest `PARTIAL`" where the table rows count
   **ten**. That is the same class of defect the guard exists to catch, found by counting instead of
   rereading; the guard now pins both tallies to the measurement.
5. **The suite's own inheritance guard rejecting the new file** — the first full run was red
   (`Tests 1 failed | 856 passed (857)`): my census `console.log` printed the string `todo.md` on a line
   with no historical marker, so `tests/unit/register-inheritance.test.ts:249` (TSK-07: every mention of
   the retired register must be historical) read the guard as a new dependency on a deleted register. No
   rule was relaxed; the line now says what the file is (`todo.md (the retired register, superseded by
   this one)`).
6. **One `AGENTS.md` and one retired-register mention added by my own closure prose** in this register,
   which took those two censuses to 11/10 and 46/45. The ceilings were **not** raised to accommodate the
   sentence; the sentence was rephrased to describe the counts without re-citing the files.

## Gates on this tree

`CI=1 pnpm lint` exit **0** · `CI=1 pnpm typecheck` exit **0** · `CI=1 pnpm build` exit **0** ·
`CI=1 DATABASE_URL="postgresql://root@localhost:5432/vmnl_enterprise_gates?schema=public" NODE_ENV=test pnpm test` → see `measurements.txt` §5 for the run-by-run figures, including the first red run and the repeat that closed it.

## What this does not claim

- It does not close TSK-39 boxes 1 or 2. Six authority documents are still cited as if live and 29
  decimal `CCPP §x.y` locators still name subsections that do not exist; both counts are ceilings, not
  completed work. Choosing the real locator for a claim is a business/authority decision, and a guard
  cannot make it.
- It does not claim a citation that resolves is a citation that is *true*. `file:line` existence is
  mechanical; "this line implements the control I am describing" is what the symbol-anchor rule approximates
  for `docs/security/threat-model.md`, and what Rule 9 still asks a human to do everywhere else.
- It does not clear a gate. Four §16 vectors are `NOT_EXERCISED` (payment diversion, account merging,
  agent prompt injection, agent tool abuse) and the model's `High` findings — TM-FED-02's delivery
  spoofing at `src/modules/federation/azeebo/bridge.ts:134`, the exact-`NODE_ENV` gating of cookie flags
  and the test-role harness, and TSK-58's unreachable tenant predicate — are recorded for their tracks,
  not patched here.
- It does not add a register task for the `bridge.ts:134` defect in this commit. Its Rule 2 source is the
  ADR-008 Level 4 decision record; opening a task there changes §1.1's counts, which must be re-derived by
  command rather than edited by hand, and that is done as its own change.
