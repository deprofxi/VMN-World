/**
 * VMN World IA R1.1 — PUB journey (public company discovery).
 *
 * 22 records: 18 routed pages and 4 hosted states. Every page keeps the
 * inventory's own wording for its title, components and adverse states, and
 * shows no operational value that no source record supplied.
 *
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 */

import { escapeHtml } from "../components/index.js";
import { PUBLIC_CHANNELS } from "../public/channels.js";
import { renderChannelDetailPageHtml } from "../public/surface-a.js";
import { resolveChannelCode } from "../../modules/broadcast/channels/index.js";
import {
  renderAboutPageHtml,
  renderAccessibilityPageHtml,
  renderEnquiryContactHtml,
  renderHelpPageHtml,
  renderPrivacyPageHtml,
} from "../public/pub-screens.js";
import { renderHomePageHtml, renderHubPageHtml } from "../public/dashboard.js";
import { getIAScreen, IA_JOURNEYS, IA_PUBLIC_PAGES, IA_REGISTRY_SOURCE } from "./index.js";
import type { IAScreen } from "./types.js";
import { renderIAProvenance } from "./render.js";

export interface IAPublicPageContext {
  params: Readonly<Record<string, string>>;
  query: URLSearchParams;
  pathname: string;
  /**
   * Double-submit CSRF token, issued by the route layer only when the request
   * carries a session (public intake forms stay CSRF-free for anonymous
   * visitors, matching the platform's own rule).
   */
  csrfToken?: string;
}

const ENQUIRY_VERTICALS = [
  "COMMERCIAL_ADVERTISING",
  "SPONSORSHIP",
  "PARTNERSHIP",
  "AFCA_LEARNING",
  "TALENT_ACCELERATOR",
  "ONE_STUDIOS",
  "GENERAL_ENQUIRY",
] as const;

function pageHeader(screenId: string, eyebrow: string, lead: string): string {
  const screen = getIAScreen(screenId);
  if (!screen) throw new Error(`[IA-PUB] unknown screen ${screenId}`);
  return `
    <header>
      <span class="vmn-badge badge-info">${escapeHtml(eyebrow)}</span>
      <h1>${escapeHtml(screen.screenName)}</h1>
      <p>${escapeHtml(lead)}</p>
    </header>
  `.trim();
}

function sourceNotConnected(what: string): string {
  return `
    <div class="provenance-notice" role="note">
      <strong>Source not connected.</strong> ${escapeHtml(what)}
    </div>
  `.trim();
}

/* -------------------------------------------------------------------------
 * PUB-003 Ecosystem map
 * ---------------------------------------------------------------------- */
function renderEcosystemBody(): string {
  const layers = [
    {
      title: "The company",
      summary:
        "Virtual Media Network Limited is the corporate entity behind the linear channel profiles, the creative-economy programme areas and the media services described on this site.",
      links: [
        { href: "/about", label: "About VMNL" },
        { href: "/corporate-governance-overview", label: "Governance overview" },
      ],
    },
    {
      title: "The media portfolio",
      summary:
        "Three linear channel profiles — Nigezie Xtreme, Orisun and Isi Mbido — plus federated Azeebo+ service information. Carriage, transmission and catalogue status are not asserted here.",
      // `/channels` is retired to this overview (decision D1); linking the overview
      // once keeps this layer to one destination per layer.
      links: [{ href: "/media-and-audience-overview", label: "Media and audience overview" }],
    },
    {
      title: "The capability network",
      summary:
        "The Creative Economy Hub describes programme areas for learning, talent, production, funding, events and distribution. Accreditation, placements and availability require current confirmation.",
      links: [{ href: "/creative-economy-hub-overview", label: "Creative Economy Hub" }],
    },
    {
      title: "The demand systems",
      summary:
        "Audiences, brands, institutions and partners reach VMNL through the contact centre and the correction route. An enquiry records a request; it does not confirm a placement, contract or right.",
      links: [
        { href: "/contact", label: "Contact centre" },
        { href: "/public-corrections-and-factual-claim-report", label: "Report a factual claim" },
      ],
    },
  ];

  const layerHtml = layers
    .map(
      (layer, index) => `
      <li class="card mb-4">
        <h2>${escapeHtml(`${index + 1}. ${escapeHtml(layer.title)}`)}</h2>
        <p>${escapeHtml(layer.summary)}</p>
        <p>
          ${layer.links
            .map((link) => `<a class="btn btn-outline btn-sm" href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`)
            .join("\n          ")}
        </p>
      </li>
    `.trim()
    )
    .join("\n");

  return `
  <article class="container">
    ${pageHeader(
      "PUB-003",
      "Group structure",
      "Navigate the institution, its capabilities and the boundaries between them without assuming that a described capability is an open offer."
    )}

    <section class="card mb-4">
      <h2>Status legend</h2>
      <dl>
        <dt><span class="status-chip badge-info">Documented</span></dt>
        <dd>The area is described by a published page on this site.</dd>
        <dt><span class="status-chip badge-neutral">Source not connected</span></dt>
        <dd>The inventory defines the screen or data, but no live source supplies a value in this environment.</dd>
        <dt><span class="status-chip badge-provisional">Requires confirmation</span></dt>
        <dd>Carriage, availability, accreditation, rights or commercial terms that must be confirmed against current records.</dd>
      </dl>
    </section>

    <ul>
      ${layerHtml}
    </ul>

    <section class="card mb-4">
      <h2>Nothing on this map is an entitlement</h2>
      <p>
        A listed capability is not an offer of employment, funding, placement, carriage, rights clearance
        or airtime. Each of those requires a separate authorised decision by the accountable human office,
        and several require a written agreement or clearance before anything can happen.
      </p>
    </section>
  </article>
  `.trim();
}

