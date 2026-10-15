# State machines as implemented

**Register:** `tasks.md` TSK-12 box 3 (and TSK-52 box 2) · **Authority for §1:**
`docs/authorities/VMNL-AZP-VMN-BRD-PRD-001-R1.2A.md` §15 (`:711-719`)
**Measured:** 2026-10-08 (`ce098f8` + the TSK-12 tree); re-measured and re-pinned 2026-10-15, and
`tests/unit/state-machine-doc-pins.test.ts` now re-opens every pin here on each `pnpm test` run
**Rule applied:** 0.2 *evidence before claims*, 0.4 *honest statuses*.

This document describes the machine **in the code**, not the machine the PRD
aspires to. Where the two differ, the difference is written down as a finding
instead of being smoothed over — CA-14 happened because a handoff described the
aspirational lifecycle (`PENDING_APPROVAL`-shaped) as if it were the §15 chain.

Two labels are used throughout and they are not synonyms:

* **guarded** — the mutator reads the current state and throws on an illegal
  source state, so a caller cannot reach a stage by skipping one;
* **unguarded** — the mutator assigns the state it was handed. Nothing in the
  code stops an out-of-order write; the field is a *label*, not a control.

Every line reference below was opened and read on the measuring date. Re-measure
a figure with the quoted command before repeating it.

---

## 1. Broadcast schedule day — the PRD §15 chain

**Code:** `src/modules/broadcast/versions/index.ts`
**Tests:** `tests/unit/broadcast-schedule-lifecycle.test.ts` (13 tests, every edge),
`tests/unit/broadcast-rights-gate.test.ts` (12), `tests/unit/todo-remediation.test.ts`
(revision identity in exports).

### 1.1 States

`PRD_SCHEDULE_CHAIN` is declared at `:179-189` and the union at `:191-193`:

```ts
export type ScheduleState = PrdScheduleState | ScheduleControlState;
```

| # | State | Kind | Entered by |
|:--|:---|:---|:---|
| 1 | `DRAFT` | PRD | `upsertDraftSchedule` (`:382`) |
| 2 | `PROGRAMMING_REVIEW` | PRD | `submitScheduleForApproval` (`:428`) |
| 3 | `RIGHTS_CHECK` | PRD | `passProgrammingReview` (`:449`) |
| 4 | `TRAFFIC_READY` | PRD | `passRightsCheck` (`:467`) — the *stage is entered by the gate clearing*, not by a traffic officer |
| 5 | `APPROVED` | PRD | `approveSchedule` (`:536`) |
| 6 | `PLAYLIST_GENERATED` | PRD | `generatePlaylist` (`:665`) |
| 7 | `ON_AIR` | PRD | `markOnAir` (`:765`) — evidence-only |
| 8 | `AS_RUN_RECONCILED` | PRD | `reconcileAsRun` (`:795`) — evidence-only |
| 9 | `ARCHIVED` | PRD | `archiveSchedule` (`:849`) |
| — | `AMENDED` | implementation control | `amendSchedule` (`:616`) — an approved day carried at a newer revision |
| — | `LOCKED` | implementation control | `lockScheduleIfPastLockout` (`:601`), and as the refusal side-effect of `[SCHED-LOCK-02]` inside `amendSchedule` (`:628-629`) |

`AMENDED` and `LOCKED` are **not** §15 stages and are not presented as such: they
are controls on an already-approved day, and both stay approved-for-air sources
(`isApprovedForAir`, `:206-208`; the set is `APPROVED, AMENDED, LOCKED,
PLAYLIST_GENERATED, ON_AIR, AS_RUN_RECONCILED, ARCHIVED`). `LOCKED` overlays
`APPROVED`/`AMENDED`/`PLAYLIST_GENERATED` once `lockoutAt` has passed (`:604-607`),
and a locked day that later goes ON AIR is still reported as LOCKED — the lock
outlives the stage it was applied to.

