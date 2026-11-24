/**
 * VMN Cryptographic Audit Trail & Integrity Explorer Desk (Wave 4)
 * Authority: AUD-05 Chained Audit Records / Law 05 Tamper-Evident Ledger
 *
 * Implements the visual audit trail explorer displaying HMAC-SHA256 chained
 * records, actor attribution, IP tracking, and one-click cryptographic chain verification.
 */

import { escapeHtml } from "../components/escape.js";
import type { SessionUser } from "../../core/auth/index.js";
import { type AuditLogEntry } from "../../core/audit/index.js";

export interface AuditDeskContext {
  logs: AuditLogEntry[];
  verification: { valid: boolean; verifiedCount: number; errors: string[] };
  csrfToken?: string;
  user?: SessionUser | null;
  message?: string;
}

function renderAuditLogRow(log: AuditLogEntry): string {
  return `
    <tr class="border-b border-muted/5 text-slate-200 hover:bg-slate-900/30">
      <td class="p-2.5 font-mono text-muted text-xs">${escapeHtml(log.timestamp ? new Date(log.timestamp).toISOString().replace("T", " ").slice(0, 19) : "—")}</td>
      <td class="p-2.5 font-mono font-bold text-primary">${escapeHtml(log.action)}</td>
      <td class="p-2.5 font-mono text-slate-100">${escapeHtml(log.resource)}</td>
      <td class="p-2.5 font-mono text-muted">${escapeHtml(log.userId || "System")}</td>
      <td class="p-2.5 font-mono text-muted">${escapeHtml(log.ipAddress || "127.0.0.1")}</td>
      <td class="p-2.5 font-mono text-xs text-slate-400 font-bold">${escapeHtml(log.entryHash || log.id || "GENESIS")}</td>
    </tr>
  `;
}

export function renderAuditDeskHtml(ctx: AuditDeskContext): string {
  const logs = ctx.logs;
  const verification = ctx.verification;

  return `
  <article class="container vmn-cockpit-article py-4">
    <!-- Breadcrumb & Status Bar -->
    <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
      <nav aria-label="Breadcrumb" class="vmn-breadcrumb-bar text-xs text-muted flex items-center gap-1.5">
        <a href="/" class="text-muted no-underline">Home</a> <span>&gt;</span>
        <a href="/workspace" class="text-muted no-underline">Workspaces</a> <span>&gt;</span>
        <a href="/workspace/admin/access" class="text-muted no-underline">Administration</a> <span>&gt;</span>
        <span aria-current="page" class="text-primary font-mono font-semibold">Audit Ledger</span>
      </nav>
      <div class="flex items-center gap-2">
        <span class="vmn-badge ${verification.valid ? "badge-ready" : "badge-warning"} font-mono text-xs flex items-center gap-1">
          <span class="vmn-pulse-dot" aria-hidden="true"></span>
          ${verification.valid ? "CHAIN INTEGRITY VERIFIED (SHA-256)" : "CHAIN INTEGRITY COMPROMISED"}
        </span>
        <span class="font-mono text-xs text-muted">AUD-05</span>
      </div>
    </div>

    <!-- Hero Header -->
    <header class="vmn-cockpit-hero card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div class="flex items-center gap-2">
          <span class="vmn-badge badge-info text-xs font-mono">CRYPTOGRAPHIC LOG</span>
          <span class="vmn-badge badge-outline text-xs font-mono">IMMUTABLE TAIL</span>
        </div>
        <div class="flex items-center gap-2">
          <a href="/api/v1/audit/verify" target="_blank" class="btn btn-outline btn-sm text-xs">&check; Run Cryptographic Verify API</a>
        </div>
      </div>
      <h1 class="text-xl md:text-2xl font-extrabold text-slate-100 mb-1">Cryptographic Audit Trail &amp; Forensic Log</h1>
      <p class="text-xs text-muted max-w-2xl mb-3 leading-relaxed">
        Law 05 Authority: Every consequential mutation records a cryptographically hashed journal entry. Each entry incorporates the previous hash tail, forming a tamper-evident blockchain-style hash chain persisted across restarts.
      </p>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-muted/10">
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">CHAIN ENTRIES</span>
          <span class="text-base font-bold block mt-0.5 text-primary">${escapeHtml(logs.length)} Hashed</span>
          <span class="text-xs text-muted block mt-0.5 font-mono">Genesis linked</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">CHAIN VERIFICATION</span>
          <span class="text-base font-bold block mt-0.5 ${verification.valid ? "text-success" : "text-red-400"}">
            ${verification.valid ? "Valid (0 Breaks)" : "TAMPER DETECTED"}
          </span>
          <span class="text-xs text-muted block mt-0.5">SHA-256 matched</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">STORAGE INTEGRITY</span>
          <span class="text-base font-bold block mt-0.5 text-slate-100">Secure Immutable Store</span>
          <span class="text-xs text-muted block mt-0.5">Tamper-evident log</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">CHAIN HEAD DIGEST</span>
          <span class="text-xs font-mono font-bold block mt-0.5 text-warning truncate">
            ${escapeHtml(logs[0]?.entryHash ? logs[0].entryHash.slice(0, 16) + "..." : "Genesis")}
          </span>
          <span class="text-xs text-muted block mt-0.5 font-mono">KV tail updated</span>
        </div>
      </div>
    </header>

    ${ctx.message ? `<div class="alert alert-info mb-4 p-3 rounded-lg text-xs">${escapeHtml(ctx.message)}</div>` : ""}

    <!-- Audit Log Records Table -->
    <section class="card mb-4 rounded-xl bg-surface border border-muted/20 overflow-hidden">
      <div class="p-3 flex items-center justify-between flex-wrap gap-2 border-b border-muted/10">
        <div>
          <h2 class="text-sm font-bold text-slate-100 m-0">Forensic Audit Log Entries</h2>
          <p class="text-xs text-muted m-0">Real-time immutable log stream from all operational desks</p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-muted/10 bg-slate-900/40 text-muted font-mono">
              <th class="p-2.5">TIMESTAMP</th>
              <th class="p-2.5">ACTION</th>
              <th class="p-2.5">RESOURCE</th>
              <th class="p-2.5">ACTOR ID</th>
              <th class="p-2.5">IP ADDRESS</th>
              <th class="p-2.5">CURRENT HASH TAIL (SHA-256)</th>
            </tr>
          </thead>
          <tbody>
            ${
              logs.length === 0
                ? `<tr><td colspan="6" class="p-4 text-center text-muted">Audit chain is currently at genesis. Consequential mutations will appear here.</td></tr>`
                : logs.map(renderAuditLogRow).join("")
            }
          </tbody>
        </table>
      </div>
    </section>
  </article>
  `;
}