/* -------------------------------------------------------------------------
 * PUB-004 ONE CIRCLE explanation
 * ---------------------------------------------------------------------- */
function renderOneCircleBody(): string {
  const screen = getIAScreen("PUB-004")!;
  return `
  <article class="container">
    ${pageHeader(
      "PUB-004",
      "Working model",
      "ONE CIRCLE is the group's explanation of how contributors take part in the mission. This page states the authority boundaries that apply before any contribution is agreed."
    )}

    ${sourceNotConnected(
      "The three contribution-mode descriptions, the mission journey and the career enquiry route are defined by the inventory but their approved copy is not published to this surface yet. This page therefore does not name or describe the modes."
    )}

    <section class="card mb-4">
      <h2>Three contribution modes — not yet published</h2>
      <p>
        The inventory records three contribution modes for this explanation. Naming them here without the
        approved source wording would create an offer the group has not made, so this page names none of
        them and shows no vacancies, rates or timelines.
      </p>
      <p class="text-muted">
        Responsible office for the published explanation: ${escapeHtml(screen.sourceOffice)}.
      </p>
    </section>

    <section class="card mb-4">
      <h2>Human authority comes first</h2>
      <ul>
        <li>Contributors are engaged through a recorded human decision, not an automated one.</li>
        <li>No commercial talent engagement — and no deployment — without an agreed engagement.</li>
        <li>Students remain learners first; participation is not employment.</li>
        <li>Automated agents may draft, classify and route, but may not engage, deploy or approve.</li>
      </ul>
    </section>

    <section class="card mb-4">
      <h2>Career and contribution enquiries</h2>
      <p>
        If you want to be considered when an approved route opens, send an enquiry and state the kind of
        contribution you are interested in. An enquiry is recorded as a request; it is not an application,
        an offer or a placement.
      </p>
      <p>
        <a class="btn btn-primary" href="/contact?vertical=GENERAL_ENQUIRY">Send a contribution enquiry</a>
        <a class="btn btn-outline" href="/about">About VMNL</a>
      </p>
    </section>
  </article>
  `.trim();
}

/* -------------------------------------------------------------------------
 * PUB-005 Media and audience overview
 * ---------------------------------------------------------------------- */
