# VMN World IA R1.1 — Page Build Plan

**Document:** `VMNL-AZP-VMN-IA-PLAN-001 — R1.0`
**Source of truth:** `docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv` (619 rows, 35 columns)
**Governing authorities:** `CLAUDE.md` · `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A` · `VMNL-AZP-VMN-CCPP-001 — R1.1`
**Status:** Living plan. Every claim below was measured from the CSV or the tree, not estimated.

---

## 1. What the inventory actually contains

| Dimension | Measured |
|:---|:---|
| Rows (screens / states / instances) | **619** |
| Unique IDs | 619 |
| Rows with a real URL | **393** (358 unique route patterns, 6 of them parameterised) |
| Rows hosted on another screen (modal, drawer, tab, edge state) | **226** (`HOSTED@` 182 · `STATE@HOST` 44 — not routes) |
| Journey families | **24** (`J01`–`J23`, with `J02a` brand template family) |
| Screen archetypes | `PAGE` 243 · `STATE` 118 · `DIALOG` 96 · `DASHBOARD` 71 · `WIZARD` 44 · `CONTENT_INSTANCE` 35 · `TAB` 12 |
| Gates | `W0` 133 (public) · `W1` 67 (read) · `W2` 78 (work) · `W3` 196 (specialist) · `W4` 141 (human-gated) · `G` 4 (conditional) |
| Data classes | 20 distinct, from `PUBLIC` (75) to `LEGAL_PERSONNEL_RESTRICTED` (34), `FINANCE_RESTRICTED` (35), `SECURITY_PRIVILEGED` (36) |
| Business action classes | `SOURCE_READ` 205 · `CONTROLLED_DECISION_REQUEST` 141 · `INFORMATION_ONLY` 119 · `SCOPED_REQUEST_OR_DRAFT` 77 · `FAIL_SAFE_RECOVERY` 77 |
| Change class | `RETAINED + ENRICHED` 570 · `ADDED R1.1` 49 |
| Verified release status | all 619 rows: `NOT VERIFIED / RELEASED ONLY BY SCOPED SIGNED MANIFEST` |

**The single most important finding:** the inventory is not a list of 619 pages. It is a list of
**619 screen contracts**, of which only 393 carry a URL and only 133 are public. The remaining 226
are states, modals, drawers and tabs that must be *hosted* by the screen named in `Host screen ID`.
Treating them as separate pages would produce dead URLs; treating them as decoration would lose the
adverse-state and evidence contracts that make the IA defensible.

### 1.1 Journey families, routes and gates

