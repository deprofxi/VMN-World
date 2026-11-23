# Documentation index — where each governance matter actually lives

**Authority:** `VMNL-AZP-VMN-CCPP-001 — R1.1` §3 (*Repository Authority Architecture*) ·
`VMNL-AZP-VMN-BRD-PRD-001 — R1.2A` · `CLAUDE.md`
**Finding closed:** `PR-29` (`docs/audit/production-readiness-deepcheck-2026-10-16.md`)
**Status of the structure itself:** the prescribed tree is an **approved adaptation**, recorded in
[`docs/design-debt-register.md`](design-debt-register.md) and
[`docs/architecture/descoped-modules.json`](architecture/descoped-modules.json). This page exists so
the adaptation is *navigable* rather than implicit: CCPP §3 says "the precise structure may adapt
to the real stack; the governance relationships may not." Every row below names the directory that
carries the relationship today, and the rows marked *not realised* name where the content lives
instead.

Measured 2026-10-17 on this tree. If a row and the filesystem disagree, the filesystem is right and
this page is the defect.

---

## 1. Governance layer

| CCPP §3 prescription | Actual location | Carries |
|:---|:---|:---|
| `/CLAUDE.md` | [`CLAUDE.md`](../CLAUDE.md) | Repository constitution: canonical laws, engineering behaviour, stop conditions |
| `docs/authorities/` | [`docs/authorities/`](authorities/) | The governing authority documents (BRD/PRD, CCPP, EXEC) — the source of every "Authority:" line |
| `docs/authorities/ia/` | [`docs/authorities/ia/`](authorities/ia/) | VMN World Information Architecture R1.1 suite (inventory, architecture review, complete screen architecture, verification manifest, developer handoff, and master spreadsheet) |
| `docs/domain/` | [`docs/domain/`](domain/) | Canonical model, data dictionary, systems of record, state/invariant statements |
| `docs/security/` | [`docs/security/`](security/) | Threat model, route authorization coverage, PII handling |
| `docs/decisions/` | [`docs/decisions/`](decisions/) | Decision records and machine-readable registers (for example `screen-register.json`) |
| `docs/adrs/` *(prescribed as `architecture/adr/`)* | [`docs/adrs/`](adrs/) | Architecture decision records ADR-001… |
| `docs/handoffs/` | [`docs/handoffs/`](handoffs/) | Session handoffs; [`LATEST.md`](handoffs/LATEST.md) is the entry point |
| `docs/audit/` *(not prescribed; added)* | [`docs/audit/`](audit/) | Audit registers and their evidence: [`evidence-register.md`](audit/evidence-register.md), [`journey-readiness-matrix.md`](audit/journey-readiness-matrix.md), the deep checks |
| `docs/runbooks/` *(prescribed as `operations/`)* | [`docs/runbooks/`](runbooks/) | Operational procedures: [observability](runbooks/observability.md), [release gate](runbooks/release-gate.md), [rollback](runbooks/rollback-runbook.md), [disaster recovery](runbooks/disaster-recovery.md) |
| `docs/events/` | [`docs/events/`](events/) | Event and catalogue contracts |
| `docs/architecture/` | [`docs/architecture/`](architecture/) | Approved adaptations and descoped modules |
| `docs/prompts/` | **not realised** | Prompt contracts live in `CLAUDE.md` and [`docs/authorities/`](authorities/); no separate prompt library is maintained |
| `docs/api/` | **not realised as a directory** | The served OpenAPI document is generated from `src/api/docs.ts` and served at `/docs`; the contract is asserted by `tests/contract/openapi-contract.test.ts` |
| `docs/broadcast/` | **not realised** | Broadcast domain documentation is in [`docs/domain/`](domain/) (canonical model, systems of record) and the broadcast modules under `src/modules/broadcast/` |
| `docs/azeebo/` | **not realised** | Azeebo+ federation contracts live with their adapters under `src/modules/federation/azeebo/`; the integration boundary is `docs/security/threat-model.md` TM-FED-02 |
| `docs/privacy/` | **not realised** | Privacy content is in [`docs/security/`](security/) and the open decisions `HD-05` / `HD-06` in [`tasks.md`](../tasks.md) §5; **no privacy review has been completed**, and canonical law 12 makes that a precondition for real personal data |
| `docs/testing/` | **not realised** | The testing strategy is expressed as the suite itself: `tests/` (see §2) plus [`CLAUDE.md`](../CLAUDE.md) `<testing>` and the coverage floors in `vitest.config.ts` |
| `docs/migrations/` | **not realised** | Migrations live in `prisma/migrations/`, one directory per migration; the schema-first rule is `CLAUDE.md` `<schema_first_rule>` |

## 2. Verification layer

| CCPP §3 prescription | Actual location | Carries |
|:---|:---|:---|
| `tests/unit/` | [`tests/unit/`](../tests/unit/) | Domain invariants, instrument guards, doc-pin checks |
| `tests/integration/` | [`tests/integration/`](../tests/integration/) | End-to-end enterprise journeys against a real server and database |
| `tests/contracts/` | [`tests/contract/`](../tests/contract/) | OpenAPI contract conformance |
| `tests/security/` | [`tests/security/`](../tests/security/) | Route authorization and its parity scan |
| `tests/accessibility/` | [`tests/a11y/`](../tests/a11y/) (Vitest, HTML shape) **+** [`tests/browser/`](../tests/browser/) (Playwright + axe-core, real rendering) | Accessibility. The two are not interchangeable: see [release-gate.md](runbooks/release-gate.md) §5 |
| `tests/domain/`, `tests/e2e/` | **not realised as directories** | Domain invariants run inside `tests/unit/`; end-to-end journeys inside `tests/integration/` |

## 3. Reading order for an external reviewer

1. [`CLAUDE.md`](../CLAUDE.md) — the constitution and the stop conditions.
2. [`docs/audit/evidence-register.md`](audit/evidence-register.md) — what is verified, at which
   maturity tier, and what is explicitly **not**.
3. [`tasks.md`](../tasks.md) §5 — the decisions only a human can make, each with its owner.
4. [`docs/audit/journey-readiness-matrix.md`](audit/journey-readiness-matrix.md) — which journeys
   stand on durable state and which stand on sandbox state.
5. [`docs/handoffs/LATEST.md`](handoffs/LATEST.md) — the current posture, including the parts of it
   that are known to be weaker than they look.