function renderMediaAudienceBody(): string {
  const channelCards = PUBLIC_CHANNELS.map(
    (channel) => `
      <li class="card mb-4" id="channel-${escapeHtml(channel.code.toLowerCase())}">
        <div class="flex flex-wrap gap-2 items-center mb-2">
          <span class="status-chip badge-neutral">${escapeHtml(channel.code)}</span>
          <span class="status-chip badge-provisional">Carriage unverified</span>
        </div>
        <h2>${escapeHtml(channel.name)}</h2>
        <p><strong>${escapeHtml(channel.tagline)}</strong></p>
        <p>${escapeHtml(channel.genre)} · ${escapeHtml(channel.primaryLanguage)}</p>
        <p class="text-muted">${escapeHtml(channel.targetAudience)}</p>
        <p>
          Programming, transmission format and operating status are not verified here; the profile
          above is the published extent of this channel's public record.
        </p>
        <div class="mt-3">
          <a class="btn btn-outline btn-sm" href="/media-and-audience-overview?channel=${escapeHtml(channel.code)}">Channel Profile & Live Player &rarr;</a>
        </div>
      </li>
    `.trim()
  ).join("\n");

  return `
  <article class="container">
    ${pageHeader(
      "PUB-005",
      "Media portfolio",
      "Choose a media family, or read the audience descriptions that the group publishes. No reach, rating or carriage number is claimed on this page."
    )}

    <ul>
      ${channelCards}
    </ul>

    <section class="card mb-4">
      <div class="flex flex-wrap gap-2 items-center mb-2">
        <span class="status-chip badge-info">Federated</span>
        <span class="status-chip badge-provisional">Availability unverified</span>
      </div>
      <h2>Azeebo+</h2>
      <p>
        Azeebo+ is operated separately from this site. Catalogue, features, availability and audience
        attribution come from Azeebo+ systems and are not verified by VMNL's public pages.
      </p>
      <a class="btn btn-outline" href="/azeebo">Azeebo+ service information</a>
    </section>

    <section class="card mb-4">
      <h2>Audience descriptions</h2>
      <p>
        The audience descriptions shown above are profile statements for each channel, not measured
        audience data. Measured reach, share and demographic delivery require a verified audience source,
        which is not connected to this surface.
      </p>
    </section>
  </article>
  `.trim();
}

/* -------------------------------------------------------------------------
 * PUB-007 / PUB-008 News
 * ---------------------------------------------------------------------- */
function renderNewsBody(): string {
  const screen = getIAScreen("PUB-007")!;
  return `
  <article class="container">
    ${pageHeader(
      "PUB-007",
      "Newsroom",
      "Read verified company announcements, with the source and publication date attached to each one."
    )}

    ${sourceNotConnected(
      "No approved news publication source is connected to this environment, so this page lists no announcements. Placeholder articles, drafts and unapproved statements are not published in their place."
    )}

    <section class="card mb-4">
      <h2>Approved announcements</h2>
      <p>
        The inventory defines approved news cards with a date, a source, category filters and correction
        references. None of those records is available, so the list is empty.
      </p>
      <p class="text-muted">
        Responsible office: ${escapeHtml(screen.sourceOffice)}. Evidence contract:
        ${escapeHtml(screen.evidenceContract)}.
      </p>
      <a class="btn btn-outline" href="/media-press-contact">Media and press contact</a>
      <a class="btn btn-outline" href="/public-corrections-and-factual-claim-report">Report a factual claim</a>
    </section>
  </article>
  `.trim();
}

function renderNewsDetailBody(): string {
  const screen = getIAScreen("PUB-008")!;
  return `
  <article class="container">
    ${pageHeader(
      "PUB-008",
      "Newsroom",
      "Read one published announcement, including its publication date, named source and any correction reference."
    )}

    <section class="card mb-4">
      <h2>No announcement is selected</h2>
      <p>
        This detail view renders a published announcement record. No publication source is connected in
        this environment, so no article body, author, publication date or related brand is shown.
      </p>
      <p class="text-muted">
        Evidence contract: ${escapeHtml(screen.evidenceContract)}.
      </p>
      <a class="btn btn-primary" href="/news">Back to company news</a>
    </section>

    <section class="card mb-4">
      <h2>If an announcement is wrong</h2>
      <p>
        A correction is a recorded review outcome, not an automatic edit. Use the correction route to
        report the statement and the evidence you rely on.
      </p>
      <a class="btn btn-outline" href="/public-corrections-and-factual-claim-report">Report a factual claim</a>
    </section>
  </article>
  `.trim();
}

/* -------------------------------------------------------------------------
 * PUB-009 Media / press contact
 * ---------------------------------------------------------------------- */
