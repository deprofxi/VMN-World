# VMN WORLD | DEFINITIVE ROLE-BASED INFORMATION ARCHITECTURE INVENTORY

**Controlled revision R1.1 · Document VMNL-AZP-VMN-IA-001 · 4 November 2026**



**Edition status:** Comprehensive written UX/IA candidate. Not adopted, built, usability-tested, connected, funded or released by publication. Governing authorities: Group Master R1.3; ONE CIRCLE Operating Manual R2.3; VMN World BRD/PRD R1.3C; Financial Master R1.1; Legal Master R1.1. Original standalone VMN World R1.2 still needs formal reconciliation.



## Architectural audit verdict and correction disposition

The source R1.0 inventory had **570 addressable UI surfaces** across 24 journey groups, including 35 brand-page content instances. It was an ambitious inventory but not sufficient as a production architecture because it did not consistently distinguish routable pages, hosted dialogs, conditional states, sources, access purpose, entry/exit paths, error recovery and QA. This R1.1 integrates **all 570 original screen IDs**, adds **49 materially distinct missing surfaces**, and creates an implementation contract for each without inventing deployed systems or IAM permissions.



| Measure | Count / design interpretation |
| --- | --- |
| Total catalogued IA surfaces | 619 |
| Original R1.0 IDs retained | 570 |
| New R1.1 targeted additions | 49 |
| Routable pages (page definitions) | 243 |
| Dashboards (routable views) | 71 |
| Routable multistep wizards | 44 |
| Hosted dialogs/drawers | 96 |
| Hosted accessible tabs | 12 |
| Exception/empty/denial state surfaces | 118 |
| Brand-profile content instances | 35 |
| Permission-scoped user role/persona labels | 51 |
| Journey groups | 24 |
| S01–S30 original UI family crosswalk | 30 |
| SOP detail data instances | 161 |
| Mission playbook data instances | 16 |
| Reusable component contracts | 48 |
| Golden end-to-end journey tests defined | 18 |


**Count integrity:** 619 catalogue rows are *not* 619 bespoke code components. The 35 brand pages reuse `BRD-006`; the 161 SOP detail URLs reuse `CIRC-010`; the 16 playbook instances reuse `MISS-002`. Many dialogs, tabs and edge surfaces should render inside established host pages or router boundaries, not as routes. Source-to-component reuse and implementation budget decisions must be validated against the actual repository.



## Non-negotiable product architecture and access constitution

1. **Five governance layers:** Group Master defines enterprise/brands; ONE CIRCLE defines accountable work; VMN World provides institutional access; Finance governs cash/accounting; Legal governs authority/rights. Azeebo+ retains independent consumer product and entitlement ownership.

2. **35 owner-defined brand identities are not 35 TV stations.** TEN/Nigezie/Candy/Games brand pages are public information unless a specific real service and approved CTA have been verified. TEN Orisun/Isi Mbido are aliases to validate against actual service IDs; TEN Tushe is owner-defined but not proved broadcasting.

3. **Exactly five Azeebo+ demand systems**: Original Storyworlds, Cinemaxis, Games 360, 9TLIFE, Azeebo+ Live. Eight consumer universes are views, not additional ledgers. Four peer storyworlds: AOU, Epic Tales, Hidden Lives, General Franchise Universe.

4. **Builders, Problem Solvers and Coaches are contribution modes**. They confer no additional employment, payment, rights, Board or specialist-signature authority. One accountable human owner must hold each governed mission.

5. **Role labels are personas, not IAM grants.** Identity, relationship, organisation, purpose, entitlement, source domain, actual delegation, record scope, device/session risk, effective time and independent approver all require server-side checks for consequential operations. A matching email does not merge customer, creator, learner and employee permissions.

6. **Sensitive domains remain source-owned**: People, AFCA learner welfare and grades, rights, Finance and Broadcast retain independent legitimate control. External professional portal data cannot be joined into general employee search or Agent OS by convenience.

7. **No false completion**: accepted request ≠ executed transaction; booked advert/EPG/playlist ≠ aired; invoice ≠ cash; booked talent ≠ paid talent; outbound Azeebo+ click ≠ opened app or purchase; a designer-generated page ≠ launched product.

8. **Specific high-risk boundaries**: Candy Cast adult eligibility and choice independent of Candy Plus; Candy Plus subscription and catalogue need separate legal/content/host/product approvals. Games Bet/Lotto cannot use an inferred general entertainment wallet or unverified licence.

9. **Accessibility and device parity**: Target WCAG 2.2 AA for released public/critical surfaces, mobile Android narrow layouts, keyboard/screen-reader alternatives, clear legal-language copy, offline/fallback where legitimate and accessible action recovery. Native app and PWA decisions remain design/engineering approvals.

10. **Release gates are scope-specific**: W0 public truth, W1 internal read-only, W2 governed missions, W3 professional workspaces and independently verified referrals, W4 consequential specialist operations; G and W5 are unapproved conditional/future capabilities. No single global GO replaces domain review.



## Information hierarchy and navigation realms

**Public institution:** `/` → `/about` → `/brands` → `/brands/{canonical-slug}` → `/storyworlds` → `/capabilities` → `/programmes` → `/work-with-vmn` → verified receipt, with accessible support, privacy and corrections. These are *proposed patterns*, not deployed URL claims.

**Professional workspaces:** verified identity → purpose-scoped relationship selector → `/workspace/{domain}` → contract, application, assessment, work, accepted output and appropriately sourced payment/statement view. Do not show other tenants or imply an actual signed contract.

**Employee ONE CIRCLE:** verified employee relationship → `/circle` → source-backed Ask VMN / SOP discovery → scoped mission/playbook → accountable owner and capacity → independent approvals → accepted handoff and evidence → true external result/reconciliation.

**Specialist consoles:** `/operations`, `/rights`, `/editorial`, `/broadcast`, `/finance`, `/governance`, `/admin` are namespace proposals; source ownership, technical controls and high-risk writes belong to legitimate underlying systems and signatories. An operator dashboard is not a substitute accounting, licensing, HR or Broadcast system.

**Azeebo+ boundary:** VMN World may show approved informational pages and a verified L1 external referral; title contextual L2 and selective identity federation L3 require separate contracts/consent/source verification. Consumer viewing, payments and entitlement management live in Azeebo+, not the VMN World route tree.



## Meaning of the interface classes

| Class | UI description | Render/route contract | Never infer | Required accessibility |
| --- | --- | --- | --- | --- |
| PAGE | Routable page | Unique view/template with authorised path | SSR/SPA route may be chosen by engineering after repo inspection | Clear primary task, loading, empty, restricted and stale states |
| DASHBOARD | Routable data overview | Reusable shell, cards/metrics/tables, actual source freshness | No dashboard metric constitutes authority or payment settlement | Keyboard sorting/filtering, adapted mobile cards |
| WIZARD | Routable multi-step process | Draft with step progress, validation, idempotent submit and safe resume | Submit always a request until source and human confirm | Focus management, per-step errors, backtracking and safe cancel |
| DIALOG | Hosted modal/drawer | Parent/host + scoped record; not a separate sitemap route | No signoff from button alone; close/cancel preserved | Focus trap and return; accessible mobile sheet |
| TAB | Hosted detail subview | Accessible tab panel within an approved parent page | Never primary means to hide rights, fees or critical error | Arrow-key behaviour and semantic tab panel |
| STATE | Reusable exception/edge view | Composed inside originating workflow or router error boundary | Inherits original permissions; no private details in 403/404 | Precise recovery, clear action and relevant human support |
| CONTENT_INSTANCE | One reusable canonical template | 35 verified BrandRef instances; one brand-page component | No independent channel/app/legal entity based on brand listing | Brand owner controls copy/status and language |




## Journey and surface coverage map

| Journey | Primary roles | Purpose | Screens | Entry | Release scope |
| --- | --- | --- | --- | --- | --- |
| J01 · Public company discovery and trust | Public visitor, Audience/fan | Establish VMNL identity, navigate company information, confirm authorised public claims and find human support. | 22 | PUB-001 | W0 |
| J02 · Brand families, media identities and sub-brand discovery | Public visitor, Audience/fan, Brand Steward | Expose 35 current owner-named brands with accurate remits and independent service status, without inventing channels. | 16 | BRD-001 | W0, W2, W4 |
| J03 · Original Storyworlds, intellectual property and Azeebo+ referral | Public visitor, Audience/fan, Rights/IP officer, Azeebo+ Product (external authority) | Present four peer storyworlds while keeping canon, title rights, media availability and Azeebo+ consumer actions separate. | 15 | STW-001 | G, W0, W3 |
| J04 · Capability, studio, academy and programme discovery | Public visitor, Client contact, Applicant, Creator/talent | Help public/professional users find the right specialist unit and route enquiries to an accountable human. | 18 | SERV-001 | W0 |
| J05 · Public enquiries, qualified intake and application handoff | Public visitor, Client contact, Partner, Commercial/BD | Capture the correct request once, preserve privacy, and make a real receiving owner accountable for follow-up. | 18 | LEAD-009 | W0, W2 |
| J06 · Identity, onboarding, consent and relationship switching | Employee/contractor, Client contact, Creator/talent, Learner, Partner | Authenticate separately verified relationships and enforce purpose-bound access without merging consumer and employee accounts. | 25 | AUTH-001 | W1, W3, W4 |
| J07 · Client onboarding, commissioning, delivery and acceptance | Client contact, Commercial/BD, Mission Owner, Producer/ONE Studios | Move a qualified client brief to signed scope, accepted delivery, invoices and verifiable next work. | 24 | CLT-001 | W3, W4 |
| J08 · Sponsors, institutional partners, training providers and organisations | Partner, Sponsor, Training partner, Commercial/BD, Talent Accelerator operator | Onboard external organisations under verified legal identity, sponsorship conditions, IP and access boundaries. | 23 | PART-001 | W3, W4 |
| J09 · Accelerator applications, AFCA learning and CLAP progression | Applicant, Learner, AFCA academic authority, Talent Accelerator operator, Training partner | Separate admissions, teaching, assessments, moderation, appeals, verification and downstream professional work. | 30 | LEARN-001 | W0, W3, W4 |
| J10 · Creator onboarding, professional marketplace and paid work | Creator/talent, VTM Marketplace operator, VCF creator operator, Client contact | Support evidence-backed profile verification, qualified work, consent, acceptance, settlement and disputes. | 30 | TAL-001 | W3, W4 |
| J11 · Candy Cast, Candy Plus and restricted-consent boundaries | Candy Cast applicant, Public visitor, Brand Steward, Privacy officer, Legal counsel | Protect adult casting participation, independent decisions and separate subscription/product controls. | 20 | CAND-001 | G, W0, W3, W4 |
| J12 · ONE CIRCLE home, knowledge, SOP discovery and Ask VMN | Employee/contractor, Builder, Problem Solver, Coach/mentor, Knowledge steward | Give each authorised worker one reliable entry to current procedures, missions and owner-backed knowledge without universal private access. | 32 | CIRC-001 | W1, W2, W4 |
| J13 · Mission framing, staffing, execution, approvals and closure | Mission Owner, Builder, Problem Solver, Coach/mentor, Hub resource coordinator | Move an actual task from intake through signed gates, accepted deliverable, source reconciliation and reusable learning. | 31 | MISS-001 | W2, W4 |
| J14 · Capability leaders, resource management and coaching | Capability Lead, Coach/mentor, Hub resource coordinator, People & Culture | Prevent double booking, protect employment responsibility, and track professional quality without converting Coach mode into HR authority. | 18 | CAP-001 | W2 |
| J15 · ONE Studios, VCF production and professional asset delivery | Producer/ONE Studios, VCF creator operator, Builder, Editor/publisher | Support professional work while preserving actual media ownership, production permissions, asset/version QC and handoff. | 23 | STUD-001 | W3, W4 |
| J16 · Fusion Events, 9TLIFE, Azeebo+ Live and event operations | Fusion Events operator, Venue/vendor, Client contact, Producer/ONE Studios | Support event and city-experience workflows while keeping Azeebo+ Live transactions and third-party fulfilment independent. | 18 | EVNT-001 | W0, W3, W4 |
| J17 · IP, storyworld governance, rights and TEND licensing | Rights holder, Rights/IP officer, TEND licensing officer, Distributor/buyer, Producer/ONE Studios | Manage title rights and external opportunities without assuming ownership from a script, media file or Originals label. | 25 | IPR-001 | W3, W4 |
| J18 · Brand editorial, publishing, media and company content governance | Editor/publisher, Brand Steward, Marketing/PR, Producer/ONE Studios | Publish verified brand/content copy with legal, rights, advertising and service-status controls. | 21 | CMS-001 | W0, W2, W4 |
| J19 · Broadcast scheduling, traffic, transmission and proof-of-air | Broadcast operator, Traffic/scheduling controller, Master control engineer, Rights/IP officer, Finance/controller | Keep actual channel IDs and rights-safe schedule/EPG/playlist/as-run evidence distinct. | 26 | BRC-001 | W0, W3, W4 |
| J20 · Finance, commercial performance, treasury and capital controls | Finance/controller, CFO/treasury approver, Commercial/BD, Executive/Board adviser | Expose source-backed obligations and approvals without replacing the general ledger or treating proposed cash as available. | 35 | FIN-001 | W3, W4 |
| J21 · Legal, People, governance, privacy and formal approvals | Legal counsel, People & Culture, Privacy officer, Executive/Board adviser, Independent auditor/QA | Make reserved authorities and protected personal rights operable without letting missions or AI make legal or employment decisions. | 34 | GOV-001 | W0, W1, W3, W4 |
| J22 · AI, Cr8Tech, system integrations, product operations and security | AI/AgentOps owner, Cr8Tech/engineering, Security/IT administrator, Platform tenant administrator, Knowledge steward, VMN World Product/QA | Operate controlled source, agent and product release governance without pretending unverified connectors are live. | 36 | SYS-001 | W1, W2, W3, W4 |
| J23 · Global edge cases, denial, outage, recovery and safety states | Public visitor, Employee/contractor, Customer/support operator, VMN World Product/QA | Reusable system-wide pages/modals for predictable failures, truthful status and accessible recovery. | 44 | EDGE-001 | W0, W1, W2, W3, W4 |
| J02a · Individually addressable brand pages (one reusable template) | Public visitor, Audience/fan | 35 exact name/ID public page instances, sharing BRD-006 with distinct source data. | 35 | BRI-001 | W0 |




## Every page, dashboard, modal, wizard, tab, content instance and edge case

**Required table fields:** Screen ID, surface type, screen name, authorized target persona(s), core UI components, primary user action, proposed route/host, release gate and source owner. Every row has additional source, permissions, data classification, negative/fallback, audit and acceptance detail in the XLSX/JSON engineering register. The route/host is a proposed logical map, not a deployed URL.



### J01 · Public company discovery and trust

Establish VMNL identity, navigate company information, confirm authorised public claims and find human support.

| Screen ID | UI surface | Screen / view / state | User role(s) | Core UI components | Primary user action | Route or host | Release gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PUB-001 | PAGE | Corporate home | Public visitor, Audience/fan | Hero value proposition; operating pillars; brand shortcuts; verified contact CTA; status notices | Explore the Group and choose an approved pathway | / | W0 |
| PUB-002 | PAGE | About VMNL | Public visitor | Company purpose; verified corporate profile; operating model explainer; company source/date label | Understand what VMNL is and what it does | /about | W0 |
| PUB-003 | PAGE | Ecosystem map | Public visitor | Interactive hierarchy; corporate layers; specialist capability links; demand systems; status legend | Navigate institution, capabilities and consumer boundaries | /ecosystem | W0 |
| PUB-004 | PAGE | ONE CIRCLE explanation | Public visitor, Applicant | Three contribution modes; human authority statement; illustrative mission journey; career enquiry link | Understand the working model without assuming open employment | /one-circle-explanation | W0 |
| PUB-005 | PAGE | Media and audience overview | Public visitor, Audience/fan | TEN/Nigezie/Candy/Games family tiles; audience descriptions; service-status labels | Choose a media family or channel-information page | /media-and-audience-overview | W0 |
| PUB-006 | PAGE | Creative Economy Hub overview | Public visitor, Client contact | Capability-network diagram; expert service catalog; eligible enquiry routes | Find professional supply and client solutions | /creative-economy-hub-overview | W0 |
| PUB-007 | PAGE | Company news and announcements | Public visitor, Marketing/PR | Approved news cards; date/source; category filters; correction references | Read verified announcements | /news | W0 |
| PUB-008 | PAGE | News and announcement detail | Public visitor | Article body; asset permissions; publication date; source/author; related brands | Read or share current verified company information | /news-and-announcement-detail | W0 |
| PUB-009 | PAGE | Media/press contact | Public visitor, Marketing/PR | Press guidelines; verified media contact route; newsroom enquiry form; deadlines | Submit a press enquiry | /media-press-contact | W0 |
| PUB-010 | PAGE | Corporate governance overview | Public visitor | Published institutional disclosures; company responsibilities; externally approved policy statements | Review permitted company governance information | /corporate-governance-overview | W0 |
| PUB-011 | PAGE | Contact centre | Public visitor, Client contact, Partner | Contact channels; enquiry intent picker; hours/disclaimer; accessible form | Contact the appropriate VMNL business team | /contact | W0 |
| PUB-012 | PAGE | Help and support landing | Public visitor, Audience/fan | FAQ index; topic search; assisted route; incident/complaint links | Find a supported answer or raise a query | /support | W0 |
| PUB-013 | PAGE | Search results - public | Public visitor | Search box; verified result cards; brand/unit/type facets; date and operating status | Find a source-backed public page | /search | W0 |
| PUB-014 | STATE | Public search: no eligible results | Public visitor | No-results explanation; alternate terms; popular topics; human enquiry link | Retry search or request assistance | PUB-001 | W0 |
| PUB-015 | DIALOG | Public contact-intent selector | Public visitor, Client contact, Partner | Enquiry categories; privacy note; route previews; continue/cancel buttons | Select the correct contact form | PUB-011 | W0 |
| PUB-016 | PAGE | Accessibility statement and support | Public visitor | Accessibility commitments; supported channels; barriers report; alternative contact | Report an access barrier or obtain assistance | /accessibility | W0 |
| PUB-017 | PAGE | Privacy and cookie policy | Public visitor | Privacy notice; purpose/retention summary; data-rights routes; policy revision | Understand processing and request privacy support | /privacy | W0 |
| PUB-018 | DIALOG | Cookie preference centre | Public visitor | Necessary/optional categories; descriptions; consent-state controls; save/withdraw | Set or change permitted cookie choices | PUB-017 | W0 |
| PUB-019 | PAGE | Website terms and disclaimer | Public visitor | Terms revision; publishing limits; external links notice; corrections and liability contacts | Read website conditions before use | /terms | W0 |
| PUB-020 | PAGE | Sitemap and page index | Public visitor | Grouped links; available routes; supported language; search navigation | Discover a specific permitted route | /sitemap | W0 |
| PUB-021 | PAGE | Public corrections and factual-claim report | Public visitor, Audience/fan | Public statement/version reference; evidence description; privacy notice; response path | Report an inaccurate public company or partner claim | /public-corrections-and-factual-claim-report | W0 |
| PUB-022 | TAB | Published statement revision history | Public visitor, Audience/fan | Current verified wording; publication timestamp; correction reason; prior version label | Inspect a corrected official statement without relying on withdrawn text | PUB-001 | W0 |




### J02 · Brand families, media identities and sub-brand discovery

Expose 35 current owner-named brands with accurate remits and independent service status, without inventing channels.

| Screen ID | UI surface | Screen / view / state | User role(s) | Core UI components | Primary user action | Route or host | Release gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BRD-001 | PAGE | Brand directory | Public visitor, Audience/fan | Four family sections; 35 verified name cards; search/filter; status legends | Browse all brand identities | /brands | W0 |
| BRD-002 | PAGE | TEN family overview | Public visitor, Audience/fan | Eleven sub-brand cards; language-led focus; approved service aliases; brand enquiries | Choose a TEN brand | /brands/ten | W0 |
| BRD-003 | PAGE | Nigezie family overview | Public visitor, Audience/fan | Seven branded propositions; heritage timeline; Next Wave; media route labels | Choose a Nigezie proposition | /brands/nigezie | W0 |
| BRD-004 | PAGE | Candy TV family overview | Public visitor, Audience/fan | Twelve brand tiles; safe editorial description; Cast/Plus separation notes; support link | Find age-appropriate information | /brands/candy-tv | W0 |
| BRD-005 | PAGE | Games 360 family overview | Public visitor, Audience/fan | Five brand tiles; entertainment focus; Bet/Lotto regulated-status warnings | Explore available entertainment information | /brands/games-360 | W0 |
| BRD-006 | PAGE | Reusable sub-brand detail template | Public visitor, Audience/fan | Canonical brand name/ID; remit; parent; design vs operating status; related stories; permitted CTA | Read a brand's verified proposition and follow its valid route | /brands/{approved-brand-slug} | W0 |
| BRD-007 | TAB | Sub-brand editorial format view | Public visitor, Audience/fan | Eligible formats/strands; safe preview; related official channels; dates/source | Understand the brand's approved programming formats | BRD-001 | W0 |
| BRD-008 | TAB | Brand service-and-channel mapping view | Public visitor, Brand Steward | Brand alias; verified service ID where permitted; operator; territory/status; audience limits | Check where an actual service may be accessed | BRD-001 | W0 |
| BRD-009 | DASHBOARD | Brand Steward internal overview | Brand Steward, Editor/publisher | Owned brands; content approvals; service-status issues; versions; tasks and incidents | Review brand governance and outstanding approvals | /brands/brand-steward-internal-overview | W2 |
| BRD-010 | WIZARD | Brand charter / mandate editor | Brand Steward | Proposed edit; historical remit; authority selector; stakeholder review; preview | Submit a governed brand-definition change proposal | /brands/brand-charter-mandate-editor | W4 |
| BRD-011 | DIALOG | Brand operational-status change request | Brand Steward, VMN World Product/QA | Current status; actual service evidence; authorizer; warning; rollback | Request a verified status update | BRD-009 | W4 |
| BRD-012 | DIALOG | Alias-to-service mapping review | Brand Steward, Broadcast operator | Canonical brand and service IDs; operator confirmation; duplicate detection | Approve or reject a brand-service alias | BRD-008 | W4 |
| BRD-013 | STATE | Brand has no verified operating service | Public visitor | Truthful definition-only label; informational content; contact action; no streaming controls | Contact the appropriate brand team without false availability | BRD-001 | W0 |
| BRD-014 | STATE | Brand page withdrawn or superseded | Public visitor, Brand Steward | Retired banner; current canonical page; revision/date; correction link | Follow the current approved brand identity | BRD-001 | W0 |
| BRD-015 | DIALOG | Request a brand partnership | Public visitor, Client contact, Sponsor | Selected brand context; buyer organisation; purpose; consent; supporting brief | Begin a qualified brand-collaboration enquiry | BRD-006 | W0 |
| BRD-016 | PAGE | Brand-to-service proof and operating-status history | Brand Steward, Broadcast operator, Independent auditor/QA | Canonical brand ID; live service registry proof; alias audit; approval history | Validate a brand-to-service relationship before any live-service claim | /brands/brand-to-service-proof-and-operating-status-history | W3 |




### J03 · Original Storyworlds, intellectual property and Azeebo+ referral

Present four peer storyworlds while keeping canon, title rights, media availability and Azeebo+ consumer actions separate.

| Screen ID | UI surface | Screen / view / state | User role(s) | Core UI components | Primary user action | Route or host | Release gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| STW-001 | PAGE | Original Storyworlds landing | Public visitor, Audience/fan | Four-world cards; approved universe descriptions; ownership/status disclosure; verified referrals | Discover the narrative portfolio | /storyworlds | W0 |
| STW-002 | PAGE | Agbàlá Olódùmarè Universe profile | Public visitor, Audience/fan | AOU canon-controlled summary; approved imagery; title list with true state; accessibility | Explore founding storyworld information | /storyworlds/aou | W0 |
| STW-003 | PAGE | Epic Tales Universe profile | Public visitor, Audience/fan | Distinct world premise; title concepts and approved state; source revision | Explore a peer storyworld | /storyworlds/epic-tales | W0 |
| STW-004 | PAGE | Hidden Lives Universe profile | Public visitor, Audience/fan | Distinct shared narrative proposition; property/title status; approved cross-links | Explore the Hidden Lives portfolio | /storyworlds/hidden-lives | W0 |
| STW-005 | PAGE | General Franchise Universe profile | Public visitor, Audience/fan | Five-series franchise concept; title/age-appropriate information; historical alias note | Explore the General Franchise identity | /storyworlds/general-franchise | W0 |
| STW-006 | PAGE | Storyworld title detail | Public visitor, Audience/fan | Title identity; synopsis; cast/credit cleared copy; format/state; availability disclaimer | Read about an approved title or follow verified media links | /storyworlds/{world-id}/titles/{title-id} | W0 |
| STW-007 | TAB | Title editions and formats | Public visitor, Audience/fan | Source/long/vertical edition labels; rights state; restricted availability | Compare legitimate format information | STW-001 | W0 |
| STW-008 | PAGE | Azeebo+ information gateway | Public visitor, Audience/fan | Product description; five demand systems; eight universes; owned-platform boundary; verified CTA | Understand Azeebo+ and follow the approved route | /azeebo-plus | W0 |
| STW-009 | WIZARD | Verified Azeebo+ destination selector | Public visitor, Audience/fan | Device and territory eligibility; verified L1 route; fallback; privacy context | Open an approved Azeebo+ destination | /storyworlds/verified-azeebo-destination-selector | W3 |
| STW-010 | DIALOG | External referral confirmation | Public visitor, Audience/fan | Destination identity; leave-site note; app/web choice; event definition | Continue to the external Azeebo+ experience | STW-009 | W3 |
| STW-011 | STATE | Azeebo+ route unverified / expired | Public visitor, Audience/fan | Clear unavailability; safe product information; human support link | Use informational fallback instead of a broken app link | STW-001 | W0 |
| STW-012 | STATE | Azeebo+ app not installed | Public visitor, Audience/fan | Provider-approved web fallback; optional lawful store link; no forced account join | Open a supported alternative destination | STW-001 | W3 |
| STW-013 | STATE | Title is in development / not watchable | Public visitor, Audience/fan | Development-state notice; no Watch/Pay; latest official title page | Read available information without a false premiere claim | STW-001 | W0 |
| STW-014 | DIALOG | Notify me about this title (conditional) | Public visitor, Audience/fan | Optional consent; channel preferences; verified mailing destination; unsubscribe | Request a lawful future announcement where approved | STW-006 | G |
| STW-015 | STATE | Title rights/territory unavailable | Public visitor, Audience/fan | Availability explanation without private licence detail; safe alternative | Return to permitted title information | STW-001 | W3 |




