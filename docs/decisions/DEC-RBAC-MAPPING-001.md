# DEC: Mapping the IA inventory's role IDs onto `EnterpriseRole`

**Status:** `PROPOSED` — decision required before any gate changes. No code changes accompany this record.
**Date:** 2026-11-19
**Authority:** `docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv` (the inventory);
`VMNL-AZP-VMN-BRD-PRD-001 — R1.2A` §48/§49 (the 17 broadcast capability roles and the role matrix);
`VMNL-AZP-VMN-CCPP-001 — R1.1` §security (least privilege, server-side authorisation, no UI-hidden authorisation);
CLAUDE.md canonical law 1 (one identity, many roles) and `<stop_conditions>` (a business decision is not an
engineering inference).

## Context

The inventory declares **619 screens** across six gates: `W0` 133 (anonymous), `W1` 67, `W2` 78, `W3` 196,
`W4` 141, `G` 4 (flag-disabled). Every one of the 486 non-public screens names the desks that may open it in
its `Role IDs` column — **51 distinct role IDs**.

This deployment authorises people through `EnterpriseRole` (`src/core/rbac/index.ts`): 28 roles, 16 resources,
84 rules for `SuperAdmin`. The IA router deliberately does not bridge the two vocabularies. `evaluateIAAccess`
in [ia.routes.ts](../../src/api/routes/ia.routes.ts) answers `PUBLIC` / `AUTHENTICATED` / `SESSION_REQUIRED` and
nothing else, and the file's own header states why:

> the inventories' role IDs have no authoritative mapping onto this deployment's `EnterpriseRole` set yet.
> Inventing that mapping would be a business decision, so role-scoped 403 is not claimed here.

