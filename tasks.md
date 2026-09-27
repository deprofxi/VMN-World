# VMNL ENTERPRISE & CREATIVE ECONOMY ECOSYSTEM: MASTER IMPLEMENTATION & EXECUTION TASKS (tasks.md)

**Document Reference:** `VMNL-AZP-VMN-TASK-001 — R1.0`  
**Governing Authorities:**
- **Product & Business Master:** `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / P1.2A / PA1.2A` (Consolidated Corrected Baseline)
- **Engineering & Conformance Authority:** `VMNL-AZP-VMN-CCPP-001 — R1.1 / P1.1 / PA1.1` (Claude Code Prompt Pack)
- **Execution Blueprint:** `VMNL-AZP-VMN-EXEC-001` (8-Stage Execution Path)
- **Corporate Entity:** Virtual Media Network Limited (VMNL) / VMN
- **Core Portfolio:** Broadcast (Nigezie Xtreme, Orisun, Isi Mbido via StarTimes DTT/DTH) · VMN Creative Economy Hub · Azeebo+ D2C Federation

---

## 1. GOVERNANCE, PRECEDENCE & EXECUTION LAWS

### 1.1 Authority Precedence Matrix (R1.2A §1)
All technical, product, and operational decisions must strictly respect the 10-tier legal and authority hierarchy:
1. **Level 1:** Applicable law (Nigerian law, NBC broadcast regulations, NDPR/GDPR privacy, copyright law), court orders, and binding commercial contracts.
2. **Level 2:** VMNL Board resolutions and corporate reserved matters.
3. **Level 3:** VMNL enterprise master authorities.
4. **Level 4:** `VMNL-AZP-CEMP-MA-001 — R3.1` (Creative Economy Master Authority).
5. **Level 5:** VMNL Creative Economy Execution Playbook.
6. **Level 6:** Current Finance & Commercial operating authorities.
7. **Level 7:** Current Azeebo+ product & technical authorities.
8. **Level 8:** Agentic Operating System (AOS) governance authority.
9. **Level 9:** This Master BRD/PRD (`VMNL-AZP-VMN-BRD-PRD-001 — R1.2A`).
10. **Level 10:** Technical specifications, Architecture Decision Records (ADRs), implementation plans, and repository code.

> **RULE:** No engineer or AI agent may resolve a material authority contradiction silently. Conflicts must be formally flagged, logged in `/docs/handoffs/LATEST.md`, and escalated to the document owner.

---

### 1.2 The Ten Immutable Engineering Laws (CCPP-001 §4, §34–36)
1. **Reality Before Refactoring:** Never assume greenfield code. Always conduct a forensic audit of existing code, databases, and third-party systems before writing new implementations.
2. **Canonical Domain First, UI Second:** Entity schemas, invariants, relationships, and validations must exist and pass automated tests before any UI screen is wired up.
3. **Rights Before Exploitation:** No asset or schedule item may be aired on linear television, published to a digital portal, syndicated to external distributors, or federated to Azeebo+ without an active, unexpired, legally valid Rights Record.
4. **Cash Discipline Before Scale:** Seven-way financial separation is mandatory. Never conflate GMV, Contract Value, Invoiced Revenue, Recognized Revenue, Cash Collections, Talent Payables, and Partner Splits.
5. **Azeebo+ is Federated, Not Embedded:** Azeebo+ is a distinct, independently governed consumer streaming platform. It is integrated via Universal Deep Links, Webhooks, and Event Meshes—never treated as a subordinate sub-table within the VMN database.
6. **Agents Augment Humans, Not Govern:** AI agents provide decision support, drafting, data transformation, and scheduled monitoring under strict human-in-the-loop controls. Agents cannot execute financial disbursements, publish legal contracts, or alter on-air schedules without human authorization.
7. **No Secrets in Code:** Zero hardcoded API keys, database credentials, or signing tokens in repository commits or build artifacts. Use environment variables and secrets managers.
8. **Reversible Migrations Only:** All database migrations must follow the expand-contract pattern (add field -> dual-write/read -> backfill -> cutover -> drop field). Destructive drops require explicit human sign-off.
9. **WCAG 2.2 AA Accessibility & Responsive Ergonomics:** All public digital and operating surfaces must conform to WCAG 2.2 AA standards, ensure 44x44px minimum touch targets, and maintain sub-second interaction speeds.
10. **Evidence Over Assumption:** Every completed capability must be verified by automated tests (Unit, Domain, Integration, Contract, E2E), UAT failure scenarios, and logged operational telemetry (S1 through S5 evidence ladder).

---

## 2. REPOSITORY HYGIENE & CONSOLIDATION TASKS

- [x] **TASK-HYG-01: Initialize Version Control & Branch Protection**
  - **Action:** Initialize Git repository in `/Users/deprof/www/vmng`. Set default branch to `main`.
  - **Deliverable:** `.git` directory initialized; initial commit created with `.gitignore`.
  - **Acceptance Criteria:** Repository clean; branch protection rules established for `main` and `develop`.

- [x] **TASK-HYG-02: Document Consolidation & Deduplication**
  - **Action:** Move raw `.docx` and legacy `.txt` files into `archive/raw_docs/`. Remove redundant identical copies (`VMN PRD BRD  (2).txt`, `VMN PRD BRD  (3).txt`, `file2.txt`).
  - **Deliverable:** Clean root folder; legacy files preserved under `archive/raw_docs/legacy/`.
  - **Acceptance Criteria:** No duplicate files remain in root workspace; MD5 hashes cataloged in `archive/raw_docs/README.md`.

- [x] **TASK-HYG-03: Authority Documentation Base Setup**
  - **Action:** Establish the structured `/docs` directory hierarchy mandated by CCPP-001:
    - `/docs/authorities/`: Place canonical markdown versions of `VMNL-AZP-VMN-BRD-PRD-001-R1.2A.md` and `VMNL-AZP-VMN-CCPP-001-R1.1.md`.
    - `/docs/adrs/`: Initialize directory for Architecture Decision Records (ADR-001 to ADR-012).
    - `/docs/audit/`: Initialize directory for forensic audit reports.
    - `/docs/domain/`: Initialize directory for entity diagrams, invariants, and dictionary.
    - `/docs/handoffs/`: Initialize `LATEST.md` for cross-session continuity.
  - **Deliverable:** Fully indexed `/docs` directory tree.
  - **Acceptance Criteria:** Markdown files formatted with clean headings, markdown links, and zero truncation.

