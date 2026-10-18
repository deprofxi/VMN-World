/**
 * TSK-46 (AUD-19 claim hygiene): an accessibility conformance claim may not be
 * stated without saying which half of it was actually tested.
 *
 * Canonical law 20 forbids a "TESTED & PASSED" claim with no artifact. For
 * accessibility the failure mode is subtler: the automated HTML-shape suite is
 * real and green, and its result gets written as though it settled WCAG 2.2 AA.
 * Manual §7.5 coverage has never run (PRC-06 / HD-09) and no browser has ever
 * been driven in this environment, so a bare conformance phrase overstates both.
 *
 * These tests keep the qualifier attached to the claim, wherever the claim
 * lives — including inside source comments, which operators and auditors read.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

function walk(dir: string, filter: (name: string) => boolean, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry === ".git") continue;
    const p = path.join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, filter, out);
    else if (filter(entry)) out.push(p);
  }
  return out;
}

const rel = (p: string) => path.relative(ROOT, p).split(path.sep).join("/");

const documents = walk(path.join(ROOT, "docs"), (n) => n.endsWith(".md")).concat(
  walk(path.join(ROOT, "src"), (n) => n.endsWith(".ts"))
);

/** A conformance phrase, quoted verbatim from the claims this task downgraded. */
const CONFORMANCE_PHRASE = /AA (?:compliant|compliance verified|conformant|conformance verified)/i;

/** Words that make the claim honest by naming what was actually exercised. */
const QUALIFIER = /automated|NOT_RUN|manual/i;

describe("TSK-46: accessibility conformance claim hygiene", () => {
  it("never states WCAG AA conformance without saying which half was tested", () => {
    const unqualified: string[] = [];
    for (const file of documents) {
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((line, i) => {
        if (!CONFORMANCE_PHRASE.test(line)) return;
        // The claim may be qualified on the same line or in the line below it
        // (the register writes long status cells that wrap).
        const window = `${line} ${lines[i + 1] ?? ""}`;
        if (!QUALIFIER.test(window)) unqualified.push(`${rel(file)}:${i + 1}`);
      });
    }
    expect(unqualified, `unqualified AA conformance claims:\n${unqualified.join("\n")}`).toEqual([]);
  });

  it("records manual §7.5 coverage as NOT_RUN until HD-09 closes", () => {
    for (const doc of ["docs/handoffs/LATEST.md", "docs/audit/evidence-register.md"]) {
      const text = readFileSync(path.join(ROOT, doc), "utf8");
      expect(text, `${doc} must state manual §7.5 coverage as NOT_RUN`).toMatch(/manual §7\.5[^\n]*NOT_RUN/i);
    }
  });

  it("keeps the browser-run claim tied to a run that exists, and one that CI has not executed", () => {
    // TSK-45's wiring boxes closed 2026-10-17: a real browser run exists and
    // passes. The claim is only honest while it names a suite that is present, so
    // the guard now checks the artifact rather than the absence of one — and it
    // still refuses the *other* overstatement: no CI run has executed the suite,
    // because the repository has no git remote (PR-02). A local green run is not
    // a CI-verified run, and the register must keep saying so.
    expect(readdirSync(ROOT)).toContain("playwright.config.ts");
    const browserSpecs = readdirSync(path.join(ROOT, "tests", "browser")).filter((n) => n.endsWith(".spec.ts"));
    expect(browserSpecs.length, "the browser run must have specs behind it").toBeGreaterThan(0);

    const evidence = readFileSync(path.join(ROOT, "docs/audit/evidence-register.md"), "utf8");
    expect(evidence).toMatch(/NOT_PROVEN/);
    const register = readFileSync(path.join(ROOT, "tasks.md"), "utf8");
    expect(register).toMatch(/unproven|NOT_PROVEN|no CI run has/);
  });

  it("wires the browser run it claims, and keeps both scripts declared", () => {
    const pkg = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));
    // The two DevTools in this repository must stay distinguishable: `test:a11y`
    // measures bytes (Vitest), `test:browser` measures rendering (Playwright).
    // Neither may be presented as the other, and neither may quietly disappear.
    expect(pkg.scripts?.["test:a11y"], "the HTML-shape suite must remain declared").toBeTypeOf("string");
    expect(pkg.scripts?.["test:a11y"]).toContain("vitest");
    expect(pkg.scripts?.["test:browser"], "the browser suite must remain declared").toBeTypeOf("string");
    expect(pkg.scripts?.["test:browser"]).toContain("playwright test");

    const hasAxeBrowser = Boolean(pkg.devDependencies?.["@axe-core/playwright"]);
    const hasConfig =
      readdirSync(ROOT).filter((n) => /^playwright\.config\.[cm]?[jt]s$/.test(n)).length > 0;
    if (hasAxeBrowser || hasConfig) {
      // A declared browser run needs both halves. Claiming one without the other
      // is the exact shape TSK-45 recorded, so the guard now fails on either.
      expect(hasAxeBrowser, "a wired browser run needs @axe-core/playwright").toBe(true);
      expect(hasConfig, "a wired browser run needs playwright.config.ts").toBe(true);
      expect(readdirSync(path.join(ROOT, "tests", "browser")).length).toBeGreaterThan(0);
    }
  });
});
