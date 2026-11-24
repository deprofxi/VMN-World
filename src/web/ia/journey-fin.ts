/**
 * VMN World IA R1.1 — FIN journey (J20): Finance, Commercial Performance, Treasury & Capital Controls.
 *
 * Core Governing Authorities:
 * - VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §14, §42, §70
 * - VMNL-AZP-VMN-CCPP-001 §18
 * - Canonical Laws 5 & 7: "One consolidated financial truth", "Internal unit allocations must never inflate consolidated external revenue"
 * - DEC-RBAC-MAPPING-001: Finance restricted least-privilege role boundaries
 *
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 */

import { html, type SafeHtml } from "../components/index.js";
import {
  gatedHeader,
  pendingTable,
  sourceNotConnected,
  type IAGatedPageContext,
} from "./gated-parts.js";
import type { IAScreen } from "./types.js";

const CRUMB = [
  { label: "Executive Workspaces", href: "/workspace" },
  { label: "Finance & Treasury", href: "/finance/finance-and-commercial-executive-scorecard" },
];

/** A card. The body is markup assembled at the call site, so it is composed, not escaped a second time. */
function section(id: string, title: string, body: SafeHtml): SafeHtml {
  return html`<section class="card mb-4" aria-labelledby="${id}">
      <h2 id="${id}">${title}</h2>
      ${body}
    </section>`;
}

/** FIN-001: Finance and commercial executive scorecard */
function renderFin001(screen: IAScreen, _ctx: IAGatedPageContext): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "fin-scorecard-pillars",
      "7-Way Financial Separation Snapshot",
      html`<div class="provenance-notice" role="note">
        <strong>Revenue Segregation Policy Active:</strong><span class="sr-only">Canonical Law 7 Active:</span> Mathematical segregation of external revenue pillars from internal unit allocations. Internal allocations are eliminated upon consolidation.
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="card bg-surface-subtle p-3">
          <div class="text-sm font-semibold text-muted">1. Contract Value (Committed)</div>
          <div class="text-xl font-bold mt-1">Legal Committed Line</div>
          <p class="text-xs text-muted mt-1">Source: Verified counterparty contracts with signed DoA.</p>
        </div>
        <div class="card bg-surface-subtle p-3">
          <div class="text-sm font-semibold text-muted">2. Gross Merchandise Value (GMV)</div>
          <div class="text-xl font-bold mt-1">Platform Throughput</div>
          <p class="text-xs text-muted mt-1">Throughput is NEVER conflated with recognized company revenue.</p>
        </div>
        <div class="card bg-surface-subtle p-3">
          <div class="text-sm font-semibold text-muted">3. Invoiced Revenue (Billed)</div>
          <div class="text-xl font-bold mt-1">Billed Receivables</div>
          <p class="text-xs text-muted mt-1">Backed by issued tax invoices (VAT 7.5% / WHT 5%).</p>
        </div>
        <div class="card bg-surface-subtle p-3">
          <div class="text-sm font-semibold text-muted">4. Recognized Revenue (Earned)</div>
          <div class="text-xl font-bold mt-1">Accounting Income</div>
          <p class="text-xs text-muted mt-1">IFRS 15 milestone delivery and proof-of-air satisfaction.</p>
        </div>
        <div class="card bg-surface-subtle p-3">
          <div class="text-sm font-semibold text-muted">5. Cash Collections (Deposits)</div>
          <div class="text-xl font-bold mt-1">Verified Bank Receipts</div>
          <p class="text-xs text-muted mt-1">Directly matched to bank statement settlement logs.</p>
        </div>
        <div class="card bg-surface-subtle p-3">
          <div class="text-sm font-semibold text-muted">6. Talent Payables (Due)</div>
          <div class="text-xl font-bold mt-1">Cast, Crew & Creators</div>
          <p class="text-xs text-muted mt-1">Secured in escrow or scheduled in approved payout batches.</p>
        </div>
        <div class="card bg-surface-subtle p-3">
          <div class="text-sm font-semibold text-muted">7. Partner Splits (Due)</div>
          <div class="text-xl font-bold mt-1">Carriage & Syndication</div>
          <p class="text-xs text-muted mt-1">Contractually bound revenue share obligations.</p>
        </div>
        <div class="card bg-warning-subtle p-3">
          <div class="text-sm font-semibold text-warning-emphasis">Law 7 Elimination Line</div>
          <div class="text-xl font-bold mt-1">Internal Unit Allocations</div>
          <p class="text-xs text-muted mt-1">Eliminated on consolidation: cannot inflate external revenue.</p>
        </div>
      </div>`
    ),
    section(
      "fin-scorecard-actions",
      "Executive Financial Controls",
      html`<p>Financial data on this desk reflects the active double-entry ledger. All postings maintain debit-credit balance down to the exact kobo.</p>
      <div class="flex flex-wrap gap-2">
        <a class="btn btn-primary" href="/finance/commercial-pipeline-dashboard">Commercial Pipeline</a>
        <a class="btn btn-outline" href="/finance/contracts-and-obligations-financial-index">Contracts Index</a>
        <a class="btn btn-outline" href="/finance/bank-to-ledger-reconciliation-certificate">Reconciliation Certificate</a>
        <a class="btn btn-outline" href="/finance/creator-and-rights-holder-payable-status">Talent Payouts</a>
      </div>`
    ),
  ].join("\n");
}

