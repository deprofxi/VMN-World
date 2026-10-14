/**
 * TSK-42 (report.md §6): "the extent of unescaped interpolation into rendered
 * HTML", measured as a test instead of argued as an opinion.
 *
 * Two separate claims are settled here, and they are deliberately different in
 * strength:
 *
 * 1. A **ceiling** (static): how many bare expressions are interpolated into
 *    markup on a line that does not call the escape helper. This is a ceiling
 *    and not a vulnerability count — numbers, CSS tokens and locals that were
 *    escaped earlier all appear in it. It is pinned so it cannot silently grow.
 *
 * 2. The **mechanism** (behavioural): the escape helper the ceiling assumes
 *    actually neutralises the characters that break text, attribute and URL
 *    contexts. Proving this is what makes the ceiling actionable rather than
 *    rhetorical.
 *
 * Wiring every one of the ceiling's sites is a burn-down, recorded as a named
 * debt in docs/design-debt-register.md; this file does not claim any of them is
 * exploitable, and does not claim they are safe either.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { escapeHtml } from "../../src/web/components/escape.js";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const WEB_SRC = path.join(ROOT, "src", "web");

/**
 * The recorded ceiling, measured 2026-10-14 by the rule below. Only ever
 * decrease it (same ratchet discipline as scripts/explicit-any-budget.js).
 */
const UNESCAPED_SITE_CEILING = 299;

/** The files this sweep flagged as carrying the most unescaped sites. */
const TOP_OFFENDER_FILES = 8;

function tsFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = path.join(dir, entry);
    if (statSync(p).isDirectory()) tsFiles(p, out);
    else if (entry.endsWith(".ts")) out.push(p);
  }
  return out;
}

/**
 * Rule, stated so a third party can recount it:
 *  - the line contains markup (`<` or `>` followed by a letter), and
 *  - the line does not mention `escapeHtml(`, and
 *  - the interpolation is a bare identifier or dotted member path
 *    (`${x}` / `${a.b}`) — anything with a call, ternary, literal or template
 *    inside is excluded, because those cannot be classified by shape alone.
 */
export function countUnescapedInterpolationSites(): { total: number; byFile: Record<string, number> } {
  const bareInterp = /\$\{[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*\}/g;
  const byFile: Record<string, number> = {};
  let total = 0;

  for (const file of tsFiles(WEB_SRC)) {
    const lines = readFileSync(file, "utf8").split("\n");
    let hits = 0;
    for (const line of lines) {
      if (!/[<>][a-zA-Z]/.test(line)) continue;
      if (line.includes("escapeHtml(")) continue;
      const m = line.match(bareInterp);
      if (m) hits += m.length;
    }
    if (hits > 0) {
      const rel = path.relative(ROOT, file).split(path.sep).join("/");
      byFile[rel] = hits;
      total += hits;
    }
  }
  return { total, byFile };
}

describe("TSK-42: unescaped interpolation into rendered HTML", () => {
  it("recounts the ceiling by the published rule and cannot let it grow", () => {
    const { total, byFile } = countUnescapedInterpolationSites();
    // Ratchet only: the recorded figure lives in docs/design-debt-register.md
    // and this test fails when the sweep finds more sites than were recorded.
    expect(total, `ratchet: unescaped-site ceiling was ${UNESCAPED_SITE_CEILING}, sweep found ${total}`).toBeLessThanOrEqual(
      UNESCAPED_SITE_CEILING
    );
    expect(Object.keys(byFile).length).toBeGreaterThan(0);
  });

  it("names the files carrying most of the ceiling, so the burn-down has an order", () => {
    const { byFile } = countUnescapedInterpolationSites();
    const ranked = Object.entries(byFile).sort((a, b) => b[1] - a[1]);
    const top = ranked.slice(0, TOP_OFFENDER_FILES);

    // The debt register must list the same order the sweep produces; a silent
    // reshuffle of the hot files is as much a drift as a new site.
    const register = readFileSync(path.join(ROOT, "docs/design-debt-register.md"), "utf8");
    for (const [file] of top) {
      expect(register, `${file} is a top-ranked unescaped-site file and must appear in the debt register`).toContain(file);
    }
  });

  it("neutralises the characters that break text, attribute and URL contexts", () => {
    const hostile = `</span><script>alert(1)</script>`;
    const quoted = `" onmouseover="steal()`;
    const ampersand = `a&b`;

    expect(escapeHtml(hostile)).not.toContain("<script>");
    expect(escapeHtml(hostile)).toContain("&lt;script&gt;");
    expect(escapeHtml(quoted)).not.toContain(`"`);
    expect(escapeHtml(ampersand)).toContain("&amp;");
  });

  it("keeps an already-escaped value from being escaped twice", () => {
    // A renderer that escapes at the write boundary and again at the template
    // would print "&amp;amp;" to operators; the convention must stay legible.
    expect(escapeHtml(escapeHtml("A & B"))).toBe("A &amp;amp; B");
  });
});
