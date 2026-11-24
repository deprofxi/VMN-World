/**
 * Surface B & C — Commercial, Finance, Tech & Governance Cockpits (Desks 37–48)
 * Authority: VMNL-AZP-VMN-CCPP-001 (§24–§25) / PRD §19
 */

import { renderIcon } from "../components/icons.js";

// ----------------------------------------------------------------------------
// 37. CRM & LEADS COCKPIT
// ----------------------------------------------------------------------------
export function renderCrmCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">CRM &amp; PIPELINE</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">CRM, Leads &amp; Sales Opportunities</h2>
        </div>
        <div class="flex items-center gap-2">
          <a href="/workspace/commercial/deals" class="btn btn-primary btn-sm text-xs font-bold">+ New Commercial Deal &rarr;</a>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">TOTAL PIPELINE</span>
          <span class="text-lg font-bold block mt-1 text-primary">₦1,420,000,000</span>
          <span class="text-xs text-muted block mt-0.5">38 Active Opportunities</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">WEIGHTED FORECAST</span>
          <span class="text-lg font-bold block mt-1 text-success">₦980,500,000</span>
          <span class="text-xs text-success block mt-0.5">Q4 Closing Target</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">WIN RATE</span>
          <span class="text-lg font-bold block mt-1 text-success">68.4%</span>
          <span class="text-xs text-muted block mt-0.5">Top Tier Agencies</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">AVERAGE DEAL SIZE</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">₦37.4M</span>
          <span class="text-xs text-muted block mt-0.5">Annual Commitments</span>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 38. PROPOSALS & MEDIA QUOTES COCKPIT
// ----------------------------------------------------------------------------
export function renderQuotesCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">RATE CARDS</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Commercial Proposals &amp; Media Quotes</h2>
        </div>
        <div class="flex items-center gap-2">
          <a href="/workspace/commercial/deals" class="btn btn-outline btn-sm text-xs font-bold">Sales Pipeline &rarr;</a>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">30s PRIME-TIME BASE</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">₦450,000</span>
          <span class="text-xs text-muted block mt-0.5">NXTR / ORIS Broadcast</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">DAYTIME BASE RATE</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">₦180,000</span>
          <span class="text-xs text-muted block mt-0.5">Off-Peak Rotations</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">VOLUME DISCOUNTS</span>
          <span class="text-lg font-bold block mt-1 text-primary">5% to 20%</span>
          <span class="text-xs text-muted block mt-0.5">Tiered Contract Matrix</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">PROPOSALS ISSUED</span>
          <span class="text-lg font-bold block mt-1 text-success">28 This Month</span>
          <span class="text-xs text-muted block mt-0.5">Standardized Rate Sheets</span>
        </div>
      </div>

      <!-- Interactive Quote & Deal Proposal Builder -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div class="card p-3 rounded-lg bg-slate-950/60 border border-muted/10">
          <h3 class="font-bold text-xs text-slate-200 mb-2">Build &amp; Draft Client Commercial Proposal</h3>
          <form method="POST" action="/api/v1/commercial/deals" class="space-y-3 text-xs">
            <div>
              <label class="block text-muted mb-1 font-semibold">Campaign Deal Name</label>
              <input type="text" name="dealName" required placeholder="e.g. Festive Q4 Airtime Campaign" class="w-full p-2 rounded bg-slate-900 border border-muted/30 text-slate-100 text-xs" />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-muted mb-1 font-semibold">Advertiser / Agency</label>
                <select name="clientOrgId" class="w-full p-2 rounded bg-slate-900 border border-muted/30 text-slate-100 text-xs">
                  <option value="org_mtn_ng">MTN Nigeria (MediaReach)</option>
                  <option value="org_coke_ng">Coca-Cola Hellenic</option>
                  <option value="org_guinness_ng">Guinness Nigeria</option>
                  <option value="org_flw_tech">Flutterwave Technologies</option>
                  <option value="org_cadbury_ng">Cadbury Nigeria</option>
                </select>
              </div>
              <div>
                <label class="block text-muted mb-1 font-semibold">Contract Value (NGN)</label>
                <input type="number" name="totalContractValueNgn" value="25000000" step="500000" required class="w-full p-2 rounded bg-slate-900 border border-muted/30 text-slate-100 text-xs font-mono" />
              </div>
            </div>
            <div>
              <label class="block text-muted mb-1 font-semibold">Sales Representative</label>
              <input type="text" name="salesLeadId" value="usr_sales_lead" required class="w-full p-2 rounded bg-slate-900 border border-muted/30 text-slate-100 text-xs font-mono" />
            </div>
            <button type="submit" class="btn btn-primary w-full text-xs font-bold" data-toast="Commercial deal drafted into pipeline" data-toast-type="success">
              ${renderIcon("check", { size: 14 })}
              <span>Draft Commercial Deal &rarr;</span>
            </button>
          </form>
        </div>

        <div class="card p-3 rounded-lg bg-slate-950/60 border border-muted/10">
          <h3 class="font-bold text-xs text-slate-200 mb-2">Standard Broadcast Rate Card Tiers</h3>
          <div class="table-responsive">
            <table class="table w-full text-xs">
              <thead>
                <tr class="border-b border-muted/20 text-left text-muted">
                  <th class="py-1">Daypart Tier</th>
                  <th class="py-1">Time Slot</th>
                  <th class="py-1">Base (30s)</th>
                  <th class="py-1 text-right">Yield</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-muted/10">
                  <td class="py-1.5 font-bold text-slate-200">Prime-Time A</td>
                  <td class="text-muted">19:00 - 22:30</td>
                  <td class="font-mono text-primary">₦450,000</td>
                  <td class="text-right text-success">94% Fill</td>
                </tr>
                <tr class="border-b border-muted/10">
                  <td class="py-1.5 font-bold text-slate-200">Prime-Time B</td>
                  <td class="text-muted">17:00 - 19:00</td>
                  <td class="font-mono text-primary">₦320,000</td>
                  <td class="text-right text-success">88% Fill</td>
                </tr>
                <tr class="border-b border-muted/10">
                  <td class="py-1.5 font-bold text-slate-200">Daytime Live</td>
                  <td class="text-muted">10:00 - 17:00</td>
                  <td class="font-mono text-primary">₦180,000</td>
                  <td class="text-right text-slate-300">72% Fill</td>
                </tr>
                <tr class="border-b border-muted/10">
                  <td class="py-1.5 font-bold text-slate-200">Morning Drive</td>
                  <td class="text-muted">06:00 - 10:00</td>
                  <td class="font-mono text-primary">₦220,000</td>
                  <td class="text-right text-success">82% Fill</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="text-muted text-xs mt-2 flex items-center justify-between">
            <span>Sponsorship Bug: <strong>+₦50k/spot</strong></span>
            <span>Agency Commission: <strong>15% Standard</strong></span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 39. MASTER CONTRACTS CLM COCKPIT
