/**
 * TSK-63 / TSK-48 — the inline-style census and its CSP coupling, ratcheted.
 *
 * TSK-48's open box promises: migrate the remaining inline `style="…"`
 * attributes, then drop `style-src 'unsafe-inline'` from the CSP **as one
 * atomic change**. Nothing pinned either half, so the register's prose count
 * drifted from the tree unnoticed (it read "31, all inside ${…}, static = 0"
 * while the tree carried 56 occurrences across 19 files — re-measured
 * 2026-10-16 by this file's own counter).
 *
 * Two guards, mirroring how `html-escape-census.test.ts` ratchets DEBT-009:
 *
 * 1. **Census ratchet** — the number of `style="` occurrences in `src/**.ts`
 *    may not grow past the recorded ceiling. Shrinking is the burn-down; the
 *    register updates the ceiling when it does.
 * 2. **CSP coupling** — `unsafe-inline` in `style-src` may only exist while
 *    inline styles exist, and must disappear when the last one does. That is
 *    TSK-48's atomic change expressed as an executable invariant: neither
 *    half can be closed alone.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { describe, it, expect } from "vitest";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

/**
 * Measured 2026-10-16 by this file's counter: 56 occurrences of `style="`
 * across 52 lines and 19 files under `src/`. Ceiling, not a target: the
 * burn-down in TSK-48 lowers this number, never raises it silently.
 */
const INLINE_STYLE_CEILING = 56;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry === ".git") continue;
    const p = path.join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (entry.endsWith(".ts")) out.push(p);
  }
  return out;
}

function inlineStyleCensus(): { occurrences: number; lines: number; files: number } {
  let occurrences = 0;
  let lines = 0;
  let files = 0;
  for (const file of walk(path.join(ROOT, "src"))) {
    const text = readFileSync(file, "utf8");
    const hits = text.split("\n").filter((l) => l.includes('style="'));
    if (hits.length === 0) continue;
    files++;
    lines += hits.length;
    occurrences += hits.reduce((n, l) => n + l.split('style="').length - 1, 0);
  }
  return { occurrences, lines, files };
}

/** The shipped CSP as it appears in source; `null` when the header cannot be found. */
function styleSrcDirective(): string | null {
  const router = readFileSync(path.join(ROOT, "src", "api", "router.ts"), "utf8");
  const match = router.match(/style-src [^";]*/);
  return match ? match[0] : null;
}

describe("TSK-63: inline-style census and CSP coupling", () => {
  it("holds the inline-style census at its recorded ceiling", () => {
    const census = inlineStyleCensus();
    console.log(
      `[TSK-63] inline style attributes in src: ${census.occurrences} occurrences / ` +
        `${census.lines} lines / ${census.files} files (ceiling ${INLINE_STYLE_CEILING})`,
    );
    expect(census.occurrences, "inline-style sites may not grow; burning them down is TSK-48").toBeLessThanOrEqual(
      INLINE_STYLE_CEILING,
    );
    expect(census.occurrences, "the sweep must actually be counting").toBeGreaterThan(0);
  });

  it("keeps CSP style-src and the inline-style census in lockstep (TSK-48's atomic change)", () => {
    const census = inlineStyleCensus();
    const styleSrc = styleSrcDirective();
    expect(styleSrc, "the CSP style-src directive must exist in src/api/router.ts").not.toBeNull();

    if (census.occurrences > 0) {
      // Styles are still emitted inline: dropping unsafe-inline now would break them.
      expect(styleSrc, "inline styles exist, so the CSP must still allow them (TSK-48)").toContain(
        "'unsafe-inline'",
      );
    } else {
      // Last inline style is gone: unsafe-inline must go in the same change.
      expect(
        styleSrc,
        "no inline styles remain — drop 'unsafe-inline' from style-src in the same change (TSK-48)",
      ).not.toContain("'unsafe-inline'");
    }
  });
});