- [x] **TASK-HYG-04: Deploy Root CLAUDE.md Constitution**
  - **Action:** Extract Section 4 of CCPP-001 (`VMNL-AZP-VMN-CCPP-001 — R1.1`) and write `/Users/deprof/www/vmng/CLAUDE.md`.
  - **Deliverable:** Root `CLAUDE.md` file active in the workspace.
  - **Acceptance Criteria:** Contains the 20-point Definition of Done, Session Boot Protocol, Stop Conditions, and Architectural Boundaries.

---

## 3. PHASE 0: FORENSIC AUDIT & ARCHITECTURE (CC-ARCH-001 & CC-ARCH-002)

- [x] **TASK-P0-01: Master Task Prompt Execution — Repository Forensic Audit (CC-ARCH-001)**
  - **Action:** Perform a comprehensive forensic inspection of the codebase, existing dependencies, schemas, external service connections, and legacy scripts.
  - **Audit Scope:**
    1. Framework, runtime environment, build tools, package managers.
    2. Frontend architecture, component libraries, styling engines.
    3. Backend architecture, API frameworks, RPC/REST/GraphQL interfaces.
    4. Database engines, existing tables, column types, foreign keys, migrations.
    5. Authentication, session management, RBAC/ABAC implementations.
    6. Object storage, asset processing pipelines, digital asset management (DAM).
    7. Background jobs, message queues, scheduled tasks (cron).
    8. Existing Broadcast systems (playout software, traffic systems, EPG generators).
    9. Existing CRM, accounting/finance packages, StarTimes carriage feeds, Azeebo+ endpoints.
    10. Security posture, secrets handling, third-party supply-chain risks.
  - **Deliverable:** `/docs/audit/CC-ARCH-001-forensic-report.md`.
  - **Acceptance Criteria:** Every discovered component classified into one of: `KEEP`, `EXTEND`, `REFACTOR`, `WRAP`, `INTEGRATE`, `MIGRATE`, `CONSOLIDATE`, `RETIRE`, or `MISSING`.

- [x] **TASK-P0-02: Architecture Decision Records Formulation (ADR-001 through ADR-012)**
  - **Action:** Author and lock formal Architecture Decision Records based on audit findings and R1.2A mandates:
    - [x] `ADR-001`: Application Topology (Modular Monolith vs. Microservices vs. Monorepo).
    - [x] `ADR-002`: Canonical Identity & Authentication Architecture (Multi-tenant Auth, Session Tokens, MFA).
    - [x] `ADR-003`: Database Strategy & ORM/Migration Framework (PostgreSQL, schema management, read/write segregation).
    - [x] `ADR-004`: Domain Boundaries & Modular Isolation (Context maps, anti-corruption layers).
    - [x] `ADR-005`: API Pattern & Contract Standard (RESTful JSON:API / GraphQL / gRPC, OpenAPI 3.1).
    - [x] `ADR-006`: Event-Driven Architecture & Message Bus (RabbitMQ / Kafka / Redis Streams).
    - [x] `ADR-007`: Broadcast Integration Pattern (Traffic logs, playout controllers, as-run ingestion).
    - [x] `ADR-008`: Azeebo+ External Federation Protocol (Universal deep links, webhooks, HMAC signature verification).
    - [x] `ADR-009`: File & Digital Asset Management (DAM) Strategy (S3-compatible storage, presigned URLs, transcode pipeline).
    - [x] `ADR-010`: Granular RBAC / ABAC Permissions Architecture (Role hierarchies, tenant scopes, resource policies).
    - [x] `ADR-011`: Enterprise Observability & OpenTelemetry (Metrics, structured JSON logs, distributed tracing, alerting).
    - [x] `ADR-012`: Deployment, CI/CD & Environment Promotion Strategy (Local -> Staging -> Production, canary releases).
  - **Deliverable:** 12 finalized ADR files in `/docs/adrs/`.
  - **Acceptance Criteria:** Each ADR follows Context -> Decision -> Consequences -> Status -> Approver.

- [x] **TASK-P0-03: Environment & Configuration Architecture Setup**
  - **Action:** Establish environment configuration schema (`.env.example`, configuration validators).
  - **Deliverable:** Validated configuration loader ensuring fail-fast behavior if mandatory environment variables are missing.
  - **Acceptance Criteria:** Strict separation of `development`, `test`, `staging`, and `production` environments; no production secrets in repository.

- [x] **TASK-P0-04: Session Continuation & Handoff Infrastructure**
  - **Action:** Implement `/docs/handoffs/LATEST.md` with template for session status, changed files, active tests, known blockers, and immediate next actions.
  - **Deliverable:** Operational session tracking system ensuring seamless resumption across AI agents and human engineers.

---

## 4. PHASE 1: ENTERPRISE CORE & CANONICAL DATA MODEL (CC-DATA-001 & CC-SEC-001)

- [x] **TASK-P1-01: Canonical Domain Data Dictionary & Model (R1.2A §35, §36, §37)**
  - **Action:** Formally model and implement canonical database schemas for enterprise core entities:
    - `Person`: Universal identity, contact info, KYC status, global user ID.
    - `Organisation`: Corporate clients, production partners, regulatory bodies, broadcast carriage partners.
    - `TalentProfile`: Specialized creative profile (skills, portfolio, credits, verification tier, rate card).
    - `CreatorProfile`: Digital creator metrics, social links, content niches, audience demographics.
    - `Project`: Scoped enterprise undertaking (broadcast series, live event, fund slate, academy cohort).
    - `Contract`: Legal agreement, counterparty, terms, signed copy, value, payment schedule, status.
    - `RightsRecord`: Governed exploitation record (granter, grantee, territory, media type, exclusivity, start date, expiry date, sub-licensing terms).
    - `Settlement`: Financial transaction reconciliation record.
    - `Evidence`: Audit trail attachment (proof-of-air, payment receipt, KYC document, as-run log).
    - `Agent`: Registered autonomous/semi-autonomous AOS agent with explicit capability boundaries.
  - **Deliverable:** Database migration files, ORM entities, and `/docs/domain/master-data-model.md`.
  - **Acceptance Criteria:** All foreign keys, unique constraints, and indexes defined; audit timestamps (`created_at`, `updated_at`, `created_by`, `updated_by`) on all tables.

- [x] **TASK-P1-02: Identity, Authentication & Session Security (CORE-01, CORE-02, SEC-01..07)**
  - **Action:** Implement secure authentication system:
    - Multi-tenant authentication supporting email/password, SSO, and MFA.
    - JWT/Session token lifecycle with secure HTTP-only cookies, rotation, and revocation.
    - Password hashing using Argon2id or bcrypt with strong work factors.
    - Rate-limiting on login, registration, and password reset endpoints.
  - **Deliverable:** Auth service module and automated auth integration test suite.
  - **Acceptance Criteria:** 100% test coverage on authentication flows, brute-force protection verified, token revocation verified.

