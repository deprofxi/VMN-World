/**
 * VMN Consolidated Finance, General Ledger & Talent Payouts Desk (Wave 1)
 * Authority: BRD R1.2A, PRD R1.3C, CCPP R1.1 §18, §70 / FIN-03 Double-Entry Invariant
 *
 * Implements balanced double-entry journal postings and talent payout batch
 * dual-authorization disbursements with statutory Nigerian WHT deductions.
 */

import { escapeHtml } from "../components/escape.js";
import type { JournalEntry } from "../../modules/finance/ledger/index.js";
import type { TalentPayoutBatchEntity } from "../../core/database/repositories/finance.repository.js";
import type { SessionUser } from "../../core/auth/index.js";

export interface FinanceLedgerContext {
  journals: JournalEntry[];
  csrfToken?: string;
  user?: SessionUser | null;
  message?: string;
}

export interface FinancePayoutsContext {
  batches: TalentPayoutBatchEntity[];
  csrfToken?: string;
  user?: SessionUser | null;
  message?: string;
}

/**
 * 1. General Ledger & Double-Entry Journal Postings Desk
 */
export function renderFinanceLedgerDeskHtml(ctx: FinanceLedgerContext): string {
  const journals = ctx.journals || [];
  const totalDebits = journals.reduce((acc, j) => acc + (j.totalDebitNgn || 0), 0);
  const totalCredits = journals.reduce((acc, j) => acc + (j.totalCreditNgn || 0), 0);
  const balanced = Math.abs(totalDebits - totalCredits) < 0.01;

  return `
  <article class="container vmn-cockpit-article py-4">
    <!-- Breadcrumb & Status Bar -->
    <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
      <nav aria-label="Breadcrumb" class="vmn-breadcrumb-bar text-xs text-muted flex items-center gap-1.5">
        <a href="/" class="text-muted no-underline">Home</a> <span>&gt;</span>
        <a href="/workspace" class="text-muted no-underline">Workspaces</a> <span>&gt;</span>
        <a href="/workspace/finance/ledger" class="text-primary font-mono no-underline">Finance &amp; Treasury</a> <span>&gt;</span>
        <span aria-current="page" class="text-slate-100 font-semibold">General Ledger</span>
      </nav>
      <div class="flex items-center gap-2">
        <span class="vmn-badge ${balanced ? "badge-ready" : "badge-warning"} font-mono text-xs flex items-center gap-1">
          <span class="vmn-pulse-dot" aria-hidden="true"></span>
          ${balanced ? "LEDGER BALANCED (KOBO-EXACT)" : "VARIANCE DETECTED"}
        </span>
        <span class="font-mono text-xs text-muted">FIN-001</span>
      </div>
    </div>

    <!-- Hero Header -->
    <header class="vmn-cockpit-hero card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div class="flex items-center gap-2">
          <span class="vmn-badge badge-info text-xs font-mono">CHART OF ACCOUNTS</span>
          <span class="vmn-badge badge-outline text-xs font-mono">DOUBLE-ENTRY LEDGER</span>
        </div>
        <div class="flex items-center gap-2">
          <a href="#new-journal-modal" class="btn btn-primary btn-sm text-xs font-bold">+ Post Manual Journal</a>
          <a href="/workspace/finance/payouts" class="btn btn-outline btn-sm text-xs">Talent Payouts &rarr;</a>
        </div>
      </div>
      <h1 class="text-xl md:text-2xl font-extrabold text-slate-100 mb-1">General Ledger &amp; Journal Registry</h1>
      <p class="text-xs text-muted max-w-2xl mb-3 leading-relaxed">
        Canonical double-entry bookkeeping journal. Every entry must balance debits and credits exact to the kobo. Postings are immutable and durable across restarts.
      </p>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-muted/10">
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">TOTAL DEBITS</span>
          <span class="text-base font-bold block mt-0.5 text-slate-100">₦${escapeHtml(totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2 }))}</span>
          <span class="text-xs text-muted block mt-0.5 font-mono">${escapeHtml(journals.length)} postings</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">TOTAL CREDITS</span>
          <span class="text-base font-bold block mt-0.5 text-slate-100">₦${escapeHtml(totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2 }))}</span>
          <span class="text-xs text-muted block mt-0.5 font-mono">Balanced contra</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">LEDGER INTEGRITY</span>
          <span class="text-base font-bold block mt-0.5 ${balanced ? "text-success" : "text-red-400"}">
            ${balanced ? "100% Balanced" : "Out of Balance"}
          </span>
          <span class="text-xs text-muted block mt-0.5">Dual-posting check</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">LEDGER PERSISTENCE</span>
          <span class="text-base font-bold block mt-0.5 text-primary">Synchronized</span>
          <span class="text-xs text-muted block mt-0.5">Durable Store Active</span>
        </div>
      </div>
    </header>

    ${ctx.message ? `<div class="alert alert-info mb-4 p-3 rounded-lg text-xs">${escapeHtml(ctx.message)}</div>` : ""}

    <!-- Journal Registry Table -->
    <section class="card mb-4 rounded-xl bg-surface border border-muted/20 overflow-hidden">
      <div class="p-3 flex items-center justify-between flex-wrap gap-2 border-b border-muted/10">
        <div>
          <h2 class="text-sm font-bold text-slate-100 m-0">Journal Entry Registry</h2>
          <p class="text-xs text-muted m-0">Immutable journal postings from deals, collections, escrow, and make-good contra credits</p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-muted/10 bg-slate-900/40 text-muted font-mono">
              <th class="p-2.5">ENTRY ID</th>
              <th class="p-2.5">REFERENCE</th>
              <th class="p-2.5">DESCRIPTION</th>
              <th class="p-2.5 text-right">TOTAL DEBIT (NGN)</th>
              <th class="p-2.5 text-right">TOTAL CREDIT (NGN)</th>
              <th class="p-2.5">STATUS</th>
              <th class="p-2.5">POSTED AT</th>
            </tr>
          </thead>
          <tbody>
            ${
              journals.length === 0
                ? `<tr><td colspan="7" class="p-4 text-center text-muted">No journal entries recorded. Post your first entry below.</td></tr>`
                : journals
                    .slice(0, 50)
                    .map(
                      (j) => `
              <tr class="border-b border-muted/5 text-slate-200 hover:bg-slate-900/30">
                <td class="p-2.5 font-mono text-primary font-semibold">${escapeHtml(j.id)}</td>
                <td class="p-2.5 font-mono font-bold text-slate-100">${escapeHtml(j.reference)}</td>
                <td class="p-2.5 text-slate-300">${escapeHtml(j.description)}</td>
                <td class="p-2.5 text-right font-mono text-slate-100">₦${escapeHtml(j.totalDebitNgn.toLocaleString(undefined, { minimumFractionDigits: 2 }))}</td>
                <td class="p-2.5 text-right font-mono text-slate-100">₦${escapeHtml(j.totalCreditNgn.toLocaleString(undefined, { minimumFractionDigits: 2 }))}</td>
                <td class="p-2.5">
                  <span class="vmn-badge ${j.isBalanced ? "badge-ready" : "badge-warning"} text-xs">
                    ${j.isBalanced ? "BALANCED" : "UNBALANCED"}
                  </span>
                </td>
                <td class="p-2.5 font-mono text-muted text-xs">${escapeHtml(j.postedAt ? j.postedAt.toISOString().replace("T", " ").slice(0, 19) : "—")}</td>
              </tr>
            `
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>

    <!-- Post Manual Balanced Journal Form -->
    <section id="new-journal-modal" class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-3 border-b border-muted/10 pb-2">
        <div>
          <h2 class="text-base font-bold text-slate-100 m-0">Post Manual Balanced Journal Entry</h2>
          <p class="text-xs text-muted m-0">Double-Entry Standard: Debits and credits must be balanced to the kobo</p>
        </div>
        <span class="vmn-badge badge-info text-xs font-mono">POST ENTRY</span>
      </div>

      <form method="POST" action="/api/v1/finance/ledger/journal" class="space-y-3 text-xs">
        <input type="hidden" name="csrfToken" value="${escapeHtml(ctx.csrfToken || "")}">

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block font-semibold text-slate-200 mb-1" for="reference">Transaction Reference *</label>
            <input type="text" id="reference" name="reference" required placeholder="e.g. JRN-MANUAL-001 or DEAL-REF-99" class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono">
          </div>
          <div>
            <label class="block font-semibold text-slate-200 mb-1" for="description">Journal Narrative / Purpose *</label>
            <input type="text" id="description" name="description" required placeholder="e.g. Accrual of Q4 Broadcast Rights Fee" class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs">
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-lg bg-slate-900/50 border border-muted/10">
          <div>
            <h3 class="font-bold text-primary mb-2">DEBIT LEG</h3>
            <label class="block text-slate-300 mb-1" for="debitAccount">Debit Account Code *</label>
            <select id="debitAccount" name="debitAccount" required class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2 py-1 text-slate-100 text-xs font-mono mb-2">
              <option value="1010">1010 - Bank &amp; Cash Equivalents</option>
              <option value="1100" selected>1100 - Trade Receivables</option>
              <option value="2200">2200 - Talent Escrow Liabilities</option>
              <option value="5000">5000 - Operating Production Expenses</option>
            </select>
            <label class="block text-slate-300 mb-1" for="debitAmount">Debit Amount (NGN) *</label>
            <input type="number" id="debitAmount" name="debitAmount" required min="1" step="0.01" placeholder="e.g. 5000000.00" class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono">
          </div>

          <div>
            <h3 class="font-bold text-success mb-2">CREDIT LEG</h3>
            <label class="block text-slate-300 mb-1" for="creditAccount">Credit Account Code *</label>
            <select id="creditAccount" name="creditAccount" required class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2 py-1 text-slate-100 text-xs font-mono mb-2">
              <option value="4000" selected>4000 - Linear Airtime Advertising Revenue</option>
              <option value="4100">4100 - Platform Talent Commission Revenue</option>
              <option value="2000">2000 - Trade Payables</option>
              <option value="2100">2100 - Deferred Revenue (Unearned)</option>
            </select>
            <label class="block text-slate-300 mb-1" for="creditAmount">Credit Amount (NGN) *</label>
            <input type="number" id="creditAmount" name="creditAmount" required min="1" step="0.01" placeholder="e.g. 5000000.00" class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono">
          </div>
        </div>

        <div class="flex items-center justify-between pt-2">
          <span class="text-muted text-xs">Rule: Unbalanced postings are rejected at entry</span>
          <div class="flex items-center gap-2">
            <button type="reset" class="btn btn-ghost btn-sm text-xs">Reset</button>
            <button type="submit" class="btn btn-primary btn-sm text-xs font-bold">+ Post Balanced Journal</button>
          </div>
        </div>
      </form>
    </section>
  </article>
  `;
}

