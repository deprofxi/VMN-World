# TSK-13 — the client counterparty portal projects canonical deals (2026-10-09)

**Register item:** `tasks.md` **TSK-13 · P1 · Rewire the client counterparty portal to canonical deals**
(reopened part of inherited `TODO-SCR-19`; source `report.md` CA-09).

**Baseline:** HEAD `ce098f8`, **uncommitted**. Dirty set as measured after this artifact set was
written:

```
$ git status --porcelain | wc -l
189
$ git status --porcelain --untracked-files=all | wc -l
239
```

Committing is **not** part of this closure: the commit series needs the owner's sign-off (`TSK-09`), so
no artifact here claims a SHA that does not contain the work.

## What was actually wrong

`src/web/portal/client-portal.ts:55` (HEAD) defined `MOCK_CLIENT_PROJECTS` and the router served it on
both client-portal branches. The fixture carried, per project:

| Fixture field | What it claimed | What the real type holds |
|:---|:---|:---|
| `certificateNumber: "CERT-TX-2026-09228"` | a transmission certificate ID | `ProofOfAirCertificate.certificateId` (`src/modules/broadcast/asrun/index.ts:48`) — different name, no such row behind the screen |
| `asRunTimestamp` | when the spot aired | `airedTimestamp` — again only a shape on the page |
| `carrier: "Eutelsat 16A Ku-Band DTT Downlink"` | the uplink carrier | no `carrier` field exists on the certificate at all |
| `complianceSignature: "SHA256:d8a4f9…"` rendered as **"Cryptographic Playout Hash"** | cryptographic proof of airplay | `cryptographicSignature` exists on the type, but this string was typed by hand |
| `commitments[]` (`deliverable`, `channel`, `daypart`, `flightRange`, `deliveredRuns/scheduledRuns`) | booked delivery vs delivered | no canonical record joins a deliverable to an organisation or a deal |

On a **counterparty** surface that is the worst possible place for invented data: it presented fabricated
transmission evidence to a client as their own proof of performance. `Project` (`prisma/schema.prisma:225`)
has **zero** `prisma.project` accessors, so there was no table to project either — the screen was the
only place those records existed.

## What replaced it

- `src/web/portal/client-portal.ts:85` `projectClientPortfolio(deals, orgId)` — filters
  `QuoteToCashSalesEngine.listDeals()` on the canonical `clientOrgId`. `toClientProject` (`:60`) copies
  fields; `statusFromStage` (`:54`) derives the portal status from the canonical stage under one stated
  rule. Nothing is manufactured at render time.
- `src/api/router.ts:2496` (list) and `:2541` (detail) read from the engine; `getClientOrgRelationship`
  (`:937`) still gates the route, returning only STAFF_ACCESS / FORBIDDEN / UNAUTHENTICATED — so staff
  gets `503 ORGANISATION_RELATIONSHIP_UNAVAILABLE` until canonical membership exists, and every other
  caller gets `403`.
- The delivery-commitments table and the per-airing certificate list now render an explicit
  **NOT CONNECTED** section naming the missing join, and the proof section shows only the deal's own
  `proofDocumentUrl` when `proofOfPerformanceVerified && proofDocumentUrl`.
- The deleted `ClientCommitment` / `ReleasedProofReport` interfaces are gone with the fixture; the page
  carries a `SOURCE:` line naming the engine and the scope predicate.

## Gates (all on the same tree, run serially)

| Artifact | Command | Result |
|:---|:---|:---|
| `typecheck.txt` / `typecheck-final.txt` | `pnpm typecheck`, before and after the document re-pins | exit **0** both |
| `lint.txt` / `lint-final.txt` | `pnpm lint` (`--max-warnings 0`) | exit **0**, 0 errors / 0 warnings, both |
| `build.txt` / `build-final.txt` | `pnpm build` | exit **0** both |
| `test-run1.txt` | `pnpm test` | exit **0** — **65 files / 746 tests passed, 0 failed, 0 skipped, 0 unhandled errors** |
| `test-run2.txt` | `pnpm test`, immediately again, same tree, same now-dirty database | exit **0** — **65 / 746**, identical |
| `test-run3.txt` | `pnpm test`, a third time after the document re-pins landed | exit **0** — **65 / 746**, identical |
| `test-coverage.txt` | `pnpm test:coverage` | exit **0** — 65/746 and **78.47 statements / 69.89 branches / 82.19 functions / 79.74 lines** against the pinned floors 73/62/77/72 (`vitest.config.ts`) |
| `focused-suites.txt` | `npx vitest run` over the six suites this change touches | exit **0** — **6 files / 69 tests**: client-portal 24, canonical-model 13, audit-remediation 12, screen-register-verification 7, register-inheritance 7, systems-of-record 6 |
| `measurements.txt` | the greps behind every figure above | raw output |

