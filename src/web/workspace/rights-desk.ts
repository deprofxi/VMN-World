/**
 * VMN Intellectual Property & Rights Clearinghouse Desk (Wave 1 & Wave 2)
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §45, CCPP-001 §15 / CA-32
 *
 * Implements full CRUD for rights records, contract chain-of-title evidence,
 * and the authoritative CA-32 rights clearance approval workflow.
 */

import { escapeHtml } from "../components/escape.js";
import type { StoredRightsRecord } from "../../core/database/repositories/rights.repository.js";
import type { SessionUser } from "../../core/auth/index.js";

export interface RightsDeskContext {
  records: StoredRightsRecord[];
  csrfToken?: string;
  user?: SessionUser | null;
  message?: string;
}

export function renderRightsDeskHtml(ctx: RightsDeskContext): string {
  const records = ctx.records || [];
  const now = new Date();
  const expiringSoonCount = records.filter(
    (r) => r.expiryDate > now && r.expiryDate.getTime() - now.getTime() < 30 * 24 * 3600 * 1000
  ).length;
  const expiredCount = records.filter((r) => r.expiryDate <= now).length;
  const activeCount = records.filter((r) => r.expiryDate > now).length;

  return `
  <article class="container vmn-cockpit-article py-4">
    <!-- Breadcrumb & Status Bar -->
    <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
      <nav aria-label="Breadcrumb" class="vmn-breadcrumb-bar text-xs text-muted flex items-center gap-1.5">
        <a href="/" class="text-muted no-underline">Home</a> <span>&gt;</span>
        <a href="/workspace" class="text-muted no-underline">Workspaces</a> <span>&gt;</span>
        <a href="/broadcast/rights" class="text-primary font-mono no-underline">Broadcast Rights</a> <span>&gt;</span>
        <span aria-current="page" class="text-slate-100 font-semibold">Rights Clearance</span>
      </nav>
      <div class="flex items-center gap-2">
        <span class="vmn-badge badge-ready font-mono text-xs flex items-center gap-1">
          <span class="vmn-pulse-dot" aria-hidden="true"></span>
          CA-32 GATE ENFORCED
        </span>
        <span class="font-mono text-xs text-muted">IPR-001</span>
      </div>
    </div>

    <!-- Hero Header -->
    <header class="vmn-cockpit-hero card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div class="flex items-center gap-2">
          <span class="vmn-badge badge-info text-xs font-mono">CHAIN-OF-TITLE</span>
          <span class="vmn-badge badge-outline text-xs font-mono">LEGAL CLEARINGHOUSE</span>
        </div>
        <div class="flex items-center gap-2">
          <a href="#new-rights-modal" class="btn btn-primary btn-sm text-xs font-bold">+ Register Rights Record</a>
        </div>
      </div>
      <h1 class="text-xl md:text-2xl font-extrabold text-slate-100 mb-1">Intellectual Property &amp; Rights Clearinghouse</h1>
      <p class="text-xs text-muted max-w-2xl mb-3 leading-relaxed">
        Law 08 &amp; CA-32 Strict Governance: No content airs without verified, unexpired territory, platform, and music synchronisation clearance.
      </p>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-muted/10">
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">TOTAL RIGHTS TITLES</span>
          <span class="text-base font-bold block mt-0.5 text-primary">${escapeHtml(records.length)} Tracked</span>
          <span class="text-xs text-muted block mt-0.5 font-mono">Master catalogue</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">CLEARED &amp; ACTIVE</span>
          <span class="text-base font-bold block mt-0.5 text-success">${escapeHtml(activeCount)} Cleared</span>
          <span class="text-xs text-muted block mt-0.5">Airable across feeds</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">EXPIRING IN 30 DAYS</span>
          <span class="text-base font-bold block mt-0.5 text-warning">${escapeHtml(expiringSoonCount)} Critical</span>
          <span class="text-xs text-muted block mt-0.5">Renewal required</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">EXPIRED / BLOCKED</span>
          <span class="text-base font-bold block mt-0.5 text-red-400">${escapeHtml(expiredCount)} Blocked</span>
          <span class="text-xs text-muted block mt-0.5">Protected playout enforcement</span>
        </div>
      </div>
    </header>

    ${ctx.message ? `<div class="alert alert-info mb-4 p-3 rounded-lg text-xs">${escapeHtml(ctx.message)}</div>` : ""}

    <!-- Rights Records Table -->
    <section class="card mb-4 rounded-xl bg-surface border border-muted/20 overflow-hidden">
      <div class="p-3 flex items-center justify-between flex-wrap gap-2 border-b border-muted/10">
        <div>
          <h2 class="text-sm font-bold text-slate-100 m-0">Governed Rights Registry</h2>
          <p class="text-xs text-muted m-0">Verified rights clearances backing linear broadcast and streaming distribution</p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-muted/10 bg-slate-900/40 text-muted font-mono">
              <th class="p-2.5">RIGHTS ID</th>
              <th class="p-2.5">PROGRAMME / TITLE</th>
              <th class="p-2.5">RIGHTS TYPE</th>
              <th class="p-2.5">TERRITORY</th>
              <th class="p-2.5">EXCLUSIVITY</th>
              <th class="p-2.5">START DATE</th>
              <th class="p-2.5">EXPIRY DATE</th>
              <th class="p-2.5">CLEARANCE</th>
              <th class="p-2.5 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody>
            ${
              records.length === 0
                ? `<tr><td colspan="9" class="p-4 text-center text-muted">No rights records found. Register a new title below.</td></tr>`
                : records
                    .map((r) => {
                      const isExpired = r.expiryDate <= now;
                      const isExpiringSoon = !isExpired && r.expiryDate.getTime() - now.getTime() < 30 * 24 * 3600 * 1000;
                      return `
              <tr class="border-b border-muted/5 text-slate-200 hover:bg-slate-900/30">
                <td class="p-2.5 font-mono text-primary font-semibold">${escapeHtml(r.id)}</td>
                <td class="p-2.5 font-bold text-slate-100">${escapeHtml(r.title)}</td>
                <td class="p-2.5 font-mono text-xs">${escapeHtml(r.rightsType)}</td>
                <td class="p-2.5 font-mono text-muted">${escapeHtml(r.territory)}</td>
                <td class="p-2.5">
                  <span class="vmn-badge ${r.exclusivity ? "badge-info" : "badge-outline"} text-xs">
                    ${r.exclusivity ? "Exclusive" : "Non-Excl"}
                  </span>
                </td>
                <td class="p-2.5 font-mono text-muted">${escapeHtml(r.startDate ? r.startDate.toISOString().split("T")[0] : "—")}</td>
                <td class="p-2.5 font-mono ${isExpired ? "text-red-400 font-bold" : isExpiringSoon ? "text-warning font-bold" : "text-muted"}">
                  ${escapeHtml(r.expiryDate ? r.expiryDate.toISOString().split("T")[0] : "—")}
                </td>
                <td class="p-2.5">
                  <span class="vmn-badge ${isExpired ? "badge-warning" : "badge-ready"} text-xs">
                    ${isExpired ? "EXPIRED" : "CLEARED"}
                  </span>
                </td>
                <td class="p-2.5 text-right">
                  <form method="POST" action="/api/v1/broadcast/rights/clear" class="inline">
                    <input type="hidden" name="csrfToken" value="${escapeHtml(ctx.csrfToken || "")}">
                    <input type="hidden" name="rightsId" value="${escapeHtml(r.id)}">
                    <button type="submit" class="btn btn-outline btn-xs" ${isExpired ? "disabled" : ""}>
                      Attest &amp; Clear
                    </button>
                  </form>
                </td>
              </tr>
            `;
                    })
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>

    <!-- Create New Rights Record Form -->
    <section id="new-rights-modal" class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-3 border-b border-muted/10 pb-2">
        <div>
          <h2 class="text-base font-bold text-slate-100 m-0">Register New Title Rights Grant</h2>
          <p class="text-xs text-muted m-0">Establish contractual chain-of-title rights record</p>
        </div>
        <span class="vmn-badge badge-info text-xs font-mono">NEW GRANT</span>
      </div>

      <form method="POST" action="/api/v1/broadcast/rights" class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <input type="hidden" name="csrfToken" value="${escapeHtml(ctx.csrfToken || "")}">

        <div>
          <label class="block font-semibold text-slate-200 mb-1" for="title">Programme / Content Title *</label>
          <input type="text" id="title" name="title" required placeholder="e.g. Lagos Rush (Season 2)" class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs">
        </div>

        <div>
          <label class="block font-semibold text-slate-200 mb-1" for="assetId">Media Asset Reference / Master ID *</label>
          <input type="text" id="assetId" name="assetId" required placeholder="e.g. dam_ast_8820 or epm_nxtr_001" class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono">
        </div>

        <div>
          <label class="block font-semibold text-slate-200 mb-1" for="rightsType">Rights Grant Type *</label>
          <select id="rightsType" name="rightsType" required class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono">
            <option value="BROADCAST_LINEAR">Linear Broadcast (DTT / DTH)</option>
            <option value="DIGITAL_STREAMING">Digital Streaming (FAST / OTT / Azeebo+)</option>
            <option value="SYNDICATION">Syndication (Sub-licensing &amp; Secondary Feeds)</option>
            <option value="DERIVATIVE">Derivative (Clips, Soundtracks &amp; Formats)</option>
          </select>
        </div>

        <div>
          <label class="block font-semibold text-slate-200 mb-1" for="territory">Geographic Territory *</label>
          <input type="text" id="territory" name="territory" required placeholder="e.g. Nigeria, Sub-Saharan Africa, Worldwide" value="NIGERIA" class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono">
        </div>

        <div>
          <label class="block font-semibold text-slate-200 mb-1" for="startDate">Licence Start Date *</label>
          <input type="date" id="startDate" name="startDate" required value="${now.toISOString().split("T")[0]}" class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono">
        </div>

        <div>
          <label class="block font-semibold text-slate-200 mb-1" for="expiryDate">Licence Expiry Date *</label>
          <input type="date" id="expiryDate" name="expiryDate" required value="${new Date(now.getTime() + 365 * 24 * 3600 * 1000).toISOString().split("T")[0]}" class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono">
        </div>

        <div class="flex items-center gap-4 pt-2">
          <label class="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" name="exclusivity" value="true" checked class="checkbox checkbox-xs">
            <span class="text-slate-200">Sole / Exclusive Grant</span>
          </label>
          <label class="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" name="subLicensable" value="true" class="checkbox checkbox-xs">
            <span class="text-slate-200">Sub-licensable to Partners</span>
          </label>
        </div>

        <div class="flex items-end justify-end gap-2 pt-2">
          <button type="reset" class="btn btn-ghost btn-sm text-xs">Reset</button>
          <button type="submit" class="btn btn-primary btn-sm text-xs font-bold">+ Register Rights Record</button>
        </div>
      </form>
    </section>
  </article>
  `;
}
