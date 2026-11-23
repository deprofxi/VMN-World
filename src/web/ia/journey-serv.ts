/**
 * VMN World IA R1.1 — SERV journey (J04): capability, studio, academy and
 * programme discovery.
 *
 * All 16 routed rows are public (W0). The directory and profile pages are
 * rendered from the registry's own component lists (plan Phase 3). A profile
 * describes the capability the inventory defines; programme and showcase
 * records are not connected in this environment, so those directories render
 * their truthful empty state rather than a plausible list.
 *
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 */

import { escapeHtml } from "../components/index.js";
import { getIAScreen } from "./index.js";
import { iaList } from "./render.js";
import type { IAScreen } from "./types.js";

/** The routed profile rows SERV-002..012, in inventory order. */
const PROFILE_IDS: readonly string[] = [
  "SERV-002",
  "SERV-003",
  "SERV-004",
  "SERV-005",
  "SERV-006",
  "SERV-007",
  "SERV-008",
  "SERV-009",
  "SERV-010",
  "SERV-011",
  "SERV-012",
];

function profileLink(screenId: string): string {
  const screen = getIAScreen(screenId);
  if (!screen) return "";
  return `
    <li class="card p-4 vmn-interactive-row rounded bg-surface border border-muted/20 s-OZWycwwkyb">
      <div class="flex items-center justify-between mb-2">
        <a href="${escapeHtml(screen.route)}" class="font-bold text-base text-slate-100 hover:text-primary">
          ${escapeHtml(screen.screenName)}
        </a>
        <span class="vmn-badge badge-outline text-xs">${escapeHtml(screen.id)}</span>
      </div>
      <p class="text-sm text-muted m-0">${escapeHtml(screen.primaryAction)}</p>
    </li>`.trim();
}

/* -------------------------------------------------------------------------
 * SERV-001 — /capabilities directory
 * ---------------------------------------------------------------------- */

export function renderCapabilitiesDirectoryBody(): string {
  const directory = getIAScreen("SERV-001");
  const profiles = PROFILE_IDS.map(profileLink).join("\n");
  return `
  <article class="container">
    <header class="mb-6">
      <span class="vmn-badge badge-live mb-2">Enterprise Capabilities Index</span>
      <h1 class="text-2xl font-bold mb-2">${escapeHtml(directory?.screenName ?? "Capabilities directory")}</h1>
      <p class="text-muted text-sm">${escapeHtml(directory?.primaryAction ?? "")}</p>
    </header>
    <ul class="list-unstyled grid-2 gap-4 mb-6">${profiles}</ul>
    <section class="card p-4 mb-4 rounded bg-surface border border-muted/20">
      <h2 class="text-lg font-bold mb-3">Programmes and showcases</h2>
      <div class="flex flex-wrap gap-4">
        <a class="btn btn-outline btn-sm" href="/programmes">Programmes and training directory &rarr;</a>
        <a class="btn btn-outline btn-sm" href="/capabilities/showcases-and-case-studies-directory">Showcases and case studies directory &rarr;</a>
      </div>
    </section>
  </article>`.trim();
}

/* -------------------------------------------------------------------------
 * SERV-002..012 — one shared capability profile template
 * ---------------------------------------------------------------------- */

export function renderCapabilityProfileBody(screen: IAScreen): string {
  const components = iaList(screen.coreUi);
  const componentRows = components.map((component) => `<li>${escapeHtml(component)}</li>`).join("");
  const siblingLinks = PROFILE_IDS.filter((id) => id !== screen.id)
    .map((id) => {
      const sibling = getIAScreen(id);
      return sibling ? `<a href="${escapeHtml(sibling.route)}">${escapeHtml(sibling.screenName)}</a>` : "";
    })
    .filter((link) => link.length > 0)
    .join(" · ");

  return `
  <article class="container">
    <nav aria-label="Breadcrumb">
      <a href="/capabilities">Capabilities directory</a> / <span aria-current="page">${escapeHtml(screen.screenName)}</span>
    </nav>
    <header>
      <h1>${escapeHtml(screen.screenName)}</h1>
      <p>${escapeHtml(screen.primaryAction)}</p>
    </header>
    <div class="provenance-notice" role="note">
      <strong>Source not connected.</strong>
      This profile is the inventory's definition of the capability. Operating detail — schedules,
      capacities, fees, open programmes — is shown only when a verified source record supplies it;
      none is connected in this environment, so none is claimed.
    </div>
    <section class="card mb-4">
      <h2>What this capability is</h2>
      <p>${escapeHtml(screen.primaryAction)}</p>
      <p><strong>Source office:</strong> ${escapeHtml(screen.sourceOffice)}</p>
      <p><strong>Data classification:</strong> ${escapeHtml(screen.dataClass)}</p>
    </section>
    <section class="card mb-4">
      <h2>Recorded capability components</h2>
      <p class="text-muted">The inventory's own component list for this profile:</p>
      <ul>${componentRows}</ul>
    </section>
    <section class="card mb-4">
      <h2>Take the next step</h2>
      <p>Enquiries record a request; they do not commit either side.</p>
      <a class="btn btn-primary" href="/work-with-vmn">Work with VMN</a>
      <a class="btn btn-outline" href="/contact">Contact</a>
    </section>
    <section class="card mb-4">
      <h2>Other capability profiles</h2>
      <p>${siblingLinks}</p>
    </section>
  </article>`.trim();
}

/* -------------------------------------------------------------------------
 * SERV-013 — /programmes directory; SERV-015 — showcases directory
 * ---------------------------------------------------------------------- */

/** Truthful empty directory: the source that would list entries is not connected. */
function renderEmptyDirectory(screen: IAScreen, detailHref: string, detailLabel: string): string {
  return `
  <article class="container">
    <nav aria-label="Breadcrumb">
      <a href="/capabilities">Capabilities directory</a> / <span aria-current="page">${escapeHtml(screen.screenName)}</span>
    </nav>
    <header>
      <h1>${escapeHtml(screen.screenName)}</h1>
      <p>${escapeHtml(screen.primaryAction)}</p>
    </header>
    <div class="provenance-notice" role="note">
      <strong>No entries published.</strong>
      No verified source record lists entries here yet. An empty directory is a state, not a count
      of zero: nothing is claimed about how many entries exist.
    </div>
    <section class="card mb-4">
      <h2>Where to go instead</h2>
      <p>${escapeHtml(screen.recoveryRoute)}</p>
      <a class="btn btn-primary" href="${escapeHtml(detailHref)}">${escapeHtml(detailLabel)}</a>
      <a class="btn btn-outline" href="/contact">Contact</a>
    </section>
  </article>`.trim();
}

/** Entry point used by the public-body aggregator. */
export function renderServBody(screen: IAScreen): string | undefined {
  switch (screen.id) {
    case "SERV-001":
      return renderCapabilitiesDirectoryBody();
    case "SERV-002":
    case "SERV-003":
    case "SERV-004":
    case "SERV-005":
    case "SERV-006":
    case "SERV-007":
    case "SERV-008":
    case "SERV-009":
    case "SERV-010":
    case "SERV-011":
    case "SERV-012":
      return renderCapabilityProfileBody(screen);
    case "SERV-013":
      return renderEmptyDirectory(
        screen,
        "/capabilities/afca-profile",
        "AFCA profile"
      );
    case "SERV-015":
      return renderEmptyDirectory(
        screen,
        "/capabilities/one-studios-profile",
        "ONE Studios profile"
      );
    default:
      return undefined;
  }
}
