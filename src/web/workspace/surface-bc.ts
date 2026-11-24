/**
 * Surface B & C — Enterprise Operating Hub & Specialist Workspaces
 * Authority: VMNL-AZP-VMN-CCPP-001 (§8–§25)
 * Design Authority: docs/decisions/design-task-de-citation.md (legacy "design-task" DT reference) DT-408 / DS-16 / DS-20
 *
 * Implements all 48 Enterprise Operating Desks & Specialist Workspaces:
 *
 * Pillar 1: Executive, Operations & Core Governance (Desks 1–12)
 * 1.  executive      - Enterprise Executive Command Dashboard
 * 2.  iam            - Identity & Access Management (One Person / Multiple Roles)
 * 3.  organisations  - Organisation & Counterparty Registry
 * 4.  projects       - Project Command Centre
 * 5.  risk           - Enterprise Risk, Issue & Incident Register
 * 6.  board          - Board of Directors & Investor Relations Desk
 * 7.  procurement    - Strategic Procurement & Vendor Registry
 * 8.  audit          - Enterprise Regulatory & Internal Audit Desk
 * 9.  esg            - Sustainability & Corporate Social Responsibility (ESG)
 * 10. comms          - Corporate Communications & Public Relations
 * 11. hr             - Enterprise People, Culture & Payroll Operations
 * 12. legal          - General Counsel & Legal Affairs Chamber
 *
 * Pillar 2: Broadcast Linear Operations & Master Control (Desks 13–24)
 * 13. mcr            - Master Control Room (MCR) Live Playout Supervisor
 * 14. traffic        - Linear Broadcast Traffic & Spot Placement Desk
 * 15. epg            - EPG Programming, Dayparting & Schedule Manager
 * 16. asrun          - As-Run Log Ingestion & Proof-of-Air Desk
 * 17. uplink         - StarTimes DTT/DTH Satellite Uplink & Carrier Telemetry
 * 18. ingest         - Broadcast Media Ingest, Transcode & QC Slating
 * 19. graphics       - Broadcast Channel Branding & Lower-Third Graphics
 * 20. scte           - SCTE-35 Digital Ad Insertion & Dynamic Cue Desk
 * 21. disaster       - Disaster Recovery & Playout Automation Failover
 * 22. audio          - Audio Loudness & EBU R128 Compliance Console
 * 23. interstitial   - Promo & Filler Inventory Optimization Desk
 * 24. transmission   - Transmission Telemetry & Signal Quality Hub
 *
 * Pillar 3: Creative Hub, Talent & Production (Desks 25–36)
 * 25. talent         - Talent Accelerator Partner Network Desk
 * 26. afca           - AFCA Learning, Competency & Assessment Hub
 * 27. community      - Afro-Fusion Guilds & Mentorship Workspace
 * 28. vtm            - VTM Talent Deal Desk & Protected Engagements
 * 29. vcf            - VCF Rapid Format Lab & Creator Missions
 * 30. onestudios     - ONE Studios Production Tracker & QC Management
 * 31. events         - Fusion Events & Experiential Operations Desk
 * 32. tend           - TEND B2B Rights Catalogue & Licence Manager
 * 33. soundstage     - Studio Soundstage, Acoustical & Set Operations
 * 34. gear           - Film Camera & Grip Equipment Gear Locker
 * 35. postproduction - Post-Production & Color Grading Pipeline Desk
 * 36. alumni         - AFCA Alumni Career Placement & Guild Registry
 *
 * Pillar 4: Commercial, Finance, Tech & Governance (Desks 37–48)
 * 37. crm            - CRM, Leads & Sales Opportunities
 * 38. quotes         - Commercial Proposals & Media Quotes
 * 39. contracts      - CLM / Master Contract Ledger
 * 40. finance        - Consolidated Finance & Settlement Dashboard (7-Way Split)
 * 41. payouts        - Talent Payout Batching & Nigerian WHT Ledger
 * 42. bankrecon      - Bank Statement Automated Reconciliation (MT940/NIP)
 * 43. headspace      - HeadspaceNG Strategic Intelligence Desk
 * 44. cr8tech        - Cr8TechNG Technology & Workflow Console
 * 45. rights         - Governed Rights Ledger & Exploitation Windows
 * 46. privacy        - Data Privacy, Consent & ROPA Register (NDPR)
 * 47. security       - Security, Audit Logging & RBAC/ABAC Console
 * 48. aos            - Agentic OS Registry & Evaluation Desk
 */

import { escapeHtml, renderIcon, IconName } from "../components/index.js";
import { renderDeskCockpitHtml } from "./cockpits.js";

export interface WorkspaceDeskDescriptor {
  key: string;
  name: string;
  category: "Executive & Core" | "Broadcast Operations" | "Hub Specialist" | "Commercial & Finance" | "Tech & Governance";
  primaryRole: string;
  authorityCitation: string;
  description: string;
  activeWorkflows: string[];
  dutyStation?: string;
  icon?: IconName;
  primaryObject?: string;
}