### J04 · Capability, studio, academy and programme discovery

Help public/professional users find the right specialist unit and route enquiries to an accountable human.

| Screen ID | UI surface | Screen / view / state | User role(s) | Core UI components | Primary user action | Route or host | Release gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SERV-001 | PAGE | Capabilities directory | Public visitor, Client contact | Service categories; ten-plus specialist units; eligibility; proof/status; enquiry | Choose a professional capability | /capabilities | W0 |
| SERV-002 | PAGE | VMN Creative Economy Hub profile | Public visitor, Client contact | Coordination charter; shared services; scope limits; enquiry form | Request a cross-unit engagement | /capabilities/vmn-creative-economy-hub-profile | W0 |
| SERV-003 | PAGE | HeadspaceNG profile | Public visitor, Client contact | Research/strategy remit; sample service domains; limitations; contact | Submit an insight or strategy brief | /capabilities/headspaceng-profile | W0 |
| SERV-004 | PAGE | Cr8TechNG profile | Public visitor, Client contact | Enterprise technology/AI remit; implementation review; confidentiality; contact | Request an integration or advisory assessment | /capabilities/cr8techng-profile | W0 |
| SERV-005 | PAGE | VMN Talent Accelerator profile | Public visitor, Applicant | Programme-network mission; verified opportunities; partner path | Explore programme participation | /capabilities/vmn-talent-accelerator-profile | W0 |
| SERV-006 | PAGE | AFCA profile | Public visitor, Applicant | Academy programmes; credential limits; admissions; appeals information | Explore or apply for approved learning | /capabilities/afca-profile | W0 |
| SERV-007 | PAGE | Afro-Fusion Creatives profile | Public visitor, Creator/talent | Community/guild overview; participation charter; consent and member eligibility | Find community participation opportunities | /capabilities/afro-fusion-creatives-profile | W0 |
| SERV-008 | PAGE | VMN Creator Factory profile | Public visitor, Client contact, Creator/talent | Creator services; permitted format examples; contracting boundaries | Request a creator-led content service | /capabilities/vmn-creator-factory-profile | W0 |
| SERV-009 | PAGE | VMN Talent Marketplace profile | Public visitor, Client contact, Creator/talent | Talent marketplace principles; verified work conditions; registration/enquiry | Find talent or explore professional listing | /capabilities/vmn-talent-marketplace-profile | W0 |
| SERV-010 | PAGE | ONE Studios profile | Public visitor, Client contact | Professional production and post; resources; quality gates; quote enquiry | Request production or studio services | /capabilities/one-studios-profile | W0 |
| SERV-011 | PAGE | Fusion Events profile | Public visitor, Client contact | Physical event services; risk/underwriting disclosure; quote enquiry | Submit an event brief | /capabilities/fusion-events-profile | W0 |
| SERV-012 | PAGE | TEND profile | Public visitor, Rights holder | Distribution/licensing remit; rights-holder intake; territory caution | Enquire about an external licence or distribution | /capabilities/tend-profile | W0 |
| SERV-013 | PAGE | Programmes and training directory | Public visitor, Applicant | Programme cards; cohort status; age/eligibility; dates if verified; filters | Find an actually available learning programme | /programmes | W0 |
| SERV-014 | PAGE | Programme public detail | Public visitor, Applicant | Outcomes; curriculum; verified cost/terms; date and status; apply/enquire | Decide eligibility and begin an approved application | /capabilities/programme-public-detail | W0 |
| SERV-015 | PAGE | Showcases and case studies directory | Public visitor, Client contact | Rights-cleared client cases; filters; actual outcomes; source/consent | Evaluate relevant experience | /capabilities/showcases-and-case-studies-directory | W0 |
| SERV-016 | PAGE | Case study detail | Public visitor, Client contact | Problem; approved process; deliverables; measured outcomes with limits; client permission | Review a credible completed example | /capabilities/case-study-detail | W0 |
| SERV-017 | STATE | Programme not accepting applications | Public visitor, Applicant | Closed window notice; real eligibility; alternate programmes; contact | Choose an alternative or enquire | SERV-001 | W0 |
| SERV-018 | STATE | Professional service not operationally released | Public visitor, Client contact | Mandate-only page; honest proposed status; no quote/booking button | Use a verified information or enquiry route | SERV-001 | W0 |




### J05 · Public enquiries, qualified intake and application handoff

Capture the correct request once, preserve privacy, and make a real receiving owner accountable for follow-up.

| Screen ID | UI surface | Screen / view / state | User role(s) | Core UI components | Primary user action | Route or host | Release gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| LEAD-001 | WIZARD | General business enquiry wizard | Public visitor, Client contact, Partner | Contact identity; intent; organisation; summary; privacy disclosure; verification | Submit one routed enquiry with clear consent | /work-with-vmn | W0 |
| LEAD-002 | WIZARD | Client creative-services brief wizard | Client contact | Goal; target audience; brand; desired output; budget band; timing; attachments | Submit a qualified creative brief | /work-with-vmn/client-creative-services-brief-wizard | W0 |
| LEAD-003 | WIZARD | Media and advertising enquiry wizard | Client contact, Sponsor | Actual channel/service; campaign category; audience; dates; proof and conflict warnings | Request a media proposal without booking imaginary inventory | /work-with-vmn/media-and-advertising-enquiry-wizard | W0 |
| LEAD-004 | WIZARD | Programme and training enquiry wizard | Applicant, Partner | Programme selector; status; eligibility; accessible questions; support needs | Ask about an approved programme or partnership | /work-with-vmn/programme-and-training-enquiry-wizard | W0 |
| LEAD-005 | WIZARD | Creator or talent opportunity enquiry | Client contact | Role; paid brief; dates; location; rights; safety; budget | Request verified talent supply | /work-with-vmn/creator-or-talent-opportunity-enquiry | W0 |
| LEAD-006 | WIZARD | Production and studio quotation enquiry | Client contact | Project format; services; delivery spec; equipment needs; confidentiality; funding indication | Request a production scoping call | /work-with-vmn/production-and-studio-quotation-enquiry | W0 |
| LEAD-007 | WIZARD | Event feasibility enquiry | Client contact, Venue/vendor | Event type; venue window; capacity; safety; funding; organiser | Start an event feasibility assessment | /work-with-vmn/event-feasibility-enquiry | W0 |
| LEAD-008 | WIZARD | Rights holder and licensing enquiry | Rights holder, Distributor/buyer | Title and rights summary; window/territory; legal contact; confidentiality | Open a rights/distribution case | /work-with-vmn/rights-holder-and-licensing-enquiry | W0 |
| LEAD-009 | PAGE | Request receipt and next-steps page | Public visitor, Client contact, Partner | Unique enquiry ID; submitted summary; responsible channel; privacy caution; support | Save reference and understand follow-up | /enquiries/{case-id}/receipt | W0 |
| LEAD-010 | DIALOG | Attach a brief or evidence | Public visitor, Client contact, Partner | File picker; virus/size/type checks; redaction advisory; upload status | Attach permitted documents securely | LEAD-001 | W0 |
| LEAD-011 | DIALOG | Confirm consent and submission | Public visitor, Client contact, Partner | Purpose; marketing opt-in separate; terms; confirm/back | Submit the request with appropriate permission | LEAD-001 | W0 |
| LEAD-012 | STATE | Duplicate enquiry detected | Public visitor, Client contact | Existing case indication; safe resend/reference; avoid exposing another person's case | Reuse or amend an existing request | LEAD-001 | W0 |
| LEAD-013 | STATE | Enquiry requires additional qualifying information | Public visitor, Client contact | Missing field list; save progress; human support; corrected submission | Complete essential details and resubmit | LEAD-001 | W0 |
| LEAD-014 | STATE | Contact form service temporarily unavailable | Public visitor, Client contact, Partner | Error explanation; alternate verified contact; draft retry; no false submitted state | Use assisted channel or retry safely | LEAD-001 | W0 |
| LEAD-015 | DASHBOARD | Intake triage queue | Commercial/BD, Hub resource coordinator, Customer/support operator | New leads; source/status; ownership; SLA; duplicate/permissions; routing | Accept and assign the actual receiving owner | /work-with-vmn/intake-triage-queue | W2 |
| LEAD-016 | DIALOG | Assign enquiry to accountable team | Commercial/BD, Hub resource coordinator | Chosen unit/brand; capable receiver; handoff note; acceptance status | Route request for human acknowledgement | LEAD-015 | W2 |
| LEAD-017 | TAB | Intake history and outcomes | Commercial/BD, Customer/support operator | Case timeline; consent scope; responses; qualified/unqualified decision | Review and close an intake case with evidence | LEAD-001 | W2 |
| LEAD-018 | DIALOG | Withdraw or rectify a submitted enquiry | Client contact, Public visitor, Partner | Existing case reference; authenticated verification method; withdrawal scope; retention notice | Request cancellation or correction of an enquiry | LEAD-001 | W0 |




### J06 · Identity, onboarding, consent and relationship switching

Authenticate separately verified relationships and enforce purpose-bound access without merging consumer and employee accounts.

| Screen ID | UI surface | Screen / view / state | User role(s) | Core UI components | Primary user action | Route or host | Release gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AUTH-001 | PAGE | Sign-in landing | Employee/contractor, Client contact, Creator/talent, Learner, Partner | Single-sign-on options if verified; email identity; privacy and security notices | Start approved authentication | /sign-in | W1 |
| AUTH-002 | WIZARD | New professional account registration | Client contact, Creator/talent, Learner, Partner | Relationship category; verified contact; terms; organisation or programme context | Request a supported professional identity | /account/new-professional-account-registration | W3 |
| AUTH-003 | PAGE | Verify email or contact method | Employee/contractor, Client contact, Creator/talent, Learner, Partner | Challenge; expiry; resend; accessibility; support | Verify control of an allowed contact method | /account/verify-email-or-contact-method | W1 |
| AUTH-004 | PAGE | Multi-factor challenge | Employee/contractor, Client contact, Creator/talent, Learner, Partner | Authenticator/security-key fields; trusted device context; retry limits | Complete second-factor authentication | /account/multi-factor-challenge | W1 |
| AUTH-005 | DIALOG | Choose verified relationship | Employee/contractor, Client contact, Creator/talent, Learner, Partner | Relationship cards; organisation; purpose; effective role and expiry | Enter the correct scoped workspace | AUTH-001 | W1 |
| AUTH-006 | WIZARD | Organisation membership request | Client contact, Partner | Organisation record; sponsor/administrator; role and evidence; approval | Request access to a company-specific tenant | /account/organisation-membership-request | W3 |
| AUTH-007 | DASHBOARD | Personal account and preferences | Employee/contractor, Client contact, Creator/talent, Learner, Partner | Profile summary; accessible preferences; permitted contact method; notification choices | Manage own account preferences | /account | W1 |
| AUTH-008 | PAGE | Privacy permissions centre | Employee/contractor, Client contact, Creator/talent, Learner, Partner | Processing purposes; granted permissions; withdrawal; subject-access route | Review or request allowed consent changes | /account/privacy | W1 |
| AUTH-009 | PAGE | Security devices and sessions | Employee/contractor, Client contact, Creator/talent, Learner, Partner | Trusted devices; active sessions; recent logins; revoke | End unfamiliar or unused sessions | /account/security | W1 |
| AUTH-010 | DIALOG | Change relationship or workspace | Employee/contractor, Client contact, Creator/talent, Learner, Partner | Current context; target relationship; permission notice; unsaved work warning | Switch to a separately authorized role | AUTH-007 | W1 |
| AUTH-011 | DIALOG | Log out / exit workspace | Employee/contractor, Client contact, Creator/talent, Learner, Partner | Unsaved work summary; session revoke; confirm | Exit securely | AUTH-007 | W1 |
| AUTH-012 | PAGE | Forgotten credential / access recovery | Employee/contractor, Client contact, Creator/talent, Learner, Partner | Verified recovery method; support; risk/rate limits | Recover account without exposing restricted data | /account/forgotten-credential-access-recovery | W1 |
| AUTH-013 | STATE | Unverified invitation | Employee/contractor, Client contact, Creator/talent, Learner, Partner | Invitation status; contact verification; manager/source owner | Request verification of a pending invitation | AUTH-001 | W1 |
| AUTH-014 | STATE | Invite expired, withdrawn or already used | Employee/contractor, Client contact, Creator/talent, Learner, Partner | Clear reason; safe request-new-invite; current route | Request a valid invitation from authorized sponsor | AUTH-001 | W1 |
| AUTH-015 | STATE | MFA unavailable, device lost | Employee/contractor, Client contact, Creator/talent, Learner, Partner | Recovery options; security escalation; no bypass | Start verified MFA recovery | AUTH-001 | W1 |
| AUTH-016 | STATE | Relationship expired / no role entitlement | Employee/contractor, Client contact, Creator/talent, Learner, Partner | Expired scope notice; who can renew; no private subject data | Request reauthorization or return to permitted space | AUTH-001 | W1 |
| AUTH-017 | STATE | Account locked or under security review | Employee/contractor, Client contact, Creator/talent, Learner, Partner | Safe lock notice; recovery guidance; human service desk | Open a security support case | AUTH-001 | W1 |
| AUTH-018 | STATE | Invitation accepted but approval pending | Employee/contractor, Client contact, Creator/talent, Learner, Partner | Pending source validation; next review; read-only limited access | Check status without accessing restricted work | AUTH-001 | W1 |
| AUTH-019 | DIALOG | Request temporary delegated access | Employee/contractor, Capability Lead, Legal counsel | Scope, purpose, owner/manager, duration, independence check | Request narrowly scoped access for a justified task | AUTH-007 | W4 |
| AUTH-020 | STATE | Cross-relationship identity merge denied | Employee/contractor, Client contact, Creator/talent, Learner | Distinct relationship records; explanation; lawful verification route | Continue under a single allowed identity context | AUTH-001 | W1 |
| AUTH-021 | WIZARD | MFA enrolment and recovery setup | Employee/contractor, Client contact, Creator/talent, Partner | Verified session; authenticator enrollment; recovery choices; one-time confirmation | Enrol a secure authentication method and test recovery | /account/mfa-enrolment-and-recovery-setup | W1 |
| AUTH-022 | DIALOG | Sensitive-action step-up authentication | Employee/contractor, Finance/controller, Legal counsel, People & Culture, Security/IT administrator, Platform tenant administrator | Action context; session risk; MFA challenge; timeout; cancellation | Reconfirm identity for a specific consequential operation | AUTH-001 | W4 |
| AUTH-023 | DASHBOARD | Professional organisation membership administration | Client contact, Partner, Platform tenant administrator | Verified organisation; member list; scoped roles; pending invitations; audit | Manage membership within an authorised professional tenant | /account/professional-organisation-membership-administration | W3 |
| AUTH-024 | DIALOG | Revoke professional tenant invitation or access | Client contact, Partner, Security/IT administrator | Invitation/user scope; reason; confirmation; affected active sessions | Revoke an inappropriate or expired organisation membership | AUTH-001 | W4 |
| AUTH-025 | PAGE | Account and identity access appeal | Employee/contractor, Client contact, Creator/talent, Partner, Learner | Denial case reference; legitimate identity proof; purpose; appeal track | Challenge an incorrect account or relationship denial | /account/account-and-identity-access-appeal | W1 |




### J07 · Client onboarding, commissioning, delivery and acceptance

Move a qualified client brief to signed scope, accepted delivery, invoices and verifiable next work.

| Screen ID | UI surface | Screen / view / state | User role(s) | Core UI components | Primary user action | Route or host | Release gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CLT-001 | DASHBOARD | Client workspace dashboard | Client contact | Active briefs; contracts; delivery milestones; outstanding approvals; support contact | Review current engagements and next actions | /workspace/clients/client-workspace-dashboard | W3 |
| CLT-002 | PAGE | Client organisation profile | Client contact | Legal identity; authorised users; contacts; invoice recipient; privacy controls | Review organisation details within permitted scope | /workspace/clients/client-organisation-profile | W3 |
| CLT-003 | PAGE | My enquiries and briefs | Client contact | Brief list; status; dates; owners; filters; linked documents | Track submitted opportunities | /workspace/clients/my-enquiries-and-briefs | W3 |
| CLT-004 | PAGE | Brief detail and clarification | Client contact, Commercial/BD | Requirements; assumptions; Q&A thread; source attachments; response due dates | Respond to missing questions and approve scope clarification | /workspace/clients/brief-detail-and-clarification | W3 |
| CLT-005 | DIALOG | Request brief modification | Client contact | Changed requirement; impact flag; justification; revised timing | Submit a change request for pricing/delivery review | CLT-004 | W3 |
| CLT-006 | PAGE | Proposal and quotation detail | Client contact | Versioned scope; exclusions; estimated costs; approval status; legal terms | Review a commercial proposal | /workspace/clients/proposal-and-quotation-detail | W3 |
| CLT-007 | DIALOG | Approve or decline a proposal | Client contact | Signed authority reminder; amount/version; confirmation; reasons | Accept, reject or request negotiation under actual contract process | CLT-006 | W4 |
| CLT-008 | PAGE | Contract and order register | Client contact | Executed instruments only; parties; scope; validity; downloadable permitted documents | Open the current agreed contract | /workspace/clients/contract-and-order-register | W3 |
| CLT-009 | DIALOG | Contract approval and signature handoff | Client contact | Document version; approved signing service route; signature roles; conditions | Sign through an actual authorised execution channel | CLT-008 | W4 |
| CLT-010 | PAGE | Deliverable tracker | Client contact | Milestones; preview links; due dates; review window; versioned acceptance | Track commissioned deliverables | /workspace/clients/deliverable-tracker | W3 |
| CLT-011 | PAGE | Deliverable review detail | Client contact | Rights-approved preview; annotation; specs; revision history; acceptance checklist | Review a specific submitted version | /workspace/clients/deliverable-review-detail | W3 |
| CLT-012 | DIALOG | Request a deliverable revision | Client contact | Annotated feedback; contract allowance; impact note; submit | Request bounded revisions | CLT-011 | W3 |
| CLT-013 | DIALOG | Accept delivered work | Client contact | Version/checksum; agreed criteria; acceptance/exception; signer | Confirm deliverable acceptance | CLT-011 | W4 |
| CLT-014 | STATE | Deliverable cannot be previewed or is rights-held | Client contact | Rights-safe restricted state; remedy owner; support route | Request alternate review method | CLT-001 | W3 |
| CLT-015 | PAGE | Invoices and payment status | Client contact | Invoice records; due/paid/disputed distinctions; payment reference; source freshness | View legitimate billing obligations | /workspace/clients/invoices-and-payment-status | W3 |
| CLT-016 | PAGE | Invoice detail and supporting proof | Client contact | Contract link; line items; accepted deliverables; tax; dispute action | Review or query an invoice | /workspace/clients/invoice-detail-and-supporting-proof | W3 |
| CLT-017 | DIALOG | Raise invoice or fulfilment dispute | Client contact | Invoice/deliverable refs; reason; evidence; response expectation | Open a finance/service dispute | CLT-016 | W3 |
| CLT-018 | PAGE | Client messages and notifications | Client contact | Conversation threads; official notices; delivery reminders; contact permissions | Communicate with assigned account manager | /workspace/clients/client-messages-and-notifications | W3 |
| CLT-019 | PAGE | Project completion and closeout | Client contact | Accepted output; rights/use summary; outstanding obligations; final report | Acknowledge project closeout where obligations are settled | /workspace/clients/project-completion-and-closeout | W3 |
| CLT-020 | DIALOG | Client feedback and renewal request | Client contact | Service feedback; next brief; preferred contact consent | Submit feedback or request continued service | CLT-019 | W3 |
| CLT-021 | STATE | Client contract expired/withdrawn | Client contact | Status; accessible historical materials; renewal owner; no new actions | Contact account team or request a new contract | CLT-001 | W3 |
| CLT-022 | STATE | Payment not yet confirmed | Client contact | Invoice vs provider/bank confirmation; pending status; support | Check verified status rather than assume payment | CLT-001 | W3 |
| CLT-023 | PAGE | Client shared files and permission review | Client contact, Commercial/BD, Producer/ONE Studios | Project asset inventory; external share permissions; rights/use warnings; expiry | Inspect files that the client is specifically entitled to receive | /workspace/clients/client-shared-files-and-permission-review | W3 |
| CLT-024 | PAGE | Client workspace member and approver register | Client contact, Commercial/BD | Verified client organisation; invited staff; approver authority; acceptance history | Review who can request, approve and accept client deliverables | /workspace/clients/client-workspace-member-and-approver-register | W3 |




### J08 · Sponsors, institutional partners, training providers and organisations

Onboard external organisations under verified legal identity, sponsorship conditions, IP and access boundaries.

| Screen ID | UI surface | Screen / view / state | User role(s) | Core UI components | Primary user action | Route or host | Release gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PART-001 | DASHBOARD | Partner organisation workspace | Partner, Sponsor, Training partner | Own projects; signed relationship; applications; reports; outstanding obligations | Review approved partner engagements | /workspace/partners/partner-organisation-workspace | W3 |
| PART-002 | WIZARD | Partner expression of interest | Partner | Organisation details; programme/service interest; prior work; capability; documents | Apply for a partnership conversation | /workspace/partners/partner-expression-of-interest | W3 |
| PART-003 | WIZARD | Programme delivery partner application | Training partner | Accreditation profile; faculty; IP; insurance; finance; safety; proposed cohort | Submit a verifiable training partner application | /workspace/partners/programme-delivery-partner-application | W3 |
| PART-004 | PAGE | Partner diligence checklist | Partner, Training partner | Required corporate/KYC docs; conflicts; data/rights terms; completion status | Complete assigned due diligence | /workspace/partners/partner-diligence-checklist | W3 |
| PART-005 | DIALOG | Provide missing partner evidence | Partner, Training partner | Evidence request; secure upload; due date; acceptance note | Respond to diligence questions | PART-004 | W3 |
| PART-006 | PAGE | Partner contracts and terms | Partner, Sponsor, Training partner | Executed agreements; allowed commitments; effective date; notices; party-specific rights | Review current contract and open obligations | /workspace/partners/partner-contracts-and-terms | W3 |
| PART-007 | PAGE | Sponsorship opportunity overview | Sponsor | Approved programmes or media packages; restrictions; scope; non-guarantee notice | Explore lawful sponsorship opportunities | /workspace/partners/sponsorship-opportunity-overview | W3 |
| PART-008 | WIZARD | Sponsor brief / proposal submission | Sponsor | Brand/SKU; objective; budget; dates; category conflict; claim proof | Submit a sponsorship proposal for review | /workspace/partners/sponsor-brief-proposal-submission | W3 |
| PART-009 | PAGE | Sponsor order and deliverables | Sponsor | Current signed package; accepted milestones; creator permissions; inventory claims | Track contractual sponsor deliverables | /workspace/partners/sponsor-order-and-deliverables | W3 |
| PART-010 | TAB | Sponsor media proof and report | Sponsor | Booked vs aired/accepted evidence; publication links; make-good; measurement limits | Review verifiable fulfilment | PART-001 | W3 |
| PART-011 | STATE | Conditional sponsor contribution not yet earned | Sponsor | Matching condition; awaiting qualification; no billed/payment assumption | Review actual conditions and next steps | PART-001 | W3 |
| PART-012 | PAGE | Institutional funding opportunities | Partner | Programme concept; funding restrictions; eligibility; truthful proposed status | Review an institutional proposal or invitation | /workspace/partners/institutional-funding-opportunities | W3 |
| PART-013 | WIZARD | Grant or institutional proposal draft | Partner, Talent Accelerator operator | Scope; deliverables; public/private cofunding; budgets; restrictions; reporting plan | Submit structured funding/application material | /workspace/partners/grant-or-institutional-proposal-draft | W3 |
| PART-014 | PAGE | Institutional milestone and evidence tracker | Partner, Talent Accelerator operator | Actual agreement; eligible cost evidence; outcome reports; reporting periods | Track permitted funding obligations | /workspace/partners/institutional-milestone-and-evidence-tracker | W3 |
| PART-015 | STATE | Partner logo/endorsement approval pending | Partner, Marketing/PR | Use-specific request; approved logo; dated consent; safe placeholder | Authorize or decline public partner attribution | PART-001 | W3 |
| PART-016 | DIALOG | Partner rights/data sharing consent | Partner, Training partner | Actual scope; categories; processor/controller roles; restrictions; approval | Accept or refuse specific lawful data exchange | PART-006 | W4 |
| PART-017 | PAGE | Partner issue and change requests | Partner, Sponsor, Training partner | Active issue; contract/change ID; evidence; designated reviewer | Raise a partner delivery or compliance issue | /workspace/partners/partner-issue-and-change-requests | W3 |
| PART-018 | DIALOG | Partner invoice or settlement query | Partner, Sponsor | Amount/contract; payable status; payment evidence; dispute route | Query legitimate payable/receivable status | PART-001 | W3 |
| PART-019 | PAGE | Training partner cohort operations | Training partner | Assigned teaching plan; faculty; resources; attendance to evidence; protected boundary | Update allocated training delivery evidence | /workspace/partners/training-partner-cohort-operations | W3 |
| PART-020 | DIALOG | Partner faculty replacement approval | Training partner, Talent Accelerator operator, AFCA academic authority | Proposed trainer; competency; availability; quality and contract checks | Request authorised faculty substitution | PART-019 | W4 |
| PART-021 | STATE | Partner contract or access suspended | Partner, Training partner | Suspension notice without private data; owner; appeal/cure steps | Request case review without continuing restricted access | PART-001 | W3 |
| PART-022 | PAGE | Sponsorship claims evidence and approval tracker | Sponsor, Partner, Marketing/PR, Legal counsel | Sponsor claim; signed usage/logo permission; deliverables; draft/publication status | Approve only substantiated sponsorship and endorsement claims | /workspace/partners/sponsorship-claims-evidence-and-approval-tracker | W3 |
| PART-023 | PAGE | Institutional award restrictions and evidence detail | Partner, Finance/controller, Legal counsel | Actual award vs application; restricted-fund rules; milestones; proof dates | Review the legal and financial limits on institutional funds | /workspace/partners/institutional-award-restrictions-and-evidence-detail | W3 |




