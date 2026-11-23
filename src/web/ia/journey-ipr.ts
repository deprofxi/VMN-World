/**
 * VMN World IA R1.1 — IPR journey (J17): IP, Storyworld Governance, Rights & TEND Licensing.
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 *
 * Core Governing Authorities:
 * - VMNL-AZP-VMN-CCPP-001 §8, §13, §14
 * - S-TND-01: TEND licensing and royalty sources
 * - S-LEG-01: Contracts, rights and privacy opinions
 * - Invariant: Revoked or expired rights trigger immediate downstream distribution freeze.
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
  { label: "Rights & IP", href: "/workspace" },
  { label: "IP & Licensing Governance", href: "/workspace/rights/ipr-dashboard" },
];

function section(id: string, title: string, body: SafeHtml): SafeHtml {
  return html`<section class="card mb-4" aria-labelledby="${id}">
      <h2 id="${id}">${title}</h2>
      ${body}
    </section>`;
}

function renderIpr001(screen: IAScreen, ctx: IAGatedPageContext): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "ipr-dashboard-overview",
      "Intellectual Property & Content Rights Registry",
      html`<div class="provenance-notice" role="note">
        <strong>Rights & Chain-of-Title Scoped:</strong> Session active for <code>${ctx.user.email}</code>. Title rights, international syndication agreements, and music cue sheet royalties are governed under S-TND-01 and S-LEG-01 authorities.
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Cleared Catalogue</div>
          <div class="text-xl font-bold text-success mt-1">45 Titles Verified</div>
          <p class="text-xs text-muted mt-1">Full chain-of-title, talent releases, and musical clearances confirmed.</p>
        </div>
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Syndication Deals</div>
          <div class="text-xl font-bold mt-1">TEND Active</div>
          <p class="text-xs text-muted mt-1">B2B territorial exhibition windows, OTT licensing, and airline rights.</p>
        </div>
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Royalty Accruals</div>
          <div class="text-xl font-bold text-success mt-1">PRO Cleared</div>
          <p class="text-xs text-muted mt-1">Music cue sheet distributions for COSON, MCSN, and international PROs.</p>
        </div>
      </div>
      ${pendingTable(
        "Active Title Rights & Exhibition Clearances",
        ["Title Code", "Original Storyworld", "Permitted Territories", "Term Expiration", "Chain-of-Title Status"],
        "Expiring rights automatically alert distribution operations 30 days prior to blackout."
      )}`
    ),
  ].join("\n");
}

function renderIpr002(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "ipr-revocation-workbench",
      "Rights Revocation & Downstream Blackout Trigger",
      html`<div class="card mb-3">
        <p>Emergency rights revocation workbench. Triggering revocation immediately updates linear EPG schedules, drops digital video streams, and records the statutory cease notice.</p>
      </div>
      ${pendingTable(
        "Downstream Distribution Channels Governed",
        ["Distribution Platform", "Channel Code / Endpoint", "Active Title License", "Lock / Blackout Status", "Revocation Action"],
        "Revocation operations require joint Legal Counsel and Commercial Director dual approval."
      )}`
    ),
    sourceNotConnected(screen.sourceOffice || "IP Rights source not connected in this environment."),
  ].join("\n");
}

function renderIprGeneric(screen: IAScreen, ctx: IAGatedPageContext): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      `ipr-${screen.id.toLowerCase()}`,
      screen.screenName,
      html`<div class="card p-4 mb-3">
        <div class="text-sm font-semibold text-muted mb-1">Journey: J17 · IP, Storyworlds & TEND Licensing</div>
        <p class="text-sm">Managing intellectual property record <code>${screen.id}</code> under <strong>${screen.gate}</strong> gate constraints for user <code>${ctx.user.email}</code>.</p>
      </div>
      ${pendingTable(
        `${screen.screenName} Governance Records`,
        ["Contract ID", "Title / Asset", "Licensing Partner", "Status", "Legal Attestation"],
        "Enforcing strict contractual boundaries; unsigned licences cannot expand distribution."
      )}`
    ),
  ].join("\n");
}

export function renderIprBody(screen: IAScreen, ctx: IAGatedPageContext): string | undefined {
  if (!screen.id.startsWith("IPR-")) return undefined;
  switch (screen.id) {
    case "IPR-001":
      return renderIpr001(screen, ctx);
    case "IPR-002":
      return renderIpr002(screen);
    default:
      return renderIprGeneric(screen, ctx);
  }
}
