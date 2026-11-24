/**
 * Surface B & C — Executive & Core Governance Operational Cockpits (Desks 1–12)
 * Authority: VMNL-AZP-VMN-CCPP-001 (§8–§12) / Nielsen Norman Usability Heuristics
 */

import { renderIcon } from "../components/icons.js";

// ----------------------------------------------------------------------------
// 1. EXECUTIVE COMMAND COCKPIT
// ----------------------------------------------------------------------------
export function renderExecutiveCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">EXECUTIVE PILLAR 1</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Enterprise Executive Command Dashboard</h2>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" class="btn btn-outline btn-sm text-xs" data-toast="Executive brief export queued (PDF)" data-toast-type="info">
            ${renderIcon("download", { size: 14 })}
            <span>Export Executive Brief</span>
          </button>
        </div>
      </div>

      <!-- Cross-Pillar Metrics Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">CONSOLIDATED EBITDA</span>
          <span class="text-lg font-bold block mt-1 text-success">₦482,450,000</span>
          <span class="text-xs text-success block mt-0.5">▲ +14.2% MoM</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">3-CHANNEL PEAK REACH</span>
          <span class="text-lg font-bold block mt-1 text-primary">4.2M Viewers</span>
          <span class="text-xs text-muted block mt-0.5">NXTR / ORIS / IMBD</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">HUB ACTIVE SLATE</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">18 Productions</span>
          <span class="text-xs text-muted block mt-0.5">₦1.2B In Progress</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">STARTIMES CARRIAGE</span>
          <span class="text-lg font-bold block mt-1 text-success">99.98% SLA</span>
          <span class="text-xs text-success block mt-0.5">Carrier Locked</span>
        </div>
      </div>

      <!-- Critical Control Center -->
      <div class="card p-3 rounded-lg bg-slate-950/60 border border-muted/10 mb-4">
        <h3 class="text-sm font-bold text-slate-100 mb-2">Pillar Health &amp; Escalation Runway</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div class="p-2.5 rounded bg-slate-900/40 border border-muted/10">
            <span class="font-bold text-slate-200 block mb-1">Linear Broadcast Carrier</span>
            <p class="text-muted mb-2">StarTimes DTT / DTH transponder signals operating within nominal specs.</p>
            <a href="/workspace/mcr" class="btn btn-outline btn-xs">Open MCR &rarr;</a>
          </div>
          <div class="p-2.5 rounded bg-slate-900/40 border border-muted/10">
            <span class="font-bold text-slate-200 block mb-1">Commercial Ad Yield</span>
            <p class="text-muted mb-2">Prime-time breaks 94% booked for Q4 festive period with 0 pod clashes.</p>
            <a href="/workspace/commercial/deals" class="btn btn-outline btn-xs">Open Deals &rarr;</a>
          </div>
          <div class="p-2.5 rounded bg-slate-900/40 border border-muted/10">
            <span class="font-bold text-slate-200 block mb-1">Treasury &amp; Settlements</span>
            <p class="text-muted mb-2">7-Pillar Ledger balanced to ₦0.00 kobo tolerance with dual signoff.</p>
            <a href="/workspace/finance/ledger" class="btn btn-outline btn-xs">Open Ledger &rarr;</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 2. IAM (IDENTITY & ACCESS MANAGEMENT) COCKPIT
// ----------------------------------------------------------------------------
export function renderIamCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">SECURITY PILLAR 1</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Identity &amp; Role-Based Access Control Console</h2>
        </div>
        <div class="flex items-center gap-2">
          <a href="/workspace/admin/users" class="btn btn-primary btn-sm text-xs font-bold">+ Provision User</a>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">ENTERPRISE USERS</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">142 Active</span>
          <span class="text-xs text-muted block mt-0.5">Across 4 Tenants</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">ROLE PERMISSIONS MATRIX</span>
          <span class="text-lg font-bold block mt-1 text-primary">28 Enterprise Roles</span>
          <span class="text-xs text-muted block mt-0.5">Zero Wildcards</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">MFA ENFORCEMENT</span>
          <span class="text-lg font-bold block mt-1 text-success">100% Mandated</span>
          <span class="text-xs text-success block mt-0.5">FIDO2 / TOTP</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">FAILED LOGINS (24H)</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">0 Lockouts</span>
          <span class="text-xs text-muted block mt-0.5">Rate Limit Nominal</span>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 3. ORGANISATIONS COCKPIT
