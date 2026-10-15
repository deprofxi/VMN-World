# Desk census — registered routes vs engine-backed desks

**Task:** `tasks.md` TSK-23 (P1) · **Defect:** `report.md` CA-10 · **Measured:** 2026-10-07
**Instrument:** `tests/unit/desk-census.test.ts` · **Reproduce:** `pnpm vitest run tests/unit/desk-census.test.ts`

## 1. Why this document exists

CA-10 recorded two independent hand-sweeps of the same question — "how many of the
48 enterprise desks are engine-backed?" — one counting 10, the other 15. Both were
reading code and guessing. Neither number is reproducible by a command, so under
Rule 0.2 neither is evidence. This census replaces them with one measurement taken
from the running router.

## 2. Method

The suite boots the real API server on an OS-assigned ephemeral port and, for every
key in `ENTERPRISE_WORKSPACES`, issues the actual `GET /workspace/{key}` three times:

| Probe | Credential | Question it answers |
| --- | --- | --- |
| authorized | SuperAdmin session token | does the route resolve at all |
| anonymous | none | is the desk readable without sign-in |
| low-privilege | PlayoutOperator session token | is the desk role-scoped, or open to any authenticated operator |

Classification is behavioural. A response is a **shell** if it carries the
`Desk Operating State` panel that only `renderWorkspaceDeskHtml` emits; anything else
came from a dedicated handler. No grep of the source, no judgement call.

## 3. Measured result

| Figure | Value |
| --- | --- |
| Registered desk routes (`ENTERPRISE_WORKSPACES`) | **48** |
| Answered by the presentation shell | **47** |
| Answered by a dedicated handler (engine-backed) | **1** — `afca` |
| Readable anonymously | **0** (all 48 → `302 /sign-in?returnUrl=…`) |
| Role-scoped by `WORKSPACE_HTML_GUARDS` | **1** — `executive` (403 for PlayoutOperator) |
| Open to any authenticated operator | **47** |

**Plain statement for the register:** 48 = registered desk routes, **1** = engine-backed.
The two earlier figures (10, 15) counted desks whose *domain* has engine-backed
surfaces elsewhere — broadcast consoles, `/api/v1/...` routes — not desks whose own
workspace route renders engine state. Both readings are legitimate questions; only
the second one is what "the desk is wired" means to a user who opens it.

## 4. Per-desk rows (all 48, as measured)

| key | category | primary role | served by | anon | PlayoutOperator | guard roles |
| --- | --- | --- | --- | --- | --- | --- |
| executive | Executive & Core | ExecutiveLeader | shell | 302 | 403 | SuperAdmin/ExecutiveLeader |
| iam | Executive & Core | SuperAdmin | shell | 302 | 200 | — |
| organisations | Executive & Core | LegalCounsel | shell | 302 | 200 | — |
| projects | Executive & Core | ProductionDirector | shell | 302 | 200 | — |
| risk | Executive & Core | RiskManager | shell | 302 | 200 | — |
| board | Executive & Core | ExecutiveLeader | shell | 302 | 200 | — |
| procurement | Executive & Core | ProcurementManager | shell | 302 | 200 | — |
| audit | Executive & Core | InternalAuditor | shell | 302 | 200 | — |
| esg | Executive & Core | SustainabilityOfficer | shell | 302 | 200 | — |
| comms | Executive & Core | CommunicationsDirector | shell | 302 | 200 | — |
| hr | Executive & Core | HRDirector | shell | 302 | 200 | — |
| legal | Executive & Core | GeneralCounsel | shell | 302 | 200 | — |
| mcr | Broadcast Operations | MCRSupervisor | shell | 302 | 200 | — |
| traffic | Broadcast Operations | TrafficManager | shell | 302 | 200 | — |
| epg | Broadcast Operations | TrafficScheduler | shell | 302 | 200 | — |
| asrun | Broadcast Operations | BroadcastReconciliationLead | shell | 302 | 200 | — |
| uplink | Broadcast Operations | BroadcastTransmissionEngineer | shell | 302 | 200 | — |
| ingest | Broadcast Operations | IngestOperator | shell | 302 | 200 | — |
| graphics | Broadcast Operations | GraphicsCoordinator | shell | 302 | 200 | — |
| scte | Broadcast Operations | AutomationEngineer | shell | 302 | 200 | — |
| disaster | Broadcast Operations | SiteReliabilityEngineer | shell | 302 | 200 | — |
| audio | Broadcast Operations | AudioComplianceOfficer | shell | 302 | 200 | — |
| interstitial | Broadcast Operations | InterstitialProducer | shell | 302 | 200 | — |
| transmission | Broadcast Operations | TransmissionLead | shell | 302 | 200 | — |
| talent | Hub Specialist | HubCoordinator | shell | 302 | 200 | — |
| afca | Hub Specialist | AcademyDean | **dedicated handler** | 302 | 200 | — |
| community | Hub Specialist | CommunityManager | shell | 302 | 200 | — |
| vtm | Hub Specialist | TalentAgent | shell | 302 | 200 | — |
| vcf | Hub Specialist | InvestmentLead | shell | 302 | 200 | — |
| onestudios | Hub Specialist | ProductionDirector | shell | 302 | 200 | — |
| events | Hub Specialist | EventsProducer | shell | 302 | 200 | — |
| tend | Hub Specialist | RightsManager | shell | 302 | 200 | — |
| soundstage | Hub Specialist | StudioManager | shell | 302 | 200 | — |
| gear | Hub Specialist | EquipmentCoordinator | shell | 302 | 200 | — |
| postproduction | Hub Specialist | PostProductionSupervisor | shell | 302 | 200 | — |
| alumni | Hub Specialist | AlumniRelationsLead | shell | 302 | 200 | — |
| crm | Commercial & Finance | CommercialLead | shell | 302 | 200 | — |
| quotes | Commercial & Finance | CommercialLead | shell | 302 | 200 | — |
| contracts | Commercial & Finance | LegalCounsel | shell | 302 | 200 | — |
| finance | Commercial & Finance | FinanceController | shell | 302 | 200 | — |
| payouts | Commercial & Finance | DisbursementOfficer | shell | 302 | 200 | — |
| bankrecon | Commercial & Finance | TreasuryManager | shell | 302 | 200 | — |
| headspace | Tech & Governance | ChiefIntelligenceOfficer | shell | 302 | 200 | — |
| cr8tech | Tech & Governance | TechnologyLead | shell | 302 | 200 | — |
| rights | Tech & Governance | RightsManager | shell | 302 | 200 | — |
| privacy | Tech & Governance | DataProtectionOfficer | shell | 302 | 200 | — |
| security | Tech & Governance | SecOpsLead | shell | 302 | 200 | — |
| aos | Tech & Governance | AgenticOpsEngineer | shell | 302 | 200 | — |

