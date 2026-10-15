# Acceptance-Criteria Traceability Index — TODO-PRC-09 (CCPP §2.2)

**Convention:** `AC-UI-RL1-Rxx-nn` where `Rxx` is the requirement/journey row and `nn` the criterion ordinal. Tests must reference the criterion they verify (in-test comment or assertion label). This index maps every materially implemented journey to its defined AC IDs and executable evidence; journeys still gated by human decisions record that honestly.

| Journey | Requirement row | AC IDs (defined) | Executable evidence | Status |
|---|---|---|---|---|
| Commercial enquiry & intake | R03 | `AC-UI-RL1-R03-01…12` (12 criteria) | `tests/integration/enquiry-failure-drill.test.ts` (criterion-tagged assertions) | **PARTIAL** — **8 of 12** criteria are labelled in the cited test (`R03-01…06, 08, 11`); `R03-07/09/10/12` appear in no assertion anywhere in `tests/`. The former **VERIFIED** status is withdrawn: it read the `01…12` range as a census. Labelling the remaining four requires the per-criterion text of UIUX-001, which is absent from `docs/authorities/` (TSK-39) — the ordinals are not invented here |
| Identity: sign-in / MFA / invitations / sessions | R02 | `AC-UI-RL1-R02-01…14` (sign-in, lockout, TOTP step-up, invitation chain, session revocation, profile persistence, notification prefs) | `tests/unit/security-auth-rbac.test.ts`, `tests/unit/identity-and-rbac.test.ts`, `tests/unit/todo-remediation.test.ts` (SEC describes) | **IMPLEMENTED** — no `AC-UI-RL1-R02-*` ID appears in any test file. The cited suites exist and pass (sign-in, lockout, TOTP step-up, invitation chain, session revocation, profile persistence, notification prefs), but "AC IDs referenced per test intent" was never a verification: mapping behaviour to criterion *ordinals* requires the UIUX-001 AC list, which is absent from `docs/authorities/` (TSK-39) |
| Workspace & route authorization | R02/R05 | `AC-UI-RL1-R05-01…09` (role guards, server-side enforcement, redirect/403 semantics) | `tests/security/route-authorization.test.ts`, `tests/unit/scr-desk-rewiring.test.ts` | **IMPLEMENTED** — guard parity, anonymous redirect and the 403 render path are asserted (`tests/security/route-authorization.test.ts`, `tests/security/route-guard-parity.test.ts`), but no `AC-UI-RL1-R05-*` ID is labelled in any test |
| Approved media picker (UX-CMS-006) | R05 (CMS) | `AC-SCR-03-01` — picker lists DAM assets with provenance + access state per UIUX-001 §7.3; only AVAILABLE selectable. `AC-SCR-03-02` — CMS revisions reference registered MediaAssetRecord ids only; free-text/unknown/quarantined refs rejected `[CMS-11]`; editor form submits picker selections. `AC-SCR-03-03` — golden-seed DAM backfill: 250 deterministic assets registered (200 episode masters + 50 key arts), 200 episode master refs persisted to `BroadcastEpisode.mediaAssetId`, review queue renders media-reference badges (state/title/id, legacy free-text flagged, phantom row labelled), surfaces start populated. `AC-SCR-03-04` — broadcast views reference the registered masters: channel detail pages render the per-episode master table, public `/schedule` a per-channel summary with problems flagged, EPG Inspector (SCR-BCST-14) the linkage panel — all from a boot-refreshed `BroadcastEpisode → DAM` index with read-time (never cached) state derivation; XMLTV exports carry registered ids as `<episode-num system="vmnl-media-asset">` via a registered-only resolver (unregistered/unknown refs omitted). Live check vs drill DB: 120/40/40 masters across NXTR/ORIS/IMBD, all AVAILABLE, reconciling 200/200 backfilled episodes. `AC-SCR-03-05` — schedule entries carry an optional canonical `episodeCode` (`[SCHED-VAL-06]` blank rejected, `[SCHED-VAL-07]` contradiction with the entry's own version rejected at submit/amend); the now/next widget (BCST-08/09) renders the live master line with read-time state for every case (AVAILABLE / UNREGISTERED / blocked / not-indexed / no-reference / legacy-none); boot seed `ensureScheduleDemoSeed` builds each channel's today-approved full-day episode-linked schedule from the master index (idempotent; skips when the index is empty); seed summary labels in-memory `schedules`/`damAssets` families as non-persisted; **schedule review desk (UX-BR-012)** keys the linkage by its `channel` parameter via canonical `resolveChannelCode` (codes, canonical/short names, desk labels) with an explicit unresolved state for unknown references — verified live (120/40/40 rows keyed per channel; bogus reference → honest notice) | `tests/unit/todo-final-remediation.test.ts` (SCR-03 describes: registration evidence, quarantine/failed retention, fail-closed tenant scoping (unit-level and, since TSK-58 box 2, over HTTP with signed tenant sessions), route 401/authority, `[CMS-11]` rejections, CSRF-flow create→edit E2E, backfill determinism/idempotency/standing-total, review-queue badge projection, projection channel-scoping, read-time state derivation, registered-only resolver, XMLTV episode-num, channel/schedule/inspector renderer contracts, episodeCode validation, slot-view propagation, widget master states, demo-seed lifecycle/idempotency, seed-stat labels, desk channel-key resolution/scoping/route keying) | **PARTIAL** — `AC-SCR-03-01`, `-02`, `-03` are labelled in `tests/unit/todo-final-remediation.test.ts`; `AC-SCR-03-04` and `AC-SCR-03-05` are exercised there by named assertions (XMLTV `episode-num`, episodeCode validation, widget master states, seed lifecycle, desk channel-key resolution) but carry **no AC-ID label**, so criterion-level coverage is not claimed for them |
| Quote-to-cash & ledger | R06 | `AC-UI-RL1-R06-01…12` (delivery-gated recognition, dual-control sign, idempotent deltas, escrow/protection labelling, WHT schedule, credit notes) | `tests/unit/finance.test.ts`, `tests/unit/todo-final-remediation.test.ts` (FIN-03/04/07), `tests/integration/journey-failure-drills.test.ts` | **IMPLEMENTED** — delivery-gated recognition, dual-control sign and the WHT schedule are asserted (FIN-03/04/07), but no `AC-UI-RL1-R06-*` ID is labelled in any test |
| Broadcast schedule lifecycle | R07 | `AC-UI-RL1-R07-01…08` (RFA gate, rights attestation, approval, lock-out, atomic amendment) | `tests/integration/journey-failure-drills.test.ts`, `tests/unit/todo-final-remediation.test.ts` (BCST-03) | **IMPLEMENTED** — the RFA gate and atomic amendment are drilled; no `AC-UI-RL1-R07-01…08` ID is labelled in any test. The rights *gate* half of this row is now separately evidenced as `R07-13…18` (next row) |
| Schedule approval & rights clearance (TSK-10 / CA-07) | R07 | `AC-UI-RL1-R07-13…18` (6 criteria: expired window, wrong territory, wrong channel, wrong `rightsType`, missing/unregistered record, caller-supplied spoofed record) | `tests/unit/broadcast-rights-gate.test.ts` (11 tests, ID-labelled; prints "rights gate path under test: Postgres (fail_closed)") · `tests/integration/rights-clearance-e2e.test.ts` (`AC-UI-RL1-R07-18` asserted over HTTP) | **VERIFIED** — **6 of 6** criteria labelled, each as a business outcome (schedule stays PENDING_APPROVAL with no approver and no approval timestamp; EPG export returns `RIGHTS_NOT_CLEARED` / `RIGHTS_NOT_CLEARED_AT_EXPORT`; the route answers 400 `RIGHTS_RECORD_FIELDS_NOT_TRUSTED`), with a positive control so an all-refusing gate cannot pass the row. The ordinals are **cited, not invented**: `tasks.md` TSK-10 names "AC IDs `AC-UI-RL1-R07-13…18`" as this task's required evidence, which is the only document that defines them — UIUX-001 remains absent (TSK-39), so this range resolves to the register, while R07-01…12 stay `IMPLEMENTED` because nothing defines their ordinals at all |
| Sponsorship binding & fulfillment | R07 | `AC-UI-RL1-R07-09…12` (binding entity, per-episode fulfillment, playlist export, shortfall report) | `tests/unit/todo-final-remediation.test.ts` (BCST-12) | **IMPLEMENTED** — binding and fulfillment are asserted; no `AC-UI-RL1-R07-09…12` ID is labelled in any test |
| Events gate & offline scans | R08 | `AC-UI-RL1-R08-01…08` (single-use scan, HMAC validation, offline token, idempotent sync, duplicate reconciliation) | `tests/unit/hub-production.test.ts`, `tests/unit/scr-desk-rewiring.test.ts`, `tests/integration/journey-failure-drills.test.ts` | **IMPLEMENTED** — single-use scan and HMAC validation are tested live (`scr-desk-rewiring.test.ts`); no `AC-UI-RL1-R08-*` ID is labelled in any test |
| Content publication | R09 | `AC-UI-RL1-R09-01…10` | `tests/unit/extended-workspaces.test.ts`, journey drills (DRILL-PUB-01) | **IMPLEMENTED** — no `AC-UI-RL1-R09-*` ID is labelled in any test |
| Syndication & royalties | R10 | `AC-UI-RL1-R10-01…06` (avails exclusivity, royalty statement ingestion, withholding integrity) | `tests/unit/hub-production.test.ts`, `tests/integration/journey-failure-drills.test.ts` (DRILL-FIN-03) | **IMPLEMENTED** — withholding integrity is drilled; no `AC-UI-RL1-R10-*` ID is labelled in any test |
| Federation & payment visibility | R11 | `AC-UI-RL1-R11-01…08` (HMAC inbound signature, timestamp window, 7-way payment labelling) | `tests/integration/enterprise-end-to-end.test.ts`, `tests/unit/todo-final-remediation.test.ts` (SCR-20 projection) | **IMPLEMENTED** — inbound HMAC signature and tamper rejection are asserted (`tests/unit/federation.test.ts:175-178`) and the 7-way payment projection is labelled SCR-20, but no `AC-UI-RL1-R11-*` ID is labelled; production ingestion enablement remains a HUMAN DECISION either way |
| Backup / restore readiness (PRC-08) | R14-adjacent (operations) | `AC-PRC-08-01` — nightly snapshot backup job exists and a restore from its archive reproduces the database (row-parity) and serves app traffic; WAL/PITR RPO < 5 min stays TARGET | `docs/audit/backup-restore-drill.md` — DRILL-01 (2026-10-01): backup 0.198 s → restore 0.132 s → 26/26 table parity → `/healthz` 200 on restored copy | **DRILL-VERIFIED (restore scope)** — evidence is the recorded drill `docs/audit/backup-restore-drill.md`, not an AC-labelled assertion; `AC-PRC-08-01` appears in no test. RPO target NOT MET pending WAL archiving |
| Usability & AT validation | R13 | AC criteria defined at G5 | none — participant matrix unscheduled | **NOT_RUN** (human-run, PRC-05) |
| Manual accessibility coverage | R12 | AC criteria defined at G4 | `tests/a11y/*` automated only | **PARTIAL** — manual §7.5 NOT_RUN (PRC-06, human-run) |
| StarTimes carriage interface | R14 (BG6) | AC criteria await carriage contract data | none — registry fields unpopulated | **NOT_TESTED** (human decision, BCST-07) |

## Maintenance rule

Every newly implemented journey adds its AC-ID block to this index **at closure time** with the test
file(s) that exercise each criterion. A claim of "complete" without an indexed AC block is invalid
under CCPP §2.2.

**Enforced since 2026-10-07 (TSK-43)** by `tests/unit/ac-traceability.test.ts`, which runs in
`pnpm test` — i.e. in CI, not as a review habit. It expands every claimed ID range into discrete IDs,
greps each literal ID under `tests/`, and fails if: a **VERIFIED** row has an unlabelled ID or declares
no ID at all; any row says "full AC coverage" while an ID is missing; or a cited evidence path does not
resolve. Status vocabulary (a row must use one of these):

| Status | What it is allowed to assert |
|---|---|
| `VERIFIED` | every claimed AC ID appears as a literal label in an executable test |
| `PARTIAL` | coverage is incomplete and the row states the gap — which IDs are labelled, or that no criterion ID is defined yet |
| `IMPLEMENTED` | the cited tests exist and exercise the journey; no criterion-level claim |
| `DRILL-VERIFIED` | evidence is a recorded drill artifact; the artifact path must exist |
| `NOT_RUN` | human-run coverage absent |
| `NOT_TESTED` | blocked on a human decision or an absent authority |

## Measured census — 2026-10-07

`tests/unit/ac-traceability.test.ts` prints this and pins the totals; reproduce with
`pnpm vitest run tests/unit/ac-traceability.test.ts`.

| | Count |
|---|---|
| Index rows | 16 |
| AC IDs claimed (ranges expanded, not tallied as ranges) | **103** |
| AC IDs labelled in an executable test | **17** — `AC-UI-RL1-R03-01…06,08,11`, `AC-SCR-03-01…03` and `AC-UI-RL1-R07-13…18` |
| AC IDs claimed but labelled nowhere | **86** |
| Rows that may claim VERIFIED | **1** — `AC-UI-RL1-R07-13…18` (TSK-10); every other row that claims IDs has at least one ID in no assertion |

The label grep is a single walk of `tests/` **excluding this suite's own file**: an AC ID quoted
there is test *data*, not an assertion label. Including it made `AC-UI-RL1-R03-07` read as covered
and would have re-created the exact range-read-as-census error CA-21 reported.

CA-21's finding is now structurally closed: the index cannot re-inflate a range into a coverage claim
without failing the suite. What it cannot close is the labelling itself — the criterion ordinals live in
`VMNL-AZP-VMN-UIUX-001`, which is absent from `docs/authorities/` (**TSK-39**). Until that document is
imported, assigning `R02-07` vs `R02-08` to any behaviour would be invention, so journeys stay
`IMPLEMENTED` rather than being promoted to `VERIFIED` by guesswork.

**The one exception, and why it is not invention** — `AC-UI-RL1-R07-13…18` is **VERIFIED** (TSK-10). Those
six ordinals are not assigned by reading a behaviour and guessing a number: `tasks.md` TSK-10 states its
required evidence as "AC IDs `AC-UI-RL1-R07-13…18`", so the register names the range and the assertions
were written to it, ID-labelled literally. The suite still does not claim anything beyond what the
register defines: R07-01…12 keep their own statuses because no document maps those ordinals, and
`tests/unit/ac-traceability.test.ts` fails if the range is ever widened without a matching label.
Promotion of the remaining rows requires UIUX-001 itself (**TSK-39**), not more tests.