- [x] **TASK-P1-03: Multi-Tenant RBAC / ABAC Permissions Engine (R1.2A §48, §49)**
  - **Action:** Build policy enforcement point (PEP) and policy decision point (PDP) supporting the enterprise role matrix:
    - Roles: `SuperAdmin`, `ExecutiveLeader`, `BroadcastDirector`, `TrafficManager`, `PlayoutOperator`, `RightsManager`, `TalentManager`, `AcademyDirector`, `FinanceController`, `Auditor`.
    - Contextual attributes: Resource tenant, approval limits, workflow state.
  - **Deliverable:** Permission middleware, authorization decorators, and policy test suite.
  - **Acceptance Criteria:** Passing tests for positive permission grants and negative unauthorized access (403 Forbidden) across all role permutations.

- [x] **TASK-P1-04: Digital Asset Management (DAM) & Storage Service (CORE-07, CORE-08)**
  - **Action:** Implement enterprise storage abstraction layer:
    - S3-compatible object storage integration (MinIO for dev, AWS S3/Cloud Storage for prod).
    - Presigned URL generation for secure direct client uploads.
    - Virus scanning and MIME-type validation on uploaded assets.
    - Automatic checksum verification (MD5/SHA256) for broadcast masters and documents.
  - **Deliverable:** Storage adapter module, file upload handlers, and integrity verification workers.
  - **Acceptance Criteria:** Ingestion pipeline rejects tampered files; presigned URLs expire strictly according to policy.

- [x] **TASK-P1-05: Enterprise Notification & Audit Logging Engine (CORE-09, CORE-10)**
  - **Action:** Implement centralized notification service (Email, SMS, in-app push) and immutable audit log engine.
  - **Deliverable:** Notification workers and audit log database tables.
  - **Acceptance Criteria:** Every sensitive action (contract signing, rights modification, schedule publish, financial release) generates an immutable, tamper-evident audit record.

---

## 5. PHASE 2: BROADCAST & LINEAR TELEVISION OPERATIONS (CC-BCST-001)

- [x] **TASK-P2-01: Channel Portfolio & Registry (BCAST-001, BCAST-002)**
  - **Action:** Implement channel management domain for the three active VMNL linear channels:
    - **Nigezie Xtreme:** Urban youth, music, contemporary Nigerian pop culture.
    - **Orisun — The Source:** Indigenous Yoruba culture, heritage, arts, contemporary programming.
    - **Isi Mbido — The Beginning:** Indigenous Igbo culture, tradition, entertainment, family programming.
  - **Deliverable:** Channel registry entities, configuration tables, and Channel Portfolio management APIs.
  - **Acceptance Criteria:** Channel profiles store metadata, technical parameters, audio configurations, logos, and StarTimes channel identifiers.

- [x] **TASK-P2-02: Programme Catalogue & Asset Quality Gate (BCAST-003, BCAST-012)**
  - **Action:** Build broadcast content catalogue supporting:
    - Hierarchical structure: Title -> Season/Series -> Episode -> Broadcast Version (Master, Clean, Subtitled, Censored).
    - Technical master quality gate: Video standard (1080i50 / 720p), codec, aspect ratio (16:9), loudness compliance (EBU R128 / -23 LUFS), slate/countdown presence, closed-caption tracks.
  - **Deliverable:** Programme catalogue database schema, media validation service, and metadata inspection APIs.
  - **Acceptance Criteria:** Non-compliant media masters cannot be marked as "Ready for Air" (RFA) without an explicit technical override.

- [x] **TASK-P2-03: Rights & Windowing Verification Engine (BCAST-011, R1.2A §45)**
  - **Action:** Implement real-time linear television rights validation service:
    - Validates linear television broadcast rights for specific channel, territory (Nigeria/West Africa), date range, and transmission type (DTT/DTH).
    - Checks exclusivity windows and prevents scheduling if rights expire prior to or during broadcast slot.
  - **Deliverable:** Rights validation domain service and automated test harness.
  - **Acceptance Criteria:** Automated failure tests: scheduling an episode with expired rights immediately flags a blocking error in the schedule grid.

- [x] **TASK-P2-04: Programming & Daypart Scheduling Grid (BCAST-004, R1.2A §15)**
  - **Action:** Implement master scheduling system:
    - Dayparts configuration: Early Morning, Daytime, Prime Time, Late Night.
    - 24/7 timeline grid with frame-accurate time slots (HH:MM:SS:FF).
    - Conflict detection: Duration mismatch, overlapping programs, missing media masters.
    - Fixed schedule versus emergency filler activation rules.
  - **Deliverable:** Scheduling engine, schedule grid APIs, and visual calendar/grid backend service.
  - **Acceptance Criteria:** Schedule grid detects under-runs, over-runs, and unassigned gaps; enforces lock-out times for finalized schedules.

- [x] **TASK-P2-05: Electronic Programme Guide (EPG) Generation & Export (BCAST-005, R1.2A §16)**
  - **Action:** Build EPG syndication pipeline:
    - Generates 7-day rolling EPG metadata from approved broadcast schedules.
    - Formats: XMLTV standard format, custom StarTimes EPG ingestion format, JSON API for VMN public portal.
    - Automated daily export job with diff detection and publication timestamps.
  - **Deliverable:** EPG export worker, XMLTV builder, and public EPG retrieval endpoints.
  - **Acceptance Criteria:** XMLTV schema validation passes; EPG automatically refreshes when approved schedule revisions occur.

- [x] **TASK-P2-06: Commercial Traffic, Break Planning & Inventory (BCAST-006, BCAST-015, R1.2A §17, §18)**
  - **Action:** Implement commercial traffic engine:
    - Commercial break structures (Station Ident, Promo, Commercial Spot 1..N, Sponsor Sting, Channel Return).
    - Advertising campaign booking, spot copy materials, rotation rules.
    - Category clash detection (e.g., competing banking or telco spots cannot run in the same break or adjacent breaks).
  - **Deliverable:** Traffic management module, break planner, and category collision validator.
  - **Acceptance Criteria:** Break planner prevents overbooking break duration; automatically rejects commercial spots that violate category collision rules.

- [x] **TASK-P2-07: Sponsorship & Billboard Binding Engine (BCAST-014, R1.2A §19)**
  - **Action:** Build sponsorship inventory management:
    - Binds sponsor stings, lower-thirds, bugs, and bumpers to specific programmes, series, or dayparts.
    - Monitors sponsorship entitlement delivery against contract terms.
  - **Deliverable:** Sponsorship database models, linking service, and entitlement fulfillment tracker.
  - **Acceptance Criteria:** Schedule exports include bound sponsor media assets; fulfillment reports verify contracted delivery counts.

