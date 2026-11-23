# Screen register verification — TSK-24 (report.md CA-11)

**Document verified:** `docs/decisions/screen-register.json` — VMNL-REG-SCREENS-001 **R1.2**
**Instrument:** `tests/unit/screen-register-verification.test.ts` (7 tests) · loader `src/core/config/screen-register.ts`
**Measured:** 2026-10-07 · **Reproduce:** `NODE_ENV=test pnpm vitest run tests/unit/screen-register-verification.test.ts`

## 1. What CA-11 said, and what was checked

CA-11's finding was that the register is *not fabricated but not verification*: 23 of 60 entries
collapse an ID range into one tally (`UX-PUB-001..028` counted 28 documented screens as 1), no route
mount was ever asserted, and no provenance was recorded — so `computeScreenRegisterCounts` returned
an entry count that callers read as a screen count.

Every claim in this document is produced by that suite in this repository. Nothing here is a
restatement of the register's own prose.

## 2. Headline measured figures

| Figure | Value | How it is measured |
|---|---|---|
| Register entries | **60** | objects in `groups[].entries` |
| Documented screen IDs | **226** (225 screens + 1 ALIAS) | `expandScreenRegister` arithmetic over the ranges |
| Router dispatch surface | **229 literal paths + 52 prefix branches** | regex over `src/api/router.ts` |
| Entries whose declared route is unmounted | **0** | static dispatch surface + live probe |
| Entries claiming IMPLEMENTED with no route | **0** | same |
| Evidence citations that resolve to a real file | **all except 1** | path citations + bare filenames indexed against `src/ docs/ prisma/ tests/ scripts/` |
| Entries naming no checkable file | **1** — `UX-VTM-010` (ALIAS: "See knownConflicts[0]", a cross-reference by design) | same |
| Provenance: DOMAIN_ENGINE | **75 IDs** | marker in the served page, or domain state read by the handler that serves it |
| Provenance: NOT_CONNECTED | **4 IDs** | `UX-COM-001..003`, `UX-PRJ-001` — no route the router dispatches |
| Provenance after the 2026-11-16 re-measure | **unchanged (75 / 4 / 147)** | `UX-COM-004` re-pointed from the retired `/enquiry` to its `301` successor `/contact`; the mount check now also consults `resolveIARoute`, so IA-served paths are mounted rather than read as unmounted |
| Provenance: NOT_VERIFIED | **147 IDs** | page declares no provenance and no domain state is identifiable in the handler |
| Reachable HTML surfaces (register-declared routes) | **40** | distinct paths answered `200 text/html` to a SuperAdmin session |
| Reachable HTML surfaces (whole router, literal paths) | **104 of 222** | every literal path GET-probed once; parameterised literals excluded, so a floor, not a total. Re-measured 2026-11-16: eight literals left the probed set when IA Phase 7 retired seven of them to `301` and moved `/contact` to the IA resolver, and one entered it — `/offline` (EDGE-005), the handler document a disconnected visitor can still load |

## 3. The "225 system screens" claim, retired