| Code | Journey | Rows | Routed | Gate mix | Primary roles |
|:---|:---|--:|--:|:---|:---|
| PUB | J01 Public company discovery and trust | 22 | 18 | W0 22 | PUB, FAN |
| BRI | J02a Individually addressable brand pages (one template) | 35 | 35 | W0 35 | PUB, FAN |
| BRD | J02 Brand families, media identities, sub-brand discovery | 16 | 9 | W0 11 · W2 1 · W3 1 · W4 3 | PUB, FAN, BRAND |
| STW | J03 Original Storyworlds, IP and Azeebo+ referral | 15 | 8 | W0 10 · W3 4 · G 1 | PUB, FAN |
| SERV | J04 Capability, studio, academy and programme discovery | 18 | 16 | W0 18 | PUB, CLI, APP |
| LEAD | J05 Public enquiries, qualified intake and application handoff | 18 | 10 | W0 15 · W2 3 | CLI, PUB, PART |
| AUTH | J06 Identity, onboarding, consent and relationship switching | 25 | 12 | W1 19 · W3 3 · W4 3 | CLI, PART, EMP, TAL |
| CLT | J07 Client onboarding, commissioning, delivery and acceptance | 24 | 14 | W3 21 · W4 3 | CLI, COM, PROD |
| PART | J08 Sponsors, institutional partners and organisations | 23 | 15 | W3 21 · W4 2 | PART, SPO, TRAIN |
| LEARN | J09 Accelerator applications, AFCA learning, CLAP | 30 | 21 | W0 1 · W3 25 · W4 4 | LEARN, APP, AFCA |
| TAL | J10 Creator onboarding, marketplace and paid work | 30 | 20 | W3 25 · W4 5 | TAL, VTM, CLI |
| CAND | J11 Candy Cast, Candy Plus and restricted-consent boundaries | 20 | 11 | W0 3 · W3 11 · W4 3 · G 3 | CAST, BRAND, DPO |
| CIRC | J12 ONE CIRCLE home, knowledge, SOP, Ask VMN | 32 | 17 | W1 24 · W2 7 · W4 1 | EMP, KNOW, BUIL |
| MISS | J13 Mission framing, staffing, execution, approval, closure | 31 | 17 | W2 28 · W4 3 | MO, BUIL, CAP |
| CAP | J14 Capability leaders, resourcing, coaching | 18 | 12 | W2 17 · W3 1 | CAP, HUB, COACH |
| STUD | J15 ONE Studios, VCF production, asset delivery | 23 | 16 | W3 16 · W4 7 | PROD, BUIL, EDITOR |
| EVNT | J16 Fusion Events, 9TLIFE, Azeebo+ Live | 18 | 13 | W0 4 · W3 7 · W4 7 | EVENT, VEN, PUB |
| IPR | J17 IP, storyworld governance, rights, TEND licensing | 25 | 19 | W3 12 · W4 13 | RIGHTS, TEND, PROD |
| CMS | J18 Brand editorial, publishing, media governance | 21 | 13 | W0 1 · W2 12 · W4 8 | EDITOR, BRAND, MARK |
| BRC | J19 Broadcast scheduling, traffic, transmission, proof-of-air | 26 | 17 | W0 1 · W3 11 · W4 14 | TRAFF, BCAST, MCR |
| FIN | J20 Finance, commercial performance, treasury, capital | 35 | 24 | W3 16 · W4 19 | FIN, CFO, EXEC |
| GOV | J21 Legal, People, governance, privacy, approvals | 34 | 27 | W0 1 · W1 1 · W3 13 · W4 19 | LEGAL, EXEC, DPO |
| SYS | J22 AI, Cr8Tech, integrations, product ops, security | 36 | 29 | W1 12 · W2 3 · W3 1 · W4 20 | ENG, SEC, AUDIT |
| EDGE | J23 Global edge cases, denial, outage, recovery, safety | 44 | 0 | W0 11 · W1 11 · W2 7 · W3 8 · W4 7 | all |
| **Total** | | **619** | **393** | | |

### 1.2 How a screen "works" — the contract model

Every row is executed the same way. This is the mental model the plan and the code both follow:

```
Gate (W0..W4/G)            → can it be reached at all, and by whom
Role IDs (PUB, FIN, …)     → which relationship roles are in scope
Business action class      → INFORMATION_ONLY / SOURCE_READ / SCOPED_REQUEST_OR_DRAFT
                             / CONTROLLED_DECISION_REQUEST / FAIL_SAFE_RECOVERY
Data classification        → what may be rendered, and what must never be rendered
Primary user action        → the one job of the screen
Mandatory adverse states   → the states that MUST exist (not optional empty states)
Human fallback / recovery  → where the user goes when the action is blocked
Evidence and audit contract→ what evidence the screen must carry (source ID + version
                             + observed timestamp + purpose + relationship)
A11y / responsive pattern  → the layout and assistive-tech obligations
Primary acceptance criterion→ the test that proves the screen works
```

Consequences for implementation, which are not negotiable:

- A screen whose data source is absent renders a **truthful unavailable/empty state with its
  recovery route**, never plausible demo data. `docs/` already records how costly the opposite is.
- `CONTROLLED_DECISION_REQUEST` screens never *make* the decision in the UI. The UI records the
  request; the domain service enforces authority (canonical law 13).
