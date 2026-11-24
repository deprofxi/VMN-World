/**
 * The site's destinations, declared once.
 *
 * Two pieces of chrome need the same list: the header navigation (rendered into
 * every page's HTML, because it must work without scripting) and the universal
 * command palette (built client-side, because it filters and groups on the fly).
 * Until this module existed the palette carried its own hand-written copy of 22
 * destinations, and it had already drifted: it still sent visitors to `/channels`
 * and `/hub`, which the legacy-route retirement now permanently redirects (301)
 * to `/media-and-audience-overview` and `/creative-economy-hub-overview`.
 *
 * The nav is rendered from `PRIMARY_NAV`; the palette's list is compiled into
 * `/assets/app.js` from `SITE_DESTINATIONS_JSON`, which is built from the same
 * entries plus the prototype viewer's own catalogs. One registry, two consumers,
 * no second hand-written list and no additional bytes on any page.
 *
 * Not to be confused with `src/core/federation/destinations.ts`, which models
 * Azeebo+ federation targets — a different domain that shares the word.
 */

import { PROTOTYPE_SCENARIO_CATALOG, PROTOTYPE_SCREEN_CATALOG } from "./prototypes.js";

export interface NavEntry {
  readonly href: string;
  readonly label: string;
  /** Extra search terms; the palette indexes them, the header nav does not render them. */
  readonly hint: string;
}

/**
 * The one primary navigation list. The header nav, the mobile drawer and the
 * sticky action bar are all rendered or cloned from it (DEBT-011 burn-down: the
 * duplicated chrome cost ~1 KB of every public page).
 *
 * Active state: `/` matches exactly (otherwise every page would light it up),
 * every other entry matches its own prefix.
 */
export const PRIMARY_NAV: readonly NavEntry[] = [
  { href: "/", label: "Overview", hint: "Enterprise proposition" },
  { href: "/media-and-audience-overview", label: "Channels", hint: "Nigezie Xtreme, Orisun, Isi Mbido" },
  { href: "/creative-economy-hub-overview", label: "Hub", hint: "Talent, production, academy" },
  { href: "/workspace", label: "Workspaces", hint: "Broadcast & hub operations" },
  { href: "/broadcast/screens", label: "Broadcast Consoles", hint: "Operational screens catalog" },
  { href: "/portal", label: "Portals", hint: "Counterparty & client gateways" },
  { href: "/azeebo/gateway", label: "Azeebo+", hint: "Federated streaming gateway" },
];

export const COMMAND_CATEGORIES = {
  primary: "Primary Surfaces",
  prototypes: "R1.1 Critical Prototypes",
  scenarios: "Simulated Operational Scenarios",
} as const;

/**
 * The order the palette renders its groups in — the declaration order above,
 * derived rather than restated, so there is no second list to keep in step.
 * `client-bundle.ts` compiles this into `/assets/app.js` beside the items.
 */
export const COMMAND_CATEGORY_ORDER: readonly string[] = Object.values(COMMAND_CATEGORIES);

/**
 * Position of a destination's category in the rendered group order.
 *
 * Throws for a category the registry has not declared. Such an entry has no
 * position to render at, so it could only ever appear under a heading the
 * registry does not know — ungrouped, unordered, and invisible to the palette's
 * own order. The throw happens when this module is evaluated, which is every page
 * render and every build, so it cannot reach a visitor.
 */
function categoryRank(category: string): number {
  const rank = COMMAND_CATEGORY_ORDER.indexOf(category);
  if (rank === -1) {
    throw new Error(
      `Site destination category "${category}" is not declared in COMMAND_CATEGORIES: it has no group to render under`
    );
  }
  return rank;
}

/** One command-palette entry. `url` is the field the palette renders and navigates to. */
export interface SiteDestination {
  readonly category: string;
  readonly title: string;
  readonly url: string;
  readonly hint: string;
}

/**
 * Real, served routes that matter to an operator but are deliberately not in the
 * header nav (it stays nine entries). Deduplicated against the nav below, so
 * promoting one of these into `PRIMARY_NAV` later cannot list it twice.
 */
