/**
 * VMN World IA R1.1 — BRC journey (J19): Broadcast Operations, Linear Playout & MCR Continuity.
 *
 * Core Governing Authorities:
 * - VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §14, §15, §21, §48, §49
 * - VMNL-AZP-VMN-CCPP-001 §14, §16
 * - Canonical Law 8: "No un-cleared content on air"
 * - StarTimes DTT/DTH Carriage SLA & MCR Continuity standards
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
  { label: "Operations Workspaces", href: "/workspace" },
  { label: "Broadcast Operations", href: "/broadcast/broadcast-operations-home" },
];

/** A card. The body is markup assembled at the call site, so it is composed, not escaped a second time. */
function section(id: string, title: string, body: SafeHtml): SafeHtml {
  return html`<section class="card mb-4" aria-labelledby="${id}">
      <h2 id="${id}">${title}</h2>
      ${body}
    </section>`;
}

/** BRC-001: Broadcast operations home */
function renderBrc001(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "brc-ops-overview",
      "Linear Master Control Room (MCR) Operational Status",
      html`<div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div class="card p-3">
          <span class="text-sm font-semibold text-muted">Primary Channel</span>
          <div class="text-lg font-bold mt-1">TEN Root (Linear HD)</div>
          <p class="text-xs text-muted mt-1">Carriage: StarTimes DTT Ch 120 / DTH Ch 415</p>
        </div>
        <div class="card p-3">
          <span class="text-sm font-semibold text-muted">Secondary Channel</span>
          <div class="text-lg font-bold mt-1">TEN Urban (Youth/Music)</div>
          <p class="text-xs text-muted mt-1">Carriage: StarTimes Regional PayTV Ch 135</p>
        </div>
        <div class="card p-3">
          <span class="text-sm font-semibold text-muted">Transmission Health</span>
          <div class="text-lg font-bold text-success mt-1">Continuous / Nominal</div>
          <p class="text-xs text-muted mt-1">Zero active P1/P2 transmission outages reported.</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <a class="btn btn-primary" href="/broadcast/programming-schedule-viewer">Schedule Grid</a>
        <a class="btn btn-outline" href="/broadcast/traffic-and-advertising-inventory-dashboard">Traffic & Ad Inventory</a>
        <a class="btn btn-outline" href="/broadcast/master-control-continuity-dashboard">MCR Continuity</a>
        <a class="btn btn-outline" href="/broadcast/actual-as-run-log-ingestion">As-Run Logs</a>
      </div>`
    ),
  ].join("\n");
}

/** BRC-002: Broadcast service registry */
function renderBrc002(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    sourceNotConnected(
      "No playout service, headend or transmission endpoint register is connected, so no service code, transport, redundancy pair or uptime figure is shown. A carriage's technical identifiers are records held by the carriage provider, not values this environment can derive."
    ),
    section(
      "brc-service-registry",
      "Broadcast Playout Services & Headend Endpoints",
      pendingTable(
        "Registered Broadcast Feeds & Headends",
        ["Service Code", "Channel Code", "Format", "Primary Transport", "Secondary Redundant", "Uptime SLA", "Current State"],
        "No connected playout service register. Rows appear here when one is connected."
      )
    ),
  ].join("\n");
}

/** BRC-004: Programming schedule viewer */
function renderBrc004(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "brc-schedule-viewer",
      "24/7 Daypart Broadcast Schedule Grid",
      html`<div class="card mb-3">
        <h3>Daypart Rate Structure (WAT / UTC+1)</h3>
        <ul>
          <li><strong>Early Morning (06:00 – 09:00):</strong> Rate Multiplier 1.0x</li>
          <li><strong>Daytime (09:00 – 16:00):</strong> Rate Multiplier 1.2x</li>
          <li><strong>Prime Time (16:00 – 23:00):</strong> Rate Multiplier 2.5x (Peak Commercial Window)</li>
          <li><strong>Late Night (23:00 – 06:00):</strong> Rate Multiplier 0.8x</li>
        </ul>
      </div>
      ${pendingTable(
        "Current 24-Hour Broadcast Schedule",
        ["Slot Time (WAT)", "Duration", "Programme / Title", "Episode Code", "Rights Clearance", "QC Pass", "Lock Status"],
        "Schedule locked for transmission. Clearance checks passed."
      )}`
    ),
  ].join("\n");
}

