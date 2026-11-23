/**
 * VMN Commercial Operations & Deals Desk (Wave 1 & Wave 2)
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §38, §41, §42 / CCPP §13
 *
 * Provides full CRUD and operational lifecycle for commercial ad sales deals,
 * campaign packages, and traffic break conflict resolution.
 */

import { escapeHtml } from "../components/escape.js";
import type { SalesDeal, SalesStage } from "../../modules/finance/sales/index.js";
import type { CommercialCampaignRecord } from "../../core/database/repositories/campaign.repository.js";
import type { SessionUser } from "../../core/auth/index.js";

export interface CommercialDeskContext {
  deals: SalesDeal[];
  campaigns?: CommercialCampaignRecord[];
  csrfToken?: string;
  user?: SessionUser | null;
  message?: string;
}

export function renderCommercialDealsDeskHtml(ctx: CommercialDeskContext): string {
  const deals = ctx.deals || [];
  const totalPipeline = deals.reduce((acc, d) => acc + (d.totalContractValueNgn || 0), 0);
  const recognizedRev = deals.reduce((acc, d) => acc + (d.recognizedRevenueNgn || 0), 0);
  const cashCollected = deals.reduce((acc, d) => acc + (d.cashCollectedAmountNgn || 0), 0);
  const activeCount = deals.filter((d) => d.stage !== "REVENUE_RECOGNIZED").length;

  return `
  <article class="container vmn-cockpit-article py-4">
    <!-- Breadcrumb & Status Bar -->
    <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
      <nav aria-label="Breadcrumb" class="vmn-breadcrumb-bar text-xs text-muted flex items-center gap-1.5">
        <a href="/" class="text-muted no-underline">Home</a> <span>&gt;</span>
        <a href="/workspace" class="text-muted no-underline">Workspaces</a> <span>&gt;</span>
        <a href="/workspace/commercial/deals" class="text-primary font-mono no-underline">Commercial Deals</a> <span>&gt;</span>
        <span aria-current="page" class="text-slate-100 font-semibold">Deal Pipeline</span>
      </nav>
      <div class="flex items-center gap-2">
        <span class="vmn-badge badge-ready font-mono text-xs flex items-center gap-1">
          <span class="vmn-pulse-dot" aria-hidden="true"></span>
          SALES ENGINE ACTIVE
        </span>
        <span class="font-mono text-xs text-muted">Q2C-001</span>
      </div>
    </div>

    <!-- Hero Header -->
    <header class="vmn-cockpit-hero card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div class="flex items-center gap-2">
          <span class="vmn-badge badge-info text-xs font-mono">QUOTE-TO-CASH</span>
          <span class="vmn-badge badge-outline text-xs font-mono">PILLAR 4</span>
        </div>
        <div class="flex items-center gap-2">
          <a href="#new-deal-modal" class="btn btn-primary btn-sm text-xs font-bold">+ New Commercial Deal</a>
          <a href="/workspace/commercial/traffic-wizard" class="btn btn-outline btn-sm text-xs">Traffic Wizard &rarr;</a>
        </div>
      </div>
      <h1 class="text-xl md:text-2xl font-extrabold text-slate-100 mb-1">Commercial Sales &amp; Deal Pipeline</h1>
      <p class="text-xs text-muted max-w-2xl mb-3 leading-relaxed">
        Governs ad airtime commitments, sponsor packages, billing stages, and Proof-of-Performance certifications across NXTR, ORIS, and IMBD.
      </p>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-muted/10">
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">TOTAL PIPELINE VALUE</span>
          <span class="text-base font-bold block mt-0.5 text-primary">₦${escapeHtml(totalPipeline.toLocaleString())}</span>
          <span class="text-xs text-muted block mt-0.5 font-mono">${escapeHtml(deals.length)} total deals</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">CASH COLLECTED</span>
          <span class="text-base font-bold block mt-0.5 text-success">₦${escapeHtml(cashCollected.toLocaleString())}</span>
          <span class="text-xs text-muted block mt-0.5">Bank confirmed</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">RECOGNIZED REVENUE</span>
          <span class="text-base font-bold block mt-0.5 text-warning">₦${escapeHtml(recognizedRev.toLocaleString())}</span>
          <span class="text-xs text-muted block mt-0.5">As-run reconciled</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">ACTIVE COMMITMENTS</span>
          <span class="text-base font-bold block mt-0.5 text-slate-100">${escapeHtml(activeCount)} Open</span>
          <span class="text-xs text-muted block mt-0.5">In flight / Invoiced</span>
        </div>
      </div>
    </header>

    ${ctx.message ? `<div class="alert alert-info mb-4 p-3 rounded-lg text-xs">${escapeHtml(ctx.message)}</div>` : ""}

    <!-- Deals Data Table -->
    <section class="card mb-4 rounded-xl bg-surface border border-muted/20 overflow-hidden">
      <div class="p-3 flex items-center justify-between flex-wrap gap-2 border-b border-muted/10">
        <div>
          <h2 class="text-sm font-bold text-slate-100 m-0">Commercial Deals Registry</h2>
          <p class="text-xs text-muted m-0">Canonical SalesDealRecord records from QuoteToCashSalesEngine</p>
        </div>
        <div class="flex items-center gap-2">
          <input type="search" placeholder="Filter by client or deal..." class="input input-xs text-xs px-2 py-1 bg-slate-900/80 border border-muted/20 rounded" id="deal-search">
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-muted/10 bg-slate-900/40 text-muted font-mono">
              <th class="p-2.5">DEAL ID</th>
              <th class="p-2.5">DEAL NAME</th>
              <th class="p-2.5">CLIENT / ORG</th>
              <th class="p-2.5 text-right">CONTRACT VALUE</th>
              <th class="p-2.5 text-right">COLLECTED</th>
              <th class="p-2.5">STAGE</th>
              <th class="p-2.5">PROOF-OF-AIR</th>
              <th class="p-2.5 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            ${
              deals.length === 0
                ? `<tr><td colspan="8" class="p-4 text-center text-muted">No commercial deals registered yet. Create your first deal below.</td></tr>`
                : deals
                    .map(
                      (deal) => `
              <tr class="border-b border-muted/5 text-slate-200 hover:bg-slate-900/30">
                <td class="p-2.5 font-mono text-primary font-semibold">${escapeHtml(deal.id)}</td>
                <td class="p-2.5 font-bold text-slate-100">${escapeHtml(deal.dealName)}</td>
                <td class="p-2.5 font-mono text-muted">${escapeHtml(deal.clientOrgId)}</td>
                <td class="p-2.5 text-right font-mono font-bold text-slate-100">₦${deal.totalContractValueNgn.toLocaleString()}</td>
                <td class="p-2.5 text-right font-mono text-success">₦${deal.cashCollectedAmountNgn.toLocaleString()}</td>
                <td class="p-2.5">
                  <span class="vmn-badge ${stageBadgeClass(deal.stage)} text-xs">${escapeHtml(deal.stage)}</span>
                </td>
                <td class="p-2.5">
                  ${
                    deal.proofOfPerformanceVerified
                      ? `<a href="/api/v1/commercial/deals/${encodeURIComponent(deal.id)}/proof-certificate" target="_blank" class="vmn-badge badge-ready text-xs no-underline">Verified Certificate &rarr;</a>`
                      : `<span class="text-muted text-xs">Pending Aired Logs</span>`
                  }
                </td>
                <td class="p-2.5 text-right">
                  <div class="inline-flex items-center gap-1">
                    <form method="POST" action="/api/v1/commercial/deals/${encodeURIComponent(deal.id)}/advance" class="inline">
                      <input type="hidden" name="csrfToken" value="${escapeHtml(ctx.csrfToken || "")}">
                      <button type="submit" class="btn btn-outline btn-xs" ${deal.stage === "REVENUE_RECOGNIZED" ? "disabled" : ""}>
                        ${deal.stage === "CONTRACT_SIGNED" ? "Invoice" : deal.stage === "INVOICED" ? "Collect" : deal.stage === "CASH_COLLECTED" ? "Recognize" : "Advance"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            `
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>

    <!-- Create New Deal Section / Drawer -->
    <section id="new-deal-modal" class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-3 border-b border-muted/10 pb-2">
        <div>
          <h2 class="text-base font-bold text-slate-100 m-0">Register New Commercial Deal</h2>
          <p class="text-xs text-muted m-0">Establish a canonical SalesDealRecord contract in the Quote-to-Cash ledger</p>
        </div>
        <span class="vmn-badge badge-info text-xs font-mono">CREATE DEAL</span>
      </div>

      <form method="POST" action="/api/v1/commercial/deals" class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <input type="hidden" name="csrfToken" value="${escapeHtml(ctx.csrfToken || "")}">

        <div>
          <label class="block font-semibold text-slate-200 mb-1" for="dealName">Deal Title / Campaign Name *</label>
          <input type="text" id="dealName" name="dealName" required placeholder="e.g. Festive Prime Time Sponsorship 2026" class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs">
        </div>

        <div>
          <label class="block font-semibold text-slate-200 mb-1" for="clientOrgId">Client / Agency Identifier *</label>
          <input type="text" id="clientOrgId" name="clientOrgId" required placeholder="e.g. org_mtn_nigeria or org_guinness" class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono">
        </div>

        <div>
          <label class="block font-semibold text-slate-200 mb-1" for="totalContractValueNgn">Gross Contract Value (NGN) *</label>
          <input type="number" id="totalContractValueNgn" name="totalContractValueNgn" required min="1000" step="1000" placeholder="e.g. 25000000" class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono">
        </div>

        <div>
          <label class="block font-semibold text-slate-200 mb-1" for="depositAmountNgn">Initial Deposit Required (NGN)</label>
          <input type="number" id="depositAmountNgn" name="depositAmountNgn" min="0" step="1000" placeholder="e.g. 5000000" class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono">
        </div>

        <div>
          <label class="block font-semibold text-slate-200 mb-1" for="salesLeadId">Sales Account Executive ID</label>
          <input type="text" id="salesLeadId" name="salesLeadId" placeholder="e.g. usr_lead_sales_01" value="${escapeHtml(ctx.user?.userId || "usr_sales_exec")}" class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono">
        </div>

        <div class="flex items-end justify-end gap-2 pt-2">
          <button type="reset" class="btn btn-ghost btn-sm text-xs">Reset Form</button>
          <button type="submit" class="btn btn-primary btn-sm text-xs font-bold">+ Create Contract Deal</button>
        </div>
      </form>
    </section>
  </article>
  `;
}

function stageBadgeClass(stage: SalesStage): string {
  switch (stage) {
    case "REVENUE_RECOGNIZED":
      return "badge-ready";
    case "CASH_COLLECTED":
    case "INVOICED":
      return "badge-info";
    case "CONTRACT_SIGNED":
    case "DEPOSIT_RECEIVED":
      return "badge-warning";
    default:
      return "badge-outline";
  }
}

/**
 * Wave 2: Traffic Wizard & Ad Break Clash Resolver
 */
export function renderTrafficWizardHtml(_ctx: CommercialDeskContext): string {
  return `
  <article class="container vmn-cockpit-article py-4">
    <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
      <nav aria-label="Breadcrumb" class="vmn-breadcrumb-bar text-xs text-muted flex items-center gap-1.5">
        <a href="/" class="text-muted no-underline">Home</a> <span>&gt;</span>
        <a href="/workspace" class="text-muted no-underline">Workspaces</a> <span>&gt;</span>
        <a href="/workspace/commercial/deals" class="text-muted no-underline">Commercial</a> <span>&gt;</span>
        <span aria-current="page" class="text-primary font-mono font-semibold">Traffic Clash Resolver</span>
      </nav>
      <span class="vmn-badge badge-ready text-xs font-mono">TRAFFIC WIZARD</span>
    </div>

    <header class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <h1 class="text-xl font-bold text-slate-100 mb-1">Commercial Break Placement &amp; Conflict Resolver</h1>
      <p class="text-xs text-muted mb-0">
        Automated collision detection enforcing industry standards: minimum 15-minute pod separation between direct category competitors (e.g. Telecommunications, Carbonated Beverages, Banking).
      </p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
      <div class="card p-3 rounded-lg bg-surface border border-muted/20">
        <h3 class="text-xs font-bold text-slate-100 mb-2">Channel NXTR (Prime Time Break 14:15)</h3>
        <div class="space-y-1.5 text-xs">
          <div class="p-2 rounded bg-slate-900 border border-muted/10 flex items-center justify-between">
            <span class="font-bold">Spot 1: MTN 5G Data</span>
            <span class="vmn-badge badge-ready text-xs">Telecom</span>
          </div>
          <div class="p-2 rounded bg-red-950/40 border border-red-500/30 flex items-center justify-between text-red-200">
            <span class="font-bold">Spot 2: Airtel SmartSIM</span>
            <span class="vmn-badge badge-warning text-xs">CLASH DETECTED</span>
          </div>
          <div class="p-2 rounded bg-slate-900 border border-muted/10 flex items-center justify-between">
            <span class="font-bold">Spot 3: Indomie Noodles</span>
            <span class="vmn-badge badge-info text-xs">FMCG</span>
          </div>
        </div>
        <div class="mt-3 pt-2 border-t border-muted/10">
          <button type="button" class="btn btn-primary btn-xs w-full font-bold" data-toast="Re-allocating Airtel SmartSIM to Break 14:45..." data-toast-type="success">
            Auto-Resolve Conflict &rarr;
          </button>
        </div>
      </div>

      <div class="card p-3 rounded-lg bg-surface border border-muted/20">
        <h3 class="text-xs font-bold text-slate-100 mb-2">Channel ORIS (Cultural Hour Break 15:00)</h3>
        <div class="space-y-1.5 text-xs">
          <div class="p-2 rounded bg-slate-900 border border-muted/10 flex items-center justify-between">
            <span class="font-bold">Spot 1: Guinness Gold</span>
            <span class="vmn-badge badge-ready text-xs">Beverage</span>
          </div>
          <div class="p-2 rounded bg-slate-900 border border-muted/10 flex items-center justify-between">
            <span class="font-bold">Spot 2: Zenith Bank App</span>
            <span class="vmn-badge badge-ready text-xs">Banking</span>
          </div>
          <div class="p-2 rounded bg-slate-900 border border-muted/10 flex items-center justify-between">
            <span class="font-bold">Spot 3: Oando Lubricants</span>
            <span class="vmn-badge badge-ready text-xs">Energy</span>
          </div>
        </div>
        <div class="mt-3 pt-2 border-t border-muted/10 text-xs text-success flex items-center gap-1">
          <span>&check; Clean break: Zero category clashes</span>
        </div>
      </div>

      <div class="card p-3 rounded-lg bg-surface border border-muted/20">
        <h3 class="text-xs font-bold text-slate-100 mb-2">Channel IMBD (Candy Morning Break 10:30)</h3>
        <div class="space-y-1.5 text-xs">
          <div class="p-2 rounded bg-slate-900 border border-muted/10 flex items-center justify-between">
            <span class="font-bold">Spot 1: Bournvita Choco</span>
            <span class="vmn-badge badge-ready text-xs">Kids FMCG</span>
          </div>
          <div class="p-2 rounded bg-slate-900 border border-muted/10 flex items-center justify-between">
            <span class="font-bold">Spot 2: Cowbell Milk</span>
            <span class="vmn-badge badge-ready text-xs">Kids FMCG</span>
          </div>
        </div>
        <div class="mt-3 pt-2 border-t border-muted/10">
          <button type="button" class="btn btn-outline btn-xs w-full">Optimize Break Fill &rarr;</button>
        </div>
      </div>
    </div>
  </article>
  `;
}
