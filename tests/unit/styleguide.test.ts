/**
 * Living Styleguide & Component State Matrix Unit Test Suite
 * Authority: docs/decisions/design-task-de-citation.md (legacy "design-task" DT reference) DT-202, DT-206 / AGENTS.md UI/UX Rules
 */

import { describe, it, expect } from "vitest";
import {
  ComponentRenderer,
  renderStyleguideHtml,
  renderIcon,
} from "../../src/web/components/index.js";
import { CANONICAL_STYLESHEET } from "../../src/web/styles/index.js";

describe("DT-202 / DT-206: Component State Matrix & Living Styleguide", () => {
  it("renders the living styleguide HTML without errors", () => {
    const html = renderStyleguideHtml();
    expect(html).toContain("VMNL Living Design System & Styleguide");
    expect(html).toContain("Button State Matrix");
    expect(html).toContain("Status Chips");
    expect(html).toContain("Data Provenance & Verification Notice");
    expect(html).toContain("Form Fields State Matrix");
    expect(html).toContain("Resilient Empty & Error States");
    expect(html).toContain("Accessible Loading Skeletons");
    expect(html).toContain("Design Foundations");
    expect(html).toContain("AA · 44 px");
    expect(html).toContain("vmn-foundation-grid");
  });

  it("provides mature responsive foundations and accessible interaction styling", () => {
    expect(CANONICAL_STYLESHEET).toContain("--vmn-content-max: 1440px");
    expect(CANONICAL_STYLESHEET).toContain("--vmn-elevation-panel-hover");
    expect(CANONICAL_STYLESHEET).toContain("text-wrap: balance");
    expect(CANONICAL_STYLESHEET).toContain(":where(a, button, input, select, textarea, [tabindex]):focus-visible");
    expect(CANONICAL_STYLESHEET).toContain("color-scheme: dark");
    expect(CANONICAL_STYLESHEET).toContain("prefers-reduced-motion: reduce");
    expect(CANONICAL_STYLESHEET).toContain("padding-bottom: calc(88px + env(safe-area-inset-bottom, 0px))");
    expect(CANONICAL_STYLESHEET).toContain("footer.vmn-footer {\n      padding-bottom: calc(88px + env(safe-area-inset-bottom, 0px))");
    expect(CANONICAL_STYLESHEET).toContain("color: var(--vmn-color-text-main);\n    background: var(--vmn-surface-accent);");
    expect(CANONICAL_STYLESHEET).toContain("--vmn-color-primary-text");
    expect(CANONICAL_STYLESHEET).toContain(".vmn-public-hero {\n    position: relative;");
    expect(CANONICAL_STYLESHEET).toContain("@media (max-width: 1200px) {\n    nav.vmn-nav-links { display: none; }");
    expect(CANONICAL_STYLESHEET).toContain(".vmn-cmd-trigger-btn > span, .vmn-cmd-trigger-btn > kbd { display: none; }");
    expect(CANONICAL_STYLESHEET).toContain(".vmn-brand-logo::after");
    expect(CANONICAL_STYLESHEET).toContain("font-variant-numeric: tabular-nums");
    expect(CANONICAL_STYLESHEET).toContain(".vmn-shell-identity {");
    expect(CANONICAL_STYLESHEET).toContain(".vmn-portal-banner > :last-child { flex-wrap: wrap; }");
    expect(CANONICAL_STYLESHEET).toContain(".operator-rail-item.active {");
    expect(CANONICAL_STYLESHEET).toContain("var(--vmn-color-warning-bg)");
    expect(CANONICAL_STYLESHEET).toContain("grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));");
    expect(CANONICAL_STYLESHEET).toContain(".card, .vmn-card { padding: var(--vmn-panel-padding-compact); }");
    expect(CANONICAL_STYLESHEET).toContain(".vmn-input::placeholder { color: var(--vmn-color-text-subtle); opacity: 1; }");
    expect(CANONICAL_STYLESHEET).toContain(".vmn-input:disabled {");
    expect(CANONICAL_STYLESHEET).toContain(".table-container tbody tr:focus-within td {");
    expect(CANONICAL_STYLESHEET).toContain("height: 100dvh;");
    expect(CANONICAL_STYLESHEET).toContain("max-height: min(80dvh, 720px);");
    expect(CANONICAL_STYLESHEET).toContain(".provenance-notice > svg { flex: 0 0 auto;");
    expect(CANONICAL_STYLESHEET).toContain("overscroll-behavior: contain;");
  });

  it("applies one editorial-operational visual language across public, work, broadcast, and portal surfaces", () => {
    expect(CANONICAL_STYLESHEET).toContain("--vmn-elevation-floating");
    expect(CANONICAL_STYLESHEET).toContain("background-image:\n      radial-gradient(ellipse at 90% 8%");
    expect(CANONICAL_STYLESHEET).toContain(".vmn-work-rail {\n    background: linear-gradient(165deg");
    expect(CANONICAL_STYLESHEET).toContain(".operator-rail");
    expect(CANONICAL_STYLESHEET).toContain(".vmn-portal-banner {");
    expect(CANONICAL_STYLESHEET).toContain(".timeline-container");
    expect(CANONICAL_STYLESHEET).toContain("tbody tr:nth-child(even) td");
    expect(CANONICAL_STYLESHEET).toContain(".vmn-empty-state {");
    expect(CANONICAL_STYLESHEET).toContain(".vmn-cmd-dialog {");
  });

  it("preserves responsive, touch, dark-theme, and reduced-motion behavior in the redesign", () => {
    expect(CANONICAL_STYLESHEET).toContain("@media (max-width: 760px)");
    expect(CANONICAL_STYLESHEET).toContain("@media (hover: none)");
    expect(CANONICAL_STYLESHEET).toContain(":root[data-theme=\"dark\"]");
    expect(CANONICAL_STYLESHEET).toContain("@media (prefers-color-scheme: dark)");
    expect(CANONICAL_STYLESHEET).toContain("@media (prefers-reduced-motion: reduce)");
    expect(CANONICAL_STYLESHEET).toContain("min-height: 48px");
    expect(CANONICAL_STYLESHEET).toContain("color-mix(in srgb, var(--vmn-surface) 88%, var(--vmn-surface-accent))");
  });

  it("verifies Button supports full state matrix with distinct markup", () => {
    const states = ["default", "hover", "pressed", "focus-visible", "disabled", "loading"] as const;
    const outputs = new Set<string>();

    for (const state of states) {
      const btn = ComponentRenderer.renderButton({
        label: "Submit Action",
        variant: "primary",
        state,
      });

      expect(btn).toContain(`vmn-btn-state-${state}`);
      expect(btn).toContain("min-height: 44px");

      if (state === "disabled") {
        expect(btn).toContain('aria-disabled="true"');
      }
      if (state === "loading") {
        expect(btn).toContain('aria-busy="true"');
        expect(btn).toContain("Loading...");
      }

      outputs.add(btn);
    }

    // Ensure each state rendered distinct markup
    expect(outputs.size).toBe(states.length);
  });

  it("verifies StatusChip renders all required tones with non-color icons", () => {
    const tones = ["live", "success", "info", "warning", "neutral", "provisional"] as const;

    for (const tone of tones) {
      const chip = ComponentRenderer.renderStatusChip({
        label: `Status ${tone}`,
        tone,
        pulsing: tone === "live",
      });

      expect(chip).toContain(`status-chip-${tone}`);
      expect(chip).toContain("<svg"); // Icon rendered alongside text
      if (tone === "live") {
        expect(chip).toContain("vmn-pulse-dot");
      }
    }
  });

  it("verifies ProvenanceNotice structure and role", () => {
    const notice = ComponentRenderer.renderProvenanceNotice({
      message: "Unverified StarTimes playout logs",
      source: "Manual reconciliation pending",
    });

    expect(notice).toContain('role="note"');
    expect(notice).toContain("Unverified StarTimes playout logs");
  });

  it("verifies LoadingSkeleton aria attributes", () => {
    const skeleton = ComponentRenderer.renderLoadingSkeleton({ lines: 3 });
    expect(skeleton).toContain('role="status"');
    expect(skeleton).toContain('aria-busy="true"');
  });

  it("verifies ErrorState renders accessible alert landmark", () => {
    const error = ComponentRenderer.renderErrorState({
      title: "Playout Failure",
      message: "Signal loss detected on channel NXTR",
      errorCode: "SIG-404",
      retryActionLabel: "Reconnect",
    });

    expect(error).toContain('role="alert"');
    expect(error).toContain("Playout Failure");
    expect(error).toContain("SIG-404");
    expect(error).toContain("Reconnect");
  });

  it("verifies EmptyState uses SVG icons and zero OS emojis", () => {
    const empty = ComponentRenderer.renderEmptyState(
      "No Items",
      "No items found in directory",
      "Create Item"
    );

    expect(empty).toContain("<svg");
    expect(empty).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u); // Zero emojis
  });

  it("verifies Icon component renders accessible attributes correctly", () => {
    const decorativeIcon = renderIcon("broadcast");
    expect(decorativeIcon).toContain('aria-hidden="true"');

    const informativeIcon = renderIcon("alert", { accessibleLabel: "Warning notice" });
    expect(informativeIcon).toContain('role="img"');
    expect(informativeIcon).toContain('aria-label="Warning notice"');
    expect(informativeIcon).not.toContain('aria-hidden="true"');
  });
});