Three different numbers have been quoted about the same document: **225** (documented IDs, before the
ranges were expanded and again as an operational status claim), **60** (entries, mislabelled
"totalScreens"), and **≈166** (`report.md` §2's hand-swept estimate of reachable HTML surfaces).

Measured replacements:

- documented screens = **226 IDs (225 + 1 ALIAS)**, by arithmetic over the register's own ranges;
- reachable HTML surfaces = **40** for the routes the register declares, **104** literal HTML-serving
  routes across the whole router (a floor: parameterised paths are not probeable without an entity;
  re-measured 2026-11-16 after the legacy-route retirement, previously 111).

The ≈166 estimate is withdrawn: it was a sweep over route lists, not a request to the server.
`DEC-RL1-SCOPE-001` remains `PENDING_SIGNATURE` and still repudiates "225/225 screens operational".

## 4. Provenance rule, stated so it can be argued with

Priority, highest first:

1. **Served page markers** (`live probe`) — `vmn-provenance-banner` → MOCK; `SOURCE:` → DOMAIN_ENGINE;
   `>PROVISIONAL<` → PROVISIONAL; `>NOT CONNECTED<` or the TSK-23 shell label → NOT_CONNECTED.
2. **Handler source** (`handler source`) — the router block that serves the path reads domain state
   (`context.<engine>.<method>(…)`, `get…Engine`, `getAllActive…`) → DOMAIN_ENGINE.
3. **No mounted route** → NOT_CONNECTED.
4. **Cited module** declares the shell or the demonstration banner → NOT_CONNECTED / MOCK.
5. Otherwise → **NOT_VERIFIED**.

NOT_VERIFIED exists deliberately. An earlier draft of this instrument counted "answered 200 and carried
no demonstration banner" as DOMAIN_ENGINE, which reported 175 engine-backed screens — an upgrade with no
evidence behind it (Rule 0.4). 147 IDs are unproven, not proven-and-annoying. Closing them means
emitting provenance in the pages themselves (TSK-11, TSK-17), not editing this classifier.

## 5. Defect found and fixed while building the instrument

**A `/workspace/` catch-all was shadowing six registered surfaces.** The AUD-32 "truthful 404" branch
sat near the top of the GET chain and matched any `/workspace/*` path, while the handlers for
`/workspace/my-work`, `/workspace/search`, `/workspace/notifications`,
`/workspace/governance/records`, `/workspace/cases/privacy` and `/workspace/cases/security` were
registered *below* it. Those six surfaces were dead code: every request was answered 404 by the
catch-all before its own handler ran.

The catch-all was moved to the end of the dispatch chain (`src/api/router.ts`, immediately before the
terminal "Route not found"), which is where a catch-all belongs. All six now answer 200 HTML, the
catch-all still returns a truthful 404 for genuinely unregistered desk paths, and the behaviour is
pinned by `does not let the /workspace catch-all shadow a registered surface`. Register-declared
reachable HTML surfaces went from 36 (measured before the move, same instrument) to 40.

## 6. Residual, recorded not fixed

- **147 documented IDs carry no provenance the instrument can read.** Their pages render domain data
  without saying so. Fix: ship the `SOURCE:`/`NOT CONNECTED` badges those screens already have in the
  broadcast module (TSK-11, TSK-17).
- **`UX-VTM-010`** cites `knownConflicts[0]` rather than a file. Correct for an ALIAS; left as is.
- **Three counterparty portals (`UX-POR-003..005`) answer 503** to an authorised operator in this
  environment. Whether that is a fail-closed dependency or a broken portal surface is not settled here;
  they are NOT_VERIFIED, not DOMAIN_ENGINE.
- **`/portal/client/{orgId}/{projectId}` probes 404** because the sample identifiers are synthetic; that
  is a data-level not-found, so it is not treated as an unmounted route.
- **Route ranges still collapse in the register's `route` field** (e.g. `SCR-BCST-01…33` share one
  entry). Per-ID route/name expansion needs `VMNL-AZP-VMN-UIUX-001`, which is absent from
  `docs/authorities/` — recorded under TSK-39 rather than invented here.

## 7. Measured per-entry table