- [x] **TASK-P2-08: Playout Playlist Automation & Master Control Interface (BCAST-007, R1.2A §20)**
  - **Action:** Implement daily playout playlist generation service:
    - Consolidates scheduled programmes, commercial breaks, promos, and fillers into a frame-accurate 24-hour playout automation playlist.
    - Supports industry standard automation formats (SMPTE-2067, Harris/Imagine ADC, Grass Valley, BXF).
  - **Deliverable:** Playlist generator, export adapters, and master control synchronization service.
  - **Acceptance Criteria:** Generated playlist matches the second-by-second sum of scheduled assets; includes emergency fallback clips for every hour.

- [x] **TASK-P2-09: StarTimes Carriage & Transmission Monitoring (BCAST-009, BCAST-010, R1.2A §21)**
  - **Action:** Implement carriage platform registry and transmission monitoring:
    - Registry for StarTimes Digital Terrestrial Television (DTT) and Direct-to-Home Satellite (DTH) parameters, transponders, bitrates, and service PIDs.
    - Transmission incident tracking: Signal loss, carrier degradation, weather outages, power events, and planned maintenance logs.
  - **Deliverable:** Carriage registry database, incident logging system, and uptime calculation service.
  - **Acceptance Criteria:** Transmission incidents record start/end timestamps, affected channels, impacted audiences, and root-cause classification.

- [x] **TASK-P2-10: As-Run Log Ingestion, Reconciliation & Proof-of-Air (BCAST-008, BCAST-020, R1.2A §44)**
  - **Action:** Build the definitive proof-of-performance pipeline:
    - Automated ingestion of daily as-run logs from playout servers.
    - Three-way reconciliation: Scheduled Break Plan vs. Playout Automation Log vs. Recorded Air Evidence.
    - Discrepancy detector: Preempted spots, clips clipped short, audio discrepancies, schedule drift.
    - Certificate of Airing / Proof-of-Air generation with cryptographic hash and broadcast timestamps.
  - **Deliverable:** As-run parsing engine, reconciliation service, and Proof-of-Air PDF generator.
  - **Acceptance Criteria:** Advertisers receive auditable Proof-of-Air certificates with exact aired timecode and duration; unmatched spots trigger make-good credits.

- [x] **TASK-P2-11: Broadcast Commercial Settlement & Revenue Tracking (BCAST-019, R1.2A §43)**
  - **Action:** Implement broadcast billing and settlement:
    - Rates calculation based on daypart, spot duration, and live rate cards.
    - Linking aired spots to client commercial contracts and generating billing schedules.
  - **Deliverable:** Billing schedule generator and finance export bridge.
  - **Acceptance Criteria:** Billed amounts match verified as-run airing evidence; un-aired spots are excluded from billing.

- [x] **TASK-P2-12: The 33 Broadcast Screen Surfaces Implementation (R1.2A §46)**
  - **Action:** Build responsive, WCAG 2.2 AA compliant front-end interfaces for the 33 broadcast operational screens:
    - [x] Screen 01: Broadcast Executive Dashboard (Channel health, air status, daily revenue)
    - [x] Screen 02: Channel Portfolio Overview (Nigezie, Orisun, Isi Mbido summary)
    - [x] Screen 03: Channel Profile & Operational Settings
    - [x] Screen 04: Programme Catalogue Search & Filter
    - [x] Screen 05: Programme Detail & Media Master Inventory
    - [x] Screen 06: Series Management
    - [x] Screen 07: Episode Workspace & Segment Breakdown
    - [x] Screen 08: Broadcast Versions & QC Flags
    - [x] Screen 09: Rights Readiness Matrix
    - [x] Screen 10: Programme Acquisition Pipeline
    - [x] Screen 11: Commissioning Tracking & Milestones
    - [x] Screen 12: 24/7 Visual Schedule Grid (Interactive timeline)
    - [x] Screen 13: Daypart Configuration & Rules
    - [x] Screen 14: EPG Inspector & Syndication Status
    - [x] Screen 15: Promo & Interstitial Planner
    - [x] Screen 16: Commercial Inventory Availability Grid
    - [x] Screen 17: Commercial Break Structure Editor
    - [x] Screen 18: Ad Campaign Management & Flighting
    - [x] Screen 19: Spot Materials & QC Review
    - [x] Screen 20: Sponsorship Inventory & Entitlements
    - [x] Screen 21: Daily Traffic Log & Booking Ledger
    - [x] Screen 22: Final Automation Playlist View & Lock
    - [x] Screen 23: Live Playout Status & Master Control Monitor
    - [x] Screen 24: As-Run Log Ingestion & Reconciliation Screen
    - [x] Screen 25: Transmission Real-Time Monitor
    - [x] Screen 26: Transmission Incident Logging & SLA Tracking
    - [x] Screen 27: Carriage Platforms Registry
    - [x] Screen 28: StarTimes DTT/DTH Configuration & Feed Monitor
    - [x] Screen 29: Carriage Agreements & Contract Records
    - [x] Screen 30: Proof-of-Air Certificate Generation & Dispatch
    - [x] Screen 31: Broadcast Revenue Dashboard (Yield, fill rate, billing)
    - [x] Screen 32: Channel Performance Analytics (Ratings, share, audience)
    - [x] Screen 33: Cross-Platform Azeebo+ Conversion Dashboard
  - **Deliverable:** Modular frontend components in `/src/web/broadcast/`.
  - **Acceptance Criteria:** Every screen supports default, loading, empty, error, and unauthorized states; mobile and desktop responsive.

---

## 6. PHASE 3: CREATIVE ECONOMY HUB — TALENT & LEARNING

- [ ] **TASK-P3-01: Talent Accelerator Platform / Network (ACC-01..06, R1.2A §27)**
  - **Action:** Build talent discovery, onboarding, and pathway architecture:
    - Multi-stage onboarding: Registration, portfolio submission, skills assessment, tier assignment (Emerging, Verified, Professional, Master).
    - National partner network directory: Creative hubs, regional academies, partner institutions across Nigeria.
    - Talent directory with granular search (acting, directing, cinematography, editing, sound, screenwriting).
  - **Deliverable:** Talent Accelerator module, verification workflow engine, and public/internal talent registry.
  - **Acceptance Criteria:** Talent profiles transition through validated states (`Draft` -> `Submitted` -> `Under_Review` -> `Verified`); verification badges displayed.