> **Not a state machine fact, but load-bearing:** the schedule machine no longer
> has a `PENDING_APPROVAL` stage. It was the old machine's stage-2 name (the
> comment at `:140` records that and why it was wrong, per CA-14), and the EPG
> export layer used it as its eligibility filter, which is how a day that had
> never met the §15 gates could be exported. The string survives in `src/` only
> as `"PENDING_APPROVAL"` inside `CommercialProposal.ProposalStatus`
> (`src/web/workspace/commercial-proposal.ts:28`) and as the different literal
> `"DRAFT_PENDING_APPROVAL"` in the payouts machine
> (`src/modules/finance/payouts/index.ts:38`) — two other machines, not this one.
> Re-measure: `grep -rn '"PENDING_APPROVAL"' src/ | grep -v commercial-proposal`
> → no output.

### 1.2 Transitions and their guards

Every state change in the machine is guarded. The eleven rows below are the
complete set of transitions the code implements, and their refusal codes are
asserted edge-by-edge in the lifecycle suite.

| Transition | Guard that refuses it | Authority recorded on the record |
|:---|:---|:---|
| → `DRAFT` (re-draft) | `[SCHED-STATE-01]` `:390,:403` — only DRAFT/AMENDED may be re-drafted | — |
| `DRAFT`/`AMENDED` → `PROGRAMMING_REVIEW` | `[SCHED-STATE-02]` `:435`; blank actor `[SCHED-SUB-01]` `:431`; structural validation `[SCHED-VAL-01/02/03/06/07]` `:350-375` and `[SCHED-VAL-00/04]` `:438,:442`; rights annotation `[SCHED-RIGHTS-01/02]` `:353,:356` | `submittedBy` |
| → `RIGHTS_CHECK` | `[SCHED-STATE-05]` `:453`; blank reviewer `[SCHED-PRV-01]` `:455` | `reviewedBy` |
| → `TRAFFIC_READY` | `[SCHED-STATE-06]` `:471`; blank checker `[SCHED-RIGHTS-04]` `:473`; **clearance refusal `[SCHED-RIGHTS-03]` `:477`** | `rightsCheck {checkedBy, at, entriesChecked}` |
| traffic attestation (no stage change) | `[SCHED-STATE-07]` `:496`; blank officer `[SCHED-TRAF-01]` `:490,:498` | `trafficReady {attestedBy, at}` |
| → `APPROVED` | `[SCHED-STATE-03]` `:541` (must be TRAFFIC_READY); `[SCHED-APR-01]` `:545`; missing rights pass `[SCHED-APR-02]` `:547`; missing traffic attestation `[SCHED-APR-03]` `:550`; **gate re-run `[SCHED-RIGHTS-03]` `:555`** | `approvedBy`, `approvedAt`, `lockoutAt`, revision `…#R1` |
| → `AMENDED` | `[SCHED-LOCK-01]` `:620`; `[SCHED-STATE-04]` `:623` (only APPROVED/AMENDED — a day already at PLAYLIST_GENERATED is out of amendment's reach); `[SCHED-AMD-01]` `:625`; `[SCHED-LOCK-02]` `:629`; `[SCHED-AMD-02]` `:633`; re-cleared `[SCHED-RIGHTS-03]` `:641` | new revision, re-run `rightsCheck` |
| → `PLAYLIST_GENERATED` | `[SCHED-STATE-08]` `:671` (only APPROVED/AMENDED/LOCKED); blank actor `[SCHED-PLS-01]` `:675`; no revision identity `[SCHED-PLS-02]` `:677` | `playlist {generatedBy, at, revisionId, playlistId}`; a LOCKED day stays LOCKED |
| → `ON_AIR` | `[SCHED-STATE-09]` `:769` (only PLAYLIST_GENERATED/LOCKED); `[SCHED-AIR-01…09]` `:695-772` | `onAir` (the accepted evidence) |
| → `AS_RUN_RECONCILED` | `[SCHED-STATE-10]` `:804`; `[SCHED-REC-00/01/02/04]` `:806-824` | `asRunReconciled` + per-entry artifacts |
| → `ARCHIVED` | `[SCHED-STATE-11]` `:853`; `[SCHED-ARC-01]` `:855` | `archivedAt` |

`[SCHED-REC-03]` is deliberately absent: the code numbers the refusals it
actually implements, not a dense sequence.

### 1.3 The two §15 requirements that are *not* stages

* **Blocked candidate** (§15 `:715`): a DRAFT may hold an uncleared entry, but
  `passRightsCheck` refuses it (`[SCHED-RIGHTS-03]`), so it cannot reach an
  approved/exportable schedule, an executable playlist, or transmission — each of
  those is separately refused, not merely un-reached. Decided on **registered
  `RightsRecord` rows**, never on the entry's free-text `rightsClearedBy`
  annotation (TSK-10 / CA-07).
* **Revision identity** (§15 `:717`): `revision` + `revisionId`
  (`SCHED-…#R1`) are appended at approval and at each amendment; a revision's
  entry set is frozen (`Object.isFrozen`, asserted at
  `tests/unit/broadcast-schedule-lifecycle.test.ts:335`). Exports name the source
  revision — `<source-revision>` in the XMLTV payload
  (`src/modules/broadcast/epg/index.ts`), `ApprovedScheduleDay.revisionId`
  (`src/modules/broadcast/export/approved-schedules.ts`), and
  `SCHEDULE_REVISION_IDENTITY_MISSING` in
  `src/modules/broadcast/export/epg.ts` refuses an unattributed day rather than
  exporting something that cannot be traced.

A measured invariant worth knowing: a day with an executable playlist is out of
amendment's reach (`[SCHED-STATE-04]`), so **a playlist always names the
revision currently approved**. That is why no "discard the stale playlist" branch
exists in `amendSchedule`/`upsertDraftSchedule` — it was unreachable code.

### 1.4 What is NOT true of this machine

* **`TRAFFIC_READY` is an attestation, not a computed check.** `passTrafficCheck`
  records that a named officer attested the commercial/traffic control; the code
  does not verify avail, make-good or sponsorship state to earn that stage.
  Automating it is TSK-11/TSK-16. Calling it a gate would repeat CA-08's
  fabrication.
* **ON AIR and AS_RUN_RECONCILED cannot be asserted by a flag.** They verify
  evidence against the proof-of-air certificate registry
  (`src/modules/broadcast/asrun/`) — `[SCHED-AIR-05]` unknown certificate,
  `[SCHED-AIR-06]` unverified/unsigned, `[SCHED-AIR-07]` evidence contradicting
  the certificate, `[SCHED-AIR-08]` observed outside the WAT broadcast day,
  `[SCHED-AIR-09]` evidence from another channel.
* **The day lives in an in-memory `Map`** (`schedules`, `:318`) — sandbox state,
  not persistence (Rule 0.4a). No schedule-shaped Prisma model exists (re-measure:
  `grep -n "^\(model\|enum\).*[Ss]ched" prisma/schema.prisma` → no matches, against
  the 37 models/enums the schema does declare). See TSK-17 and
  `docs/audit/evidence-register.md`.

---

## 2. Approval workflow (generic, non-schedule)

**Code:** `src/core/approvals/index.ts` — `status: "PENDING" | "APPROVED" |
"REJECTED"` inline at `:34` (there is **no exported `ApprovalStatus` type**),
`decideApproval` at `:111`.

Guarded, and unusual in this repo in that it **returns a result object instead of
throwing**: `if (item.status !== "PENDING")` → `APR_ALREADY_DECIDED` (`:126-128`).
Separation-of-duties and authority checks follow (`[APR_FORBIDDEN]`,
`APR_STALE_REVISION`, `APR_SOD_SELF`, `APR_FOUR_EYES`, `APR_LIMIT`, `:131-164`).
State is an in-memory `Map` (`:53`); TSK-17 made it a read index over the durable
`approvalItem` store (`:61`), hydrated at boot by `refreshApprovalIndex` (`src/api/server.ts:330`).

`CommercialProposal.ProposalStatus` (`src/web/workspace/commercial-proposal.ts:28`)
declares more members than it can reach: only `CLIENT_REVIEW` (`:112`) and
`ACCEPTED` (`:159`) have producers; `DRAFT`, `PENDING_APPROVAL`, `REJECTED` are
unreachable. `AOS` `ProposalStatus` (`src/modules/intelligence/aos/index.ts:26`)
is guarded at `:187` (`[AOS-REV-02]`).

---

## 3. Rights request / review, and clearance records

**Code:** `src/modules/broadcast/rights/review-request.ts`

`RightsReviewRequestStatus` `:33-40` — `PREPARED, RECEIVED, ASSIGNED,
EVIDENCE_REVIEW, RESOLVED_BLOCK_RETAINED, RESOLVED_CLEARED_BY_SOURCE, REFERRED`.
Forward-only `FLOW` table `:101-109`; `transitionRightsReviewRequest` `:112`
throws `[RRR-04] Invalid transition …` at `:120-121`, requires a recorded note
for a resolution (`[RRR-05]` `:124`), and `resolveRightsReviewRequest` `:149`
re-checks the same table (`:162-164`). `PREPARED` has **no producer** — the open
path writes `RECEIVED` (`:90`), so the first member is declarative only.
Requests are an in-memory `Map` (`:63`), never hydrated.

**A clearance record has no lifecycle.** `RightsRecord` (Prisma `:253-272`;
`StoredRightsRecord` at `src/core/database/repositories/rights.repository.ts:21`)
has **no status column**: clearance is *computed* from window, territory, channel
and rights type by `validateScheduleRights`
(`src/modules/broadcast/rights/clearance.ts:53`), returning
`RightsBlockingReason` (`:12-21`). Writes are plain upserts
(`:58`, `applyReviewWindow` `:157`) with no state to guard. The registry is the
one part of this domain that is durable **and** rehydrated at boot
(`src/modules/broadcast/rights/registry.ts:44`, called from `src/api/server.ts:374`).

---

## 4. Content revision

**Code:** `src/core/content/index.ts` — `ContentStatus` `:52`: `DRAFT, IN_REVIEW,
CHANGES_REQUESTED, APPROVED, PUBLISHED, WITHDRAWN`.

Guarded through `[CMS-04]` `:227`, `[CMS-05]` `:237`, `[CMS-06]` `:248`,
`[CMS-07]` `:250` (self-approval / SoD), `[CMS-08]` `:274`, `[CMS-09]` `:278`,
`[CMS-11]` `:304`. The one intentional exception is `editContent` `:185`: a
material edit **resets** `PUBLISHED`/`APPROVED`/`IN_REVIEW`/`CHANGES_REQUESTED`
to `DRAFT` (`:214-219`) — an unguarded write whose only target is the *least*
privileged state, so it invalidates review rather than granting it. Revisions are
numbered on the record (`ContentRevision.revision`, `:55`). The `Map` at `:99`
is the read index; TSK-17 made it durable (`ContentItemRecord`+`ContentRevisionRecord`).

**Broadcast versions are not a state machine.** `qcStatus`
(`src/modules/broadcast/versions/index.ts:37`) is `PENDING | PASSED | FAILED |
OVERRIDDEN`, and `PENDING` has no producer — `registerVersion` `:59` writes
`PASSED` or `FAILED` from the QC report at `:73`. Airing eligibility is a **boolean**
(`readyForAir`) plus an override reason, moved by the guarded `markReadyForAir`
`:94` (`[VER-03]` `:104`, `[VER-04]` `:111`). `src/modules/quality/gates.ts:34,41` is a pure
evaluator over a caller-supplied manifest — no store, no transitions.

---

## 5. Case / privacy-security intake

**Code:** `src/core/cases/index.ts` — `CaseStatus` `:12`: `RECEIVED, TRIAGED,
IN_PROGRESS, RESOLVED, CLOSED`. `TRANSITIONS` `:104-110`, `transitionCase` `:120`
throws `[CASE-03]` at `:124`; `CLOSED` is terminal
(`RESOLVED: ["CLOSED"]`, `CLOSED: []`). `assignCase` `:112` changes ownership and
deliberately does not touch status. The `Map` at `:28` is the read index for the durable
`privacySecurityCase` store (`:35`), hydrated at boot by `refreshCaseIndex`
(`src/api/server.ts:331`).

Related intake labels that are **not** machines, so nobody reads more into them
than the code holds: `MembershipStatus` (`src/modules/hub/community/index.ts:11`)
is stored exactly as the caller supplies it (`registerMember:108`, read-only gate
`:150`); the DSR record (`src/api/routes/privacy.routes.ts:25`, Prisma
`DataSubjectRequest` at `prisma/schema.prisma:533` with `status` `:539`) is set
once and never transitioned.
`BookingStatus` (`:20`) is guarded only against `COMPLETED`
(`cancelBooking:206` → `[COMM-CNC-02]` `:211-212`), so `CANCELLED` is reachable
from `CHECKED_IN` and `COMPLETED` has no producer. `TalentOnboardingStatus`
(`src/modules/hub/talent/index.ts:14`) is guarded (`[TALENT-STATE-01]` `:252`,
`[TALENT-STATE-03]` `:265`, `[TALENT-VERIFY-01]` `:280`) but `REJECTED` and
`SUSPENDED` have no producer.

---

## 6. Admission / eligibility

**Code:** `src/modules/hub/afca/admissions.ts` — `ApplicationStatus` `:22-28`:
`DRAFT, SUBMITTED, UNDER_REVIEW, CHANGES_REQUESTED, ACCEPTED, REJECTED`.

**Unguarded.** `recordDecision` `:201` assigns `application.status =
params.decision` at `:219` after only a not-found check (`:214-217`). A reviewer
can therefore write `ACCEPTED` onto a `DRAFT` application that was never
`SUBMITTED`. This is a real control gap, not a documentation nicety: the field is
a label, and no code path in this repo prevents the skip. In-memory `Map` `:71`,
no DB model.

Elsewhere in the federation/production cluster: `CohortStatus`
(`src/modules/hub/afca/index.ts:13`) and `EnrollmentStatus` `:14` have one
producer each (`:170`, `:191`/`:363`) and 5 and 4 unreachable members;
`StudioBookingStatus` (`src/modules/hub/onestudios/index.ts:20`) is guarded
(`[ONE-CO-01]` `:206`, `[ONE-CI-01]` `:220`) with `CANCELLED` unproduced;
`src/modules/hub/tend/index.ts` has **no machine at all** —
`masterDeliveryStatus:21` is accepted verbatim from the caller (`registerTitle:70`)
and `paymentStatus:40` is hardcoded `"PENDING"` (`:173`) with no mutator.

---

## 7. Payment, invoice, escrow

**VTM milestone escrow** — `src/modules/hub/vtm/index.ts`, `EscrowStatus` `:61`:
`PENDING_DEPOSIT, FUNDS_ESCROWED, MILESTONE_SUBMITTED, APPROVED_RELEASED,
DISPUTED, REFUNDED`. Partially guarded: `submitMilestoneDeliverable` `:289`
requires `FUNDS_ESCROWED` (`[VTM-ESC-04]` `:299-300`) and release is guarded
(`[VTM-ESC-06]` `:326-328`), **but `depositMilestoneEscrow` `:273` checks only
that the contract is fully signed** (`[VTM-ESC-01]` `:276`) and then assigns
`FUNDS_ESCROWED` at `:284` — so re-depositing an already `APPROVED_RELEASED`
milestone succeeds. `DISPUTED`/`REFUNDED` have no producer. State is per-engine
instance `Map` (`:103`), not durable.

**Settlement** — Prisma `enum SettlementStatus` (`prisma/schema.prisma:62`:
`PENDING, RECONCILED, DISPUTED, PAID`, model `Settlement:274`) is durable, but
`InvoiceRepository.updateSettlementStatus`
(`src/core/database/repositories/invoice.repository.ts:357`) writes it through an
unguarded `client.settlement.update` (`:366-371`; memory branch `:398-406`), has
**no caller anywhere in `src/`** — it is reachable only from
`tests/unit/production-core-and-infrastructure.test.ts:270` — and is not hydrated
at boot. The durable column exists; the lifecycle does not.

**Billing / payouts / reconciliation** — `billingStatus`
(`src/modules/broadcast/billing/index.ts:25`) has no producers for `INVOICED`/
`PAID`, and `linkAiredSpotToContract` `:122` rewrites it at `:134-138` with no
source guard (it is *derived*, not transitioned). `MakeGood`
`OPEN | CREDITED` `:37` is the one guarded transition here (`[BIL-MG-02]` `:258`).
`PayoutBatch.status` (`src/modules/finance/payouts/index.ts:38`) guards its check
run (`[PAY-CHK-01]` `:175`) and never produces `PROCESSED`/`REJECTED`; Prisma
`TalentPayoutBatch.status:495` defaults `"DRAFT"` and is a **different, unwired
machine**. `src/modules/finance/reconciliation/index.ts:33` computes a status at
`:95,:109,:124` and never stores a transition. Prisma
`CommercialCampaign.status:479` uses a literal set (`"BOOKED"`) that no module
shares.

**Sales** — `SalesStage` (`src/modules/finance/sales/index.ts:30-40`, ten
members) is **mixed**: `signContract:93` and `recordDeposit:113`
(`[QTC-DEP-01]`) are guarded, while `advanceStage:82` is a plain setter
(`deal.stage = nextStage` `:84`), and `PROPOSAL`, `NEGOTIATION`,
`OPERATIONAL_DELIVERY` are reachable only through it. The engine's `deals` `Map` (`:64`) is the read
index for the durable `salesDeal` store (`:28`), hydrated at boot by `hydrateSalesEngine` (`:304`,
called from `src/api/server.ts:339`).

---

## 8. Census of what this document records

| Lifecycle | Guarded? | Producer-complete? | Durable? |
|:---|:---|:---|:---|
| Broadcast schedule day | yes, all 11 transitions, 49 refusal codes | yes | **no** — sandbox Map |
| Generic approval workflow | yes (result object, not throw) | yes | **yes** — `approvalItem`, hydrated |
| Rights review request | yes | no — `PREPARED` unproduced | no |
| Rights clearance record | n/a — no lifecycle | n/a | **yes** + boot hydration |
| Content revision | yes, one deliberate downgrade path | yes | **yes** — `contentItem`, hydrated |
| Broadcast version / RFA | yes for RFA; `qcStatus` 3 of 4 produced | no | no |
| Case | yes | yes | **yes** — `privacySecurityCase`, hydrated |
| Admission application | **no** | yes | no |
| VTM escrow | **partly** (deposit unguarded) | no | no |
| Settlement | **no**, and no caller | — | yes (write path unwired) |
| Sales deal | **partly** (`advanceStage` plain setter) | yes | **yes** — `salesDeal`, hydrated |

Re-measure the three claims most likely to drift:

```bash
# expect 49 (48 `SCHED-<STAGE>-nn` + `[SCHED-01]` not-found), against the eleven
# transitions above: the code numbers the refusals it implements, not a dense
# sequence — `[SCHED-VAL-05]` and `[SCHED-REC-03]` are deliberately absent.
grep -o "SCHED-[A-Z]*-[0-9]*\|SCHED-01" src/modules/broadcast/versions/index.ts | sort -u | wc -l

# expect no output: the schedule machine has no PENDING_APPROVAL stage left
grep -rn '"PENDING_APPROVAL"' src/ | grep -v commercial-proposal

# expect 0: the §15 chain is still the only approval-shaped route into EPG export
grep -rn "PENDING_APPROVAL" src/modules/broadcast/export/ | wc -l
```

`tests/unit/broadcast-schedule-lifecycle.test.ts:185` is the instrument for §1:
it parses the §15 chain out of the authority document and asserts the code's
`PRD_SCHEDULE_CHAIN` equals it, in order. If the PRD is edited and the machine is
not, that test goes red — which is the failure mode this document exists to
prevent.