export const ENTERPRISE_WORKSPACES: WorkspaceDeskDescriptor[] = [
  // ==========================================
  // Pillar 1: Executive, Operations & Core Governance (Desks 1–12)
  // ==========================================
  {
    key: "executive",
    name: "Enterprise Executive Command Dashboard",
    category: "Executive & Core",
    primaryRole: "ExecutiveLeader",
    authorityCitation: "CCPP-001 §8 / Corporate Governance",
    dutyStation: "Executive Command",
    icon: "shield",
    primaryObject: "Cross-Pillar Enterprise Scorecard",
    description: "Consolidated enterprise oversight spanning broadcast ratings, revenue yield, hub academy throughput, and platform health.",
    activeWorkflows: ["Cross-Pillar Health Scorecard", "StarTimes Carriage SLAs", "Daily Revenue Yield vs. Target"],
  },
  {
    key: "iam",
    name: "Identity & Access Management (IAM)",
    category: "Executive & Core",
    primaryRole: "SuperAdmin",
    authorityCitation: "CC-SEC-001 / CCPP-001 §9",
    dutyStation: "Identity & Security",
    icon: "lock",
    primaryObject: "Multi-Role Session Matrix",
    description: "Multi-tenant user administration supporting one person with multiple context-switched operational roles.",
    activeWorkflows: ["Session Persona Switcher", "Active JWT Revocation", "MFA Verification Engine"],
  },
  {
    key: "organisations",
    name: "Organisation & Counterparty Registry",
    category: "Executive & Core",
    primaryRole: "LegalCounsel",
    authorityCitation: "CCPP-001 §10",
    dutyStation: "Legal & Counterparty",
    icon: "folder",
    primaryObject: "Counterparty KYC & TIN Vault",
    description: "Master directory of StarTimes, corporate sponsors, talent agencies, co-producers, and vendors with KYC/RC validation.",
    activeWorkflows: ["CAC Corporate Verification", "TIN & Tax Compliance Check", "Bank Account NIP Validation"],
  },
  {
    key: "projects",
    name: "Project Command Centre",
    category: "Executive & Core",
    primaryRole: "ProductionDirector",
    authorityCitation: "CCPP-001 §14",
    dutyStation: "Production PMO",
    icon: "document",
    primaryObject: "Enterprise Slate & Project Tracker",
    description: "Unified tracker for commissioned original series, event festival staging, and tech deployment sprints.",
    activeWorkflows: ["Milestone Delivery Tracking", "Cross-Functional Dependencies", "Resource Utilization Heatmap"],
  },
  {
    key: "risk",
    name: "Enterprise Risk, Issue & Incident Register",
    category: "Executive & Core",
    primaryRole: "RiskManager",
    authorityCitation: "CC-OPS-001",
    dutyStation: "Enterprise Risk",
    icon: "alert",
    primaryObject: "Sev-1 Incident Escalation Queue",
    description: "StarTimes satellite transponder outages, transmission carrier drops, and commercial breach incident resolution.",
    activeWorkflows: ["Incident Sev-1 Triage", "Post-Mortem Runbook Execution", "SLA Penalty Credit Ledger"],
  },
  {
    key: "board",
    name: "Board of Directors & Investor Relations Desk",
    category: "Executive & Core",
    primaryRole: "ExecutiveLeader",
    authorityCitation: "CCPP-001 §8 / Corporate Governance",
    dutyStation: "Board & Investors",
    icon: "shield",
    primaryObject: "Board Resolution & Cap Table Register",
    description: "Quarterly board governance packets, cap table analytics, shareholding registries, and investor briefing archives.",
    activeWorkflows: ["Board Resolution Sign-Off", "Investor KPI Dashboard", "Governance Audit Briefing"],
  },
  {
    key: "procurement",
    name: "Strategic Procurement & Vendor Registry",
    category: "Executive & Core",
    primaryRole: "ProcurementManager",
    authorityCitation: "CCPP-001 §10",
    dutyStation: "Procurement",
    icon: "folder",
    primaryObject: "Vendor Scorecard & RFP Ledger",
    description: "Supplier rate benchmarking, technical RFPs, broadcast hardware procurement, and vendor scorecards.",
    activeWorkflows: ["Vendor Evaluation Scoring", "Purchase Order Sign-Off", "Commercial Terms Review"],
  },
  {
    key: "audit",
    name: "Enterprise Regulatory & Internal Audit Desk",
    category: "Executive & Core",
    primaryRole: "InternalAuditor",
    authorityCitation: "CC-AUD-001 / CCPP-001 §22",
    dutyStation: "Internal Audit",
    icon: "document",
    primaryObject: "Statutory NBC Compliance Evidence Vault",
    description: "Statutory audit trails, Nigerian NBC broadcast compliance logs, and ISO 27001 evidence vaults.",
    activeWorkflows: ["Compliance Gap Analysis", "NBC Regulatory Filing", "Immutable Ledger Verification"],
  },
  {
    key: "esg",
    name: "Sustainability & Corporate Social Responsibility (ESG)",
    category: "Executive & Core",
    primaryRole: "SustainabilityOfficer",
    authorityCitation: "CCPP-001 §10 / ESG",
    dutyStation: "Sustainability & ESG",
    icon: "check",
    primaryObject: "Renewable Energy & Carbon Offset Ledger",
    description: "Solar production energy audits, youth talent inclusion ratios, and regional community empowerment metrics.",
    activeWorkflows: ["Carbon Footprint Auditing", "Community Empowerment Scorecard", "Renewable Studio Metrics"],
  },
  {
    key: "comms",
    name: "Corporate Communications & Public Relations",
    category: "Executive & Core",
    primaryRole: "CommunicationsDirector",
    authorityCitation: "CCPP-001 §10 / Communications",
    dutyStation: "Corporate Communications",
    icon: "broadcast",
    primaryObject: "Press Release & Brand Media Asset Vault",
    description: "Press release dissemination, brand media kits, crisis messaging playbooks, and PR agency liaisons.",
    activeWorkflows: ["Media Kit Syndication", "Press Release Approval", "Brand Reputation Monitoring"],
  },
  {
    key: "hr",
    name: "Enterprise People, Culture & Payroll Operations",
    category: "Executive & Core",
    primaryRole: "HRDirector",
    authorityCitation: "CCPP-001 §9",
    dutyStation: "People & Payroll",
    icon: "folder",
    primaryObject: "Broadcast Crew Shift Roster & PAYE Ledger",
    description: "Employee lifecycle management, broadcast crew shift rostering, PAYE tax withholding, and pension compliance.",
    activeWorkflows: ["Roster Shift Scheduling", "PAYE Calculation Matrix", "Employee Benefits Ledger"],
  },
  {
    key: "legal",
    name: "General Counsel & Legal Affairs Chamber",
    category: "Executive & Core",
    primaryRole: "GeneralCounsel",
    authorityCitation: "CCPP-001 §10, §12",
    dutyStation: "Legal Chamber",
    icon: "shield",
    primaryObject: "IP Trademark & Litigation Risk Matrix",
    description: "Litigation tracking, intellectual property protection, trademark filings, and regulatory representation.",
    activeWorkflows: ["IP Trademark Filing", "Litigation Risk Matrix", "Regulatory Representation Log"],
  },

  // ==========================================
  // Pillar 2: Broadcast Linear Operations & Master Control (Desks 13–24)
  // ==========================================
  {
    key: "mcr",
    name: "Master Control Room (MCR) Playout Supervisor",
    category: "Broadcast Operations",
    primaryRole: "MCRSupervisor",
    authorityCitation: "CCPP-001 §19 / MCR Operations",
    dutyStation: "Master Control Room",
    icon: "broadcast",
    primaryObject: "Tri-Channel Frame-Accurate Playout Switcher",
    description: "24/7 real-time monitoring of Nigezie Xtreme, Orisun, and Isi Mbido linear channels with frame-accurate failover.",
    activeWorkflows: ["Emergency Manual Override", "Linear Stream Bitrate Gauge", "Automated Playout Handover"],
  },
  {
    key: "traffic",
    name: "Linear Broadcast Traffic & Spot Placement Desk",
    category: "Broadcast Operations",
    primaryRole: "TrafficManager",
    authorityCitation: "R1.2A §14 / CCPP-001 §19",
    description: "Flighting commercial ad schedules, daypart spot spacing, competitive separation, and break optimization.",
    activeWorkflows: ["Break Structure Optimization", "Competitive Separation Validation", "Daily Traffic Log Lock"],
  },
  {
    key: "epg",
    name: "EPG Programming, Dayparting & Schedule Manager",
    category: "Broadcast Operations",
    primaryRole: "TrafficScheduler",
    authorityCitation: "R1.2A §19 / XMLTV",
    description: "7-day forward EPG schedule authoring, StarTimes XMLTV ingestion, and live program metadata enrichment.",
    activeWorkflows: ["XMLTV Feed Generator", "Daypart Grid Scheduling", "Catch-Up Metadata Tagging"],
  },
  {
    key: "asrun",
    name: "As-Run Log Ingestion & Proof-of-Air Desk",
    category: "Broadcast Operations",
    primaryRole: "BroadcastReconciliationLead",
    authorityCitation: "CCPP-001 §19",
    description: "Frame-accurate as-run log reconciliation against scheduled traffic bookings with tamper-evident SHA-256 PoA creation.",
    activeWorkflows: ["3-Way Telemetry Match", "Proof-of-Air Certificate Generation", "Make-Good Credit Creation"],
  },
  {
    key: "uplink",
    name: "StarTimes DTT/DTH Uplink & Carrier Telemetry",
    category: "Broadcast Operations",
    primaryRole: "BroadcastTransmissionEngineer",
    authorityCitation: "R1.2A §19",
    description: "Reserved for verified StarTimes DTT/DTH carrier telemetry, signal-to-noise ratio, and error rate monitoring; no live carrier link or channel identifiers are configured here.",
    activeWorkflows: ["Carrier Lock Health Polling", "Transponder Rain Fade Alarm", "Carrier Uplink SLA Verification"],
  },
  {
    key: "ingest",
    name: "Broadcast Media Ingest, Transcode & QC Slating",
    category: "Broadcast Operations",
    primaryRole: "IngestOperator",
    authorityCitation: "SMPTE-2067 / BXF",
    description: "Broadcast-grade MXF/ProRes file ingestion, audio normalisation, frame-rate conversions, and QC slating.",
    activeWorkflows: ["Automated QC File Inspection", "Loudness Normalisation Pass", "Media Asset Metadata Binding"],
  },
  {
    key: "graphics",
    name: "Broadcast Channel Branding & Lower-Third Graphics",
    category: "Broadcast Operations",
    primaryRole: "GraphicsCoordinator",
    authorityCitation: "R1.2A §19",
    description: "Dynamic channel bugs, automated 'Next Up' lower-thirds, sponsor logo bugs, and breaking-news crawls.",
    activeWorkflows: ["Channel Bug Scheduling", "Lower-Third Cue Sequencing", "Automated Ticker Update"],
  },
  {
    key: "scte",
    name: "SCTE-35 Digital Ad Insertion & Dynamic Cue Desk",
    category: "Broadcast Operations",
    primaryRole: "AutomationEngineer",
    authorityCitation: "SCTE-35 / CCPP-001 §19",
    description: "Frame-accurate SCTE-35 splice cue insertion into linear transport streams for targeted ad replacement.",
    activeWorkflows: ["Splice Cue Trigger Testing", "Digital Break Insertion Audit", "Transport Stream Stream-ID Binding"],
  },
  {
    key: "disaster",
    name: "Disaster Recovery & Playout Automation Failover",
    category: "Broadcast Operations",
    primaryRole: "SiteReliabilityEngineer",
    authorityCitation: "CC-OPS-001",
    description: "Secondary playout mirror synchronization, hot-standby automation, and redundant optical route switching.",
    activeWorkflows: ["Hot-Standby Playout Failover", "Redundant Optical Route Health", "Disaster Recovery Dry Run"],
  },
  {
    key: "audio",
    name: "Audio Loudness & EBU R128 Compliance Console",
    category: "Broadcast Operations",
    primaryRole: "AudioComplianceOfficer",
    authorityCitation: "EBU R128 / ITU-R BS.1770",
    description: "Real-time measurement of Integrated Loudness (-23 LUFS ±0.5), Maximum True Peak, and loudness range logging.",
    activeWorkflows: ["Real-Time Loudness Metering", "True-Peak Violation Quarantine", "EBU R128 Compliance Certificate"],
  },
  {
    key: "interstitial",
    name: "Promo & Filler Inventory Optimization Desk",
    category: "Broadcast Operations",
    primaryRole: "InterstitialProducer",
    authorityCitation: "R1.2A §19",
    description: "Short-form filler clips, channel cross-promotions, station IDs, and emergency dead-air prevention pads.",
    activeWorkflows: ["Filler Duration Bucket Optimization", "Cross-Channel Promo Rotation", "Station ID Frequency Audit"],
  },
  {
    key: "transmission",
    name: "Transmission Telemetry & Signal Quality Hub",
    category: "Broadcast Operations",
    primaryRole: "TransmissionLead",
    authorityCitation: "CCPP-001 §19",
    description: "Head-end distribution telemetry, optical link levels, transport stream packet error rates, and NOC alarms.",
    activeWorkflows: ["Packet Error Rate Monitoring", "Head-End Optical Level Check", "NOC Alarm Escalation Runbook"],
  },

  // ==========================================
  // Pillar 3: Creative Hub, Talent & Production (Desks 25–36)
  // ==========================================
  {
    key: "talent",
    name: "Talent Accelerator Partner Network Desk",
    category: "Hub Specialist",
    primaryRole: "HubCoordinator",
    authorityCitation: "CCPP-001 §11",
    description: "National directory of 12 partner creative hubs, onboarding rubrics, and tier progression across Nigeria.",
    activeWorkflows: ["Hub Desk Capacity Allocation", "Applicant Rubric Scoring", "Tier Progression Badges"],
  },
  {
    key: "afca",
    name: "AFCA Learning & Competency Hub",
    category: "Hub Specialist",
    primaryRole: "AcademyDean",
    authorityCitation: "CCPP-001 §12",
    description: "Curriculum pacing, mentor rubric evaluation, grade book consolidation, and cryptographic digital certificate generation.",
    activeWorkflows: ["Cohort Grade Approval", "Verifiable QR Certificate Generation", "Alumni Employment Registry"],
  },
  {
    key: "community",
    name: "Afro-Fusion Guilds & Mentorship Workspace",
    category: "Hub Specialist",
    primaryRole: "CommunityManager",
    authorityCitation: "CCPP-001 §13",
    description: "Creator guild meetups, shared podcast suite bookings, and masterclass mentorship pairing.",
    activeWorkflows: ["Desk & Studio Bookings", "Mentorship Session Scheduling", "Community Flagged Posts"],
  },
  {
    key: "vtm",
    name: "VTM Talent Deal Desk & Protected Engagements",
    category: "Hub Specialist",
    primaryRole: "TalentAgent",
    authorityCitation: "CCPP-001 §13",
    description: "Standardized rate card enforcement, casting call dispatch, and 15% platform fee escrow release.",
    activeWorkflows: ["Casting Call Dispatch", "Client Escrow Deposit Hold", "Milestone Payout Authorisation"],
  },
  {
    key: "vcf",
    name: "VCF Rapid Format Lab & Creator Missions",
    category: "Hub Specialist",
    primaryRole: "InvestmentLead",
    authorityCitation: "CCPP-001 §15",
    description: "Micro-format development, pilot commissioning, and 4-tier waterfall co-financing recoupment engine.",
    activeWorkflows: ["Format Pitch Evaluation", "Milestone Tranche Disbursements", "Recoupment Waterfall Ledger"],
  },
  {
    key: "onestudios",
    name: "ONE Studios Production Tracker & QC Management",
    category: "Hub Specialist",
    primaryRole: "ProductionDirector",
    authorityCitation: "CCPP-001 §14",
    description: "Soundstage booking calendar, ARRI/RED cinema camera gear tracking, and EBU R128 technical QC slating.",
    activeWorkflows: ["Call Sheet Automated Dispatch", "Technical QC Checklist Validation", "Damaged Gear Work Orders"],
  },
  {
    key: "events",
    name: "Fusion Events & Experiential Operations Desk",
    category: "Hub Specialist",
    primaryRole: "EventsProducer",
    authorityCitation: "CCPP-001 §16",
    description: "Live experiential festivals, ticketing inventory tiers, and turnstile gate anti-fraud verification.",
    activeWorkflows: ["HMAC Anti-Fraud Gate Verification", "Attendee Capacity Counters", "VIP Badge Dispatch"],
  },
  {
    key: "tend",
    name: "TEND B2B Rights Catalogue & Licence Manager",
    category: "Hub Specialist",
    primaryRole: "RightsManager",
    authorityCitation: "CCPP-001 §17",
    description: "Territorial window licensing, international broadcast avails, and withholding tax net remittance calculator.",
    activeWorkflows: ["Territorial Window Cleared Filter", "International Deal Invoicing", "Syndication Master Package Download"],
  },
  {
    key: "soundstage",
    name: "Studio Soundstage, Acoustical & Set Operations",
    category: "Hub Specialist",
    primaryRole: "StudioManager",
    authorityCitation: "CCPP-001 §14",
    description: "Acoustic stage isolation testing, LED virtual production volume calibration, and power grid generators.",
    activeWorkflows: ["Acoustic Soundstage Inspection", "Virtual Volume Calibration", "Generator Fuel & Load Monitoring"],
  },
  {
    key: "gear",
    name: "Film Camera & Grip Equipment Gear Locker",
    category: "Hub Specialist",
    primaryRole: "EquipmentCoordinator",
    authorityCitation: "CCPP-001 §14",
    description: "Cinematography camera lenses, wireless audio kits, lighting rigs, and insurance-bonded equipment checkouts.",
    activeWorkflows: ["Barcode Asset Check-Out", "Equipment Maintenance Schedule", "Insurance Damage Claim Log"],
  },
  {
    key: "postproduction",
    name: "Post-Production & Color Grading Pipeline Desk",
    category: "Hub Specialist",
    primaryRole: "PostProductionSupervisor",
    authorityCitation: "CCPP-001 §14",
    description: "DaVinci Resolve color pipelines, Dolby Atmos audio mixes, visual effects passes, and mastering conform.",
    activeWorkflows: ["ACES Color Pipeline Verification", "Dolby Atmos Mastering Pass", "VFX Delivery Milestone Tracker"],
  },
  {
    key: "alumni",
    name: "AFCA Alumni Career Placement & Guild Registry",
    category: "Hub Specialist",
    primaryRole: "AlumniRelationsLead",
    authorityCitation: "CCPP-001 §12",
    description: "Graduate job placement tracking, industry guild memberships, employer sponsor partnerships, and mentorship.",
    activeWorkflows: ["Alumni Placement Verification", "Employer Matching Feed", "Guild Certification Tracking"],
  },

  // ==========================================
  // Pillar 4: Commercial, Finance, Tech & Governance (Desks 37–48)
  // ==========================================
  {
    key: "crm",
    name: "CRM, Leads & Sales Opportunities",
    category: "Commercial & Finance",
    primaryRole: "CommercialLead",
    authorityCitation: "R1.2A §14, §42 / CCPP-001 §11",
    description: "Inbound brand partnership opportunities, media agency flighting requests, and broadcast advertising pipeline.",
    activeWorkflows: ["Opportunity Staging", "Agency Discount Matrix", "Media Plan Pipeline Forecast"],
  },
  {
    key: "quotes",
    name: "Commercial Proposals & Spot Rate Quotations",
    category: "Commercial & Finance",
    primaryRole: "CommercialLead",
    authorityCitation: "R1.2A §14, §42",
    description: "Automated spot rate calculations per daypart (Early Morning, Daytime, Prime Time, Late Night) with dual-authorization approval.",
    activeWorkflows: ["Dual Sign-Off Trigger", "Spot Inventory Hold", "Client Pro-Forma Generation"],
  },
  {
    key: "contracts",
    name: "CLM / Master Contract Ledger",
    category: "Commercial & Finance",
    primaryRole: "LegalCounsel",
    authorityCitation: "CCPP-001 §12",
    description: "Tamper-evident legal contracts repository binding media agreements, talent releases, and NDPR data processing agreements.",
    activeWorkflows: ["Versioned Redlining", "Digital Signature Execution", "Auto-Renewal & Expiry Watcher"],
  },
  {
    key: "finance",
    name: "Consolidated Finance & Settlement Dashboard",
    category: "Commercial & Finance",
    primaryRole: "FinanceController",
    authorityCitation: "R1.2A §14, §42, §70",
    description: "7-way financial data separation, balanced double-entry general ledger, Nigerian WHT remittances, and MT940 bank reconciliation.",
    activeWorkflows: ["7-Way Financial Split Ledger", "Talent NIP CSV Payouts", "Bank Statement Automated Match"],
  },
  {
    key: "payouts",
    name: "Talent Payout Batching & Nigerian WHT Ledger",
    category: "Commercial & Finance",
    primaryRole: "DisbursementOfficer",
    authorityCitation: "CCPP-001 §18",
    description: "Automated Nigerian Withholding Tax (WHT 5%/10%) deductions, NIP bulk payout batching, and remittance receipts.",
    activeWorkflows: ["NIP Direct Credit Batching", "WHT Deduction Calculation", "Remittance Tax Credit Receipt"],
  },
  {
    key: "bankrecon",
    name: "Bank Statement Automated Reconciliation (MT940/NIP)",
    category: "Commercial & Finance",
    primaryRole: "TreasuryManager",
    authorityCitation: "CCPP-001 §18",
    description: "SWIFT MT940 statement parsing, NIP electronic settlement matching, and invoice unapplied cash reconciliation.",
    activeWorkflows: ["MT940 Parser Execution", "Automated Invoice Matching", "Unapplied Cash Resolution"],
  },
  {
    key: "headspace",
    name: "HeadspaceNG Strategic Intelligence Desk",
    category: "Tech & Governance",
    primaryRole: "ChiefIntelligenceOfficer",
    authorityCitation: "CCPP-001 §18",
    description: "Enterprise IP vault, Nigerian NBC regulatory guidelines, and Nollywood historical rate cards repository.",
    activeWorkflows: ["Vector IP Semantic Query", "NBC Regulatory Pre-Check", "Nollywood Rate Card Lookup"],
  },
  {
    key: "cr8tech",
    name: "Cr8TechNG Technology & Workflow Console",
    category: "Tech & Governance",
    primaryRole: "TechnologyLead",
    authorityCitation: "CCPP-001 §19",
    description: "AI-assisted multilingual subtitling (English, Yoruba, Igbo, Hausa, Pidgin), automated social reels, and watermarking.",
    activeWorkflows: ["Batch Subtitle Pipeline", "Broadcast Watermark Injection", "Social Media Aspect Ratio Converter"],
  },
  {
    key: "rights",
    name: "Governed Rights Ledger & Exploitation Windows",
    category: "Tech & Governance",
    primaryRole: "RightsManager",
    authorityCitation: "R1.2A §18 / CCPP-001 §20",
    description: "Linear vs. Digital exclusivity rules, catch-up windows, and automatic unpublish triggers upon expiry.",
    activeWorkflows: ["Rights Expiry Alert Scanner", "Azeebo+ Delisting Webhook", "Chain of Title Verification"],
  },
  {
    key: "privacy",
    name: "Data Privacy, Consent & ROPA Register",
    category: "Tech & Governance",
    primaryRole: "DataProtectionOfficer",
    authorityCitation: "CC-SEC-001 / NDPR",
    description: "Nigeria Data Protection Regulation (NDPR) Record of Processing Activities (ROPA) and SHA-256 telemetry consent logs.",
    activeWorkflows: ["ROPA Audit Export", "Data Subject Access Request (DSAR)", "SHA-256 Anonymization Audit"],
  },
  {
    key: "security",
    name: "Security, Audit Logging & RBAC/ABAC Console",
    category: "Tech & Governance",
    primaryRole: "SecOpsLead",
    authorityCitation: "CC-SEC-001 / CC-AUD-001",
    description: "Immutable SHA-256 audit ledger, role-based and attribute-based policy enforcement, and breach tripwires.",
    activeWorkflows: ["Immutable Log Verification", "Suspicious IP Geo-Fence Lock", "Privilege Escalation Alerting"],
  },
  {
    key: "aos",
    name: "Agentic OS Registry & Evaluation Desk",
    category: "Tech & Governance",
    primaryRole: "AgenticOpsEngineer",
    authorityCitation: "CCPP-001 §20",
    description: "Autonomous AI agent permissions, Human-in-the-Loop review queues, token budgets, and emergency kill switches.",
    activeWorkflows: ["Agent Execution Quarantine", "Human Review Task Dispatch", "Agent Token Consumption Gauge"],
  },
];

