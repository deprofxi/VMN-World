/**
 * Real-browser accessibility run — PR-26 / TSK-45 (`HD-10`).
 *
 * Every assertion here needs a rendering engine, which is the point: the same
 * pages pass the Vitest HTML-shape suite (`tests/a11y/`) while failing two WCAG
 * 2.2 AA success criteria that only a browser can measure — 1.4.3 contrast (the
 * channel heading rendered the gold graphic accent as text: 1.73:1 on white) and
 * 2.5.8 target size. Both were fixed in this change; this file is the evidence
 * and the regression guard.
 *
 * The sweep runs the six target viewports named in
 * `tests/a11y/responsive.test.ts`, against the built server, over the public
 * surfaces and the material operating surfaces.
 */

import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

/** The six target viewports (matches the breakpoints the stylesheet declares). */
const VIEWPORTS = [
  { label: "mobile-320", width: 320, height: 640 },
  { label: "mobile-390", width: 390, height: 844 },
  { label: "tablet-768", width: 768, height: 1024 },
  { label: "desktop-1024", width: 1024, height: 768 },
  { label: "desktop-1280", width: 1280, height: 800 },
  { label: "desktop-1920", width: 1920, height: 1080 },
] as const;

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** Public surfaces first, then the material operating surfaces. */
const ROUTES = [
  { path: "/", label: "Public overview" },
  { path: "/channels", label: "Linear channels" },
  { path: "/hub", label: "Creative economy hub" },
  { path: "/broadcast/screens", label: "Broadcast screens catalog" },
  { path: "/workspace", label: "Workspace directory" },
  { path: "/prototypes", label: "Prototype viewer" },
  { path: "/styleguide", label: "Design system styleguide" },
] as const;

for (const route of ROUTES) {
  test(`axe: ${route.label} (${route.path}) has no WCAG 2.2 A/AA violations at any target viewport`, async ({
    page,
  }) => {
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      const response = await page.goto(route.path, { waitUntil: "load" });
      expect(response, `${route.path} returned no response at ${viewport.label}`).not.toBeNull();
      expect(response!.status(), `${route.path} at ${viewport.label}`).toBe(200);

      const results = await new AxeBuilder({ page }).withTags([...WCAG_TAGS]).analyze();

      // A readable failure: axe reports rule id + impact + the first offending
      // node, which is what a fix needs. An empty array is the pass.
      const violations = results.violations.map((violation) => {
        const first = violation.nodes[0];
        return [
          `${violation.id} [${violation.impact}] ${violation.nodes.length} node(s)`,
          first ? `    target: ${first.target.join(" ")}` : "",
          first ? `    html:   ${first.html.replace(/\s+/g, " ").slice(0, 160)}` : "",
          first?.any?.[0]?.message ? `    detail: ${first.any[0].message.slice(0, 160)}` : "",
        ]
          .filter(Boolean)
          .join("\n");
      });

      expect(
        violations,
        `axe found WCAG 2.2 A/AA violations on ${route.path} at ${viewport.label} ` +
          `(${viewport.width}x${viewport.height}):\n${violations.join("\n")}`
      ).toEqual([]);
    }
  });
}
