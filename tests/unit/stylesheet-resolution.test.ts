/**
 * TSK-04 evidence: the stylesheet-resolution helper the DT-202 assertions now
 * depend on must itself be verified — including that it does not silently pass
 * when a rule is absent. Authority for DT ids: docs/decisions/design-task-de-citation.md (legacy "design-task" DT reference).
 */

import { describe, expect, it } from "vitest";
import {
  declarationPx,
  effectiveDeclaration,
  effectiveTouchTargetPx,
  parseStylesheet,
} from "../helpers/stylesheet.js";

const SNIPPET_CSS = `
  .alpha { min-height: 44px; color: #000; }
  .beta, .gamma { min-width: 44px; }
  .alpha.beta { min-height: 48px; }
  @media (min-width: 700px) { .alpha { min-height: 52px; } }
`;

describe("tests/helpers/stylesheet.ts", () => {
  const rules = parseStylesheet(SNIPPET_CSS);

  it("parses grouped and compound class selectors with their declarations", () => {
    expect(effectiveDeclaration('<span class="beta">x</span>', "min-width", rules)).toBe("44px");
    expect(effectiveDeclaration('<span class="gamma">x</span>', "min-width", rules)).toBe("44px");
  });

  it("applies cascade order: the later, more specific rule wins", () => {
    expect(effectiveDeclaration('<span class="alpha">x</span>', "min-height", rules)).toBe("52px");
  });

  it("requires every class of a compound selector before applying its rule", () => {
    // `.alpha.beta { min-height: 48px }` must not apply to `.alpha` alone;
    // otherwise a utility class could borrow another component's sizing.
    expect(effectiveDeclaration('<span class="alpha">x</span>', "min-height", rules)).toBe("52px");
    const onlyAlpha = parseStylesheet(".alpha { min-height: 44px; } .alpha.beta { min-height: 48px; }");
    expect(effectiveDeclaration('<span class="alpha">x</span>', "min-height", onlyAlpha)).toBe("44px");
    expect(effectiveDeclaration('<span class="alpha beta">x</span>', "min-height", onlyAlpha)).toBe("48px");
  });

  it("lets an inline style outrank the stylesheet", () => {
    const html = '<span class="alpha" style="min-height:30px">x</span>';
    expect(effectiveDeclaration(html, "min-height", rules)).toBe("30px");
  });

  it("returns null rather than a passing value when no rule delivers the property", () => {
    expect(effectiveDeclaration('<span class="unknown-class">x</span>', "min-height", rules)).toBeNull();
    expect(effectiveDeclaration("<span>x</span>", "min-height", rules)).toBeNull();
    expect(effectiveTouchTargetPx('<span class="alpha">x</span>', rules).minWidth).toBeNull();
  });

  it("converts rem to px and ignores non-length values", () => {
    expect(declarationPx("2.5rem")).toBe(40);
    expect(declarationPx("44px")).toBe(44);
    expect(declarationPx("auto")).toBeNull();
    expect(declarationPx(null)).toBeNull();
  });

  it("resolves the real button element against the shipped canonical stylesheet", () => {
    const button = '<button type="button" class="vmn-btn vmn-btn-primary vmn-btn-state-default s-uFwdajinpr">Go</button>';
    const target = effectiveTouchTargetPx(button);
    expect(target.minWidth).toBeGreaterThanOrEqual(44);
    expect(target.minHeight).toBeGreaterThanOrEqual(44);
  });
});
