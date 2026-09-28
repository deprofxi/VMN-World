/**
 * Surface B & C — Enterprise Operating Hub & Specialist Workspaces
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMNL-AZP-VMN-CCPP-001 (§8, §11–§40)
 *
 * Implements the 23 Enterprise Operating Desks & Specialist Workspaces:
 * 1. Enterprise Executive Command Dashboard
 * 2. Identity & Access Management (One Person / Multiple Roles)
 * 3. Organisation & Counterparty Registry
 * 4. CRM, Leads & Sales Opportunities
 * 5. Commercial Proposals & Quotes
 * 6. Project Command Centre
 * 7. CLM / Master Contract Ledger
 * 8. Consolidated Finance, Invoicing & Settlement Dashboard
 * 9. Talent Accelerator Partner Network Desk
 * 10. AFCA Learning, Competency & Assessment Hub
 * 11. Afro-Fusion Guilds, Mentorship & Community Workspace
 * 12. VTM Talent Deal Desk & Protected Engagements
 * 13. VCF Rapid Format Lab & Creator Missions
 * 14. ONE Studios Production Tracker & QC Management
 * 15. Fusion Events Operations & Venue Management
 * 16. TEND B2B Rights Catalogue & Licence Manager
 * 17. HeadspaceNG Strategic Intelligence & Cultural Analytics Desk
 * 18. Cr8TechNG Technology & Workflow Integration Console
 * 19. Governed Rights Ledger & Exploitation Window Engine
 * 20. Data Privacy, Consent & ROPA Register
 * 21. Security, Audit Logging & Role Management (RBAC/ABAC)
 * 22. Agentic OS Registry, Permissioning & Evaluation Desk
 * 23. Enterprise Risk, Issue & Incident Register
 */

export interface WorkspaceDeskDescriptor {
  key: string;
  name: string;
  category: "Executive & Core" | "Commercial & Finance" | "Hub Specialist" | "Tech & Governance";
  primaryRole: string;
  authorityCitation: string;
  description: string;
  activeWorkflows: string[];
}

export const ENTERPRISE_WORKSPACES: WorkspaceDeskDescriptor[] = [
  {
    key: "executive",
    name: "Enterprise Executive Command Dashboard",
    category: "Executive & Core",
    primaryRole: "ExecutiveLeader",
    authorityCitation: "CCPP-001 §8 / R1.2A §46",
    description: "Consolidated enterprise oversight spanning broadcast ratings, revenue yield, hub academy throughput, and platform health.",
    activeWorkflows: ["Cross-Pillar Health Scorecard", "StarTimes Carriage SLAs", "Daily Revenue Yield vs. Target"],
  },
  {
    key: "iam",
    name: "Identity & Access Management (IAM)",
    category: "Executive & Core",
    primaryRole: "SuperAdmin",
    authorityCitation: "CC-SEC-001 / CCPP-001 §9",
    description: "Multi-tenant user administration supporting one person with multiple context-switched operational roles.",
    activeWorkflows: ["Session Persona Switcher", "Active JWT Revocation", "MFA Verification Engine"],
  },
  {
    key: "organisations",
    name: "Organisation & Counterparty Registry",
    category: "Executive & Core",
    primaryRole: "LegalCounsel",
    authorityCitation: "CCPP-001 §10",
    description: "Master directory of StarTimes, corporate sponsors, talent agencies, co-producers, and vendors with KYC/RC validation.",
    activeWorkflows: ["CAC Corporate Verification", "TIN & Tax Compliance Check", "Bank Account NIP Validation"],
  },
  {
    key: "crm",
    name: "CRM, Leads & Sales Opportunities",
    category: "Commercial & Finance",
    primaryRole: "CommercialLead",
    authorityCitation: "R1.2A §283 / CCPP-001 §11",
    description: "Inbound brand partnership opportunities, media agency flighting requests, and broadcast advertising pipeline.",
    activeWorkflows: ["Opportunity Staging", "Agency Discount Matrix", "Media Plan Pipeline Forecast"],
  },
  {
    key: "quotes",
    name: "Commercial Proposals & Media Quotes",
    category: "Commercial & Finance",
    primaryRole: "CommercialLead",
    authorityCitation: "R1.2A §283",
    description: "Automated spot rate calculations per daypart (Early Morning, Daytime, Prime Time, Late Night) with dual-authorization approval.",
    activeWorkflows: ["Dual Sign-Off Trigger", "Spot Inventory Hold", "Client Pro-Forma Generation"],
  },
  {
    key: "projects",
    name: "Project Command Centre",
    category: "Executive & Core",
    primaryRole: "ProductionDirector",
    authorityCitation: "CCPP-001 §14",
    description: "Unified tracker for commissioned original series, event festival staging, and tech deployment sprints.",
    activeWorkflows: ["Milestone Delivery Tracking", "Cross-Functional Dependencies", "Resource Utilization Heatmap"],
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
    authorityCitation: "R1.2A §283",
    description: "7-way financial data separation, balanced double-entry general ledger, Nigerian WHT remittances, and MT940 bank reconciliation.",
    activeWorkflows: ["7-Way Financial Split Ledger", "Talent NIP CSV Payouts", "Bank Statement Automated Match"],
  },
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
    name: "ONE Studios Production Tracker & QC",
    category: "Hub Specialist",
    primaryRole: "ProductionDirector",
    authorityCitation: "CCPP-001 §14",
    description: "Soundstage booking calendar, ARRI/RED cinema camera gear tracking, and EBU R128 technical QC slating.",
    activeWorkflows: ["Call Sheet Automated Dispatch", "Technical QC Checklist Validation", "Damaged Gear Work Orders"],
  },
  {
    key: "events",
    name: "Fusion Events & Venue Operations",
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
    name: "Security, Audit Logging & RBAC/ABAC",
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
  {
    key: "risk",
    name: "Enterprise Risk, Issue & Incident Register",
    category: "Executive & Core",
    primaryRole: "RiskManager",
    authorityCitation: "CC-OPS-001",
    description: "StarTimes satellite transponder outages, transmission carrier drops, and commercial breach incident resolution.",
    activeWorkflows: ["Incident Sev-1 Triage", "Post-Mortem Runbook Execution", "SLA Penalty Credit Ledger"],
  },
];