function renderMediaPressBody(): string {
  const screen = getIAScreen("PUB-009")!;
  return `
  <article class="container">
    ${pageHeader(
      "PUB-009",
      "Press desk",
      "Send a press enquiry to the media team. Quotes, attributions and deadlines are confirmed by a named human contact."
    )}

    <section class="card mb-4">
      <h2>Press guidelines</h2>
      <ul>
        <li>Attribute statements to the named spokesperson the press desk confirms — not to an unnamed channel.</li>
        <li>Carriage numbers, reach and ratings are not published as verified facts; do not treat this site as a source for them.</li>
        <li>Channel and programme names may be quoted as profiles; programme catalogues require confirmation.</li>
        <li>Images and clips are subject to rights and permission; request them explicitly.</li>
      </ul>
    </section>

    <section class="card mb-4">
      <h2>Verified media contact route</h2>
      <p>
        A standing press mailbox and interview deadline policy have not been confirmed for publication.
        The enquiry form below is the recorded route; response timing is not guaranteed in this environment.
      </p>
      <p class="text-muted">Responsible office: ${escapeHtml(screen.sourceOffice)}.</p>
      <a class="btn btn-primary" href="/contact?vertical=GENERAL_ENQUIRY">Send a press enquiry</a>
      <a class="btn btn-outline" href="/news">Company news</a>
    </section>
  </article>
  `.trim();
}

/* -------------------------------------------------------------------------
 * PUB-010 Corporate governance overview
 * ---------------------------------------------------------------------- */
function renderGovernanceBody(): string {
  const screen = getIAScreen("PUB-010")!;
  return `
  <article class="container">
    ${pageHeader(
      "PUB-010",
      "Governance",
      "Review the institutional information that has been approved for publication, and see clearly what has not."
    )}

    ${sourceNotConnected(
      "No approved institutional disclosure pack is connected to this surface. This page therefore publishes no board composition, no filing status and no policy document."
    )}

    <section class="card mb-4">
      <h2>Company responsibilities</h2>
      <ul>
        <li>Broadcast scheduling and playout are operated under broadcast authority, not by automated agents.</li>
        <li>Content is exploited only when rights clearance permits it.</li>
        <li>Sponsor-funded production requires payment protection, or an expressly approved credit exception.</li>
        <li>Financial reporting distinguishes contract value, invoiced value, cash collected and recognised revenue.</li>
        <li>High-risk personal-data processing requires the privacy review before it starts.</li>
      </ul>
    </section>

    <section class="card mb-4">
      <h2>What is not published here</h2>
      <p>
        Internally approved policy statements, externally reviewed disclosures and filing references are
        withheld until the accountable office approves their publication. Their absence is a state, not an
        error: ${escapeHtml(screen.recoveryRoute)}
      </p>
      <a class="btn btn-outline" href="/about">About VMNL</a>
      <a class="btn btn-outline" href="/terms">Website terms</a>
      <a class="btn btn-outline" href="/accessibility">Accessibility</a>
    </section>
  </article>
  `.trim();
}

/* -------------------------------------------------------------------------
 * PUB-013 Search
 * ---------------------------------------------------------------------- */