- [ ] **TASK-P3-02: African Film & Creative Arts Academy (AFCA) (AFC-01..04, AFCOM-01..04, R1.2A §28)**
  - **Action:** Implement academic course and competence management:
    - Curriculum and course registry: Modules, syllabus, instructors, prerequisites.
    - Cohort management: Application, screening, enrollment, attendance, gradebook.
    - Assessed competence verification: Practical project submissions, mentor rubric grading, formal accreditation records.
    - Certificate issuance: Digital verifiable credentials with unique verification URLs and QR codes.
  - **Deliverable:** AFCA learning management service and verifiable credentials generator.
  - **Acceptance Criteria:** Certificates cannot be generated until all required competency assessments have approved passing scores.

- [ ] **TASK-P3-03: Afro-Fusion Creatives Co-Working & Community Hub (R1.2A §29)**
  - **Action:** Implement community engagement and physical/virtual hub operations:
    - Member directory, creative collective workspaces, community forum/bulletin.
    - Physical desk/room booking system for creative hub locations.
  - **Deliverable:** Community management portal and space booking subsystem.
  - **Acceptance Criteria:** Booking conflicts prevented; member access tied to active hub subscription/membership.

- [ ] **TASK-P3-04: Virtual Talent Management (VTM) Engine (VTM-01..04, R1.2A §30)**
  - **Action:** Build talent representation, booking, and escrow payment infrastructure:
    - Verified Rate Cards: Standardized day rates, buyout tiers, overtime rules.
    - Opportunity Matching: Casting calls, crew briefs, automated matching based on verified skills.
    - Standardized Contracts: Digital agreement generation with electronic signature capture.
    - Milestone & Escrow Financial Protection: Client funds escrowed before work begins; released upon verified deliverable acceptance.
  - **Deliverable:** VTM booking service, contract generator, and milestone payment escrow module.
  - **Acceptance Criteria:** Funds cannot be released from escrow without talent manager or client acceptance sign-off; platform fee automatically deducted.

---

## 7. PHASE 4: CREATIVE ECONOMY HUB — CREATOR, PRODUCTION & DISTRIBUTION

- [ ] **TASK-P4-01: Virtual Content Fund (VCF) (VCF-01..04, R1.2A §31)**
  - **Action:** Implement creative slate and financing management:
    - Pitch submission pipeline: Logline, synopsis, budget, treatment, deck upload.
    - Investment evaluation rubric: Commercial viability, cultural relevance, cross-platform distribution potential.
    - Slate management: Tracking funded projects across Development, Pre-Production, Production, Post-Production, Delivery.
    - Recoupment & waterfall tracking: Disbursed capital vs. distribution royalties and broadcast license fees.
  - **Deliverable:** VCF portfolio management system and revenue waterfall engine.
  - **Acceptance Criteria:** Waterfall engine accurately calculates investor recoupment, producer share, and net profit splits.

- [ ] **TASK-P4-02: ONE Studios Production Facilities (ONE-01..04, R1.2A §32)**
  - **Action:** Build studio management and production resource allocation:
    - Physical asset registry: Soundstages, green rooms, camera packages, lighting kits, grip, audio gear.
    - Resource booking calendar with maintenance intervals and asset check-out/check-in tracking.
    - Daily production call sheets, crew logs, and studio expense tracking.
  - **Deliverable:** ONE Studios inventory and facility booking engine.
  - **Acceptance Criteria:** Double-booking of gear/studios prevented; damages and loss logged against production security deposits.

- [ ] **TASK-P4-03: The Entertainment Network Distribution (TEND) (TEND-01..04, R1.2A §34)**
  - **Action:** Implement external distribution and syndication marketplace:
    - Distribution catalogue: Completed films, series, formats, and documentaries available for licensing.
    - Avails engine: Computes available rights by territory, medium (Airline, VOD, Free TV, Pay TV), and window.
    - Distribution deals: Deal term tracking, license fees, royalty statement ingestion, withholding tax handling.
  - **Deliverable:** TEND syndication portal, rights avails calculator, and royalty statement parser.
  - **Acceptance Criteria:** Avails calculator prevents overlapping exclusive licenses in the same territory/medium.

- [ ] **TASK-P4-04: Fusion Events Management (EVT-01..04, R1.2A §33)**
  - **Action:** Build physical live event management and ticketing system:
    - Event registry: Concerts, festivals, award shows (e.g., Nigerian music/film awards), industry conferences.
    - Ticketing engine: Tiered tickets (General, VIP, VVIP), digital ticket issuance with secure QR codes.
    - Onsite check-in / access control app endpoint: Offline-capable QR scanning and validation.
  - **Deliverable:** Fusion Events ticketing service and onsite mobile gate scanner interface.
  - **Acceptance Criteria:** Ticket fraud prevented through single-use encrypted QR tokens; live check-in dashboard updates in real-time.

---

## 8. PHASE 5: KNOWLEDGE, CREATIVE TECH & AGENTIC OS (AOS)

- [ ] **TASK-P5-01: HeadspaceNG Knowledge Base & Media Intelligence (HSP-01..04, R1.2A §26, §54)**
  - **Action:** Build central enterprise intelligence and IP documentation system:
    - Enterprise IP repository: Bible/treatment archive, legal precedent library, rate card benchmarks.
    - Market intelligence: African media consumption trends, advertising spend benchmarks, regulatory compendium.
    - Semantic search over institutional documents and production histories.
  - **Deliverable:** HeadspaceNG content repository and vector/semantic search indexing service.
  - **Acceptance Criteria:** Sub-second search response time; strict role-based document access controls.

- [ ] **TASK-P5-02: Cr8TechNG Creative Toolkits & AI Workflows (CR8-01..04, R1.2A §158)**
  - **Action:** Implement creative technology sandbox and automation toolkits:
    - Automated subtitling, transcription, and translation workflows (English, Yoruba, Igbo, Hausa, Nigerian Pidgin).
    - Automated social clipping tool: Extracts short promotional clips from long-form broadcast masters with burnt-in branding.
  - **Deliverable:** Cr8TechNG video processing pipeline and AI worker integrations.
  - **Acceptance Criteria:** Generated subtitles adhere to broadcast standard timing and formatting; clip exports include mandatory VMN watermarks.

- [ ] **TASK-P5-03: Agentic Operating System (AOS) Governance & Supervisors (R1.2A §58)**
  - **Action:** Implement governed AI agent runtime environment:
    - Agent registry: Registered agent identities, allowed tools, bounded operational scopes.
    - Strict human-in-the-loop gates: Agents can draft, recommend, and alert, but cannot commit contracts, publish schedules, or disburse funds without explicit operator sign-off.
    - Agent audit log: Every LLM prompt, response, tool call, and operator override recorded.
  - **Deliverable:** AOS orchestration framework and human approval review queues.
  - **Acceptance Criteria:** Unsupervised financial or scheduling actions by agents are hard-blocked by policy code.

