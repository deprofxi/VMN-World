# TSK-58 box 2 — the DAM registry's unowned-asset branch is fail-closed (2026-10-12)

Register: `tasks.md` TSK-58, box 2 of 4. Boxes 1, 3 and 4 stay open and say why below.

## The defect that was closed

`listApprovedMediaAssets` scoped a tenant listing with:

```ts
all = all.filter((a) => !a.tenantId || a.tenantId === params.tenantId);   // before
all = all.filter((a) => a.tenantId === params.tenantId);                  // after  (:411)
```

The `!a.tenantId ||` disjunct treated "row has no tenant" as "row belongs to everyone", so any
asset registered without a `tenantId` — which is every seeded asset and every asset registered
through a caller that did not stamp one — was listed into **every** tenant session that asked.
The register's box cited `src/core/storage/index.ts:381`; re-opening it found `:381` is
`tenantId: params.tenantId,` in the record builder and the leak lived on the read path at `:411`
(`measurements.txt` §1 prints both). The wrong pin is corrected in the box, not silently.

## Behaviour now, as a test says it

* `tests/unit/todo-final-remediation.test.ts:1236` — a `tenant-a` call lists only the `tenant-a`
  row: not `tenant-b`'s, not the tenant-less one. An unscoped call still returns all three, which
  is what keeps server-side projections working.
* `:1327` route describe, with **signed** `BroadcastDirector` sessions (`signSessionToken` →
  `Cookie: vmnl_session=…`), because `x-test-role` mints a user with **no** `tenantId`
  (`src/api/router.ts:733`) — i.e. exactly the unscoped caller under test, so it cannot stand in
  for a tenant subject:
  * `:1386` `GET /api/v1/cms/media-assets` as `tenant-a` → 200, ids `MA-TSK58-A1`/`MA-TSK58-A2`
    only; as `tenant-b` → `MA-TSK58-B1` only.
  * `:1396` the unowned `MA-TSK58-UNOWNED` appears in no tenant's list (`tenant-a`, `tenant-b`,
    `tenant-c`), while `listApprovedMediaAssets()` and `getMediaAsset(id)` still resolve it.
  * `:1407` `GET /workspace/content/media-picker` as `tenant-b` renders its own asset id and does
    **not** contain `tenant-a`'s or the unowned id.
* The pre-existing suite is not relaxed: no assertion was deleted, and the test that *pinned the
  leak* ("scopes the picker to the session tenant plus the shared library") was rewritten to
  assert the refusal instead — that test is why the leak had a green check mark.

## Stricter than the box asked, stated rather than smoothed

The box asked for "visible to no one but a super admin". Today a SuperAdmin **session** carries
`tenantId: "vmnl-hq"` (`src/core/auth/index.ts:497`, `:557`, `:637`), so no authenticated HTTP
session of any role sees an unowned row; the only callers that do pass no scope at all — the
development bypass, the `x-test-role` harness, and server-side code reading the registry directly.
That is the fail-closed direction, and it is recorded here so nobody later reads the box as
having granted super admins a shared library.

## Cost, measured, not hidden

`MediaAssetRecord` in the local database holds **1585** rows, **1427** of them unowned (959 of
those `AVAILABLE`), and the golden backfill is the bulk of it: `src/db/seeds/dam-backfill.ts`
registers 250 masters/key-arts and `grep -c tenantId` on that file is **0**. So a normal operator
login (`vmnl-hq`) now lists **0** assets on the picker desk where it previously listed the whole
library; `src/api/router.ts:2870`, `:2915`, `:2932`, `:8148` are the four tenant-scoped read paths
affected. Paths that resolve a reference by id — EPG export, channel schedules, episode-master
linkage, review-queue badges (`getMediaAsset`, `src/core/storage/index.ts:397`) — are unchanged,
and their tests pass.

Whether the seeded library is re-homed onto a tenant, promoted to an explicit grantable
platform-library scope, or genuinely left out of tenant desks is a business decision about who owns
the master library; this increment does not invent one. It is recorded as an open question under
TSK-58 rather than resolved by a seed edit.

## Known side effect on the test database

`registerMediaAsset` stages a durable write on every registration (TSK-17), so each suite run
adds rows. The route describe deletes its four fixtures in `afterAll` (`:1382`); the unit case at
`:1236` does not — it inherits the file's pre-existing pattern, which is why `tenant-a` and
`tenant-b` each carry 78 leftover rows in the local table (`measurements.txt` §3). Cleaning the
older rows is a separate housekeeping item, not part of this box.

## What remains open in TSK-58

* **Box 1** — the closed cases are *read* routes answering a filtered 200. A refusal that is a
  filtered list is a refusal by omission; the box asks for 403/404 on a **mutating** route per
  tenant-bearing surface, and `tenantId` exists on only 3 of 43 models to begin with.
* **Box 3** — the central predicate is still unreachable: `grep canPerform(` over `src` shows
  `src/api/router.ts:769`, `:8093`, `src/api/routes/enquiry.routes.ts:25`, `:49` all omitting the
  fourth `context` argument; only `src/core/rbac/index.ts:571` forwards it internally
  (`measurements.txt` §5). Needs the owner's ruling (guard-table dimension vs. reconciling
  `docs/security/route-authorization-coverage.md` §6 with `master-data-model.md` §1).
* **Box 4** — was `tenantId` absent from the hashed audit payload
  (`src/core/audit/index.ts:124-133`) and the durable row (`:184-193`). **Closed the same day by
  TSK-18**, in `docs/audit/evidence/tsk18-durable-audit-transaction-2026-10-12/`: the payload builder
  is now `:154-165` with `tenantId` as its seventh component, the row write moved to
  `src/core/database/repositories/release-critical.repository.ts:1050-1074`, and the hashed bytes are
  stored verbatim as `changesJson.auditHashPayload`. Boxes 1 and 3 above stay open; hashing a scope
  is not enforcing one.

## Gates (same tree, 2026-10-12)

`pnpm typecheck` exit 0 · `pnpm lint` (`--max-warnings 0`) exit 0 · `pnpm build` exit 0 ·
`npx vitest run tests/unit/todo-final-remediation.test.ts` → 1 file / **84** tests, 0 failed ·
`pnpm test` → 68 files / **816** tests, 0 failed · `pnpm test:coverage` exit 0 at
79.04 / 70.5 / 82.94 / 80.33. Logs are the verbatim outputs: `typecheck.txt`, `lint.txt`,
`build.txt`, `focused-run.txt`, `full-suite.txt`, `coverage.txt`. Pin integrity for the documents
this increment re-cited was re-checked with the standing verifier
(`../doc-pin-repin-2026-10-12/measure-pin-integrity.mjs` → "checked 43 mapped pins, 0 mismatched").

Not committed and not pushed — the owner's decision.
