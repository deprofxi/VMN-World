# Route authorization coverage (TSK-28 / TSK-29 / TSK-26)

Measured 2026-10-07. Every figure below is printed by a test in this repository;
none is transcribed from the audit report. Reproduce with:

```
npx vitest run tests/security
```

Latest run: `3 passed (3)` files, **27 passed (27)** tests, zero skips.

| File | Tests |
|:---|---:|
| `tests/security/route-authorization.test.ts` | 13 |
| `tests/security/route-guard-parity.test.ts` | 6 |
| `tests/security/abuse-and-fuzzing.test.ts` | 8 |

## 1. Enforcement points

Two independent points consult authority before any handler body runs:

1. `ROUTE_GUARDS` (`src/api/router.ts:816`) — the declarative table, matched by
   the compiled predicate `COMPILED_ROUTE_GUARDS` on `method` + path-segment
   pattern, `:param` segments compiled to `[^/]+`.
2. `assertRoutePermission(req, res, action, resource)` (`src/api/router.ts:763`) —
   inline RBAC inside a handler, used where the action depends on data in the
   request body or on a role the central table cannot express.

   **PR-09 (2026-10-16):** this helper now decides through
   `assertPermission(user, action, resource, accessContextFor(user, req.headers))`
   (`src/api/router.ts:785`), so the policy engine's tenant predicate runs on
   every guarded request instead of never — and a request claiming a tenant that
   is not the session's own is refused `403 TENANT_SCOPE_DENIED` rather than
   falling through to a generic permission answer. `assertPermission`, which had
   no caller in `src/` before, is now load-bearing. Pinned by
   `tests/unit/production-readiness-controls.test.ts` (live route + source scan
   that no call site omits the context argument).

`resolveSessionUser` (`src/api/router.ts:729`) accepts `Authorization: Bearer`
and the `vmnl_session` cookie; the `x-test-role` shortcut is reachable **only**
when `NODE_ENV === "test"` (`:619`).

## 2. Measured coverage (printed by the parity scan)

```
[TSK-29] mutating dispatch sites 117 (API 104) · guards 75 · inline-enforced 59 ·
         handler-scoped documented 55 · public by design 11
```

`tests/security/route-guard-parity.test.ts` reads `src/api/router.ts` as data,
extracts every `POST|PATCH|PUT|DELETE` dispatch site (the method list is the same
`UNSAFE_METHODS` constant the matcher uses, so the scan cannot drift from the
definition of "mutating"), and asserts:

- the scan finds ≥ 110 sites and ≥ 100 under `/api/` — an anti-vacuity guard: a
  parser regression would otherwise make every other assertion pass empty;
- every mutating `/api/` site is either in `ROUTE_GUARDS`, calls
  `assertRoutePermission`/`requireFeatureFlagAdmin` in its own handler block, or
  is named in `HANDLER_SCOPED_ROUTES` / `PUBLIC_BY_DESIGN_ROUTES` with a reason;
- `ROUTE_GUARDS.length === 75` — deleting a guard fails the build;
- no duplicate `method + pathname` entries;
- no guard points at a route the router no longer dispatches (dead
  configuration), with one documented exception map for guards dispatched inside
  a broader handler;
- every documented exemption still names a dispatch site that exists, and every
  route documented as inline-enforced still calls the helper — so the tables
  cannot rot into a description of code that has moved on.

The register's "71 guards vs 106 `/api/` routes" figures were close but not
measured; the measured values are **75** guards over **104** mutating API dispatch
sites. TSK-14 accounts for the +2 over the previously recorded 73:
`POST /api/v1/broadcast/rights/review-requests/{id}/resolve` and
`.../{id}/transition` are now reachable from the product and are the only routes
that may change a `RightsRecord`, so both are guarded `update:rights`.

## 3. Routes closed by this task (CA-31 residue)

The scan found six mutating routes with **no** enforcement of any kind. Each now
requires staff authority; the tests that had been asserting anonymous success
were converted into anonymous-rejection + authorized-success pairs, i.e. the gate
was raised, never lowered (Rule 0.3):

