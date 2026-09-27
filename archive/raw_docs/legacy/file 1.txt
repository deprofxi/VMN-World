VMNL CLAUDE CODE EXECUTION PATH

1. R1.1 AUTHORITY

VMNL-AZP-VMN-CCPP-001 — R1.1 / P1.1 / PA1.1

This is now frozen as the governing Claude Code implementation and engineering-control authority.

Its job is to tell Claude Code:

what VMNL is;

what the architecture is;

what cannot be redesigned casually;

how each engineering task must be structured;

how Claude must work inside the repository;

what requires human authority;

what must be tested;

what evidence must be left behind;

how sessions continue without losing context.


At this stage:

DO NOT keep expanding the prompt authority.


---

2. REAL REPOSITORY AUDIT

This is the immediate next action.

Claude Code enters the actual VMN repository and inspects reality before writing material new code.

Use:

CC-ARCH-001 — Repository Forensic Audit

The audit establishes:

actual framework;

frontend;

backend;

database;

schemas;

migrations;

authentication;

RBAC;

existing pages;

APIs;

storage;

jobs;

analytics;

testing;

CI/CD;

deployment;

security;

existing Broadcast technology;

existing CRM;

existing Finance integration;

existing Azeebo+ integration;

technical debt.


Everything is classified:

KEEP
EXTEND
REFACTOR
WRAP
INTEGRATE
MIGRATE
CONSOLIDATE
RETIRE
MISSING

The key law is:

> REALITY BEFORE REFACTORING.



Claude must not assume a greenfield application.


---

3. REAL ARCHITECTURE

Once the repository has been audited, the conceptual architecture becomes an actual technical architecture.

This produces the real:

application topology;

module boundaries;

deployment topology;

database architecture;

identity architecture;

API architecture;

event architecture;

object-storage architecture;

search architecture;

job/queue architecture;

notification architecture;

observability architecture;

security architecture;

Azeebo+ adapter architecture;

Broadcast integration architecture;

Finance integration architecture.


And critically:

Architecture Decision Records — ADRs.

For example:

ADR-001 — Application architecture
ADR-002 — Canonical identity
ADR-003 — Database strategy
ADR-004 — Domain boundaries
ADR-005 — API pattern
ADR-006 — Event architecture
ADR-007 — Broadcast integration
ADR-008 — Azeebo+ federation
ADR-009 — File/DAM strategy
ADR-010 — Authentication/RBAC
ADR-011 — Observability
ADR-012 — Deployment strategy

This is where theoretical choices become repository-specific decisions.


---

4. REAL DOMAIN MODEL

Next:

VMNL-AZP-VMN-CDDS-001

is instantiated against the actual database and code.

Conceptual objects such as:

Person
Organisation
Programme
TalentProfile
CreatorProfile
Opportunity
Contract
Project
Production
BroadcastChannel
Programme
ScheduleSlot
RightsRecord
Event
CatalogueItem
Settlement
Evidence
Agent

become actual:

schemas;

database tables;

models;

validation objects;

relationships;

state machines;

indexes;

migrations;

domain services;

invariants.


At this stage VMNL obtains its first true machine-readable institutional model.

The rule becomes:

> CANONICAL DOMAIN FIRST. UI SECOND.




---

5. REAL CODE

Only now should the major implementation work accelerate.

The recommended build order remains:

1. Identity / authentication / permissions


2. Shared enterprise services


3. Public VMN experience


4. Operating Hub


5. Broadcast


6. Talent Accelerator


7. AFCA


8. Afro-Fusion Creatives


9. VTM


10. VCF


11. ONE Studios


12. Fusion Events


13. TEND


14. HeadspaceNG


15. Cr8TechNG


16. Rights/IP


17. Commercial/Finance integration


18. Azeebo+ federation


19. Agentic OS


20. Enterprise analytics/evidence



And each feature should follow:

Requirement
→ Domain model
→ Schema
→ Domain logic
→ API/Event
→ Permissions
→ UI
→ Tests
→ Observability
→ Documentation

—not the other way around.


---

6. REAL TESTS

Tests then stop being illustrative prompts and become executable engineering evidence.

The suite should eventually contain:

Domain tests

Business invariants.

Unit tests

Individual functions/classes.

Integration tests

Database, queues, storage, external adapters.

API contract tests

Request/response behaviour.

Event contract tests

Producer/consumer compatibility.

RBAC tests

Who may do what.

Security tests

Object-level access, privilege escalation, upload abuse, secrets, session security.

Rights tests

Expired/incompatible rights block exploitation.

Financial tests

Correct separation of:

contract value;

GMV;

invoices;

receivables;

cash;

recognised revenue reference;

talent payable;

partner share;

contribution.


Broadcast tests

schedule;

rights;

EPG;

traffic;

spot delivery;

as-run;

carriage;

outage.


Azeebo+ tests

deep links;

content federation;

creator federation;

identity state;

retry;

failure isolation.


Accessibility tests

Public and important operating workflows.

E2E tests

Actual business journeys.


---

7. REAL UAT

Then VMNL operators test the actual software using real operating scenarios rather than developer assumptions.

Examples:

Commercial

Lead
→ Proposal
→ Contract
→ Deposit
→ Project
→ Delivery
→ Invoice
→ Cash
→ Report
→ Renewal

Talent

Applicant
→ Verification
→ Opportunity
→ Match
→ Terms
→ Work
→ Acceptance
→ Payment
→ Rating

AFCA

Application
→ Programme
→ Assessment
→ Certification
→ Readiness

Broadcast

Programme
→ Rights
→ Schedule
→ EPG
→ Traffic
→ Playout
→ As-run
→ Proof-of-air

Azeebo+

Broadcast promotion
→ deep link
→ Azeebo+
→ attributed visit
→ authenticated engagement where available.

TEND

Asset
→ Rights
→ Catalogue
→ Licence
→ Delivery
→ Statement
→ Settlement

UAT must also deliberately test failure.

Not just success.


---

8. PRODUCTION EVIDENCE

This is the final stage—and the stage no strategy document can manufacture in advance.

Production evidence includes:

real uptime;

real API latency;

real error rates;

real client transactions;

real cash reconciliation;

real talent payments;

real rights blocks;

real Broadcast scheduling;

real proof-of-air;

real Azeebo+ referrals;

real user retention;

real support tickets;

real security alerts;

real recovery exercises;

real cost;

real operator adoption;

real control tests.


That allows the evidence state to move from:

S1 assumptions

through:

S2 / S3 internal evidence

towards:

S4 independently verified

and eventually:

S5 audited / executed / binding evidence.


---

THE COMPLETE TRANSFORMATION

The full chain is therefore:

R1.1 Authority
defines how Claude must behave.

↓

Real Repository Audit
reveals what actually exists.

↓

Real Architecture
decides how the existing and new technology should fit together.

↓

Real Domain Model
turns VMNL into canonical machine-readable entities and rules.

↓

Real Code
implements those rules.

↓

Real Tests
prove technical behaviour.

↓

Real UAT
proves business behaviour.

↓

Production Evidence
proves that the system actually works under real conditions.

And then, importantly:

Production Evidence
→ Lessons
→ Controlled revisions
→ Better architecture / operations

rather than:

more speculative master documents.

The immediate next action is therefore CC-ARCH-001 — Real Repository Forensic Audit. Once the actual VMN repository is available, that is where implementation should begin.