// ----------------------------------------------------------------------------
export function renderOrganisationsCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">DIRECTORY</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Organisation &amp; Counterparty Registry</h2>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">CLIENT ACCOUNTS</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">86 Registered</span>
          <span class="text-xs text-muted block mt-0.5">Agencies &amp; Brands</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">KYC VERIFIED</span>
          <span class="text-lg font-bold block mt-1 text-success">98.2% Tier-1</span>
          <span class="text-xs text-muted block mt-0.5">CAC / TIN Verified</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">CREDIT STATUS</span>
          <span class="text-lg font-bold block mt-1 text-primary">₦320M Line</span>
          <span class="text-xs text-muted block mt-0.5">30-Day Payment Terms</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">DISPUTES / HOLDS</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">0 Accounts</span>
          <span class="text-xs text-muted block mt-0.5">Clean Ledger</span>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 4. PROJECTS COMMAND CENTRE COCKPIT
// ----------------------------------------------------------------------------
export function renderProjectsCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">PRODUCTION PMO</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Project Command Centre &amp; Production Slates</h2>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">ACTIVE PRODUCTIONS</span>
          <span class="text-lg font-bold block mt-1 text-primary">14 Slates</span>
          <span class="text-xs text-muted block mt-0.5">In Pre/Production</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">STAGE ALLOCATION</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">3 Soundstages</span>
          <span class="text-xs text-muted block mt-0.5">100% Utilized</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">DELIVERY ON SCHEDULE</span>
          <span class="text-lg font-bold block mt-1 text-success">92.8%</span>
          <span class="text-xs text-success block mt-0.5">Zero Critical Delays</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">BUDGET VARIANCE</span>
          <span class="text-lg font-bold block mt-1 text-success">-2.1% Under</span>
          <span class="text-xs text-muted block mt-0.5">Rigorous Contingency</span>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 5. RISK & INCIDENT COCKPIT
// ----------------------------------------------------------------------------
export function renderRiskCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-warning font-mono text-xs">GRC REGISTERS</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Enterprise Risk, Issue &amp; Incident Register</h2>
        </div>
        <div class="flex items-center gap-2">
          <a href="/workspace/governance/registers" class="btn btn-outline btn-sm text-xs font-bold">Open GRC Registers &rarr;</a>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">SEV-1 INCIDENTS</span>
          <span class="text-lg font-bold block mt-1 text-success">0 Open</span>
          <span class="text-xs text-muted block mt-0.5">All Clear</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">LOGGED RISKS</span>
          <span class="text-lg font-bold block mt-1 text-primary">24 Tracked</span>
          <span class="text-xs text-muted block mt-0.5">Mitigations Assigned</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">DATA PRIVACY SLA</span>
          <span class="text-lg font-bold block mt-1 text-success">100% On-Time</span>
          <span class="text-xs text-muted block mt-0.5">0 Overdue DSARs</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">NBC COMPLIANCE</span>
          <span class="text-lg font-bold block mt-1 text-success">100% Passed</span>
          <span class="text-xs text-muted block mt-0.5">Broadcasting Code</span>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 6. BOARD & INVESTOR RELATIONS COCKPIT
// ----------------------------------------------------------------------------
export function renderBoardCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">GOVERNANCE</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Board of Directors &amp; Investor Relations Desk</h2>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">ANNUAL REVENUE</span>
          <span class="text-lg font-bold block mt-1 text-success">₦5.84B</span>
          <span class="text-xs text-success block mt-0.5">▲ +22.4% YoY</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">DIVIDEND YIELD</span>
          <span class="text-lg font-bold block mt-1 text-primary">8.5% Target</span>
          <span class="text-xs text-muted block mt-0.5">Quarterly Payout</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">RESOLUTIONS PASSED</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">12 / 12</span>
          <span class="text-xs text-muted block mt-0.5">Unanimous Quorum</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">CAPEX AUDIT</span>
          <span class="text-lg font-bold block mt-1 text-success">Clean Audit</span>
          <span class="text-xs text-muted block mt-0.5">Zero Discrepancies</span>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 7. STRATEGIC PROCUREMENT COCKPIT
// ----------------------------------------------------------------------------
export function renderProcurementCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">PROCUREMENT</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Strategic Procurement &amp; Vendor Registry</h2>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">APPROVED VENDORS</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">48 Suppliers</span>
          <span class="text-xs text-muted block mt-0.5">Broadcast &amp; Tech</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">PENDING POs</span>
          <span class="text-lg font-bold block mt-1 text-primary">3 Orders</span>
          <span class="text-xs text-muted block mt-0.5">₦14.2M Total</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">SATELLITE LEASE</span>
          <span class="text-lg font-bold block mt-1 text-success">Current (E10B)</span>
          <span class="text-xs text-muted block mt-0.5">Transponder Paid</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">DoA COMPLIANCE</span>
          <span class="text-lg font-bold block mt-1 text-success">100% Signed</span>
          <span class="text-xs text-muted block mt-0.5">Dual Authorization</span>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 8. AUDIT & REGULATORY COCKPIT
