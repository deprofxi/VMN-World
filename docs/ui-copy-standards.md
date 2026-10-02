# VMNL UI Copy & Error Standards Deck

**Authority:** `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A` / `docs/decisions/design-task-de-citation.md (legacy "design-task" DT reference) DT-804` / `DS-15`, `DS-18`  
**Classification:** Enterprise Design System Standard  
**Target Surfaces:** Public Web, Enterprise Workspace (48 Desks), Operator Consoles (33 Screens), Federation Gateway (Azeebo+)

---

## 1. Core Principles

1. **Human-Readable & Actionable:**
   Every message must be immediately clear to an operator or end user without technical jargon. Never display raw internal enums (e.g. `CIRCUIT_BREAKER_CLOSED`, `ERR_CONNECTION_REFUSED`, `500 INTERNAL_SERVER_ERROR`).
2. **Never Blame the User:**
   Frame messages around system state and resolution pathways rather than user fault.
3. **Always Provide a Clear Next Action:**
   Every error and empty state must provide at least one accessible, high-contrast action (e.g. "Retry Handshake", "Return to Live View", "Contact Master Control").
4. **Zero Stack Traces in User Interfaces:**
   Stack traces and debugging traces belong exclusively in structured server loggers (`pino`), never in HTML or public API JSON error bodies.

---

## 2. Error Message Taxonomy

| Context / State | Prohibited Raw Enum / Pattern | Canonical Human-Readable Copy | Standard Next Action |
|---|---|---|---|
| **Federation Link Closed** | `Circuit Breaker CLOSED` | `Federation Link: Normal / Protected` | Display link health status |
| **Federation Link Open / Degraded** | `CIRCUIT_BREAKER_OPEN / TIMEOUT` | `Federation Link: Degraded / Failover Standby Active` | Check upstream partner bridge |
| **Authentication Required** | `401 Unauthorized / Token Expired` | `Authentication Required: Please sign in with your enterprise credentials` | Sign In with SSO |
| **Access Denied (RBAC)** | `403 Forbidden / Access Denied` | `Authorization Clearance Required: Role [Role] does not have permission for [Screen]` | Return to Catalog / Request Clearance |
| **Missing Resource** | `404 Not Found` | `Record Not Found: The requested broadcast record could not be located in registry` | Return to Directory / Search Master Catalogue |
| **Playout Signal Disruption** | `ERR_ASI_SYNC_LOST / SMPTE_FAIL` | `Carrier Warning: Telemetry signal disrupted on StarTimes Transponder link` | Switch Secondary Mirror / Retest Feed |
| **As-Run Mismatch** | `DISCREPANCY_LEG1_LEG2` | `As-Run Timing Discrepancy: Commercial airtime offset exceeds 1.0 second threshold` | Inspect Reconciliation Log |
| **Validation Error** | `INVALID_INPUT_ERR` | `Missing Information: Please complete all required fields indicated below` | Review Flagged Fields |

---

## 3. Empty State Standards

Every empty state must implement the standard 4-part matrix:
1. **Accessible Graphic:** Unified SVG icon (`inbox` or `empty`, 40px, non-color-reliant).
2. **Heading:** Concise statement of state (e.g., `No Active Records Found`, `No Scheduled Inbound Media`).
3. **Descriptive Subtext:** Contextual reason (e.g., `There are currently no queued items for this daypart.`).
4. **Primary Recovery Action:** Action button (min 44x44px target) returning the user to a valid state or creating a record.

### Standard Empty States:
- **Programme Catalogue:** "No Master Titles Found. Adjust your filter criteria or register a new master title."
- **Daily Traffic Log:** "No Commercial Bookings Placed. Select a scheduled daypart to book commercial avails."
- **As-Run Ingestion:** "No Pending As-Run Logs. Master Control logs have been fully reconciled for today."
- **Talent Roster:** "No Talent Profiles in Cohort. Invite applicants through the Talent Accelerator Portal."

---

## 4. Provisional & Simulated Data Standards (DT-203, DT-403)

Any interface presenting data that is estimated, provisional, or simulated must present a `ProvenanceNotice` component:
1. **Explicit Source:** State the data source (e.g., `StarTimes Provisional Telemetry`, `Sample Playout Signal`).
2. **Disclaimer:** Clear statement of live readiness (e.g., `Live edge sensor integration pending final RF transponder handshake`).
3. **Badge:** Explicit `PROVISIONAL` or `SAMPLE` chip; never assert `SYNCHRONIZED` or `LOCKED` on simulated inputs.

---

## 5. Review & Governance Gate

- **DPO Sign-Off:** Required on all privacy notices and data capture forms.
- **Broadcast Legal Sign-Off:** Required on compliance claims and NBC 7th Edition wording.
- **Review Frequency:** Quarterly review against customer support and MCR incident logs.