Generated from the suite output on 2026-10-07 (entry | IDs | mounted/declared routes | provenance |
basis | first probe | evidence files resolved).
| Entry | IDs | Mounted/declared | Provenance | Basis | First probe | Evidence resolved |
|---|---|---|---|---|---|---|
| UX-PUB-001..028 | 28 | 8/8 | NOT_VERIFIED | handler source | / 200 page declares no provenance | evidence 2/2
| UX-SYS-001 | 1 | 1/1 | NOT_VERIFIED | handler source | /sign-in 200 page declares no provenance | evidence 2/2
| UX-SYS-002 | 1 | 1/1 | NOT_VERIFIED | handler source | /auth/mfa 200 page declares no provenance | evidence 1/1
| UX-SYS-003 | 1 | 1/1 | NOT_VERIFIED | handler source | /auth/recovery 200 page declares no provenance | evidence 1/1
| UX-SYS-004 | 1 | 1/1 | NOT_VERIFIED | handler source | /auth/invitation 200 page declares no provenance | evidence 1/1
| UX-SYS-005 | 1 | 1/1 | NOT_VERIFIED | handler source | /auth/profile-setup 200 page declares no provenance | evidence 2/2
| UX-SYS-006..011 | 6 | 6/6 | NOT_VERIFIED | handler source | /select-workspace 200 page declares no provenance | evidence 1/1
| UX-SYS-012 | 1 | 1/1 | NOT_VERIFIED | handler source | /account/notifications 200 page declares no provenance | evidence 1/1
| UX-SYS-013 | 1 | 1/1 | NOT_VERIFIED | handler source | /account/sessions 200 page declares no provenance | evidence 1/1
| UX-SYS-014 | 1 | 1/1 | NOT_VERIFIED | handler source | /help/operator 200 page declares no provenance | evidence 1/1
| UX-HUB-001 | 1 | 1/1 | NOT_VERIFIED | handler source | /workspace/my-work 200 page declares no provenance | evidence 2/2
| UX-HUB-002 | 1 | 1/1 | NOT_VERIFIED | handler source | /workspace/search 200 page declares no provenance | evidence 1/1
| UX-HUB-003 | 1 | 1/1 | NOT_VERIFIED | handler source | /workspace/notifications 200 page declares no provenance | evidence 1/1
| UX-HUB-004 | 1 | 1/1 | DOMAIN_ENGINE | handler source | /workspace/management/overview 200 page declares no provenance | evidence 4/4
| UX-HUB-005 | 1 | 1/1 | NOT_VERIFIED | handler source | /workspace 200 page declares no provenance | evidence 2/2
| UX-COM-001..003 | 3 | 0/0 | NOT_CONNECTED | route not mounted | — 0 no mounted route declared | evidence 1/1
| UX-COM-004 | 1 | 1/1 | NOT_VERIFIED | handler source | /contact 200 page declares no provenance (`/enquiry` retired to a 301) | evidence 1/1
| UX-COM-005..009 | 5 | 1/1 | NOT_VERIFIED | handler source | /workspace/commercial/proposals/builder 200 page declares no provenance | evidence 1/1
| UX-COM-010 | 1 | 1/1 | NOT_VERIFIED | handler source | /portal/client/ORG-1/projects/PRJ-1 404 page declares no provenance | evidence 1/1
| UX-PRJ-001 | 1 | 0/0 | NOT_CONNECTED | route not mounted | — 0 no mounted route declared | evidence 1/1
| UX-PRJ-002 | 1 | 1/1 | NOT_VERIFIED | handler source | /portal/client/ORG-1/projects/PRJ-1 404 page declares no provenance | evidence 1/1
| UX-BR-001..033 | 33 | 1/1 | NOT_VERIFIED | handler source | /broadcast/screens/SCR-BCST-01 200 page declares no provenance | evidence 1/1
| UX-BR-012 | 1 | 1/1 | NOT_VERIFIED | handler source | /broadcast/screens/SCR-BCST-01 200 page declares no provenance | evidence 1/1
| UX-BR-030 | 1 | 1/1 | NOT_VERIFIED | handler source | /broadcast/screens/SCR-BCST-01 200 page declares no provenance | evidence 1/1
| UX-GOV-001..002 | 2 | 1/1 | NOT_VERIFIED | handler source | /workspace/approvals 200 page declares no provenance | evidence 1/1
| UX-GOV-003 | 1 | 1/1 | NOT_VERIFIED | handler source | /workspace/governance/records 200 page declares no provenance | evidence 1/1
| UX-GOV-004 | 1 | 1/1 | NOT_VERIFIED | handler source | /broadcast/screens/SCR-BCST-01 200 page declares no provenance | evidence 2/2
| UX-GOV-005 | 1 | 1/1 | NOT_VERIFIED | handler source | /workspace/governance/records 200 page declares no provenance | evidence 1/1
| UX-GOV-006 | 1 | 1/1 | NOT_VERIFIED | handler source | /broadcast/screens/SCR-BCST-01 200 page declares no provenance | evidence 1/1
| UX-GOV-007 | 1 | 1/1 | NOT_VERIFIED | handler source | /workspace/governance/records 200 page declares no provenance | evidence 1/1
| UX-GOV-008 | 1 | 1/1 | NOT_VERIFIED | handler source | /workspace/governance/records 200 page declares no provenance | evidence 1/1
| UX-GOV-009 | 1 | 1/1 | NOT_VERIFIED | handler source | /workspace/cases/privacy 200 page declares no provenance | evidence 1/1
| UX-GOV-010 | 1 | 1/1 | NOT_VERIFIED | handler source | /workspace/cases/security 200 page declares no provenance | evidence 1/1
| UX-CMS-001..006 | 6 | 1/1 | NOT_VERIFIED | handler source | /workspace/content/review 200 page declares no provenance | evidence 2/2
| UX-CMS-007 | 1 | 1/1 | NOT_VERIFIED | handler source | /api/v1/federation/destinations 200 page declares no provenance | evidence 1/1
| UX-CMS-008 | 1 | 1/1 | NOT_VERIFIED | handler source | /api/v1/enquiries/routing-config 200 page declares no provenance | evidence 1/1
| UX-ADM-001 | 1 | 1/1 | NOT_VERIFIED | handler source | /workspace/admin/access 200 page declares no provenance | evidence 1/1
| UX-ADM-002 | 1 | 1/1 | DOMAIN_ENGINE | handler source | /workspace/cr8tech/operations 200 page declares no provenance | evidence 1/1
| UX-ADM-003 | 1 | 1/1 | NOT_VERIFIED | handler source | /workspace/admin/source-mappings 200 page declares no provenance | evidence 2/2
| UX-ADM-004 | 1 | 1/1 | DOMAIN_ENGINE | live probe | /admin/feature-flags 200 engine provenance badge | evidence 1/1
| UX-REC-001..006 | 6 | 1/1 | NOT_VERIFIED | handler source | /workspace/governance/records 200 page declares no provenance | evidence 2/2
| UX-AFCA-001..008 | 8 | 1/1 | NOT_VERIFIED | handler source | /workspace/afca 200 page declares no provenance | evidence 2/2
| UX-APP-001..008 | 8 | 1/1 | NOT_VERIFIED | handler source | /apply 200 page declares no provenance | evidence 1/1
| UX-ACC-001..008 | 8 | 1/1 | DOMAIN_ENGINE | handler source | /workspace/accelerator 200 page declares no provenance | evidence 1/1
| UX-AFC-001..006 | 6 | 1/1 | DOMAIN_ENGINE | handler source | /workspace/community/guilds 200 page declares no provenance | evidence 1/1
| UX-VTM-001..009 | 9 | 1/1 | NOT_VERIFIED | handler source | /vtm/marketplace 200 page declares no provenance | evidence 1/1
| UX-VTM-010 | 1 | 1/1 | NOT_VERIFIED | handler source | /vtm/terms 200 page declares no provenance | evidence 0/0
| UX-VTM-011 | 1 | 1/1 | NOT_VERIFIED | handler source | /portal/vtm/payment-visibility 200 page declares no provenance | evidence 2/2
| UX-VCF-001..008 | 8 | 1/1 | DOMAIN_ENGINE | handler source | /workspace/vcf/missions 200 page declares no provenance | evidence 1/1
| UX-ONE-001..009 | 9 | 1/1 | DOMAIN_ENGINE | handler source | /workspace/production/desk 200 page declares no provenance | evidence 1/1
| UX-EVT-001..008 | 8 | 1/1 | DOMAIN_ENGINE | handler source | /workspace/events/desk 200 page declares no provenance | evidence 1/1
| UX-TEND-001..008 | 8 | 1/1 | DOMAIN_ENGINE | handler source | /workspace/tend/catalogue 200 page declares no provenance | evidence 1/1
| UX-HSP-001..008 | 8 | 1/1 | DOMAIN_ENGINE | handler source | /workspace/headspace/intelligence 200 page declares no provenance | evidence 1/1
| UX-CR8-001..008 | 8 | 1/1 | DOMAIN_ENGINE | handler source | /workspace/cr8tech/operations 200 page declares no provenance | evidence 1/1
| UX-AGT-001..009 | 9 | 1/1 | DOMAIN_ENGINE | handler source | /workspace/aos/console 200 page declares no provenance | evidence 1/1
| UX-POR-001 | 1 | 1/1 | NOT_VERIFIED | handler source | /portal/client/ORG-1/projects 404 page declares no provenance | evidence 1/1
| UX-POR-002 | 1 | 1/1 | NOT_VERIFIED | cited module | — 0 route not probeable; cited module declares no provenance | evidence 2/2
| UX-POR-003 | 1 | 1/1 | NOT_VERIFIED | handler source | /portal/partner/ORG-1 503 page declares no provenance | evidence 1/1
| UX-POR-004 | 1 | 1/1 | NOT_VERIFIED | handler source | /portal/creator/X-1 503 page declares no provenance | evidence 1/1
| UX-POR-005 | 1 | 1/1 | NOT_VERIFIED | handler source | /portal/vendor/X-1 503 page declares no provenance | evidence 1/1
