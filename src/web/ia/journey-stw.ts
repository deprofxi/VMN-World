/**
 * VMN World IA R1.1 — STW journey (J03) public surfaces.
 *
 * The Azeebo+ gateway (STW-008) is a referral, not an embedded player: the
 * federation authority requires adapters/contracts and configuration, never
 * invented endpoints. The destination is offered only when the deployment has
 * configured one; otherwise the unverified-destination state (STW-011) renders
 * truthfully.
 *
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 *           CLAUDE.md <azeebo> (federated, not embedded; configuration only)
 */

import { escapeHtml } from "../components/index.js";
import { getIAScreen } from "./index.js";
import type { IAScreen } from "./types.js";

/** The four routed universe profiles (STW-002..005). */
const UNIVERSE_IDS: readonly string[] = ["STW-002", "STW-003", "STW-004", "STW-005"];

/**
 * The configured Azeebo+ universal destination, if the deployment supplies
 * one. No default URL exists: an invented endpoint would be a fabricated
 * production address.
 */
export function configuredAzeeboUniversalUrl(): string | null {
  const raw = process.env.AZEEBO_PLUS_UNIVERSAL_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------
 * STW-001 — /storyworlds landing
 * ---------------------------------------------------------------------- */

export function renderStoryworldsLandingBody(): string {
  const screen = getIAScreen("STW-001");
  const universes = UNIVERSE_IDS.map((id) => {
    const universe = getIAScreen(id);
    if (!universe) return "";
    return `
      <li class="card mb-2">
        <a href="${escapeHtml(universe.route)}"><strong>${escapeHtml(universe.screenName)}</strong></a>
        <p class="text-muted">${escapeHtml(universe.primaryAction)}</p>
      </li>`.trim();
  }).join("\n");

  return `
  <article class="container">
    <header>
      <h1>${escapeHtml(screen?.screenName ?? "Original Storyworlds")}</h1>
      <p>${escapeHtml(screen?.primaryAction ?? "")}</p>
    </header>
    <ul class="list-unstyled">${universes}</ul>
    <section class="card mb-4">
      <h2>Watching a title</h2>
      <p>
        Title detail pages describe a title's record and its editions. What they do not do is play
        anything: viewing runs through a verified destination, and an unverified route is refused
        rather than guessed.
      </p>
      <a class="btn btn-outline" href="/azeebo-plus">Azeebo+ information gateway</a>
    </section>
  </article>`.trim();
}

/* -------------------------------------------------------------------------
 * STW-008 — /azeebo-plus information gateway (federated referral)
 * ---------------------------------------------------------------------- */

export function renderAzeeboPlusGatewayBody(): string {
  const screen = getIAScreen("STW-008");
  const unverified = getIAScreen("STW-011");
  const destination = configuredAzeeboUniversalUrl();

  if (!destination) {
    // STW-011: the route is unverified in this environment, so it is stated,
    // not guessed. No destination URL is invented to fill the gap.
    return `
  <article class="container">
    <header>
      <div class="flex flex-wrap gap-2 items-center mb-2">
        <span class="status-chip badge-warning">Route not verified</span>
        ${unverified ? `<span class="status-chip badge-provisional">${escapeHtml(unverified.id)}</span>` : ""}
      </div>
      <h1>${escapeHtml(screen?.screenName ?? "Azeebo+ information gateway")}</h1>
      <p>${escapeHtml(screen?.primaryAction ?? "")}</p>
    </header>
    <div class="provenance-notice" role="note">
      <strong>No verified destination is configured.</strong>
      Azeebo+ is a federated service: this site refers to it through a configured, verified
      destination and never embeds or proxies it. This environment has no verified destination
      configured, so no referral link is offered — offering an unverified one is exactly the state
      the inventory refuses.
    </div>
    <section class="card mb-4">
      <h2>What Azeebo+ is, as far as this page may state it</h2>
      <p>
        Azeebo+ is the federated audience destination for VMN storyworld content. Access, catalogue
        and account handling happen on the federated service itself, under its own terms, once a
        verified route exists.
      </p>
    </section>
    <section class="card mb-4">
      <h2>Recovery</h2>
      <p>${escapeHtml(unverified?.recoveryRoute ?? screen?.recoveryRoute ?? "")}</p>
      <a class="btn btn-outline" href="/storyworlds">Back to storyworlds</a>
      <a class="btn btn-outline" href="/support">Support</a>
    </section>
  </article>`.trim();
  }

  // STW-010: the external referral is an explicit confirmation step, not a
  // silent redirect. The link is presented; the visitor chooses to leave.
  return `
  <article class="container">
    <header>
      <div class="flex flex-wrap gap-2 items-center mb-2">
        <span class="status-chip badge-info">Verified destination configured</span>
        <span class="status-chip badge-provisional">STW-010 · external referral confirmation</span>
      </div>
      <h1>${escapeHtml(screen?.screenName ?? "Azeebo+ information gateway")}</h1>
      <p>${escapeHtml(screen?.primaryAction ?? "")}</p>
    </header>
    <section class="card mb-4">
      <h2>You are leaving this site</h2>
      <p>
        The link below opens the federated Azeebo+ service in a new tab. It is not operated by VMNL:
        accounts, catalogue and playback there run under Azeebo's own terms. Nothing from your visit
        here is carried over.
      </p>
      <p><a class="btn btn-primary" href="${escapeHtml(destination)}" rel="noopener noreferrer" target="_blank">Continue to the configured Azeebo+ destination</a></p>
      <p class="text-muted">Destination as configured for this deployment. It can change; this page always shows the currently configured one.</p>
    </section>
    <a class="btn btn-outline" href="/storyworlds">Back to storyworlds</a>
  </article>`.trim();
}

/** Entry point used by the public-body aggregator. */
export function renderStwBody(screen: IAScreen): string | undefined {
  switch (screen.id) {
    case "STW-001":
      return renderStoryworldsLandingBody();
    case "STW-008":
      return renderAzeeboPlusGatewayBody();
    default:
      return undefined;
  }
}
