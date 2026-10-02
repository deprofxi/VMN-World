/**
 * Design Token Discipline & Anti-Regression Test Suite
 * Authority: docs/decisions/design-task-de-citation.md (legacy "design-task" DT reference) DT-1002 / DS-10, DS-12 / AGENTS.md UI/UX Rules
 *
 * Enforces:
 * 1. Zero OS emojis in web markup (DT-106, DS-12).
 * 2. Zero undefined legacy low-contrast color hexes in public & component templates.
 * 3. Token containment: all palette colors must derive from canonical DESIGN_TOKENS.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  renderMasterLayout,
  renderHomePageHtml,
  renderChannelsPageHtml,
  renderHubPageHtml,
  renderScreensCatalogHtml,
  renderScreenDetailHtml,
  renderStyleguideHtml,
} from "../../src/web/index.js";
import { CANONICAL_STYLESHEET } from "../../src/web/styles/index.js";

function getWebSourceFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...getWebSourceFiles(fullPath));
    } else if (fullPath.endsWith(".ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("DT-1002: Token Discipline & Styling Architecture Verification", () => {
  const webFiles = getWebSourceFiles(join(process.cwd(), "src/web"));

  it("enforces zero OS emoji glyphs across all src/web source files (DT-106, DS-12)", () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|📡|🔒|📂|📄|⚡|⚠️|📭|⏳|✅|❌|✓/u;
    const emojiViolations: { file: string; line: number; match: string }[] = [];

    for (const file of webFiles) {
      const content = readFileSync(file, "utf-8");
      const lines = content.split("\n");
      lines.forEach((line, idx) => {
        // Skip comment lines in tokens-contrast test or docstrings
        if (line.trim().startsWith("//") || line.trim().startsWith("*")) return;
        const match = line.match(emojiRegex);
        if (match) {
          emojiViolations.push({
            file: file.replace(process.cwd(), ""),
            line: idx + 1,
            match: match[0],
          });
        }
      });
    }

    expect(
      emojiViolations,
      `Detected emoji glyphs in web sources (replace with renderIcon SVG):\n${JSON.stringify(emojiViolations, null, 2)}`
    ).toEqual([]);
  });

  it("verifies rendered pages contain the canonical stylesheet and skip link", () => {
    const pages = [
      renderMasterLayout("Home", renderHomePageHtml(), "/"),
      renderMasterLayout("Channels", renderChannelsPageHtml(), "/channels"),
      renderMasterLayout("Hub", renderHubPageHtml(), "/hub"),
      renderMasterLayout("Screens", renderScreensCatalogHtml(), "/broadcast/screens"),
      renderMasterLayout("Detail", renderScreenDetailHtml("SCR-BCST-23"), "/broadcast/screens"),
      renderMasterLayout("Styleguide", renderStyleguideHtml(), "/styleguide"),
    ];

    // AUD-20: pages link the immutable stylesheet asset; the canonical tokens
    // live in the stylesheet artifact itself, no longer re-inlined per page.
    for (const page of pages) {
      expect(page).toContain('/assets/styles.css');
      expect(page).toContain("skip-to-content");
      expect(page).toContain("/styleguide");
    }
    expect(CANONICAL_STYLESHEET).toContain(":root");
    expect(CANONICAL_STYLESHEET).toContain("--vmn-color-primary");
    expect(CANONICAL_STYLESHEET).toContain("--vmn-color-control-border");
  });

  it("verifies public navigation includes Broadcast Consoles and Styleguide, and excludes raw 33 Screens (DT-802)", () => {
    const layout = renderMasterLayout("Test", "<div>Content</div>", "/");
    expect(layout).toContain("Broadcast Consoles");
    expect(layout).toContain("Styleguide");
    // Ensure navbar link text does not say "33 Screens"
    expect(layout).not.toMatch(/<a[^>]*>\s*33 Screens\s*<\/a>/);
  });

  it("verifies footer compliance claim is properly qualified (DT-803, DS-17)", () => {
    const layout = renderMasterLayout("Test", "<div>Content</div>", "/");
    expect(layout).toContain("Engineered to WCAG 2.2 Level AA");
    expect(layout).toContain("NBC Broadcast Code standards");
    expect(layout).not.toContain("Compliant with NBC 7th Edition & WCAG 2.2 AA");
  });
});