- `SECURITY_PRIVILEGED`, `FINANCE_RESTRICTED`, `LEGAL_PERSONNEL_RESTRICTED`, `IDENTITY_RESTRICTED`,
  `RESTRICTED_CASTING` screens must not leak content into public HTML, logs, or search.
- `W4` screens that approve money, rights, contracts or child participation render the request and
  the recorded authority, and link to the human fallback; they do not auto-approve.

---

## 2. Decisions taken (from the four open questions)

| # | Decision | Consequence |
|:--|:---|:---|
| D1 | **CSV route patterns are canonical.** | New surfaces are served at the inventory's URLs (e.g. `/brands/nigezie`, `/broadcast/broadcast-operations-home`). No alias/redirect layer is added. Overlapping legacy routes (`/channels/nxtr`, `/hub`, …) stay live during transition and are retired by a separate, tracked step — not silently deleted. |
| D2 | **Contract renderer for all screens; bespoke content for P0 public.** | Every registry entry can render a real, accessible page from its contract. J01 public pages get hand-written content, forms and states. No fabricated operational data anywhere. |
| D3 | **Gates are enforced as far as the authority supports.** | `W0` renders anonymously. `W1`–`W4` and `G` require a session; unauthenticated requests receive `401` with a safe denial page and sign-in route. **Amended after implementation:** role-scoped `403` is *not* claimed, because the inventory's role IDs (`PUB`, `FAN`, `BRC`, …) have no authoritative mapping onto this deployment's `EnterpriseRole` set. Inventing that mapping would be a business decision (see `CLAUDE.md` stop conditions), so an authenticated session receives the contract surface with **no record** and the source marked not connected. Mapping the role IDs is logged as `BLOCKED_HUMAN` in §6. |
| D4 | **Build order starts with J01.** | The 18 routed J01 pages plus its 4 hosted states are the first vertical slice; the platform pieces they need (registry, renderer, gate, sitemap) become the template for every other journey. |

### 2.1 Explicitly out of scope for this pass

- No production StarTimes endpoints, carriage numbers, channel IDs or credentials.
- No new financial, rights, employment or regulatory decision logic. Screens *record* requests.
- No data migration or schema change. Existing Prisma models are reused where they already exist.
- No deletion of legacy routes; retirement is a separate change with its own verification.
- No accessibility conformance claim. Tests check structure and a11y mechanics, not conformance.

---

## 3. Architecture

### 3.1 Files

| Path | Purpose |
|:---|:---|
| `docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv` | The inventory itself, committed unchanged as the IA authority. |
| `scripts/ia/generate-ia-registry.mjs` | Parses the CSV and emits the typed registry. Fails on duplicate IDs, missing required columns, or a route collision. |
| `src/web/ia/registry.generated.ts` | Generated, checked in. One record per CSV row. Never edited by hand. |
| `src/web/ia/index.ts` | Lookups: by ID, by route (static then parameterised), by journey, hosted children of a screen, public route set, sitemap groups. |
| `src/web/ia/render.ts` | The contract renderer: turns any registry record into a consistent screen (header, action, evidence, adverse states, recovery, acceptance ID) and the shared denial page. |
| `src/web/ia/journey-j01.ts` | Bespoke public content for the J01 pages and their hosted states. |
| `src/api/routes/ia.routes.ts` | Route resolution + gate enforcement for registry routes. Wired into the router before the legacy dispatch chain. |
| `tests/unit/ia-registry.test.ts` | Registry integrity: 619 records, 358 route patterns, unique IDs, every required field present, every `W0` route public. |
| `tests/unit/ia-journey-j01.test.ts` | J01 behaviour: each route renders 200 anonymously, each page carries its acceptance ID and evidence contract, hosted states appear on their host, gated routes deny. |
| `tests/integration/ia-routing.test.ts` | End-to-end HTTP: public 200, non-public 401/403, unknown slug 404, no restricted strings in public HTML. |