### J09 · Accelerator applications, AFCA learning and CLAP progression

Separate admissions, teaching, assessments, moderation, appeals, verification and downstream professional work.

| Screen ID | UI surface | Screen / view / state | User role(s) | Core UI components | Primary user action | Route or host | Release gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| LEARN-001 | PAGE | Programme discovery for applicants | Applicant | Eligibility filters; current cohort status; accessibility; provider and learning outcomes | Choose an available programme | /workspace/academy/programme-discovery-for-applicants | W0 |
| LEARN-002 | PAGE | Programme application overview | Applicant | Entry requirements; timeline; portfolio evidence; fees if verified; notices | Understand application conditions | /workspace/academy/programme-application-overview | W3 |
| LEARN-003 | WIZARD | Programme application wizard | Applicant | Identity/contact; experience; skills; portfolio; support; privacy; declaration | Submit an eligibility application | /workspace/academy/programme-application-wizard | W3 |
| LEARN-004 | DIALOG | Applicant accommodation and access request | Applicant, Learner | Private adjustment needs; contact; approval and support boundaries | Request appropriate participation support | LEARN-003 | W3 |
| LEARN-005 | PAGE | Submitted application tracker | Applicant | Application status; evidence completeness; dates; review rights; messages | Follow application progress | /workspace/academy/submitted-application-tracker | W3 |
| LEARN-006 | DIALOG | Application correction / missing evidence | Applicant | Requested material; valid upload; deadline; resubmit | Correct an application before applicable cutoff | LEARN-005 | W3 |
| LEARN-007 | STATE | Application window closed / ineligible | Applicant | Clear eligibility/date reason; review or alternate programme action | Seek a lawful review or alternative | LEARN-010 | W3 |
| LEARN-008 | PAGE | Admission decision detail | Applicant | Private decision; reasons/scope; offer status; acknowledgement; review route | Accept or challenge the admission decision | /workspace/academy/admission-decision-detail | W3 |
| LEARN-009 | DIALOG | Conditional admission acceptance | Applicant | Terms; support needs; consent and optional filming separate; place/expiry | Accept a lawful programme place | LEARN-008 | W3 |
| LEARN-010 | DASHBOARD | Learner dashboard | Learner | Learning calendar; tasks; progress; support; protected assessment status | Continue assigned learning | /workspace/academy/learner-dashboard | W3 |
| LEARN-011 | PAGE | Cohort calendar and timetable | Learner, Training partner | Session/day schedule; room/tool; instructors; mandatory/rest separation | Find next legitimate learning session | /workspace/academy/cohort-calendar-and-timetable | W3 |
| LEARN-012 | PAGE | Learning module / session detail | Learner | Module outcomes; faculty; resources; accessible materials; attendance rule | Prepare for a guided session | /workspace/academy/learning-module-session-detail | W3 |
| LEARN-013 | PAGE | Assignments and portfolio tasks | Learner | Brief; rubric; source/rights requirements; due date; version history | Start or submit learning work | /workspace/academy/assignments-and-portfolio-tasks | W3 |
| LEARN-014 | WIZARD | Portfolio evidence submission | Learner | Work upload; attribution; editable/source proof; rights and AI disclosure | Submit attributable assessment evidence | /workspace/academy/portfolio-evidence-submission | W3 |
| LEARN-015 | DIALOG | Assessment declaration / role attribution | Learner | Declared contribution; team split; tool provenance; consent; attest | Confirm what the learner personally produced | LEARN-014 | W3 |
| LEARN-016 | PAGE | Feedback and correction detail | Learner | Assessor notes; permitted repair; examples; dates; private status | Review feedback and make permitted corrections | /workspace/academy/feedback-and-correction-detail | W3 |
| LEARN-017 | PAGE | Private provisional assessment result | Learner | Rubric results; gates; uncertainty; moderation status; appeal instructions | Review provisional outcome privately | /workspace/academy/private-provisional-assessment-result | W3 |
| LEARN-018 | DIALOG | Submit academic appeal | Learner | Specific contested item; documentary evidence; grounds; deadline | Request independent review | LEARN-017 | W3 |
| LEARN-019 | DASHBOARD | AFCA assessment and moderation desk | AFCA academic authority | Assessor allocation; conflicts; rubric; case statuses; independent checks | Moderate eligible assessments without sponsor control | /workspace/academy/afca-assessment-and-moderation-desk | W4 |
| LEARN-020 | DIALOG | Assessor conflict of interest disclosure | AFCA academic authority | Relationship declaration; recusal; reassignment; audit | Disclose conflict and seek independent reassignment | LEARN-019 | W4 |
| LEARN-021 | PAGE | Final verified competence record | Learner, AFCA academic authority | Released scope; restrictions; issuer/verification date; appeal status | View or share an authorized credential scope | /workspace/academy/final-verified-competence-record | W3 |
| LEARN-022 | STATE | Assessment held pending appeal or identity proof | Learner | Private hold; precise next evidence/owner; no public final claim | Provide permitted evidence or await review | LEARN-010 | W3 |
| LEARN-023 | PAGE | Learning support and wellbeing contact | Learner | Confidential intake; safeguarding route; emergency support; privacy restriction | Request learning support without publicity | /workspace/academy/learning-support-and-wellbeing-contact | W3 |
| LEARN-024 | PAGE | Programme completion and progression | Learner, Alumni | Actual completed/verified status; development recommendation; opt-in referrals | Review next professional pathway | /workspace/academy/programme-completion-and-progression | W3 |
| LEARN-025 | PAGE | Participant outcome and alumni survey | Learner, Alumni | Consent; work outcomes; time window; evidence and privacy conditions | Submit a voluntary verified follow-up outcome | /workspace/academy/participant-outcome-and-alumni-survey | W3 |
| LEARN-026 | DASHBOARD | Programme operator cohort view | Talent Accelerator operator, AFCA academic authority | Admitted/started/completed/verified counts; source date; holds; funding and safety | Review all-cohort status and corrective actions | /workspace/academy/programme-operator-cohort-view | W3 |
| LEARN-027 | WIZARD | New programme charter and resource gate | Talent Accelerator operator, AFCA academic authority, Finance/controller | Partner delivery scope; budget; 207-row schedule if CLAP; faculty; safety; sign-offs | Request actual funded programme release | /workspace/academy/new-programme-charter-and-resource-gate | W4 |
| LEARN-028 | STATE | Programme interrupted, faculty absent or unfunded | Learner, Talent Accelerator operator | Continuity notice; responsible programme owner; remedial schedule; rights and earned obligations | Follow approved continuity or rescheduling route | LEARN-010 | W3 |
| LEARN-029 | PAGE | Independent academic appeal decision workspace | AFCA academic authority, Independent auditor/QA | Assessment sources; reviewer conflict; moderation; applicant evidence; written outcome | Determine an appeal under independent AFCA academic authority | /workspace/academy/independent-academic-appeal-decision-workspace | W4 |
| LEARN-030 | PAGE | Private learner record export and correction request | Learner, AFCA academic authority | Identity verification; accredited-scope evidence; access rights; correction trail | Request a permitted copy or correction of personal academic records | /workspace/academy/private-learner-record-export-and-correction-request | W3 |




### J10 · Creator onboarding, professional marketplace and paid work

Support evidence-backed profile verification, qualified work, consent, acceptance, settlement and disputes.

| Screen ID | UI surface | Screen / view / state | User role(s) | Core UI components | Primary user action | Route or host | Release gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TAL-001 | PAGE | Creator and talent join landing | Creator/talent | Marketplace terms; qualifications; privacy; separate programme/commerce limits | Begin an eligible talent profile | /workspace/talent/creator-and-talent-join-landing | W3 |
| TAL-002 | WIZARD | Talent profile onboarding | Creator/talent | Name/public identity; skills; portfolio; work eligibility; availability; consent | Submit a verified candidate profile | /workspace/talent/talent-profile-onboarding | W3 |
| TAL-003 | PAGE | Talent public portfolio preview | Creator/talent | Consent-based portfolio; credits; role scope; source media rights; visibility settings | Preview own publishable profile | /workspace/talent/talent-public-portfolio-preview | W3 |
| TAL-004 | WIZARD | Portfolio asset verification | Creator/talent, VTM Marketplace operator | Attribution evidence; project/version; licensed preview; permission to publish | Submit a rights-clear professional sample | /workspace/talent/portfolio-asset-verification | W3 |
| TAL-005 | DASHBOARD | Talent personal dashboard | Creator/talent | Own opportunities; saved briefs; bookings; reviews; contract/payment states | Manage professional progression | /workspace/talent/talent-personal-dashboard | W3 |
| TAL-006 | PAGE | My verified skills and restrictions | Creator/talent | AFCA evidence if authorized; certifications; permitted scope; expiry and correction | View and update permitted capability assertions | /workspace/talent/my-verified-skills-and-restrictions | W3 |
| TAL-007 | PAGE | Opportunity discovery | Creator/talent | Qualified paid opportunities; pay; role; location; timing; safety; eligibility | Search opportunities relevant to verified scope | /workspace/talent/opportunity-discovery | W3 |
| TAL-008 | PAGE | Opportunity detail | Creator/talent | Real buyer/scope; compensation; rights; restrictions; booking terms; apply | Assess and request a work opportunity | /workspace/talent/opportunity-detail | W3 |
| TAL-009 | DIALOG | Express interest / apply for opportunity | Creator/talent | Availability; portfolio selection; short proposal; consent; fee clarity | Submit voluntary interest | TAL-008 | W3 |
| TAL-010 | STATE | Opportunity not funded or unqualified | Creator/talent | Clear non-bookable status; missing buyer/funding; contact | Avoid unsafe/unfunded work and seek alternatives | TAL-005 | W3 |
| TAL-011 | DASHBOARD | Talent shortlisting and matching desk | VTM Marketplace operator | Skill evidence; conflicts; availability; human rationale; applicant choices | Create a fair shortlist for a real buyer brief | /workspace/talent/talent-shortlisting-and-matching-desk | W4 |
| TAL-012 | DIALOG | Match rationale and conflict review | VTM Marketplace operator | Relevant criteria; sponsor/conflict flags; participant choices; reviewer | Accept or reject a proposed match transparently | TAL-011 | W4 |
| TAL-013 | PAGE | My booking and agreements | Creator/talent | Contract parties; scope; due work; rate; conditions; status | Review confirmed paid engagements | /workspace/talent/my-booking-and-agreements | W3 |
| TAL-014 | DIALOG | Accept professional booking | Creator/talent | Actual scope and terms; pay protection; use rights; sign/decline | Accept or refuse a separately contracted job | TAL-013 | W4 |
| TAL-015 | WIZARD | Work deliverable and evidence submission | Creator/talent | Brief; files; rights/source; due date; professional acceptance checklist | Submit contracted output | /workspace/talent/work-deliverable-and-evidence-submission | W3 |
| TAL-016 | PAGE | Creator deliverable acceptance status | Creator/talent | Version; receiving client/producer; repair; due/accepted outcome | Track whether work is accepted | /workspace/talent/creator-deliverable-acceptance-status | W3 |
| TAL-017 | DIALOG | Request scope or licence variation | Creator/talent, Client contact | Original contract; changed use; new fee/term; independent approvals | Propose a paid, consented scope change | TAL-013 | W4 |
| TAL-018 | DASHBOARD | Talent earnings and payable overview | Creator/talent | Earned vs due vs paid balances; proof dates; permitted statements | Review legitimate work compensation | /workspace/talent/talent-earnings-and-payable-overview | W3 |
| TAL-019 | PAGE | Settlement statement detail | Creator/talent | Fee and deductions; actual payment proof; payee account status; dispute | Review and reconcile a specific payout | /workspace/talent/settlement-statement-detail | W3 |
| TAL-020 | STATE | Payment due, bank unverified or disputed | Creator/talent | Distinct statuses; designated Finance team; evidence and appeal path | Request settlement review without assuming cash | TAL-005 | W3 |
| TAL-021 | PAGE | Professional ratings and feedback | Creator/talent, VTM Marketplace operator | Client feedback; evidence; appeal review; anti-blacklisting safeguards | Review or challenge professional evaluation | /workspace/talent/professional-ratings-and-feedback | W3 |
| TAL-022 | DIALOG | Dispute or challenge a rating | Creator/talent | Statement; contract/evidence; remedy request; confidentiality | Submit an independent dispute request | TAL-021 | W3 |
| TAL-023 | PAGE | Creator agreements and permitted uses | Creator/talent | Commissioned work; background IP; likeness/voice; permitted promo windows | Review and manage use permissions | /workspace/talent/creator-agreements-and-permitted-uses | W3 |
| TAL-024 | DIALOG | Withdraw profile or change visibility | Creator/talent | Withdrawal effect; contracted obligations; privacy; confirmation | Restrict profile publication lawfully | TAL-005 | W3 |
| TAL-025 | DASHBOARD | VTM marketplace operations | VTM Marketplace operator | Qualified briefs; matches; bookings; due/paid; disputes; source freshness | Control fair marketplace throughput | /workspace/talent/vtm-marketplace-operations | W3 |
| TAL-026 | PAGE | VTM buyer request intake | Client contact, VTM Marketplace operator | Role needed; paid scope; competence; funding/credit; rights and safety | Qualify a legitimate talent booking request | /workspace/talent/vtm-buyer-request-intake | W3 |
| TAL-027 | STATE | Talent profile under verification | Creator/talent | Missing competency/identity evidence; no public verified badge; responsible office | Provide additional acceptable evidence | TAL-005 | W3 |
| TAL-028 | WIZARD | Creator beneficiary and bank-change verification | Creator/talent, Finance/controller, VTM Marketplace operator | Current settlement identity; proposed payee change; independent callback; status | Submit a protected payee update for human Finance verification | /workspace/talent/creator-beneficiary-and-bank-change-verification | W4 |
| TAL-029 | PAGE | Creator voice, face and digital-likeness permissions | Creator/talent, Rights/IP officer, Legal counsel | Specific asset; voice/face/synthetic use; platform/territory/window; rights revocation | Review and grant or refuse a distinctly scoped likeness use | /workspace/talent/creator-voice-face-and-digital-likeness-permissions | W3 |
| TAL-030 | DIALOG | Dispute earned creator payment or deduction | Creator/talent, Finance/controller, VTM Marketplace operator | Work acceptance; contractual terms; statement; bank proof; evidence upload | Challenge an unpaid or incorrectly reduced creator settlement | TAL-005 | W3 |




### J11 · Candy Cast, Candy Plus and restricted-consent boundaries

Protect adult casting participation, independent decisions and separate subscription/product controls.

| Screen ID | UI surface | Screen / view / state | User role(s) | Core UI components | Primary user action | Route or host | Release gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CAND-001 | PAGE | Candy Cast public information | Public visitor, Candy Cast applicant | Purpose and criteria; current 18+ policy; no guarantee; privacy and complaint route | Review a legitimate casting brief | /candy/candy-cast-public-information | W0 |
| CAND-002 | WIZARD | Candy Cast private application | Candy Cast applicant | Age eligibility; identity; permitted portfolio; separate audition consent; privacy | Submit an eligible application for human review | /candy/candy-cast-private-application | W3 |
| CAND-003 | PAGE | Candy Cast applicant dashboard | Candy Cast applicant | Own status; submitted material; communications; consent history; decisions | Track own casting submission privately | /candy/candy-cast-applicant-dashboard | W3 |
| CAND-004 | DIALOG | Age/identity eligibility check | Candy Cast applicant | Approved proof method; minimized data; eligibility result; support | Verify eligibility without oversharing | CAND-002 | W3 |
| CAND-005 | DIALOG | Casting consent purpose selector | Candy Cast applicant | Assessment vs publicity vs work; granular consent; revoke choice | Grant or refuse separate permissions | CAND-002 | W3 |
| CAND-006 | WIZARD | Casting audition media submission | Candy Cast applicant | Prohibited media guidance; approved formats; upload; delete/retain rules | Submit a legitimate audition portfolio | /candy/casting-audition-media-submission | W3 |
| CAND-007 | DASHBOARD | Candy Cast selection panel | Brand Steward | Eligibility-cleared candidates; published criteria; conflict review; human decision | Assess applicants against a defined brief | /candy/candy-cast-selection-panel | W4 |
| CAND-008 | DIALOG | Casting panel conflict disclosure | Brand Steward | Reviewer relationships; recusal; independent assignment | Declare a material selection conflict | CAND-007 | W4 |
| CAND-009 | PAGE | Casting decision and review | Candy Cast applicant | Private outcome; exact next work terms if any; correction/appeal contact | Accept result or request independent review | /candy/casting-decision-and-review | W3 |
| CAND-010 | DIALOG | Withdraw a casting submission | Candy Cast applicant | Data impact; active contract exception; deletion/retention notice | Withdraw participation where permitted | CAND-003 | W3 |
| CAND-011 | STATE | Under-18/ineligible casting attempt | Candy Cast applicant | Respectful ineligibility; no intake storage beyond lawful minimum; safe support | Exit restricted application without creating a live profile | CAND-001 | W3 |
| CAND-012 | STATE | Casting application content rejected | Candy Cast applicant | Reason class; allowed correction; safety/rights guidance | Replace prohibited content or contact reviewer | CAND-001 | W3 |
| CAND-013 | STATE | Casting consent refused for publicity | Candy Cast applicant | No retaliation notice; separate work options; private status | Continue permitted assessment without publicity permission | CAND-001 | W3 |
| CAND-014 | PAGE | Candy Plus informational proposition | Public visitor | Brand-defined positioning; accurate unlaunched/product status; safe general-audience copy | Read information or contact authorised team | /candy/candy-plus-informational-proposition | W0 |
| CAND-015 | DASHBOARD | Candy Plus restricted product release board | Brand Steward, Legal counsel, Privacy officer | Catalogue rights; age/classification; actual provider; price/cancellation; product approvals | Evaluate whether a specific subscription service can be released | /candy/candy-plus-restricted-product-release-board | G |
| CAND-016 | WIZARD | Candy Plus subscriber host/federation request | Brand Steward, Privacy officer | Proposed product host; purpose; vendor terms; entitlement and territory gates | Request separate product and privacy approval | /candy/candy-plus-subscriber-host-federation-request | G |
| CAND-017 | STATE | Candy Plus unapproved catalogue/host | Public visitor | No price/checkout; informational fallback; no restricted previews | Return to safe public information | CAND-001 | W0 |
| CAND-018 | STATE | Candy Plus direct-data-transfer blocked | Candy Cast applicant, Brand Steward | Consent/purpose mismatch; independent owner; safe remediation | Seek lawful separate authorisation without transferring records | CAND-001 | G |
| CAND-019 | PAGE | Candy Plus title-level classification and approval detail | Brand Steward, Legal counsel, Privacy officer, VMN World Product/QA | Specific cut; title rights; classification; host/provider; age and payment gates | Inspect whether one specific catalogue item is legally releasable | /candy/candy-plus-title-level-classification-and-approval-detail | W4 |
| CAND-020 | PAGE | Casting data withdrawal and retention decision | Candy Cast applicant, Privacy officer, Legal counsel | Applicant consent history; separate uses; retention basis; permitted erasure/correction | Request a lawful withdrawal or correction of casting material | /candy/casting-data-withdrawal-and-retention-decision | W3 |




### J12 · ONE CIRCLE home, knowledge, SOP discovery and Ask VMN

Give each authorised worker one reliable entry to current procedures, missions and owner-backed knowledge without universal private access.

| Screen ID | UI surface | Screen / view / state | User role(s) | Core UI components | Primary user action | Route or host | Release gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CIRC-001 | DASHBOARD | Personal ONE CIRCLE home | Employee/contractor | My missions; current tasks; approvals; notifications; safe search; capability context | Choose the next accepted work action | /circle | W1 |
| CIRC-002 | DASHBOARD | Builder work overview | Builder | Deliverables; asset/version deadlines; accepted work; reviewer requests | Continue a current production/build assignment | /circle/builder-work-overview | W2 |
| CIRC-003 | DASHBOARD | Problem Solver work overview | Problem Solver | Issues; decisions; root-cause tasks; risk and evidence | Diagnose or resolve an assigned problem | /circle/problem-solver-work-overview | W2 |
| CIRC-004 | DASHBOARD | Coach work overview | Coach/mentor | Coaching requests; learner progress allowed; reviews; capability development | Schedule and record appropriate coaching | /circle/coach-work-overview | W2 |
| CIRC-005 | PAGE | Ask VMN knowledge interface | Employee/contractor, Builder, Problem Solver, Coach/mentor | Permissioned question input; cited sources; effective status; refusal and direct route | Ask a source-backed operating question | /circle/ask | W1 |
| CIRC-006 | TAB | Ask VMN cited answer detail | Employee/contractor | Source snippets; revisions; confidence/absence; domain owner; permitted next step | Verify the basis of an answer | CIRC-001 | W1 |
| CIRC-007 | DIALOG | Report incorrect or conflicting AI answer | Employee/contractor | Source/answer refs; issue category; risk; human follow-up | Flag misleading guidance for owner review | CIRC-005 | W1 |
| CIRC-008 | PAGE | Company knowledge and policy library | Employee/contractor | Categories; controlled document versions; owner/status; search/filter | Locate current approved reference information | /circle/knowledge | W1 |
| CIRC-009 | PAGE | SOP catalogue (161 identifiers) | Employee/contractor | Controlled IDs; function; scope; revision/effective date; search; status | Find the right SOP for a task | /circle/sops | W1 |
| CIRC-010 | PAGE | SOP detailed procedure | Employee/contractor | Prerequisites; steps; source REG-S; human authority; QA-SOP; exception | Read an executable procedure and permitted next action | /circle/sops/{sop-id} | W1 |
| CIRC-011 | TAB | SOP source/version history | Employee/contractor, Knowledge steward | Current/archived revisions; authorizer; supersession; change log | Inspect why a procedure changed | CIRC-001 | W1 |
| CIRC-012 | TAB | SOP activation evidence view | Knowledge steward, Independent auditor/QA | Positive/negative QA-SOP state; verifier; environment; release decision | Determine whether procedure was actually approved for use | CIRC-001 | W1 |
| CIRC-013 | DIALOG | Start a procedure from SOP | Employee/contractor | Eligibility; mission/reference; source availability; actual signatory; start/cancel | Start only an authorised work process | CIRC-010 | W2 |
| CIRC-014 | STATE | SOP not adopted / test not run | Employee/contractor | No execute action; status; manual approved source; process owner | Use safe authorised alternative or request verification | CIRC-001 | W1 |
| CIRC-015 | STATE | SOP withdrawn or superseded | Employee/contractor | Archived label; replacement link; effective date; human contact | Open current replacement rather than outdated workflow | CIRC-001 | W1 |
| CIRC-016 | STATE | SOP ownership unclear | Employee/contractor | Source conflict notice; no executable route; knowledge steward | Request an accountable human source determination | CIRC-001 | W1 |
| CIRC-017 | PAGE | Company policy change request | Employee/contractor, Knowledge steward | Proposed correction; old/new; source; risk; affected roles and applications | Propose a controlled SOP/policy update | /circle/company-policy-change-request | W2 |
| CIRC-018 | DASHBOARD | Knowledge steward review queue | Knowledge steward | Unverified facts; expired sources; correction requests; approvals; propagation | Triage source and answer problems | /circle/knowledge-steward-review-queue | W2 |
| CIRC-019 | PAGE | Knowledge source conflict case | Knowledge steward, Legal counsel | Competing authorities; dates; applicability; affected work; decider | Route conflict for qualified human determination | /circle/knowledge-source-conflict-case | W2 |
| CIRC-020 | DIALOG | Approve source replacement | Knowledge steward, Legal counsel | Old/new version; signed authority; invalidation plan; impact assessment | Publish an accepted source change | CIRC-019 | W4 |
| CIRC-021 | DASHBOARD | Company capability directory | Employee/contractor | Departments/capabilities; role profiles; availability/permissions; verified owner | Find a qualified collaborator or unit | /circle/company-capability-directory | W1 |
| CIRC-022 | PAGE | Capability and role profile | Employee/contractor | Skills; approved scope; home manager; availability; portfolio references | Review a colleague's work-relevant capability | /circle/capability-and-role-profile | W1 |
| CIRC-023 | PAGE | Current company decisions and notices | Employee/contractor | Approved communications; effective scope/date; owner; acknowledgement | Review operationally relevant notices | /circle/current-company-decisions-and-notices | W1 |
| CIRC-024 | DIALOG | Acknowledge mandatory notice | Employee/contractor | Notice version; role applicability; acknowledgement; read proof | Confirm receipt without creating legal consent by implication | CIRC-023 | W1 |
| CIRC-025 | PAGE | My work notifications inbox | Employee/contractor | Approvals; due work; source invalidations; priority and privacy controls | Act on a legitimate notification | /circle/my-work-notifications-inbox | W1 |
| CIRC-026 | DIALOG | Notification preferences | Employee/contractor | Channels; delivery limits; non-optional safety notices; privacy | Set permitted alert preferences | CIRC-025 | W1 |
| CIRC-027 | PAGE | Support and process-help requests | Employee/contractor | Case type; affected SOP/mission/source; issue details; human responder | Request procedural assistance | /circle/support-and-process-help-requests | W1 |
| CIRC-028 | STATE | Source cannot be retrieved or is stale | Employee/contractor | Last observed date; no unsupported guidance; safe direct-system link | Use a verified alternative or ask source owner | CIRC-001 | W1 |
| CIRC-029 | STATE | Knowledge assistant unavailable | Employee/contractor | Incident status; manual search; SOP index; human contact | Continue critical work without AI | CIRC-001 | W1 |
| CIRC-030 | STATE | Prompt injection or unsafe instruction detected | Employee/contractor, Security/IT administrator | Safe refusal; no source/credential leak; incident reference; correct human route | Continue through approved procedure | CIRC-001 | W1 |
| CIRC-031 | STATE | No permission to view policy attachment | Employee/contractor | Restricted notice without metadata leak; approved access request | Request valid purpose-scoped access | CIRC-001 | W1 |
| CIRC-032 | PAGE | Knowledge answer correction case and outcome | Employee/contractor, Knowledge steward, Independent auditor/QA | Question and evidence; affected SOP/version; owner decision; resolution audit | Track independent correction of an unsafe or inaccurate AI answer | /circle/knowledge-answer-correction-case-and-outcome | W1 |