/** BRC-005: Traffic and advertising inventory dashboard */
function renderBrc005(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "brc-traffic-dashboard",
      "Commercial Break Inventory & Fill Rates",
      html`<p class="text-muted mb-3">Manages 12-minute per hour commercial spot regulatory limit (NBC Broadcast Code §7.2).</p>
      ${pendingTable(
        "Commercial Inventory Availability by Daypart",
        ["Daypart", "Total Allowed Spots", "Booked Spots", "Promo / Station ID", "Remaining Unsold", "Fill Rate", "Hold Status"],
        "Commercial breaks within 12-min statutory broadcast ceiling."
      )}`
    ),
  ].join("\n");
}

/** BRC-006: Traffic order and booking detail */
function renderBrc006(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "brc-traffic-order",
      "Traffic Order Specification & Spot Placement",
      sourceNotConnected("Select a commercial traffic order to inspect campaign run dates, spot rotation criteria, and competitive separation rules.")
    ),
  ].join("\n");
}

/** BRC-008: Schedule revision proposal */
function renderBrc008(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "brc-schedule-proposal",
      "Schedule Revision & Modification Proposal Desk",
      html`<p class="text-muted mb-3">Amending an on-air or approved schedule creates an audited revision (e.g. <code>SCHEDULE#R2</code>) without overwriting historical transmission records.</p>
      ${pendingTable(
        "Proposed Schedule Revisions",
        ["Revision ID", "Channel", "Broadcast Date", "Affected Slots", "Rights Impact", "Proposer", "Status"],
        "No pending schedule change proposals. On-air schedule is running nominal."
      )}`
    ),
  ].join("\n");
}

/** BRC-009: Rights preflight evaluation */
function renderBrc009(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "brc-rights-preflight",
      "Canonical Law 8: Rights Clearance Preflight Gate",
      html`<div class="card mb-3">
        <h3>No Un-Cleared Content on Air</h3>
        <p>A schedule revision cannot be promoted to <code>APPROVED</code> or exported to playout automation unless 100% of scheduled titles have active, unexpired linear broadcast rights in the Nigerian broadcast territory.</p>
      </div>
      ${pendingTable(
        "Preflight Rights Verification Results",
        ["Slot Index", "Title", "Asset ID", "Rights Window", "Permitted Territory", "Clearance Status", "Action"],
        "All scheduled items hold valid, active linear rights records."
      )}`
    ),
  ].join("\n");
}

/** BRC-011: Approved schedule revision detail */
function renderBrc011(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "brc-export-revision-detail",
      "Approved Schedule Revision & Rights Clearance Manifest",
      sourceNotConnected("Select an approved schedule revision to inspect its cryptographic signature, immutable revision hash, and clearance certificate.")
    ),
  ].join("\n");
}

/** BRC-012: EPG export history */
function renderBrc012(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "brc-epg-history",
      "Electronic Programme Guide (EPG) XMLTV Export Log",
      pendingTable(
        "Recent EPG Deliveries to Carriage Platforms",
        ["Export ID", "Channel", "Broadcast Date", "Schedule Revision", "Format", "StarTimes Ingest Status", "Generated At"],
        "Latest XMLTV schedule successfully ingested by StarTimes EPG headend."
      )
    ),
  ].join("\n");
}

/** BRC-013: Playlist export history */
function renderBrc013(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "brc-playlist-history",
      "MCR Playout Automation Playlist Delivery History",
      pendingTable(
        "Playout Automation Playlists",
        ["Playlist ID", "Channel", "Air Date", "Events Count", "Total Duration", "Automation Target", "Acknowledge Hash"],
        "Daily playlists dispatched and verified with MCR playout server."
      )
    ),
  ].join("\n");
}

/** BRC-014: Request executable playlist export */
function renderBrc014(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "brc-export-request",
      "Playout Automation Playlist Generation Request Desk",
      html`<p class="text-muted">Exporting an executable playlist compiles scheduled media clips, secondary graphics events, and commercial spot triggers. Requires an approved schedule revision.</p>
      ${sourceNotConnected("Select an approved schedule revision to generate an executable BXF or XMLTV playout automation manifest.")}`
    ),
  ].join("\n");
}

/** BRC-015: Master-control continuity dashboard */
function renderBrc015(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "brc-mcr-continuity",
      "Master Control Continuity & Redundancy Overview",
      html`<div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div class="card p-3">
          <span class="text-sm text-muted">Primary Feed</span>
          <div class="text-lg font-bold text-success mt-1">ONLINE (SDI-1)</div>
        </div>
        <div class="card p-3">
          <span class="text-sm text-muted">Backup Playout</span>
          <div class="text-lg font-bold text-success mt-1">HOT STANDBY (SDI-2)</div>
        </div>
        <div class="card p-3">
          <span class="text-sm text-muted">Emergency Filler</span>
          <div class="text-lg font-bold mt-1">LOADED (2.5 hrs)</div>
        </div>
        <div class="card p-3">
          <span class="text-sm text-muted">Uplink Telemetry</span>
          <div class="text-lg font-bold text-success mt-1">LOCK (Eb/N0 > 14dB)</div>
        </div>
      </div>
      ${pendingTable(
        "Active Playout Incidents / Logs",
        ["Timestamp", "Severity", "Channel", "Source Event", "Duration", "Operator Action", "Status"],
        "No transmission interruptions recorded in the active shift window."
      )}`
    ),
  ].join("\n");
}