---

## 9. PHASE 6: AZEEBO+ DIRECT-TO-CONSUMER FEDERATION (CC-AZP-001)

- [ ] **TASK-P6-01: Level 1 Federation — Universal Deep Links & QR Gateway (AZP-01, AZP-02, R1.2A §40, §41)**
  - **Action:** Build cross-platform referral and deep-linking system:
    - Universal Link engine generating structured deep links into Azeebo+ 8 consumer universes (Vertical, Movies, Lifestyle, Comedy, Creator, Reality, Games, Sports).
    - On-screen broadcast QR code generator with dynamic UTM campaign attribution parameters.
    - Link tracking service recording scan counts, device types, and referral sources.
  - **Deliverable:** Link generator service, dynamic QR builder, and redirect handler.
  - **Acceptance Criteria:** Generated links redirect to native Azeebo+ app if installed, or web fallback if not; campaign telemetry preserved.

- [ ] **TASK-P6-02: Level 2 Federation — Content Catalog & Metadata Sync (AZP-03)**
  - **Action:** Implement metadata syndication pipeline:
    - Exports approved VMN content metadata (trailers, synopses, cast, tags) to Azeebo+ catalogue APIs.
    - Synchronizes rights windowing so Azeebo+ streaming availability matches contracted windows.
  - **Deliverable:** Catalogue syndication worker and metadata reconciliation engine.
  - **Acceptance Criteria:** Content un-published or expired on VMN rights ledger immediately issues unpublish webhook to Azeebo+.

- [ ] **TASK-P6-03: Level 3 Federation — Federated Identity & Conversion Attribution (AZP-04, AZP-05, R1.2A §71)**
  - **Action:** Implement cross-platform conversion tracking:
    - Six-stage attribution funnel:
      1. Promo aired on TV (timestamp + Proof-of-Air)
      2. QR scan / Outbound click
      3. Azeebo+ landing page visit
      4. User registration / login
      5. Subscription purchase / stream start
      6. Retention / long-term engagement.
  - **Deliverable:** Attribution aggregation engine and conversion reporting pipeline.
  - **Acceptance Criteria:** Conversion reports accurately link on-air broadcast campaigns to registered Azeebo+ subscribers without violating NDPR/GDPR privacy.

- [ ] **TASK-P6-04: Level 4 Federation — Shared Event Mesh & Failure Isolation (AZP-06)**
  - **Action:** Implement asynchronous event bridge with strict fault isolation:
    - Outbound and inbound webhooks secured by HMAC-SHA256 signatures.
    - Exponential backoff retry queue with dead-letter queue (DLQ) for failed deliveries.
    - Circuit breaker pattern: Failure or downtime of Azeebo+ does not degrade linear broadcast operations or core VMN Hub.
  - **Deliverable:** Webhook engine, event bridge workers, and circuit breaker middleware.
  - **Acceptance Criteria:** Automated simulation of complete Azeebo+ API outage causes zero disruption to linear playout or scheduling.

---

## 10. PHASE 7: PUBLIC DIGITAL SURFACES & USER EXPERIENCE (CC-UI-001)

- [ ] **TASK-P7-01: Public VMN Corporate Portal (R1.2A §9)**
  - **Action:** Build public-facing corporate website:
    - Executive leadership, corporate governance, investor relations, press releases.
    - Interactive overview of the three enterprise pillars: Broadcast, Creative Economy Hub, Azeebo+.
    - Enterprise contact, partnership inquiry, and RFP submission forms.
  - **Deliverable:** Public portal pages in `/src/web/public/`.
  - **Acceptance Criteria:** 100/100 Lighthouse performance, SEO structured metadata, mobile responsive.

- [ ] **TASK-P7-02: Linear Television Public Channels Hub (R1.2A §10)**
  - **Action:** Implement dedicated public micro-sites for the linear channels:
    - **Nigezie Xtreme:** Live now, coming next, programme guide, featured music videos, show clips.
    - **Orisun:** Cultural showcase, Yoruba programming highlights, schedule, presenter bios.
    - **Isi Mbido:** Igbo cultural series, movie premieres, community spotlight, daily schedule.
    - Real-time "On Air Now" and "Up Next" widgets driven directly by approved EPG data.
  - **Deliverable:** Public channel frontends and live EPG consumer components.
  - **Acceptance Criteria:** Schedule displays adjust dynamically to viewer timezone; shows valid programme descriptions and posters.

- [ ] **TASK-P7-03: Creative Economy Hub Public Showcases & Inquiries**
  - **Action:** Build public landing pages for Hub verticals:
    - HeadspaceNG, Cr8TechNG, Talent Accelerator, AFCA, Afro-Fusion Creatives, VTM, VCF, ONE Studios, Fusion Events, TEND.
    - Controlled enquiry pathways: Application forms, partnership pitches, booking requests.
  - **Deliverable:** Hub showcase screens and inquiry capture pipeline.
  - **Acceptance Criteria:** Inquiries route directly into internal CRM queues; automated acknowledgment emails dispatched.

- [ ] **TASK-P7-04: UI/UX Component System & Accessibility Conformance**
  - **Action:** Implement atomic design system satisfying frontend standards:
    - 4px/8px design token grid, semantic color system with high-contrast ratios (WCAG 2.2 AA >= 4.5:1).
    - Complete component state matrix: Default, hover, pressed, focus-visible, disabled, loading skeleton, error, empty.
    - Touch targets >= 44x44px; full keyboard tab navigation and ARIA attributes.
  - **Deliverable:** Reusable component library (`/src/web/components/`).
  - **Acceptance Criteria:** Zero accessibility violations detected by automated audit tools (axe-core / Lighthouse).

---

## 11. PHASE 8: COMMERCIAL, FINANCIAL & RECONCILIATION ENGINE

- [ ] **TASK-P8-01: Master Quote-to-Cash Workflow Pipeline**
  - **Action:** Implement end-to-end commercial sales engine:
    - Lead -> Opportunity -> Proposal / Media Plan -> Contract Negotiation -> Signed Contract -> Deposit -> Operational Delivery -> Invoice -> Cash Collection -> Revenue Recognition.
  - **Deliverable:** Commercial workflow state machine and sales ledger.
  - **Acceptance Criteria:** Contracts require dual authorization (Sales Lead + Legal/Finance); milestone billing automatically triggered upon proof-of-performance.