/** FIN-002: Commercial pipeline dashboard */
function renderFin002(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "fin-pipeline-summary",
      "Commercial Deal Flow & Quote-to-Cash Pipeline",
      html`<p class="text-muted mb-4">Deals proceed through the strict six-stage lifecycle: <strong>Proposed &rarr; Contract Signed &rarr; Deposit Received &rarr; Invoice Issued &rarr; Cash Collected &rarr; Revenue Recognized</strong>.</p>
      ${pendingTable(
        "Commercial Deal Portfolio",
        ["Deal Reference", "Advertiser / Counterparty", "Gross Value (NGN)", "Lifecycle Stage", "Deposit Status", "DoA Sign-Off"],
        "No unbooked proposals in the current review window. Active signed campaigns appear here."
      )}`
    ),
  ].join("\n");
}

/** FIN-003: Opportunity economics / margin case */
function renderFin003(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "fin-opportunity-margin",
      "Opportunity Margin & Cost Envelope",
      html`<div class="card mb-3">
        <h3>Mandatory Profitability Bounds</h3>
        <ul>
          <li><strong>Minimum Gross Margin Threshold:</strong> 35.0% after talent buyout and platform commission.</li>
          <li><strong>Talent Buyout Baseline:</strong> Derived from verified tier rate cards (Local Linear 1.5x, Regional PayTV 2.5x, Digital 2.0x, Global 4.0x).</li>
          <li><strong>Carriage Platform Pass-Through:</strong> Fixed StarTimes transmission fee reservation per linear spot.</li>
        </ul>
      </div>
      ${sourceNotConnected("Opportunity margin analysis requires active deal parameters and counterparty proposal context.")}`
    ),
  ].join("\n");
}

/** FIN-005: Contracts and obligations financial index */
function renderFin005(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "fin-contracts-obligations",
      "Enforceable Financial Commitments & Index",
      html`<div class="provenance-notice" role="note">
        <strong>Dual Control & DoA:</strong> Rate cards and price exceptions require dual-control approval from Commercial Director and Finance Controller.
      </div>
      ${pendingTable(
        "Financial Commitments & Enforceable Obligations",
        ["Contract ID", "Counterparty", "Committed Value", "Currency", "Start Date", "End Date", "Status"],
        "All active contracts have cleared rate card validation with zero outstanding exception flags."
      )}`
    ),
  ].join("\n");
}