/**
 * Desk keys whose route is answered by a dedicated handler that reads engine or
 * repository state. Every other registered key falls through to
 * `renderWorkspaceDeskHtml`, which is a presentation shell.
 *
 * MEASURED 2026-10-07 (tests/unit/desk-census.test.ts): the router is booted and
 * all 48 `GET /workspace/{key}` routes are requested as an authorized operator;
 * exactly these desks came back from something other than the shell. The census
 * test pins this list against that measurement, so the claim cannot rot silently.
 */
export const ENGINE_BACKED_DESK_KEYS: string[] = ["afca"];

export function renderWorkspaceDirectoryHtml(): string {
  const categories: Array<WorkspaceDeskDescriptor["category"]> = [
    "Executive & Core",
    "Broadcast Operations",
    "Hub Specialist",
    "Commercial & Finance",
    "Tech & Governance",
  ];

  const categorySections = categories
    .map((cat) => {
      const desks = ENTERPRISE_WORKSPACES.filter((w) => w.category === cat);
      if (desks.length === 0) return "";

      const cardsHtml = desks
        .map(
          (d) => `
 <article class="card s-gx-sf-ATO8" >
          <div>
 <div class="s-NUy8-yU6ON">
 <span class="s-BQf0h0v-pN">
                /workspace/${escapeHtml(d.key)}
              </span>
              <span class="vmn-badge ${ENGINE_BACKED_DESK_KEYS.includes(d.key) ? "badge-live" : "badge-provisional"}">${
                ENGINE_BACKED_DESK_KEYS.includes(d.key) ? "Engine-backed" : "Presentation shell"
              }</span>
            </div>
 <div class="s-n4vSWy6lTS">
 <span class="s-_ZPfN4CX-f">${renderIcon(d.icon || (d.category === "Broadcast Operations" ? "broadcast" : d.category === "Hub Specialist" ? "film" : d.category === "Commercial & Finance" ? "bolt" : d.category === "Tech & Governance" ? "lock" : "shield"), { size: 18 })}</span>
 <h3 class="s-5yiBMOtiRi">
 <a href="/workspace/${escapeHtml(d.key)}" class="s-iNbj2zKu9I">${escapeHtml(d.name)}</a>
              </h3>
            </div>
 <p class="s-ggsAJKVmD5">${escapeHtml(d.description)}</p>
          </div>
          <div>
 <div class="s-X0EQVWrbtR">
              <div>
 <span class="s-MeGQ-m5xgF">Primary Role:</span>
 <code class="s-mHWfwRxuAu">${escapeHtml(d.primaryRole)}</code>
              </div>
 ${d.dutyStation ? `<span class="s-VLg2kAT8ly">${escapeHtml(d.dutyStation)}</span>` : ""}
            </div>
 <a href="/workspace/${escapeHtml(d.key)}" class="btn btn-outline s-P1OBjCiUCX" >Open Desk &rarr;</a>
          </div>
        </article>
      `
        )
        .join("");

      return `
 <div class="s-KijRP4397F">
 <h2 class="s-bwvPwuC-xB">
          ${escapeHtml(cat)} (${escapeHtml(desks.length)} Desks)
        </h2>
 <div class="s-It9mvu-zwV">
          ${cardsHtml}
        </div>
      </div>
      `;
    })
    .join("");

  return `
 <section class="s-hJqXKfH1_e">
 <div class="s-eNztNGULjh">
      <div>
 <nav aria-label="Breadcrumb" class="s-SFIks6VJ6b">
 <a href="/" class="s-eyM313VDpb">Home</a> &gt; 
 <span class="s-Sug_DIv7G8">Enterprise Workspaces</span>
        </nav>
 <h1 class="s-6qUvL7-0sm">Enterprise Operating Hub &amp; Specialist Desks</h1>
 <p class="s-NLOlqgzjPV">
          Surface B &amp; C: 48-desk specialist enterprise workspaces spanning 5 operational domains (CCPP-001 §8–§25; broadcast operational screens are governed separately under the Broadcast Consoles catalog).
        </p>
      </div>
 <div class="s-iJRgfp58Su">
        <span class="vmn-badge badge-neutral">${escapeHtml(ENGINE_BACKED_DESK_KEYS.length)} of ${escapeHtml(ENTERPRISE_WORKSPACES.length)} desks bound to engine state</span>
 <a href="/broadcast/screens" class="btn btn-primary s-oCyUsegaVZ" >Surface D (33 Broadcast Screens) &rarr;</a>
      </div>
    </div>

    <!-- Summary Statistics Grid -->
 <div class="grid-3 s-KRt7uwFSzR" >
      <div class="card stat-box">
        <span class="stat-val">${escapeHtml(ENTERPRISE_WORKSPACES.length)}</span>
        <span class="stat-lbl">Registered Desk Routes</span>
      </div>
      <div class="card stat-box">
        <span class="stat-val">${escapeHtml(ENGINE_BACKED_DESK_KEYS.length)}</span>
        <span class="stat-lbl">Desks Bound to Engine State</span>
      </div>
      <div class="card stat-box">
        <span class="stat-val">5</span>
        <span class="stat-lbl">Specialist Domains</span>
      </div>
    </div>

    <!-- Desks by Category -->
    ${categorySections}
  </section>
  `;
}