- [ ] **TASK-P8-02: Seven-Way Financial Data Separation Engine (R1.2A §283)**
  - **Action:** Build the core financial ledger ensuring strict segregation of:
    1. **Contract Value:** Total legal committed figure.
    2. **Gross Merchandise Value (GMV):** Total transaction throughput across platforms.
    3. **Invoiced Revenue:** Billed amounts to external clients.
    4. **Recognized Revenue:** Earned income matching fulfilled delivery obligations.
    5. **Cash Collections:** Actual verified funds received in bank accounts.
    6. **Talent Payables:** Amounts owed to talent, cast, crew, and creators.
    7. **Partner Splits:** Revenue shares owed to external carriage, syndication, or co-production partners.
  - **Deliverable:** Double-entry financial journal module and ledger reporting service.
  - **Acceptance Criteria:** Financial dashboard never conflates GMV with company revenue; reports reconcile to the kobo/cent.

- [ ] **TASK-P8-03: Talent Payout & Withholding Tax Engine**
  - **Action:** Implement automated payout calculation and disbursement:
    - Computes net payouts after deducting platform fees, agency commissions, and statutory Nigerian withholding tax (WHT).
    - Generates downloadable payment advice slips and monthly WHT remittance schedules.
  - **Deliverable:** Payout processing worker and tax reporting generator.
  - **Acceptance Criteria:** Payout batches require Maker-Checker authorization from Finance Controller; bank payment files export in standard NIP/CSV format.

- [ ] **TASK-P8-04: Bank & Payment Gateway Automated Reconciliation**
  - **Action:** Build reconciliation engine ingesting bank statement MT940/CSV feeds and payment gateway webhooks (Paystack/Flutterwave).
  - **Deliverable:** Bank reconciliation parser and auto-matching rule engine.
  - **Acceptance Criteria:** Matches bank credits to outstanding customer invoices; flags unallocated deposits for manual review.

---

## 12. PHASE 9: TESTING, UAT DRILLS & RELEASE GATES (CC-UAT-001)

- [ ] **TASK-P9-01: Multi-Tier Automated Test Suite Build**
  - **Action:** Implement the complete test pyramid:
    - **Domain Tests:** Verify all business invariants, state machine transitions, and calculation rules.
    - **Unit Tests:** Individual functions, utility classes, and validation routines.
    - **Integration Tests:** Database queries, storage adapters, cache layers, external API clients.
    - **Contract Tests:** Pact/OpenAPI schema validation for all internal and external APIs.
    - **RBAC Tests:** Exhaustive permissions matrix testing across all user roles.
    - **Security Tests:** SQL injection, XSS, CSRF, IDOR, privilege escalation, and session fixation tests.
  - **Deliverable:** Automated test suite runnable via standard CI/CD commands.
  - **Acceptance Criteria:** 100% pass rate on CI pipeline; zero regressions.

- [ ] **TASK-P9-02: The 20 Broadcast UAT Failure Drill Scenarios (R1.2A §66)**
  - **Action:** Build executable test scripts and simulated failure environments for the 20 mandatory UAT failure scenarios:
    - [ ] Drill 01: Schedule item with expired rights -> Blocked from playlist generation; alert triggered.
    - [ ] Drill 02: Programme master missing or corrupted -> Triggers emergency filler insertion; operator alerted.
    - [ ] Drill 03: Wrong-duration media asset -> Detected during playlist validation; prevents un-aligned schedule drift.
    - [ ] Drill 04: Unapproved ad creative -> Blocked from traffic scheduling; spot flagged for review.
    - [ ] Drill 05: Commercial category conflict -> Two competing ads booked in same break detected and auto-separated.
    - [ ] Drill 06: Spot booked into full/unavailable break -> Auto-diverted to make-good queue with sales notification.
    - [ ] Drill 07: EPG differs from approved schedule -> Diff detector flags discrepancy before syndication export.
    - [ ] Drill 08: Live schedule breaking change -> Rapid mid-day schedule amendment revalidates all downstream breaks.
    - [ ] Drill 09: Transmission interruption -> Incident logger records outage duration and calculates affected ad credits.
    - [ ] Drill 10: Playout automation server failure -> Master control fallback switchover without dead-air.
    - [ ] Drill 11: Duplicate commercial booking -> De-duplication rule prevents double-airing of same copy.
    - [ ] Drill 12: Missed commercial spot -> Automatically scheduled for approved make-good slot or credit note issued.
    - [ ] Drill 13: StarTimes carriage feed outage -> Auto-generates carriage incident ticket and SLA penalty calculation.
    - [ ] Drill 14: Rights expiry mid-series run -> Blocks subsequent episodes from being loaded into future playlists.
    - [ ] Drill 15: Programme rescheduled after ad campaign booked -> Ad flighting rules re-evaluate target audience placement.
    - [ ] Drill 16: Incorrect sponsor sting bound to programme -> QC inspector flags mismatch prior to playlist lock.
    - [ ] Drill 17: Azeebo+ QR code / deep-link resolution failure -> Graceful fallback to default universe landing page.
    - [ ] Drill 18: As-run log reconciliation failure -> Ingestion quarantine alert triggered for manual traffic review.
    - [ ] Drill 19: Emergency filler activation -> Frame-accurate transition to pre-buffered station filler asset.
    - [ ] Drill 20: Schedule system database outage & recovery -> Playout automation continues running from local cached playlist.
  - **Deliverable:** Automated UAT failure test suite (`/tests/uat/broadcast-failure-drills/`).
  - **Acceptance Criteria:** All 20 failure scenarios successfully execute, recover, and log expected evidence.

- [ ] **TASK-P9-03: Golden Test Datasets Compilation (CCPP-001 §15)**
  - **Action:** Create standardized, deterministic test datasets:
    - 3 Channels with full technical parameters and metadata.
    - 50 Programmes across Drama, Music, Culture, News, and Formats.
    - 200 Episodes with complete metadata, versioning, and media master records.
    - 14 Full Days of 24/7 broadcast schedules with programmes, promos, and commercial breaks.
    - 10 Commercial Campaigns with spot bookings, rate cards, and client records.
    - 10 As-Run Logs containing clean airings, preemptions, and discrepancies.
    - 20 Talent Profiles, 5 AFCA Courses, 10 VCF Slates, and 5 TEND Distribution Deals.
  - **Deliverable:** Database seeding scripts (`/src/db/seeds/golden/`).
  - **Acceptance Criteria:** Test database can be reset and re-seeded deterministically in under 30 seconds.

- [ ] **TASK-P9-04: Four-Tier Release Gates Execution (R1.2A §67)**
  - **Action:** Enforce strict release gating pipeline:
    - **Gate 0 (Authority & Contract):** Requirements mapped to R1.2A; ADRs approved.
    - **Gate 1 (Security & Privacy):** Threat model completed; zero high/critical vulnerabilities; NDPR compliance verified.
    - **Gate 2 (Operational & Engineering):** Multi-tier test suite passes; performance budgets satisfied.
    - **Gate 3 (Operator & UAT Sign-off):** Broadcast director, traffic manager, and finance controller sign-offs recorded.
  - **Deliverable:** Release gate checklist automation and digital sign-off manifest.
  - **Acceptance Criteria:** Deployment pipeline halts automatically if any release gate fails.

