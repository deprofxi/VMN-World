# TSK-58 box 1 — cross-tenant refusal proven through HTTP routes (2026-10-15)

Closes the first box of `tasks.md` TSK-58 ("Tenant scoping is unreachable from
the central authorization point"). The box asked for cross-tenant refusal
**through an HTTP route**, at least one mutating and one reading route per
tenant-bearing surface, asserting 403/404 for a foreign-tenant subject.

The three tenant-bearing models are `MediaAssetRecord`, `Organisation` and
`UserRole` (the only `tenantId` columns in `prisma/schema.prisma`).

## What was reachable before this change

Both vectors are on the DAM registration route, `POST /api/v1/cms/media-assets`,
which takes the object key from the request body:

1. **Namespace squat.** `generatePresignedUploadUrl` signs uploads into
   `tenants/<session tenant>/` (`src/core/storage/index.ts:142`). The
   registration route never compared the submitted key against the session's
   own namespace, so tenant B could register a row whose key pointed into
   tenant A's prefix.
2. **Read-through-write.** The registry's idempotency branches return the
   *existing* record when the submitted `assetId` or `assetKey` already exists
   (that is the SCR-03 backfill semantics). With no ownership check, a tenant B
   call that re-posted tenant A's key received **201 with tenant A's whole
   record** — title, MIME, size, checksum, provenance, registrant.

The CMS editor was the read-by-reference variant: `[CMS-11]` validated that a
`mediaAssetId` was registered and AVAILABLE, never *whose* it was, so tenant A
could attach tenant B's master to its own revision, and the review queue would
then render that asset's title and provenance to tenant A
(`src/web/workspace/media-picker.ts:85`).

## What changed

| File | Change |
| --- | --- |
| `src/core/storage/index.ts:352` | `TENANT_KEY_NS` — the namespace shape the presigner writes |
| `:361-366` | `assertTenantOwnership` — `[MEDIA-ASSET-07]` for a row that is not the caller's |
| `:379-383` | namespace check before any idempotency lookup runs |
| `:389`, `:395` | both idempotency branches now refuse instead of returning the foreign row |
| `src/api/router.ts:8134` | `[MEDIA-ASSET-07]` maps to **403** `CROSS_TENANT`; every other gate keeps its 422 |
| `src/core/content/index.ts:33` | `requireRegisteredMediaAssets(ids, tenantId)`; a foreign id gets the **unknown-id message** |
| `:152`, `:196` | `createContent` / `editContent` pass the scope through |
| `src/api/router.ts:4704`, `:4743`, `:4774`, `:4813` | the four content mutation routes pass `user.tenantId` |

`src/api/router.ts` edits are single-line replacements: the file is still 8245
lines, so the register's published `router.ts:NNNN` pins did not move — outside
the point-in-time evidence logs that is 90 occurrences / 73 distinct locators
(`grep -roE "src/api/router\.ts:[0-9]+" tasks.md docs --include='*.md'`).

## Tests

`tests/unit/tenant-scoping-routes.test.ts` — 8 cases, real HTTP against a booted
server on port 4281, **signed** tenant sessions (`x-test-role` mints a user with
no `tenantId`, `src/api/router.ts:733`, i.e. exactly the unscoped caller, so it
cannot stand in for a tenant subject). JSON writes carry a CSRF cookie + header
pair (`src/api/router.ts:1182`), which is why an earlier draft of this file saw
403s for the wrong reason.

- namespace squat → 403 `MEDIA-ASSET-07`, and the row was **never created**
  (asserted against the unscoped registry, not against the caller's filter);
- foreign-key re-registration → 403, no foreign bytes in the body, tenant A's
  row untouched, no twin minted;
- explicit foreign `assetId` → refused at the domain seam (the route ignores
  `body.assetId`, so this is not an HTTP vector today — recorded, not padded);
- the tenant's **own** key → still 201, proving the guard is not a blanket no;
- unowned platform row → cannot be adopted through the write route, which
  extends box 2's fail-closed *read* rule to writes;
- `POST /api/v1/workspace/content` with a foreign id → 422 whose message equals
  the unknown-id message after substituting the id (no existence oracle);
- `PUT /api/v1/workspace/content` with a foreign id → 404, and the tenant's own
  id still binds (200);
- `GET /portal/client/organisations/org-dangote/projects` → **403** for a
  foreign-tenant non-staff subject, **503** for a staff-shaped one.

## Fixture data corrected, not gate weakened

`tests/unit/todo-final-remediation.test.ts:1237-1239` registered a row with
`tenantId: "tenant-a"` under the key `tenants/t-1/masters/…`, and a `tenant-b`
row under `tenants/t-2/master.mp4`. Those fixtures' key namespace and tenant id
disagreed, which is precisely the combination the new guard refuses. The keys
now name their own tenant (`tenants/tenant-a/…`, `tenants/tenant-b/master.mp4`).
Every assertion in that test is unchanged: the counts, the titles, and the
fail-closed rule it exists to prove.

## Not claimed

- `UserRole`'s `tenantId` has no HTTP writer —
  `grep -rn "userRole\." src/api/router.ts src/core/rbac/index.ts` → 0 hits — so
  that surface is recorded rather than tested against an absent route.
- The central predicate `src/core/rbac/index.ts:531-535` is still bypassed by
  every `canPerform` caller that omits `context`. That is box 3, and it needs the
  owner's ruling on the guard table's shape.
- Re-homing the platform's unowned library onto tenants (or granting it as a
  scope) is unchanged; the new guard refuses adoption only.

## Gate logs (same tree)

`lint.txt`, `typecheck.txt`, `build.txt` (`CI=1 pnpm <gate>`, each exit 0) and
`full-suite.txt` (`Test Files 77 passed (77) · Tests 865 passed (865) · exit 0`,
Postgres `vmnl_enterprise_gates`).

`measurements.txt` §6 records the two guards this increment first tripped and how
each was answered: the bracketed-tag census in `data-dictionary.md` §7 moved
183→184 because `[MEDIA-ASSET-07]` is a genuinely new distinct tag, and
`tests/unit/systems-of-record.test.ts:196` caught a symbol pin this change shifted
out of place. Both were re-measured and re-pinned; no expectation was widened. The
same section lists the four further documents whose `src/core/content/index.ts`
pins this change and TSK-17's insertions had shifted — unguarded, therefore red
nowhere, therefore wrong — including `docs/domain/state-machines.md` §4's
"In-memory `Map` …, no DB model", a false persistence claim that now names
`ContentItemRecord` / `ContentRevisionRecord`.