| Route | Enforcement added |
|:---|:---|
| `POST /api/v1/broadcast/rights/review-requests` | guard `create:rights` |
| `POST /api/v1/workspace/afca/assignments` | guard `create:academy` |
| `POST /api/v1/workspace/afca/grading` | guard `update:academy` |
| `POST /api/v1/workspace/headspace/documents` | guard `create:talent` |
| `POST /api/v1/client/projects/{id}/questions` | inline `create:contract` — the body carries `orgId`, so an anonymous caller could have filed an inquiry against any organisation |
| `POST /api/v1/broadcast/asrun/exceptions/{id}/resolve` | inline `update:broadcast` |
| `POST /api/v1/workspace/content/{id}/publish` | inline `approve:content` — previously recorded the publisher as `"anonymous"` in the audit trail |

Three of these also fixed audit attribution: the proof-of-air exception, the
discrepancy inquiry and CMS publication now write the resolving actor's `userId`
instead of `null`/`"anonymous"`.

## 4. Public by design

11 routes are exempt with a stated reason (`PUBLIC_BY_DESIGN_ROUTES`), including
`POST /api/v1/enquiries` (public form intake), the two payment webhooks ("verified
by signature, not by session"), `POST /api/v1/quality/gates` (CI/release pipeline
identity) and `POST /api/v1/workspace/cr8tech/test-all` ("retired: answers 410").
The parity test requires each to remain a real dispatch site.

## 5. HTML desk surfaces (`WORKSPACE_HTML_GUARDS`, TSK-26)

`GET /workspace*`, `/admin*` and `/broadcast/dashboard` are operator desks
(`src/api/router.ts:960`). Previously the suite accepted `[302, 401, 403]` for a
hand-picked path list, which would still pass if the sign-in redirect degraded
into a bare 403. The suite now iterates the guard table itself and asserts each
branch: anonymous → `302` **with `Location: /sign-in?returnUrl={path}` preserved**;
a role outside that prefix's `roles` → `403` carrying forbidden markup; SuperAdmin,
who is inside every prefix → neither 302 nor 403. All five prefixes pass, and the
`/admin` alias is exercised through `/admin/feature-flags`, which `ADMIN_ALIASES`
(`src/api/router.ts:1234`) canonicalises onto `/workspace/admin/feature-flags`
before the table is consulted — so the alias cannot be used to walk around the
guard.

**Residual, recorded not fixed.** `WORKSPACE_HTML_GUARDS` lists **5** prefixes
(`/workspace/cases`, `/workspace/executive`, `/workspace/governance/audit`,
`/workspace/admin`, `/admin`), and the new test asserts those five and nothing
else. `renderWorkspaceDeskHtml` serves many more desks, and the guard predicate is
`method === "GET" && canonicalPath starts with a listed prefix`, so a desk outside
the table is authentication-optional by construction. Whether each of those desks
*should* be public, staff-only, or role-scoped is a business classification, not an
engineering default: extending the table would silently change the access contract
of live surfaces. No per-desk anonymous-visibility figure is recorded here because
none is currently asserted by a test — the classification and its assertions belong
to **TSK-23 (authoritative desk census)**, which is the next task on this path.

## 6. Known pre-existing defect surfaced by these tests — CLOSED by TSK-18

These tests used to emit, repeatedly:

```
Audit durable persistence failed; ledger degraded to in-memory (prisma_error)
Foreign key constraint violated on the constraint: `AuditLog_userId_fkey`
```

Cause: `resolveSessionUser`'s test-role branch returns the synthetic identity
`test-user-id` (`src/api/router.ts:743`), which has no `User` row, while the
ledger write put the actor into `AuditLog` under a real FK. It fired on routes
this document's task never touched, and it was correctly observable rather than
silent — the writer flipped `persistenceMode` to `prisma_error` and WARNed.

TSK-18 closed it by deleting the constraint (`prisma/schema.prisma`, migration
`prisma/migrations/20261012120000_relax_audit_ledger_actor_identity`), and the
earlier "do not relax the FK" position no longer holds because the measurement
did: **1783 of 1783** durable `AuditLog` rows carried `userId = NULL`. A column
that is NULL for every row in the table is not verifying anything — `onDelete:
SetNull` was erasing the actor from rows whose user was later deleted, so the
constraint's actual effect was to destroy the evidence it claimed to protect, and
to refuse any write from a synthetic or system actor.

The cost is stated rather than hidden: the ledger now records the actor
verbatim, with **no referential guarantee that a `User` row exists** for it.
Actor attribution is therefore an application-side id reference, like the
risk→issue linkage the TSK-17 block already documents. The second cost is the
gating one: since the ledger row drains inside the same transaction as the
business write, an audit insert that Postgres rejects now fails the request with
503 instead of degrading quietly — which is the behaviour TSK-18 was written to
get, and the reason the FK had to go first.

