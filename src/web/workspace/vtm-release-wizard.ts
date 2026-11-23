/**
 * VTM Milestone Completion & Dual-Control Escrow Release Wizard (Wave 2)
 * Authority: VMNL-AZP-VMN-CCPP-001 §18 / Canonical Law 07 Restricted Escrow Funds
 *
 * Implements the 85/15 economic split calculation (85% talent / 15% platform commission)
 * and dual-authorization milestone escrow disbursement workflow.
 */

import { escapeHtml } from "../components/escape.js";
import type { SessionUser } from "../../core/auth/index.js";

export interface VtmReleaseWizardContext {
  contracts?: Array<{
    id: string;
    contractNumber: string;
    talentName: string;
    clientName: string;
    roleTitle: string;
    totalAmountNgn: number;
    escrowHeldNgn: number;
    milestoneTitle: string;
    milestoneAmountNgn: number;
    isFullySigned: boolean;
  }>;
  csrfToken?: string;
  user?: SessionUser | null;
  message?: string;
}

export function renderVtmReleaseWizardHtml(ctx: VtmReleaseWizardContext): string {
  const contracts = ctx.contracts || [
    {
      id: "vtm_ctr_001",
      contractNumber: "VTM-2026-088",
      talentName: "Amaka Chioma (Lead Actress)",
      clientName: "VMN OneStudios Production",
      roleTitle: "Lagos Rush Season 2 - Episode 1-4 Block",
      totalAmountNgn: 12000000,
      escrowHeldNgn: 4000000,
      milestoneTitle: "Milestone 2: Principal Photography Wrapped",
      milestoneAmountNgn: 4000000,
      isFullySigned: true,
    },
    {
      id: "vtm_ctr_002",
      contractNumber: "VTM-2026-092",
      talentName: "Tunde Bakare (Director of Photography)",
      clientName: "Guinness Nigeria Showcase",
      roleTitle: "Cultural Heritage TVC Shoot",
      totalAmountNgn: 3500000,
      escrowHeldNgn: 1750000,
      milestoneTitle: "Milestone 1: Production Rough Cut Approval",
      milestoneAmountNgn: 1750000,
      isFullySigned: true,
    },
  ];

  return `
  <article class="container vmn-cockpit-article py-4">
    <!-- Breadcrumb & Status Bar -->
    <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
      <nav aria-label="Breadcrumb" class="vmn-breadcrumb-bar text-xs text-muted flex items-center gap-1.5">
        <a href="/" class="text-muted no-underline">Home</a> <span>&gt;</span>
        <a href="/portal/vtm" class="text-muted no-underline">VTM Portal</a> <span>&gt;</span>
        <a href="/portal/vtm/contracts" class="text-muted no-underline">Contracts</a> <span>&gt;</span>
        <span aria-current="page" class="text-primary font-mono font-semibold">Escrow Release Wizard</span>
      </nav>
      <div class="flex items-center gap-2">
        <span class="vmn-badge badge-ready font-mono text-xs flex items-center gap-1">
          <span class="vmn-pulse-dot" aria-hidden="true"></span>
          85/15 SPLIT ENFORCED
        </span>
        <span class="font-mono text-xs text-muted">VTM-WIZ-01</span>
      </div>
    </div>

    <!-- Hero Header -->
    <header class="vmn-cockpit-hero card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div class="flex items-center gap-2">
          <span class="vmn-badge badge-info text-xs font-mono">DUAL-AUTHORIZATION</span>
          <span class="vmn-badge badge-outline text-xs font-mono">RESTRICTED ESCROW</span>
        </div>
        <div class="flex items-center gap-2">
          <a href="/portal/vtm/payment-visibility" class="btn btn-outline btn-sm text-xs">Payment Visibility &rarr;</a>
        </div>
      </div>
      <h1 class="text-xl md:text-2xl font-extrabold text-slate-100 mb-1">Talent Milestone Verification &amp; Escrow Disbursement</h1>
      <p class="text-xs text-muted max-w-2xl mb-3 leading-relaxed">
        Section 18 Dual-Control Requirement: Escrowed funds are held as restricted liabilities until milestone delivery proof is reviewed and signed off by both Client and Talent Manager.
      </p>
    </header>

    ${ctx.message ? `<div class="alert alert-info mb-4 p-3 rounded-lg text-xs">${escapeHtml(ctx.message)}</div>` : ""}

    <!-- Milestone Escrow Queue -->
    <div class="space-y-4 mb-4">
      ${contracts
        .map((ctr) => {
          const talentAmount = ctr.milestoneAmountNgn * 0.85;
          const platformFee = ctr.milestoneAmountNgn * 0.15;

          return `
        <div class="card p-4 rounded-xl bg-surface border border-muted/20">
          <div class="flex items-center justify-between flex-wrap gap-2 mb-3 border-b border-muted/10 pb-2">
            <div>
              <span class="font-mono text-xs text-primary font-bold">${escapeHtml(ctr.contractNumber)}</span>
              <h2 class="text-base font-bold text-slate-100 m-0">${escapeHtml(ctr.roleTitle)}</h2>
              <span class="text-xs text-muted">Client: ${escapeHtml(ctr.clientName)} | Talent: ${escapeHtml(ctr.talentName)}</span>
            </div>
            <div class="text-right">
              <span class="text-xs text-muted block">MILESTONE VALUE</span>
              <span class="text-lg font-bold text-slate-100 block">₦${ctr.milestoneAmountNgn.toLocaleString()}</span>
            </div>
          </div>

          <!-- 85/15 Economic Split Breakdown Card -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-3 p-3 rounded-lg bg-slate-900/60 border border-muted/10 text-xs">
            <div>
              <span class="text-muted block font-semibold">GROSS ESCROW DRAW</span>
              <span class="text-sm font-bold text-slate-100 block mt-0.5">₦${ctr.milestoneAmountNgn.toLocaleString()}</span>
              <span class="text-muted block mt-0.5 font-mono">Held in trust account</span>
            </div>
            <div>
              <span class="text-muted block font-semibold">NET TALENT DISBURSEMENT (85%)</span>
              <span class="text-sm font-bold text-success block mt-0.5">₦${talentAmount.toLocaleString()}</span>
              <span class="text-muted block mt-0.5">Direct to talent NUBAN</span>
            </div>
            <div>
              <span class="text-muted block font-semibold">PLATFORM COMMISSION (15%)</span>
              <span class="text-sm font-bold text-primary block mt-0.5">₦${platformFee.toLocaleString()}</span>
              <span class="text-muted block mt-0.5">Credited to Account 4100</span>
            </div>
          </div>

          <!-- Verification & Dual Sign-off Form -->
          <form method="POST" action="/api/v1/hubs/vtm/contracts/${encodeURIComponent(ctr.id)}/release-milestone" class="flex items-center justify-between flex-wrap gap-2 text-xs">
            <input type="hidden" name="csrfToken" value="${escapeHtml(ctx.csrfToken || "")}">
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" required name="evidenceVerified" value="true" class="checkbox checkbox-xs" checked>
                <span class="text-slate-200">Work evidence verified (call sheets &amp; footage inspected)</span>
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" required name="rightsAttested" value="true" class="checkbox checkbox-xs" checked>
                <span class="text-slate-200">Talent release deed executed</span>
              </label>
            </div>
            <button type="submit" class="btn btn-primary btn-sm text-xs font-bold bg-emerald-600 hover:bg-emerald-500 border-none">
              &check; Dual-Authorize &amp; Release Escrow
            </button>
          </form>
        </div>
      `;
        })
        .join("")}
    </div>
  </article>
  `;
}