### J13 · Mission framing, staffing, execution, approvals and closure

Move an actual task from intake through signed gates, accepted deliverable, source reconciliation and reusable learning.

| Screen ID | UI surface | Screen / view / state | User role(s) | Core UI components | Primary user action | Route or host | Release gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MISS-001 | DASHBOARD | Mission portfolio board | Mission Owner, Hub resource coordinator | Kanban/list; owner; gate; deadline; blockers; source coverage; filter | Monitor real mission progress | /circle/missions | W2 |
| MISS-002 | PAGE | Mission template selector (16 playbooks) | Mission Owner | Playbook cards; applicability; SOP references; owner and authority prerequisites | Choose the correct operating scenario | /circle/playbooks | W2 |
| MISS-003 | WIZARD | Create mission wizard | Mission Owner | Business need; brand/client/property; accountable owner; outcome; budget/rights | Create a source-backed draft mission | /circle/missions/create-mission-wizard | W2 |
| MISS-004 | PAGE | Mission detailed workspace | Mission Owner, Builder, Problem Solver, Coach/mentor | Task list; timeline; source/contract; deliverables; approvals; accepted handoffs | Coordinate the active scoped mission | /circle/missions/{mission-id} | W2 |
| MISS-005 | TAB | Mission requirements and scope | Mission Owner | Objective; in/out scope; customer source; acceptance; risk; changes | Validate mission scope before staffing | MISS-004 | W2 |
| MISS-006 | DIALOG | Assign accountable Mission Owner | Mission Owner, Hub resource coordinator | Eligible person; home approval; assignment start/expiry; backup | Assign verified responsibility | MISS-003 | W2 |
| MISS-007 | DIALOG | Request staff or partner capacity | Mission Owner, Capability Lead | Skill; time window; workload; conflict; required supervisor and safety | Request accepted capacity allocation | MISS-004 | W2 |
| MISS-008 | PAGE | Mission contributor and responsibility map | Mission Owner, Capability Lead | Builder/Solver/Coach allocations; A/R/consult/check roles; source of authority | Verify role and capability coverage | /circle/missions/mission-contributor-and-responsibility-map | W2 |
| MISS-009 | DASHBOARD | Mission calendar and milestones | Mission Owner | Milestones; dependency chart; revised dates; source and owner | Update accepted work schedule | /circle/missions/mission-calendar-and-milestones | W2 |
| MISS-010 | PAGE | Task detail and assigned work | Builder, Problem Solver, Coach/mentor | Brief; inputs; due time; outputs; risk; source/recipient | Perform an assigned work package | /circle/missions/task-detail-and-assigned-work | W2 |
| MISS-011 | DIALOG | Task acceptance / decline | Builder, Problem Solver, Coach/mentor | Scope; capacity; home owner; conflicts; accept/decline reason | Accept or decline legitimate assigned work | MISS-010 | W2 |
| MISS-012 | PAGE | Mission evidence and attachments | Mission Owner, Builder | Asset versions; source checksums; signed references; classification | Attach or review controlled work evidence | /circle/missions/mission-evidence-and-attachments | W2 |
| MISS-013 | DIALOG | Submit work for review | Builder, Mission Owner | Actual deliverable/version; receiving owner; checklist; source acceptance | Submit work with a traceable handoff | MISS-010 | W2 |
| MISS-014 | PAGE | Handoff acceptance desk | Mission Owner, Capability Lead | Incoming deliverable; required formats; verified receiver; rework flags | Accept or return a work package | /circle/missions/handoff-acceptance-desk | W2 |
| MISS-015 | DIALOG | Request rework | Mission Owner, Capability Lead | Specific issue; defect evidence; due date; re-review route | Return work for bounded correction | MISS-014 | W2 |
| MISS-016 | DASHBOARD | Mission approvals and hard gates | Mission Owner | Finance; rights; safety; People; Product; authority validity; pending state | Request independent approvals | /circle/missions/mission-approvals-and-hard-gates | W2 |
| MISS-017 | DIALOG | Approval request form | Mission Owner | Decision subject; amount/use/term; source; actual signers; urgency | Submit a governed decision request | MISS-016 | W2 |
| MISS-018 | PAGE | Human approver decision detail | Finance/controller, Legal counsel, Rights/IP officer, People & Culture, VMN World Product/QA | Current DoA; scope; conflicts; evidence; competing decisions | Approve, reject or request further information | /circle/missions/human-approver-decision-detail | W4 |
| MISS-019 | DIALOG | Reject or escalate a decision | Finance/controller, Legal counsel, Rights/IP officer, People & Culture, VMN World Product/QA | Reason; protected gate; human escalation; audit note | Refuse an unsafe commitment | MISS-018 | W4 |
| MISS-020 | STATE | Approval expired or delegation revoked | Mission Owner | Outdated signature; changed source/version; no execute action | Seek current valid approval | MISS-004 | W2 |
| MISS-021 | STATE | Required rights, funds or safety gate blocked | Mission Owner | Precise missing control; source owner; appeal/remediation; unaffected tasks | Resolve required control before executing dependent task | MISS-004 | W2 |
| MISS-022 | PAGE | Mission issue and blocker detail | Mission Owner, Problem Solver | Impact; root cause; responsible owner; linked source; workaround | Diagnose and resolve a tracked blocker | /circle/missions/mission-issue-and-blocker-detail | W2 |
| MISS-023 | DIALOG | Create mission change request | Mission Owner | Original vs new scope; cost; rights; capacity; required authorizers | Submit a versioned change proposal | MISS-004 | W2 |
| MISS-024 | PAGE | Mission completion and acceptance | Mission Owner | Client/internal receiving sign-off; delivered outputs; unresolved finance/legal | Request accepted delivery closure | /circle/missions/mission-completion-and-acceptance | W2 |
| MISS-025 | PAGE | Mission financial/reconciliation references | Mission Owner, Finance/controller | Contract/invoice/payment IDs; valid statuses; protected source links | Check source-backed financial completion without making GL entries | /circle/missions/mission-financial-reconciliation-references | W2 |
| MISS-026 | DIALOG | Close or cancel a mission | Mission Owner | Final output; obligations; cancellation; affected people; retained evidence | Close only the completed scope or cancel lawfully | MISS-024 | W2 |
| MISS-027 | PAGE | Mission retrospective and lessons | Mission Owner, Coach/mentor | Actual quality; delays; causes; reusable patterns; owned SOP updates | Capture evidence-backed improvements | /circle/missions/mission-retrospective-and-lessons | W2 |
| MISS-028 | STATE | Mission owner lost or staff allocation rejected | Mission Owner, Hub resource coordinator | Owner gap; source history; capacity alternatives; restricted status | Reassign through People/capability authority | MISS-004 | W2 |
| MISS-029 | STATE | Mission external action unconfirmed | Mission Owner | Requested vs executed states; source outage; reconciliation and retry logic | Confirm result in source system before reporting success | MISS-004 | W2 |
| MISS-030 | DASHBOARD | External action reconciliation and unknown-outcome queue | Mission Owner, Finance/controller, Commercial/BD, VMN World Product/QA | Source event IDs; pending actions; idempotency; provider state; human resolver | Reconcile an action that has not been confirmed by its source system | /circle/missions/external-action-reconciliation-and-unknown-outcome-queue | W2 |
| MISS-031 | PAGE | Mission change-impact and reapproval assessment | Mission Owner, Finance/controller, Legal counsel, Capability Lead | Old/new scope; budget/time/rights/capacity effects; decision ownership | Obtain renewed human approvals for a material mission change | /circle/missions/mission-change-impact-and-reapproval-assessment | W4 |




### J14 · Capability leaders, resource management and coaching

Prevent double booking, protect employment responsibility, and track professional quality without converting Coach mode into HR authority.

| Screen ID | UI surface | Screen / view / state | User role(s) | Core UI components | Primary user action | Route or host | Release gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CAP-001 | DASHBOARD | Capability leader overview | Capability Lead | Assigned people; utilization; risk; key skills; outstanding mission requests | Manage supported professional capacity | /circle/capabilities/capability-leader-overview | W2 |
| CAP-002 | PAGE | Team skills and professional scopes | Capability Lead | Verified skills; credentials; restrictions; past accepted work; update request | Review team readiness for proposed jobs | /circle/capabilities/team-skills-and-professional-scopes | W2 |
| CAP-003 | PAGE | Resource availability calendar | Capability Lead, Hub resource coordinator | People time; rooms; devices; booked missions; rest/safety capacity | Inspect valid availability | /circle/capabilities/resource-availability-calendar | W2 |
| CAP-004 | DIALOG | Approve or refuse capacity allocation | Capability Lead | Person/team; dates; workload; conflict; employment/contract boundaries | Accept a feasible mission staffing request | CAP-001 | W2 |
| CAP-005 | STATE | Double-booked person or equipment | Capability Lead, Hub resource coordinator | Conflicting reservations; priority; named arbitration; alternatives | Resolve allocation without silent overbooking | CAP-001 | W2 |
| CAP-006 | DASHBOARD | Shared facilities and equipment board | Hub resource coordinator, Capability Lead | Asset custody; maintenance; bookings; power/network; backup | Control shared technical resources | /circle/capabilities/shared-facilities-and-equipment-board | W2 |
| CAP-007 | WIZARD | Facility or equipment request | Employee/contractor, Producer/ONE Studios, Hub resource coordinator | Inventory; date/time; role competence; safety; approvals | Request permitted resource access | /circle/capabilities/facility-or-equipment-request | W2 |
| CAP-008 | DIALOG | Check out / return a physical asset | Hub resource coordinator, Producer/ONE Studios | Serial; custodian; condition; expiry; custody acknowledgement | Record asset custody and return | CAP-001 | W2 |
| CAP-009 | PAGE | Professional supervision plan | Capability Lead, Coach/mentor | Required supervision; trainee scope; safe tasks; signoff/backup | Plan appropriate supervision | /circle/capabilities/professional-supervision-plan | W2 |
| CAP-010 | DASHBOARD | Coach assignment board | Coach/mentor | Coaching requests; development needs; sessions; consent; outcomes | Select a scoped coaching engagement | /circle/capabilities/coach-assignment-board | W2 |
| CAP-011 | PAGE | Coaching session detail | Coach/mentor, Employee/contractor | Learning goal; session notes; agreed actions; confidentiality and share limits | Deliver and document appropriate coaching | /circle/capabilities/coaching-session-detail | W2 |
| CAP-012 | DIALOG | Record coaching feedback | Coach/mentor | Observed skill evidence; growth goal; participant acknowledgement; protected fields | Submit constructive professional feedback | CAP-001 | W2 |
| CAP-013 | PAGE | Capability review and assessment request | Employee/contractor, Capability Lead | Work evidence; valid criteria; observer; fair review request | Request a documented competence review | /circle/capabilities/capability-review-and-assessment-request | W2 |
| CAP-014 | STATE | Capability evidence expired or insufficient | Capability Lead, Mission Owner | Missing credential; restricted task; learning/deployment alternatives | Arrange verification or supervision before assignment | CAP-001 | W2 |
| CAP-015 | PAGE | Capacity conflict escalation | Capability Lead, Hub resource coordinator | Competing missions; service risk; due dates; People input; decision log | Seek authorized arbitration | /circle/capabilities/capacity-conflict-escalation | W2 |
| CAP-016 | PAGE | Training and development plan | Employee/contractor, Coach/mentor, Capability Lead | Approved skills gap; learning routes; budgets; next review | Commit to a realistic development pathway | /circle/capabilities/training-and-development-plan | W2 |
| CAP-017 | STATE | No authorised capacity manager available | Capability Lead, Hub resource coordinator | Backup contact; affected mission HOLD; continuity instruction | Escalate to approved deputy without invented authority | CAP-001 | W2 |
| CAP-018 | PAGE | Workload safety and capacity-overrun case | Capability Lead, People & Culture, Hub resource coordinator | Actual availability; workload collision; protected absence; safe adjustment | Escalate an unsafe allocation to People and capability owners | /circle/capabilities/workload-safety-and-capacity-overrun-case | W3 |




### J15 · ONE Studios, VCF production and professional asset delivery

Support professional work while preserving actual media ownership, production permissions, asset/version QC and handoff.

| Screen ID | UI surface | Screen / view / state | User role(s) | Core UI components | Primary user action | Route or host | Release gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| STUD-001 | DASHBOARD | Production and creator services overview | Producer/ONE Studios, VCF creator operator | Commissioned jobs; crew/resource readiness; active assets; QC; rights holds | Prioritize accepted work and production dependencies | /operations/production/production-and-creator-services-overview | W3 |
| STUD-002 | PAGE | Commissioning brief and greenlight request | Producer/ONE Studios, VCF creator operator | Property; script; customer; budget; format; delivery and risk checklist | Submit a scoped project for professional greenlight | /operations/production/commissioning-brief-and-greenlight-request | W4 |
| STUD-003 | PAGE | Production job detail | Producer/ONE Studios, Builder | Treatment/script; cast/crew; schedule; venue; rights; producer; milestones | Coordinate a commissioned production | /operations/production/production-job-detail | W3 |
| STUD-004 | WIZARD | Preproduction planning wizard | Producer/ONE Studios | Location; crew; equipment; budget; permissions; safety; delivery specification | Create a verified production plan | /operations/production/preproduction-planning-wizard | W3 |
| STUD-005 | DASHBOARD | Production calendar and call sheets | Producer/ONE Studios | Shoot dates; assigned crew; location permission; incident contacts; revision | Confirm authorized shoot calls | /operations/production/production-calendar-and-call-sheets | W3 |
| STUD-006 | DIALOG | Crew booking and contractor allocation | Producer/ONE Studios, Capability Lead | People availability; skills; rate; consent; supervision; contract | Request accepted production staffing | STUD-001 | W4 |
| STUD-007 | PAGE | Location and filming-permission tracker | Producer/ONE Studios, Legal counsel | Venue agreement; permitted windows; bystander/performer consents; risk | Check location rights before capture | /operations/production/location-and-filming-permission-tracker | W3 |
| STUD-008 | PAGE | Equipment and facilities booking | Producer/ONE Studios, Hub resource coordinator | Studio calendar; kits; condition; custodian; power/backup | Book approved production resources | /operations/production/equipment-and-facilities-booking | W3 |
| STUD-009 | DASHBOARD | Shoot-day execution board | Producer/ONE Studios, Builder | Call sheet; progress; crew; safety; media custody; escalation | Record actual production progress and problems | /operations/production/shoot-day-execution-board | W3 |
| STUD-010 | DIALOG | Production incident / safety stop | Producer/ONE Studios, Fusion Events operator | Incident severity; responsible commander; affected task; safe action | Pause unsafe work and escalate | STUD-001 | W4 |
| STUD-011 | PAGE | Rushes ingest and asset custody | Producer/ONE Studios, Builder | Source files; checksums; roles; labels; backups; privacy/rights classification | Ingest production media into approved storage | /operations/production/rushes-ingest-and-asset-custody | W3 |
| STUD-012 | PAGE | Edit/post-production project workspace | Producer/ONE Studios, Builder | Timelines; briefs; notes; versioned exports; rights restrictions | Work on an authorized edit version | /operations/production/edit-post-production-project-workspace | W3 |
| STUD-013 | DIALOG | Submit edit for review | Builder, Producer/ONE Studios | Master version; rendering spec; music/graphics/caption clearance; reviewer | Request editorial and technical review | STUD-001 | W3 |
| STUD-014 | PAGE | Sound, captions and accessibility QA | Producer/ONE Studios, Editor/publisher | Audio mix checks; subtitle files; caption errors; language QC | Correct technical accessibility defects | /operations/production/sound-captions-and-accessibility-qa | W3 |
| STUD-015 | DASHBOARD | Production quality-control queue | Producer/ONE Studios | Submitted masters; defects; signoff actors; accepted technical specs | Accept or return a master for correction | /operations/production/production-quality-control-queue | W4 |
| STUD-016 | DIALOG | Accept a production master | Producer/ONE Studios, Editor/publisher | Checksum; exact cut; QC results; relevant rights destination; receiver | Sign off technical delivery within scope | STUD-001 | W4 |
| STUD-017 | STATE | Master has incomplete rights or wrong format | Producer/ONE Studios, Editor/publisher | Rejected reason; unlicensed component; required delivery spec; fix | Return an asset for rights/technical repair | STUD-001 | W3 |
| STUD-018 | PAGE | Digital asset and master catalogue | Producer/ONE Studios, Editor/publisher | Version assets; ownership; cut/format; rights-link; storage; search | Find a cleared source asset without granting reuse rights | /operations/production/digital-asset-and-master-catalogue | W3 |
| STUD-019 | PAGE | Production delivery manifest | Producer/ONE Studios, Client contact | Master/version; captions; credits; checksum; contract; receiver signature | Deliver and acknowledge the correct asset package | /operations/production/production-delivery-manifest | W3 |
| STUD-020 | PAGE | Production closeout and archive | Producer/ONE Studios | Accepted outputs; equipment return; supplier payables; retention; licence expiry | Close technical production while retaining separate obligations | /operations/production/production-closeout-and-archive | W3 |
| STUD-021 | DIALOG | Project rights and promotional-use check | Producer/ONE Studios, Rights/IP officer | Platform/territory/time; licence; contributors; preview consent | Request specific asset-use clearance | STUD-001 | W4 |
| STUD-022 | STATE | Source footage damaged / missing backup | Producer/ONE Studios | Missing/corrupt files; last known backup; recovery authority; delay risk | Initiate authorised recovery and notify mission owner | STUD-001 | W3 |
| STUD-023 | PAGE | Production synthetic-media provenance and clearance record | Producer/ONE Studios, Rights/IP officer, Legal counsel, Cr8Tech/engineering | Source media hashes; generator/vendor; performer permissions; approved cuts; QC | Clear or block a synthetic element before delivery or publication | /operations/production/production-synthetic-media-provenance-and-clearance-record | W4 |




### J16 · Fusion Events, 9TLIFE, Azeebo+ Live and event operations

Support event and city-experience workflows while keeping Azeebo+ Live transactions and third-party fulfilment independent.

| Screen ID | UI surface | Screen / view / state | User role(s) | Core UI components | Primary user action | Route or host | Release gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EVNT-001 | PAGE | Event and experience services overview | Public visitor, Client contact | Approved event formats; scope/risks; pricing by enquiry; status | Discover relevant event services | /operations/events/event-and-experience-services-overview | W0 |
| EVNT-002 | DASHBOARD | Fusion Events operations dashboard | Fusion Events operator | Event list; underwriting state; critical safety tasks; vendor obligations | Monitor legitimate event operations | /operations/events/fusion-events-operations-dashboard | W3 |
| EVNT-003 | WIZARD | Event concept and underwriting request | Fusion Events operator, Client contact | Audience; venue; date; sponsor; ticket risks; refunds; estimate | Request an event feasibility and funding decision | /operations/events/event-concept-and-underwriting-request | W4 |
| EVNT-004 | PAGE | Event project detail | Fusion Events operator | Schedule; venue; contracts; suppliers; run of show; permits; budget | Coordinate approved event delivery | /operations/events/event-project-detail | W3 |
| EVNT-005 | DASHBOARD | Venue and vendor contracts board | Fusion Events operator, Venue/vendor | Due diligence; agreements; deposits; permit/insurance; performance | Track actual supplier and venue readiness | /operations/events/venue-and-vendor-contracts-board | W3 |
| EVNT-006 | DIALOG | Confirm venue or supplier commitment | Fusion Events operator, Venue/vendor | Exact site/date; terms; safety; cancellation; signed authority | Accept a real supplier/venue obligation | EVNT-002 | W4 |
| EVNT-007 | PAGE | Event safety and incident plan | Fusion Events operator | Crowd risk; emergency services; access; evacuation; weather; responsible commander | Review safe operating readiness | /operations/events/event-safety-and-incident-plan | W3 |
| EVNT-008 | DIALOG | Issue event safety HOLD | Fusion Events operator, Legal counsel | Risk trigger; affected plans; stop authority; remediation | Stop or defer unsafe event activities | EVNT-002 | W4 |
| EVNT-009 | PAGE | Run-of-show and crew schedule | Fusion Events operator, Producer/ONE Studios | Timed activities; roles; logistics; equipment; alternates | Coordinate approved physical event execution | /operations/events/run-of-show-and-crew-schedule | W3 |
| EVNT-010 | PAGE | Sponsor fulfilment and capture plan | Fusion Events operator, Sponsor | Contracted inventory; physical branding; shooting permissions; proof | Track deliverable obligations to sponsors | /operations/events/sponsor-fulfilment-and-capture-plan | W3 |
| EVNT-011 | PAGE | Event admission / guest operations view | Fusion Events operator | Actual permitted guest/entry records; capacity limit; incident alert | Operate approved admission without creating unlicensed ticket systems | /operations/events/event-admission-guest-operations-view | W4 |
| EVNT-012 | PAGE | Event capture and replay-rights tracker | Fusion Events operator, Rights/IP officer | Performance/music/venue licences; stream/replay windows; version | Check whether recordings may be reused | /operations/events/event-capture-and-replay-rights-tracker | W4 |
| EVNT-013 | PAGE | 9TLIFE partner/listing information | Public visitor, Venue/vendor | Place/experience detail; verified date; partner responsibility; referral terms | Learn about an approved partner experience | /operations/events/9tlife-partner-listing-information | W0 |
| EVNT-014 | DIALOG | Submit a 9TLIFE partner offer | Venue/vendor, Partner | Organisation; actual availability; fulfilment; cancellation; partner contract | Propose an authentic city experience offer | EVNT-002 | W3 |
| EVNT-015 | STATE | Venue/partner offer no longer valid | Public visitor, Venue/vendor | Expired notice; correction route; removed CTA; partner contact | Choose an available alternative or report inaccuracy | EVNT-002 | W0 |
| EVNT-016 | PAGE | Event closeout and claims review | Fusion Events operator, Finance/controller | Attendance source; sponsorship proof; vendor/creator pay; refunds; contribution | Close an event with truthful fulfilment and economic evidence | /operations/events/event-closeout-and-claims-review | W4 |
| EVNT-017 | STATE | Cancelled/postponed event customer support | Public visitor, Client contact | Official status; refund/contact route; no fictional schedule | Find actual cancellation instructions | EVNT-002 | W0 |
| EVNT-018 | PAGE | Event refund and outstanding liability case | Fusion Events operator, Finance/controller, Legal counsel, Customer/support operator | Cancellation basis; affected tickets; supplier holds; provider status; customer notices | Resolve refund exposure after postponement or cancellation | /operations/events/event-refund-and-outstanding-liability-case | W4 |




### J17 · IP, storyworld governance, rights and TEND licensing

Manage title rights and external opportunities without assuming ownership from a script, media file or Originals label.