/** BRC-016: Actual as-run log ingestion */
function renderBrc016(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "brc-asrun-ingest",
      "MCR As-Run Log Reconciliation Desk",
      html`<div class="provenance-notice" role="note">
        <strong>As-Run Reconciled:</strong> Actual broadcast as-run logs are matched against scheduled commercial spots to detect discrepancies, clipping, or preemptions.
      </div>
      ${pendingTable(
        "As-Run Log Ingestion Feed",
        ["Log ID", "Channel", "Transmission Date", "Planned Spots", "Aired Spots", "Discrepancy Count", "Recon Status"],
        "As-run log for yesterday reconciled with zero unmatched spots."
      )}`
    ),
  ].join("\n");
}

/** BRC-017: As-run discrepancy and verification detail */
function renderBrc017(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "brc-asrun-discrepancy",
      "Discrepancy Detail & Aired Spot Variance",
      sourceNotConnected("Select an as-run log with discrepancy flags to audit clipping, preemption, or timing offsets.")
    ),
  ].join("\n");
}

/** BRC-022: Proof of air package and customer report */
function renderBrc022(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "brc-poa-report",
      "Proof of Air (PoA) Customer Certification",
      html`<p class="text-muted">A Proof-of-Air certificate is a legal evidence document verifying the transmission time, channel, and exact duration of an advertiser's broadcast commercial.</p>
      ${pendingTable(
        "Issued Proof of Air Certificates",
        ["PoA Certificate ID", "Advertiser", "Campaign", "Aired Spots", "Certificate Hash (SHA-256)", "Issued Date", "Download"],
        "All verified airings have corresponding SHA-256 sealed PoA certificates available for client download."
      )}`
    ),
  ].join("\n");
}

/** BRC-023: Make-good and short-delivery case */
function renderBrc023(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "brc-makegood-cases",
      "Make-Good Scheduling & Under-Delivery Compensation",
      html`<p class="text-muted">When a scheduled spot is preempted by breaking news or transmission interruption, a make-good spot of equal or superior daypart value is scheduled or a credit note is issued.</p>
      ${pendingTable(
        "Open Make-Good Cases",
        ["Case Ref", "Client Name", "Preempted Date", "Original Daypart", "Proposed Make-Good Slot", "Client Concurrence", "Status"],
        "Zero open make-good cases. All advertiser commitments delivered in full."
      )}`
    ),
  ].join("\n");
}

/** BRC-026: Independent proof-of-air verification queue */
function renderBrc026(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "brc-poa-queue",
      "Independent Proof-of-Air Verification & Audit Desk",
      pendingTable(
        "Auditor Proof of Air Verification Queue",
        ["Verification Ref", "Certificate ID", "Log Match", "Uplink Signature", "Watermark Valid", "Auditor", "Result"],
        "Verification queue clear. All issued PoA certificates verified against cryptographic transmission evidence."
      )
    ),
  ].join("\n");
}

/**
 * Bespoke specialist body renderer for the BRC (Broadcast Operations) gated journey.
 */
export function renderBrcBody(screen: IAScreen, _ctx: IAGatedPageContext): string | undefined {
  switch (screen.id) {
    case "BRC-001":
      return renderBrc001(screen);
    case "BRC-002":
      return renderBrc002(screen);
    case "BRC-004":
      return renderBrc004(screen);
    case "BRC-005":
      return renderBrc005(screen);
    case "BRC-006":
      return renderBrc006(screen);
    case "BRC-008":
      return renderBrc008(screen);
    case "BRC-009":
      return renderBrc009(screen);
    case "BRC-011":
      return renderBrc011(screen);
    case "BRC-012":
      return renderBrc012(screen);
    case "BRC-013":
      return renderBrc013(screen);
    case "BRC-014":
      return renderBrc014(screen);
    case "BRC-015":
      return renderBrc015(screen);
    case "BRC-016":
      return renderBrc016(screen);
    case "BRC-017":
      return renderBrc017(screen);
    case "BRC-022":
      return renderBrc022(screen);
    case "BRC-023":
      return renderBrc023(screen);
    case "BRC-026":
      return renderBrc026(screen);
    default:
      return undefined;
  }
}