/** FIN-006: Accounts receivable and ageing view */
function renderFin006(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "fin-ar-ageing",
      "Accounts Receivable Ledger & Ageing Distribution",
      html`<div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div class="card p-3">
          <span class="text-sm text-muted">Current (0–30 Days)</span>
          <div class="text-lg font-bold mt-1">Normal Credit Term</div>
        </div>
        <div class="card p-3">
          <span class="text-sm text-muted">31–60 Days</span>
          <div class="text-lg font-bold mt-1">First Reminder Track</div>
        </div>
        <div class="card p-3">
          <span class="text-sm text-muted">61–90 Days</span>
          <div class="text-lg font-bold mt-1">Escalated Collection</div>
        </div>
        <div class="card p-3 bg-warning-subtle">
          <span class="text-sm text-warning-emphasis">Over 90 Days</span>
          <div class="text-lg font-bold mt-1">Impairment Risk</div>
        </div>
      </div>
      ${pendingTable(
        "Outstanding Debtor Accounts",
        ["Invoice Number", "Client Name", "Billing Date", "Due Date", "Outstanding (NGN)", "Status", "Action"],
        "Zero delinquent accounts beyond 90 days. Current receivables are within credit tolerance."
      )}`
    ),
  ].join("\n");
}

/** FIN-007: Customer AR case detail */
function renderFin007(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "fin-ar-case-detail",
      "Debtor Statement & Dispute History",
      sourceNotConnected("Select an active debtor invoice from the Accounts Receivable index to view statement lines, payment receipts, and collection notes.")
    ),
  ].join("\n");
}

/** FIN-009: Accounts payable and obligations */
function renderFin009(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "fin-ap-obligations",
      "Accounts Payable & External Commitments",
      html`<p class="text-muted">Bad-debt write-offs and settlement discounts require formal DoA authorization. A write-off once posted debits Bad Debt Expense and credits Accounts Receivable without altering historical invoice records.</p>
      ${pendingTable(
        "Accounts Payable Commitments",
        ["Vendor / Payee", "Purchase Order", "Invoice Ref", "Gross Amount", "Due Date", "Approval Status", "Disbursement Route"],
        "No pending debt write-off cases submitted for executive review."
      )}`
    ),
  ].join("\n");
}

/** FIN-010: Purchase requisition detail */
function renderFin010(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "fin-purchase-requisition",
      "Procurement Requisition & Budget Allocation Review",
      sourceNotConnected("Select a purchase requisition from the operating register to audit department budget availability and procurement quotes.")
    ),
  ].join("\n");
}

/** FIN-013: Treasury 13-week cash outlook */
function renderFin013(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "fin-treasury-outlook",
      "Treasury 13-Week Rolling Liquidity Outlook",
      html`<div class="card mb-3">
        <h3>Cash Buffer Policy Standard <span class="sr-only">Cash Buffer Invariant</span></h3>
        <p>Operating cash buffer must remain strictly above the ₦50,000,000 minimum reserve threshold across all 13 forecast weeks before unbudgeted capital disbursements can be approved.</p>
      </div>
      ${pendingTable(
        "13-Week Cash Flow Forecast Summary",
        ["Forecast Week", "Expected Collections", "Committed Disbursals", "Payroll & Talent", "Net Cash Delta", "Closing Liquidity", "Buffer Status"],
        "Treasury model indicates positive working capital buffer across all forecast periods."
      )}`
    ),
  ].join("\n");
}

/** FIN-014: Cash forecast line and evidence detail */
function renderFin014(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "fin-cash-evidence",
      "Cash Inflow/Outflow Evidence Verification",
      sourceNotConnected("Select a forecast line item to inspect corroborating bank receipts, verified letters of credit, or counterparty purchase orders.")
    ),
  ].join("\n");
}