| Screen ID | UI surface | Screen / view / state | User role(s) | Core UI components | Primary user action | Route or host | Release gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IPR-001 | DASHBOARD | Rights and IP portfolio overview | Rights/IP officer, Producer/ONE Studios | Property/title IDs; rights holds; expiries; clearance queue; version evidence | Review exploitable rights status | /rights/rights-and-ip-portfolio-overview | W3 |
| IPR-002 | PAGE | Property and storyworld rights workspace | Rights/IP officer, Producer/ONE Studios | World/alias; controlling canon; contributors; chain of title; legal instruments | Verify a specific property's authority | /rights/property-and-storyworld-rights-workspace | W3 |
| IPR-003 | PAGE | Title chain-of-title record | Rights/IP officer | Authorship; contracts; music/performance/archive components; gaps | Assess chain-of-title completeness | /rights/title-chain-of-title-record | W4 |
| IPR-004 | PAGE | Specific asset and permitted-use matrix | Rights/IP officer | Asset/version; platform; territory; windows; licensed uses; restrictions | Inspect a specific exploitation right | /rights/specific-asset-and-permitted-use-matrix | W3 |
| IPR-005 | WIZARD | Request new rights-use evaluation | Producer/ONE Studios, Editor/publisher, TEND licensing officer | Media/territory/channel; time; exact cut; rationale; source contract | Submit a use-specific permission request | /rights/request-new-rights-use-evaluation | W4 |
| IPR-006 | DASHBOARD | Rights-use review queue | Rights/IP officer | Pending/blocked; expiring; disputed; affected mission/release | Resolve legitimate rights requests | /rights/rights-use-review-queue | W4 |
| IPR-007 | PAGE | Rights evaluation decision detail | Rights/IP officer, Legal counsel | Licensor; rights basis; exact use; expiry; signed decision; blockers | Approve, deny or qualify a specific use | /rights/rights-evaluation-decision-detail | W4 |
| IPR-008 | DIALOG | Block or revoke a rights-use decision | Rights/IP officer | Affected asset/territory/window; reason; dependent releases; human signer | Suspend unlicensed use and propagate invalidation | IPR-007 | W4 |
| IPR-009 | STATE | Rights absent, expired, disputed or mismatched | Rights/IP officer, Producer/ONE Studios, Editor/publisher | Precise unsafe use; restriction; safe alternative; escalation owner | Correct the source use rather than override the hold | IPR-001 | W4 |
| IPR-010 | PAGE | Rights expiry and renewal calendar | Rights/IP officer, TEND licensing officer | Time windows; territory; notices; buyer commitments; renewals | Plan licensed renewals and removals | /rights/rights-expiry-and-renewal-calendar | W3 |
| IPR-011 | PAGE | Original Storyworld canon and version history | Producer/ONE Studios, Rights/IP officer | Four peer worlds; current canon authorities; changes; separate downstream editions | Check the approved creative source for a title | /rights/original-storyworld-canon-and-version-history | W3 |
| IPR-012 | DIALOG | Propose a canon or title metadata change | Producer/ONE Studios, Rights/IP officer | Source revision; change reason; impacted production/rights; owner | Request property-owner decision without editing the canon by guess | IPR-011 | W4 |
| IPR-013 | DASHBOARD | TEND licensing operations | TEND licensing officer | Available catalogue; buyers; contractual windows; delivery and collections | Manage external licensing pipeline | /rights/tend-licensing-operations | W3 |
| IPR-014 | WIZARD | Rights holder title intake | Rights holder | Actual rightsholder; title/cut; territories/windows; masters; contract documents | Submit rights-supply material | /rights/rights-holder-title-intake | W3 |
| IPR-015 | PAGE | Rights holder submission tracker | Rights holder | Own submitted titles; diligence; missing material; decisions and messages | Track licensing intake status | /rights/rights-holder-submission-tracker | W3 |
| IPR-016 | PAGE | Licensed catalogue and buyer discovery | Distributor/buyer, TEND licensing officer | Rights-ready titles; permitted markets; asset specs; offer/contract limits | Search legitimately offered licensing opportunities | /rights/licensed-catalogue-and-buyer-discovery | W3 |
| IPR-017 | WIZARD | Licensing offer / negotiation workspace | TEND licensing officer, Distributor/buyer | Term sheet; territory/window; exclusivity; economics; approval chain | Prepare and negotiate a real title licence | /rights/licensing-offer-negotiation-workspace | W4 |
| IPR-018 | PAGE | External distribution deal detail | TEND licensing officer, Distributor/buyer | Actual parties; executed agreement; delivery dates; reporting; settlement | Review a licensed transaction | /rights/external-distribution-deal-detail | W3 |
| IPR-019 | DIALOG | Submit licensing terms for legal signoff | TEND licensing officer, Legal counsel | Deviation summary; source rights; limits; financial review; decision | Request counsel and signatory approval | IPR-017 | W4 |
| IPR-020 | PAGE | Buyer delivery package and acceptance | TEND licensing officer, Distributor/buyer | Master/caption/metadata; checksum; permitted transfer; accepted proof | Deliver or acknowledge a title package | /rights/buyer-delivery-package-and-acceptance | W4 |
| IPR-021 | PAGE | Licensing statement and royalty status | TEND licensing officer, Rights holder, Finance/controller | Buyer reports; receipt; licence shares; due/paid; dispute | Reconcile title-level contractual royalties | /rights/licensing-statement-and-royalty-status | W3 |
| IPR-022 | STATE | Unknown rightsholder or incomplete chain | Rights holder, TEND licensing officer | Missing contributors; required documents; no licensable badge; human reviewer | Complete diligence before offer | IPR-001 | W3 |
| IPR-023 | STATE | Title-window conflict or double exclusive licence | TEND licensing officer, Rights/IP officer | Conflicting territory/term; contracts; affected buyer; stop reason | Resolve licence overlap before commitment | IPR-001 | W4 |
| IPR-024 | DASHBOARD | Rights revocation downstream-impact queue | Rights/IP officer, Editor/publisher, Broadcast operator, VMN World Product/QA | Withdrawn licence; dependent assets/schedules/caches; invalidation confirmation | Find and suspend all affected downstream uses after revocation | /rights/rights-revocation-downstream-impact-queue | W4 |
| IPR-025 | PAGE | Synthetic performer and AI voice-rights clearance | Rights/IP officer, Legal counsel, Creator/talent | Performer identity; specific synthesis consent; training prohibition; use period | Review a use-specific synthetic voice or likeness permission | /rights/synthetic-performer-and-ai-voice-rights-clearance | W4 |




### J18 · Brand editorial, publishing, media and company content governance

Publish verified brand/content copy with legal, rights, advertising and service-status controls.

| Screen ID | UI surface | Screen / view / state | User role(s) | Core UI components | Primary user action | Route or host | Release gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CMS-001 | DASHBOARD | Editorial and website CMS dashboard | Editor/publisher, Marketing/PR | Drafts; approvals; expiring content; brand statuses; notices | Review permitted publishing workload | /editorial/editorial-and-website-cms-dashboard | W2 |
| CMS-002 | PAGE | Content entry/editor view | Editor/publisher | Title/body; media; taxonomy; accessibility; source revision; preview | Draft brand and corporate content | /editorial/content-entry-editor-view | W2 |
| CMS-003 | PAGE | Editorial content calendar | Editor/publisher, Marketing/PR | Channels; deadlines; campaigns; approvals; responsible publisher | Plan publication without inventing live inventory | /editorial/editorial-content-calendar | W2 |
| CMS-004 | PAGE | Brand page editor | Brand Steward, Editor/publisher | Approved remit; current copy; alias/service; links; fact ownership | Propose a brand-page update | /editorial/brand-page-editor | W2 |
| CMS-005 | TAB | Content source and claims sheet | Editor/publisher, Legal counsel | Claim text; evidence; license; dated review; advertising designation | Check the source for each public claim | CMS-001 | W2 |
| CMS-006 | DIALOG | Request editorial/legal review | Editor/publisher | Content version; high-risk categories; reviewers; deadline; evidence | Submit content for required approval | CMS-001 | W2 |
| CMS-007 | DASHBOARD | Editorial approval queue | Editor/publisher, Brand Steward | Review backlog; signed decisions; due time; conflict/changes | Approve or return copy within authority | /editorial/editorial-approval-queue | W4 |
| CMS-008 | DIALOG | Approve a specific publishable version | Editor/publisher, Brand Steward | Final preview; source/rights references; target audience; signed approval | Authorize exact copy/version for scope | CMS-001 | W4 |
| CMS-009 | STATE | Publishing blocked by rights/claims/age | Editor/publisher | Blocking rule; actual owner; affected asset; safe remedy | Correct source content before release | CMS-001 | W2 |
| CMS-010 | PAGE | Approved-publication preview | Editor/publisher, Brand Steward | Desktop/mobile preview; metadata/structured data; linked CTAs; a11y checks | Inspect what the public will actually see | /editorial/approved-publication-preview | W2 |
| CMS-011 | DIALOG | Schedule a public content release | Editor/publisher | Effective time/zone; target page; approved version; expiry; signoff | Schedule verified publishing | CMS-001 | W4 |
| CMS-012 | PAGE | Published content detail and audit | Editor/publisher | Actual URL; publish record; current status; revision and corrections | Verify successful source-backed publication | /editorial/published-content-detail-and-audit | W2 |
| CMS-013 | PAGE | Publishing corrections and withdrawals | Editor/publisher, Brand Steward | Old/new text; reason; source authority; affected referrals; notice | Request corrective publication or takedown | /editorial/publishing-corrections-and-withdrawals | W4 |
| CMS-014 | DASHBOARD | Brand status publication monitor | Brand Steward | 35 brand classifications; live-status evidence; unsupported CTAs; feedback | Audit brand accuracy across published pages | /editorial/brand-status-publication-monitor | W2 |
| CMS-015 | DIALOG | Approve a brand-operating-status claim | Brand Steward, Broadcast operator, VMN World Product/QA | Actual service source; owner; date; audience; permitted CTA | Authorize only a factually supported service claim | CMS-001 | W4 |
| CMS-016 | PAGE | Newsroom and media announcements editor | Marketing/PR, Editor/publisher | Press release; quotes; brand/partner rights; scheduling | Prepare approved public announcements | /editorial/newsroom-and-media-announcements-editor | W2 |
| CMS-017 | DIALOG | Partner logo or endorsement-use consent | Marketing/PR, Partner | Exact logo; context; period; counterparty permission; record | Obtain permission before using external identity | CMS-001 | W4 |
| CMS-018 | PAGE | Ad claims and publication clearance | Marketing/PR, Legal counsel | Regulatory category; substantiation; final copy; certificate status | Clear applicable advertising claims before exposure | /editorial/ad-claims-and-publication-clearance | W4 |
| CMS-019 | STATE | Published content corrected after source withdrawal | Editor/publisher, Public visitor | Correction notice; replacement route; retained archive; takedown status | Find current information and record correction | CMS-001 | W0 |
| CMS-020 | PAGE | Localization and culturally grounded copy review | Editor/publisher, Brand Steward | Language/context reviewers; captions; approved regional terms; revision | Approve exact language/cultural presentation | /editorial/localization-and-culturally-grounded-copy-review | W2 |
| CMS-021 | PAGE | Editorial correction evidence and dependent publication audit | Editor/publisher, Brand Steward, Knowledge steward | Source correction; changed pages; cache invalidation; public notice; reviewer | Verify corrections have propagated to affected public surfaces | /editorial/editorial-correction-evidence-and-dependent-publication-audit | W4 |




### J19 · Broadcast scheduling, traffic, transmission and proof-of-air

Keep actual channel IDs and rights-safe schedule/EPG/playlist/as-run evidence distinct.

| Screen ID | UI surface | Screen / view / state | User role(s) | Core UI components | Primary user action | Route or host | Release gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BRC-001 | DASHBOARD | Broadcast operations home | Broadcast operator, Traffic/scheduling controller | Verified channels; live source freshness; rights holds; scheduled work; incidents | Review current authorized broadcast operations | /broadcast/broadcast-operations-home | W3 |
| BRC-002 | PAGE | Broadcast service registry | Broadcast operator | Nigezie Xtreme; verified Orisun/Isi services; TEN alias; service/licence/operator | Inspect actual channel identities | /broadcast/broadcast-service-registry | W3 |
| BRC-003 | DIALOG | Verify TEN-to-channel alias | Broadcast operator, Brand Steward | Brand/service IDs; licence; duplication check; authority sign-off | Confirm alias without creating a new channel | BRC-002 | W4 |
| BRC-004 | PAGE | Programming schedule viewer | Broadcast operator, Traffic/scheduling controller | Service; period; schedule revision; time zone; program slots; rights flags | Inspect approved/planned programming | /broadcast/programming-schedule-viewer | W3 |
| BRC-005 | DASHBOARD | Traffic and advertising inventory dashboard | Traffic/scheduling controller, Commercial/BD | Contracted slots; available inventory; category conflicts; booked campaign IDs | Check real sellable inventory | /broadcast/traffic-and-advertising-inventory-dashboard | W3 |
| BRC-006 | PAGE | Traffic order and booking detail | Traffic/scheduling controller | Signed order; creative/version; slot/time; actual inventory; proof requirements | Review a validated booking | /broadcast/traffic-order-and-booking-detail | W3 |
| BRC-007 | DIALOG | Hold conflicted or double-booked inventory | Traffic/scheduling controller | Duplicate slot; exclusivity issue; actual order; alternative | Block unsafe advertising booking | BRC-006 | W4 |
| BRC-008 | WIZARD | Schedule revision proposal | Traffic/scheduling controller | Old/new slots; asset versions; rights change; reason; approvers | Submit controlled schedule change | /broadcast/schedule-revision-proposal | W4 |
| BRC-009 | PAGE | Rights preflight evaluation | Rights/IP officer, Broadcast operator | Asset/version; exact rights; channel/territory/time; decision flags | Approve or deny the intended broadcast use | /broadcast/rights-preflight-evaluation | W4 |
| BRC-010 | STATE | Rights gate failed before schedule export | Traffic/scheduling controller, Broadcast operator | Missing/expired/revoked right; original source; blocked action | Seek clearance or use pre-cleared fallback | BRC-001 | W4 |
| BRC-011 | PAGE | Approved schedule revision detail | Broadcast operator, Traffic/scheduling controller | Immutable schedule ID and revision; signer; title/slot references | Verify the exact authorized schedule | /broadcast/approved-schedule-revision-detail | W3 |
| BRC-012 | PAGE | EPG export history | Broadcast operator, Traffic/scheduling controller | Export ID; source revision; guide representation; timestamp; target | Inspect generated EPG without claiming aired | /broadcast/epg-export-history | W3 |
| BRC-013 | PAGE | Playlist export history | Broadcast operator, Master control engineer | Playlist ID; approved schedule link; checksum; machine/source status | Inspect authorized playlist artifacts | /broadcast/playlist-export-history | W3 |
| BRC-014 | WIZARD | Request executable playlist export | Traffic/scheduling controller, Master control engineer | Approved revision; current rights; engineer/checker; change protection | Request separately gated source-system export | /broadcast/request-executable-playlist-export | W4 |
| BRC-015 | DASHBOARD | Master-control continuity dashboard | Master control engineer | Actual playout source; signal health; handover; incident/backup state | Monitor authorized broadcast continuity | /broadcast/master-control-continuity-dashboard | W3 |
| BRC-016 | PAGE | Actual as-run log ingestion | Master control engineer, Traffic/scheduling controller | As-run source; event class; service; timestamp; source revision | Ingest authoritative evidence of actual attempted/played events | /broadcast/actual-as-run-log-ingestion | W4 |
| BRC-017 | PAGE | As-run discrepancy and verification detail | Traffic/scheduling controller, Broadcast operator | Booked vs attempted vs aired; monitoring corroboration; mismatch; remedy | Investigate transmission discrepancy | /broadcast/as-run-discrepancy-and-verification-detail | W4 |
| BRC-018 | STATE | EPG export exists without as-run | Broadcast operator, Traffic/scheduling controller | Export status; no verified air flag; responsible reviewer | Avoid false proof-of-air and await authentic evidence | BRC-001 | W3 |
| BRC-019 | STATE | As-run tied to wrong schedule revision | Traffic/scheduling controller | Evidence mismatch; schedule history; discrepancy owner; audit | Escalate for reconciliation without auto-pairing | BRC-001 | W4 |
| BRC-020 | STATE | Broadcast source stale or playout unavailable | Broadcast operator, Master control engineer | Source last-seen; read-only limitation; manual operator and continuity route | Use approved operating backup without unsupported transmission claim | BRC-001 | W3 |
| BRC-021 | DIALOG | Incident or emergency schedule substitution | Master control engineer, Broadcast operator | Pre-cleared fallback; reason; safety/rights; commander; audit | Request controlled emergency replacement | BRC-015 | W4 |
| BRC-022 | PAGE | Proof-of-air package and customer report | Traffic/scheduling controller, Commercial/BD | Actual verified airtime; booked units; contract; make-good; export | Issue supported campaign delivery evidence | /broadcast/proof-of-air-package-and-customer-report | W4 |
| BRC-023 | PAGE | Make-good and short-delivery case | Traffic/scheduling controller, Commercial/BD, Finance/controller | Missed slot; remedy entitlement; customer communications; credit status | Request approved make-good or credit | /broadcast/make-good-and-short-delivery-case | W4 |
| BRC-024 | DIALOG | Broadcast-to-Azeebo+ reuse request | Broadcast operator, Rights/IP officer, Azeebo+ Product (external authority) | Exact asset cut; new VOD/social use; territory/window; permission | Request separate non-linear exploitation clearance | BRC-011 | W4 |
| BRC-025 | STATE | Tushe proposed remit but no service record | Public visitor, Broadcast operator | Brand page only; unverified channel status; no EPG/stream controls | Use informational route instead of creating phantom transmission | BRC-001 | W0 |
| BRC-026 | DASHBOARD | Independent proof-of-air verification queue | Traffic/scheduling controller, Broadcast operator, Master control engineer, Finance/controller | Booked unit; schedule revision; EPG/playlist IDs; as-run provider; independent verification | Approve or dispute a claim that a contracted item actually aired | /broadcast/independent-proof-of-air-verification-queue | W4 |




### J20 · Finance, commercial performance, treasury and capital controls

Expose source-backed obligations and approvals without replacing the general ledger or treating proposed cash as available.

| Screen ID | UI surface | Screen / view / state | User role(s) | Core UI components | Primary user action | Route or host | Release gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| FIN-001 | DASHBOARD | Finance and commercial executive scorecard | Finance/controller, CFO/treasury approver, Executive/Board adviser | Revenue/AR/cash separate; period; source/coverage; variances; risk actions | Review evidence-backed financial performance | /finance/finance-and-commercial-executive-scorecard | W3 |
| FIN-002 | DASHBOARD | Commercial pipeline dashboard | Commercial/BD, CFO/treasury approver | Qualified opportunities; contract stages; expected vs secured; owner; source timing | Assess actual pipeline and collection risk | /finance/commercial-pipeline-dashboard | W3 |
| FIN-003 | PAGE | Opportunity economics / margin case | Commercial/BD, Finance/controller | Buyer; scope; source quote; direct costs; rights shares; contribution | Review the cost and value of a proposed deal | /finance/opportunity-economics-margin-case | W4 |
| FIN-004 | DIALOG | Approve a price or discount exception | Finance/controller, CFO/treasury approver | Signed DoA; unit economics; current terms; conflict and checker | Accept or reject a commercial pricing exception | FIN-003 | W4 |
| FIN-005 | PAGE | Contracts and obligations financial index | Finance/controller | External performance obligations; invoices; deferred amounts; source links | Identify real enforceable financial commitments | /finance/contracts-and-obligations-financial-index | W3 |
| FIN-006 | DASHBOARD | Accounts receivable and ageing view | Finance/controller, Commercial/BD | Invoice lines; ageing; disputed/collectible; cash receipts; owner | Prioritize recovery and dispute resolution | /finance/accounts-receivable-and-ageing-view | W3 |
| FIN-007 | PAGE | Customer AR case detail | Finance/controller, Commercial/BD | Invoices; acceptance; credits; correspondence; promised payment; remedy | Review and progress a debt recovery case | /finance/customer-ar-case-detail | W3 |
| FIN-008 | DIALOG | Open a debtor dispute or write-off proposal | Finance/controller | Cause; supporting contract; collection evidence; approval route | Submit a controlled credit or impairment decision | FIN-007 | W4 |
| FIN-009 | DASHBOARD | Accounts payable and obligations | Finance/controller | Supplier balances; due dates; approvals; payment/receipt proof; creator/payroll protection | Monitor actual cash obligations | /finance/accounts-payable-and-obligations | W3 |
| FIN-010 | PAGE | Purchase requisition detail | Finance/controller, Employee/contractor | Budget; supplier quotes; PO; GRN; invoice match; approvals | Review a purchase commitment and controls | /finance/purchase-requisition-detail | W4 |
| FIN-011 | DIALOG | Approve or reject a procurement request | Finance/controller, CFO/treasury approver | Verified delegated limit; independent checker; supplier and sourcing evidence | Authorize or refuse procurement within valid DoA | FIN-010 | W4 |
| FIN-012 | STATE | Duplicate invoice, supplier bank mismatch or split purchase | Finance/controller | Matching rules; blocked payment; exception; escalation | Investigate before any payment instruction | FIN-001 | W4 |
| FIN-013 | DASHBOARD | Treasury 13-week cash outlook | Finance/controller, CFO/treasury approver | Verified opening cash; W01–13; inflow confidence; protected outflows; stress cases | Review current source-based liquidity and scenarios | /finance/treasury-13-week-cash-outlook | W3 |
| FIN-014 | PAGE | Cash forecast line and evidence detail | Finance/controller | Entity/account; receipt/payment dates; confidence; restricted status; bank source | Inspect or correct a dated forecast assumption | /finance/cash-forecast-line-and-evidence-detail | W3 |
| FIN-015 | DIALOG | Approve a revised cash forecast | CFO/treasury approver | Version; bank reconciliation; protected outflows; variance; signer | Certify an authorized treasury forecast for decision use | FIN-013 | W4 |
| FIN-016 | STATE | Cash-capacity incomplete / spending HOLD | Finance/controller, CFO/treasury approver, Executive/Board adviser | Missing bank/debt/tax/AR inputs; no available-cash assertion; remediation | Request missing evidence before committing funds | FIN-001 | W3 |
| FIN-017 | DASHBOARD | Group P&L, balance sheet and cash-flow dashboard | Finance/controller, CFO/treasury approver, Executive/Board adviser | Entity and consolidated statements; close period; prior/budget; reconciliation status | Analyze actual and approved forecast finances | /finance/group-p-l-balance-sheet-and-cash-flow-dashboard | W3 |
| FIN-018 | TAB | Intercompany elimination and audit trail | Finance/controller, CFO/treasury approver | Two-sided entries; matching; eliminations; residuals; reviewer | Check no internal recharge is counted as external income | FIN-001 | W3 |
| FIN-019 | PAGE | Revenue-recognition decision memo | Finance/controller | Contract/obligation; principal-agent; variable consideration; evidence; accounting policy | Review recognition basis for a transaction | /finance/revenue-recognition-decision-memo | W4 |
| FIN-020 | DASHBOARD | Creator and rights-holder payable status | Finance/controller | Contractual beneficiaries; earned vs due vs paid; disputed obligations; settlement sources | Protect and reconcile creator/rights liabilities | /finance/creator-and-rights-holder-payable-status | W3 |
| FIN-021 | PAGE | Settlement statement and source receipt | Finance/controller, Creator/talent, Rights holder | Beneficiary/contract; earned share; tax; actual settled cash; disputes | Review a source-backed settlement | /finance/settlement-statement-and-source-receipt | W3 |
| FIN-022 | DIALOG | Raise or approve payout instruction | Finance/controller, CFO/treasury approver | Payee verification; amount; contract; independent maker-checker; bank destination | Approve a lawful financial payment request | FIN-021 | W4 |
| FIN-023 | STATE | Payment initiated but not confirmed | Finance/controller, CFO/treasury approver | Request ID; provider response; bank reconciliation; no paid claim | Reconcile final outcome without duplicate payment | FIN-001 | W4 |
| FIN-024 | DASHBOARD | Budget versus actual and forecast | Finance/controller, Executive/Board adviser | Approved baseline; variance bridge; unit drivers; next actions; source freshness | Review material deviations and remedies | /finance/budget-versus-actual-and-forecast | W3 |
| FIN-025 | PAGE | Capital expenditure business case | Finance/controller, CFO/treasury approver, Executive/Board adviser | Alternatives; cash; payback; total cost; risk; approvals; version | Evaluate a funded investment proposal | /finance/capital-expenditure-business-case | W4 |
| FIN-026 | DIALOG | Reserve/DoA investment approval | CFO/treasury approver, Executive/Board adviser | Cash-capacity certificate; reserved matter; liquidity downside; signer | Approve or defer material capital commitment | FIN-025 | W4 |
| FIN-027 | DASHBOARD | Tax and statutory filing calendar | Finance/controller, Legal counsel | Entity/period; applicable rules; filing deadlines; draft/review; real receipt | Track compliance obligations by actual law effective date | /finance/tax-and-statutory-filing-calendar | W3 |
| FIN-028 | STATE | Tax law/transaction period unresolved | Finance/controller, Legal counsel | Before/after effective date; applicable statute; qualified advisor | Hold computation pending transaction-specific review | FIN-001 | W3 |
| FIN-029 | DASHBOARD | Financial close exceptions board | Finance/controller, CFO/treasury approver | Period close; reconciliations; missing bank/source; journal support; signoff | Resolve month-end close blockers | /finance/financial-close-exceptions-board | W4 |
| FIN-030 | PAGE | Investor or Board financial reporting pack | Finance/controller, CFO/treasury approver, Executive/Board adviser | Controlled approved statements; liquidity; assumptions; material risks; version | Prepare defensible management disclosures | /finance/investor-or-board-financial-reporting-pack | W4 |
| FIN-031 | WIZARD | Supplier onboarding and beneficiary change verification | Finance/controller, Legal counsel, Commercial/BD | Legal supplier ID; conflict check; verified bank; independent callback; decision | Approve a current supplier or bank change under maker-checker | /finance/supplier-onboarding-and-beneficiary-change-verification | W4 |
| FIN-032 | PAGE | Bank-to-ledger reconciliation certificate | Finance/controller, CFO/treasury approver, Independent auditor/QA | Actual bank statement; ledger; unmatched transactions; signed reconciler | Certify a specific period bank reconciliation before cash reporting | /finance/bank-to-ledger-reconciliation-certificate | W4 |
| FIN-033 | DASHBOARD | Refund, chargeback and provider settlement cases | Finance/controller, VMN World Product/QA, Customer/support operator | Original customer order; PSP states; entitlement; liability; audit | Review customer refund and chargeback execution and accounting | /finance/refund-chargeback-and-provider-settlement-cases | W4 |
| FIN-034 | PAGE | Creator royalty accrual and settlement liability roll-forward | Finance/controller, Rights/IP officer, TEND licensing officer | Contract/title; earned units; royalty base; accrual; paid/remaining amount | Validate recognised creator/rights-holder liabilities at period close | /finance/creator-royalty-accrual-and-settlement-liability-roll-forward | W4 |
| FIN-035 | PAGE | Applicable tax period and legal-basis review | Finance/controller, CFO/treasury approver, Legal counsel | Tax point; entity; prior/current law version; adviser opinion; filings | Approve the correct tax-treatment memo for one transaction/period | /finance/applicable-tax-period-and-legal-basis-review | W4 |




