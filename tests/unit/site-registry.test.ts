/**
 * The command palette's destinations and the header nav must be one list.
 *
 * Before this suite existed the palette carried a private copy of 22 destinations
 * and had already drifted from the nav: it advertised `/channels` and `/hub`,
 * which the legacy-route retirement now permanently redirects (301) to
 * `/media-and-audience-overview` and `/creative-economy-hub-overview`. A visitor
 * picking "Linear Television Channels" from the palette was sent to a redirect
 * rather than the page.
 *
 * These assertions pin the shape that prevents a repeat: the palette's primary
 * group *is* the nav, in nav order, from the same objects; every prototype and
 * scenario destination is derived from the prototype viewer's own catalogs; the
 * shipped bundle is generated from the registry rather than carrying its own
 * list; and no destination is a path the router has retired.
 */

import { describe, expect, it } from "vitest";
import { CLIENT_BOOTSTRAP_JS } from "../../src/web/assets/index.js";
import { renderMasterLayout } from "../../src/web/public/dashboard.js";
import {
  PROTOTYPE_SCENARIOS,
  PROTOTYPE_SCREEN_IDS,
  PROTOTYPE_SCENARIO_CATALOG,
  PROTOTYPE_SCREEN_CATALOG,
} from "../../src/web/public/index.js";
import {
  COMMAND_CATEGORIES,
  COMMAND_CATEGORY_ORDER,
  groupByCategory,
  PRIMARY_NAV,
  SITE_DESTINATIONS,
  SITE_DESTINATIONS_JSON,
  type SiteDestination,
} from "../../src/web/public/site-registry.js";
import { pathOf, retiredPathSet } from "../helpers/retired-routes.js";

/** Paths the router permanently redirects to an IA successor (router.ts, D1).
 *  Read from the router rather than restated here, so this suite cannot keep
 *  passing after the retirement table changes. */
const RETIRED_PATHS = retiredPathSet();

