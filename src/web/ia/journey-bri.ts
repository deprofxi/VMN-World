/**
 * VMN World IA R1.1 — BRI journey (J02a) and the BRD public brand surfaces.
 *
 * The inventory's own implementation hint for the 35 brand instances is
 * binding: "Do not generate 35 bespoke components; bind canonical brand ID to
 * one approved template." One template (BRD-006) renders every instance;
 * each instance contributes only the record the inventory itself carries.
 *
 * Every value shown comes from the CSV row, from the family rows (BRD-002..005)
 * or is an explicit "not published / require verification" state. No carriage
 * number, audience figure, status or partnership is invented.
 *
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 */

import { escapeHtml } from "../components/index.js";
import { getContentInstances, getIAScreen } from "./index.js";
import type { IAScreen } from "./types.js";
import type { IAPublicPageContext } from "./journey-pub.js";

/* -------------------------------------------------------------------------
 * Brand data, derived only from the inventory's own rows
 * ---------------------------------------------------------------------- */

export interface IABrandInstance {
  screen: IAScreen;
  /** URL slug, derived from the row's own screen name ("TEN Urban" → ten-urban). */
  slug: string;
  /** Sub-brand name without the "Brand detail: " prefix. */
  name: string;
  /** The row's own brand ID, carried in its core-UI contract (e.g. "TEN-01"). */
  brandId: string;
  familySlug: string;
}

export interface IABrandFamily {
  screen: IAScreen;
  slug: string;
  instances: readonly IABrandInstance[];
}

