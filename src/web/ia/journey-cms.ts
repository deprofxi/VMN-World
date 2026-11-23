/**
 * VMN World IA R1.1 — CMS journey (J18): Brand Editorial, Publishing, Media & Company Content Governance.
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 *
 * Core Governing Authorities:
 * - VMNL-AZP-VMN-CCPP-001 §8, §13, §14
 * - Invariant: Published copy must match verified business facts; brand copy != operating channel launch.
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
  { label: "Publishing & Media", href: "/workspace" },
  { label: "Editorial Workbench", href: "/workspace/editorial/cms-dashboard" },
];

function section(id: string, title: string, body: SafeHtml): SafeHtml {
  return html`<section class="card mb-4" aria-labelledby="${id}">
      <h2 id="${id}">${title}</h2>
      ${body}
    </section>`;
}

function renderCms001(screen: IAScreen, ctx: IAGatedPageContext): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "cms-dashboard-overview",
      "Brand Editorial & Digital Publishing Operations",
      html`<div class="provenance-notice" role="note">
        <strong>Editorial Governance Scoped:</strong> Session active for <code>${ctx.user.email}</code>. Corporate releases, brand profile copy, and social media announcements are managed under Group Brand Steward signoff standards.
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Published Articles</div>
          <div class="text-xl font-bold text-success mt-1">Live Publications</div>
          <p class="text-xs text-muted mt-1">Verified company press notices, CSR bulletins, and brand highlights.</p>
        </div>
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Editorial Queue</div>
          <div class="text-xl font-bold mt-1">Review Staged</div>
          <p class="text-xs text-muted mt-1">Articles pending factual audit, media clearance, and legal disclaimer.</p>
        </div>
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Brand Consistency</div>
          <div class="text-xl font-bold text-success mt-1">35 Brands Monitored</div>
          <p class="text-xs text-muted mt-1">Ensuring unified typography, voice tone, and approved trademark usage.</p>
        </div>
      </div>
      ${pendingTable(
        "Current Editorial Drafting & Release Queue",
        ["Article ID", "Headline & Topic", "Target Brand", "Author", "Editorial Disposition"],
        "Content publication requires explicit Brand Steward and Legal disclaimer clearance."
      )}`
    ),
  ].join("\n");
}

function renderCms002(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "cms-editor-workbench",
      "Multi-Brand Copy Review & Fact Verification Workbench",
      html`<div class="card mb-3">
        <p>Review and stage corporate disclosures, programme showcases, and executive statements across all digital touchpoints.</p>
      </div>
      ${pendingTable(
        "Staged Digital Copy Revisions",
        ["Copy Reference", "Brand Scope", "Claimed Operational Status", "Fact Verification Check", "Action"],
        "Drafts claiming unverified broadcasting or service capabilities are automatically rejected."
      )}`
    ),
    sourceNotConnected(screen.sourceOffice || "CMS source not connected in this environment."),
  ].join("\n");
}

function renderCmsGeneric(screen: IAScreen, ctx: IAGatedPageContext): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      `cms-${screen.id.toLowerCase()}`,
      screen.screenName,
      html`<div class="card p-4 mb-3">
        <div class="text-sm font-semibold text-muted mb-1">Journey: J18 · Brand Editorial & CMS Publishing</div>
        <p class="text-sm">Managing editorial entity <code>${screen.id}</code> under <strong>${screen.gate}</strong> gate constraints for user <code>${ctx.user.email}</code>.</p>
      </div>
      ${pendingTable(
        `${screen.screenName} Publishing Records`,
        ["Entry ID", "Title / Media Asset", "Brand Remit", "Publication State", "Editor Signoff"],
        "Enforcing Group Master R1.3 branding truth and verified corporate disclosure rules."
      )}`
    ),
  ].join("\n");
}

export function renderCmsBody(screen: IAScreen, ctx: IAGatedPageContext): string | undefined {
  if (!screen.id.startsWith("CMS-")) return undefined;
  switch (screen.id) {
    case "CMS-001":
      return renderCms001(screen, ctx);
    case "CMS-002":
      return renderCms002(screen);
    default:
      return renderCmsGeneric(screen, ctx);
  }
}