Environment: Postgres reachable on `localhost:5432` (a real dependency, not a stub); no Redis; `.env`
**not** sourced before `pnpm test` — sourcing it exports `NODE_ENV=development`, which disables the
`x-test-role` path in `resolveSessionUser` and fails ~80 guard tests.

Previous pin was **65 files / 742 tests** (TSK-19, same day). **742 → 746** = the portal suite's
**+6 new − 2 retired** tests.

## The two retired tests, stated plainly (Rule 0.3)

`renders client projects list HTML accurately with approved scope and status` and `renders client
project detail HTML with commitments table and released proof reports` (both at HEAD) asserted the
*fixture's* content — `COMM-DAG-8842`, `45,000,000`, `CERT-TX-2026-09228`, `Eutelsat 16A …`,
`Cryptographic Playout Hash`. They cannot exist once the fixture is deleted. Each was replaced by a
canonical equivalent with the same coverage: scoped portfolio render, honest empty portfolio, detail
render asserting only canonical fields, plus the deletion guard. The file went **19 tests at HEAD → 24**.
No 401/403/503 assertion was changed, and no gate was widened, skipped or re-parameterised.

## New tests, and what each pins

| Test | Pins |
|:---|:---|
| `renders the portfolio from canonical deals scoped to the caller's organisation` | a real deal's name/contract value/`18,000,000` collected/`IN_RECONCILIATION` render; the *other* organisation's deal does not appear; the `SOURCE:` line is present |
| `renders an honest empty portfolio instead of records from somewhere else` | an organisation with no deal gets the empty state, not another client's rows |
| `renders only what the canonical deal carries and states NOT CONNECTED where it carries nothing` | `CERT-TX-2026-09228`, `Cryptographic Playout Hash`, `Eutelsat 16A …` and `PRJ-VMN-2026-088` never appear; the NOT CONNECTED sections do |
| `derives the portal status from the canonical stage, never a stored label` | the `statusFromStage` table over all 9 sales stages |
| `keeps the client-portal mock registry deleted (TSK-13 guard)` | no `MOCK_*` export on the module, no `export const MOCK_`/`const MOCK_` in the source, no `MOCK_CLIENT_PROJECTS` reference in `router.ts` |
| `keeps a real canonical deal out of the portal until membership is verified` | a deal created through `POST /api/v1/finance/deals` (201, SuperAdmin) is absent from the anonymous, domain-guessing and staff responses — no ref, no deal id, no name, no amount |

## What this does **not** claim

- **Persistence.** `QuoteToCashSalesEngine` keeps deals in a process `Map`
  (`src/modules/finance/sales/index.ts:49`) and no `salesDeal` store is registered with
  `registerDurableStore` (13 registration call sites in `src/`, none for sales). A restart empties the
  portfolio. Rule 0.4a: sandbox state is not persistence, and the screen's `SOURCE:` line says
  *engine*, not *database*.
- **The delivery feed.** Nothing joins a booked deliverable to a deal:
  `CommercialSpot.clientName` (`src/modules/broadcast/traffic/index.ts:19`),
  `CommercialCampaign.clientName` (`prisma/schema.prisma:492`) and `ProofOfAirCertificate.clientName`
  (`src/modules/broadcast/asrun/index.ts:50`) are free text, and `CampaignRepository`
  (`src/core/database/repositories/campaign.repository.ts:25`) is constructed only by
  `tests/unit/production-core-and-infrastructure.test.ts:143`.
- **Client-member access.** `getClientOrgRelationship` has no reachable `CLIENT_MEMBER` branch, so a real
  client user still cannot see their own portfolio; the routes fail closed. This is the pre-existing
  gate, not something TSK-13 introduced or removed.

Both gaps are registered as **TSK-60** rather than left implied, and `docs/domain/systems-of-record.md`
§3.3 records the projection as process memory.

## Documents re-pinned by this change

`tasks.md` (§1.1 counts re-measured, §1.2 posture, §1.3 + §1.4 `TODO-SCR-19` → CLOSED, TSK-07 tallies,
TSK-08 row, §3 exit-gate line, §8 checklist greps), `docs/domain/systems-of-record.md` (§3.2 row deleted,
§3.3 row added), `docs/domain/canonical-model.md` (§6 row + the two drifted `router.ts` citations),
`docs/domain/data-dictionary.md` (`.toISOString()` 105 → 106, and the pin in
`tests/unit/canonical-model.test.ts:331` with it), `docs/decisions/screen-register.json`
(UX-POR-001 / UX-PRJ-002 / UX-COM-010 / UX-POR-002 evidence prose),
`docs/audit/todo-remediation-evidence.md` (new `SCR-19 client portal` row), `docs/handoffs/LATEST.md`,
and `tests/unit/register-inheritance.test.ts` (reopened set 3 → 2, measured:
`CLOSED 60 · REOPENED 2 · CLOSED_WITH_HUMAN 4 · HUMAN 5` over 71 rows / 72 IDs).
