/**
 * Enterprise Counterparty Portals Gateway (/portal)
 *
 * Central access gateway for VMN Group counterparties:
 * - Commercial Clients (Advertisers, Brands, Agencies)
 * - Virtual Talent Management (Cast, Voice, Motion Talent)
 * - Distribution Partners (Carriers, Syndicates, Affiliates)
 * - Creators & Rightsholders (Producers, Writers, IP Owners)
 * - Procurement Vendors (Studio Hardware, Facilities, Logistics)
 */

import { escapeHtml } from "../components/escape.js";
import { renderIcon } from "../components/icons.js";

export interface PortalGatewayItem {
  id: string;
  name: string;
  badge: string;
  badgeClass: string;
  targetRole: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  features: string[];
}

export const ENTERPRISE_PORTALS: readonly PortalGatewayItem[] = [
  {
    id: "client",
    name: "Client Commercial Portal",
    badge: "Commercial Proof",
    badgeClass: "badge-ready",
    targetRole: "Media Buyers, Brands, Agencies",
    description: "Real-time verification of broadcast flighting, Proof of Performance (PoP) certificates, spot reconciliation, and commercial contract execution.",
    primaryHref: "/portal/client/organisations/default-org/projects",
    primaryLabel: "Open Client Portfolio",
    secondaryHref: "/contact",
    secondaryLabel: "Commercial Inquiry",
    features: [
      "Proof of Performance (PoP) audit log verification",
      "Broadcast schedule and spot transmission logs",
      "Contract and invoice reconciliation",
      "Direct dispute and confirmation tickets",
    ],
  },
  {
    id: "vtm",
    name: "Virtual Talent Management (VTM)",
    badge: "Talent Roster",
    badgeClass: "badge-info",
    targetRole: "Talent, Representation, Producers",
    description: "Automated casting marketplace, 85/15 economic splits, verified digital contracts, milestone deliverables, and transparent royalty ledgers.",
    primaryHref: "/portal/vtm/marketplace",
    primaryLabel: "Talent Marketplace",
    secondaryHref: "/vtm/terms",
    secondaryLabel: "Terms & Buyout Multipliers",
    features: [
      "Dynamic rate cards and casting opportunity matching",
      "Deterministic 85/15 escrow and compensation splits",
      "Cryptographic terms review and milestone sign-off",
      "Deployment readiness and payment tracking",
    ],
  },
  {
    id: "partner",
    name: "Partner Ecosystem Portal",
    badge: "Distribution",
    badgeClass: "badge-neutral",
    targetRole: "Affiliates, Syndication, Carriers",
    description: "Multichannel distribution performance, regional transmission feeds, syndication compliance, and joint venture settlement reporting.",
    primaryHref: "/portal/partner",
    primaryLabel: "Partner Workspace",
    secondaryHref: "/contact",
    secondaryLabel: "Partner Inquiries",
    features: [
      "Linear transmission carrier feed statuses",
      "Syndicated programming clearances",
      "Co-production performance tracking",
      "Governed counterparty tenant boundary",
    ],
  },
  {
    id: "creator",
    name: "Creator & Rights Settlement Portal",
    badge: "Settlements",
    badgeClass: "badge-warning",
    targetRole: "Creators, Writers, Rightsholders",
    description: "Comprehensive royalty accounting, intellectual property metadata, secondary window clearances, and scheduled disbursement records.",
    primaryHref: "/portal/creator",
    primaryLabel: "Creator Settlements",
    secondaryHref: "/about",
    secondaryLabel: "Rights Framework",
    features: [
      "Secondary carriage and syndication royalties",
      "Immutable rights registry integration",
      "Beneficiary payout batch tracking",
      "Audited disbursement proof archive",
    ],
  },
  {
    id: "vendor",
    name: "Vendor Procurement Portal",
    badge: "Procurement",
    badgeClass: "badge-neutral",
    targetRole: "Suppliers, Facilities, Technical Vendors",
    description: "Enterprise purchase orders, technical facility agreements, logistics tracking, and verified two-way remittance matching.",
    primaryHref: "/portal/vendor",
    primaryLabel: "Procurement Workspace",
    secondaryHref: "/contact",
    secondaryLabel: "Vendor Onboarding",
    features: [
      "Governed Purchase Order (PO) matching",
      "Service milestone verification before payment",
      "Supplier tax and compliance validation",
      "Canonical finance ledger settlement",
    ],
  },
];

export function renderPortalGatewayHtml(): string {
  const portalCards = ENTERPRISE_PORTALS.map((portal) => {
    const featureList = portal.features
      .map((f) => `<li class="text-sm text-slate-300 flex items-center gap-2"><span class="text-emerald-400 shrink-0">${renderIcon("check", { size: 16 })}</span> ${escapeHtml(f)}</li>`)
      .join("\n");

    const secondaryButton = portal.secondaryHref
      ? `<a href="${escapeHtml(portal.secondaryHref)}" class="btn btn-outline text-sm">${escapeHtml(portal.secondaryLabel || "Learn More")}</a>`
      : "";

    return `
      <section class="card mb-4 flex flex-col justify-between" id="portal-${escapeHtml(portal.id)}" aria-labelledby="heading-${escapeHtml(portal.id)}">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="vmn-badge ${escapeHtml(portal.badgeClass)}">${escapeHtml(portal.badge)}</span>
            <span class="text-xs text-slate-400 font-mono">${escapeHtml(portal.targetRole)}</span>
          </div>
          <h2 id="heading-${escapeHtml(portal.id)}" class="text-xl font-bold mb-2 text-white">${escapeHtml(portal.name)}</h2>
          <p class="text-slate-300 mb-4 leading-relaxed">${escapeHtml(portal.description)}</p>
          <ul class="list-unstyled space-y-2 mb-6">
            ${featureList}
          </ul>
        </div>
        <div class="pt-4 border-t border-slate-700/50 flex flex-wrap items-center gap-3">
          <a href="${escapeHtml(portal.primaryHref)}" class="btn btn-primary">${escapeHtml(portal.primaryLabel)} →</a>
          ${secondaryButton}
        </div>
      </section>
    `.trim();
  }).join("\n");

  return `
    <article class="container py-8 max-w-6xl mx-auto px-4">
      <header class="mb-8">
        <div class="flex items-center gap-2 mb-3">
          <span class="vmn-badge badge-ready">Enterprise Infrastructure</span>
          <span class="text-xs text-slate-400 font-mono">Counterparty Gateways</span>
        </div>
        <h1 class="text-3xl font-extrabold text-white tracking-tight mb-3">
          Enterprise Counterparty Portals
        </h1>
        <p class="text-slate-300 text-lg max-w-3xl leading-relaxed">
          Dedicated, governed operational gateways for commercial advertisers, creative talent, distribution partners, rightsholders, and procurement vendors. Every portal operates under tenant-scoped authorization and cryptographic evidence tracking.
        </p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        ${portalCards}
      </div>

      <div class="card bg-slate-900/60 border border-slate-700 p-6 rounded-lg text-sm text-slate-400">
        <h3 class="text-base font-semibold text-white mb-2">Security &amp; Counterparty Isolation Notice</h3>
        <p class="leading-relaxed mb-2">
          Portals enforce strict tenant boundary separation. Sessions access only the commercial contracts, talent agreements, and remittance records belonging to their verified organisation or beneficiary identity.
        </p>
        <p class="leading-relaxed">
          Need access credentials or assistance with counterparty onboarding? Contact our enterprise integration team via the <a href="/contact" class="text-emerald-400 underline hover:text-emerald-300">Commercial Intake Channel</a>.
        </p>
      </div>
    </article>
  `.trim();
}