// ----------------------------------------------------------------------------
export function renderAuditCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">AUDIT PILLAR 1</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Enterprise Regulatory &amp; Internal Audit Desk</h2>
        </div>
        <div class="flex items-center gap-2">
          <a href="/workspace/admin/audit" class="btn btn-primary btn-sm text-xs font-bold">Open Full Hash Chain Explorer &rarr;</a>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">CHAIN INTEGRITY</span>
          <span class="text-lg font-bold block mt-1 text-success">SHA-256 Valid</span>
          <span class="text-xs text-muted block mt-0.5">Zero Hash Breaks</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">NBC CODE CHECKS</span>
          <span class="text-lg font-bold block mt-1 text-success">100% Clean</span>
          <span class="text-xs text-muted block mt-0.5">0 Broadcast Violations</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">EVIDENCE VAULT</span>
          <span class="text-lg font-bold block mt-1 text-primary">1,721 Assets</span>
          <span class="text-xs text-muted block mt-0.5">Tamper-Evident</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">EXTERNAL AUDITORS</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">KPMG Nigeria</span>
          <span class="text-xs text-muted block mt-0.5">Annual Report</span>
        </div>
      </div>

      <!-- Live Cryptographic Hash Chain Inspector -->
      <div class="card p-3 rounded-lg bg-slate-950/60 border border-muted/10 mb-4">
        <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-200">Immutable Cryptographic Audit Trail (SHA-256 Merkle Block Chain)</span>
            <span class="vmn-badge badge-ready text-xs">CHAIN VERIFIED: 0 TAMPER EVENTS</span>
          </div>
          <a href="/workspace/admin/audit" class="text-xs text-primary font-bold">View Genesis to Head &rarr;</a>
        </div>
        <div class="table-responsive">
          <table class="table w-full text-xs">
            <thead>
              <tr class="border-b border-muted/20 text-left text-muted">
                <th class="py-2">Block #</th>
                <th class="py-2">Timestamp (UTC)</th>
                <th class="py-2">Action / Resource</th>
                <th class="py-2">Actor (Session User)</th>
                <th class="py-2">SHA-256 Block Hash</th>
                <th class="py-2 text-right">Integrity</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2 font-mono text-primary font-bold">#1415 (HEAD)</td>
                <td class="font-mono text-muted">2026-11-21 14:12:08</td>
                <td><span class="vmn-badge badge-info text-xs">Ad Splice Injected <span class="sr-only">SCTE35_SPLICE_INJECTED</span></span></td>
                <td class="font-mono text-slate-300">MCO Playout Lead <span class="sr-only">(usr_mco_playout)</span></td>
                <td class="font-mono text-xs text-muted">9b4f2c81...e201a4bc</td>
                <td class="text-right"><span class="vmn-badge badge-ready text-xs">VALID</span></td>
              </tr>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2 font-mono text-primary font-bold">#1414</td>
                <td class="font-mono text-muted">2026-11-21 13:45:22</td>
                <td><span class="vmn-badge badge-success text-xs">Payout Approved (Dual-Auth) <span class="sr-only">PAYOUT_DUAL_AUTH_KEY2</span></span></td>
                <td class="font-mono text-slate-300">CFO Signoff <span class="sr-only">(usr_cfo_signoff)</span></td>
                <td class="font-mono text-xs text-muted">4a17d890...f312c980</td>
                <td class="text-right"><span class="vmn-badge badge-ready text-xs">VALID</span></td>
              </tr>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2 font-mono text-primary font-bold">#1413</td>
                <td class="font-mono text-muted">2026-11-21 12:30:15</td>
                <td><span class="vmn-badge badge-ready text-xs">Schedule Locked (48h) <span class="sr-only">SCHEDULE_DAY_FROZEN_48H</span></span></td>
                <td class="font-mono text-slate-300">Scheduler Lead <span class="sr-only">(usr_scheduler_lead)</span></td>
                <td class="font-mono text-xs text-muted">8c3210aa...1904bb77</td>
                <td class="text-right"><span class="vmn-badge badge-ready text-xs">VALID</span></td>
              </tr>
              <tr class="hover:bg-slate-900/40">
                <td class="py-2 font-mono text-primary font-bold">#1412</td>
                <td class="font-mono text-muted">2026-11-21 11:15:00</td>
                <td><span class="vmn-badge badge-outline text-xs">Commercial Contract Signed <span class="sr-only">COMMERCIAL_DEAL_SIGNED</span></span></td>
                <td class="font-mono text-slate-300">Ad Sales Manager <span class="sr-only">(usr_ad_sales_mgr)</span></td>
                <td class="font-mono text-xs text-muted">1d99e034...7761ef22</td>
                <td class="text-right"><span class="vmn-badge badge-ready text-xs">VALID</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 9. ESG & SUSTAINABILITY COCKPIT
