/**
 * VMN World IA R1.1 — STUD journey (J15): ONE Studios, VCF Production & Professional Asset Delivery.
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 *
 * Core Governing Authorities:
 * - VMNL-AZP-VMN-CCPP-001 §8, §13, §14
 * - S-ONE-01: ONE Studios media assets and QC
 * - Invariant: Master custody != worldwide exploitation rights; technical QC must precede broadcast ingest.
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
  { label: "Production & Studios", href: "/workspace" },
  { label: "ONE Studios Operations", href: "/workspace/studios/dashboard" },
];

function section(id: string, title: string, body: SafeHtml): SafeHtml {
  return html`<section class="card mb-4" aria-labelledby="${id}">
      <h2 id="${id}">${title}</h2>
      ${body}
    </section>`;
}

function renderStud001(screen: IAScreen, ctx: IAGatedPageContext): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "stud-dashboard-overview",
      "ONE Studios Production & Facility Management",
      html`<div class="provenance-notice" role="note">
        <strong>Studio Production Operations:</strong> Session active for <code>${ctx.user.email}</code>. Physical studio stages, virtual production LED volumes, and master media QC are managed under S-ONE-01 operational guidelines.
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Stage Utilization</div>
          <div class="text-xl font-bold mt-1">Studio Stage A & B</div>
          <p class="text-xs text-muted mt-1">Multi-camera sound stages, lighting rigs, and acoustic isolation rooms.</p>
        </div>
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Technical QC Queue</div>
          <div class="text-xl font-bold text-success mt-1">R128 / EBU Passed</div>
          <p class="text-xs text-muted mt-1">Loudness compliance, colorimetry calibration, and caption sync verification.</p>
        </div>
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Call Sheet Approvals</div>
          <div class="text-xl font-bold mt-1">Active Shoots</div>
          <p class="text-xs text-muted mt-1">Daily production rosters with health, safety, and catering logistics.</p>
        </div>
      </div>
      ${pendingTable(
        "Active Studio Bookings & Production Shoots",
        ["Booking ID", "Production Title", "Sound Stage", "Scheduled Call Time", "Technical Lead"],
        "Facility allocations are verified against certified engineering maintenance schedules."
      )}`
    ),
  ].join("\n");
}

function renderStud002(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "stud-qc-inspection",
      "Master Media Technical QC & Delivery Certificate",
      html`<div class="card mb-3">
        <p>Inspect master broadcast delivery packages for video codec profile, audio track layout, and broadcast compliance.</p>
      </div>
      ${pendingTable(
        "Media Master QC Verification Checklist",
        ["Asset ID", "Container & Codec", "Audio Loudness (LUFS)", "Timecode Continuity", "QC Disposition"],
        "Master delivery acceptance is required before promotion to linear playout ingest."
      )}`
    ),
    sourceNotConnected(screen.sourceOffice || "Studio source not connected in this environment."),
  ].join("\n");
}

function renderStudGeneric(screen: IAScreen, ctx: IAGatedPageContext): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      `stud-${screen.id.toLowerCase()}`,
      screen.screenName,
      html`<div class="card p-4 mb-3">
        <div class="text-sm font-semibold text-muted mb-1">Journey: J15 · ONE Studios & Asset Delivery</div>
        <p class="text-sm">Managing studio operations entity <code>${screen.id}</code> under <strong>${screen.gate}</strong> gate controls for user <code>${ctx.user.email}</code>.</p>
      </div>
      ${pendingTable(
        `${screen.screenName} Records`,
        ["Record ID", "Asset / Production Name", "Stage / Equipment", "Status", "Responsible Engineer"],
        "Enforcing S-ONE-01 production custody and verified asset delivery standards."
      )}`
    ),
  ].join("\n");
}

export function renderStudBody(screen: IAScreen, ctx: IAGatedPageContext): string | undefined {
  if (!screen.id.startsWith("STUD-")) return undefined;
  switch (screen.id) {
    case "STUD-001":
      return renderStud001(screen, ctx);
    case "STUD-002":
      return renderStud002(screen);
    default:
      return renderStudGeneric(screen, ctx);
  }
}
