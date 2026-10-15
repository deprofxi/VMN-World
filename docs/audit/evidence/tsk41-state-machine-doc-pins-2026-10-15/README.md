# TSK-41 box 2 — `docs/domain/state-machines.md` is re-opened by a guard, not by reading it

Box 2's defect was not that the document was wrong when written. It was that
nothing re-opened its pointers after the code moved, which is exactly how CA-14
and CA-23 happened elsewhere: an aspirational lifecycle published as a measured
one. `tests/unit/state-machine-doc-pins.test.ts` (7 tests) is now that re-opening.

## What the guard enforces

1. every `` `path.ext:NN` `` citation resolves to a **non-blank line inside the cited file** —
   both endpoints of a `:NN-MM` range and every `:NN,:MM` continuation, because a block that grew
   has slid;
2. every `` `[TAG]` `` `` `:NN` `` pin points at a line that actually carries that tag in `src/`
   (±1 line tolerance, so a one-line insertion does not read as a false statement);
3. every camelCase `` `symbol` `` `` `:NN` `` pin points at a line carrying that symbol;
4. §1.2's "eleven transitions" is counted from the table, and §8's "49 refusal codes" is counted
   from `src/modules/broadcast/versions/index.ts` with the same regex §8's own command uses —
   `SCHED-VAL-05` and `SCHED-REC-03` are asserted **absent**, because the document claims they are
   historical codes no longer raised;
5. §8's `Durable` column is cross-checked against `registerDurableStore<T>("name", …)` call sites
   and `prisma/schema.prisma`, so a row cannot say "durable" for an entity no store persists;
6. §8's three re-measure commands are re-implemented and must still print what the prose says.

## Census, printed on every run

```
[state-machine-doc-pins] 30 path:line citations · 54 [TAG] pins · 12 symbol pins · 11 §8 rows · 49 refusal codes · 15 durable stores
```

The four thresholds (30/54/12/11) are **this measured census**, not a number chosen to make the
test pass — the document may not shrink its own evidence base below what it publishes today, and
Rule 0.3 is why no threshold was lowered to accommodate a finding.

## What the first run found (all drift in the document; the guard was never edited to absorb it)

* **4 stale §8 durability rows** — three still described an in-memory `Map` as the store after
  TSK-17 registered durable stores, and one named a store the process does not register;
* **8 pins that had slid** off their code, including two §1.2 guard pins whose host lines moved
  when the rights consolidation landed;
* **2 unresolvable relative-short citations** (`` `index.ts:NN` `` with no directory, which resolves
  to nothing without a repo-wide search);
* **3 sentences carrying pre-TSK-17 claims** that the census had already contradicted.

## Not claimed

* That any machine is *correct* — that is the domain suites' job (`tests/unit/broadcast.test.ts`,
  `tests/unit/case-lifecycle.test.ts`, …). The guard proves the document is **written from the
  code**, which is the box's actual words.
* That a durable store survives a restart in a given deployment — TSK-17's durability suites
  measure that, and each runs its loop through a **second OS process**.
* That the floors are ceilings: a future document may publish more pins than 30/54/12; the guard
  only refuses fewer.

## Reproduce

```bash
CI=1 NODE_ENV=test npx vitest run tests/unit/state-machine-doc-pins.test.ts   # guard-run.txt
```

Box 3's artifact is `docs/decisions/DEC-CCPP-SECTION3-STRUCTURE-001.md`, which records the measured
directory census and the three prescribed areas deliberately **not** created.