// ----------------------------------------------------------------------------
export function renderContractsCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">CONTRACTS CLM</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Contract Lifecycle Management (CLM) Desk</h2>
        </div>
        <div class="flex items-center gap-2">
          <a href="/workspace/commercial/deals" class="btn btn-primary btn-sm text-xs font-bold">+ New Commercial Contract &rarr;</a>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">SIGNED CONTRACTS</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">184 Active</span>
          <span class="text-xs text-muted block mt-0.5">Advertisers &amp; Sponsors</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">DUAL AUTHORIZED</span>
          <span class="text-lg font-bold block mt-1 text-success">100% Signed</span>
          <span class="text-xs text-muted block mt-0.5">Commercial &amp; Legal</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">UPCOMING RENEWALS</span>
          <span class="text-lg font-bold block mt-1 text-primary">6 in 30 Days</span>
          <span class="text-xs text-muted block mt-0.5">Annual Retainers</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">DIGITAL SIGNATURES</span>
          <span class="text-lg font-bold block mt-1 text-success">Tamper-Proof</span>
          <span class="text-xs text-muted block mt-0.5">Legal Enforceability</span>
        </div>
      </div>

      <!-- Active Master Contracts Registry -->
      <div class="card p-3 rounded-lg bg-slate-950/60 border border-muted/10 mb-4">
        <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
          <span class="text-xs font-bold text-slate-200">Active Master Service Agreements (CLM Register)</span>
          <span class="vmn-badge badge-outline text-xs">Dual Signoff Verified</span>
        </div>
        <div class="table-responsive">
          <table class="table w-full text-xs">
            <thead>
              <tr class="border-b border-muted/20 text-left text-muted">
                <th class="py-2">Contract Ref</th>
                <th class="py-2">Counterparty</th>
                <th class="py-2">Channels / Scope</th>
                <th class="py-2">Contract Value</th>
                <th class="py-2">Stage</th>
                <th class="py-2">Dual Signoff</th>
                <th class="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary">DEAL-2026-44</td>
                <td class="font-bold text-slate-100">MTN Nigeria (MediaReach)</td>
                <td>NXTR Prime Time GRP</td>
                <td class="font-mono text-slate-200">₦45,000,000</td>
                <td><span class="vmn-badge badge-success text-xs">ACTIVE - 80% AIR</span></td>
                <td><span class="vmn-badge badge-ready text-xs">SIGNED &bull; VERIFIED</span></td>
                <td class="text-right">
                  <form method="POST" action="/api/v1/commercial/deals/DEAL-2026-44/advance" class="inline">
                    <button type="submit" class="btn btn-outline btn-xs" data-toast="Deal stage advanced to settlement" data-toast-type="info">Advance &rarr;</button>
                  </form>
                </td>
              </tr>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary">DEAL-2026-45</td>
                <td class="font-bold text-slate-100">Guinness (Starcom Media)</td>
                <td>ORIS Heritage Showcase</td>
                <td class="font-mono text-slate-200">₦22,500,000</td>
                <td><span class="vmn-badge badge-ready text-xs">CLEARED - 100%</span></td>
                <td><span class="vmn-badge badge-ready text-xs">SIGNED &bull; VERIFIED</span></td>
                <td class="text-right">
                  <a href="/portal/client" class="btn btn-outline btn-xs">View Proof</a>
                </td>
              </tr>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary">DEAL-2026-48</td>
                <td class="font-bold text-slate-100">Flutterwave Tech Hour</td>
                <td>NXTR Title Sponsor</td>
                <td class="font-mono text-slate-200">₦18,000,000</td>
                <td><span class="vmn-badge badge-warning text-xs">Awaiting Signature</span></td>
                <td><span class="vmn-badge badge-warning text-xs">Under Legal Review</span></td>
                <td class="text-right">
                  <form method="POST" action="/api/v1/commercial/deals/DEAL-2026-48/advance" class="inline">
                    <button type="submit" class="btn btn-primary btn-xs" data-toast="Deal advanced to signed" data-toast-type="success">Sign Off</button>
                  </form>
                </td>
              </tr>
              <tr class="hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary">DEAL-2026-51</td>
                <td class="font-bold text-slate-100">Cadbury Nigeria</td>
                <td>IMBD Saturday Morning</td>
                <td class="font-mono text-slate-200">₦12,000,000</td>
                <td><span class="vmn-badge badge-info text-xs">ACTIVE - 40% AIR</span></td>
                <td><span class="vmn-badge badge-ready text-xs">SIGNED &bull; VERIFIED</span></td>
                <td class="text-right">
                  <form method="POST" action="/api/v1/commercial/deals/DEAL-2026-51/advance" class="inline">
                    <button type="submit" class="btn btn-outline btn-xs" data-toast="Cadbury deal advanced" data-toast-type="info">Advance &rarr;</button>
                  </form>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 42. BANK RECONCILIATION COCKPIT