describe("site registry: one destination list for the nav and the command palette", () => {
  it("renders the header nav from the registry, in registry order", () => {
    const layout = renderMasterLayout("Test", "<div>Content</div>", "/");
    const nav = layout.match(/<nav class="vmn-nav-links"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? "";
    const anchors = Array.from(nav.matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g)).map((match) => ({
      href: match[1],
      label: match[2],
    }));

    expect(anchors).toEqual(PRIMARY_NAV.map((entry) => ({ href: entry.href, label: entry.label })));
  });

  it("starts the palette's primary group with the nav, entry for entry", () => {
    const primary = SITE_DESTINATIONS.filter((destination) => destination.category === COMMAND_CATEGORIES.primary);
    expect(
      primary.slice(0, PRIMARY_NAV.length).map((destination) => ({ href: destination.url, label: destination.title }))
    ).toEqual(PRIMARY_NAV.map((entry) => ({ href: entry.href, label: entry.label })));
  });

  it("renders its groups in the registry's declared order, one run per category", () => {
    // The palette prints a heading whenever the category changes, so the list it
    // receives must already be grouped. This is the property, measured on the
    // shipped list: every declared category appears exactly once, contiguously,
    // in declaration order — no category can arrive split into two headings.
    expect(COMMAND_CATEGORY_ORDER).toEqual(Object.values(COMMAND_CATEGORIES));
    expect(COMMAND_CATEGORY_ORDER.length).toBeGreaterThan(0);

    const runs: string[] = [];
    for (const destination of SITE_DESTINATIONS) {
      if (runs[runs.length - 1] !== destination.category) runs.push(destination.category);
    }
    expect(runs).toEqual([...COMMAND_CATEGORY_ORDER]);
  });

  it("groups a list whatever order its sources declare, instead of trusting the input", () => {
    // Built from the registry's own categories so a renamed category cannot leave
    // this test asserting yesterday's strings.
    const [first, second, third] = COMMAND_CATEGORY_ORDER;
    const destination = (category: string, title: string): SiteDestination => ({
      category,
      title,
      url: `/${title}`,
      hint: "",
    });
    const interleaved = [
      destination(third, "c1"),
      destination(first, "a1"),
      destination(second, "b1"),
      destination(first, "a2"),
      destination(third, "c2"),
    ];

    // One contiguous run per category, in declared order, and within a category
    // the order the sources wrote them in.
    expect(groupByCategory(interleaved).map((entry) => entry.title)).toEqual(["a1", "a2", "b1", "c1", "c2"]);
  });

  it("refuses a category it has not declared, rather than rendering it ungrouped", () => {
    // A destination naming an unknown category has no position in the order, so
    // it could only appear under a heading the registry does not know. The registry
    // throws when it is evaluated, so this cannot reach a visitor or a build.
    expect(() =>
      groupByCategory([{ category: "Newsroom Surfaces", title: "Undeclared", url: "/x", hint: "" }])
    ).toThrow(/not declared in COMMAND_CATEGORIES/);
  });

  it("compiles the group order into the bundle, and orders the list with it", () => {
    const packed = CLIENT_BOOTSTRAP_JS.match(/var COMMAND_CATEGORY_ORDER = (\[[^\]]*\]);/)?.[1];
    expect(packed, "the bundle must compile the registry's category order").toBeTruthy();
    expect(JSON.parse(packed as string)).toEqual([...COMMAND_CATEGORY_ORDER]);

    // The order is load-bearing in the asset: the list is grouped before it is
    // rendered, not rendered in whatever order it arrives in.
    expect(CLIENT_BOOTSTRAP_JS).toContain("orderForDisplay(COMMAND_ITEMS)");
  });

  it("lists a route outside the nav once, and only once", () => {
    const dashboard = SITE_DESTINATIONS.filter((destination) => destination.url === "/broadcast/dashboard");
    expect(dashboard).toHaveLength(1);
    expect(PRIMARY_NAV.map((entry) => entry.href)).not.toContain("/broadcast/dashboard");
  });

  it("derives every prototype and scenario destination from the viewer's catalogs", () => {
    for (const screen of PROTOTYPE_SCREEN_CATALOG) {
      const matches = SITE_DESTINATIONS.filter((destination) => destination.url === `/prototypes?screen=${screen.id}`);
      expect(matches, `screen ${screen.id} must appear exactly once`).toHaveLength(1);
      expect(matches[0].title).toBe(`${screen.code}: ${screen.name}`);
    }
    for (const scenario of PROTOTYPE_SCENARIO_CATALOG) {
      const matches = SITE_DESTINATIONS.filter((destination) => destination.url === `/prototypes?scenario=${scenario.id}`);
      expect(matches, `scenario ${scenario.id} must appear exactly once`).toHaveLength(1);
      expect(matches[0].hint).toBe(scenario.desc);
    }

    // The catalogs describe the same sets the URL parser accepts, so a screen
    // added to the viewer is a palette destination and not a broken link.
    expect(PROTOTYPE_SCREEN_CATALOG.map((screen) => screen.id)).toEqual([...PROTOTYPE_SCREEN_IDS]);
    expect(PROTOTYPE_SCENARIO_CATALOG.map((scenario) => scenario.id)).toEqual([...PROTOTYPE_SCENARIOS]);
  });

  it("never sends the palette to a retired route", () => {
    const retired = SITE_DESTINATIONS.filter((destination) => RETIRED_PATHS.has(pathOf(destination.url)));
    expect(retired.map((destination) => destination.url)).toEqual([]);
  });

  it("declares each destination once, with a servable url", () => {
    const urls = SITE_DESTINATIONS.map((destination) => destination.url);
    expect(new Set(urls).size).toBe(urls.length);
    for (const destination of SITE_DESTINATIONS) {
      expect(destination.url.startsWith("/"), `${destination.url} must be a site-relative path`).toBe(true);
      expect(destination.url).not.toContain("undefined");
      expect(destination.title.trim()).not.toBe("");
      expect(destination.category.trim()).not.toBe("");
    }
  });

  it("ships the palette's list inside the bundle, generated from this registry", () => {
    // The palette has no list of its own: the asset is built from SITE_DESTINATIONS.
    for (const destination of SITE_DESTINATIONS) {
      expect(CLIENT_BOOTSTRAP_JS, `${destination.url} must be in the shipped bundle`).toContain(
        JSON.stringify(destination.url)
      );
    }
    expect(JSON.parse(SITE_DESTINATIONS_JSON)).toEqual(JSON.parse(JSON.stringify(SITE_DESTINATIONS)));
    // A hand-written entry is what this change removed; the shipped asset must not
    // carry any destination the registry does not declare.
    const packed = CLIENT_BOOTSTRAP_JS.match(/var COMMAND_ITEMS = (\[[\s\S]*?\]);\n/)?.[1];
    expect(packed, "the bundle must compile the registry into COMMAND_ITEMS").toBeTruthy();
    expect(JSON.parse((packed as string).replace(/\\u003c/g, "<").replace(/\\u2028/g, "\u2028").replace(/\\u2029/g, "\u2029"))).toEqual(
      JSON.parse(JSON.stringify(SITE_DESTINATIONS))
    );
  });

  it("cannot close the script tag or break the literal with an entry's text", () => {
    // The bundle is a template literal holding JSON; a `</script>` in a title, or a
    // U+2028 line separator, would end it. Both are escaped at build time.
    expect(JSON.stringify(SITE_DESTINATIONS)).not.toContain("<");
    expect(CLIENT_BOOTSTRAP_JS).not.toContain("</script>");
    const packed = CLIENT_BOOTSTRAP_JS.match(/var COMMAND_ITEMS = (\[[\s\S]*?\]);\n/)?.[1] ?? "";
    expect(packed).not.toContain("\u2028");
    expect(packed).not.toContain("\u2029");
  });
});