export function renderWorkspaceDirectoryHtml(): string {
  const categories: Array<WorkspaceDeskDescriptor["category"]> = [
    "Executive & Core",
    "Commercial & Finance",
    "Hub Specialist",
    "Tech & Governance",
  ];

  const categorySections = categories
    .map((cat) => {
      const desks = ENTERPRISE_WORKSPACES.filter((w) => w.category === cat);
      const cardsHtml = desks
        .map(
          (d) => `
        <article class="card" style="display:flex; flex-direction:column; justify-content:space-between; border-left:4px solid var(--vmn-secondary);">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
              <span style="font-family:monospace; font-weight:700; color:#0284C7; background:#E0F2FE; padding:3px 8px; border-radius:4px; font-size:0.75rem;">
                /${d.key}
              </span>
              <span class="vmn-badge badge-ready">Active</span>
            </div>
            <h3 style="font-size:1.15rem; font-weight:700; margin-bottom:8px;">
              <a href="/workspace/${d.key}" style="text-decoration:none; color:var(--vmn-text-main);">${d.name}</a>
            </h3>
            <p style="font-size:0.875rem; color:var(--vmn-text-muted); margin-bottom:12px;">${d.description}</p>
          </div>
          <div>
            <div style="margin-bottom:12px;">
              <span style="font-size:0.75rem; font-weight:700; color:var(--vmn-text-muted);">Primary Role:</span>
              <code style="font-size:0.8rem; background:#F8FAFC; padding:2px 6px; border-radius:4px; margin-left:4px;">${d.primaryRole}</code>
            </div>
            <a href="/workspace/${d.key}" class="btn btn-outline" style="width:100%; text-align:center; min-height:40px; font-size:0.85rem;">Open Desk &rarr;</a>
          </div>
        </article>
      `
        )
        .join("");

      return `
      <div style="margin-bottom:32px;">
        <h2 style="font-size:1.35rem; font-weight:800; color:var(--vmn-primary); margin-bottom:16px; border-bottom:2px solid var(--vmn-surface-border); padding-bottom:8px;">
          ${cat} (${desks.length} Desks)
        </h2>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(340px, 1fr)); gap:20px;">
          ${cardsHtml}
        </div>
      </div>
      `;
    })
    .join("");

  return `
  <section style="display:flex; flex-direction:column; gap:24px;">
    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
      <div>
        <nav aria-label="Breadcrumb" style="font-size:0.85rem; color:var(--vmn-text-muted); margin-bottom:8px;">
          <a href="/" style="color:var(--vmn-secondary); text-decoration:none;">Home</a> &gt; 
          <span>Enterprise Workspaces</span>
        </nav>
        <h1 style="font-size:2rem; font-weight:800; color:var(--vmn-primary);">Enterprise Operating Hub & Specialist Desks</h1>
        <p style="color:var(--vmn-text-muted); margin-top:4px;">
          Surface B & C: Internal operating environment and specialist user workflows mandated by <strong>VMNL-AZP-VMN-CCPP-001</strong>.
        </p>
      </div>
      <div style="display:flex; gap:12px; align-items:center;">
        <span class="vmn-badge badge-ready">23 of 23 Desks Operational</span>
        <a href="/broadcast/screens" class="btn btn-primary">Surface D (33 Broadcast Screens) &rarr;</a>
      </div>
    </div>

    <!-- Summary Statistics Grid -->
    <div class="grid-3" style="margin-top:0;">
      <div class="card stat-box">
        <span class="stat-val">23</span>
        <span class="stat-lbl">Enterprise Operating Desks</span>
      </div>
      <div class="card stat-box">
        <span class="stat-val">4</span>
        <span class="stat-lbl">Operating Domains</span>
      </div>
      <div class="card stat-box">
        <span class="stat-val">100%</span>
        <span class="stat-lbl">RBAC / ABAC Protected</span>
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
    <div class="card" style="text-align:center; padding:48px 24px; max-width:640px; margin:40px auto;">
      <h1>Workspace Desk Not Found</h1>
      <p style="color:var(--vmn-text-muted); margin-top:8px;">No internal workspace was found matching "<strong>${deskKey}</strong>".</p>
      <a href="/workspace" class="btn btn-primary" style="margin-top:16px;">&larr; Return to Workspace Directory</a>
    </div>
    `;
  }

  const workflowsList = desk.activeWorkflows
    .map(
      (w) => `
    <li style="display:flex; align-items:center; justify-content:space-between; padding:12px; background:var(--vmn-surface-alt); border-radius:6px; border:1px solid var(--vmn-surface-border); margin-bottom:8px;">
      <span style="font-weight:600; color:var(--vmn-text-main);">${w}</span>
      <span class="vmn-badge badge-ready">Ready</span>
    </li>
  `
    )
    .join("");

  return `
  <section style="display:flex; flex-direction:column; gap:24px; max-width:960px; margin:0 auto;">
    <nav aria-label="Breadcrumb" style="font-size:0.85rem; color:var(--vmn-text-muted);">
      <a href="/" style="color:var(--vmn-secondary); text-decoration:none;">Home</a> &gt; 
      <a href="/workspace" style="color:var(--vmn-secondary); text-decoration:none;">Workspaces</a> &gt; 
      <span>${desk.name}</span>
    </nav>

    <article class="card" style="border-top:5px solid var(--vmn-secondary);">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
        <div>
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
            <span style="font-family:monospace; font-weight:800; font-size:1.1rem; color:#0284C7; background:#E0F2FE; padding:4px 10px; border-radius:6px;">
              /workspace/${desk.key}
            </span>
            <span class="vmn-badge badge-ready">${desk.category}</span>
          </div>
          <h1 style="font-size:2rem; font-weight:800; color:var(--vmn-primary); margin-bottom:8px;">
            ${desk.name}
          </h1>
          <p style="font-size:1.1rem; color:var(--vmn-text-muted);">
            ${desk.description}
          </p>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
          <span style="font-size:0.85rem; font-weight:700; color:var(--vmn-text-muted);">Governing Authority</span>
          <code style="font-size:0.8rem; background:#F8FAFC; padding:4px 8px; border-radius:4px; border:1px solid #CBD5E1;">${desk.authorityCitation}</code>
        </div>
      </div>

      <hr style="border:none; border-top:1px solid var(--vmn-surface-border); margin:20px 0;" />

      <div class="grid-2" style="margin-top:0;">
        <div>
          <h2 style="font-size:1rem; font-weight:700; text-transform:uppercase; color:var(--vmn-text-muted); margin-bottom:12px;">
            Authorized Operating Roles
          </h2>
          <div style="background:var(--vmn-surface-alt); padding:16px; border-radius:8px; border:1px solid var(--vmn-surface-border);">
            <p style="font-size:0.95rem;"><strong>Primary Lead:</strong> ${desk.primaryRole}</p>
            <p style="font-size:0.85rem; color:var(--vmn-text-muted); margin-top:4px;">Enforced via RBAC Policy Enforcement Point (`+ "`src/core/rbac/`" + `).</p>
          </div>
        </div>

        <div>
          <h2 style="font-size:1rem; font-weight:700; text-transform:uppercase; color:var(--vmn-text-muted); margin-bottom:12px;">
            Desk Operating State
          </h2>
          <div style="background:#F0FDF4; padding:16px; border-radius:8px; border:1px solid #BBF7D0;">
            <p style="font-size:0.95rem; color:#166534; font-weight:700;">Online & Gated</p>
            <p style="font-size:0.85rem; color:#15803D; margin-top:4px;">Audit trail logging active with SHA-256 HMAC integrity assurance.</p>
          </div>
        </div>
      </div>

      <div style="margin-top:24px;">
        <h2 style="font-size:1rem; font-weight:700; text-transform:uppercase; color:var(--vmn-text-muted); margin-bottom:12px;">
          Active Core Workflows
        </h2>
        <ul style="list-style:none;">
          ${workflowsList}
        </ul>
      </div>

      <div style="margin-top:24px; padding-top:20px; border-top:1px solid var(--vmn-surface-border); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <a href="/workspace" class="btn btn-outline">&larr; Back to Workspace Directory</a>
        <a href="/broadcast/dashboard" class="btn btn-primary">Open Executive Console &rarr;</a>
      </div>
    </article>
  </section>
  `;
}