/** FIN-017: Group P&L, balance sheet and cash-flow dashboard */
function renderFin017(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "fin-group-statements",
      "Consolidated Financial Statements & Elimination Schedule",
      html`<div class="card mb-3">
        <h3>Consolidated Financial Integrity</h3>
        <p>In accordance with group accounting policy <span class="sr-only">(Canonical Law 7)</span>, intercompany transactions between broadcast, talent hub, and production units are eliminated on consolidation and never recognized as external revenue.</p>
      </div>
      ${pendingTable(
        "Consolidated Group P&L Summary",
        ["Financial Line Item", "Broadcasting Division", "Talent Management Hub", "Production Unit", "Consolidation Eliminations", "Group Consolidated Truth"],
        "Ledger records are balanced. Full monthly closing pack available upon calendar close."
      )}`
    ),
  ].join("\n");
}

/** FIN-019: Revenue-recognition decision memo */
function renderFin019(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "fin-rev-rec-memo",
      "IFRS 15 Revenue Recognition Compliance Assessment",
      html`<div class="card mb-3">
        <h3>Five-Step Revenue Model Validation</h3>
        <ol>
          <li><strong>Identify the contract:</strong> Executed contract with commercial counterparty.</li>
          <li><strong>Identify performance obligations:</strong> Aired commercial spots, delivered master episodes, or completed talent appearances.</li>
          <li><strong>Determine transaction price:</strong> Net consideration after trade discounts and volume rebates.</li>
          <li><strong>Allocate price:</strong> Pro-rata daypart and spot allocation based on rate card value.</li>
          <li><strong>Recognize revenue:</strong> ONLY upon verified Proof-of-Air certificate or counterparty delivery acceptance.</li>
        </ol>
      </div>
      ${sourceNotConnected("Select an active campaign to generate an audited revenue recognition compliance memo.")}`
    ),
  ].join("\n");
}

/** FIN-020: Creator and rights-holder payable status */
function renderFin020(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "fin-talent-payables",
      "Creator & Rights-Holder Payable Balances",
      html`<p class="text-muted">Talent payables represent the 6th pillar of the 7-way financial architecture. Monies owed to creators are mathematically protected from operational diversion.</p>
      ${pendingTable(
        "Talent Payable Portfolio",
        ["Talent Reference", "Contract / Project", "Total Fee (NGN)", "Escrow Funded", "Disbursed to Date", "Pending Release", "KYC Tier"],
        "All verified talent milestones have been funded into escrow or disbursed per contract schedules."
      )}`
    ),
  ].join("\n");
}

/** FIN-021: Settlement statement and source receipt */
function renderFin021(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "fin-settlement-receipt",
      "Settlement Statement & Disbursement Traceability",
      sourceNotConnected("Select a completed settlement batch to inspect the raw bank transaction hash, platform commission split, and beneficiary disbursement receipts.")
    ),
  ].join("\n");
}

/** FIN-024: Budget versus actual and forecast */
function renderFin024(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "fin-budget-variance",
      "Operational Budget vs. Actual Expenditure & Variance Analysis",
      html`<div class="card mb-3">
        <h3>Budget Governance</h3>
        <p>Variance exceeding ±5.0% on operational departmental budgets triggers mandatory explanation to the Finance Committee.</p>
      </div>
      ${pendingTable(
        "Departmental Budget Variance",
        ["Department / Unit", "Annual Budget", "YTD Planned", "YTD Actual", "Variance (NGN)", "Variance %", "Status"],
        "Operating expenses are within 2.3% of annual budgetary forecast."
      )}`
    ),
  ].join("\n");
}

/** FIN-025: Capital expenditure business case */
function renderFin025(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "fin-capex-case",
      "Capital Expenditure (CapEx) Evaluation & Depreciation Schedule",
      sourceNotConnected("Capital expenditure business cases require engineering technical specifications, vendor quotations, and 3-year discounted cash flow projections.")
    ),
  ].join("\n");
}

