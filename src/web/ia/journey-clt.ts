/**
 * VMN World IA R1.1 — CLT journey (J07): Client Onboarding, Commissioning, Delivery & Acceptance.
 *
 * Core Governing Authorities:
 * - VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §38, §39, §41
 * - VMNL-AZP-VMN-CCPP-001 §8, §13, §14
 * - Canonical Law 13: "A work surface records a request; it never decides."
 * - Page Plan §6: "Client acceptance is a controlled decision. No deliverable can be marked accepted without client authority signature or DoA record."
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
  { label: "Client Workspace", href: "/workspace" },
  { label: "Commissioning & Delivery", href: "/workspace/clients/client-workspace-dashboard" },
];

/** A card. The body is markup assembled at the call site, so it is composed, not escaped a second time. */
function section(id: string, title: string, body: SafeHtml): SafeHtml {
  return html`<section class="card mb-4" aria-labelledby="${id}">
      <h2 id="${id}">${title}</h2>
      ${body}
    </section>`;
}

/** CLT-001: Client workspace dashboard */
function renderClt001(screen: IAScreen, ctx: IAGatedPageContext): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "clt-dashboard-overview",
      "Client Engagement & Commissioning Portfolio",
      html`<div class="provenance-notice" role="note">
        <strong>Client Authority Scoped:</strong> Session active for <code>${ctx.user.email}</code> (Tenant: <code>${ctx.user.tenantId || "unassigned"}</code>). Deliverables and financial commitments are strictly scoped to verified organizational counterparty mandates.
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Active Commissioning Briefs</div>
          <div class="text-xl font-bold mt-1">Contract Scoped</div>
          <p class="text-xs text-muted mt-1">Briefs undergoing scoping, creative RFP, or technical rate card review.</p>
        </div>
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Delivery Milestones</div>
          <div class="text-xl font-bold mt-1">Production Queue</div>
          <p class="text-xs text-muted mt-1">Master broadcast episodes, commercial spots, and digital assets.</p>
        </div>
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Proof of Performance</div>
          <div class="text-xl font-bold text-success mt-1">Verified Airing</div>
          <p class="text-xs text-muted mt-1">Cryptographically sealed certificates generated from verified as-run logs.</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <a class="btn btn-primary" href="/workspace/clients/brief-detail-and-clarification">Active Briefs</a>
        <a class="btn btn-outline" href="/workspace/clients/deliverable-tracker">Deliverable Tracker</a>
        <a class="btn btn-outline" href="/workspace/clients/invoices-and-payment-status">Billing & Settlements</a>
      </div>`
    ),
  ].join("\n");
}

/** CLT-002: Client organisation profile */
function renderClt002(screen: IAScreen, ctx: IAGatedPageContext): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "clt-org-profile",
      "Corporate Client Identity & Regulatory Compliance",
      html`<div class="card mb-3">
        <h3>Organization Reference</h3>
        <p>Tenant ID: <code>${ctx.user.tenantId || "PROVISIONAL-TENANT"}</code> &bull; Representative: <strong>${ctx.user.email}</strong></p>
      </div>
      ${sourceNotConnected("CAC Certificate of Incorporation and corporate tax TIN validation are verified out-of-band by Commercial Legal prior to contract execution.")}
      ${pendingTable(
        "Authorized Corporate Officers & Signatories",
        ["Name", "Role Title", "Delegation of Authority (DoA)", "Verification State", "Mandate Expiry"],
        "Signatories verified by Commercial Operations."
      )}`
    ),
  ].join("\n");
}

/** CLT-003: My enquiries and briefs */
function renderClt003(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "clt-enquiries-briefs",
      "Client Commercial Briefs & Intake Pipeline",
      html`<p class="text-muted mb-3">Tracks inbound RFP, sponsorship proposals, and creative production orders through the intake lifecycle.</p>
      ${pendingTable(
        "Active Commercial Briefs",
        ["Brief Ref", "Title", "Intended Channel / Locus", "Budget Range", "Submission Date", "Workflow Status"],
        "Commercial intake registered and active."
      )}`
    ),
  ].join("\n");
}

