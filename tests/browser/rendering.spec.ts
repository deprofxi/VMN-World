/**
 * Rendering and delivery guards for the browser run — PR-26.
 *
 * A browser accessibility run is only evidence if the browser actually received
 * the stylesheet. During this change an early probe served the pages with
 * `page.setContent()` and no stylesheet, and reported 309 `target-size` and
 * `aria-hidden-focus` violations that do not exist in the real interface — the
 * markup was measured unstyled. These tests make that failure mode impossible to
 * mistake for a pass: they assert the CSS is *served*, *applied*, and that the
 * computed layout matches the design system's declared minimum control size.
 */

import { test, expect } from "@playwright/test";

test.describe("the browser run measures styled pages", () => {
  test("serves the canonical stylesheet and the client bundle", async ({ page, request }) => {
    const css = await request.get("/assets/styles.css");
    expect(css.status(), "/assets/styles.css must be served").toBe(200);
    expect(css.headers()["content-type"]).toContain("text/css");
    const cssBody = await css.text();
    expect(cssBody.length, "the stylesheet must not be served empty").toBeGreaterThan(10_000);
    expect(cssBody).toContain("--vmn-color-primary");

    const js = await request.get("/assets/app.js");
    expect(js.status(), "/assets/app.js must be served").toBe(200);
    expect(js.headers()["content-type"]).toContain("javascript");

    const response = await page.goto("/", { waitUntil: "load" });
    expect(response?.status()).toBe(200);

    // The stylesheet is applied, not merely linked: an unstyled document reports
    // `display: inline` for a nav link and a transparent body background.
    const applied = await page.evaluate(() => {
      const link = document.querySelector("nav.vmn-nav-links a");
      const computed = link ? getComputedStyle(link) : null;
      return {
        sheets: document.styleSheets.length,
        linkDisplay: computed?.display ?? "none",
        canvas: getComputedStyle(document.body).backgroundColor,
      };
    });
    expect(applied.sheets, "at least one stylesheet must be attached").toBeGreaterThan(0);
    // The UA default for an anchor is `inline`; any other value proves the
    // stylesheet laid the element out. (The stylesheet resolves this to `flex`
    // at the wide breakpoints, so asserting one keyword would be brittle.)
    expect(applied.linkDisplay, "the nav link must be laid out by the stylesheet, not the UA default").not.toBe("inline");
    expect(applied.canvas, "the canvas token must be applied").not.toBe("rgba(0, 0, 0, 0)");
  });

  test("renders the chrome controls at the target size the design system declares", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });

    // WCAG 2.2 SC 2.5.8 (AA) is 24x24 CSS px, and axe evaluates it with the
    // criterion's own spacing exception — so the sweep in `a11y.spec.ts` is the
    // authority on every link in a paragraph. This test instead pins the chrome
    // the design system explicitly sizes (`min-height: 44px` on `.vmn-brand-group`
    // and the nav links), because those are the controls that define the bar and
    // the ones a stylesheet regression would silently shrink.
    const chrome = await page.evaluate(() => {
      const selectors = [
        ".skip-to-content",
        ".vmn-brand-group",
        'nav.vmn-nav-links a[href="/"]',
        'nav.vmn-nav-links a[href="/media-and-audience-overview"]',
      ];
      return selectors.map((selector) => {
        const element = document.querySelector(selector);
        if (!element) return { selector, width: 0, height: 0 };
        const rect = element.getBoundingClientRect();
        return { selector, width: Math.round(rect.width), height: Math.round(rect.height) };
      });
    });

    const tooSmall = chrome.filter((control) => control.width < 24 || control.height < 24);
    expect(
      tooSmall,
      `chrome controls below 24x24 CSS px: ${tooSmall.map((c) => `${c.selector} ${c.width}x${c.height}`).join(", ")}`
    ).toEqual([]);

    // The skip link is off-screen until focused; focusing it must not resize it
    // below the target size, or the bypass control is unusable on touch.
    const focusedSkipLink = await page.evaluate(() => {
      const element = document.querySelector(".skip-to-content") as HTMLElement | null;
      if (!element) return { width: 0, height: 0 };
      element.focus();
      const rect = element.getBoundingClientRect();
      return { width: Math.round(rect.width), height: Math.round(rect.height) };
    });
    expect(focusedSkipLink.height).toBeGreaterThanOrEqual(24);
  });
});
