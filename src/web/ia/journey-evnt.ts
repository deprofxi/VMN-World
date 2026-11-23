/**
 * VMN World IA R1.1 — EVNT journey (J16): Fusion Events, 9TLIFE, Azeebo+ Live & Event Operations.
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 *
 * Core Governing Authorities:
 * - VMNL-AZP-VMN-CCPP-001 §8, §13, §14
 * - S-FUS-01: Fusion Events production and safety
 * - Invariant: Unsafe venue / unpermitted events remain blocked; emergency cancellations trigger automated refund queues.
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
  { label: "Live Events & Experiences", href: "/workspace" },
  { label: "Fusion Events Operations", href: "/workspace/events/dashboard" },
];

function section(id: string, title: string, body: SafeHtml): SafeHtml {
  return html`<section class="card mb-4" aria-labelledby="${id}">
      <h2 id="${id}">${title}</h2>
      ${body}
    </section>`;
}

function renderEvnt001(screen: IAScreen, ctx: IAGatedPageContext): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "evnt-dashboard-overview",
      "Fusion Events & Live Experience Operations",
      html`<div class="provenance-notice" role="note">
        <strong>Event Operations & Safety Governance:</strong> Session active for <code>${ctx.user.email}</code>. Live concerts, brand activations, and Azeebo+ Live streams are governed under S-FUS-01 safety standards and municipal permit requirements.
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Active Productions</div>
          <div class="text-xl font-bold mt-1">Live Tour Rosters</div>
          <p class="text-xs text-muted mt-1">Concert staging, artist riders, and technical sound/lighting rigs.</p>
        </div>
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Safety & Fire Clearance</div>
          <div class="text-xl font-bold text-success mt-1">Permits Certified</div>
          <p class="text-xs text-muted mt-1">Capacity caps, emergency exits, and medical response standby.</p>
        </div>
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Ticketing & Box Office</div>
          <div class="text-xl font-bold text-success mt-1">Escrow Managed</div>
          <p class="text-xs text-muted mt-1">Gate receipts held in escrow until post-event reconciliation.</p>
        </div>
      </div>
      ${pendingTable(
        "Current Scheduled Live Events",
        ["Event Code", "Title & Experience", "Venue Location", "Audience Capacity", "Safety Permit Status"],
        "Safety permit signoff from certified safety marshal is required for gate opening."
      )}`
    ),
  ].join("\n");
}

function renderEvnt002(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "evnt-safety-inspection",
      "Venue Safety Inspection & Emergency Cancellation Protocol",
      html`<div class="card mb-3">
        <p>Pre-event structural, electrical, and crowd control audit. In the event of force majeure or safety non-compliance, emergency cancellation triggers automated ticket refund processing.</p>
      </div>
      ${pendingTable(
        "Venue Safety Checklist Items",
        ["Inspection Zone", "Regulatory Standard", "Observed Condition", "Marshal Signoff", "Remediation Action"],
        "Violations trigger an immediate HOLD on box office ticket sales."
      )}`
    ),
    sourceNotConnected(screen.sourceOffice || "Events source not connected in this environment."),
  ].join("\n");
}

function renderEvntGeneric(screen: IAScreen, ctx: IAGatedPageContext): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      `evnt-${screen.id.toLowerCase()}`,
      screen.screenName,
      html`<div class="card p-4 mb-3">
        <div class="text-sm font-semibold text-muted mb-1">Journey: J16 · Fusion Events & Live Operations</div>
        <p class="text-sm">Managing live event entity <code>${screen.id}</code> under <strong>${screen.gate}</strong> gate constraints for user <code>${ctx.user.email}</code>.</p>
      </div>
      ${pendingTable(
        `${screen.screenName} Event Records`,
        ["Record ID", "Event / Experience", "Venue & Logistics", "Status", "Responsible Safety Marshal"],
        "All event operations require certified municipal and health approvals prior to ingress."
      )}`
    ),
  ].join("\n");
}

export function renderEvntBody(screen: IAScreen, ctx: IAGatedPageContext): string | undefined {
  if (!screen.id.startsWith("EVNT-")) return undefined;
  switch (screen.id) {
    case "EVNT-001":
      return renderEvnt001(screen, ctx);
    case "EVNT-002":
      return renderEvnt002(screen);
    default:
      return renderEvntGeneric(screen, ctx);
  }
}
