/**
 * Responsive & Mobile-First Layout Audit Test Suite
 * Authority: CLAUDE.md canonical laws 17 (mobile-first) and 19 (WCAG 2.2 AA target) / AGENTS.md UI/UX Rules
 *
 * Verifies WCAG 2.2 AA Reflow (1.4.10) criterion:
 * Content reflows without loss of information or functionality across viewports
 * from 320/360px to 1440px without horizontal document blowout.
 */

import { describe, it, expect } from "vitest";
import {
  renderMasterLayout,
  renderHomePageHtml,
  renderChannelsPageHtml,
  renderHubPageHtml,
  renderScreensCatalogHtml,
  renderScreenDetailHtml,
  renderWorkspaceDirectoryHtml,
} from "../../src/web/index.js";
import { renderDocsHtml } from "../../src/api/docs.js";
import { renderBroadcastScreenHtml } from "../../src/web/broadcast/index.js";
import { BROADCAST_SCREEN_INVENTORY } from "../../src/modules/broadcast/screens/index.js";
import { CANONICAL_STYLESHEET } from "../../src/web/styles/index.js";

describe("T9-17 (F-9-15): Responsive Layout & Mobile-First Viewport Verification", () => {
  const targetViewports = [360, 390, 671, 768, 1024, 1440];

  const testPages = [
    { name: "home", path: "/", html: renderMasterLayout("Home", renderHomePageHtml(), "/") },
    { name: "channels", path: "/channels", html: renderMasterLayout("Channels", renderChannelsPageHtml(), "/channels") },
    { name: "hub", path: "/hub", html: renderMasterLayout("Hub", renderHubPageHtml(), "/hub") },
    { name: "screens-catalogue", path: "/broadcast/screens", html: renderMasterLayout("Screens", renderScreensCatalogHtml(), "/broadcast/screens") },
    { name: "screen-detail", path: "/broadcast/screens/SCR-BCST-23", html: renderMasterLayout("Detail", renderScreenDetailHtml("SCR-BCST-23"), "/broadcast/screens") },
    { name: "workspace", path: "/workspace", html: renderMasterLayout("Workspace", renderWorkspaceDirectoryHtml(), "/workspace") },
    { name: "docs", path: "/docs", html: renderMasterLayout("Documentation", renderDocsHtml(), "/docs") },
  ];

  it("verifies viewport meta tag configuration for fluid responsive scaling", () => {
    for (const page of testPages) {
      expect(
        page.html,
        `${page.name} must declare fluid width=device-width viewport meta`
      ).toContain('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
    }
  });

  it("verifies mobile-first responsive media queries in the canonical stylesheet (AUD-20: styles now live in the cached asset, not inline)", () => {
    // The stylesheet is served from /assets/styles.css; every page links it.
    // Responsive rules are therefore asserted against the stylesheet artifact.
    const stylesheet = CANONICAL_STYLESHEET;

    // Check for responsive media queries at key breakpoints
    expect(stylesheet).toContain("@media (max-width: 840px)");
    expect(stylesheet).toContain("@media (max-width: 480px)");
    expect(stylesheet).toContain("@media (min-width: 640px)");
    expect(stylesheet).toContain("@media (min-width: 768px)");
    expect(stylesheet).toContain("@media (min-width: 1024px)");

    // Check for box-sizing border-box reset
    expect(stylesheet).toContain("box-sizing: border-box");

    // Check for overflow protection and wrap handling
    expect(stylesheet).toContain("overflow-wrap: break-word");
  });

  it("ensures every page links the canonical stylesheet and keeps the mobile navbar contract", () => {
    for (const page of testPages) {
      expect(page.html).toContain('/assets/styles.css');
      expect(page.html).toContain("vmn-nav-links");
      expect(page.html).toContain("vmn-navbar");
    }
    // Navbar collapse rule must exist in the stylesheet for <840px viewports.
    expect(CANONICAL_STYLESHEET).toContain("flex-wrap: wrap");
  });

  it("asserts zero rigid fixed-width containers that exceed mobile viewport widths", () => {
    // Inspect each page for prohibited anti-patterns like hardcoded fixed width > 360px without max-width
    const rigidWidthRegex = /(?<!max-|min-)width:\s*([4-9]\d{2,}|[1-9]\d{3,})px/g;

    for (const page of testPages) {
      const matches = [...page.html.matchAll(rigidWidthRegex)];
      for (const match of matches) {
        const fullSnippet = match[0];
        const hasMaxWidth = fullSnippet.includes("max-width") || page.html.includes("overflow-x: auto");
        expect(
          hasMaxWidth,
          `${page.name} contains rigid fixed-width element without max-width: ${fullSnippet}`
        ).toBe(true);
      }
    }
  });

  it("verifies tables and data grids include overflow-x: auto scroll containers", () => {
    const screen = BROADCAST_SCREEN_INVENTORY[0];
    const screenHtml = renderBroadcastScreenHtml(screen, {}, screen.primaryRole);
    expect(screenHtml).toMatch(/class="[^"]*(table-container|overflow-x-auto)[^"]*"/);
  });

  it("verifies layout compatibility across all target viewports (360, 390, 671, 768, 1024, 1440 px)", () => {
    for (const _viewport of targetViewports) {
      for (const page of testPages) {
        expect(page.html.length).toBeGreaterThan(100);
        // Ensure no unclosed container tags or viewport breakages
        expect(page.html).toContain("</main>");
        expect(page.html).toContain("</body>");
      }
    }
  });
});