### 3.2 Request flow

```
GET /brands/nigezie
  → handleApiRequest
    → IA route resolver (static map, then parameterised patterns)
      → registry record (BRD-003, gate W0)
        → bespoke renderer if one exists, else contract renderer
          → renderMasterLayout(title, body, path)
            → 200 HTML (+ canonical only if the path is in PUBLIC_INDEXABLE_ROUTES)

GET /broadcast/broadcast-operations-home
  → resolver → BRC-002, gate W3
    → no session → 401 + safe denial (sign-in, purpose, no data)
    → session without a matching role code → 403 + CSV denial/recovery state
    → session with a matching role → contract renderer marked "scoped surface,
      source not connected" where the data source is absent
```

The resolver is deliberately **separate from `ROUTE_GUARDS`**: that table guards *mutations* by
action+resource. These are read surfaces whose gate is declared by the IA itself. Mutating actions
inside a screen keep using the existing API + `ROUTE_GUARDS` path.

### 3.3 The contract renderer

For a registry record it renders:

1. Breadcrumb (journey → screen) and the screen title.
2. Status strip: gate, release priority, action class, data class, verification status.
3. "What this screen is for" — the primary user action.
4. "What you can do here" — the enumerated core UI components, marked as available, deferred, or
   not-connected based on whether a data source exists. Never a fake value.
5. Evidence and audit panel — the exact evidence contract from the CSV.
6. Adverse states — every mandatory adverse state listed, each with its recovery route.
7. Acceptance panel — `IA acceptance ID` and primary acceptance criterion, so the page is
   reviewable against the authority that created it.
8. Hosted children (modals/drawers/tabs) — rendered inline as expandable sections when the host
   page is displayed, so the state contracts are visible rather than lost.

This is intentionally the *same* visual language as the existing design system (tokens, cards,
status chips, provenance notice). It is a document-grade operational surface, not a marketing page.

### 3.4 Truthfulness rules encoded in the renderer

- No record is rendered as `PAID`, `PUBLISHED`, `TRANSMITTED`, `APPROVED`, `VERIFIED` or `CLEARED`
  unless a source record says so. Absent source → "source not connected" plus recovery route.