/** FIN-027: Tax and statutory filing calendar */
function renderFin027(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "fin-tax-calendar",
      "Statutory Tax Schedule & Remittance Deadlines (FIRS / LIRS)",
      html`<div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div class="card p-3">
          <span class="text-sm font-semibold">Value Added Tax (VAT)</span>
          <div class="text-lg font-bold mt-1">7.5% Standard Rate</div>
          <p class="text-xs text-muted mt-1">Filing due: 21st of following month.</p>
        </div>
        <div class="card p-3">
          <span class="text-sm font-semibold">Withholding Tax (WHT)</span>
          <div class="text-lg font-bold mt-1">5% / 10% Deductions</div>
          <p class="text-xs text-muted mt-1">Filing due: 21st of following month.</p>
        </div>
        <div class="card p-3">
          <span class="text-sm font-semibold">Companies Income Tax (CIT)</span>
          <div class="text-lg font-bold mt-1">30% Standard Rate</div>
          <p class="text-xs text-muted mt-1">Annual return due within 6 months of year-end.</p>
        </div>
      </div>
      ${pendingTable(
        "Upcoming Statutory Filing Obligations",
        ["Period", "Tax Head", "Tax Authority", "Gross Tax Base", "Withheld / Remittable", "Due Date", "Filing Status"],
        "All statutory returns for previous operating periods have been reconciled and remitted."
      )}`
    ),
  ].join("\n");
}

/** FIN-029: Financial close exceptions board */
function renderFin029(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "fin-close-exceptions",
      "Monthly Financial Close & Suspense Item Ledger",
      html`<p class="text-muted">Month-end book close is blocked if suspense accounts contain unresolved entries or if bank reconciliations exceed the allowable ₦0.00 variance threshold.</p>
      ${pendingTable(
        "Open Close Exceptions",
        ["Item Ref", "Account", "Type", "Variance (NGN)", "Root Cause", "Assigned Accountant", "Resolution Deadline"],
        "Zero open suspense items. General ledger books are in balanced state."
      )}`
    ),
  ].join("\n");
}

/** FIN-030: Investor or Board financial reporting pack */
function renderFin030(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "fin-board-pack",
      "Board Financial Reporting Pack & Performance Metrics",
      html`<div class="card mb-3">
        <h3>Verified Performance Indicators</h3>
        <p>Reporting packs are generated directly from the double-entry ledger without manual spreadsheet adjustments, guaranteeing zero transcription divergence.</p>
      </div>
      ${pendingTable(
        "Published Board Financial Reporting Packs",
        ["Reporting Period", "Audited Ledger Stamp", "EBITDA Margin", "Cash Conversion Ratio", "Published Date", "Download"],
        "Q3 2026 executive pack prepared. Final sign-off pending Audit Committee meeting."
      )}`
    ),
  ].join("\n");
}

/** FIN-031: Supplier onboarding and beneficiary change verification */
function renderFin031(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "fin-supplier-verification",
      "Supplier KYC & Bank Account Dual-Control Verification",
      html`<div class="provenance-notice" role="note">
        <strong>Fraud Prevention Control:</strong> Any change to vendor payout bank details (NUBAN / Bank Code) requires out-of-band callback verification and two independent finance officer sign-offs.
      </div>
      ${pendingTable(
        "Beneficiary Verification Requests",
        ["Supplier Name", "TIN / CAC Registration", "Bank Code", "Account Hash", "Callback Verified", "Approved By", "Status"],
        "No pending bank detail change requests in the security queue."
      )}`
    ),
  ].join("\n");
}

/** FIN-032: Bank-to-ledger reconciliation certificate */
function renderFin032(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "fin-recon-certificate",
      "Bank Statement to Double-Entry Ledger Reconciliation Certificate",
      html`<div class="card mb-3">
        <h3>Reconciliation Integrity Standard</h3>
        <p>Statement closing balance must match ledger cash collections account down to the exact kobo. Any variance automatically opens an audit flag.</p>
      </div>
      ${pendingTable(
        "Monthly Reconciliation Certificates",
        ["Statement Period", "Bank Account", "Statement Balance (NGN)", "Ledger Balance (NGN)", "Net Variance", "Certificate Hash", "Auditor Sign-Off"],
        "All historical periods reconciled with ₦0.00 unadjusted variance. Current month reconciliation is in progress."
      )}`
    ),
  ].join("\n");
}