// ----------------------------------------------------------------------------
export function renderBankreconCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">TREASURY RECON</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Automated Bank Statement Reconciliation (Electronic Feeds) <span class="sr-only">(MT940/NIP)</span></h2>
        </div>
        <div class="flex items-center gap-2">
          <a href="/workspace/finance" class="btn btn-outline btn-sm text-xs font-bold">Finance Console &rarr;</a>
          <button type="button" class="btn btn-primary btn-sm text-xs font-bold" data-toast="MT940 automated parse initiated" data-toast-type="info">
            ${renderIcon("upload", { size: 14 })}
            <span>Upload Bank Statement File</span>
          </button>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">MATCHED INFLOWS</span>
          <span class="text-lg font-bold block mt-1 text-success">₦594,450,000</span>
          <span class="text-xs text-muted block mt-0.5">100% Matched to Deals</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">UNALLOCATED INFLOWS</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">₦0.00</span>
          <span class="text-xs text-success block mt-0.5">Zero Variance</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">BANK FEED TYPE</span>
          <span class="text-lg font-bold block mt-1 text-primary">Standard Bank Statement (MT940 / CAMT.053)</span>
          <span class="text-xs text-muted block mt-0.5">Direct Automated Bank Feed</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">KOBO ACCURACY</span>
          <span class="text-lg font-bold block mt-1 text-success">±0.00 Kobo</span>
          <span class="text-xs text-muted block mt-0.5">Law 05 Compliant</span>
        </div>
      </div>

      <!-- Live Matched Bank Statement Lines -->
      <div class="card p-3 rounded-lg bg-slate-950/60 border border-muted/10">
        <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
          <span class="text-xs font-bold text-slate-200">Reconciled Bank Inflow Statements</span>
          <span class="vmn-badge badge-ready text-xs">FirstBank &bull; Zenith Bank NIP</span>
        </div>
        <div class="table-responsive">
          <table class="table w-full text-xs">
            <thead>
              <tr class="border-b border-muted/20 text-left text-muted">
                <th class="py-2">Value Date</th>
                <th class="py-2">Statement Ref</th>
                <th class="py-2">Payer / Remitter</th>
                <th class="py-2">Bank Channel</th>
                <th class="py-2">Matched Deal</th>
                <th class="py-2 text-right">Inflow Amount</th>
                <th class="py-2 text-right">Recon State</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-slate-300">2026-11-20</td>
                <td class="font-mono text-primary">NIP-FB-20261120-001</td>
                <td class="font-bold text-slate-100">MediaReach OMD / MTN</td>
                <td class="text-muted">First Bank Direct NIP</td>
                <td class="font-mono text-xs text-muted">DEAL-2026-44</td>
                <td class="py-2.5 text-right font-mono font-bold text-success">₦45,000,000.00</td>
                <td class="text-right"><span class="vmn-badge badge-ready text-xs">MATCHED</span></td>
              </tr>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-slate-300">2026-11-19</td>
                <td class="font-mono text-primary">NIP-ZB-20261119-042</td>
                <td class="font-bold text-slate-100">Starcom Media / Guinness</td>
                <td class="text-muted">Zenith Bank Transfer</td>
                <td class="font-mono text-xs text-muted">DEAL-2026-45</td>
                <td class="py-2.5 text-right font-mono font-bold text-success">₦22,500,000.00</td>
                <td class="text-right"><span class="vmn-badge badge-ready text-xs">MATCHED</span></td>
              </tr>
              <tr class="hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-slate-300">2026-11-18</td>
                <td class="font-mono text-primary">NIP-GT-20261118-091</td>
                <td class="font-bold text-slate-100">Cadbury Nigeria Plc</td>
                <td class="text-muted">GTBank Corporate</td>
                <td class="font-mono text-xs text-muted">DEAL-2026-51</td>
                <td class="py-2.5 text-right font-mono font-bold text-success">₦12,000,000.00</td>
                <td class="text-right"><span class="vmn-badge badge-ready text-xs">MATCHED</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 43. HEADSPACE STRATEGIC INTELLIGENCE COCKPIT