So the observable behaviour today is: **no IA screen can return 403**. An anonymous request to `FIN-005` gets
401; a signed-in `Operator` gets 200 and the same page a `CFO` gets. The routing test states the status quo as a
requirement — *"answers 401 anonymously and 200 for a session on every routed path"*
([ia-routing.test.ts:253](../../tests/integration/ia-routing.test.ts#L253)) — which is exactly the assertion this
decision would replace. The denial renderer already supports the
destination state — `renderIADenialScreen(screen, pathname, 403)` in [render.ts](../../src/web/ia/render.ts) has
a 403 branch with an `/access-request` recourse — but no caller can reach it.

This record is the mapping decision that would make it reachable. It is written as a proposal because the
mapping is not derivable: three vocabularies have to be aligned, and in the current matrices they do not align
cleanly anywhere.

## The finding that shapes the decision

**F1 — role ID → `EnterpriseRole` mapping produces no exact closure.** The assertion available to a screen is a
`(action, resource)` rule evaluated by `canPerform`: every role that holds the rule is admitted, every other role
is denied. `SuperAdmin` holds all 84 rules, so it is never denied, and every resource has at least one
non-`SuperAdmin` reader (`read:finance` → `ExecutiveLeader`, `FinanceController`, `Auditor`,
`AdSalesCommercialManager`, `BroadcastFinanceAssurance`). A screen is therefore *exactly* closed — its denial
matches its own recorded role list — only when the translated role set equals the rule's reader set.
**No inventory desk set equals any rule's reader set. Zero screens close this way.**

**F2 — every candidate mapping is therefore a narrowing or a self-denial.**

| Failure | Example | What it means |
|:---|:---|:---|
| **Narrowing** (rule admits more desks than the inventory names) | `IPR-004` names `RIGHTS`; `read:rights` also admits `HeadOfBroadcast`, `BroadcastDirector`, `ProgrammeScheduler`, `Auditor`, `ExecutiveLeader` | The screen would deny desks the matrix grants. Legitimate for approvals, but someone must own that contradiction. |
| **Self-denial** (rule admits fewer) | `SYS-004` names `ENG`; `BroadcastEngineer` does not hold `read:agent` | The screen would deny a desk the inventory names — the matrix or the inventory is wrong. |

Both are decisions, not lookups. The 22 self-denials are concentrated in the `SYS`/`EDGE` agent-registry screens
where the inventory names `ENG` and `PRODCT`: the inventory treats release evidence as a broadcast engineer's
read, the matrix does not. One of the two documents is incomplete.

**F3 — object families are finer than resources.** The inventory's `Domain objects / source data` column has 24
distinct families; `EnterpriseResource` has 16. Most families collapse onto one resource, but four have no
resource at all — knowledge/SOP (`SOPRef; KnowledgeSource; SourceConflict`), work/mission
(`Mission; MissionApproval; WorkEvidence; Handoff`), identity (`PersonRelationship; Session; Invitation;
Consent`), and events (`Event; VenueContract; SafetyHold; RefundCase`) — and one family spans two that must be
kept apart (F4).

**F4 — `read:case` is too coarse for the privacy screens it would open.** `case` permissions derive mechanically
from `read:audit` in `registerDerivedRolePermissions`, so the restricted-case queue is addressable by
`FinanceController` and `MCRSupervisor`. The domain restricts *record* reads further (`canReadCase`), but
admitting a role to a confidential-case queue is a privacy decision, not a mapping detail. This is why the 25
`GOV` screens, whose object family spans `Contract` and `PeopleCase`/`PrivacyRequest`, are outside wave 1.

## Screen census

Derived from the inventory's `Gate`, `Role IDs` and `Domain objects / source data` columns, plus
`ROLE_PERMISSIONS` as resolved at import (i.e. after `registerDerivedRolePermissions`). Buckets are applied in
this order, so they sum to 619.

| Bucket | Screens | Consequence today | After this decision |
|:---|---:|:---|:---|
| `W0` public | 133 | anonymous read | unchanged — no 403, ever |
| `G` flag-disabled | 4 | flag state | unchanged |
| Session-class only | 154 | 401 → 200 with a session | unchanged — see D5 |
| Mixed session + desk | 18 | as above for the staff part | staff part mappable; session part still session-only |
| Unmodelled desk ID | 141 | 401 → 200 | unchanged — no counterpart role exists |
| Contested desk ID | 73 | 401 → 200 | needs a named choice (D2) |
| Matrix gap | 22 | 401 → 200 | needs a grant or an inventory correction (F2) |
| Resource gap | 27 | 401 → 200 | needs a resource declaration (F3) |
| **Wave 1** | **47** | 401 → 200 | **401 → 403** (41 real desks + 6 `SuperAdmin`-only, D2) |

## Decision

### D1 — The unit of mapping is the screen, not the role ID

A mapping is a record, one per screen, and it is the only thing a gate may consult:

| Field | Source of truth |
|:---|:---|
| `screenId` | inventory `ID` |
| `roleIds` | inventory `Role IDs`, verbatim |
| `assertedRule` | `action:resource` drawn from `EnterpriseResource` — `read:<resource>` for the screen, plus `approve:<resource>` where the screen's submit path is consequential |
| `admittedRoles` | computed from the matrix at review time (never typed by hand) |
| `evidence` | the inventory row + the matrix rule + the reader-set listing that the reviewer saw |
| `owner` | the named office from `Responsible source office` that signs |
| `decision` | `EXACT` (reserved; unreachable today per F1), `WIDEN` (matrix readers beyond the inventory's desks are admitted), `NARROW` (they are denied, and the denied desks are listed), or `CARD` (not a mapping — T2 or T4 failed) |
| `date` + `recordedBy` | when and by whom |

Role-ID → role tables below are **candidates**. They shorten the review; they are not the decision.

### D2 — Role-ID disposition

51 IDs, four dispositions.

**Session classes (15) — no `EnterpriseRole`, and none should be invented.** `PUB`, `FAN`, `EMP`, `CLI`, `PART`,
`TAL`, `CAST`, `APP`, `LEARN`, `ALUM`, `TRAIN`, `SPO`, `VEN`, `RIGHTSH`, `DIST`. These are relationship states
proved by a session, not authorisation roles. A screen naming only these is a W1 read for a signed-in party and
correctly has no 403.

**Forced (14) — exactly one role can carry the desk under the current matrix.**

| ID | Screens (gated) | Role | Note |
|:---|---:|:---|:---|
| `FIN` | 56 | `FinanceController` | |
| `CFO` | 19 | `FinanceController` | dual-hat with `FIN`; no separate controller role |
| `RIGHTS` | 23 | `RightsManager` | |
| `ENG` | 24 | `BroadcastEngineer` | self-denies on `agent` (F2) |
| `EXEC` | 21 | `ExecutiveLeader` | |
| `PRODCT` | 21 | `PromoProducer` | self-denies on `agent` (F2) |
| `TRAFF` | 19 | `TrafficManager` | narrowing: `read:traffic` is also held by the commercial-traffic and ad-sales desks |
| `AUDIT` | 18 | `Auditor` | |
| `PEOPLE` | 12 | `SuperAdmin` | widening |
| `DPO` | 11 | `SuperAdmin` | widening — see F4 |
| `LEGAL` | 51 | `SuperAdmin` | widening — largest single mismatch in the inventory |
| `MCR` | 7 | `MCRSupervisor` | |
| `BRAND` | 23 | `SuperAdmin` | widening — the deployment has no brand-steward role |
| `SEC` | 25 | `SuperAdmin` | widening, but the only defensible one |

**Contested (6) — two legitimate roles; the choice changes who can approve.**

| ID | Screens | Candidates | Why it is a decision |
|:---|---:|:---|:---|
| `BCAST` | 21 | `HeadOfBroadcast` \| `BroadcastDirector` | `HeadOfBroadcast` holds `approve:rights`; `BroadcastDirector` holds `approve:schedule`. Not interchangeable. |
| `PROD` | 34 | `HeadOfProgramming` \| `ProgrammeScheduler` | producer-of-record vs schedule author |
| `EDITOR` | 25 | `ProgrammeScheduler` \| `PromoProducer` | publication authority vs content creation |
| `HUB` | 14 | `CommercialTrafficOfficer` \| `TrafficManager` | enquiry ownership |
| `COM` | 16 | `CommercialTrafficOfficer` \| `AdSalesCommercialManager` | deal ownership vs sales-approval authority |
| `ADMIN` | 4 | `SuperAdmin` \| `ExecutiveLeader` | platform administration vs executive oversight |

**Unmodelled (16) — no counterpart role exists. Each is a card, not a mapping.**
`MO` 36, `CAP` 21, `EVENT` 14, `BUIL` 12, `TEND` 12, `COACH` 11, `KNOW` 11, `MARK` 9, `VTM` 8, `AFCA` 8,
`AGENT` 7, `ACC` 6, `SOLV` 6, `SUP` 4, `VCF` 2, `AZP` 1. These are the operating desks of the mission,
capability, knowledge, events, learning and federation surfaces. Mapping them onto an unrelated role would grant
the role's whole matrix to a desk that never earned it — the exact widening CLAUDE.md's least-privilege rule
forbids.

### D3 — Wave 1: the screens that would then earn a 403

47 screens. The 403 set depends only on the asserted rule, so it is listed once per resource.

| Resource | Screens | Asserted rule | Reader set | 403 set |
|:---|---:|:---|:---|:---|
| `finance` | 26 | `read:finance` | `SuperAdmin`, `FinanceController`, `ExecutiveLeader`, `Auditor`, `AdSalesCommercialManager`, `BroadcastFinanceAssurance` | 22 roles — every broadcast, traffic, rights, talent, academy and playout role |
| `rights` | 5 | `read:rights` | `SuperAdmin`, `RightsManager`, `HeadOfBroadcast`, `BroadcastDirector`, `AcquisitionsCommissioningManager`, `BroadcastRightsCoordinator`, `ProgrammeScheduler`, `Auditor`, `ExecutiveLeader` | 19 roles — including `FinanceController` and `TalentManager` |
| `broadcast` | 7 | `read:broadcast` | 18 roles (all broadcast, MCR, playout, traffic, rights and audit desks) | 10 roles — `AcademyDirector`, `AcquisitionsCommissioningManager`, `AdSalesCommercialManager`, `BroadcastFinanceAssurance`, `BroadcastRightsCoordinator`, `CommercialTrafficOfficer`, `FinanceController`, `PlayoutMcoOperator`, `SponsorshipManager`, `TalentManager` |
| `agent` | 4 | `read:agent` | `SuperAdmin`, `ExecutiveLeader`, `Auditor` | 25 roles |
| `content` | 3 | `read:content` | as `broadcast` | as `broadcast` |
| `talent` | 2 | `read:talent` | `SuperAdmin`, `TalentManager`, `AcademyDirector`, `Auditor`, `ExecutiveLeader` | 23 roles |

Screen IDs: `FIN-001`, `004`, `005`, `008`, `009`, `011`–`020`, `022`–`030`, `032`, `035` (26);
`IPR-003`, `004`, `006`, `007`, `008` (5); `BRC-006`, `007`, `008`, `014`, `015`, `016`, `019` (7);
`SYS-020`, `021`, `027`, `036` (4); `BRD-010`, `011`, `CMS-014` (3); `CAND-007`, `008` (2).

**41 of the 47 admit at least one non-`SuperAdmin` desk.** The other 6 — `SYS-020`, `SYS-027`, `BRD-010`,
`CMS-014`, `CAND-007`, `CAND-008` — resolve only to `SuperAdmin` (`BRAND`, `DPO`, `PEOPLE`, `SEC`). A 403 for
every other role on those screens is arithmetically correct and organisationally wrong: it would encode "only
the platform superuser may see the brand library" as a security control. They are recorded as `CARD`s under D2
(T4), not as mappings, and their 403 is not claimed by this decision.

Wave 1 deliberately contains no `W4` screen whose approval authority relies on a contested ID and no `GOV`
screen: the `GOV` object family spans `Contract` and restricted `PeopleCase`/`PrivacyRequest`, which the matrix
does not separate (F4), so its resource cannot be declared without a privacy decision.

### D4 — What a 403 means at the boundary

1. **No session → 401.** Unchanged. `SESSION_REQUIRED` is not a role decision.
2. **Session, rule not held → 403** with `renderIADenialScreen(screen, pathname, 403)` — the existing page:
   gate chip, screen name, the inventory's `permissionContract`, recorded roles, and `/access-request` +
   `/support` recourse.
3. **No record read on denial.** The page states no count, status or field from the screen's source data. This
   is already the renderer's contract and must not weaken.
4. **`SuperAdmin` is never denied** a mapped rule; it holds all 84. The exemption is the matrix, not a branch.
5. **Tenant claim still only denies.** `accessContextFor` / `evaluateAccess` refuse a foreign `x-tenant-id`
   regardless of role — a 403 from `TENANT_SCOPE` must be distinguishable in the audit event from
   `NO_ROLE_PERMISSION`.
6. **Unknown path → 404, not 403.** A 403 on a non-existent screen is an enumeration oracle and would advertise
   which inventory screens exist to unauthorised parties.
7. **One audit event per denial**: `RBAC_DENIED` with `screenId`, `assertedRule`, the caller's roles, and the
   denial reason. Not the record, not the URL query.

### D5 — What stays 401-only, and for how long

439 screens: 154 session-class, 18 mixed, 141 unmodelled desk, 73 contested, 22 matrix gap, 27 resource gap,
4 flag-disabled. They are owed six register rows — one per decision type, not one per screen — each naming the
missing decision and its owner. Until those rows close,
`evaluateIAAccess` remains correct as written and `ia.routes.ts`'s comment stays true.

### D6 — Options considered

| Option | Mechanism | Cost | Verdict |
|:---|:---|:---|:---|
| **A. Rule-based read** (recommended for W1–W3) | Screen declares `read:<resource>`; `canPerform` decides | 47 screens now; each mapping is a 1-line record; narrowing must be signed | Recommended. Reuses the existing policy engine, one denial reason, no new control. |
| **B. Record allow-list** | Screen declares `admittedRoles`; a registry check decides, bypassing the matrix | Exact least privilege; 169 screens (plus the 18 mixed) reachable today, 141 more after option C | Recommended **only** for `W4` approval authority, where the inventory's named desks *are* the approval decision and the matrix's reader set is too wide to be an approver list. |
| **C. New roles / new resources** | Add `LegalCounsel`, `DataProtectionOfficer`, `BrandSteward`, `KnowledgeSteward`, `MissionOwner`, `EventOfficer` + `knowledge`, `work`, `event` resources | Role-matrix change, seed-role invariant, the five open questions below | Necessary for the 141 unmodelled screens and the 4 unrepresentable object families; out of scope for wave 1. Nothing in wave 1 depends on it. |

## Evidence each mapping needs

A record is admissible only when all four tests pass and are visible in the record.

| Test | Statement | Evidence |
|:---|:---|:---|
| **T1 Name-only** | Every role ID the inventory names resolves; nothing is added, nothing dropped | inventory row quoted in `evidence` |
| **T2 No self-denial** | Every resolved desk holds `assertedRule` | `canPerform(desk, rule)` = true, printed at review |
| **T3 No unrecorded over-admission** | Every holder of `assertedRule` is either named by the inventory (a `WIDEN`) or denied with a signed `NARROW` note listing the denied desks and why | reader-set listing at review |
| **T4 No `SuperAdmin` shortcut** | If the only resolved role is `SuperAdmin`, the record is a `CARD` and its 403 is not claimed | record `decision` field |

Two worked records, one admissible and one not:

```
screenId     FIN-005
roleIds      FIN
gate W3      "Authenticated/scoped professional tenant or approved referral"
assertedRule read:finance
admitted     SuperAdmin, FinanceController, ExecutiveLeader, Auditor,
             AdSalesCommercialManager, BroadcastFinanceAssurance
evidence     inventory FIN-005 ("Finance/controller"; Invoice; BankReceipt; AR; AP;
             CashForecast; Settlement) + ROLE_PERMISSIONS.read:finance, 2026-11-19
decision     WIDEN — the matrix admits five roles beyond FinanceController
             (four non-SA readers plus SuperAdmin); the inventory names one desk.
             Accepted by the CFO office, dated.
owner        CFO / delegated Finance + Treasury
```

```
screenId     SYS-004
roleIds      ENG
gate W1      "Authenticated relationship, authorised purpose and source read permission"
assertedRule read:agent
admitted     SuperAdmin, ExecutiveLeader, Auditor
evidence     inventory SYS-004 + ROLE_PERMISSIONS.read:agent, 2026-11-19
decision     CARD — T2 fails: BroadcastEngineer holds no read:agent.
             Falls to a matrix-gap card (F2), not a mapping.
```

For `W4`, the record carries a second rule — `approve:<resource>` — and must name the DoA holder from the
inventory's `Consequential effect permitted` text. Twenty-nine of the 47 wave-1 screens are `W4`, and **eight of
them fail T2 on that second rule today**: `BRD-011` (`PromoProducer`), `BRC-007`, `008`, `019`
(`TrafficManager`), `BRC-014`, `016` (`MCRSupervisor` + `TrafficManager`), `FIN-032` and `SYS-036` (`Auditor`).
`approve:broadcast` belongs only to `HeadOfBroadcast`, `BroadcastDirector` and `SuperAdmin`; `approve:agent` to
`SuperAdmin` alone. Their *read* 403 stands; their *approval* authority does not, and their submit paths stay
closed until the matrix or the record is corrected.

## Enforcement (to be added with the implementing change, not by this record)

- A registry-derived test: every `W1`–`W4` route is either mapped with a resolvable rule or carries an explicit
  `session-only` / `unmodelled` / `contested` card. A route with neither fails the build.
- The decision itself comes from `assertPermission` / `evaluateAccess` (shared with `assertRoutePermission`), but
the response must be shaped as a page, not as JSON: `assertRoutePermission`
([router.ts:769](../../src/api/router.ts#L769)) answers API callers with `AUTH_TOKEN_REQUIRED` /
`INSUFFICIENT_PERMISSIONS` JSON, while an IA screen owes the 403 document. Same predicate, different
serialisation. The assertion runs in `dispatchIARoute` **before** any body renderer, so the 403 precedes the
read (the inventory's "inherit the originating record permission even while displaying an error").
- Denial-matrix test: anonymous → 401 on every gated screen; session without the rule → 403; `SuperAdmin` → 200;
  unknown path → 404; and no source record is touched on a denied request.
- A test that recomputes each record's `admittedRoles` from `ROLE_PERMISSIONS`, so a future matrix edit that
  widens a resource fails against the record instead of silently granting.
- `tests/unit/ia-public-journeys.test.ts` and `tests/integration/ia-routing.test.ts` currently assert 401-only
  behaviour; they change with the implementation, not before it.

## Consequences

- **41 screens become genuinely role-scoped**, and for 8 of them only the read side: their approval control
  stays disabled because the named approver desk holds no `approve` rule. Their `/access-request` path stops
  being decorative — it becomes the recourse a denied colleague actually reaches.
- **The inventory's role lists stop being decorative too** — but only where a record exists. Any screen without
  one still renders to any signed-in session, which is the status quo this record does not change.
- **A signed `WIDEN` or `NARROW` is a durable statement.** Either `FinanceController` may read an IPR screen the
  inventory does not name for it (`WIDEN`), or it may not, even though the matrix grants `read:rights`
  (`NARROW`). That is the first place the deployment's least privilege will contradict the role matrix in
  writing — and it will say which way, by whom, and when.
- **Reversible**: each record is additive; deleting a record restores 401-and-200 behaviour exactly, and no
  permission, seed role or tenant binding changes.

## What this record does not decide

- Per-record, per-tenant or per-organisation scoping inside a screen. RBAC admits a *role* to a *resource*; row
  filters remain handler-level and out of scope.
- Whether the inventory's role lists may be **widened** to the matrix's reader sets. That is the decisive open
  question for wave 1 (T3), and it belongs to the inventory's owning offices, not to this repository.
- The 22 matrix gaps, the 6 contested IDs, the 141 unmodelled descriptors, the 4 unrepresentable object families,
  and `read:case`'s derivation from `read:audit` (F4).
- Any change to `EnterpriseRole`, `EnterpriseResource` or `ROLE_PERMISSIONS`.

## Open questions for the authority

1. Who signs a mapping for each `Responsible source office` — is one named signatory per office acceptable, or
   does `Company Secretary / Legal / People / DPO` need two?
2. Is `LEGAL` → `SuperAdmin` (51 screens), `DPO` → `SuperAdmin` (11), `BRAND` → `SuperAdmin` (23),
   `PEOPLE` → `SuperAdmin` (12) an accepted widening, or must wave 1 wait for option C's dedicated roles?
3. May a screen **narrow** the matrix (T3) — deny a role the matrix grants — and if so, is the inventory's role
   list the authority for doing it?
4. `BCAST`: `HeadOfBroadcast` or `BroadcastDirector`? Their approval rules are not interchangeable.
5. Who owns the 22 `agent`-registry grants — matrix (`ENG`, `PRODCT` gain `read:agent`) or inventory (drops them)?
6. Should `W4` approval authority use option B (record allow-list) rather than the matrix, given that 8 of the 29
   wave-1 `W4` screens name approvers the matrix does not authorise to approve?
7. Does admitting `FinanceController` and `MCRSupervisor` to the restricted-case queue via `read:case` satisfy the
   privacy review required by canonical law 12, or does `case` need splitting?