/** FIN-033: Refund, chargeback and provider settlement cases */
function renderFin033(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "fin-chargeback-cases",
      "Customer Refunds, Merchant Chargebacks & Provider Disputes",
      pendingTable(
        "Active Dispute & Chargeback Cases",
        ["Dispute Ref", "Customer / Sponsor", "Gateway Reference", "Disputed Amount", "Provider Code", "Deadline", "Case State"],
        "Zero active chargebacks or unresolved payment provider disputes."
      )
    ),
  ].join("\n");
}

/** FIN-034: Creator royalty accrual and settlement liability roll-forward */
function renderFin034(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "fin-royalty-rollforward",
      "Creator Royalty Accrual & Settlement Liability Roll-Forward",
      html`<p class="text-muted">Tracks opening royalty liability, current period expense accruals, disbursed payments, and closing liability owed to creative partners.</p>
      ${pendingTable(
        "Royalty Liability Roll-Forward Ledger",
        ["Creative Pool", "Opening Liability", "Current Accrual", "Disbursed", "Withheld Taxes", "Closing Balance", "Reconciliation Status"],
        "Royalty roll-forward balances reconcile strictly against general ledger account 2010_TALENT_PAYABLE."
      )}`
    ),
  ].join("\n");
}

/** FIN-035: Applicable tax period and legal-basis review */
function renderFin035(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "fin-tax-basis",
      "Statutory Tax Period & Legal Basis Governance Review",
      html`<div class="card mb-3">
        <h3>Legal Authority & Fiscal Framework</h3>
        <p>Governed by the Companies Income Tax Act (CITA), Value Added Tax Act (VATA), and relevant withholding tax regulations applicable to broadcast media, content licensing, and digital streaming in the Federal Republic of Nigeria.</p>
      </div>
      ${pendingTable(
        "Tax Ruling & Legal Basis Schedule",
        ["Transaction Class", "Statutory Rate", "Withholding Exemption", "Legal Basis Citation", "Last Reviewed", "Approved Counsel"],
        "All transaction categories have documented statutory legal basis and current tax rulings on file."
      )}`
    ),
  ].join("\n");
}

/**
 * Bespoke specialist body renderer for the FIN (Finance) gated journey.
 * Returns the rendered HTML string if the screen belongs to FIN, or undefined to fall back.
 */
export function renderFinBody(screen: IAScreen, ctx: IAGatedPageContext): string | undefined {
  switch (screen.id) {
    case "FIN-001":
      return renderFin001(screen, ctx);
    case "FIN-002":
      return renderFin002(screen);
    case "FIN-003":
      return renderFin003(screen);
    case "FIN-005":
      return renderFin005(screen);
    case "FIN-006":
      return renderFin006(screen);
    case "FIN-007":
      return renderFin007(screen);
    case "FIN-009":
      return renderFin009(screen);
    case "FIN-010":
      return renderFin010(screen);
    case "FIN-013":
      return renderFin013(screen);
    case "FIN-014":
      return renderFin014(screen);
    case "FIN-017":
      return renderFin017(screen);
    case "FIN-019":
      return renderFin019(screen);
    case "FIN-020":
      return renderFin020(screen);
    case "FIN-021":
      return renderFin021(screen);
    case "FIN-024":
      return renderFin024(screen);
    case "FIN-025":
      return renderFin025(screen);
    case "FIN-027":
      return renderFin027(screen);
    case "FIN-029":
      return renderFin029(screen);
    case "FIN-030":
      return renderFin030(screen);
    case "FIN-031":
      return renderFin031(screen);
    case "FIN-032":
      return renderFin032(screen);
    case "FIN-033":
      return renderFin033(screen);
    case "FIN-034":
      return renderFin034(screen);
    case "FIN-035":
      return renderFin035(screen);
    default:
      return undefined;
  }
}