// ----------------------------------------------------------------------------
export function renderHeadspaceCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">INTELLIGENCE</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">HeadspaceNG Strategic Intelligence Desk</h2>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">AFRICAN MEDIA SHARE</span>
          <span class="text-lg font-bold block mt-1 text-primary">22.4% Regional</span>
          <span class="text-xs text-muted block mt-0.5">Youth Culture Dominance</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">DIASPORA OTT REACH</span>
          <span class="text-lg font-bold block mt-1 text-success">1.8M Streaming</span>
          <span class="text-xs text-muted block mt-0.5">UK, US, Canada, EU</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">CONTENT SENTIMENT</span>
          <span class="text-lg font-bold block mt-1 text-success">88.2% Positive</span>
          <span class="text-xs text-muted block mt-0.5">Afro-Fusion Productions</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">STRATEGIC FORECASTS</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">12 Published</span>
          <span class="text-xs text-muted block mt-0.5">Market Opportunity Briefs</span>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 44. CR8TECH TECHNOLOGY CONSOLE COCKPIT
// ----------------------------------------------------------------------------
export function renderCr8techCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">TECHNOLOGY</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Cr8TechNG Technology &amp; Workflow Console</h2>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">SERVER RESPONSE</span>
          <span class="text-lg font-bold block mt-1 text-success">1.4ms (p95)</span>
          <span class="text-xs text-success block mt-0.5">Sub-5ms Guaranteed</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">CACHE HIT RATIO</span>
          <span class="text-lg font-bold block mt-1 text-success">98.6%</span>
          <span class="text-xs text-muted block mt-0.5">High-Speed Distributed Cache</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">DB CONNECTION POOL</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">6 / 50 Active</span>
          <span class="text-xs text-muted block mt-0.5">Resilient Primary Ledger</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">ZERO-DEP ARCHITECTURE</span>
          <span class="text-lg font-bold block mt-1 text-success">Native node:http</span>
          <span class="text-xs text-muted block mt-0.5">Zero Framework Bloat</span>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 45. RIGHTS CLEARINGHOUSE COCKPIT
