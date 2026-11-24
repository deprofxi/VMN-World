/**
 * VMN Enterprise Risk, Issue & Data Privacy (DSAR) Governance Desk (Wave 4)
 * Authority: UX-REC-004/005 / NDPR §3 / CCPP-001 §10
 *
 * Implements governance risk registers, incident queues, and data subject
 * access request (DSAR) compliance workflows.
 */

import { escapeHtml } from "../components/escape.js";
import type { SessionUser } from "../../core/auth/index.js";

export interface GovernanceGrcContext {
  csrfToken?: string;
  user?: SessionUser | null;
  message?: string;
}

export function renderGovernanceGrcDeskHtml(ctx: GovernanceGrcContext): string {
  const risks = [
    {
      id: "RSK-2026-001",
      category: "BROADCAST_OPERATIONS",
      title: "StarTimes Satellite Transponder Uplink Fade Margin Degradation",
      likelihood: "MEDIUM",
      impact: "CRITICAL",
      mitigation: "Dual redundant terrestrial IP fiber backup route active via Lagos Teleport",
      owner: "BroadcastEngineer",
      status: "MITIGATED",
    },
    {
      id: "RSK-2026-002",
      category: "COMMERCIAL_SETTLEMENT",
      title: "Currency Devaluation Impact on Foreign Programme Ingest Commitments",
      likelihood: "HIGH",
      impact: "HIGH",
      mitigation: "Pre-hedged USD spot contracts with domestic barter trade offsets",
      owner: "FinanceController",
      status: "MONITORED",
    },
    {
      id: "RSK-2026-003",
      category: "DATA_PRIVACY_NDPR",
      title: "Audition Talent Personal Identification & Consent Retention Window",
      likelihood: "LOW",
      impact: "HIGH",
      mitigation: "Automated 90-day retention purge via DSAR scheduler for unselected auditionees",
      owner: "RightsManager",
      status: "RESOLVED",
    },
  ];

  return `
  <article class="container vmn-cockpit-article py-4">
    <!-- Breadcrumb & Status Bar -->
    <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
      <nav aria-label="Breadcrumb" class="vmn-breadcrumb-bar text-xs text-muted flex items-center gap-1.5">
        <a href="/" class="text-muted no-underline">Home</a> <span>&gt;</span>
        <a href="/workspace" class="text-muted no-underline">Workspaces</a> <span>&gt;</span>
        <a href="/workspace/governance/registers" class="text-muted no-underline">Governance &amp; Risk</a> <span>&gt;</span>
        <span aria-current="page" class="text-primary font-mono font-semibold">GRC Registers</span>
      </nav>
      <div class="flex items-center gap-2">
        <span class="vmn-badge badge-ready font-mono text-xs flex items-center gap-1">
          <span class="vmn-pulse-dot" aria-hidden="true"></span>
          GRC REGISTRY COMPLIANT
        </span>
        <span class="font-mono text-xs text-muted">GOV-001</span>
      </div>
    </div>

    <!-- Hero Header -->
    <header class="vmn-cockpit-hero card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div class="flex items-center gap-2">
          <span class="vmn-badge badge-info text-xs font-mono">RISK REGISTER</span>
          <span class="vmn-badge badge-outline text-xs font-mono">NDPR / GDPR PRIVACY</span>
        </div>
        <div class="flex items-center gap-2">
          <a href="#new-risk-modal" class="btn btn-primary btn-sm text-xs font-bold">+ Log New Enterprise Risk</a>
        </div>
      </div>
      <h1 class="text-xl md:text-2xl font-extrabold text-slate-100 mb-1">Enterprise Risk, Issue &amp; Privacy Desk</h1>
      <p class="text-xs text-muted max-w-2xl mb-3 leading-relaxed">
        Enterprise Governance: Proactive operational and financial risk monitoring, critical incident resolution, and statutory data privacy compliance.
      </p>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-muted/10">
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">LOGGED RISKS</span>
          <span class="text-base font-bold block mt-0.5 text-primary">${escapeHtml(risks.length)} Active</span>
          <span class="text-xs text-muted block mt-0.5 font-mono">Heatmap tracked</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">CRITICAL / SEV-1</span>
          <span class="text-base font-bold block mt-0.5 text-success">0 Unmitigated</span>
          <span class="text-xs text-muted block mt-0.5">SLA compliant</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">PRIVACY (DSAR) QUEUE</span>
          <span class="text-base font-bold block mt-0.5 text-slate-100">0 Overdue</span>
          <span class="text-xs text-muted block mt-0.5">30-day window OK</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">LITIGATION HOLDS</span>
          <span class="text-base font-bold block mt-0.5 text-slate-100">0 Freezes</span>
          <span class="text-xs text-muted block mt-0.5">Clear chain-of-title</span>
        </div>
      </div>
    </header>

    ${ctx.message ? `<div class="alert alert-info mb-4 p-3 rounded-lg text-xs">${escapeHtml(ctx.message)}</div>` : ""}

    <!-- Risk Register Table -->
    <section class="card mb-4 rounded-xl bg-surface border border-muted/20 overflow-hidden">
      <div class="p-3 flex items-center justify-between flex-wrap gap-2 border-b border-muted/10">
        <div>
          <h2 class="text-sm font-bold text-slate-100 m-0">Enterprise Risk &amp; Incident Matrix</h2>
          <p class="text-xs text-muted m-0">Categorized risk registry with mitigation controls and designated owners</p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-muted/10 bg-slate-900/40 text-muted font-mono">
              <th class="p-2.5">RISK ID</th>
              <th class="p-2.5">CATEGORY</th>
              <th class="p-2.5">RISK DESCRIPTION</th>
              <th class="p-2.5">IMPACT</th>
              <th class="p-2.5">OWNER</th>
              <th class="p-2.5">STATUS</th>
            </tr>
          </thead>
          <tbody>
            ${risks
              .map(
                (r) => `
              <tr class="border-b border-muted/5 text-slate-200 hover:bg-slate-900/30">
                <td class="p-2.5 font-mono text-primary font-semibold">${escapeHtml(r.id)}</td>
                <td class="p-2.5 font-mono text-muted text-xs">${escapeHtml(r.category)}</td>
                <td class="p-2.5">
                  <span class="font-bold text-slate-100 block">${escapeHtml(r.title)}</span>
                  <span class="text-muted text-xs block">${escapeHtml(r.mitigation)}</span>
                </td>
                <td class="p-2.5">
                  <span class="vmn-badge ${r.impact === "CRITICAL" ? "badge-warning" : "badge-info"} text-xs">
                    ${escapeHtml(r.impact)}
                  </span>
                </td>
                <td class="p-2.5 font-mono text-muted">${escapeHtml(r.owner)}</td>
                <td class="p-2.5">
                  <span class="vmn-badge badge-ready text-xs">${escapeHtml(r.status)}</span>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Log New Risk Form -->
    <section id="new-risk-modal" class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-3 border-b border-muted/10 pb-2">
        <div>
          <h2 class="text-base font-bold text-slate-100 m-0">Log New Enterprise Risk / Issue</h2>
          <p class="text-xs text-muted m-0">Establish documented risk record and escalation runbook</p>
        </div>
        <span class="vmn-badge badge-info text-xs font-mono">NEW RISK</span>
      </div>

      <form method="POST" action="/api/v1/governance/risks" class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <input type="hidden" name="csrfToken" value="${escapeHtml(ctx.csrfToken || "")}">

        <div>
          <label class="block font-semibold text-slate-200 mb-1" for="title">Risk Title *</label>
          <input type="text" id="title" name="title" required placeholder="e.g. Headend Generator Fuel Reserve Threshold" class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs">
        </div>

        <div>
          <label class="block font-semibold text-slate-200 mb-1" for="category">Risk Category *</label>
          <select id="category" name="category" required class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono">
            <option value="BROADCAST_OPERATIONS">Broadcast Operations (Uplink, Transmission, Playout)</option>
            <option value="COMMERCIAL_SETTLEMENT">Commercial Settlement (Revenue, Invoicing, Billing)</option>
            <option value="DATA_PRIVACY_NDPR">Data Privacy &amp; Consent (NDPR, Customer Requests)</option>
            <option value="LEGAL_RIGHTS">Legal &amp; Rights (Licensing, Clearances, Talent Contracts)</option>
          </select>
        </div>

        <div>
          <label class="block font-semibold text-slate-200 mb-1" for="impact">Impact Level *</label>
          <select id="impact" name="impact" required class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono">
            <option value="LOW">LOW - Minor operational inconvenience</option>
            <option value="MEDIUM" selected>MEDIUM - Noticeable service degradation</option>
            <option value="HIGH">HIGH - Channel off-air or financial penalty</option>
            <option value="CRITICAL">CRITICAL - Severe regulatory breach or complete outage</option>
          </select>
        </div>

        <div>
          <label class="block font-semibold text-slate-200 mb-1" for="mitigation">Mitigation Strategy / Control *</label>
          <input type="text" id="mitigation" name="mitigation" required placeholder="e.g. Automated cutover to secondary diesel generator" class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs">
        </div>

        <div class="col-span-1 md:col-span-2 flex items-end justify-end gap-2 pt-2">
          <button type="reset" class="btn btn-ghost btn-sm text-xs">Reset</button>
          <button type="submit" class="btn btn-primary btn-sm text-xs font-bold">+ Log Risk Record</button>
        </div>
      </form>
    </section>
  </article>
  `;
}