### J21 · Legal, People, governance, privacy and formal approvals

Make reserved authorities and protected personal rights operable without letting missions or AI make legal or employment decisions.

| Screen ID | UI surface | Screen / view / state | User role(s) | Core UI components | Primary user action | Route or host | Release gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GOV-001 | DASHBOARD | Corporate governance and reserved decisions | Executive/Board adviser, Legal counsel | Board/management actions; meeting items; signed DoA; deadlines; conflicts | Review matters requiring formal company authority | /governance/corporate-governance-and-reserved-decisions | W3 |
| GOV-002 | PAGE | Entity and signatory register | Legal counsel, Executive/Board adviser | Legal entities; current proof; reserved matters; signatory validity; expiry | Verify the person authorized to bind a company | /governance/entity-and-signatory-register | W3 |
| GOV-003 | DIALOG | Conflict-of-interest declaration | Executive/Board adviser, Legal counsel, People & Culture | Related party/interest; recusal; evidence; independent reviewer | Disclose and route a conflict | GOV-001 | W4 |
| GOV-004 | PAGE | Board or executive decision paper | Executive/Board adviser, Legal counsel | Issue; options; source records; cost/rights impact; approval matrix | Review an actual reserved decision | /governance/board-or-executive-decision-paper | W4 |
| GOV-005 | DIALOG | Record signed delegation or authority change | Legal counsel, Executive/Board adviser | Original instrument; limits; validity; qualified signer; invalidation impacts | Register lawful DoA update | GOV-004 | W4 |
| GOV-006 | STATE | Delegation expired or unauthorized signature | Employee/contractor, Executive/Board adviser, Legal counsel | Source version; blocked action; current authorized signatory; re-request | Obtain valid authority before commitment | GOV-001 | W4 |
| GOV-007 | DASHBOARD | Contract intake and legal matter board | Legal counsel | Active matters; party/entity; jurisdiction; risk; review due dates | Prioritize and monitor legal cases | /governance/contract-intake-and-legal-matter-board | W3 |
| GOV-008 | WIZARD | Legal contract intake | Legal counsel, Commercial/BD, Employee/contractor | Actual parties; contract family; scope; term; value; data/IP/rights | Submit a contract for counsel review | /governance/legal-contract-intake | W4 |
| GOV-009 | PAGE | Contract family / drafting standard view | Legal counsel | Twenty families; issue checklist; negotiation positions; source version | Select approved counsel drafting guidance | /governance/contract-family-drafting-standard-view | W3 |
| GOV-010 | PAGE | Contract review and deviation detail | Legal counsel | Redlines; source templates; liability/indemnity; IP; finance; approvals | Review deviations and prepare legal advice | /governance/contract-review-and-deviation-detail | W4 |
| GOV-011 | DIALOG | Request competent contract signature | Legal counsel, Executive/Board adviser | Executed version; authorized parties; conditions; actual signature service | Seek valid execution from real signatories | GOV-010 | W4 |
| GOV-012 | PAGE | Executed contracts and obligation register | Legal counsel, Finance/controller | Actual instrument; notice dates; licences; reporting; renewal/expiry | Track enforceable obligations | /governance/executed-contracts-and-obligation-register | W3 |
| GOV-013 | PAGE | Contract amendment/termination case | Legal counsel | Old/new terms; accrued obligations; notices; survival; counterpart status | Manage a legally effective change | /governance/contract-amendment-termination-case | W4 |
| GOV-014 | DASHBOARD | People and workforce overview | People & Culture | Approved incumbents; roles; contracts; safe capacity; exits; restricted metadata | Review staffing and workforce obligations | /governance/people-and-workforce-overview | W3 |
| GOV-015 | PAGE | My employment record (employee self-service) | Employee/contractor | Own actual employer/role; benefits/leave references; privacy; manager | Review permitted employment information | /governance/my-employment-record-employee-self-service | W3 |
| GOV-016 | WIZARD | Hiring or contractor engagement request | People & Culture, Capability Lead | Funded role; employment type; work plan; capacity alternative; DoA | Request an authorized engagement | /governance/hiring-or-contractor-engagement-request | W4 |
| GOV-017 | DIALOG | Approve/decline a staffing change | People & Culture, CFO/treasury approver, Executive/Board adviser | Legal employer; funding; process; signed limits; counsel as needed | Decide a valid hiring or employment variation | GOV-016 | W4 |
| GOV-018 | PAGE | Leave, absence and work adjustment request | Employee/contractor | Dates; entitlements; protected reason; covering manager; action | Request authorized leave or accommodation | /governance/leave-absence-and-work-adjustment-request | W3 |
| GOV-019 | PAGE | Restricted employee case intake | Employee/contractor, People & Culture | Confidential report; urgency; affected individual; non-retaliation; evidence | Submit a private employment or safeguarding concern | /governance/restricted-employee-case-intake | W3 |
| GOV-020 | PAGE | People case review detail | People & Culture, Legal counsel | Need-to-know access; chronology; evidence; fairness; outcomes and appeal | Handle a protected case under actual policy | /governance/people-case-review-detail | W4 |
| GOV-021 | STATE | Confidential People record access refused | Employee/contractor, Mission Owner | Minimal refusal; designated People owner; no case metadata | Seek proper assistance without accessing private case | GOV-001 | W1 |
| GOV-022 | PAGE | Privacy and data-subject request centre | Public visitor, Employee/contractor, Client contact, Creator/talent | Rights categories; identity verification; request/ref status; deadlines | Submit a data-rights enquiry | /governance/privacy-and-data-subject-request-centre | W0 |
| GOV-023 | WIZARD | Data subject access/deletion/correction request | Public visitor, Employee/contractor, Client contact | Verification; categories; legal basis/retention exceptions; preferred response | Request a lawfully supported data action | /governance/data-subject-access-deletion-correction-request | W3 |
| GOV-024 | DASHBOARD | DPO register of processing activities | Privacy officer | Data purposes; controller/processor; sources; retention; access; transfer | Review data processing compliance | /governance/dpo-register-of-processing-activities | W3 |
| GOV-025 | PAGE | Privacy impact assessment detail | Privacy officer, Legal counsel | Purpose; necessity; risk; vendors; residual risk; approval | Assess a proposed high-risk processing activity | /governance/privacy-impact-assessment-detail | W4 |
| GOV-026 | DASHBOARD | Security/privacy incident and legal hold board | Privacy officer, Legal counsel, Security/IT administrator | Incidents; severity; preservation; notifications; remedies; status | Coordinate a protected incident response | /governance/security-privacy-incident-and-legal-hold-board | W4 |
| GOV-027 | PAGE | Legal dispute/complaint detail | Legal counsel | Parties; contract; forum; evidence hold; milestones; counsel strategy | Review a restricted dispute case | /governance/legal-dispute-complaint-detail | W4 |
| GOV-028 | DIALOG | Create litigation preservation hold | Legal counsel | Affected records; custodians; trigger; scope; retention; notice | Issue appropriate legal preservation instruction | GOV-027 | W4 |
| GOV-029 | DASHBOARD | Corporate audit and control exceptions | Independent auditor/QA, Executive/Board adviser | Risk cases; evidence; independent checks; remediation; approvals | Verify controls and track unresolved governance risks | /governance/corporate-audit-and-control-exceptions | W3 |
| GOV-030 | PAGE | Formal policy adoption/release certificate | Executive/Board adviser, Legal counsel, Independent auditor/QA | Version; exact scope; accountable signers; evidence; effective date; exceptions | Approve or withhold a formal operating policy release | /governance/formal-policy-adoption-release-certificate | W4 |
| GOV-031 | DASHBOARD | Contract obligation and statutory-notice calendar | Legal counsel, Executive/Board adviser, Independent auditor/QA | Executed instrument; real notice dates; filing owner; expiry and reminders | Identify and act on a legitimate contractual or filing deadline | /governance/contract-obligation-and-statutory-notice-calendar | W3 |
| GOV-032 | PAGE | Data-subject request identity and lawful-hold review | Privacy officer, Legal counsel, Security/IT administrator | Verified requester; request type; jurisdiction; records; restriction exceptions | Decide lawful access, rectification or retention response | /governance/data-subject-request-identity-and-lawful-hold-review | W4 |
| GOV-033 | PAGE | Record retention and litigation-hold release approval | Legal counsel, Privacy officer, Independent auditor/QA | Hold instrument; preservation scope; expiry; legal review; released record | Approve a defensible release from a legal preservation hold | /governance/record-retention-and-litigation-hold-release-approval | W4 |
| GOV-034 | PAGE | Contract execution conditions-precedent checklist | Legal counsel, Finance/controller, Executive/Board adviser | Party/signatory proof; final contract hash; prerequisite documents; effective-date status | Confirm a signed contract actually became operative within scope | /governance/contract-execution-conditions-precedent-checklist | W4 |




### J22 · AI, Cr8Tech, system integrations, product operations and security

Operate controlled source, agent and product release governance without pretending unverified connectors are live.

| Screen ID | UI surface | Screen / view / state | User role(s) | Core UI components | Primary user action | Route or host | Release gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SYS-001 | DASHBOARD | Platform admin and service-health home | Platform tenant administrator, Cr8Tech/engineering | Released surfaces; incidents; source freshness; feature status; uptime data | Review actual operational health | /admin/platform-admin-and-service-health-home | W1 |
| SYS-002 | DASHBOARD | Register S source-domain index | Cr8Tech/engineering, Security/IT administrator, Knowledge steward | 16 domain IDs; owner; verified/not verified; integration status; source age | Find authoritative source owners and health states | /circle/sources | W1 |
| SYS-003 | PAGE | Register S source detail | Cr8Tech/engineering, Security/IT administrator | Vendor/instance; schema; allowed access; data classification; fallback; test evidence | Inspect a particular source integration contract | /circle/sources/{reg-s-id} | W1 |
| SYS-004 | WIZARD | New connector discovery and registration | Cr8Tech/engineering | Verified source; purpose; instance; fields; owner; environment; security review | Propose an approved source integration | /admin/new-connector-discovery-and-registration | W4 |
| SYS-005 | PAGE | Connector permissions and field mapping | Cr8Tech/engineering, Security/IT administrator | Allowed operations; field/schema; relationship purpose; protected data exclusions | Review and constrain adapter permissions | /admin/connector-permissions-and-field-mapping | W4 |
| SYS-006 | DASHBOARD | Connector monitoring and data freshness | Cr8Tech/engineering | Lag; retry; failures; source timestamp; owner; circuit breaker | Detect stale or failed integrations | /admin/connector-monitoring-and-data-freshness | W1 |
| SYS-007 | DIALOG | Suspend or revoke connector permissions | Security/IT administrator, Cr8Tech/engineering | Service ID; affected features; reason; rollback; human authorization | Disable unsafe source access | SYS-005 | W4 |
| SYS-008 | STATE | Source domain unverified or absent | Cr8Tech/engineering, Knowledge steward | Missing owner/vendor; no fabricated endpoint; manual verification path | Keep connector disabled until provenance is established | SYS-001 | W1 |
| SYS-009 | PAGE | API contract catalogue | Cr8Tech/engineering, VMN World Product/QA | Illustrative vs verified routes; version; schemas; error/identity rules | Review source-specific API behavior | /admin/api-contract-catalogue | W1 |
| SYS-010 | PAGE | Schema/version migration planner | Cr8Tech/engineering | Current/target schema; compatibility; golden fixtures; rollback | Prepare safe data migration | /admin/schema-version-migration-planner | W4 |
| SYS-011 | DASHBOARD | Migration and data parity monitor | Cr8Tech/engineering, Independent auditor/QA | Read-only/shadow comparisons; mismatches; source counts; acceptance | Validate migration without altering authoritative records | /admin/migration-and-data-parity-monitor | W4 |
| SYS-012 | PAGE | AI agent registry (A0–A5) | AI/AgentOps owner, Security/IT administrator | Purpose; registered tools; scope; owner; budget; model/vendor; audit | Inspect and register safe agent capabilities | /admin/ai-agent-registry-a0-a5 | W1 |
| SYS-013 | WIZARD | Propose or update an AI agent | AI/AgentOps owner | Task; allowable data; tool boundaries; autonomy tier; human checker; kill switch | Request evaluated agent deployment | /admin/propose-or-update-an-ai-agent | W4 |
| SYS-014 | PAGE | Agent policy and permission matrix | AI/AgentOps owner, Security/IT administrator | Role/action allowlist; data scopes; prohibited high-stakes decisions; expiry | Review agent authorization independently of chat text | /admin/agent-policy-and-permission-matrix | W4 |
| SYS-015 | DASHBOARD | Agent execution and cost console | AI/AgentOps owner, Cr8Tech/engineering | Attempts; success/failure; tokens/cost; tool calls; rollback; incidents | Measure bounded agent operations | /admin/agent-execution-and-cost-console | W1 |
| SYS-016 | PAGE | Agent trace and source-provenance detail | AI/AgentOps owner, Independent auditor/QA | Input classification; cited source; tool request/result; human decision; safe redaction | Investigate an AI output or action | /admin/agent-trace-and-source-provenance-detail | W1 |
| SYS-017 | DIALOG | Pause an unsafe or costly agent | AI/AgentOps owner, Security/IT administrator | Affected agent; reason; revocation; incident; rollback | Stop unsafe automated behavior | SYS-015 | W4 |
| SYS-018 | STATE | AI response lacks valid sources | Employee/contractor, Knowledge steward | Abstention; missing source/date; responsible owner; no execute action | Request human verified source rather than act | SYS-001 | W1 |
| SYS-019 | DASHBOARD | Permissions and relationship admin | Security/IT administrator, Platform tenant administrator | Accounts; roles/purposes; organisations; effective dates; approval links | Review access governance | /admin/permissions-and-relationship-admin | W1 |
| SYS-020 | WIZARD | Grant scoped role permission | Security/IT administrator, People & Culture | Real person; relationship; purpose; expiry; source; independent authorization | Provision only verified needed access | /admin/grant-scoped-role-permission | W4 |
| SYS-021 | PAGE | Role and permission audit history | Security/IT administrator, Independent auditor/QA | Grants/revokes; acting users; source refs; scope; expiry | Audit access and privileged activity | /admin/role-and-permission-audit-history | W1 |
| SYS-022 | DASHBOARD | Product requirements and release dashboard | VMN World Product/QA, Independent auditor/QA | BR/PR/NFR/UAT trace; build slices; open issues; source gaps; owners | Inspect P0 readiness for each selected capability | /admin/product-requirements-and-release-dashboard | W2 |
| SYS-023 | PAGE | Release manifest and build detail | VMN World Product/QA | Build SHA; feature flags; dependencies; test outcomes; rollback; actual signatures | Prepare scoped product release documentation | /admin/release-manifest-and-build-detail | W4 |
| SYS-024 | DIALOG | GO/HOLD/NO-GO product decision | VMN World Product/QA, Executive/Board adviser, Independent auditor/QA | Scope; critical findings; actual owner; signed decision; effective time | Approve or deny a specific release | SYS-023 | W4 |
| SYS-025 | PAGE | Test cases, fixtures and results | VMN World Product/QA, Independent auditor/QA | UAT IDs; QA-SOP/J-UAT; fixtures; observed evidence; pass/fail/not run | Review objective product acceptance | /admin/test-cases-fixtures-and-results | W2 |
| SYS-026 | PAGE | Security testing and threat model register | Security/IT administrator, Cr8Tech/engineering | Threats; assets; controls; test logs; mitigation; signoff | Track security risks and closure | /admin/security-testing-and-threat-model-register | W4 |
| SYS-027 | PAGE | Data retention and vendor registry | Privacy officer, Security/IT administrator | Processing source; vendor contract; retention/deletion; subject rights; review | Audit third-party data boundaries | /admin/data-retention-and-vendor-registry | W3 |
| SYS-028 | STATE | Build failed CI, deploy or rollback | VMN World Product/QA, Cr8Tech/engineering | Failed stage; affected environment; log; owner; safe version | Restore previous functioning release without claiming success | SYS-001 | W4 |
| SYS-029 | PAGE | Incident management and recovery dashboard | Security/IT administrator, Cr8Tech/engineering | Severe incidents; isolation; timeline; responders; external dependencies | Coordinate appropriate operational recovery | /admin/incident-management-and-recovery-dashboard | W4 |
| SYS-030 | STATE | Action pending external system confirmation | Employee/contractor, Cr8Tech/engineering | Request ID; source retry; no success state; reconciliation owner | Reconcile actual result before retrying | SYS-001 | W2 |
| SYS-031 | PAGE | Feature-flag rollout and entitlement policy | VMN World Product/QA, Cr8Tech/engineering, Security/IT administrator | Feature scope; audience cohort; approval IDs; rollout state; kill switch | Stage or disable a verified release capability | /admin/feature-flag-rollout-and-entitlement-policy | W4 |
| SYS-032 | WIZARD | Agent kill-switch and manual fallback rehearsal | AI/AgentOps owner, Security/IT administrator, Cr8Tech/engineering, Independent auditor/QA | Selected agent; test fixture; stop command; source audit; recovery results | Demonstrate safe disablement and independent workflow continuity | /admin/agent-kill-switch-and-manual-fallback-rehearsal | W4 |
| SYS-033 | DASHBOARD | Service-level and accessibility acceptance console | VMN World Product/QA, Cr8Tech/engineering, Independent auditor/QA | p95/availability targets; test environment; device access; defects; owner | Inspect observed quality against owner-approved acceptance thresholds | /admin/service-level-and-accessibility-acceptance-console | W4 |
| SYS-034 | PAGE | Webhook retry, dead-letter and event-source reconciliation | Cr8Tech/engineering, Security/IT administrator, Finance/controller | Event ID; provider; schema version; idempotency; dead-letter; replay audit | Resolve a missing, duplicate or out-of-order source event safely | /admin/webhook-retry-dead-letter-and-event-source-reconciliation | W4 |
| SYS-035 | PAGE | Third-party vendor processing and exit assessment | Cr8Tech/engineering, Privacy officer, Legal counsel, Security/IT administrator | Vendor purpose; DPA; retention; data transfers; security; exit/fallback | Verify a proposed processor or integration contract | /admin/third-party-vendor-processing-and-exit-assessment | W4 |
| SYS-036 | PAGE | Permissions and delegated-access periodic recertification | Security/IT administrator, People & Culture, Independent auditor/QA | Current entitlements; source owner; permission purpose; expiry; revoke history | Recertify or revoke stale staff, agent and partner permissions | /admin/permissions-and-delegated-access-periodic-recertification | W4 |




### J23 · Global edge cases, denial, outage, recovery and safety states

Reusable system-wide pages/modals for predictable failures, truthful status and accessible recovery.

| Screen ID | UI surface | Screen / view / state | User role(s) | Core UI components | Primary user action | Route or host | Release gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EDGE-001 | STATE | 404 route not found | Public visitor, Employee/contractor | Missing path; site navigation; safe search; report broken link | Navigate to a valid destination | PUB-001 | W0 |
| EDGE-002 | STATE | 410 content permanently withdrawn | Public visitor, Employee/contractor | Retired resource; possible canonical replacement; preservation disclaimer | Find current permitted information | PUB-001 | W0 |
| EDGE-003 | STATE | 503 scheduled maintenance | Public visitor, Employee/contractor | Real window; service status; help/contact; no false processing | Use an approved alternate route | PUB-001 | W0 |
| EDGE-004 | STATE | Unplanned global service outage | Public visitor, Employee/contractor | Incident state; available surfaces; actual support route; retry policy | Continue via permitted channel or check status | PUB-001 | W0 |
| EDGE-005 | STATE | Network offline / low bandwidth | Public visitor, Employee/contractor | Offline indicator; cached age; queued drafts; no execute confirmation | Save permitted work and reconnect safely | PUB-001 | W0 |
| EDGE-006 | STATE | Session expired while drafting | Employee/contractor, Client contact, Creator/talent | Session notice; unsaved changes; safe reauth; draft restoration | Sign in again without losing safe draft | CIRC-001 | W1 |
| EDGE-007 | STATE | Authentication attempt rate-limited | Public visitor, Employee/contractor | Retry guidance; lockout window; human support; no account enumeration | Wait or complete approved recovery | CIRC-001 | W1 |
| EDGE-008 | STATE | Permission denied 403 | Employee/contractor, Client contact, Creator/talent | Plain-language denial; no metadata leak; request relevant access | Return to authorized area | CIRC-001 | W1 |
| EDGE-009 | STATE | Record absent for this user | Employee/contractor, Client contact, Creator/talent | No accessible record; safe create/search; support | Locate permitted record without leaking other tenants | CIRC-001 | W1 |
| EDGE-010 | STATE | Source currently stale | Employee/contractor, VMN World Product/QA | Last-updated time; affected action hold; owner; refresh request | Request source revalidation | CIRC-001 | W1 |
| EDGE-011 | STATE | Conflicting active sources | Employee/contractor, VMN World Product/QA | Competing source titles; conflict ID; designated authority; blocked action | Escalate for source precedence decision | CIRC-001 | W1 |
| EDGE-012 | STATE | Required source not verified | Employee/contractor, VMN World Product/QA | Unknown owner/system; no fabricated data; alternative route | Complete source discovery before acting | CIRC-001 | W1 |
| EDGE-013 | STATE | Current SOP withdrawn | Employee/contractor | Archived source; replacement; invalidated action; acknowledgment | Open approved replacement | CIRC-001 | W1 |
| EDGE-014 | STATE | Missing accountable owner | Employee/contractor, Mission Owner | No A/backup; direct human assignment; affected mission paused | Request actual owner assignment | CIRC-001 | W2 |
| EDGE-015 | STATE | Approval waiting for human | Employee/contractor, Mission Owner | Required checker; request date; status; no approved label | Track legitimate pending decision | CIRC-001 | W2 |
| EDGE-016 | STATE | Approval signature rejected or expired | Employee/contractor, Mission Owner | Reason; current delegator; re-sign request; safe hold | Seek a valid independent approval | CIRC-001 | W2 |
| EDGE-017 | STATE | Rights use prohibited | Employee/contractor, Producer/ONE Studios | Affected asset/version; use dimensions; denied gate; Rights reviewer | Change use or obtain lawful rights | CIRC-001 | W2 |
| EDGE-018 | STATE | Payment execution result unknown | Employee/contractor, Finance/controller | Original idempotency ID; source reconciliation; no duplicate action | Ask Finance to verify the transaction outcome | SYS-001 | W4 |
| EDGE-019 | STATE | Payment failed or reversed | Client contact, Creator/talent, Finance/controller | Provider status; refund/receivable; human support; actual reference | Resolve a legitimate financial failure | SYS-001 | W3 |
| EDGE-020 | STATE | Duplicate write or request in progress | Employee/contractor, Client contact | Original request reference; safe wait/status check; no blind retry | Track original operation | CIRC-001 | W2 |
| EDGE-021 | STATE | Concurrent edit conflict | Employee/contractor, Editor/publisher | Old/new record version; diff; refresh; save-as-draft | Review changed source before resubmitting | CIRC-001 | W2 |
| EDGE-022 | STATE | Versioned asset or title expired | Public visitor, Employee/contractor | Expiry; unavailable content; current permitted title link | Use valid content route | PUB-001 | W0 |
| EDGE-023 | STATE | File upload disallowed or quarantined | Public visitor, Employee/contractor | Type/size/security error; no public metadata; safe replace | Provide a permitted document | PUB-001 | W0 |
| EDGE-024 | STATE | System data partial or missing | Executive/Board adviser, Finance/controller, Employee/contractor | Coverage and denominator; fields marked missing; pending source | Request verified data rather than infer zero | CIRC-001 | W1 |
| EDGE-025 | STATE | External provider callback delayed | Public visitor, Employee/contractor, Client contact | Requested vs provider-confirmed; retry status; support case | Check truthful pending outcome | SYS-001 | W3 |
| EDGE-026 | STATE | Broadcast export without actual as-run | Broadcast operator, Traffic/scheduling controller | Export proof type; missing transmission event; discrepancy owner | Avoid false proof-of-air | SYS-001 | W3 |
| EDGE-027 | STATE | Broadcast as-run wrong revision | Broadcast operator, Traffic/scheduling controller | Mismatched IDs; required human reconciliation; audit | Resolve or quarantine evidence | SYS-001 | W4 |
| EDGE-028 | STATE | Unverified Azeebo+ destination | Public visitor, Audience/fan | No clickable unsupported deep link; informational fallback | Use verified support rather than false CTA | PUB-001 | W0 |
| EDGE-029 | STATE | Age-restricted access denied | Public visitor, Candy Cast applicant | Neutral access refusal; approved eligibility/support; no restricted previews | Return to allowed public information | PUB-001 | W0 |
| EDGE-030 | STATE | Consent revoked or purpose changed | Employee/contractor, Client contact, Creator/talent, Candy Cast applicant | Consent history; blocked reuse; re-consent if lawful; data rights | Choose a permitted new purpose or withdraw | SYS-001 | W3 |
| EDGE-031 | STATE | Company brand not launched | Public visitor | Owner-defined brand remit; proposed status; safe contact link | Enquire without expecting live stream/product | PUB-001 | W0 |
| EDGE-032 | STATE | Programme cohort delayed or cancelled | Applicant, Learner | Actual organiser; participant continuity; refunds/rights; next steps | Follow lawful remediation options | SYS-001 | W3 |
| EDGE-033 | STATE | Talent opportunity withdrawn | Creator/talent | Withdrawn brief; signed obligations; alternative search; dispute route | Review changes and retain applicable pay rights | SYS-001 | W3 |
| EDGE-034 | STATE | Cash capacity not validated | Mission Owner, CFO/treasury approver | Missing bank/AR/AP/tax; HOLD; permitted contingency | Pause recurring commitments and supply evidence | SYS-001 | W4 |
| EDGE-035 | STATE | Critical incident protective pause | Employee/contractor, Security/IT administrator | Impact; status; restricted incident route; safe fallback | Stop affected unsafe activity | SYS-001 | W4 |
| EDGE-036 | STATE | Platform rollback successful but actions unreconciled | Cr8Tech/engineering, Finance/controller, VMN World Product/QA | Prior stable build; pending operations; reconciliation queue; human owner | Reconcile incomplete external actions | SYS-001 | W4 |
| EDGE-037 | STATE | User requests data export or deletion under hold | Public visitor, Employee/contractor | Data-rights form; legal-retention exception; lawful human review | Seek a governed privacy response | SYS-001 | W3 |
| EDGE-038 | STATE | Accessibility barrier blocks essential task | Public visitor, Employee/contractor | Alternate accessible route; support; error reporting; remediation case | Complete task safely through equivalent route | PUB-001 | W0 |
| EDGE-039 | STATE | Insufficient permission for shared/tenant file | Employee/contractor, Partner | Access denial; current owner; case ID; no document titles leaked | Request scoped file authorization | CIRC-001 | W1 |
| EDGE-040 | STATE | Expired licence, permit or legal authority | Employee/contractor, Mission Owner | Affected action; source date; renewer; required checker | Stop affected release and seek renewal | SYS-001 | W4 |
| EDGE-041 | STATE | User action requires verified independent reviewer | Employee/contractor, Mission Owner, Finance/controller, Legal counsel | Requested action; independent checker absence; paused state; alternative route | Preserve request until a competent independent reviewer is available | CIRC-001 | W2 |
| EDGE-042 | STATE | Downstream schema incompatible after provider upgrade | Cr8Tech/engineering, VMN World Product/QA, Security/IT administrator | Schema diff; connector version; test results; disable/rollback status | Disable an unsafe integration and launch fallback | SYS-001 | W4 |
| EDGE-043 | STATE | Contributor work accepted but settlement still outstanding | Creator/talent, Finance/controller, Mission Owner | Accepted work; contractual pay date; unpaid balance; dispute/assistance | Escalate a protected unpaid creator entitlement | SYS-001 | W3 |
| EDGE-044 | STATE | Permission valid in one relationship but denied in another | Employee/contractor, Creator/talent, Partner, Client contact | Current identity relation; denied scope; safe switch; help route | Switch to a genuinely authorised relationship or seek review | CIRC-001 | W1 |