// ----------------------------------------------------------------------------
export function renderEsgCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">SUSTAINABILITY</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Sustainability &amp; Corporate Social Responsibility (ESG)</h2>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">SOLAR HYBRID POWER</span>
          <span class="text-lg font-bold block mt-1 text-success">64.2% Grid Free</span>
          <span class="text-xs text-muted block mt-0.5">Lagos Studio A/B</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">DIESEL SAVINGS</span>
          <span class="text-lg font-bold block mt-1 text-primary">12,400 Liters</span>
          <span class="text-xs text-muted block mt-0.5">Monthly Reduction</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">GENDER DIVERSITY</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">48% Female Leads</span>
          <span class="text-xs text-muted block mt-0.5">Creative Slate</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">COMMUNITY SCHOLARSHIPS</span>
          <span class="text-lg font-bold block mt-1 text-success">60 AFCA Fellows</span>
          <span class="text-xs text-muted block mt-0.5">100% Tuition Waived</span>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 10. CORPORATE COMMUNICATIONS COCKPIT
// ----------------------------------------------------------------------------
export function renderCommsCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">COMMUNICATIONS</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Corporate Communications &amp; Public Relations</h2>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">PRESS RELEASES</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">18 Issued</span>
          <span class="text-xs text-muted block mt-0.5">Global Media Reach</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">EMBARGO STATUS</span>
          <span class="text-lg font-bold block mt-1 text-primary">2 Under Embargo</span>
          <span class="text-xs text-muted block mt-0.5">Q1 2027 Lineup</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">MEDIA ENGAGEMENTS</span>
          <span class="text-lg font-bold block mt-1 text-success">98.4% Sentiment</span>
          <span class="text-xs text-muted block mt-0.5">Positive Coverage</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">CRISIS RUNBOOK</span>
          <span class="text-lg font-bold block mt-1 text-success">Ready (Green)</span>
          <span class="text-xs text-muted block mt-0.5">Spokespersons Designated</span>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 11. HR & PEOPLE COCKPIT
// ----------------------------------------------------------------------------
export function renderHrCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">PEOPLE &amp; CULTURE</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Enterprise People, Culture &amp; Payroll Operations</h2>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">FULL-TIME STAFF</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">142 Employees</span>
          <span class="text-xs text-muted block mt-0.5">Broadcast &amp; Tech</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">CONTRACT CREW</span>
          <span class="text-lg font-bold block mt-1 text-primary">280 On Roster</span>
          <span class="text-xs text-muted block mt-0.5">Nollywood Guild Mapped</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">PAYROLL REMITTANCE</span>
          <span class="text-lg font-bold block mt-1 text-success">100% Current</span>
          <span class="text-xs text-muted block mt-0.5">PAYE, Pension, NHF</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">CREW HEALTH / COMP</span>
          <span class="text-lg font-bold block mt-1 text-success">Covered</span>
          <span class="text-xs text-muted block mt-0.5">On-Set Medical Insurance</span>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 12. LEGAL AFFAIRS CHAMBER COCKPIT
// ----------------------------------------------------------------------------
export function renderLegalCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">GENERAL COUNSEL</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">General Counsel &amp; Legal Affairs Chamber</h2>
        </div>
        <div class="flex items-center gap-2">
          <a href="/broadcast/rights" class="btn btn-outline btn-sm text-xs font-bold">Clear Broadcast Rights <span class="sr-only">CA-32</span> &rarr;</a>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">MASTER CONTRACTS</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">184 Executed</span>
          <span class="text-xs text-muted block mt-0.5">Zero Open Disputes</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">Broadcast Rights Clearance <span class="sr-only">CA-32</span></span>
          <span class="text-lg font-bold block mt-1 text-success">100% Cleared</span>
          <span class="text-xs text-muted block mt-0.5">Music &amp; Archival Footage</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">DEFAMATION REVIEWS</span>
          <span class="text-lg font-bold block mt-1 text-primary">6 Pre-Screened</span>
          <span class="text-xs text-muted block mt-0.5">Current Affairs / News</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">COPYRIGHT LITIGATION</span>
          <span class="text-lg font-bold block mt-1 text-success">0 Claims</span>
          <span class="text-xs text-muted block mt-0.5">Full Chain-of-Title</span>
        </div>
      </div>
    </div>
  `;
}
