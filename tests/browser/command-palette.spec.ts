/**
 * The command palette must list the site's destinations, not a copy of them.
 *
 * The palette used to carry 22 hand-written destinations inside `/assets/app.js`.
 * That copy had drifted from the header nav by the time this spec was written: it
 * still advertised `/channels` and `/hub`, and the router now answers both with a
 * permanent redirect (301) to their IA successors. The list is now compiled into
 * the asset from `src/web/public/site-registry.ts` (the registry the nav renders
 * from); these tests read what a browser actually renders and check it against
 * the nav in the same document and against the server's real responses, so "the
 * palette is in sync" is measured rather than asserted.
 */

import { test, expect, type Page } from "@playwright/test";

interface PaletteGroup {
  category: string;
  items: Array<{ href: string; label: string }>;
}

/** Reads the rendered list as groups of {href,label}, in display order. */
async function readPalette(page: Page): Promise<PaletteGroup[]> {
  return page.evaluate(() => {
    const groups: PaletteGroup[] = [];
    let current: PaletteGroup | null = null;
    for (const node of Array.from(document.querySelectorAll("#vmn-cmd-results > *"))) {
      if (node.classList.contains("vmn-cmd-category")) {
        current = { category: node.textContent ?? "", items: [] };
        groups.push(current);
        continue;
      }
      if (!current || !node.matches("a.vmn-cmd-item")) continue;
      const title = node.querySelector("div > div")?.textContent ?? "";
      current.items.push({ href: node.getAttribute("href") ?? "", label: title });
    }
    return groups;
  });
}

async function readNav(page: Page): Promise<Array<{ href: string; label: string }>> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("nav.vmn-nav-links a[href]")).map((anchor) => ({
      href: anchor.getAttribute("href") ?? "",
      label: anchor.textContent,
    }))
  );
}

test.describe("the command palette and the header nav share one registry", () => {
  test("renders the nav as its primary group, and the viewer's catalog as its prototype group", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.locator("#vmn-cmd-backdrop")).toHaveClass(/open/);

    const groups = await readPalette(page);
    const nav = await readNav(page);
    expect(groups.length, "the palette groups its destinations").toBeGreaterThan(1);
    expect(groups[0].category).toBe("Primary Surfaces");
    expect(groups[0].items.slice(0, nav.length), "the primary group must be the nav, in nav order").toEqual(nav);

    // The prototype group is the viewer's catalog, in catalog order.
    const prototypes = groups.find((group) => group.category === "R1.1 Critical Prototypes");
    expect(prototypes?.items.map((item) => item.href)).toEqual([
      "/prototypes?screen=home",
      "/prototypes?screen=channel",
      "/prototypes?screen=work",
      "/prototypes?screen=client",
      "/prototypes?screen=application",
      "/prototypes?screen=terms",
      "/prototypes?screen=schedule",
      "/prototypes?screen=proof",
    ]);
  });

  test("renders one heading per category, in the registry's declared order", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.locator("#vmn-cmd-backdrop")).toHaveClass(/open/);

    // The strings and their order are the registry's (`COMMAND_CATEGORY_ORDER`,
    // pinned by tests/unit/site-registry.test.ts); what this reads is the DOM.
    const expected = ["Primary Surfaces", "R1.1 Critical Prototypes", "Simulated Operational Scenarios"];
    expect((await readPalette(page)).map((group) => group.category)).toEqual(expected);

    // A query matching entries in more than one group must keep every group whole:
    // a heading may not repeat, and a category may not move out of declared order.
    await page.locator("#vmn-cmd-input").fill("prototype");
    const filtered = (await readPalette(page)).map((group) => group.category);
    expect(filtered, "the query must span several groups for this to prove anything").toHaveLength(3);
    expect(new Set(filtered).size, "one heading per category, never a split group").toBe(filtered.length);
    expect(filtered).toEqual(expected);
  });

  test("sends nobody to a retired route", async ({ page, request }) => {
    await page.goto("/", { waitUntil: "load" });
    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.locator("#vmn-cmd-backdrop")).toHaveClass(/open/);

    const rendered = (await readPalette(page)).flatMap((group) => group.items.map((item) => item.href));
    expect(rendered.length, "the palette must list destinations").toBeGreaterThan(1);

    // Nothing may point at a path the router retired: these answer 301, so an
    // entry that navigates twice is a stale entry — which is exactly what this
    // suite found when the palette carried its own copy of the list.
    expect(rendered).not.toContain("/channels");
    expect(rendered).not.toContain("/hub");

    // Measure it rather than trusting the list. Every destination must answer for
    // itself: a 200, or — for a surface that needs a session, like /workspace — a
    // sign-in gate carrying the returnUrl. What it may not be is a 301.
    for (const href of rendered) {
      const response = await request.get(href, { maxRedirects: 0 });
      const status = response.status();
      const location = response.headers()["location"] ?? "";
      const gated = (status === 302 || status === 303) && location.startsWith("/sign-in?returnUrl=");
      expect(status, `${href} must not be a retired route (301)`).not.toBe(301);
      expect(
        status === 200 || gated,
        `${href} must be served or session-gated, not ${status}${location ? ` to ${location}` : ""}`
      ).toBe(true);
    }
  });

  test("filters the compiled list by title, hint and url", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await page.keyboard.press("ControlOrMeta+k");
    const input = page.locator("#vmn-cmd-input");
    await expect(page.locator("#vmn-cmd-backdrop")).toHaveClass(/open/);

    // A hint word that is not in any label proves the hint is indexed.
    await input.fill("mbido");
    await expect(page.locator("#vmn-cmd-results > a.vmn-cmd-item")).toHaveCount(1);
    await expect(page.locator("#vmn-cmd-results > a.vmn-cmd-item")).toHaveAttribute(
      "href",
      "/media-and-audience-overview"
    );

    await input.fill("ux-br-030");
    await expect(page.locator("#vmn-cmd-results > a.vmn-cmd-item")).toHaveAttribute(
      "href",
      "/prototypes?screen=proof"
    );

    await input.fill("no such destination");
    await expect(page.locator("#vmn-cmd-results")).toContainText("No matching destinations found.");
  });
});