// ----------------------------------------------------------------------------
export function renderRightsCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">RIGHTS VAULT</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Governed Rights Ledger &amp; Exploitation Windows</h2>
        </div>
        <div class="flex items-center gap-2">
          <a href="/broadcast/rights" class="btn btn-primary btn-sm text-xs font-bold">Clear Rights &rarr;</a>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">RIGHTS TITLES</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">1,721 Assets</span>
          <span class="text-xs text-muted block mt-0.5">Full Chain-of-Title</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">Broadcast Rights Clearance <span class="sr-only">CA-32</span></span>
          <span class="text-lg font-bold block mt-1 text-success">100% Cleared</span>
          <span class="text-xs text-muted block mt-0.5">Zero Copyright Infringements</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">TERRITORIAL WINDOWS</span>
          <span class="text-lg font-bold block mt-1 text-primary">Nigeria &amp; Sub-Saharan</span>
          <span class="text-xs text-muted block mt-0.5">Linear DTT/DTH First</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">EXPIRING IN 60 DAYS</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">2 Titles</span>
          <span class="text-xs text-muted block mt-0.5">Renewal Flagged</span>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 46. PRIVACY & NDPR ROPA COCKPIT
// ----------------------------------------------------------------------------
export function renderPrivacyCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">DATA PRIVACY</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Data Privacy &amp; Processing Register</h2>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">DATA PROCESSING REGISTER</span>
          <span class="text-lg font-bold block mt-1 text-success">Compliant</span>
          <span class="text-xs text-muted block mt-0.5">Article 30 Records Filed</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">DATA PRIVACY REQUESTS (DSAR)</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">0 Overdue</span>
          <span class="text-xs text-muted block mt-0.5">30-Day Statutory Limit</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">CONSENT LOGS</span>
          <span class="text-lg font-bold block mt-1 text-primary">100% Opt-in</span>
          <span class="text-xs text-muted block mt-0.5">Granular Cookies &amp; PII</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">DPO AUDIT</span>
          <span class="text-lg font-bold block mt-1 text-success">Annual Pass</span>
          <span class="text-xs text-muted block mt-0.5">NDPC Licensed Auditor</span>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 47. SECURITY & RBAC CONSOLE COCKPIT
// ----------------------------------------------------------------------------
export function renderSecurityCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">CYBERSECURITY</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Security, Audit Logging &amp; Access Control Console</h2>
        </div>
        <div class="flex items-center gap-2">
          <a href="/workspace/admin/users" class="btn btn-outline btn-sm text-xs font-bold">Manage Users &rarr;</a>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">SECURITY POSTURE</span>
          <span class="text-lg font-bold block mt-1 text-success">DEFCON 5 (Green)</span>
          <span class="text-xs text-muted block mt-0.5">All Systems Nominal</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">ACTIVE THREATS</span>
          <span class="text-lg font-bold block mt-1 text-success">0 Blocked</span>
          <span class="text-xs text-muted block mt-0.5">WAF &amp; Rate Limit Shield</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">SESSION INTEGRITY</span>
          <span class="text-lg font-bold block mt-1 text-primary">Cryptographic Seal</span>
          <span class="text-xs text-muted block mt-0.5">Cryptographically Signed &bull; Revocable</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">AUDIT LOG ENTRIES</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">Immutable Tail</span>
          <span class="text-xs text-muted block mt-0.5">Tamper-Evident</span>
        </div>
      </div>
    </div>
  `;
}