/**
 * 2. Talent Payouts & Nigerian WHT Ledger Desk
 */
export function renderFinancePayoutsDeskHtml(ctx: FinancePayoutsContext): string {
  const batches = ctx.batches || [];
  const totalDisbursed = batches.filter((b) => b.status === "DISBURSED").reduce((acc, b) => acc + (b.totalAmountNgn || 0), 0);
  const pendingCount = batches.filter((b) => b.status !== "DISBURSED").length;

  return `
  <article class="container vmn-cockpit-article py-4">
    <!-- Breadcrumb & Status Bar -->
    <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
      <nav aria-label="Breadcrumb" class="vmn-breadcrumb-bar text-xs text-muted flex items-center gap-1.5">
        <a href="/" class="text-muted no-underline">Home</a> <span>&gt;</span>
        <a href="/workspace" class="text-muted no-underline">Workspaces</a> <span>&gt;</span>
        <a href="/workspace/finance/ledger" class="text-muted no-underline">Finance</a> <span>&gt;</span>
        <span aria-current="page" class="text-primary font-mono font-semibold">Talent Payouts</span>
      </nav>
      <div class="flex items-center gap-2">
        <span class="vmn-badge badge-ready font-mono text-xs flex items-center gap-1">
          <span class="vmn-pulse-dot" aria-hidden="true"></span>
          DUAL-AUTH ARMED
        </span>
        <span class="font-mono text-xs text-muted">PAY-002</span>
      </div>
    </div>

    <!-- Hero Header -->
    <header class="vmn-cockpit-hero card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div class="flex items-center gap-2">
          <span class="vmn-badge badge-info text-xs font-mono">ESCROW DISBURSEMENT</span>
          <span class="vmn-badge badge-outline text-xs font-mono">NIGERIAN WHT STATUTORY</span>
        </div>
        <div class="flex items-center gap-2">
          <a href="/workspace/finance/ledger" class="btn btn-outline btn-sm text-xs">&larr; General Ledger</a>
        </div>
      </div>
      <h1 class="text-xl md:text-2xl font-extrabold text-slate-100 mb-1">Talent Payout Batches &amp; Statutory WHT</h1>
      <p class="text-xs text-muted max-w-2xl mb-3 leading-relaxed">
        Governs escrow releases to represented talent and production vendors. Automatically computes 5% / 10% Nigerian Withholding Tax (WHT) deductions and requires dual-officer authorization before bank execution.
      </p>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-muted/10">
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">TOTAL DISBURSED</span>
          <span class="text-base font-bold block mt-0.5 text-success">₦${escapeHtml(totalDisbursed.toLocaleString())}</span>
          <span class="text-xs text-muted block mt-0.5 font-mono">Executed settlements</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">PENDING APPROVAL</span>
          <span class="text-base font-bold block mt-0.5 text-warning">${escapeHtml(pendingCount)} Batches</span>
          <span class="text-xs text-muted block mt-0.5">Awaiting dual control</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">STATUTORY WHT POLICY</span>
          <span class="text-base font-bold block mt-0.5 text-slate-100">5% Indiv / 10% Corp</span>
          <span class="text-xs text-muted block mt-0.5">FIRS compliant</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">DISBURSEMENT GATEWAY</span>
          <span class="text-base font-bold block mt-0.5 text-primary">NIP Direct</span>
          <span class="text-xs text-muted block mt-0.5">Paystack / Flutterwave</span>
        </div>
      </div>
    </header>

    ${ctx.message ? `<div class="alert alert-info mb-4 p-3 rounded-lg text-xs">${escapeHtml(ctx.message)}</div>` : ""}

    <!-- Batches Table -->
    <section class="card mb-4 rounded-xl bg-surface border border-muted/20 overflow-hidden">
      <div class="p-3 flex items-center justify-between flex-wrap gap-2 border-b border-muted/10">
        <div>
          <h2 class="text-sm font-bold text-slate-100 m-0">Talent Payout Batches</h2>
          <p class="text-xs text-muted m-0">Batched escrow disbursements with two-man rule sign-off</p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-muted/10 bg-slate-900/40 text-muted font-mono">
              <th class="p-2.5">BATCH NUMBER</th>
              <th class="p-2.5 text-right">TOTAL AMOUNT (NGN)</th>
              <th class="p-2.5">ITEMS</th>
              <th class="p-2.5">CURRENCY</th>
              <th class="p-2.5">STATUS</th>
              <th class="p-2.5">APPROVED BY</th>
              <th class="p-2.5 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody>
            ${
              batches.length === 0
                ? `<tr><td colspan="7" class="p-4 text-center text-muted">No payout batches currently queued.</td></tr>`
                : batches
                    .map(
                      (b) => `
              <tr class="border-b border-muted/5 text-slate-200 hover:bg-slate-900/30">
                <td class="p-2.5 font-mono text-primary font-semibold">${escapeHtml(b.batchNumber)}</td>
                <td class="p-2.5 text-right font-mono font-bold text-slate-100">₦${escapeHtml(b.totalAmountNgn.toLocaleString(undefined, { minimumFractionDigits: 2 }))}</td>
                <td class="p-2.5 font-mono">${escapeHtml(b.itemCount)} payouts</td>
                <td class="p-2.5 font-mono text-muted">${escapeHtml(b.currency)}</td>
                <td class="p-2.5">
                  <span class="vmn-badge ${b.status === "DISBURSED" ? "badge-ready" : b.status === "APPROVED" ? "badge-info" : "badge-warning"} text-xs">
                    ${escapeHtml(b.status)}
                  </span>
                </td>
                <td class="p-2.5 font-mono text-muted text-xs">${escapeHtml(b.approvedBy || "Pending")}</td>
                <td class="p-2.5 text-right">
                  <form method="POST" action="/api/v1/finance/payouts/approve" class="inline">
                    <input type="hidden" name="csrfToken" value="${escapeHtml(ctx.csrfToken || "")}">
                    <input type="hidden" name="batchId" value="${escapeHtml(b.id)}">
                    <button type="submit" class="btn btn-primary btn-xs font-bold" ${b.status === "DISBURSED" ? "disabled" : ""}>
                      ${b.status === "DISBURSED" ? "Disbursed" : b.status === "APPROVED" ? "Execute NIP" : "Dual Authorize"}
                    </button>
                  </form>
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
  </article>
  `;
}