- Dates render as "not observed" rather than today's date.
- Counts render as "not available" rather than 0 when the source is absent (0 is a claim).
- The screen's own `Verified release status` (`NOT VERIFIED / RELEASED ONLY BY SCOPED SIGNED
  MANIFEST`) is shown in the status strip, so no prototype can be mistaken for a release.

---

## 4. Phases

Ordering is binding. Each phase must exit green (`pnpm typecheck`, `pnpm lint`, `pnpm test`) before
the next begins, except where a phase explicitly records a blocked check.

### Phase 0 — Authority + registry (foundation)
- [x] Copy the CSV into `docs/authorities/ia/` unchanged.
- [x] Write the generator with hard failures (duplicate ID, unknown gate, route collision, missing
      required column, non-`/` route that is not `HOSTED@`/`STATE@HOST`).
- [x] Generate `src/web/ia/registry.generated.ts`; add `pnpm ia:generate` script.
- [x] Lookup module (ID, route, journey, hosted children, public routes, sitemap groups).
- [x] Registry integrity tests.
- **Exit:** registry has exactly 619 records, 358 unique route patterns, 226 hosted rows; generator
  is deterministic (same CSV → byte-identical output).

### Phase 1 — Rendering + gating core
- [x] Contract renderer + safe denial renderer (`src/web/ia/render.ts`).
- [x] IA route resolution wired into `handleApiRequest` **after** the security headers, session
      resolution and `ROUTE_GUARDS`, and before the page handlers (`dispatchIARoute`).
- [x] Gate enforcement: 401 anonymous with a safe denial page; authenticated renders the contract
      with no record. Role-scoped 403 deferred (D3 amendment, §6 `BLOCKED_HUMAN`).
- [x] Public entry points: `/sitemap`, `/search`, `/ecosystem`, `/support` — built in the existing
      visual system, no new stylesheet.
- [x] Tests: resolution precedence, gate matrix, hosted-state discovery, no-leak assertions.
- **Exit (met):** all 358 route patterns resolve deterministically; `/sign-in`/`/login` stay with
      the identity chain; unknown paths still reach the existing 404.

### Phase 2 — J01 Public company discovery (first vertical slice)
- [x] 18 routed pages with bespoke content and the 4 hosted states (search-no-results,
      contact-intent selector, cookie preference centre, statement revision history).
- [x] Public search: form + query echo + no-results state; results come from the registry's public
      pages only, so no enterprise surface can be listed.
- [x] Sitemap page generated from the registry's public screens (not hand-listed).
- [x] Correction report route that records intent through the existing enquiry contract and
      publishes nothing.
- [x] Tests: every J01 route 200 with its acceptance ID, one `h1`, hosted states present, query
      escaping, gated 401/200, no fabricated counts/dates/carriage numbers, sitemap route set.
- **Exit (met):** J01 is reviewable end-to-end as an anonymous visitor; page weight stays inside
      the 25 KB public-shell budget.

### Phase 3 — Remaining W0 public journeys
79 of the 97 `W0` *routed* rows are still to build. Rows / `W0` routed, from the CSV:
`BRI` 35/35, `SERV` 18/16, `LEAD` 18/9, `STW` 15/7, `BRD` 16/6, `EVNT` 18/2, `CAND` 20/2,
`LEARN` 30/1, `GOV` 34/1, `CMS` 21/0, `BRC` 26/0. `CMS` and `BRC` have a `W0` row each, but
both are hosted states rather than routed pages, so they add no public URL in this phase.
- Brand directory + one reusable brand template + 35 content instances driven by the registry.
- Capability/service profiles from the registry's own component lists.
- Enquiry wizards: one shell, eight intents, each posting to the existing `/api/v1/enquiries`
  contract; receipt page renders the returned case reference or a truthful failure state.
- **Exit:** every `W0` routed screen renders anonymously with its contract and no fabricated data.

### Phase 4 — W1 read + W2 work surfaces
`CIRC` (24 W1), `AUTH` (19 W1), `SYS` (12 W1), `GOV` (1 W1); `MISS` (28 W2), `CAP` (17 W2),
`CMS` (12 W2), `CIRC` (7 W2), `LEAD` (3 W2), `SYS` (3 W2).
- Gated rendering with role intersection, scoped empty states, and the source-not-connected notice.
- Auth journey reuses the existing sign-in/MFA/session implementation; no parallel auth.

### Phase 5 — W3 specialist + W4 human-gated surfaces
`BRC`, `FIN`, `IPR`, `TAL`, `CLT`, `PART`, `STUD`, `LEARN`, `GOV`, `CAND`, `BRD`, `STW`.
- Each decision screen records a *request* through the existing approvals/domain service; the
  decision itself remains with the accountable human.
- Finance screens distinguish contract value, quote, invoiced, cash collected, recognised revenue,
  payable and contribution — no blanket "revenue".

### Phase 6 — J23 edge states + global handlers
- 44 edge states, 11 of them public. Wire 404/410/503/offline/restricted to the existing server
  behaviour rather than inventing parallel handlers.
- Age-restricted, upload-quarantined, unverified-destination and brand-not-launched states must be
  reachable in tests.

### Phase 7 — Retirement + evidence
- Retire overlapping legacy routes one at a time, each with its own test and a documented reason.
- Update `docs/handoffs/LATEST.md`, the evidence register and `release-manifest.json` only with
  numbers reproduced by commands in this tree.

---

## 5. J01 build sheet (Phase 2 detail)

| ID | Route | Screen | Content intent | Hosted states |
|:--|:---|:---|:---|:---|
| PUB-001 | `/` | Corporate home | Value proposition, three operating pillars, status notice, verified contact CTA | PUB-022 statement revision history (CSV host) |
| PUB-002 | `/about` | About VMNL | Purpose, corporate profile, operating model; no unverified claims | — |
| PUB-003 | `/ecosystem` | Ecosystem map | Brands, services, storyworlds and federated Azeebo+ as distinct, linked families | — |
| PUB-004 | `/one-circle-explanation` | ONE CIRCLE explanation | Knowledge/SOP model explained for the public; links to support | — |
| PUB-005 | `/media-and-audience-overview` | Media and audience overview | Three channel profiles; carriage and reach explicitly unverified | — |
| PUB-006 | `/creative-economy-hub-overview` | Creative Economy Hub overview | Capability areas with links to `/capabilities/*` | — |
| PUB-007 | `/news` | Company news | Published statements only; truthful empty state | — (PUB-014 is hosted by PUB-001 per the CSV) |
| PUB-008 | `/news-and-announcement-detail` | News detail | Detail template with provenance label; no fabricated article | — |
| PUB-009 | `/media-press-contact` | Media/press contact | Press enquiry route + provenance | — |
| PUB-010 | `/corporate-governance-overview` | Governance overview | Governance model, approval boundaries, disclosure status | — |
| PUB-011 | `/contact` | Contact centre | Intent selector → enquiry routes; no auto-routing claim | PUB-015 selector |
| PUB-012 | `/support` | Help and support landing | FAQ, accessibility support, contact | — |
| PUB-013 | `/search` | Public search | Query form, scoped public results, no enterprise leakage | PUB-014 no eligible results (rendered by the search screen when no page matches) |
| PUB-016 | `/accessibility` | Accessibility statement | Target, known gaps, feedback route; no conformance claim | — |
| PUB-017 | `/privacy` | Privacy and cookie policy | Preliminary notice + cookie preferences | PUB-018 cookie preference centre |
| PUB-019 | `/terms` | Website terms and disclaimer | Terms and no-reliance disclaimer | — |
| PUB-020 | `/sitemap` | Sitemap and page index | Generated from the registry's public routes, grouped by journey | — |
| PUB-021 | `/public-corrections-and-factual-claim-report` | Corrections | Records a report; explicitly does not publish or correct | — |

**Content rules for J01:** no carriage numbers, no audience figures, no accreditation claims, no
"award-winning"/"leading" language, no fictional news, no implied partnerships. Any fact without a
source renders as "not published / require verification". The corporate identity (name, three
channels, federation model) is stated only as far as `CLAUDE.md` and the CSV already do.

---

## 6. Per-journey backlog (status)

Status values: `TODO` · `IN PROGRESS` · `DONE` · `BLOCKED_HUMAN` · `BLOCKED_SOURCE`.

| Journey | Phase | Status | Note |
|:---|:--|:---|:---|
| PUB J01 | 2 | DONE | 18 routed + 4 hosted; see §7 build record |
| BRI J02a | 3 | TODO | One template + 35 instances; drives the brand template |
| BRD J02 | 3 | TODO | 11 public rows |
| STW J03 | 3 | TODO | Azeebo+ gateway is a referral, not an embedded player |
| SERV J04 | 3 | TODO | 18 public rows |
| LEAD J05 | 3 | TODO | Wizards post to existing `/api/v1/enquiries` |
| AUTH J06 | 4 | TODO | Reuses existing auth; no parallel session store |
| CLT J07 | 5 | TODO | Client acceptance is a controlled decision |
| PART J08 | 5 | TODO | Sponsor cannot be shown as contracted until signed |
| LEARN J09 | 5 | TODO | Learner-first; no auto-admission |
| TAL J10 | 5 | TODO | Paid work requires engagement + rights |
| CAND J11 | 5 | TODO | Restricted-consent boundaries; blocked conditions explicit |
| CIRC J12 | 4 | TODO | Knowledge surfaces; audience-scoped |
| MISS J13 | 4 | TODO | Mission closure must not delete earned liabilities |
| CAP J14 | 4 | TODO | Resourcing views; no silent allocation |
| STUD J15 | 5 | TODO | Production assets; rights attached |
| EVNT J16 | 3 | TODO | 4 public rows first |
| IPR J17 | 5 | TODO | No rights inference from possession |
| CMS J18 | 4 | TODO | Publish gate remains human |
| BRC J19 | 5 | TODO | Proof-of-air ≠ schedule export; no invented carriage data |
| FIN J20 | 5 | TODO | Seven money concepts must stay distinct |
| GOV J21 | 5 | TODO | Privacy centre is public; the rest is gated |
| IA role mapping | 1 | BLOCKED_HUMAN | Inventory role IDs (`PUB`, `FAN`, `BRC`, …) have no authoritative mapping to `EnterpriseRole`; until one is approved, gates are session-bound, not role-bound. |
| IA hostPath divergence | 1 | BLOCKED_SOURCE | 11 hosted rows name a parent area in `HOSTED@` while their host serves another route (e.g. AUTH-005 `HOSTED@/account` → AUTH-001 `/sign-in`). `hostScreenId` is authoritative; the CSV needs a correction decision. |
| Legacy route retirement | 7 | TODO | `/`, `/about`, `/contact`, `/privacy`, `/accessibility` are now served by IA; `/enquiry`, `/help`, `/hub`, `/channels/*` still serve the legacy pages. |
| SYS J22 | 4 | TODO | Agent registry with owner, permissions, kill switch |
| EDGE J23 | 6 | TODO | 44 states, 11 public |

---

## 7. Verification protocol

Run after every phase, from the repository root, and record the exact commands:

```
pnpm ia:generate      # deterministic registry
pnpm typecheck        # tsc --noEmit (src + tests/browser)
pnpm lint             # eslint --max-warnings 0
pnpm test             # vitest run
```

Rules:

- A phase is not `DONE` because the page renders. It is done when its acceptance test exists and
  passes, its gate is enforced, its adverse states render, and no claim on the page exceeds the
  authority that produced it.
- Any check that cannot run in this environment (e.g. a Postgres-backed integration suite without a
  reachable database) is reported as a limitation, never as a pass.
- Numbers quoted in this plan must be reproducible by `pnpm ia:generate` and the registry test.

---

## 8. Build record — Phases 0–2 (2026-11-13)

### 8.1 What shipped

| Path | Role |
|:---|:---|
| [registry.generated.ts](src/web/ia/registry.generated.ts) | 619 records generated from the committed CSV; `pnpm ia:generate` fails on drift. |
| [index.ts](src/web/ia/index.ts) | Lookups: by id, by route (static before parameterised), journeys, hosted children, public pages. |
| [render.ts](src/web/ia/render.ts) | Contract renderer, compact provenance footer, safe 401 denial page. |
| [journey-pub.ts](src/web/ia/journey-pub.ts) | 18 bespoke PUB pages + the 4 hosted states. |
| [ia.routes.ts](src/api/routes/ia.routes.ts) | Route resolution, gate evaluation, dispatch, cache policy. |
| [router.ts](src/api/router.ts#L1267) | Calls `dispatchIARoute` after the guards and before the page handlers. |

Tests: [ia-registry.test.ts](tests/unit/ia-registry.test.ts) (14 cases),
[ia-journey-pub.test.ts](tests/unit/ia-journey-pub.test.ts) (19),
[ia-routing.test.ts](tests/integration/ia-routing.test.ts) (8).

### 8.2 Deviations from the written plan, and why

1. **Dispatch position.** The plan said "before the legacy chain". It is wired *after* the security
   headers, session resolution and `ROUTE_GUARDS`, and *before* the page handlers. Anything earlier
   would have let an inventory route answer before authorization ran.
2. **Role-scoped 403 is not implemented** (D3 amendment). The role IDs in the CSV are not this
   deployment's `EnterpriseRole` values; mapping them is a business decision.
3. **Provenance footer instead of a full contract page on public screens.** A document-grade
   contract block on every J01 page pushed `/` to 29,880 bytes, over the 25 KB public-shell budget.
   The identifiers stay visible; the long contract fields sit behind a `<details>` (3,075 bytes).
   `/` now measures 24,728 bytes.
4. **Retained legacy content inside IA pages.** `/about`, `/privacy`, `/accessibility`, `/contact`
   still render their reviewed content; the IA page adds the inventory identifiers and hosted
   states. No reviewed wording was discarded to make the registry fit.
5. **One legacy defect fixed while wiring the intent selector.** `GENERAL_ENQUIRY` had no
   `selected` attribute, so `/contact` always displayed "Television Advertising & Spots" whatever
   intent the visitor arrived with. The option now honours the passed vertical.
6. **Sitemap omits journeys with no public page.** Listing a journey whose only rows are gated would
   advertise a section the visitor cannot open.

### 8.3 Findings that need a human decision

- **Role mapping** (`BLOCKED_HUMAN`): until the inventory role IDs map onto `EnterpriseRole`, gates
  are session-bound and a `W3` surface shows its contract to any signed-in session — with no record.
- **`HOSTED@` path vs host route** (`BLOCKED_SOURCE`): 11 rows disagree with their host's route
  (10 × `HOSTED@/account` under AUTH-001 `/sign-in`, 1 × `HOSTED@/brands` under BRD-008). The
  generator resolves the host *location* from the declared host chain and keeps `hostScreenId` as
  the authoritative link; the CSV itself should be corrected or accepted as area-scoped.
- **`GLOBAL_STATE` rows** (`STATE@HOST`, 44 EDGE/J23 rows) own no URL by definition; they render as
  contract text on their host and must be wired to real handlers in Phase 6.
- **One public route lives under `/workspace`** (LEARN-001, gate `W0`). The sitemap publishes it as
  the authority states; whether an applicant-facing discovery page should sit under `/workspace` is
  an IA decision, not an implementation one.

### 8.4 Verification (2026-11-13)

```
pnpm ia:generate   → 619 records, 393 routed, 226 hosted, 358 route patterns, 24 journeys; --check OK
pnpm typecheck     → clean
pnpm lint          → clean (registry.generated.ts excluded: machine-generated, checked by ia:generate)
pnpm test          → 958 passed, 30 skipped, 4 failed (all four environmental — see below)
```

Targeted suites: `ia-registry` 14/14, `ia-journey-pub` 19/19, `ia-routing` 8/8,
`enterprise-end-to-end` 42/42, `html-escape-census` 4/4, `performance-budget-measurement` 5/5,
`threat-model` 6/6, `canonical-model` 13/13.

**Limitation (not a pass):** four cases fail in this environment, none of them in code this change
touched:

- `production-readiness-controls` › PR-08 — asserts `database: connected`; the probe reports
  `unavailable` because no Postgres is reachable.
- `tenant-scoping-routes` › TSK-58 box 1 — reads back `contentItemRecord` through Prisma; no
  database.
- `release-gate-commit-binding` › two PR-03 cases — the committed `release-manifest.json` evidence is
  45 days old against a 30-day policy, and HEAD has moved past the pinned commit.

Re-run them where the database, a freshly pinned manifest and a signed evidence set exist.

---

## 9. Stop conditions

Pause and ask rather than invent:

- A screen requires a business/legal/financial decision the inventory does not define.
- Two authority rows conflict on gate, role, or permitted effect.
- A required data source does not exist and the screen cannot truthfully render without it.
- A route would collide with an existing live route in a way that changes its meaning.
- A destructive change to existing routes or data would be required to proceed.
