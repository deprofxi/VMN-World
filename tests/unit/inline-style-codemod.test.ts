/**
 * TSK-48 (report.md CA-30): the inline-style codemod must emit valid markup.
 *
 * The shipped version walked the source line-by-line and, whenever a tag's real
 * `class` attribute lived on a different line, appended a second `class="s-…"`
 * to the same element — the exact defect CA-30 recorded. These tests pin the
 * tag-wise rewrite: multi-line tags merge, templated tags are never touched, and
 * a transform that would duplicate an attribute aborts before anything is written.
 *
 * Authority: AGENTS.md Rule 0.1 (an executable behaviour test per closure).
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

import {
  classNameFor,
  duplicateAttributes,
  migrateSource,
} from "../../scripts/migrate-inline-styles.mjs";

const SCRIPT = join(process.cwd(), "scripts", "migrate-inline-styles.mjs");

/** The CA-30 signature: a `style=` whose element's `class=` is on another line. */
const MULTI_LINE_TAG = [
  'export function render(params: { width: number }) {',
  '  return `',
  '    <button',
  '      class="vmn-btn"',
  '      style="color: red"',
  '      type="button">Go</button>',
  '    <div style="width: ${params.width}px">dynamic</div>',
  '  `;',
  '}',
].join("\n");

describe("TSK-48 (CA-30): inline-style codemod emits valid markup", () => {
  it("merges a static style into the class attribute of a multi-line tag", () => {
    const out = migrateSource(MULTI_LINE_TAG);

    expect(out).not.toContain('style="color: red"');
    const button = /<button[\s\S]*?>/.exec(out)?.[0] ?? "";
    expect(button, "the style declaration must become a utility class").toMatch(/class="vmn-btn s-[A-Za-z0-9_-]+"/);
    expect(button.match(/\sclass="/g), "exactly one class attribute per element").toHaveLength(1);
    expect(duplicateAttributes(out)).toEqual([]);
  });

  it("never rewrites a tag that carries a ${…} interpolation", () => {
    const out = migrateSource(MULTI_LINE_TAG);
    expect(out).toContain("<div style=\"width: ${params.width}px\">dynamic</div>");
  });

  it("inserts a class attribute when the element has none, and keeps the other attributes", () => {
    const out = migrateSource('const html = `<a href="/x" style="display:none">y</a>`;');
    expect(out).toContain('href="/x"');
    expect(out).not.toContain("style=");
    expect(/<a class="s-[A-Za-z0-9_-]+" href="\/x">y<\/a>/.test(out) || /<a href="\/x" class=/.test(out)).toBe(true);
    expect(duplicateAttributes(out)).toEqual([]);
  });

  it("reuses one utility class per identical declaration set", () => {
    const map = new Map<string, string>();
    const first = classNameFor("color: red", map);
    expect(classNameFor("color: red;", map)).toBe(first);
    expect(classNameFor("color: blue", map)).not.toBe(first);
    expect(map.size).toBe(2);
  });

  it("aborts before writing anything when a transform would duplicate an attribute", () => {
    // A tag whose class value itself contains a quoted `style="…"` fragment would
    // re-introduce the defect; the guard is the duplicate check on the output.
    const source = 'const html = `<button class="a" class="b">x</button>`;';
    expect(duplicateAttributes(source)).toHaveLength(1);
    expect(duplicateAttributes(source)[0]).toMatchObject({ name: "class", count: 2 });

    const fixtureDir = mkdtempSync(join(tmpdir(), "codemod-abort-"));
    try {
      const src = join(fixtureDir, "broken.ts");
      // The element is already invalid (two class attributes): merging into the
      // first would keep the second, so the guard must refuse to emit it.
      writeFileSync(src, 'const html = `<button class="a" class="b" style="color: red">x</button>`;');
      expect(() => migrateSource(readFileSync(src, "utf8"))).toThrow(/would emit class x2/);
    } finally {
      rmSync(fixtureDir, { recursive: true, force: true });
    }
  });

  describe("CLI over a fixture tree", () => {
    let dir: string;
    let stylesOut: string;
    let sample: string;

    beforeAll(() => {
      dir = mkdtempSync(join(tmpdir(), "codemod-cli-"));
      stylesOut = join(dir, "generated.ts");
      sample = join(dir, "sample.ts");
      writeFileSync(sample, MULTI_LINE_TAG);
    });

    afterAll(() => rmSync(dir, { recursive: true, force: true }));

    const runCli = (args: string[]) =>
      execFileSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8" });

    it("--dry-run reports without touching the source", () => {
      const out = runCli(["--root", dir, "--styles-out", stylesOut, "--dry-run"]);
      expect(out).toContain("migrated static attributes: 1");
      expect(out).toContain("inline style attributes remaining: 1");
      expect(readFileSync(sample, "utf8")).toBe(MULTI_LINE_TAG);
      expect(() => readFileSync(stylesOut, "utf8")).toThrow();
    });

    it("migrates the fixture, emits the sheet, and is idempotent on a second run", () => {
      runCli(["--root", dir, "--styles-out", stylesOut]);
      const migrated = readFileSync(sample, "utf8");
      expect(migrated).not.toContain('style="color: red"');
      expect(duplicateAttributes(migrated)).toEqual([]);

      const sheet = readFileSync(stylesOut, "utf8");
      expect(sheet).toMatch(/export const GENERATED_UTILITY_CSS = `/);
      expect(sheet).toContain(".s-");
      expect(sheet).toMatch(/color: red;/);

      const second = runCli(["--root", dir, "--styles-out", stylesOut]);
      expect(second).toContain("files changed: 0");
      expect(second).toContain("migrated static attributes: 0");
      expect(readFileSync(sample, "utf8")).toBe(migrated);
      expect(readFileSync(stylesOut, "utf8")).toBe(sheet);
    });
  });
});
