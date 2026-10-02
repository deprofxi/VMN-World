/**
 * Automated Token Contrast & WCAG 2.2 AA Compliance Test Suite
 * Authority: docs/decisions/design-task-de-citation.md (legacy "design-task" DT reference) DT-103, DT-104 / DS-07, DS-08, DS-09 / AGENTS.md UI/UX Rules
 *
 * Mathematical verification of Relative Luminance and Contrast Ratios
 * for all design tokens across public, broadcast, and component surfaces.
 */

import { describe, it, expect } from "vitest";
import {
  calculateRelativeLuminance,
  calculateContrastRatio,
  TOKEN_CONTRAST_SPEC,
  DESIGN_TOKENS,
} from "../../src/web/components/tokens.js";

describe("DT-103 / DT-104: Token Contrast & WCAG 2.2 AA Compliance", () => {
  it("verifies relative luminance edge cases (#000000 and #FFFFFF)", () => {
    expect(calculateRelativeLuminance("#000000")).toBeCloseTo(0.0, 4);
    expect(calculateRelativeLuminance("#FFFFFF")).toBeCloseTo(1.0, 4);
  });

  it("verifies maximum contrast ratio between black and white is 21:1", () => {
    const ratio = calculateContrastRatio("#000000", "#FFFFFF");
    expect(ratio).toBeCloseTo(21.0, 1);
  });

  it("asserts every token in TOKEN_CONTRAST_SPEC meets or exceeds its required contrast ratio", () => {
    const failures: string[] = [];

    for (const spec of TOKEN_CONTRAST_SPEC) {
      const measuredRatio = calculateContrastRatio(spec.fg, spec.bg);
      if (measuredRatio < spec.requiredRatio) {
        failures.push(
          `[FAIL] ${spec.name} (${spec.description}): measured ${measuredRatio.toFixed(2)}:1 < required ${spec.requiredRatio}:1 (fg: ${spec.fg}, bg: ${spec.bg})`
        );
      }
    }

    expect(failures, `Contrast failures detected:\n${failures.join("\n")}`).toEqual([]);
  });

  it("verifies DT-104 control border contrast reaches at least 3:1 against white", () => {
    const borderRatio = calculateContrastRatio(DESIGN_TOKENS.colors.controlBorder, "#FFFFFF");
    expect(borderRatio).toBeGreaterThanOrEqual(3.0);
  });

  it("verifies DS-08 status chips all exceed 4.5:1 contrast on their respective backgrounds", () => {
    const successRatio = calculateContrastRatio(DESIGN_TOKENS.colors.success.text, DESIGN_TOKENS.colors.success.bg);
    const liveRatio = calculateContrastRatio(DESIGN_TOKENS.colors.live.text, DESIGN_TOKENS.colors.live.bg);
    const infoRatio = calculateContrastRatio(DESIGN_TOKENS.colors.info.text, DESIGN_TOKENS.colors.info.bg);
    const warningRatio = calculateContrastRatio(DESIGN_TOKENS.colors.warning.text, DESIGN_TOKENS.colors.warning.bg);
    const neutralRatio = calculateContrastRatio(DESIGN_TOKENS.colors.neutral.text, DESIGN_TOKENS.colors.neutral.bg);

    expect(successRatio, "Success chip contrast below AA").toBeGreaterThanOrEqual(4.5);
    expect(liveRatio, "Live chip contrast below AA").toBeGreaterThanOrEqual(4.5);
    expect(infoRatio, "Info chip contrast below AA").toBeGreaterThanOrEqual(4.5);
    expect(warningRatio, "Warning chip contrast below AA").toBeGreaterThanOrEqual(4.5);
    expect(neutralRatio, "Neutral chip contrast below AA").toBeGreaterThanOrEqual(4.5);
  });

  it("verifies DS-07 primary action color exceeds 4.5:1 contrast on white", () => {
    const primaryRatio = calculateContrastRatio(DESIGN_TOKENS.colors.primary, "#FFFFFF");
    expect(primaryRatio, "Primary action color failed 4.5:1 AA ratio").toBeGreaterThanOrEqual(4.5);
  });
});