---

## 13. PHASE 10: PRODUCTION CUTOVER, RUNBOOKS & EVIDENCE (S1 TO S5)

- [ ] **TASK-P10-01: Canary Deployment & Automated Rollback Runbooks (CCPP-001 §21)**
  - **Action:** Configure deployment pipelines with automated rollback:
    - Blue/Green or Canary deployment with health checks on error rate, latency, and system load.
    - Automated rollback triggers if 5xx errors exceed 0.1% or latency degrades > 50%.
  - **Deliverable:** CI/CD pipeline scripts and `/docs/runbooks/rollback-runbook.md`.
  - **Acceptance Criteria:** Rollback test successfully reverts staging environment to previous healthy version in < 60 seconds without data loss.

- [ ] **TASK-P10-02: Observability, Telemetry & OpenTelemetry Contracts (CCPP-001 §19)**
  - **Action:** Implement end-to-end observability:
    - Prometheus / Grafana metrics dashboards for system health, API latency, and queue depths.
    - Structured JSON application logs with trace ID and span ID correlation.
    - Operational alerts (PagerDuty / Slack / Email) for critical failures (playout disconnect, database connection pool exhaustion).
  - **Deliverable:** Observability stack configuration and alerting rules.
  - **Acceptance Criteria:** All critical workflows instrumented; alerts trigger within 30 seconds of simulated failure.

- [ ] **TASK-P10-03: Disaster Recovery, Backup & Business Continuity (R1.2A §57)**
  - **Action:** Establish business continuity infrastructure:
    - Automated daily database backups with point-in-time recovery (PITR) to offsite storage.
    - Playout automation emergency caching: Playout engines retain 48 hours of autonomous playlist cache in event of central network loss.
  - **Deliverable:** Backup automation scripts and `/docs/runbooks/disaster-recovery.md`.
  - **Acceptance Criteria:** Disaster recovery restoration drill successfully recovers database from backup in < 15 minutes with zero corruption.

- [ ] **TASK-P10-04: Production Evidence Ladder Progression (file 1.txt §8)**
  - **Action:** Establish continuous evidence logging to advance the enterprise evidence tier:
    - **Tier S1 (Assumptions):** Documented specifications and initial architecture.
    - **Tier S2 (Internal Sandbox):** Automated unit and integration test passes.
    - **Tier S3 (Operational Staging):** Passing UAT failure drills and operator rehearsals.
    - **Tier S4 (Independent Verification):** Security audits, compliance reviews, and external partner verification.
    - **Tier S5 (Binding Audited Production):** Real broadcast proof-of-air, live cash reconciliation, verified carriage uptime, and financial audit sign-off.
  - **Deliverable:** Enterprise evidence register (`/docs/audit/evidence-register.md`).
  - **Acceptance Criteria:** Every production feature links directly to S5 auditable operational logs.

- [ ] **TASK-P10-05: Session Handoff & Maintenance Discipline (CCPP-001 §8)**
  - **Action:** Enforce strict session handoff protocol at the conclusion of every engineering working block:
    - Update `/docs/handoffs/LATEST.md` with: Current Status, Changed Files, Passing Tests, Active Migrations, Identified Risks, and Immediate Next Action.
  - **Deliverable:** Active, continuously maintained `LATEST.md`.
  - **Acceptance Criteria:** Any incoming engineer or AI subagent can inspect `LATEST.md` and resume execution with zero loss of institutional context.

---

## 14. TRACEABILITY MATRIX & REQUIREMENT REGISTER INDEX

| Requirement Range | Domain / Capability | Governing Section | Primary Task Group |
|---|---|---|---|
| `BR-01` – `BR-12` | Enterprise Business Requirements | R1.2A §1, §6 | Tasks P1-01, P8-01, P8-02 |
| `CORE-01` – `CORE-12` | Enterprise Core Architecture & Storage | R1.2A §1, §36 | Tasks P1-01 to P1-05 |
| `BCAST-001` – `BCAST-020` | Broadcast & Linear TV Operations | R1.2A §11 – §22 | Tasks P2-01 to P2-12, P9-02 |
| `HUB-01` – `HUB-04` | Creative Economy Hub Orchestration | R1.2A §1, §3 | Tasks P1-01, P3-01 to P4-04 |
| `ACC-01` – `ACC-06` | VMN Talent Accelerator Platform | R1.2A §27 | Task P3-01 |
| `AFC-01` – `AFC-04` | African Film & Creative Arts Academy | R1.2A §28 | Task P3-02 |
| `AFCOM-01` – `AFCOM-04` | AFCA Competency Verification | R1.2A §28 | Task P3-02 |
| `VTM-01` – `VTM-04` | Virtual Talent Management & Escrow | R1.2A §30 | Task P3-04 |
| `VCF-01` – `VCF-04` | Virtual Content Fund & Slates | R1.2A §31 | Task P4-01 |
| `ONE-01` – `ONE-04` | ONE Studios Facilities & Stages | R1.2A §32 | Task P4-02 |
| `EVT-01` – `EVT-04` | Fusion Events & Digital Ticketing | R1.2A §33 | Task P4-04 |
| `TEND-01` – `TEND-04` | The Entertainment Network Distribution | R1.2A §34 | Task P4-03 |
| `HSP-01` – `HSP-04` | HeadspaceNG Knowledge & Media Intel | R1.2A §26, §54 | Task P5-01 |
| `CR8-01` – `CR8-04` | Cr8TechNG Toolkits & AI Workflows | R1.2A §158 | Task P5-02 |
| `AZP-01` – `AZP-06` | Azeebo+ Direct Consumer Federation | R1.2A §40, §41 | Tasks P6-01 to P6-04 |
| `NFR-01` – `NFR-08` | Non-Functional Requirements & Scale | R1.2A §1 | Tasks P0-02, P7-04, P10-02 |
| `SEC-01` – `SEC-07` | Security, Threat Model & Privacy | R1.2A §55, §56 | Tasks P1-02, P1-03, P9-01 |
| `UAT-01` – `UAT-20` | Operational UAT Scenarios & Failure Drills | R1.2A §66 | Task P9-02 |

---

*This document represents the complete, exhaustive operational task plan for Virtual Media Network Limited (VMNL). Every task is actionable, test-gated, and traceable back to the governing R1.2A BRD/PRD and R1.1 Claude Code Prompt Pack.*
