/**
 * VMN World IA R1.1 — PART journey (J08): Sponsors, Institutional Partners & Training Providers.
 *
 * Core Governing Authorities:
 * - VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §38, §40, §72
 * - VMNL-AZP-VMN-CCPP-001 §13, §14, §18
 * - Page Plan §6: "Sponsor cannot be shown as contracted until signed. Fulfillment tracking binds to verified as-run spots."
 * - Canonical Law 7: "Internal unit allocations must never inflate consolidated external revenue."
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
  { label: "Partner Workspace", href: "/workspace" },
  { label: "Institutional Partnerships", href: "/workspace/partners/partner-organisation-workspace" },
];

/** A card. The body is markup assembled at the call site, so it is composed, not escaped a second time. */
function section(id: string, title: string, body: SafeHtml): SafeHtml {
  return html`<section class="card mb-4" aria-labelledby="${id}">
      <h2 id="${id}">${title}</h2>
      ${body}
    </section>`;
}

/** PART-001: Partner organisation workspace */
function renderPart001(screen: IAScreen, ctx: IAGatedPageContext): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "part-workspace-overview",
      "Institutional Partnerships & Sponsorship Hub",
      html`<div class="provenance-notice" role="note">
        <strong>Partner Identity Scoped:</strong> Organization session for <code>${ctx.user.email}</code> (Tenant: <code>${ctx.user.tenantId || "unassigned"}</code>). Co-production, institutional grant milestones, and broadcast sponsorship alignments are partitioned under tenant-confidential covenants.
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Sponsorship Contracts</div>
          <div class="text-xl font-bold mt-1">Legally Committed</div>
          <p class="text-xs text-muted mt-1">Sponsorships are reported as contracted only upon bilateral execution.</p>
        </div>
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Institutional Milestones</div>
          <div class="text-xl font-bold mt-1">Grant Verification</div>
          <p class="text-xs text-muted mt-1">Foundation and bilateral donor grant deliverables tracked against evidence.</p>
        </div>
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Proof of Fulfillment</div>
          <div class="text-xl font-bold text-success mt-1">Telemetry Sealed</div>
          <p class="text-xs text-muted mt-1">On-air sponsor bumpers, stings, and verbal mentions reconciled to playout.</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <a class="btn btn-primary" href="/workspace/partners/sponsorship-opportunity-overview">Sponsorship Overview</a>
        <a class="btn btn-outline" href="/workspace/partners/sponsor-order-and-deliverables">Orders & Deliverables</a>
        <a class="btn btn-outline" href="/workspace/partners/institutional-milestone-and-evidence-tracker">Grant Milestones</a>
      </div>`
    ),
  ].join("\n");
}

/** PART-004: Partner diligence checklist */
function renderPart004(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "part-diligence-checklist",
      "Institutional Due Diligence & KYC / Sanctions Verification",
      html`<div class="card mb-3">
        <h3>Statutory Compliance Requirement</h3>
        <p>In accordance with Nigerian Money Laundering (Prevention and Prohibition) Act and NBC broadcast suitability requirements, all institutional partners undergo rigorous anti-fraud, ultimate beneficial ownership (UBO), and sanctions screening.</p>
      </div>
      ${sourceNotConnected("Sanctions lists and PEP registries are queried via certified compliance gateway.")}
      ${pendingTable(
        "Institutional Due Diligence Milestones",
        ["Check Item", "Required Documentation", "Assigned Reviewer", "Verification Status", "Expiry"],
        "Diligence checkpoints enforced before funding drawdown."
      )}`
    ),
  ].join("\n");
}

/** PART-007: Sponsorship opportunity overview */
function renderPart007(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "part-sponsorship-opportunities",
      "Broadcast Title Sponsorship & Co-Production Inventory",
      html`<p class="text-muted mb-3">Available sponsorship slots across TEN Root HD, TEN Urban, and StarTimes DTT/DTH carriages.</p>
      ${pendingTable(
        "Current Programme Sponsorship Packages",
        ["Programme Title", "Daypart Window", "Package Tier", "Exclusivity Term", "Statutory Rate (NGN)", "Availability"],
        "Sponsorship inventory governed by rate-card parity rules."
      )}`
    ),
  ].join("\n");
}

/** PART-009: Sponsor order and deliverables */
function renderPart009(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "part-sponsor-orders",
      "Contracted Sponsor Deliverables & Playout Bindings",
      html`<div class="card mb-3">
        <h3>Playout Binding Invariant</h3>
        <p>Per CCPP §14, sponsor bumpers (5-second billboard stings) must be bound directly to contracted broadcast programmes and verified by PlayoutAutomationEngine.validateSponsorBinding before air.</p>
      </div>
      ${pendingTable(
        "Sponsorship Asset Bindings & Flight Status",
        ["Contract Code", "Sponsor Entity", "Target Show", "Sting Asset ID", "Playout Validation", "Aired Count"],
        "Asset bindings validated against MCR playout schedule."
      )}`
    ),
  ].join("\n");
}

/** PART-010: Sponsor media proof and report */
function renderPart010(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "part-media-proof",
      "Sponsorship Transmission Reconciliation & Media Proof",
      html`<div class="card mb-3">
        <h3>Verified Media Proof</h3>
        <p>Certificates of sponsorship fulfillment are released to partners following 3-way reconciliation against StarTimes DTT/DTH RF carrier telemetry.</p>
      </div>
      ${pendingTable(
        "Reconciled Sponsorship Broadcast Events",
        ["Transmission Date", "Channel", "Show Title", "Sting Code", "Carrier RF Lock", "Certificate SHA-256"],
        "Transmission confirmation sealed by Master Control Operations."
      )}`
    ),
  ].join("\n");
}

/** PART-014: Institutional milestone and evidence tracker */
function renderPart014(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "part-milestone-tracker",
      "Institutional Grant Deliverables & Objective Evidence",
      html`<div class="card mb-3">
        <h3>Grant Milestone Discipline</h3>
        <p>Institutional grant disbursements require objective evidence (attendance logs, graduation records, production broadcast receipts) verified by independent project monitors before tranche release.</p>
      </div>
      ${pendingTable(
        "Grant Deliverable Tranches",
        ["Tranche Ref", "Milestone Target", "Funding Amount", "Evidence Package", "Independent Audit", "Drawdown Status"],
        "Tranche releases audited in compliance with donor covenants."
      )}`
    ),
  ].join("\n");
}

/** Primary dispatcher for PART journey */
export function renderPartBody(screen: IAScreen, ctx: IAGatedPageContext): string | undefined {
  switch (screen.id) {
    case "PART-001":
    case "PART-002":
    case "PART-003":
      return renderPart001(screen, ctx);
    case "PART-004":
    case "PART-005":
      return renderPart004(screen);
    case "PART-007":
    case "PART-008":
      return renderPart007(screen);
    case "PART-009":
      return renderPart009(screen);
    case "PART-010":
      return renderPart010(screen);
    case "PART-014":
      return renderPart014(screen);
    default:
      return undefined;
  }
}