/** CLT-004: Brief detail and clarification */
function renderClt004(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "clt-brief-detail",
      "Commercial Brief Scope & Requirements Thread",
      html`<div class="card mb-3">
        <h3>Mandatory Commercial Scope Invariant</h3>
        <p>Under CCPP §8, no production work or broadcast slot reservation commences without an approved, bilaterally signed Master Service Agreement (MSA) and Statement of Work (SOW).</p>
      </div>
      ${pendingTable(
        "Scope Items & Technical Specifications",
        ["Item #", "Deliverable Description", "Format / Standard", "Target Run Date", "Clearance Status"],
        "Technical specifications verified against broadcast transmission constraints."
      )}`
    ),
  ].join("\n");
}

/** CLT-011: Deliverable review detail */
function renderClt011(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "clt-deliverable-review",
      "Deliverable Acceptance & QC Gate Review",
      html`<div class="card mb-3">
        <h3>Controlled Decision Rule</h3>
        <p>Client acceptance is a controlled legal act. Approving a deliverable triggers revenue recognition under IFRS 15 and closes the production warranty period. Rejection must cite specific contractual non-conformances.</p>
      </div>
      ${sourceNotConnected("Linear transmission masters are held in secure object storage; viewing proxies require active session token.")}
      ${pendingTable(
        "Deliverable Inspection Log",
        ["Asset Code", "Title", "Version", "QC Video Pass", "Audio Loudness (-24 LUFS)", "Client Acceptance"],
        "QC metrics validated against NBC Technical Standards."
      )}`
    ),
  ].join("\n");
}

/** CLT-016: Invoice detail and supporting proof */
function renderClt016(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "clt-invoice-detail",
      "Tax Invoice & Proof-of-Performance Verification",
      html`<div class="card mb-3">
        <h3>Proof-of-Performance Binding</h3>
        <p>In accordance with CCPP §13, advertising and broadcast sponsorship invoices are supported by cryptographically sealed Proof-of-Air Certificates linked directly to MCR transmission logs.</p>
      </div>
      ${pendingTable(
        "Billed Commercial Spots & Telemetry Match",
        ["Invoice Ref", "Spot ID", "Channel", "Scheduled Slot", "Actual As-Run Time", "Carrier RF Lock", "Cert Signature"],
        "3-way reconciliation verified across booking, automation, and uplink."
      )}`
    ),
  ].join("\n");
}

/** CLT-019: Project completion and closeout */
function renderClt019(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "clt-project-closeout",
      "Contractual Fulfillment & Closeout Sign-Off",
      html`<div class="card mb-3">
        <h3>Closeout Governance</h3>
        <p>Final project closeout confirms delivery of all agreed assets, reconciliation of make-good airings, settlement of withholding tax (WHT) credits, and formal release of production escrows.</p>
      </div>
      ${pendingTable(
        "Closeout Audit Checklist",
        ["Obligation Code", "Description", "Contract Target", "Delivered Actual", "Audit Sign-off", "Residual Liability"],
        "Audit sign-off verified by Legal and Finance Controllers."
      )}`
    ),
  ].join("\n");
}

/** CLT-024: Client workspace member and approver register */
function renderClt024(screen: IAScreen, ctx: IAGatedPageContext): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "clt-member-register",
      "Authorized Client Officers & Approval Matrix",
      html`<div class="card mb-3">
        <p>Manages organizational team members with authority to review briefs, submit material revisions, and sign delivery acceptance on behalf of <code>${ctx.user.tenantId || "Client"}</code>.</p>
      </div>
      ${pendingTable(
        "Authorized Approver Register",
        ["Officer Email", "Corporate Role", "Approval Ceiling (NGN)", "Status", "Two-Factor Auth"],
        "Approver permissions enforced by tenant RBAC isolation boundary."
      )}`
    ),
  ].join("\n");
}

/** Primary dispatcher for CLT journey */
export function renderCltBody(screen: IAScreen, ctx: IAGatedPageContext): string | undefined {
  switch (screen.id) {
    case "CLT-001":
      return renderClt001(screen, ctx);
    case "CLT-002":
      return renderClt002(screen, ctx);
    case "CLT-003":
      return renderClt003(screen);
    case "CLT-004":
    case "CLT-005":
      return renderClt004(screen);
    case "CLT-011":
    case "CLT-012":
      return renderClt011(screen);
    case "CLT-016":
    case "CLT-017":
      return renderClt016(screen);
    case "CLT-019":
    case "CLT-020":
      return renderClt019(screen);
    case "CLT-024":
      return renderClt024(screen, ctx);
    default:
      return undefined;
  }
}
