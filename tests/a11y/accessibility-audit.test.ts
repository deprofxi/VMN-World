/**
 * Automated Accessibility (WCAG 2.2 AA) Audit Test Suite
 * Authority: AGENTS.md UI/UX Rules / VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / T-22 (B-21)
 */

import { describe, it, expect } from "vitest";
import {
  renderMasterLayout,
  renderHomePageHtml,
  renderChannelsPageHtml,
  renderHubPageHtml,
  renderScreensCatalogHtml,
  renderScreenDetailHtml,
  renderAfcaVerificationHtml,
  renderPoaVerificationHtml,
  renderWorkspaceDirectoryHtml,
} from "../../src/web/index.js";
import { ComponentRenderer, validateControlAccessibility } from "../../src/web/components/index.js";

describe("T-22 (B-21): Automated Accessibility (WCAG 2.2 AA) Verification", () => {
  const renderedPages = [
    { name: "Home Page", html: renderMasterLayout("Home", renderHomePageHtml(), "/") },
    { name: "Channels Overview", html: renderMasterLayout("Channels", renderChannelsPageHtml(), "/channels") },
    { name: "Creative Economy Hub", html: renderMasterLayout("Hub", renderHubPageHtml(), "/hub") },
    { name: "Screens Catalog", html: renderMasterLayout("Screens Catalog", renderScreensCatalogHtml(), "/broadcast/screens") },
    { name: "Screen Detail", html: renderMasterLayout("Screen Detail", renderScreenDetailHtml("SCR-BCST-23"), "/broadcast/screens") },
    { name: "AFCA Verification", html: renderMasterLayout("AFCA Verification", renderAfcaVerificationHtml({ valid: false, id: "TEST" }), "/verify/afca/TEST") },
    { name: "POA Verification", html: renderMasterLayout("POA Verification", renderPoaVerificationHtml({ valid: false, id: "TEST" }), "/verify/poa/TEST") },
    { name: "Workspace Directory", html: renderMasterLayout("Workspace", renderWorkspaceDirectoryHtml(), "/workspace") },
  ];

  it("verifies document shell conforms to WCAG 2.2 AA (doctype, lang, meta, title)", () => {
    for (const page of renderedPages) {
      expect(page.html, `${page.name} missing <!DOCTYPE html>`).toContain("<!DOCTYPE html>");
      expect(page.html, `${page.name} missing html lang="en"`).toMatch(/<html[^>]*lang=["']en["']/);
      expect(page.html, `${page.name} missing viewport meta`).toContain('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
      expect(page.html, `${page.name} missing page title`).toMatch(/<title>.*<\/title>/);
    }
  });

  it("verifies semantic landmark regions exist on all rendered layouts", () => {
    for (const page of renderedPages) {
      expect(page.html, `${page.name} missing <header> landmark`).toContain("<header");
      expect(page.html, `${page.name} missing <main> landmark`).toContain("<main");
      expect(page.html, `${page.name} missing <footer> landmark`).toContain("<footer");
    }
  });

  it("verifies minimum touch targets and interactive control accessibility", () => {
    const validBtn = validateControlAccessibility({
      widthPx: 44,
      heightPx: 44,
      hasAccessibleLabel: true,
      hasAriaState: true,
    });
    expect(validBtn.compliant).toBe(true);

    const invalidBtn = validateControlAccessibility({
      widthPx: 30,
      heightPx: 30,
      hasAccessibleLabel: false,
      hasAriaState: false,
    });
    expect(invalidBtn.compliant).toBe(false);
  });

  it("verifies UI component state matrix accessibility tokens", () => {
    // Buttons
    const btn = ComponentRenderer.renderButton({
      label: "Action",
      variant: "primary",
      state: "loading",
    });
    expect(btn).toContain('aria-busy="true"');
    expect(btn).toContain('aria-disabled="true"');
    expect(btn).toContain('aria-hidden="true"');

    // Input fields
    const input = ComponentRenderer.renderInputField({
      id: "test-input",
      label: "Test Field",
      value: "",
      required: true,
      state: "error",
      errorMessage: "Field cannot be blank",
    });
    expect(input).toContain('for="test-input"');
    expect(input).toContain('id="test-input"');
    expect(input).toContain('aria-invalid="true"');
    expect(input).toContain('role="alert"');

    // Empty states
    const empty = ComponentRenderer.renderEmptyState("No Records", "There are currently no items available.");
    expect(empty).toContain('role="status"');
    expect(empty).toContain('aria-live="polite"');
  });

  it("verifies images and icons have proper accessibility attributes", () => {
    for (const page of renderedPages) {
      // Ensure all img tags have an alt attribute (even if empty for decorative)
      const imgMatches = page.html.match(/<img[^>]*>/g) || [];
      for (const img of imgMatches) {
        expect(img, `Image missing alt attribute in ${page.name}`).toMatch(/alt=["'][^"']*["']/);
      }
    }
  });

  it("verifies CSP compliance: no inline executable <script> or on* handler attributes in rendered pages (AUD-04)", () => {
    for (const page of renderedPages) {
      // Allow only non-executable data script tags (e.g. type="application/ld+json") or external scripts (<script src=...>)
      const scripts = page.html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/gi) || [];
      for (const script of scripts) {
        const isJsonLd = /type=["']application\/ld\+json["']/i.test(script);
        const isExternal = /src=["'][^"']+["']/i.test(script);
        expect(isJsonLd || isExternal, `Found non-compliant inline script in ${page.name}: ${script}`).toBe(true);
      }

      // Ensure no inline event handlers (onclick, onsubmit, onchange, etc.)
      const inlineHandlerMatch = page.html.match(/\s+on[a-z]+=["'][^"']*["']/gi);
      expect(inlineHandlerMatch, `Found inline event handlers in ${page.name}: ${inlineHandlerMatch?.join(", ")}`).toBeNull();
    }
  });
});