### J02a · Individually addressable brand pages (one reusable template)

35 exact name/ID public page instances, sharing BRD-006 with distinct source data.

| Screen ID | UI surface | Screen / view / state | User role(s) | Core UI components | Primary user action | Route or host | Release gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BRI-001 | CONTENT_INSTANCE | Brand detail: TEN Urban | Public visitor, Audience/fan | BRD-006 canonical template; ID TEN-01; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-002 | CONTENT_INSTANCE | Brand detail: TEN Naija | Public visitor, Audience/fan | BRD-006 canonical template; ID TEN-02; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-003 | CONTENT_INSTANCE | Brand detail: TEN Orisun | Public visitor, Audience/fan | BRD-006 canonical template; ID TEN-03; owner-approved remit; actual service/operating status; safe context CTA; map verified existing Orisun/Isi Mbido service ID, no duplicate inventory | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-004 | CONTENT_INSTANCE | Brand detail: TEN Isi Mbido | Public visitor, Audience/fan | BRD-006 canonical template; ID TEN-04; owner-approved remit; actual service/operating status; safe context CTA; map verified existing Orisun/Isi Mbido service ID, no duplicate inventory | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-005 | CONTENT_INSTANCE | Brand detail: TEN Tushe | Public visitor, Audience/fan | BRD-006 canonical template; ID TEN-05; owner-approved remit; actual service/operating status; safe context CTA; Hausa remit only; no certified channel | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-006 | CONTENT_INSTANCE | Brand detail: TEN Prime | Public visitor, Audience/fan | BRD-006 canonical template; ID TEN-06; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-007 | CONTENT_INSTANCE | Brand detail: TEN Movies | Public visitor, Audience/fan | BRD-006 canonical template; ID TEN-07; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-008 | CONTENT_INSTANCE | Brand detail: TEN News | Public visitor, Audience/fan | BRD-006 canonical template; ID TEN-08; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-009 | CONTENT_INSTANCE | Brand detail: TEN Originals | Public visitor, Audience/fan | BRD-006 canonical template; ID TEN-09; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-010 | CONTENT_INSTANCE | Brand detail: TEN Events | Public visitor, Audience/fan | BRD-006 canonical template; ID TEN-10; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-011 | CONTENT_INSTANCE | Brand detail: TEN Live | Public visitor, Audience/fan | BRD-006 canonical template; ID TEN-11; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-012 | CONTENT_INSTANCE | Brand detail: Nigezie Xtreme | Public visitor, Audience/fan | BRD-006 canonical template; ID NIG-01; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-013 | CONTENT_INSTANCE | Brand detail: Nigezie Xplore | Public visitor, Audience/fan | BRD-006 canonical template; ID NIG-02; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-014 | CONTENT_INSTANCE | Brand detail: Nigezie Revolution | Public visitor, Audience/fan | BRD-006 canonical template; ID NIG-03; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-015 | CONTENT_INSTANCE | Brand detail: Nigezie Reality | Public visitor, Audience/fan | BRD-006 canonical template; ID NIG-04; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-016 | CONTENT_INSTANCE | Brand detail: Nigezie Live | Public visitor, Audience/fan | BRD-006 canonical template; ID NIG-05; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-017 | CONTENT_INSTANCE | Brand detail: Nigezie Originals | Public visitor, Audience/fan | BRD-006 canonical template; ID NIG-06; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-018 | CONTENT_INSTANCE | Brand detail: Nigezie Next Wave | Public visitor, Audience/fan | BRD-006 canonical template; ID NIG-07; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-019 | CONTENT_INSTANCE | Brand detail: Candy Ville | Public visitor, Audience/fan | BRD-006 canonical template; ID CTV-01; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-020 | CONTENT_INSTANCE | Brand detail: Candy Store | Public visitor, Audience/fan | BRD-006 canonical template; ID CTV-02; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-021 | CONTENT_INSTANCE | Brand detail: Candy Models | Public visitor, Audience/fan | BRD-006 canonical template; ID CTV-03; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-022 | CONTENT_INSTANCE | Brand detail: Candy Reality | Public visitor, Audience/fan | BRD-006 canonical template; ID CTV-04; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-023 | CONTENT_INSTANCE | Brand detail: Candy Play | Public visitor, Audience/fan | BRD-006 canonical template; ID CTV-05; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-024 | CONTENT_INSTANCE | Brand detail: Candy Confessions | Public visitor, Audience/fan | BRD-006 canonical template; ID CTV-06; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-025 | CONTENT_INSTANCE | Brand detail: Candy Style | Public visitor, Audience/fan | BRD-006 canonical template; ID CTV-07; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-026 | CONTENT_INSTANCE | Brand detail: Candy Street | Public visitor, Audience/fan | BRD-006 canonical template; ID CTV-08; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-027 | CONTENT_INSTANCE | Brand detail: Candy Plus | Public visitor, Audience/fan | BRD-006 canonical template; ID CTV-09; owner-approved remit; actual service/operating status; safe context CTA; subscription proposition, no unapproved price or checkout | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-028 | CONTENT_INSTANCE | Brand detail: Candy Live | Public visitor, Audience/fan | BRD-006 canonical template; ID CTV-10; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-029 | CONTENT_INSTANCE | Brand detail: Candy Cast | Public visitor, Audience/fan | BRD-006 canonical template; ID CTV-11; owner-approved remit; actual service/operating status; safe context CTA; separate consented age-verified casting route | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-030 | CONTENT_INSTANCE | Brand detail: Candy Academy | Public visitor, Audience/fan | BRD-006 canonical template; ID CTV-12; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-031 | CONTENT_INSTANCE | Brand detail: Games Radio | Public visitor, Audience/fan | BRD-006 canonical template; ID G360-01; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-032 | CONTENT_INSTANCE | Brand detail: Games TV | Public visitor, Audience/fan | BRD-006 canonical template; ID G360-02; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-033 | CONTENT_INSTANCE | Brand detail: Games Bet | Public visitor, Audience/fan | BRD-006 canonical template; ID G360-03; owner-approved remit; actual service/operating status; safe context CTA; separately regulated product, no ordinary wallet or live booking | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-034 | CONTENT_INSTANCE | Brand detail: Games Lotto | Public visitor, Audience/fan | BRD-006 canonical template; ID G360-04; owner-approved remit; actual service/operating status; safe context CTA; separately regulated product, no ordinary wallet or live booking | Read the brand profile and follow only a verified action | BRD-006 | W0 |
| BRI-035 | CONTENT_INSTANCE | Brand detail: Games Community | Public visitor, Audience/fan | BRD-006 canonical template; ID G360-05; owner-approved remit; actual service/operating status; safe context CTA | Read the brand profile and follow only a verified action | BRD-006 | W0 |




## Role and source-permission model

The 51 role labels below are persona groups only. Real system access derives from current employment/client/partner relationships, tenant, purpose, source permissions, human authority and applicable source evidence. No row preapproves read/write authority merely because the user is a “CFO”, “Builder”, “Brand Steward” or “ADMIN”.

| Role ID | Design persona | Addressable surfaces (not permission grants) |
| --- | --- | --- |
| PUB | Public visitor | 134 |
| FAN | Audience/fan | 63 |
| APP | Applicant | 17 |
| LEARN | Learner | 37 |
| ALUM | Alumni | 2 |
| TAL | Creator/talent | 60 |
| CAST | Candy Cast applicant | 15 |
| CLI | Client contact | 91 |
| SPO | Sponsor | 13 |
| PART | Partner | 50 |
| TRAIN | Training partner | 11 |
| RIGHTSH | Rights holder | 7 |
| DIST | Distributor/buyer | 5 |
| VEN | Venue/vendor | 6 |
| EMP | Employee/contractor | 93 |
| BUIL | Builder | 12 |
| SOLV | Problem Solver | 6 |
| COACH | Coach/mentor | 11 |
| MO | Mission Owner | 36 |
| CAP | Capability Lead | 21 |
| HUB | Hub resource coordinator | 14 |
| COM | Commercial/BD | 16 |
| MARK | Marketing/PR | 9 |
| BRAND | Brand Steward | 23 |
| EDITOR | Editor/publisher | 26 |
| PROD | Producer/ONE Studios | 34 |
| EVENT | Fusion Events operator | 14 |
| AFCA | AFCA academic authority | 8 |
| ACC | Talent Accelerator operator | 6 |
| VTM | VTM Marketplace operator | 8 |
| VCF | VCF creator operator | 2 |
| BCAST | Broadcast operator | 22 |
| TRAFF | Traffic/scheduling controller | 19 |
| MCR | Master control engineer | 7 |
| RIGHTS | Rights/IP officer | 23 |
| TEND | TEND licensing officer | 12 |
| FIN | Finance/controller | 56 |
| CFO | CFO/treasury approver | 19 |
| LEGAL | Legal counsel | 51 |
| DPO | Privacy officer | 11 |
| PEOPLE | People & Culture | 12 |
| EXEC | Executive/Board adviser | 21 |
| KNOW | Knowledge steward | 11 |
| SEC | Security/IT administrator | 25 |
| ENG | Cr8Tech/engineering | 24 |
| AGENT | AI/AgentOps owner | 7 |
| PRODCT | VMN World Product/QA | 21 |
| AZP | Azeebo+ Product (external authority) | 1 |
| SUP | Customer/support operator | 4 |
| AUDIT | Independent auditor/QA | 18 |
| ADMIN | Platform tenant administrator | 4 |




## Source domains: Register S and legitimate decisions

| Source ID | Domain | Competent human owner | Record | Prohibited assumption |
| --- | --- | --- | --- | --- |
| S-GOV-01 | Corporate decisions and reserved matters | Company Secretary/CEO / actual Board | Board/DoA decision and effective authority | No guessed signatures or Board consent |
| S-FIN-01 | General ledger, bank, treasury, AR/AP | CFO / Treasury | Ledger, matched bank and cash capacity | No false cash/settlement or hidden liabilities |
| S-COM-01 | CRM, business development, client orders | Commercial lead | Executed scope, customer and orders | Proposal/lead is not accepted deal |
| S-LEG-01 | Contracts, rights and privacy opinions | Legal/Rights/Privacy | Executed instrument, title/asset rights, notice | No unsigned licence expansion |
| S-PPL-01 | Employment, personal cases, pay | People & Culture | Employment and restricted personnel | No open Circle salary/welfare search |
| S-PRD-01 | Azeebo+ consumer service and entitlements | Azeebo+ Product/Engineering | Consumer product route, catalog, entitlement | Click is not verified purchase |
| S-IT-01 | Technology and security/agent OS | Cr8TechNG/Security | IAM/connector/agent/release | No agent permission escalation |
| S-HSP-01 | HeadspaceNG research and assumptions | HeadspaceNG lead | Research outputs and methods | Advice is not an approved spend |
| S-HUB-01 | Hub Circle mission/capacity resources | Hub/Circle Capacity steward | Mission, capacity and facilities | No duplicate employment authority |
| S-AFC-01 | Academic assessment and safeguarding | AFCA independent authority | Learning/assessment/welfare | Sponsor cannot rewrite grades |
| S-VCF-01 | VMN Creator Factory production | VCF owner | Creator engagement, output/QC | No automatic copyright acquisition |
| S-VTM-01 | VMN Talent Marketplace | VTM owner/Finance | Talent profile, paid booking/statement | Profile is not credential/pay receipt |
| S-ONE-01 | ONE Studios media assets and QC | ONE producer | Masters, source files and delivery | Master custody != worldwide exploitation |
| S-FUS-01 | Fusion Events production and safety | Fusion Events/Safety | Venue/supplier/safety obligations | No unapproved venue/safety GO |
| S-TND-01 | TEND licensing/royalty sources | TEND+Legal/Finance | Title, licence, buyer statements | TEND not TEN, no unowned catalogue |
| S-BRC-01 | Broadcast service, EPG/traffic/planning/as-run | Broadcast Operations/Traffic | Channels, schedule revision, EPG/playlist/as-run | No EPG export as proof-of-air |




## Reusable component library

A production-ready design system should implement these shared contracts rather than handcraft them for every route. The component count is a **proposed system** pending review of actual code, design tokens and existing UI libraries.

| Component ID | Reusable component | Category | Input fields | Primary interaction | Accessibility/control |
| --- | --- | --- | --- | --- | --- |
| CMP-001 | App shell and realm selector | navigation | brand, organisation, relationship, source status | role switch and contextual navigation | Keyboard skip link; avoids role union |
| CMP-002 | Canonical brand card | public/catalogue | BrandRef id, name, family, remit, service state | Open approved profile | Status text not colour-only |
| CMP-003 | Brand/service truth badge | trust | design/operational status, observed timestamp | Distinguish defined vs live | Live label requires evidence |
| CMP-004 | Source provenance badge | trust | source ID, version, effective date, owner | Inspect verified basis | Does not leak protected source title |
| CMP-005 | Contextual verified CTA | navigation | permitted action, route, approval, fallback | Navigate or enquire lawfully | Disabled when unverified |
| CMP-006 | Public query facets | search | category, family, locale, rights, date | Filter searchable approved content | No restricted search suggestions |
| CMP-007 | Accessible contact form | intake | privacy notice, field validation, case reference | Submit legitimate enquiry | Retry idempotent; own data only |
| CMP-008 | Authenticated relationship switcher | identity | relationship ID, tenant, purpose, expiry | Switch verified context | No permission union by same email |
| CMP-009 | MFA/step-up challenge | identity | actual session, action scope, recovery | Re-verify identity for specific effect | Never bypass human DoA |
| CMP-010 | Invitation and tenant member list | identity | signed company/tenant, member roles, expiry | Invite/revoke access | Least privilege, no other tenant members |
| CMP-011 | Privacy and consent ledger | privacy | purpose, basis, opt-in/out, retention and history | Change scoped choice | Cast consent != Plus consent |
| CMP-012 | Case/issue and complaint record | workflow | case ID, complaint, owner, evidence, status | Track review or appeal | No default auto-dismissal |
| CMP-013 | SOP source detail | knowledge | SOP ID/revision, Register S, owner, current status | Find approved procedure | Withdrawn SOP never executable |
| CMP-014 | Cited Ask VMN answer | AI | permitted sources, quotes, version, confidence/abstain | Read/challenge grounded answer | No unauthorised context or unsafe instruction |
| CMP-015 | Source conflict resolver | knowledge | candidate authoritative docs, current jurisdiction | Route to competent human | No model-as-final-judge |
| CMP-016 | Mission work card | mission | accountable owner, scope, state, capacity, blockers | Work accepted assignment | Task open != delivered |
| CMP-017 | Mission detail timeline | mission | accepted handoffs, evidence, requester, receiver | Perform and verify work | Clear rework/acceptance split |
| CMP-018 | Human approval decision card | approval | delegation, actor, checker, scope, evidence | Approve/hold/reject request | Final source acknowledgement mandatory |
| CMP-019 | Protected assignment selector | people | availability, consent, working hours, profile scope | Assign staff lawfully | No private health data |
| CMP-020 | Rights use matrix | rights | asset/cut, territory, term, use, chain-of-title | Evaluate actual permitted use | Unknown/expired = HOLD |
| CMP-021 | Content publication review | editorial | approved copy version, claims, rights, locale | Review permitted publication | Brand copy != operating service |
| CMP-022 | Production master QC card | media | source hashes, captions, sound, rights, receiver | Accept deliverable master | Custody != distribution |
| CMP-023 | Broadcast schedule status | broadcast | schedule ID/revision, rights, as-run link | Review intended schedule | No scheduled == aired |
| CMP-024 | As-run evidence checker | broadcast | original log, service/channel, provider proof, revision | Verify transmission | Wrong revision cannot pass |
| CMP-025 | Cash and accounting status card | finance | bank/date, AR/AP, cash vs invoice, source status | Inspect truthful money state | No cash claim with missing bank |
| CMP-026 | Maker-checker payment form | finance | source request, DoA, beneficiary, bank verification | Approve transfer request | No self-approval or duplicate |
| CMP-027 | Client/project acceptance card | commercial | contract, deliverable, receiver, version | Accept bounded client output | No accepted == paid |
| CMP-028 | Talent/creator booking terms | talent | buyer, creator, rights, pay, accepted scope | Contract qualified engagement | No guaranteed work on profile claim |
| CMP-029 | Academic assessment and appeal | academy | rubric, two assessors, welfare/appeal separations | Verify credential fairly | Sponsors cannot change grades |
| CMP-030 | Candy 18+ eligibility and consent | casting | identity/age eligibility, audition scope, publicity choices | Submit private eligible portfolio | No auto transfer to Plus |
| CMP-031 | Azeebo+ verified referral | boundary | L1 route, tested target, fallback, provider callback | Leave to separate consumer app | No click == purchase |
| CMP-032 | Role and permission matrix | security | source domain, role, purpose, expiry | Review actual access rights | Persona label not permission grant |
| CMP-033 | Source Registry status card | integration | REG-S ID, owner, environment, freshness, scopes | Review connector readiness | Unknown != Connected |
| CMP-034 | Agent execution provenance | AI/security | agent level A0–A5, source, tools, cost, confirmation | Investigate generated action | No success on tool attempt |
| CMP-035 | Release approval manifest | release | scope, build SHA, QA, human signers, fallback | Approve one deployable slice | Cannot use overall document signoff as GO |
| CMP-036 | Loading, empty and denied state | system | original action, source status, owner, recovery | Recover or seek support | Error never discloses private entity existence |
| CMP-037 | Responsive paginated data table | system | column labels, sorting, filters, data age | Inspect large business records | Mobile cards with same data |
| CMP-038 | Secure attachment upload | files | content type, size, scan, source, rights, deletion | Attach permitted evidence | Quarantine unsafe files |
| CMP-039 | Notification and acknowledgement | workflow | purpose, channel, actor, observed state | Read/acknowledge a notice | Receipt not binding signature |
| CMP-040 | Restricted legal case panel | legal | parties, case owner, holds, privileged notes | Review authorised matter | No privilege leak |
| CMP-041 | Tax applicability decision | finance/legal | entity, transaction date, rule version and reviewer | Approve period-specific treatment | No silent retroactive law |
| CMP-042 | Feature flag and rollback review | release | environment, audience, active state, kill switch | Stage/disable a feature | Flag not legal approval |
| CMP-043 | Data-subject request tracker | privacy | identity proof, purpose, action, exception | Resolve rights request lawfully | Protect legal hold |
| CMP-044 | Recovery/incident timeline | incident | severity, actor, source, compensation, stop and restore | Escalate and remediate an incident | No false all-clear |
| CMP-045 | Cash capacity safe-mode | finance | bank actual, protected liabilities, reserve, status | Determine CFO signoff readiness | Missing inputs => HOLD |
| CMP-046 | Consent scoped media release | rights/casting | performer, media, synthetic, term, territory, fee | Request explicit use permission | No broad replica grant |
| CMP-047 | Partner branding and sponsor claim gate | partner/editorial | contracted party, brand/logo rights, proof and status | Approve truthful sponsor claim | Lead != signed partner |
| CMP-048 | Event safety and cancellation panel | events | venue, staff, supplier, safety and customer refunds | Approve bounded operation | Unsafe/funded gap remains blocked |




## Eighteen connected golden journeys

Each golden journey must be prototyped, observed with eligible users, validated against actual source permissions and independently tested for the adverse scenario. A written positive path is not performed UAT.

| Flow | Persona | Connected screen path | Proof of success | Adverse path / non-negotiable | Domain owner | Gate |
| --- | --- | --- | --- | --- | --- | --- |
| FLOW-01 | Public visitor | PUB-001 → BRD-001 → BRI-005 → LEAD-001 → LEAD-009 | TEN Tushe definition-only, safe enquiry | No watch/booking CTA for unverified channel | Group Brand Publisher / Commercial | W0 |
| FLOW-02 | Fan | STW-001 → STW-005 → STW-006 → STW-008 → STW-009 | Permitted public world info, verified L1 only | Unverified route or rights geo restriction safely prevents false viewing | IP Owner / Azeebo+ Product | W0/W3 |
| FLOW-03 | Client | LEAD-002 → CLT-001 → CLT-006 → CLT-011 → CLT-013 → CLT-015 | Qualified accepted deliverable and distinct invoice/receipt states | Contract unsigned, rights missing, late payment or duplicate cannot show paid | Commercial / Finance / Legal | W0/W3/W4 |
| FLOW-04 | Partner/sponsor | PART-002 → PART-006 → PART-009 → PART-010 → PART-022 | Approved sponsor logo, actual fulfilled benefit | Unawarded grant, unsigned logo rights or booked-not-aired spot remains unclaimed | Partnerships / Legal / Broadcast | W3/W4 |
| FLOW-05 | Learner | LEARN-003 → LEARN-010 → LEARN-014 → LEARN-017 → LEARN-018 → LEARN-029 | Independent assessed and appealable academic record | Sponsor cannot alter grade or view protected welfare source | AFCA Academic Authority | W3/W4 |
| FLOW-06 | Creator/talent | TAL-002 → TAL-008 → TAL-014 → TAL-015 → TAL-018 → TAL-028 | Funded contract, accepted work, separately verified payment | Bank change cannot redirect paid settlement; profile not academic credential | VTM / Finance / Rights | W3/W4 |
| FLOW-07 | Candy applicant | CAND-001 → CAND-002 → CAND-005 → CAND-009 → CAND-020 | 18+ eligibility, private fair review, separate uses | No Cast result automatically grants Candy Plus, publicity or synthetic rights | Candy / Privacy / Legal | W0/W3/W4 |
| FLOW-08 | Employee | AUTH-001 → CIRC-001 → CIRC-009 → CIRC-010 → CIRC-013 | Current effective source and permitted next task | Old SOP/test NOT RUN or inaccessible attachment blocks consequential action | Knowledge / Domain Process Owner | W1/W2 |
| FLOW-09 | Mission Owner | MISS-002 → MISS-003 → MISS-006 → MISS-007 → MISS-016 → MISS-004 → MISS-024 | Human accountable mission, capacity, rights/Finance gates, accepted output | Expired DoA or lost A freezes execute; wrong source state remains pending | Circle / People / Domain owner | W2/W4 |
| FLOW-10 | Rights publisher | IPR-003 → IPR-005 → IPR-007 → IPR-024 → CMS-008 | Exact use permission and downstream revocation invalidation | Revoked/expired music blocks all impacted digital/social/TV uses | Rights / IP / Legal | W4 |
| FLOW-11 | Broadcast operator | BRC-002 → BRC-008 → BRC-009 → BRC-012 → BRC-013 → BRC-016 → BRC-026 | Schedule vs EPG/playlist vs as-run verifiably distinct | Exported playlist with no as-run never becomes proof-of-air | Broadcast / Traffic / Rights | W3/W4 |
| FLOW-12 | CFO | FIN-013 → FIN-014 → FIN-032 → FIN-016 → FIN-025 → FIN-026 | Bank verified and protected liability-reserve cash certificate | Historical AR and empty cash input cannot authorize hiring or CAPEX | CFO / Finance / Board reserved | W3/W4 |
| FLOW-13 | Legal/People | GOV-008 → GOV-010 → GOV-034 → GOV-011 → GOV-012 | Actual legal party, final signed contract, effective conditions | Board approval missing; draft contract does not become binding | Legal / Company Secretary | W3/W4 |
| FLOW-14 | DPO | GOV-022 → GOV-023 → GOV-032 → GOV-033 | Lawful data request with identity and hold rules | Do not delete evidence under active litigation hold or disclose another identity | DPO / Legal / Security | W0/W3/W4 |
| FLOW-15 | AI/Security | SYS-002 → SYS-012 → SYS-014 → SYS-032 → SYS-023 → SYS-024 | A0–A5 restrictions, source state, tested emergency rollback | Prompt injection or no source authority cannot expand tool permissions | Agent OS / Security / Product | W1/W4 |
| FLOW-16 | Production/Event team | STUD-001 → STUD-007 → STUD-023 → STUD-016 → EVNT-007 → EVNT-016 | Accepted production and safe event rights/financial closure | Safety/venue/music/likeness rights prevent unapproved release | ONE / Fusion / Rights / Safety | W3/W4 |
| FLOW-17 | Product/QA | SYS-022 → SYS-025 → SYS-031 → SYS-033 → SYS-023 → SYS-024 | Traceable build, accessibility, negative tests, rollback and signed GO | Undefined SLO and unperformed UAT cannot show released | Product / Independent QA | W2/W4 |
| FLOW-18 | Commercial/Finance | FIN-002 → FIN-003 → FIN-006 → FIN-032 → FIN-017 → FIN-030 | One external contract-to-cash and consolidated source-backed actual | Multi-brand reporting must not duplicate revenue; bad debt not bank cash | CFO / Commercial | W3/W4 |