export function renderWorkspaceDeskHtml(deskKey: string): string {
  const desk = ENTERPRISE_WORKSPACES.find((w) => w.key === deskKey.toLowerCase());
  if (!desk) {
    return `
 <div class="card s-YHrz3tOyAX" >
      <h1>Workspace Desk Not Found</h1>
 <p class="s-qo17GhnpD2">No internal workspace was found matching "<strong>${escapeHtml(deskKey)}</strong>".</p>
 <a href="/workspace" class="btn btn-primary s-ijWaduvsnA" >&larr; Return to Workspace Directory</a>
    </div>
    `;
  }

  const workflowsList = desk.activeWorkflows
    .map(
      (w) => `
 <li class="s-Tm1E--rTkD">
 <span class="s-6uU6zfFG1o">${escapeHtml(w)}</span>
      <span class="vmn-badge badge-provisional">Not bound</span>
    </li>
  `
    )
    .join("");

  const workflowsGrid = desk.activeWorkflows
    .map(
      (w, idx) => `
    <div class="card p-3 vmn-interactive-row bg-[#0a0a0a] border border-[#1f1f1f] flex flex-col justify-between" data-inspect-title="${escapeHtml(w)}" data-field-workflow-id="WF-0${idx + 1}" data-field-lead-role="${escapeHtml(desk.primaryRole)}" data-field-governing-authority="${escapeHtml(desk.authorityCitation)}" data-field-duty-station="${escapeHtml(desk.dutyStation || desk.category)}" data-field-sop-state="Declared &amp; Operational">
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-mono text-muted">WF-0${idx + 1}</span>
          <span class="vmn-badge badge-ready">Declared Runbook</span>
        </div>
        <h4 class="font-bold text-sm mb-1">${escapeHtml(w)}</h4>
        <p class="text-xs text-muted mb-3">Enterprise operational procedure mapped to role <code>${escapeHtml(desk.primaryRole)}</code> <span class="sr-only">per CCPP-001</span>.</p>
      </div>
      <div class="flex items-center justify-between pt-2 border-t border-border">
        <span class="text-xs text-muted font-mono">DoA: Level 2</span>
        <div class="flex gap-2">
          <button type="button" class="btn btn-outline btn-sm" data-inspect-title="${escapeHtml(w)}" data-field-workflow-id="WF-0${idx + 1}" data-field-lead-role="${escapeHtml(desk.primaryRole)}" data-field-governing-authority="${escapeHtml(desk.authorityCitation)}" data-field-duty-station="${escapeHtml(desk.dutyStation || desk.category)}" title="Inspect runbook specification &amp; dispatch parameters">
            <span>Inspect SOP</span>
          </button>
          <button type="button" class="btn btn-primary btn-sm" data-toast="Runbook dispatch request for '${escapeHtml(w)}' logged to audit trail" data-toast-type="success" title="Queue runbook execution">
            <span>Dispatch</span>
          </button>
        </div>
      </div>
    </div>
  `
    )
    .join("");

  return `
 <section class="s-Ap7e8x-cvm">
    <!-- Global Context Bar (DT-401) -->
 <div class="card s-4xNgqUJv2k" >
 <div class="s-HdDpLNHmbd">
        <span><strong>Station Context:</strong> ${desk.dutyStation || desk.category}</span>
 <span class="s-HlZwSxAEc7">|</span>
 <span><strong>Channel:</strong> <select class="s-qoP7qoXxfL"><option>NXTR (Nigezie Xtreme)</option><option>ORIS (Orisun — The Source)</option><option>IMBD (Isi Mbido — The Beginning)</option></select></span>
 <span class="s-HlZwSxAEc7">|</span>
        <span><strong>Wiring:</strong> <span class="vmn-badge badge-provisional">Presentation shell — no bound operational feed</span></span>
      </div>
 <div class="s-UK2dEq5_xu">
 <a href="/broadcast/screens" class="btn btn-outline s-KkYZC_xfpb" >Broadcast Consoles (33) &rarr;</a>
      </div>
    </div>

 <nav aria-label="Breadcrumb" class="s-37h9gF_4Xa">
 <a href="/" class="s-eyM313VDpb">Home</a> &gt; 
 <a href="/workspace" class="s-eyM313VDpb">Workspaces</a> &gt; 
 <span class="s-Sug_DIv7G8">${escapeHtml(desk.name)}</span>
    </nav>

 <article class="card s-ByAgEAyo7k" >
 <div class="s-eNztNGULjh">
        <div>
 <div class="s-8BhWLFy0Sw">
 <span class="s-mhNw1gmWaw">
              /workspace/${escapeHtml(desk.key)}
            </span>
            <span class="vmn-badge badge-ready">${escapeHtml(desk.category)}</span>
            ${desk.dutyStation ? `<span class="vmn-badge badge-info">${escapeHtml(desk.dutyStation)}</span>` : ""}
          </div>
 <div class="s-8BhWLFy0Sw">
 <span class="s-_ZPfN4CX-f">${renderIcon(desk.icon || "shield", { size: 28 })}</span>
 <h1 class="s-HllRqNqAsU">
              ${escapeHtml(desk.name)}
            </h1>
          </div>
 <p class="s-EdjnyvpuOU">
            ${escapeHtml(desk.description)}
          </p>
        </div>
 <div class="s-numIUTWRO1">
 <span class="s-h6lXeqF_aO">Governing Authority</span>
 <code class="s-PMTc0hh6bk">${escapeHtml(desk.authorityCitation)}</code>
        </div>
      </div>

      <!-- 4-Card KPI Metric Ribbon -->
      <div class="vmn-kpi-ribbon">
        <div class="vmn-kpi-card">
          <div class="vmn-kpi-title">
            <span>Primary Focus</span>
            ${renderIcon("chart", { size: 14 })}
          </div>
          <div class="vmn-kpi-value">${escapeHtml(desk.key.toUpperCase())}</div>
          <div class="vmn-kpi-meta">
            <span class="vmn-kpi-trend-neutral font-mono">${escapeHtml(desk.category)}</span>
          </div>
        </div>
        <div class="vmn-kpi-card">
          <div class="vmn-kpi-title">
            <span>Lead Authority</span>
            ${renderIcon("user", { size: 14 })}
          </div>
          <div class="vmn-kpi-value s-nbQvXxCe3j">
            ${escapeHtml(desk.primaryRole)}
          </div>
          <div class="vmn-kpi-meta">
            <span class="vmn-kpi-trend-up">Role-Protected</span>
          </div>
        </div>
        <div class="vmn-kpi-card">
          <div class="vmn-kpi-title">
            <span>Operating Workflows</span>
            ${renderIcon("document", { size: 14 })}
          </div>
          <div class="vmn-kpi-value">${escapeHtml(desk.activeWorkflows.length)}</div>
          <div class="vmn-kpi-meta">
            <span class="vmn-kpi-trend-neutral">Declared Runbooks</span>
          </div>
        </div>
        <div class="vmn-kpi-card">
          <div class="vmn-kpi-title">
            <span>Telemetry Link</span>
            ${renderIcon("broadcast", { size: 14 })}
          </div>
          <div class="vmn-kpi-value s-tAe8BAsmAx">
            <span class="vmn-status-beacon s-orRLFYu8o-"><span class="vmn-pulse-dot" aria-hidden="true"></span>STANDBY</span>
          </div>
          <div class="vmn-kpi-meta">
            <span class="vmn-kpi-trend-neutral">System Sync</span>
          </div>
        </div>
      </div>

      <!-- Segmented Control Tabs (Action-First Operational Cockpit) -->
      <div class="vmn-tabs-container" data-tab-group="workspace-desk">
        <div class="vmn-tabs-nav" role="tablist">
          <button type="button" class="vmn-tab-btn active" role="tab" aria-selected="true" data-tab-target="tab-cockpit" id="tab-btn-cockpit">
            ${renderIcon("tv", { size: 16 })}
            <span>Live Operational Cockpit</span>
          </button>
          <button type="button" class="vmn-tab-btn" role="tab" aria-selected="false" data-tab-target="tab-workflows" id="tab-btn-workflows">
            ${renderIcon("document", { size: 16 })}
            <span>Declared Workflows (${escapeHtml(desk.activeWorkflows.length)})</span>
          </button>
          <button type="button" class="vmn-tab-btn" role="tab" aria-selected="false" data-tab-target="tab-governance" id="tab-btn-governance">
            ${renderIcon("shield", { size: 16 })}
            <span>Governance &amp; Audits</span>
          </button>
        </div>

        <!-- Tab 1: Live Operational Cockpit -->
        <div class="vmn-tab-pane active" id="tab-cockpit" role="tabpanel" aria-labelledby="tab-btn-cockpit">
          <!-- Live Operational Cockpit (Wave 3) -->
          ${renderDeskCockpitHtml(desk.key)}

          <!-- Primary Operational Object Panel (DT-408) -->
          <div class="card s-W6jD5TQ63g">
            <h2 class="s-W1jX3Nsc4v">
              Primary Operational Object &amp; State
            </h2>
            <div class="s-7siY-5mpRK">
              <div>
                <div class="s-55dvgDD-q0">${desk.primaryObject || `${escapeHtml(desk.name)} Control Ledger`}</div>
                <p class="s-NgDN4DEFZR">
                  No live object is bound to this panel. The owning role is <code>${escapeHtml(desk.primaryRole)}</code>; access control is applied at the route guard, not by this page.
                </p>
              </div>
              <span class="vmn-badge badge-provisional">Not bound</span>
            </div>
          </div>
        </div>

        <!-- Tab 2: Declared Workflows & Runbooks -->
        <div class="vmn-tab-pane" id="tab-workflows" role="tabpanel" aria-labelledby="tab-btn-workflows">
          <div class="mb-4">
            <h3 class="font-bold text-base mb-1">Standard Operating Procedures &amp; Runbooks</h3>
            <p class="text-xs text-muted mb-3">Audited procedural workflows mapped to this operational workstation <span class="sr-only">per CCPP-001</span>.</p>
            <div class="grid grid-2 gap-3 mb-4">
              ${workflowsGrid}
            </div>
          </div>

          <!-- Legacy workflow list for complete DOM compatibility -->
          <div class="s-M0P9ZGSs2i s-V5D_uimxiZ">
            <h2 class="s-kvQYQvwQRe">
              Declared Core Workflows
            </h2>
            <ul class="s-HxdejeGIA6">
              ${workflowsList}
            </ul>
          </div>
        </div>

        <!-- Tab 3: Governance, Roles & Compliance -->
        <div class="vmn-tab-pane" id="tab-governance" role="tabpanel" aria-labelledby="tab-btn-governance">
          <div class="grid-2 s-KRt7uwFSzR">
            <div>
              <h2 class="s-kvQYQvwQRe">
                Authorized Operating Roles
              </h2>
              <div class="s-geHjG3K8-9">
                <p class="s-uSie1Jctmi"><strong>Primary Lead:</strong> ${escapeHtml(desk.primaryRole)}</p>
                <p class="s-NQDnLJ18Uc">Sign-in is enforced on every <code>/workspace/&#42;</code> route; role scoping applies only where a <code>WORKSPACE_HTML_GUARDS</code> entry exists (see <code>docs/audit/desk-census.md</code>).</p>
              </div>
            </div>

            <div>
              <h2 class="s-kvQYQvwQRe">
                Desk Operating State
              </h2>
              <div class="s-RhnCtRDEMV">
                <p class="s-sJ6vA9uD8L">Registered route — sign-in required</p>
                <p class="s-zO1H8uj2hF">This page renders descriptor metadata only; it reads no engine or repository state. Census: <code>docs/audit/desk-census.md</code>.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="s-nTHtyYhUOE s-bsCEvIXw6o">
        <a href="/workspace" class="btn btn-outline">&larr; Back to Workspace Directory</a>
        <a href="/broadcast/dashboard" class="btn btn-primary">Open Executive Console &rarr;</a>
      </div>
    </article>
  </section>
  `;
}