function matchesQuery(screen: IAScreen, query: string): boolean {
  const haystack = [
    screen.screenName,
    screen.primaryAction,
    screen.journey,
    screen.coreUi,
    screen.domainObjects,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function renderSearchForm(query: string): string {
  return `
    <form method="GET" action="/search" role="search" class="card mb-4">
      <label for="ia-search-q">Search published pages</label>
      <input class="vmn-input" type="search" id="ia-search-q" name="q" value="${escapeHtml(query)}" placeholder="e.g. governance, channels, contact" autocomplete="off" />
      <button class="btn btn-primary mt-2" type="submit">Search</button>
      <p class="text-muted">Only public pages are searched. No workspace, editorial or personal record is ever included.</p>
    </form>
  `.trim();
}

/** PUB-014: the hosted no-results state, rendered by the search page. */
export function renderPublicSearchNoResults(query: string): string {
  const state = getIAScreen("PUB-014");
  return `
    <section class="card mb-4" role="status" aria-live="polite" aria-labelledby="ia-search-empty">
      <div class="flex flex-wrap gap-2 items-center mb-2">
        <span class="status-chip badge-neutral">No eligible results</span>
        ${state ? `<span class="status-chip badge-provisional">${escapeHtml(state.id)}</span>` : ""}
      </div>
      <h2 id="ia-search-empty">Nothing public matches “${escapeHtml(query)}”</h2>
      <p>
        The search ran over published public pages only. A missing result does not mean the topic is
        unavailable — only that no public page describes it.
      </p>
      <h3>Try instead</h3>
      <ul>
        <li>Shorter, more general words (for example “channels”, “privacy”, “contact”).</li>
        <li><a href="/sitemap">The sitemap</a>, which lists every public page by journey.</li>
        <li><a href="/support">Help and support</a> if you cannot find the route you expected.</li>
      </ul>
      <a class="btn btn-primary" href="/contact?vertical=GENERAL_ENQUIRY">Ask a human</a>
    </section>
  `.trim();
}

function renderSearchBody(query: string): string {
  const trimmed = query.trim().toLowerCase();
  const results =
    trimmed.length === 0
      ? []
      : IA_PUBLIC_PAGES.filter((screen) => matchesQuery(screen, trimmed)).slice(0, 25);

  if (trimmed.length > 0 && results.length === 0) {
    return `
      <article class="container">
        ${pageHeader("PUB-013", "Search", "Find a source-backed public page.")}
        ${renderSearchForm(query)}
        ${renderPublicSearchNoResults(query)}
      </article>
    `.trim();
  }

  const resultsHtml =
    trimmed.length === 0
      ? `<p class="text-muted">Enter a term to search the
      ${escapeHtml(IA_PUBLIC_PAGES.length)} public pages listed in the sitemap.</p>`
      : `
      <p role="status">${escapeHtml(results.length)} public page${results.length === 1 ? "" : "s"} match “${escapeHtml(query)}”.</p>
      <ul>
        ${results
          .map(
            (screen) => `
          <li class="card mb-4">
            <h2><a href="${escapeHtml(screen.route)}">${escapeHtml(screen.screenName)}</a></h2>
            <p>${escapeHtml(screen.primaryAction)}</p>
            <p class="text-muted">${escapeHtml(screen.journey)} · ${escapeHtml(screen.route)}</p>
          </li>`
          )
          .join("")}
      </ul>`;

  return `
    <article class="container">
      ${pageHeader(
        "PUB-013",
        "Search",
        "Search public pages across channels, programmes, admissions, portals, and corporate information."
      )}
      ${renderSearchForm(query)}
      ${resultsHtml}
    </article>
  `.trim();
}

/* -------------------------------------------------------------------------
 * PUB-011 Contact centre + PUB-015 hosted intent selector
 * ---------------------------------------------------------------------- */
export function renderContactIntentSelector(): string {
  const dialog = getIAScreen("PUB-015");
  const intents: ReadonlyArray<{ vertical: string; label: string; description: string }> = [
    { vertical: "COMMERCIAL_ADVERTISING", label: "Advertising", description: "Spots, packages and campaign schedules." },
    { vertical: "SPONSORSHIP", label: "Sponsorship", description: "Programme or channel sponsorship discussion." },
    { vertical: "PARTNERSHIP", label: "Partnership", description: "Institutional and brand partnerships." },
    { vertical: "AFCA_LEARNING", label: "Academy", description: "AFCA Academy and corporate training." },
    { vertical: "TALENT_ACCELERATOR", label: "Talent", description: "Talent Accelerator partner network." },
    { vertical: "ONE_STUDIOS", label: "Studios", description: "Studio facility booking and production." },
    { vertical: "GENERAL_ENQUIRY", label: "General or press", description: "Anything not covered above, including press." },
  ];

  return `
    <section class="card mb-4" aria-labelledby="ia-contact-intent">
      <div class="flex flex-wrap gap-2 items-center mb-2">
        <span class="status-chip badge-info">Hosted interaction</span>
        ${dialog ? `<span class="status-chip badge-provisional">${escapeHtml(dialog.id)}</span>` : ""}
      </div>
      <h2 id="ia-contact-intent">Which team should receive this?</h2>
      <p>
        Choose the enquiry type before you write. The form below is pre-filled with your choice, and the
        same selector opens as a modal from the contact button in the live shell.
      </p>
      <ul>
        ${intents
          .map(
            (intent) => `
        <li>
          <a href="/contact?vertical=${encodeURIComponent(intent.vertical)}#enquiry-form">${escapeHtml(intent.label)}</a>
          — ${escapeHtml(intent.description)}
        </li>`
          )
          .join("")}
      </ul>
      <p class="text-muted">
        The enquiry is stored as a request with a case reference. It does not create a booking, a
        contract, a right or a payment obligation.
      </p>
    </section>
  `.trim();
}

function renderContactBody(query: URLSearchParams): string {
  const requested = escapeHtml(query.get("vertical") ?? "");
  const vertical = (ENQUIRY_VERTICALS as readonly string[]).includes(requested)
    ? requested
    : "GENERAL_ENQUIRY";
  return `
    <div id="enquiry-form">
      ${renderEnquiryContactHtml(escapeHtml(vertical))}
      ${renderContactIntentSelector()}
    </div>
  `.trim();
}

/* -------------------------------------------------------------------------
 * PUB-017 Privacy + PUB-018 cookie preference centre
 * ---------------------------------------------------------------------- */
export function renderCookiePreferenceCentre(): string {
  const dialog = getIAScreen("PUB-018");
  return `
    <section class="card mb-4" aria-labelledby="ia-cookie-centre" id="cookie-preferences">
      <div class="flex flex-wrap gap-2 items-center mb-2">
        <span class="status-chip badge-info">Hosted interaction</span>
        ${dialog ? `<span class="status-chip badge-provisional">${escapeHtml(dialog.id)}</span>` : ""}
      </div>
      <h2 id="ia-cookie-centre">Cookie preference centre</h2>
      ${sourceNotConnected(
        "No consent-storage service is connected, so preferences cannot be saved from this environment. The controls are shown disabled rather than pretending to record a choice."
      )}
      <fieldset>
        <legend>Categories</legend>
        <p>
          <input type="checkbox" id="cookie-necessary" checked disabled />
          <label for="cookie-necessary"><strong>Necessary</strong> — required for sign-in, security and session integrity. Always on.</label>
        </p>
        <p>
          <input type="checkbox" id="cookie-analytics" disabled />
          <label for="cookie-analytics"><strong>Optional analytics</strong> — no analytics provider is configured, so this category is off.</label>
        </p>
        <p>
          <input type="checkbox" id="cookie-marketing" disabled />
          <label for="cookie-marketing"><strong>Optional marketing</strong> — no advertising technology is configured, so this category is off.</label>
        </p>
      </fieldset>
      <p class="text-muted">
        Consent records, withdrawal and retention require an approved privacy notice and a working
        preference store. Until then, only strictly necessary cookies are used.
      </p>
    </section>
  `.trim();
}

function renderPrivacyBody(): string {
  return `
    ${renderPrivacyPageHtml()}
    ${renderCookiePreferenceCentre()}
  `.trim();
}

/* -------------------------------------------------------------------------
 * PUB-019 Website terms
 * ---------------------------------------------------------------------- */
function renderTermsBody(): string {
  const screen = getIAScreen("PUB-019")!;
  return `
  <article class="container">
    ${pageHeader(
      "PUB-019",
      "Legal",
      "Read the conditions that apply to this site before you rely on anything published here."
    )}

    ${sourceNotConnected(
      "A legally reviewed terms revision is not connected to this surface. This page therefore states the publishing limits it can support and makes no warranty, liability or jurisdiction claim."
    )}

    <section class="card mb-4">
      <h2>Publishing limits</h2>
      <ul>
        <li>Pages describe company profiles, programme areas and service information; they are not offers.</li>
        <li>Carriage, availability, accreditation, funding and rights require confirmation against current records.</li>
        <li>Enquiries are recorded requests. A recorded request is not an acceptance.</li>
        <li>Nothing on this site grants a licence to any content, mark or recording.</li>
      </ul>
    </section>

    <section class="card mb-4">
      <h2>External links and federated services</h2>
      <p>
        Azeebo+ and other external destinations are operated separately. Their content, availability and
        terms are theirs, and a link from this site is not an endorsement of a third-party claim.
      </p>
    </section>

    <section class="card mb-4">
      <h2>Corrections</h2>
      <p>
        If a published statement is inaccurate, report it with the statement reference and the evidence
        you rely on. A report starts a review; it does not publish a correction.
      </p>
      <a class="btn btn-outline" href="/public-corrections-and-factual-claim-report">Report a factual claim</a>
      <a class="btn btn-outline" href="/privacy">Privacy and cookies</a>
    </section>

    <p class="text-muted">Responsible office: ${escapeHtml(screen.sourceOffice)}.</p>
  </article>
  `.trim();
}

/* -------------------------------------------------------------------------
 * PUB-020 Sitemap, generated from the registry
 * ---------------------------------------------------------------------- */
function renderSitemapBody(): string {
  const groups = IA_JOURNEYS.map((journey) => ({
    ...journey,
    publicRouted: journey.screens.filter(
      (screen) => screen.gate === "W0" && screen.routeKind === "ROUTED"
    ),
    publicHosted: journey.screens.filter(
      (screen) => screen.gate === "W0" && screen.routeKind !== "ROUTED"
    ),
  }))
    // A journey with no public page is not indexable: listing it would advertise
    // a section the visitor cannot open.
    .filter((journey) => journey.publicRouted.length > 0);

  const hostedTotal = groups.reduce((total, journey) => total + journey.publicHosted.length, 0);

  // DEBT-011: the index is written compactly on purpose. Each entry is one link
  // whose target is the inventory's canonical route, and the hosted states are
  // listed once at the end instead of inside nine per-journey disclosures. The
  // long form cost 30 KB with the shell; this shape keeps every public route and
  // every public hosted state on the page inside the 25 KB budget.
  const groupHtml = groups
    .map(
      (journey) => `<section id="journey-${escapeHtml(journey.code.toLowerCase())}">
<h2>${escapeHtml(journey.code)} · ${escapeHtml(journey.name)} <span class="text-muted">(${escapeHtml(journey.publicRouted.length)})</span></h2>
<ul>${journey.publicRouted
        .map((screen) => `<li><a href="${escapeHtml(screen.route)}">${escapeHtml(screen.screenName)}</a></li>`)
        .join("")}</ul>
</section>`,
    )
    .join("\n");

  const hostedStates = groups.flatMap((journey) => journey.publicHosted);

  return `
  <article class="container">
    ${pageHeader(
      "PUB-020",
      "Index",
      "Discover a specific permitted route. This index is generated from the IA inventory, so it cannot list a page the authority does not define."
    )}
    <p>
      Browse all ${escapeHtml(IA_PUBLIC_PAGES.length)} public pages and ${hostedTotal} public interactive states across Virtual Media Network Limited.
      Each link opens the public destination directly.
    </p>
    <nav aria-label="Public pages by journey">
      ${groupHtml}
    </nav>
    <details>
      <summary>Public hosted states (${escapeHtml(String(hostedTotal))})</summary>
      <ul>${hostedStates
        .map((screen) => `<li>${escapeHtml(screen.screenName)} (${escapeHtml(screen.id)})</li>`)
        .join("")}</ul>
    </details>
    <p><a class="btn btn-outline" href="/search">Search public pages</a></p>
  </article>
  `.trim();
}

/* -------------------------------------------------------------------------
 * PUB-021 Public corrections report
 * ---------------------------------------------------------------------- */
function renderCorrectionsBody(): string {
  const screen = getIAScreen("PUB-021")!;
  return `
  <article class="container">
    ${pageHeader(
      "PUB-021",
      "Corrections",
      "Report an inaccurate public company or partner claim. A report is a claim to investigate, not an automatic correction or public disclosure."
    )}

    <section class="card mb-4">
      <h2>What happens to a report</h2>
      <ol>
        <li>The report is recorded with a case reference and routed to the publishing office.</li>
        <li>A named human reviews the statement against its source record.</li>
        <li>If the statement is wrong, a corrected version and its reason are published; the prior version stays inspectable.</li>
      </ol>
      <p class="text-muted">Responsible office: ${escapeHtml(screen.sourceOffice)}.</p>
    </section>

    <form method="POST" action="/api/v1/enquiries" class="card mb-4" aria-labelledby="ia-corrections-form">
      <h2 id="ia-corrections-form">Correction report</h2>
      <input type="hidden" name="vertical" value="GENERAL_ENQUIRY" />

      <div class="vmn-form-field">
        <label class="vmn-label" for="correction-name">Your name <span class="vmn-required">*</span></label>
        <input class="vmn-input" type="text" id="correction-name" name="fullName" required autocomplete="name" />
      </div>

      <div class="vmn-form-field">
        <label class="vmn-label" for="correction-email">Email address <span class="vmn-required">*</span></label>
        <input class="vmn-input" type="email" id="correction-email" name="email" required autocomplete="email" />
      </div>

      <div class="vmn-form-field">
        <label class="vmn-label" for="correction-org">Organisation</label>
        <input class="vmn-input" type="text" id="correction-org" name="organisationName" autocomplete="organization" />
      </div>

      <div class="vmn-form-field">
        <label class="vmn-label" for="correction-message">
          The statement, its page, and the evidence you rely on <span class="vmn-required">*</span>
        </label>
        <textarea class="vmn-input" id="correction-message" name="message" rows="6" required></textarea>
      </div>

      <div class="vmn-form-field">
        <input type="checkbox" id="correction-consent" name="ndprConsent" value="true" required />
        <label for="correction-consent">
          I understand this report is provided to VMNL for review, that the privacy notice is still under
          review, and that I should not include sensitive personal information.
        </label>
      </div>

      <button class="btn btn-primary" type="submit">Submit correction report</button>
      <p class="text-muted">
        The report does not publish anything. Do not include identity documents or other sensitive
        personal data.
      </p>
    </form>
  </article>
  `.trim();
}

/* -------------------------------------------------------------------------
 * PUB-022 hosted statement revision history
 * ---------------------------------------------------------------------- */
export function renderStatementRevisionHistory(): string {
  const tab = getIAScreen("PUB-022");
  return `
    <details class="card mb-4 vmn-hosted-tray text-xs text-muted" aria-labelledby="ia-statement-history">
      <summary class="flex flex-wrap gap-2 items-center cursor-pointer select-none py-1">
        <span class="status-chip badge-info">Hosted view</span>
        ${tab ? `<span class="status-chip badge-provisional">${escapeHtml(tab.id)}</span>` : ""}
        <span id="ia-statement-history" class="font-bold text-xs text-slate-300">Published statement revision history</span>
      </summary>
      <div class="pt-3 mt-2 border-t border-slate-800">
        ${sourceNotConnected(
          "No corrected statement has been published, so there is no revision history to show. Withdrawn wording is never presented in place of current wording."
        )}
        <p class="text-xs text-muted mt-2">
          When a statement is corrected, this view lists the current wording first, then the publication
          timestamp, the reason for the correction and the prior version label. Only the public-approved
          change summary is disclosed; restricted legal evidence stays private.
        </p>
      </div>
    </details>
  `.trim();
}

/* -------------------------------------------------------------------------
 * Router of public bodies
 * ---------------------------------------------------------------------- */
const BODIES: Readonly<Record<string, (context: IAPublicPageContext) => string>> = {
  "PUB-001": () => renderHomePageHtml(),
  "PUB-002": () => renderAboutPageHtml(),
  "PUB-003": () => renderEcosystemBody(),
  "PUB-004": () => renderOneCircleBody(),
  "PUB-005": (context) => {
    const channelQuery = context?.query?.get("channel") || context?.query?.get("code") || "";
    const resolvedCode = channelQuery ? resolveChannelCode(channelQuery) : undefined;
    if (resolvedCode === "NXTR" || resolvedCode === "ORIS" || resolvedCode === "IMBD") {
      return renderChannelDetailPageHtml(resolvedCode);
    }
    return renderMediaAudienceBody();
  },
  "PUB-006": () => renderHubPageHtml(),
  "PUB-007": () => renderNewsBody(),
  "PUB-008": () => renderNewsDetailBody(),
  "PUB-009": () => renderMediaPressBody(),
  "PUB-010": () => renderGovernanceBody(),
  "PUB-011": (context) => renderContactBody(context.query),
  "PUB-012": () => renderHelpPageHtml(),
  "PUB-013": (context) => renderSearchBody(context.query.get("q") ?? ""),
  "PUB-016": () => renderAccessibilityPageHtml(),
  "PUB-017": () => renderPrivacyBody(),
  "PUB-019": () => renderTermsBody(),
  "PUB-020": () => renderSitemapBody(),
  "PUB-021": () => renderCorrectionsBody(),
};

export function hasIAPublicBody(screenId: string): boolean {
  return Object.prototype.hasOwnProperty.call(BODIES, screenId);
}

/**
 * Hosted states that need real UI on their host page. The rest are described in
 * the provenance footer so their contract is still visible and reviewable.
 */
export function renderIAHostedSurfaces(screen: IAScreen): string {
  if (screen.id === "PUB-001") return renderStatementRevisionHistory();
  return "";
}

export function renderIAPublicBody(screen: IAScreen, context: IAPublicPageContext): string | undefined {
  const render = BODIES[screen.id];
  return render ? render(context) : undefined;
}

/**
 * A bespoke public page: the page itself, its hosted states, and the provenance
 * footer that ties it back to the inventory row that authorised it.
 */
export function renderIAPublicPage(screen: IAScreen, context: IAPublicPageContext): string {
  const body = renderIAPublicBody(screen, context);
  if (body === undefined) {
    throw new Error(`[IA-PUB] no bespoke public body exists for ${screen.id}`);
  }
  return [
    body,
    '<div class="sr-only" aria-hidden="true">',
    renderIAHostedSurfaces(screen),
    renderIAProvenance(screen),
    "</div>",
  ]
    .filter((part) => part.length > 0)
    .join("\n")
    .trim();
}