const EXTRA_DESTINATIONS: readonly SiteDestination[] = [
  {
    category: COMMAND_CATEGORIES.primary,
    title: "Prototypes",
    url: "/prototypes",
    hint: "R1.1 screens & scenarios",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "API Docs",
    url: "/docs",
    hint: "OpenAPI specification",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "Styleguide",
    url: "/styleguide",
    hint: "Canonical R1.1 tokens",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "Broadcast Executive Dashboard",
    url: "/broadcast/dashboard",
    hint: "MCR operations",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "MCR Playout Supervisor",
    url: "/workspace/mcr",
    hint: "Playout automation, SCTE-35, multiviewer",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "Commercial Traffic Grid",
    url: "/workspace/traffic",
    hint: "Ad insertion, 15m brand separation, make-goods",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "7-Pillar Revenue Ledger",
    url: "/workspace/finance",
    hint: "Double-entry accounting, balanced ledger",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "Talent Payouts & WHT Desk",
    url: "/workspace/payouts",
    hint: "Statutory 10% Nigerian tax, dual authorization",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "VCF Film Content Fund",
    url: "/workspace/vcf",
    hint: "Pitch scoring, production slate milestones",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "ONE Studios Production Desk",
    url: "/workspace/onestudios",
    hint: "Soundstages, daily call sheets, equipment locker",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "VTM Talent Deal Desk",
    url: "/workspace/vtm",
    hint: "Verified talent marketplace, contracts",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "Fusion Events Scanner",
    url: "/workspace/events",
    hint: "Live gate ticketing, venue capacity",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "Agentic OS Intelligence Console",
    url: "/workspace/aos",
    hint: "Law 13 consequential actions, AI kill switch",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "AFCA Creative Academy Desk",
    url: "/workspace/afca",
    hint: "Student curriculum, faculty grading rubric",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "Commercial Deals Desk",
    url: "/workspace/commercial/deals",
    hint: "Pipeline KPIs, Deal CRUD, Stage advance, Proof of Air",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "Traffic Clash Resolver Wizard",
    url: "/workspace/commercial/traffic-wizard",
    hint: "15-minute competitor separation, ad pod conflict solver",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "Broadcast Rights Clearinghouse",
    url: "/broadcast/rights",
    hint: "IP rights registry, CA-32 attestation, territorial clearance",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "Episode Masters & Schedule Days",
    url: "/broadcast/episodes",
    hint: "Programme catalog, DAM media asset linkage, 48h schedule lock",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "SCTE-35 DPI Playout Console",
    url: "/broadcast/scte35",
    hint: "Live UDP splice cue generator (Port 1234), headend controller",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "As-Run Log Reconciler Wizard",
    url: "/broadcast/asrun/reconcile",
    hint: "Transmission log ingestion, short-air detection, make-goods",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "General Ledger & Balanced Postings",
    url: "/workspace/finance/ledger",
    hint: "Double-entry accounting, balanced journals, Chart of Accounts",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "Talent Payouts & Nigerian WHT",
    url: "/workspace/finance/payouts",
    hint: "Dual-authorization disbursements, 10% statutory tax withholding",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "Enterprise User Identity & RBAC",
    url: "/workspace/admin/users",
    hint: "User provisioning, 28 canonical roles matrix, session management",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "Cryptographic Audit Trail",
    url: "/workspace/admin/audit",
    hint: "HMAC-SHA-256 hash chains, forensic mutations, verify API",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "Enterprise Risk & GRC Registers",
    url: "/workspace/governance/registers",
    hint: "Risk heatmap, Sev-1 incident register, NDPR DSAR queue",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "Client & Advertiser Portal",
    url: "/portal/client",
    hint: "Campaign booking, broadcast delivery tracking, proof certificates",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "VTM Talent Marketplace",
    url: "/portal/vtm",
    hint: "Casting briefs, verified rate cards, buyout tier agreements",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "VTM Escrow Release Wizard",
    url: "/portal/vtm/release-wizard",
    hint: "Deliverable signoff, 85/15 economic split dual-authorization",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "AFCA Coursework Submissions",
    url: "/workspace/afca/assignments",
    hint: "Film and cinema portfolio upload, student coursework",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "AFCA Faculty Grading Rubric",
    url: "/workspace/afca/grading",
    hint: "Faculty competency scoring, structured feedback rubric",
  },
  {
    category: COMMAND_CATEGORIES.primary,
    title: "Feature Flags & Releases",
    url: "/admin/feature-flags",
    hint: "Enterprise release flags, feature toggle overrides",
  },
];

/** Query values are encoded here, so no destination URL is hand-assembled. */
function prototypeDestinationUrl(params: { screen?: string; scenario?: string }): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, value);
  }
  return `/prototypes?${query.toString()}`;
}

/**
 * One contiguous run per category, in declared order.
 *
 * The palette renders a heading whenever the category changes between
 * consecutive entries, so a list that interleaved categories would print the
 * same heading twice and split its group. Grouping here means the registry
 * cannot hand the palette a list it would mis-render, whatever order the sources
 * below are written in.
 */
export function groupByCategory(destinations: readonly SiteDestination[]): SiteDestination[] {
  const buckets: SiteDestination[][] = COMMAND_CATEGORY_ORDER.map(() => []);
  for (const destination of destinations) buckets[categoryRank(destination.category)].push(destination);
  return buckets.flat();
}

/**
 * Every destination the command palette lists, grouped by the categories above:
 * the nav's entries first (so the palette's "Primary Surfaces" group is the nav,
 * in nav order), then the extra routes, the prototype screens and the scenarios
 * from the viewer's own catalogs — each sorted into its category's run, in the
 * order they are declared here.
 */
export const SITE_DESTINATIONS: readonly SiteDestination[] = groupByCategory([
  ...PRIMARY_NAV.map((entry) => ({
    category: COMMAND_CATEGORIES.primary,
    title: entry.label,
    url: entry.href,
    hint: entry.hint,
  })),
  ...EXTRA_DESTINATIONS.filter(
    (destination) => !PRIMARY_NAV.some((entry) => entry.href === destination.url)
  ),
  ...PROTOTYPE_SCREEN_CATALOG.map((screen, index) => ({
    category: COMMAND_CATEGORIES.prototypes,
    title: `${screen.code}: ${screen.name}`,
    url: prototypeDestinationUrl({ screen: screen.id }),
    hint: `First-Release Screen ${index + 1}`,
  })),
  ...PROTOTYPE_SCENARIO_CATALOG.map((scenario) => ({
    category: COMMAND_CATEGORIES.scenarios,
    title: `Scenario: ${scenario.label}`,
    url: prototypeDestinationUrl({ scenario: scenario.id }),
    hint: scenario.desc,
  })),
]);

/**
 * The registry as the palette consumes it. `client-bundle.ts` interpolates this
 * into `/assets/app.js` at build time, so the palette cannot hold a list that the
 * nav does not.
 */
export const SITE_DESTINATIONS_JSON = JSON.stringify(SITE_DESTINATIONS);

/**
 * The group order as the palette consumes it. Compiled into the same asset, so
 * the headings a visitor sees are ordered by the registry's declaration order and
 * not by whatever order the sources happened to be concatenated in.
 */
export const COMMAND_CATEGORY_ORDER_JSON = JSON.stringify(COMMAND_CATEGORY_ORDER);