## 5. What the shell used to claim, and what it claims now

The shell asserted currency it could not know. Removed in this change
(`src/web/workspace/surface-bc.ts`), each pinned by `tests/unit/desk-census.test.ts`:

| Removed claim | Replacement |
| --- | --- |
| `<strong>Date:</strong> 2026-09-28` (frozen string) | gone — the shell has no notion of data freshness |
| `Mode: LIVE OPERATING` | `Wiring: Presentation shell — no bound operational feed` |
| `Synchronized with VMNL Enterprise Operating Bus` + `Synchronized` badge | `No live object is bound to this panel` + `Not bound` badge |
| `Online & Gated` / "Audit trail logging active with SHA-256 HMAC integrity assurance" | `Registered route — sign-in required` + explicit statement that the page reads no engine or repository state |
| Every workflow badged `Ready` under `Active Core Workflows` | `Not bound` under `Declared Core Workflows` |
| Directory: `48 of 48 Desks Operational`, `100% RBAC / ABAC Protected` | `1 of 48 desks bound to engine state`, `Registered Desk Routes` / `Desks Bound to Engine State` / `Specialist Domains` |

The `ENGINE_BACKED_DESK_KEYS` export is the single source for that figure, and the
census test asserts it equals what the router actually served — so the list cannot
drift from behaviour without a red test.

## 6. The 47 unbound desks — target, not fiction

Rule 0.1 forbids closing these by faking wiring, and this record does not manufacture
an owner nobody has nominated. Each unbound desk is listed with the register task that
would bind its domain; **owner: unassigned — nomination required** (a human decision,
the same class as `HD-01`'s per-allocation owners).

| Group | Desks | Binding dependency | Precondition |
| --- | --- | --- | --- |
| Broadcast Operations | mcr, traffic, epg, asrun, uplink, ingest, graphics, scte, disaster, audio, interstitial, transmission | `TSK-11` (wire the 33 operational screens to the engine), then this route can mount the same panels | `TSK-17` durable tables |
| Commercial & Finance | crm, quotes, contracts, finance, payouts, bankrecon | `TSK-13` (canonical deals), `TSK-32` (durable ledger postings), `TSK-33` | `TSK-17`; `HD-04` for the recognition ruling |
| Executive & Core | iam, organisations, projects, risk, board, procurement, audit, esg, comms, hr, legal | `TSK-17`/`TSK-18` (durable persistence + audit ledger), then a per-domain desk page each | `TSK-09` commit series lands |
| Hub Specialist | talent, community, vtm, vcf, onestudios, events, tend, soundstage, gear, postproduction, alumni | `TSK-05` already makes talent profiles durable; `TSK-14`/`TSK-10` for rights-bearing desks (`tend`, `events`) | `TSK-17` |
| Tech & Governance | headspace, cr8tech, rights, privacy, security, aos | `TSK-14` (rights consolidation), `TSK-30`/`TSK-31` (PII sealing, DSR), `TSK-35` | `TSK-17`; `HD-05`/`HD-06` for the DPO rulings |

Until a desk is bound, its route must keep saying so. That is what §5 now does.

## 7. Security reading of the same measurement

`47 of 48` desk pages are readable by *any* authenticated operator, and
`WORKSPACE_HTML_GUARDS` covers only 5 prefixes, of which exactly one lands on a
registered desk key (`executive`). Nothing is anonymous-readable — the sign-in
requirement measured `302` on all 48 — so this is a privilege-scoping gap, not an
exposure gap. Classifying each desk as public / staff-only / role-scoped is a business
decision (TSK-26 residual, folded here); the measured column above is what that
decision has to act on.