/** "Brand detail: TEN Urban" → { name: "TEN Urban", slug: "ten-urban" } */
function instanceFromScreen(screen: IAScreen): IABrandInstance {
  const name = screen.screenName.replace(/^Brand detail:\s*/, "");
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  // The row's own core-UI contract carries the brand ID ("…; ID TEN-01; …").
  const idMatch = /ID\s+([A-Z0-9]+-\d+)/.exec(screen.coreUi);
  return {
    screen,
    name,
    slug,
    brandId: idMatch ? idMatch[1] : "",
    familySlug: "",
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Family membership follows the inventory's own naming: the name prefix. */
const FAMILY_PREFIXES: ReadonlyArray<{ familyId: string; prefix: string }> = [
  { familyId: "BRD-002", prefix: "TEN" },
  { familyId: "BRD-003", prefix: "Nigezie" },
  { familyId: "BRD-004", prefix: "Candy" },
  { familyId: "BRD-005", prefix: "Games" },
];

function buildFamilies(): readonly IABrandFamily[] {
  const instances = getContentInstances("/brands/{approved-brand-slug}").map(instanceFromScreen);
  const families: IABrandFamily[] = [];
  for (const { familyId, prefix } of FAMILY_PREFIXES) {
    const familyScreen = getIAScreen(familyId);
    if (!familyScreen) continue;
    const family = {
      screen: familyScreen,
      slug: slugify(familyScreen.route.replace("/brands/", "")),
      instances: [] as IABrandInstance[],
    };
    for (const instance of instances) {
      if (instance.name.startsWith(`${prefix} `)) {
        instance.familySlug = family.slug;
        family.instances.push(instance);
      }
    }
    families.push(family);
  }
  return families;
}

const FAMILIES: readonly IABrandFamily[] = buildFamilies();

/** Resolve `/brands/{slug}` to one of the 35 inventory instances. */
export function resolveBrandInstance(slug: string): IABrandInstance | undefined {
  for (const family of FAMILIES) {
    const found = family.instances.find((instance) => instance.slug === slug);
    if (found) return found;
  }
  return undefined;
}

/** Every family overview route (BRD-002..005). */
export function isBrandFamilyRoute(slug: string): IABrandFamily | undefined {
  return FAMILIES.find((family) => family.slug === slug);
}

export function getBrandFamilies(): readonly IABrandFamily[] {
  return FAMILIES;
}

/* -------------------------------------------------------------------------
 * BRD-001 — /brands directory
 * ---------------------------------------------------------------------- */

function brandCard(instance: IABrandInstance): string {
  return `
      <li class="card mb-2">
        <a href="/brands/${escapeHtml(instance.slug)}"><strong>${escapeHtml(instance.name)}</strong></a>
        <p class="text-muted">${escapeHtml(instance.screen.id)} · brand ID ${escapeHtml(
          instance.brandId || "not published"
        )} · <span class="status-chip badge-neutral">Operating status not published</span></p>
      </li>`.trim();
}

export function renderBrandDirectoryBody(): string {
  const directory = getIAScreen("BRD-001");
  const sections = FAMILIES.map((family) => {
    const cards = family.instances.map(brandCard).join("\n");
    return `
    <section class="card mb-4" aria-labelledby="family-${escapeHtml(family.slug)}">
      <h2 id="family-${escapeHtml(family.slug)}">${escapeHtml(family.screen.screenName)}</h2>
      <p>${escapeHtml(family.screen.primaryAction)}</p>
      <ul class="list-unstyled">${cards}</ul>
      <a class="btn btn-outline" href="/brands/${escapeHtml(family.slug)}">Family overview</a>
    </section>`.trim();
  }).join("\n");

  return `
  <article class="container">
    <header>
      <h1>${escapeHtml(directory?.screenName ?? "Brand directory")}</h1>
      <p>${escapeHtml(directory?.primaryAction ?? "")}</p>
    </header>
    <div class="provenance-notice" role="note">
      <strong>Status legend.</strong>
      A brand card is a published name and owner-approved identity only. An operating service status
      is shown for a brand only when a verified source record supplies it; none is connected in this
      environment, so none is claimed.
    </div>
    ${sections}
  </article>`.trim();
}

/* -------------------------------------------------------------------------
 * BRD-002..005 — family overviews
 * ---------------------------------------------------------------------- */

export function renderBrandFamilyBody(family: IABrandFamily): string {
  const cards = family.instances.map(brandCard).join("\n");
  return `
  <article class="container">
    <nav aria-label="Breadcrumb">
      <a href="/brands">Brand directory</a> / <span aria-current="page">${escapeHtml(family.screen.screenName)}</span>
    </nav>
    <header>
      <h1>${escapeHtml(family.screen.screenName)}</h1>
      <p>${escapeHtml(family.screen.primaryAction)}</p>
    </header>
    <div class="provenance-notice" role="note">
      <strong>What is published here.</strong>
      The ${escapeHtml(String(family.instances.length))} sub-brand names the inventory records for
      this family. Descriptions the inventory names but no source supplies yet — service aliases,
      timelines, channel mappings — are not rendered, because rendering one would be a claim.
    </div>
    <ul class="list-unstyled">${cards}</ul>
  </article>`.trim();
}

/* -------------------------------------------------------------------------
 * BRD-006 template + BRI instances — /brands/{approved-brand-slug}
 * ---------------------------------------------------------------------- */

export function renderBrandInstanceBody(instance: IABrandInstance): string {
  const screen = instance.screen;
  return `
  <article class="container">
    <nav aria-label="Breadcrumb">
      <a href="/brands">Brand directory</a> /
      <a href="/brands/${escapeHtml(instance.familySlug)}">${escapeHtml(
        FAMILIES.find((family) => family.slug === instance.familySlug)?.screen.screenName ?? "Family"
      )}</a> /
      <span aria-current="page">${escapeHtml(instance.name)}</span>
    </nav>
    <header>
      <h1>${escapeHtml(instance.name)}</h1>
      <p>${escapeHtml(screen.primaryAction)}</p>
    </header>
    <div class="provenance-notice" role="note">
      <strong>Operating status not published.</strong>
      The inventory requires this page to show the brand's actual service or operating status. No
      verified source record is connected in this environment, so no status is claimed. A live
      service call-to-action also requires separate verified operating evidence, so none is offered.
    </div>
    <section class="card mb-4">
      <h2>Brand identity</h2>
      <p><strong>Inventory record:</strong> ${escapeHtml(screen.id)} of journey ${escapeHtml(screen.journeyCode)}</p>
      <p><strong>Brand ID:</strong> ${escapeHtml(instance.brandId || "not published")}</p>
      <p><strong>Owner-approved remit:</strong> not published / requires verification</p>
      <p><strong>Data classification:</strong> ${escapeHtml(screen.dataClass)}</p>
      <p><strong>Source office:</strong> ${escapeHtml(screen.sourceOffice)}</p>
    </section>
    <section class="card mb-4">
      <h2>Safe context actions</h2>
      <p>The inventory's permitted action for this page is: ${escapeHtml(screen.primaryAction)}</p>
      <a class="btn btn-primary" href="/work-with-vmn">Work with VMN</a>
      <a class="btn btn-outline" href="/contact">Contact</a>
      <a class="btn btn-outline" href="/support">Support</a>
    </section>
    <section class="card mb-4">
      <h2>If this page looks wrong</h2>
      <p>${escapeHtml(screen.recoveryRoute)}</p>
    </section>
  </article>`.trim();
}

/** Entry point used by the public-body aggregator. */
export function renderBriBody(screen: IAScreen, context: IAPublicPageContext): string | undefined {
  if (screen.id === "BRD-001") return renderBrandDirectoryBody();
  if (screen.id === "BRD-006") {
    // The template itself is addressed through one of its 35 instances.
    const slug = context.params["approved-brand-slug"] ?? "";
    const instance = resolveBrandInstance(slug);
    return instance ? renderBrandInstanceBody(instance) : renderBrandInstanceNotFound(slug);
  }
  const family = isBrandFamilyRoute(context.pathname.replace("/brands/", ""));
  if (family && screen.id === family.screen.id) return renderBrandFamilyBody(family);
  return undefined;
}

/** Truthful state for a slug the inventory does not address. */
export function renderBrandInstanceNotFound(slug: string): string {
  const state = getIAScreen("BRD-014");
  return `
  <article class="container">
    <div class="flex flex-wrap gap-2 items-center mb-2">
      <span class="status-chip badge-neutral">No eligible brand</span>
      ${state ? `<span class="status-chip badge-provisional">${escapeHtml(state.id)}</span>` : ""}
    </div>
    <h1>Brand page not available</h1>
    <p>
      No owner-approved brand page is published at <code>${escapeHtml(slug)}</code>. A brand page
      exists only while its owner-approved definition is current; withdrawn or superseded pages are
      removed rather than left guessing.
    </p>
    <a class="btn btn-primary" href="/brands">Brand directory</a>
    <a class="btn btn-outline" href="/contact">Contact</a>
  </article>`.trim();
}