## Release gates and secure operating rules

| Gate | Scope | Permission logic | Evidence | Forbidden shortcuts | Approval authority |
| --- | --- | --- | --- | --- | --- |
| W0 | Approved public identity / informational website | Anonymous published information, accessible contact only | Brand editorial source, privacy notice, actual published status | No shopping, watcher entitlement or invented operating status | Public Brand Steward + Product |
| W1 | Authenticated internal read-only knowledge | Identity + actual relationship + purpose; source-scope read | Signed SOP effective status, Register S discovery and sensitive restrictions | No authority inferred from contribution modes or RAG answer | People + Source Owner + Security |
| W2 | Governed Circle mission execution | Named accountable Mission Owner, accepted capability, source state | Signed applicable work/handoff rules and actual independent decision gates | No autonomous pay, contract, employment or rights approval | Circle Lead + Capability + Domain Controller |
| W3 | Professional portal / verified external referral | Independent buyer/partner/learner/creator relationships and tenancy | Actual contract/eligibility/consent, verifiable service and referral | No consumer account merge, payment or wrong-tenant disclosure | Specialist Owner + Product + Privacy |
| W4 | Consequential or externally effective operation | Verified signed DoA + maker/checker + source/version and target system | Observed negative tests, recovery, rollback and domain-specific GO | Role/persona title not sufficient; no source-less or model-made approvals | Executive authority + named Domain Controller + QA |
| W5 | Separate proposed future capability | Additional future product/market decision | New PRD, feasibility, privacy/security, rights and commercial approval | No implementation or live CTA by implication | Product Sponsor / Board if reserved |
| G | Conditional specialist feature requiring separate gate | Specific eligibility, content, consumer, legal and product ownership | Actual released host/catalogue/payment/rights and verified purpose | No conditional option live by being listed in an IA | Specific specialist / Legal / Product / Finance |




## Original R1.3C S01–S30 screen-family crosswalk

| Baseline | Screen family | Mapped R1.0 IDs | Intended implementation |
| --- | --- | --- | --- |
| S01 | VMN Home | PUB-001 | Public corporate home and approved next-action routes |
| S02 | Unit Page | SERV-002–SERV-012 | Canonical specialist unit profile templates and statuses |
| S03 | Public Discovery | SERV-001, SERV-013, TAL-007, PUB-013 | Service/programme/talent/public-search facets |
| S04 | External Workspace | CLT-001, PART-001, LEARN-010, TAL-005 | Relationship-scoped client/partner/learner/talent workspaces |
| S05 | Circle Home | CIRC-001 | Personal Circle authenticated home |
| S06 | Ask VMN | CIRC-005–CIRC-007 | Cited, role-scoped knowledge and challenge action |
| S07 | Mission Create/Detail | MISS-003–MISS-006 | Business objective, accountable owner, budget/rights and staffing |
| S08 | My Missions & Tasks | MISS-001, MISS-010, MISS-011 | Task board, accepted assignments and evidence |
| S09 | Capabilities & Capacity | CIRC-021–CIRC-022, CAP-001–CAP-007 | Professional scope, availability and arbitration |
| S10 | Decisions & Approvals | MISS-016–MISS-020, GOV-002 | Human delegated approvals, expired/suspension variants |
| S11 | Knowledge & SOPs | CIRC-008–CIRC-020 | 161 SOP search, provenance, effective status and activation tests |
| S12 | Specialist Workbench | STUD-001, PART-019, LEARN-026, TAL-025, IPR-013 | Source-owned specialist tasks by role |
| S13 | Broadcast View | BRC-001–BRC-025 | Verified service registry, rights, schedule/EPG/as-run evidence |
| S14 | Azeebo+ Gateway | STW-008–STW-012 | Verified external consumer route and fallback |
| S15 | Cases/Incidents | GOV-026, SYS-029, CIRC-027 | Case severity, limited evidence and human owner |
| S16 | Executive Scorecard | FIN-001, FIN-017, SYS-022 | Commercial, cash, rights, quality, capacity and AI costs |
| S17 | Admin / Source Governance | SYS-001–SYS-030 | Role/source/agent/release administration |
| S18 | Brand Family Explorer | BRD-001–BRD-005 | 35 owner-defined family/brand names and honest status |
| S19 | Brand Detail + Service Identity | BRD-006–BRD-009, BRI-001–BRI-035 | One reusable detail template and 35 page instances |
| S20 | Original Storyworlds Portfolio | STW-001–STW-007 | Four peer worlds and title detail routes |
| S21 | Mission Template Selector | MISS-002 | Sixteen operating playbooks with SOP/authority prerequisites |
| S22 | SOP Detail + Activation Evidence | CIRC-010–CIRC-014 | 161 SOP IDs and 94 procedure-specific test controls |
| S23 | Register S & Connector Health | SYS-002–SYS-008 | Sixteen source domains and actual connector evidence |
| S24 | Source Conflict Resolution | CIRC-019–CIRC-020, SYS-018 | Competing authority/expired citation and correction |
| S25 | Rights Evaluation / Release Candidate | IPR-005–IPR-009, BRC-009–BRC-010 | Use-specific rights gate, exact version and denied release |
| S26 | Editorial / Brand Publishing Workflow | CMS-001–CMS-014 | Versioned content, claims and human publishing |
| S27 | Participant-to-Work Progress | LEARN-010–LEARN-028, TAL-005–TAL-024 | Academic, verified talent, paid work separate stages |
| S28 | Candy Cast Specialist Portal | CAND-002–CAND-013 | Private casting, adult eligibility and distinct consent |
| S29 | Candy Plus Information / Release Gate | CAND-014–CAND-018 | Proposition informational until separate product release |
| S30 | Cross-brand Outcome Board | FIN-001, FIN-017, MISS-025–MISS-027 | No double-counting, direct evidence and actual cash |




## Revision register: targeted additions

| ID | Journey | New screen/state | Reason for addition | Human owner | Gate |
| --- | --- | --- | --- | --- | --- |
| PUB-021 | J01 · Public company discovery and trust | Public corrections and factual-claim report | A report is a claim to investigate, not an automatic correction or public disclosure. | Group Brand Steward / authorised publisher | W0 |
| PUB-022 | J01 · Public company discovery and trust | Published statement revision history | Only public-approved change summary is disclosed; restricted legal evidence remains private. | Group Brand Steward / authorised publisher | W0 |
| BRD-016 | J02 · Brand families, media identities and sub-brand discovery | Brand-to-service proof and operating-status history | Owner-defined brand must not create duplicate TV services, inventory or revenue. | Group Brand Steward + Broadcast Service Owner | W3 |
| LEAD-018 | J05 · Public enquiries, qualified intake and application handoff | Withdraw or rectify a submitted enquiry | No deletion of lawful records or unrelated buyer information by guess. | Commercial Intake + Privacy | W0 |
| AUTH-021 | J06 · Identity, onboarding, consent and relationship switching | MFA enrolment and recovery setup | Do not display reusable secrets in logs or bypass verification. | Identity / Security + relationship domain owner | W1 |
| AUTH-022 | J06 · Identity, onboarding, consent and relationship switching | Sensitive-action step-up authentication | MFA alone does not grant transaction authority; recheck DoA/record scope. | Identity / Security + relationship domain owner | W4 |
| AUTH-023 | J06 · Identity, onboarding, consent and relationship switching | Professional organisation membership administration | No cross-company account exposure based on matching emails. | Identity / Security + relationship domain owner | W3 |
| AUTH-024 | J06 · Identity, onboarding, consent and relationship switching | Revoke professional tenant invitation or access | No revocation without valid tenant-owner authority; preserve necessary audit. | Identity / Security + relationship domain owner | W4 |
| AUTH-025 | J06 · Identity, onboarding, consent and relationship switching | Account and identity access appeal | Do not reveal other users, confidential role membership or source metadata. | Identity / Security + relationship domain owner | W1 |
| CLT-023 | J07 · Client onboarding, commissioning, delivery and acceptance | Client shared files and permission review | No access to unreleased footage, internal pricing or another customer asset. | Commercial / client contract owner | W3 |
| CLT-024 | J07 · Client onboarding, commissioning, delivery and acceptance | Client workspace member and approver register | Client approver cannot sign outside actual contractual authority. | Commercial / client contract owner | W3 |
| PART-022 | J08 · Sponsors, institutional partners, training providers and organisations | Sponsorship claims evidence and approval tracker | Prospective sponsor cannot be displayed as a contracted or paid partner. | Partnerships / Legal / Finance | W3 |
| PART-023 | J08 · Sponsors, institutional partners, training providers and organisations | Institutional award restrictions and evidence detail | Proposal is not a grant award, bank deposit or spending permission. | Partnerships / Legal / Finance | W3 |
| LEARN-029 | J09 · Accelerator applications, AFCA learning and CLAP progression | Independent academic appeal decision workspace | Sponsor, training partner or model suggestion must not substitute for qualified review. | AFCA independent academic authority + Safeguarding | W4 |
| LEARN-030 | J09 · Accelerator applications, AFCA learning and CLAP progression | Private learner record export and correction request | Never export other learners or disclose private welfare complaints. | AFCA independent academic authority + Safeguarding | W3 |
| TAL-028 | J10 · Creator onboarding, professional marketplace and paid work | Creator beneficiary and bank-change verification | No payment redirection on in-app profile edit alone. | VTM + creator + Finance | W4 |
| TAL-029 | J10 · Creator onboarding, professional marketplace and paid work | Creator voice, face and digital-likeness permissions | Ordinary content participation does not authorise AI replica/training. | VTM + creator + Finance | W3 |
| TAL-030 | J10 · Creator onboarding, professional marketplace and paid work | Dispute earned creator payment or deduction | No automatic withholding of undisputed earned payment. | VTM + creator + Finance | W3 |
| CAND-019 | J11 · Candy Cast, Candy Plus and restricted-consent boundaries | Candy Plus title-level classification and approval detail | Brand positioning is not content classification; unapproved media remain unavailable. | Candy content owner + Privacy/Safeguarding | W4 |
| CAND-020 | J11 · Candy Cast, Candy Plus and restricted-consent boundaries | Casting data withdrawal and retention decision | No reuse in Plus or marketing from an old casting submission. | Candy content owner + Privacy/Safeguarding | W3 |
| CIRC-032 | J12 · ONE CIRCLE home, knowledge, SOP discovery and Ask VMN | Knowledge answer correction case and outcome | No model self-approval of conflicting operating authority. | Knowledge Steward + actual SOP Process Owner | W1 |
| MISS-030 | J13 · Mission framing, staffing, execution, approvals and closure | External action reconciliation and unknown-outcome queue | No PAID/PUBLISHED/TRANSMITTED status from a request or timeout. | Circle Mission Owner + independent domain approvers | W2 |
| MISS-031 | J13 · Mission framing, staffing, execution, approvals and closure | Mission change-impact and reapproval assessment | Prior approval invalid for changed value, territory, asset or scope. | Circle Mission Owner + independent domain approvers | W4 |
| CAP-018 | J14 · Capability leaders, resource management and coaching | Workload safety and capacity-overrun case | Do not expose protected health/leave reasons to unrelated mission roles. | Capability/Home Manager + People | W3 |
| STUD-023 | J15 · ONE Studios, VCF production and professional asset delivery | Production synthetic-media provenance and clearance record | Do not infer voice, face or background music rights from technical possession. | ONE Studios + Rights + Safety | W4 |
| EVNT-018 | J16 · Fusion Events, 9TLIFE, Azeebo+ Live and event operations | Event refund and outstanding liability case | Never mark REFUNDED until actual provider confirmation. | Fusion Events + Safety / Finance | W4 |
| IPR-024 | J17 · IP, storyworld governance, rights and TEND licensing | Rights revocation downstream-impact queue | A previously cleared title cannot remain playable because of cached approval. | Legal/Rights + Property Owner | W4 |
| IPR-025 | J17 · IP, storyworld governance, rights and TEND licensing | Synthetic performer and AI voice-rights clearance | No blanket licence or automatic assignment from generic release form. | Legal/Rights + Property Owner | W4 |
| CMS-021 | J18 · Brand editorial, publishing, media and company content governance | Editorial correction evidence and dependent publication audit | Corrected source must not leave misleading old cards or cached snippets live. | Editorial Publisher + Brand Steward | W4 |
| BRC-026 | J19 · Broadcast scheduling, traffic, transmission and proof-of-air | Independent proof-of-air verification queue | A schedule export or wrong-version as-run cannot satisfy proof-of-air. | Broadcast Operations + Traffic / Rights | W4 |
| FIN-031 | J20 · Finance, commercial performance, treasury and capital controls | Supplier onboarding and beneficiary change verification | No single person submits and approves a beneficiary change. | CFO / delegated Finance + Treasury | W4 |
| FIN-032 | J20 · Finance, commercial performance, treasury and capital controls | Bank-to-ledger reconciliation certificate | Unknown actual cash or unresolved material mismatch cannot be certified. | CFO / delegated Finance + Treasury | W4 |
| FIN-033 | J20 · Finance, commercial performance, treasury and capital controls | Refund, chargeback and provider settlement cases | REQUESTED is not SETTLED; financial reports must reconcile provider results. | CFO / delegated Finance + Treasury | W4 |
| FIN-034 | J20 · Finance, commercial performance, treasury and capital controls | Creator royalty accrual and settlement liability roll-forward | Do not remove earned liabilities because a mission is marked closed. | CFO / delegated Finance + Treasury | W4 |
| FIN-035 | J20 · Finance, commercial performance, treasury and capital controls | Applicable tax period and legal-basis review | Historic 2025 matters not silently reclassified using later effective law. | CFO / delegated Finance + Treasury | W4 |
| GOV-031 | J21 · Legal, People, governance, privacy and formal approvals | Contract obligation and statutory-notice calendar | No draft contract treated as effective obligation without verification. | Company Secretary / Legal / People / DPO | W3 |
| GOV-032 | J21 · Legal, People, governance, privacy and formal approvals | Data-subject request identity and lawful-hold review | No deletion or export of another person’s records on unverified identity. | Company Secretary / Legal / People / DPO | W4 |
| GOV-033 | J21 · Legal, People, governance, privacy and formal approvals | Record retention and litigation-hold release approval | No automatic deletion while valid hold or statutory retention applies. | Company Secretary / Legal / People / DPO | W4 |
| GOV-034 | J21 · Legal, People, governance, privacy and formal approvals | Contract execution conditions-precedent checklist | Partially signed or unmet conditions must not show effective status. | Company Secretary / Legal / People / DPO | W4 |
| SYS-031 | J22 · AI, Cr8Tech, system integrations, product operations and security | Feature-flag rollout and entitlement policy | Feature flag is not a substitute for domain approvals. | Cr8TechNG / Security / Product + domain owner | W4 |
| SYS-032 | J22 · AI, Cr8Tech, system integrations, product operations and security | Agent kill-switch and manual fallback rehearsal | Unknown external action must be reconciled rather than retried blindly. | Cr8TechNG / Security / Product + domain owner | W4 |
| SYS-033 | J22 · AI, Cr8Tech, system integrations, product operations and security | Service-level and accessibility acceptance console | Proposed SLO target or lab success cannot be labelled production-certified. | Cr8TechNG / Security / Product + domain owner | W4 |
| SYS-034 | J22 · AI, Cr8Tech, system integrations, product operations and security | Webhook retry, dead-letter and event-source reconciliation | No duplicate booking, disbursement, rights release or notification. | Cr8TechNG / Security / Product + domain owner | W4 |
| SYS-035 | J22 · AI, Cr8Tech, system integrations, product operations and security | Third-party vendor processing and exit assessment | No source access until actual signed privacy/security/vendor terms. | Cr8TechNG / Security / Product + domain owner | W4 |
| SYS-036 | J22 · AI, Cr8Tech, system integrations, product operations and security | Permissions and delegated-access periodic recertification | Role label or legacy membership does not confer perpetual access. | Cr8TechNG / Security / Product + domain owner | W4 |
| EDGE-041 | J23 · Global edge cases, denial, outage, recovery and safety states | User action requires verified independent reviewer | No auto-approval or implicit consent on staff absence. | Source domain owner + responsible support | W2 |
| EDGE-042 | J23 · Global edge cases, denial, outage, recovery and safety states | Downstream schema incompatible after provider upgrade | No silent parsing of changed financial, rights or personnel fields. | Source domain owner + responsible support | W4 |
| EDGE-043 | J23 · Global edge cases, denial, outage, recovery and safety states | Contributor work accepted but settlement still outstanding | Do not treat completed work or client billing as creator cash-paid. | Source domain owner + responsible support | W3 |
| EDGE-044 | J23 · Global edge cases, denial, outage, recovery and safety states | Permission valid in one relationship but denied in another | Never combine staff, learner, customer and casting permissions. | Source domain owner + responsible support | W1 |




## Unresolved decisions, risks and adoption dependencies

| Decision | Priority | Unknown decision | Actual source owner | Evidence required | Status |
| --- | --- | --- | --- | --- | --- |
| DEC-01 | Critical | Complete original VMN World R1.2 governing PRD clause crosswalk | Product Owner / Document Controller | Full adopted R1.2 body and R1.2A dispositions | OPEN: No supersession declaration |
| DEC-02 | Critical | Confirm actual legal entities, signing authority and active company DoA | Company Secretary / Board | Current signed records; actual approver identities and limits | OPEN: W4 blocked |
| DEC-03 | Critical | Verify the 16 Register S actual vendor systems and sources | Each domain owner + Cr8TechNG | Source system IDs, environments, fields, read/write and fallback | OPEN: No fabricated connector |
| DEC-04 | Critical | Approve the final 51-persona vs real IAM/ABAC mapping | People / DPO / Security / domain owners | Purpose/tenant/object-action permission tests | OPEN: No persona-based default authority |
| DEC-05 | Critical | Verify current public claims, brand/service statuses and domain routes | Group Brand Steward / Broadcast Publisher | 35 source brand records, live service IDs and approved copy | OPEN: Definitions are not channel launches |
| DEC-06 | High | Confirm actual site stack, DNS, design system and deployed routes | Product / Engineering | Repository and environment discovery and owner acceptance | OPEN: Proposed URLs only |
| DEC-07 | High | Choose responsive web/PWA/native app strategy from evidence | Product / Engineering / Business Sponsor | Device/network/accessibility requirements and cost case | OPEN: Do not assume app-store deployment |
| DEC-08 | Critical | Approve separate Candy Cast and Candy Plus privacy, rights and content gates | Candy owner / DPO / Legal | 18+ assessment, catalogue classification, host, provider, payment terms | OPEN: No Plus checkout or automatic reuse |
| DEC-09 | Critical | Verify Broadcast scheduling, rights, EPG, playlist and actual as-run sources | Broadcast / Rights / Traffic | Service, schedule/asset IDs, signed rights, proof source, tested export controls | OPEN: Read-only/shadow before write |
| DEC-10 | Critical | Verify financial and banking current values, protected liabilities and tax | CFO / Treasury / Finance | Current cleared bank, AR/AP, debt, tax, rights/creator payables | OPEN: Historical AR not available cash |
| DEC-11 | High | Confirm Azeebo+ verified external L1 and any L2/L3 contracts | Azeebo+ Product / Privacy | Current tested route per device/territory and conditional federation basis | OPEN: No consumer-app claim |
| DEC-12 | High | Set source-specific SLO, mobile performance and UX test thresholds | Product / Operations / Accessibility | Approved test environments, KPI baselines, users, WCAG tests | OPEN: Candidate targets only |
| DEC-13 | High | Run security, privacy, prompt-injection, fraud and rights negative suite | Security/QA / DPO / Domain Owner | Observed fixtures, source versions, test result and independent signoff | NOT RUN |
| DEC-14 | High | Adopt per-slice W0/W1/W2/W3/W4 release manifest and rollback | Product / Specialist Owners | Build SHA, signed GO/NO-GO, support owner, rollback test | OPEN: No blanket GO |
| DEC-15 | High | Prove legal data-subject requests and hold/retention handling | DPO / Legal / People | Request identity check, lawful grounds, hold exceptions, access logs | OPEN: Counsel sign-off |




## IA and product acceptance controls

| QA ID | Theme | Objective criterion | Evidence method | Current status |
| --- | --- | --- | --- | --- |
| QA-01 | Completeness | Every source R1.0 screen ID present and its role/components/action retained | Script compare old+new IDs | STATIC VERIFIED |
| QA-02 | Source/brand | 35 exact owner-defined sub-brands; no extra channel inventory | Group Master ID matching | STATIC VERIFIED |
| QA-03 | SOP/playbook | 161 current SOP and 16 playbook detail-page instance IDs | ONE CIRCLE source matching | STATIC VERIFIED |
| QA-04 | Screen role | All referenced role IDs exist; roles are UI personas not IAM permissions | Role catalog diff / ABAC test planned | STATIC VERIFIED; ABAC NOT RUN |
| QA-05 | Route | Every routable page has proposed route; hosted controls have host | Route/host invariant script | STATIC VERIFIED; REPO NOT VERIFIED |
| QA-06 | Exception | All edge states have safe host, owner, truthful status and no private leak | Host-state verification + red-team | STATIC VERIFIED; UX NOT RUN |
| QA-07 | Corporate truth | Defined brand status not converted to live availability by a CTA | Brand W0 template negative UAT | NOT RUN |
| QA-08 | Storyworlds | Four peer worlds, five demand systems, eight universes remain distinct | Portfolio schema tests | NOT RUN |
| QA-09 | Identity | Same person multiple relationships do not union permissions | Tenant/purpose server negative suite | NOT RUN |
| QA-10 | Accessibility | WCAG 2.2 AA target, mobile keyboard and screen reader, focus recovery | Observed responsive accessibility tests | NOT RUN |
| QA-11 | Consent | Casting, analytics, marketing and AI likeness permissions independent | Purpose/withdrawal and revoked-rights tests | NOT RUN |
| QA-12 | Finance | Paid vs invoiced vs collected vs payable vs restricted cash distinct | Treasury/PSP ledger negative cases | NOT RUN |
| QA-13 | Rights | Exact asset/cut/territory/medium/window gate blocks export and streaming | Rights UI/API/batch negative cases | NOT RUN |
| QA-14 | Broadcast | EPG and playlist never equal proof-of-air; as-run verified independently | As-run wrong-revision/stale test | NOT RUN |
| QA-15 | AI | A0–A5, prompt injection and fabricated completed action denied | Tool/permission/security tests | NOT RUN |
| QA-16 | Reliability | Every consequential flow has duplicate/retry/pending/fallback and rollback | Source-outage + idempotency suite | NOT RUN |
| QA-17 | User research | Critical journeys tested with representative unaided users | Screen recordings/observed task completion | NOT RUN |
| QA-18 | Release | No production feature without domain approval, privacy/rights QA and rollback | Signed scoped release manifest | NOT RUN |
| QA-19 | Historical sources | Financial 2025 model, Legal master and R1.2 prior clauses not claimed ratified | Provenance review | STATIC VERIFIED; FULL R1.2 OPEN |
| QA-20 | Data integrity | Each display value has source/version/freshness and legal purpose | Source data contract tests | NOT RUN |




## Platform / product handoff contract

**Design handoff:** Author the logical navigation tree with authenticated realms, 35 canonical brand-page data instances, 161 SOP page data instances, 16 playbook instances, 48 proposed shared components, 25 global state patterns, 18 observed golden journeys, purpose-scoped access and the R1.1 screen inventory. Annotate desktop/narrow-mobile/keyboard/reader variants for each *approved release slice*.

**Engineering handoff:** Every selected screen contract must specify exact entity schemas, source-domain owner, proposed route and host, current API or direct source fallback, server permission guard, state transitions, idempotency on writes, errors, incident support, audit event, UAT, environment and release manifest. Source objects and relationships in this pack are logical, not a claim of installed endpoints.

**QA handoff:** For every released W0/W1/W2/W3/W4 scope, test success, missing source, denial, stale source, concurrency/duplicate, rights/consent, accessibility, offline provider and legal/human authority. Store actor, independent verifier, build SHA, source version, observed response and sign-off. No model-generated result or design preview may claim an external side effect occurred.

**Operational certification remains pending:** Full adopted original VMN World R1.2 reconciliation; actual company signatories; current source system/contract records; observed role and negative tests; privacy/rights and regulated Games/Candy decisions; current Finance cash source; signed release GO; and a proven support/rollback route.



---

**END OF VMN WORLD IA R1.1 | 619 ADDRESSABLE UI SURFACES | CONTROLLED WRITTEN DESIGN CANDIDATE**
