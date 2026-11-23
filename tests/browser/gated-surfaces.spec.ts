/**
 * Real-browser accessibility run for the Phase 4 gated surfaces.
 *
 * `a11y.spec.ts` measures the public pages and the material operating surfaces,
 * all of which a visitor reaches without a session. Phase 4 put the first real
 * content into two shells that sweep never touched: the work shell (`/circle`)
 * and the identity shell (`/account`). Markup assertions cannot see either
 * shell's contrast or target sizes, so both are measured here in Chromium at the
 * same six viewports.
 *
 * The session is obtained the way an operator obtains one — the sign-in form —
 * rather than by injecting a token, so a broken sign-in path fails here too.
 */

import { test, expect, type Page } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

const VIEWPORTS = [
  { label: "mobile-320", width: 320, height: 640 },
  { label: "mobile-390", width: 390, height: 844 },
  { label: "tablet-768", width: 768, height: 1024 },
  { label: "desktop-1024", width: 1024, height: 768 },
  { label: "desktop-1280", width: 1280, height: 800 },
  { label: "desktop-1920", width: 1920, height: 1080 },
] as const;

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** See `a11y.spec.ts`: axe must sample settled colours, not a transition frame. */
async function settleTransitions(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      document
        .getAnimations()
        .filter((animation) => animation.constructor.name === "CSSTransition")
        .every((animation) => animation.playState !== "running"),
    undefined,
    { timeout: 5_000 }
  );
}

const ROUTES = [
  { path: "/circle", label: "ONE CIRCLE home (work shell)" },
  { path: "/account", label: "Account (identity shell)" },
  { path: "/account/security", label: "Security and sessions (identity shell)" },
  { path: "/circle/missions", label: "Mission portfolio (work surface)" },
] as const;

for (const route of ROUTES) {
  test(`axe: ${route.label} (${route.path}) has no WCAG 2.2 A/AA violations`, async ({ page }) => {
    // The sandbox persona form the sign-in page publishes: same fields, same
    // endpoint, real redirect and real cookies.
    const signIn = await page.request.post("/sign-in", {
      form: { email: "admin@vmnl.ng", quickPersona: "true", returnUrl: route.path },
      maxRedirects: 0,
    });
    expect(signIn.status(), "the published sign-in form must answer").toBeLessThan(400);

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      const response = await page.goto(route.path, { waitUntil: "load" });
      expect(response, `${route.path} returned no response at ${viewport.label}`).not.toBeNull();
      expect(response!.status(), `${route.path} at ${viewport.label}`).toBe(200);
      await settleTransitions(page);

      const results = await new AxeBuilder({ page }).withTags([...WCAG_TAGS]).analyze();
      const summary = results.violations
        .map((violation) => `${violation.id} (${violation.nodes.length})`)
        .join(", ");
      expect(results.violations, `${route.path} at ${viewport.label}: ${summary}`).toEqual([]);
    }
  });
}
