/**
 * VMN World IA R1.1 — GOV journey (J21): Legal, People, Governance, Privacy & Formal Approvals.
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 *
 * Core Governing Authorities:
 * - VMNL-AZP-VMN-CCPP-001 §8, §13, §14
 * - S-GOV-01: Corporate decisions and reserved matters
 * - S-LEG-01: Contracts, rights and privacy opinions
 * - S-PPL-01: Employment, personal cases, pay
 * - Invariant: Board approval required for reserved matters; DSAR erasure blocked under active litigation hold.
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
  { label: "Governance & Legal", href: "/workspace" },
  { label: "Corporate Governance Operations", href: "/workspace/governance/dashboard" },
];

function section(id: string, title: string, body: SafeHtml): SafeHtml {
  return html`<section class="card mb-4" aria-labelledby="${id}">
      <h2 id="${id}">${title}</h2>
      ${body}
    </section>`;
}

function renderGov001(screen: IAScreen, ctx: IAGatedPageContext): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "gov-dashboard-overview",
      "Corporate Governance, Legal & Statutory Oversight",
      html`<div class="provenance-notice" role="note">
        <strong>Statutory & Reserved Matters Governance:</strong> Session active for <code>${ctx.user.email}</code>. Formal board resolutions, executive DoA limits, personnel cases, and NDPR/GDPR privacy requests are managed under S-GOV-01 and S-LEG-01 authority.
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Board Resolutions</div>
          <div class="text-xl font-bold text-success mt-1">Certified Active</div>
          <p class="text-xs text-muted mt-1">Formal corporate minutes, signing limits, and banking mandates.</p>
        </div>
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Contract Signing Queue</div>
          <div class="text-xl font-bold mt-1">Legal Review</div>
          <p class="text-xs text-muted mt-1">Master commercial agreements, co-production MoUs, and NDAs.</p>
        </div>
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Privacy Rights / DSAR</div>
          <div class="text-xl font-bold text-success mt-1">Lawful Compliance</div>
          <p class="text-xs text-muted mt-1">Data-subject access requests, erasure notices, and litigation holds.</p>
        </div>
      </div>
      ${pendingTable(
        "Current Corporate Governance & Board Matters",
        ["Resolution ID", "Matter Title", "Statutory Scope", "DoA Threshold (NGN)", "Company Secretary Attestation"],
        "Consequential corporate actions require formal Board or Company Secretary signoff."
      )}`
    ),
  ].join("\n");
}

function renderGov002(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "gov-privacy-dsar",
      "Data-Subject Rights Request (DSAR) & Litigation Hold Management",
      html`<div class="card mb-3">
        <p>Process statutory data-subject access, rectification, and erasure requests. Invariant: records under an active legal or audit hold cannot be deleted.</p>
      </div>
      ${pendingTable(
        "Active Privacy & Rights Inquiries",
        ["DSAR Reference", "Data Subject Email", "Request Classification", "Legal Hold Status", "Statutory Deadline"],
        "DPO and Legal Counsel dual authorization required for data disclosure or erasure."
      )}`
    ),
    sourceNotConnected(screen.sourceOffice || "Governance source not connected in this environment."),
  ].join("\n");
}

function renderGovGeneric(screen: IAScreen, ctx: IAGatedPageContext): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      `gov-${screen.id.toLowerCase()}`,
      screen.screenName,
      html`<div class="card p-4 mb-3">
        <div class="text-sm font-semibold text-muted mb-1">Journey: J21 · Legal, People & Corporate Governance</div>
        <p class="text-sm">Managing governance entity <code>${screen.id}</code> under <strong>${screen.gate}</strong> gate constraints for user <code>${ctx.user.email}</code>.</p>
      </div>
      ${pendingTable(
        `${screen.screenName} Governance Records`,
        ["Record ID", "Governance Instrument", "Responsible Officer", "Status", "Seal / Signature"],
        "Enforcing strict statutory compliance and fiduciary duty under Company Law."
      )}`
    ),
  ].join("\n");
}

export function renderGovBody(screen: IAScreen, ctx: IAGatedPageContext): string | undefined {
  if (!screen.id.startsWith("GOV-")) return undefined;
  switch (screen.id) {
    case "GOV-001":
      return renderGov001(screen, ctx);
    case "GOV-002":
      return renderGov002(screen);
    default:
      return renderGovGeneric(screen, ctx);
  }
}
