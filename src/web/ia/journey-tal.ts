/**
 * VMN World IA R1.1 — TAL journey (J10): Creator Onboarding, Professional Marketplace & Paid Work.
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 *
 * Core Governing Authorities:
 * - VMNL-AZP-VMN-CCPP-001 §8, §13, §14
 * - Canonical Law 13: "A work surface records a request; it never decides."
 * - Canonical Law 07: "Every ledger entry balances to zero kobo."
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
  { label: "Creator Workspace", href: "/workspace" },
  { label: "Talent Marketplace", href: "/workspace/creators/marketplace-dashboard" },
];

function section(id: string, title: string, body: SafeHtml): SafeHtml {
  return html`<section class="card mb-4" aria-labelledby="${id}">
      <h2 id="${id}">${title}</h2>
      ${body}
    </section>`;
}

function renderTal001(screen: IAScreen, ctx: IAGatedPageContext): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "tal-dashboard-overview",
      "Creator Portfolio & Engagement Hub",
      html`<div class="provenance-notice" role="note">
        <strong>Talent Identity Scoped:</strong> Active session for <code>${ctx.user.email}</code>. Creative engagements, commissioned milestones, and payout receipts are verified under S-VTM-01 talent terms.
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Active Bookings</div>
          <div class="text-xl font-bold mt-1">Production Scoped</div>
          <p class="text-xs text-muted mt-1">Live commissions with milestone deliverables and escrow backing.</p>
        </div>
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Cleared Portfolio</div>
          <div class="text-xl font-bold text-success mt-1">Verified Assets</div>
          <p class="text-xs text-muted mt-1">Media showreels and master tracks cleared for commercial licensing.</p>
        </div>
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Settled Payouts</div>
          <div class="text-xl font-bold text-success mt-1">NGN Cleared</div>
          <p class="text-xs text-muted mt-1">Bank-verified settlements with statutory withholding certificates.</p>
        </div>
      </div>
      ${pendingTable(
        "Current Commissioned Bookings",
        ["Booking ID", "Client / Production", "Deliverable Scope", "Milestone Value (NGN)", "Escrow Status"],
        "Bookings enforce tenant isolation and milestone-based disbursement."
      )}`
    ),
  ].join("\n");
}

function renderTal002(screen: IAScreen, _ctx: IAGatedPageContext): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "tal-portfolio-upload",
      "Creative Work Submission & Chain-of-Title Attestation",
      html`<div class="card mb-3">
        <p>Submit media masters, sound stems, and design assets for commercial accreditation. Creator must attest sole authorship or explicit chain-of-title chain.</p>
      </div>
      <form class="card p-4 space-y-3" method="POST" action="/api/v1/creators/portfolio">
        <div>
          <label class="block text-sm font-semibold mb-1" for="work-title">Title of Creative Work</label>
          <input class="input w-full" id="work-title" name="title" type="text" placeholder="e.g. Afrobeat Symphonic Stems Vol. 1" required />
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1" for="media-category">Media Category</label>
          <select class="input w-full" id="media-category" name="category">
            <option value="AUDIO">Sound Design & Music Composition</option>
            <option value="VIDEO">Cinematography & Editing</option>
            <option value="ANIMATION">2D/3D Animation & VFX</option>
            <option value="WRITING">Screenplay & Narrative Script</option>
          </select>
        </div>
        <div class="vmn-dropzone border border-dashed border-border p-4 text-center rounded cursor-pointer">
          <input type="file" id="portfolio-master-file" class="sr-only" accept="audio/*,video/*,.pdf,.zip" />
          <p class="text-sm">Click to select verified digital masters (Max 500MB).</p>
        </div>
        <button type="submit" class="btn btn-primary">Submit for Technical & Rights QC</button>
      </form>`
    ),
    sourceNotConnected(screen.sourceOffice || "Talent marketplace source not connected in this environment."),
  ].join("\n");
}

function renderTal003(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "tal-rate-card",
      "Commercial Rate Card & Service Terms",
      html`<div class="card mb-3">
        <p>Defines standard daily, per-project, and licensing fee baselines for prospective agency and production clients.</p>
      </div>
      ${pendingTable(
        "Standard Fee Schedule",
        ["Service Tier", "Unit Basis", "Standard Fee (NGN)", "Rush Multiplier", "Rights Coverage"],
        "Rate cards govern initial quotes; binding contracts require signed client DoA."
      )}`
    ),
  ].join("\n");
}

function renderTalGeneric(screen: IAScreen, ctx: IAGatedPageContext): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      `tal-${screen.id.toLowerCase()}`,
      screen.screenName,
      html`<div class="card p-4 mb-3">
        <div class="text-sm font-semibold text-muted mb-1">Journey: J10 · Creator Onboarding & Marketplace</div>
        <p class="text-sm">Managing creator talent record <code>${screen.id}</code> under <strong>${screen.gate}</strong> gate controls for user <code>${ctx.user.email}</code>.</p>
      </div>
      ${pendingTable(
        `${screen.screenName} Ledger Records`,
        ["Reference ID", "Creator Identity", "Scope Description", "Approval Status", "Verification Signature"],
        "Records adhere to S-VTM-01 marketplace terms and two-party cryptographic confirmation."
      )}`
    ),
  ].join("\n");
}

export function renderTalBody(screen: IAScreen, ctx: IAGatedPageContext): string | undefined {
  if (!screen.id.startsWith("TAL-")) return undefined;
  switch (screen.id) {
    case "TAL-001":
      return renderTal001(screen, ctx);
    case "TAL-002":
      return renderTal002(screen, ctx);
    case "TAL-003":
      return renderTal003(screen);
    default:
      return renderTalGeneric(screen, ctx);
  }
}
