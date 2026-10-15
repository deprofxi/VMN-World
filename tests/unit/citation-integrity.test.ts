/**
 * TSK-39 (CA-22) box 3: a citation to a file or section that does not exist must
 * fail the build.
 *
 * The register's own history shows why prose cannot carry this: confident
 * locators were published for files nobody ever opened (`tasks.md:1416`'s
 * withdrawal, the `taskss.md` phantom, the §9 `p1-router-suites` pin that has
 * never existed in git). Those were caught by reading. This file catches them by
 * running, so a new phantom cannot reach a reviewer's eyes as a fact.
 *
 * Two rules, deliberately different in strength:
 *
 * 1. ZERO TOLERANCE on repository paths. A path-shaped citation must resolve on
 *    this tree. The only escape is the literal annotation `citation:absent`,
 *    which a human wrote on that line to say the path is planned, withdrawn or
 *    deliberately historical — the annotation is the audit trail, not a waiver.
 * 2. RATCHETS on locator classes that need a business decision to clear
 *    (which real CCPP section a decimal claim belongs to, whether `AGENTS.md`
 *    is a rename of `CLAUDE.md`, whether the missing authorities get imported).
 *    Those counts may not grow; each run prints the census so the next reader
 *    sees the number, not this comment.
 *
 * Scope is `src/`, `tests/`, `docs/`, `scripts/` and `tasks.md`. `report.md` and
 * `audit.md` are deliberately outside it: they are the audit's own transcripts,
 * and rewriting them to satisfy a present-tense rule would edit the finding out
 * of the record that raised it.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const SKIP_DIRS = new Set(["node_modules", "dist", ".git"]);
const ROOT_DIRS = ["src", "tests", "docs", "scripts"];
/** Repository-root prefixes a citation may legitimately start with. */
const PATH_ROOTS = ["src", "tests", "docs", "scripts", "prisma", "docker", "pages"];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const p = path.join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|mjs|cjs|md|json|yml|yaml)$/.test(entry)) out.push(p);
  }
  return out;
}

/**
 * Live files only. The dated artifacts under `docs/audit/evidence/` are
 * transcripts of what was measured on a given day: rewriting them to satisfy a
 * present-tense rule would falsify the evidence they record (the same exclusion
 * TSK-40 applied to `DT-*` keys).
 */
function liveFiles(): string[] {
  const out: string[] = [];
  for (const d of ROOT_DIRS) out.push(...walk(path.join(ROOT, d)));
  out.push(path.join(ROOT, "tasks.md"));
  return out
    .filter((f) => !f.includes(path.join("docs", "audit", "evidence")))
    .filter((f) => path.basename(f) !== "citation-integrity.test.ts")
    .filter((f) => existsSync(f));
}

const rel = (p: string) => path.relative(ROOT, p).split(path.sep).join("/");

const read = (p: string) => readFileSync(p, "utf8");

/** `docs/foo/bar.md` style tokens, including `{a,b}` brace alternations. */
const PATH_TOKEN = new RegExp(
  "(?:^|[\\s\\x60~()|[\\]{}<>\"',;:])((?:" + PATH_ROOTS.join("|") + ")/[A-Za-z0-9_.\\-/{}]*\\.(?:md|ts|tsx|js|mjs|json|yml|yaml|sql|prisma|sh|pdf|html))\\b",
  "g"
);

function expandBraces(token: string): string[] {
  const m = token.match(/\{([^}]*)\}/);
  if (!m) return [token];
  const out: string[] = [];
  for (const alt of m[1].split(",")) out.push(...expandBraces(token.replace(m[0], alt)));
  return out.slice(0, 16);
}

/** An ellipsis/glob token is a pattern, not a claim that one file exists. */
function isPattern(token: string): boolean {
  return /[…*\\]|\$/.test(token) || token.includes("**");
}

/** The annotation that makes a deliberately-absent path auditable rather than wrong. */
const ABSENT_MARK = "citation:absent";

type Site = { file: string; line: number; text: string };

function eachLine(files: string[]): Site[] {
  const sites: Site[] = [];
  for (const f of files) {
    read(f)
      .split("\n")
      .forEach((text, i) => sites.push({ file: rel(f), line: i + 1, text }));
  }
  return sites;
}

/** The line below is searched too: register table cells wrap. */
function annotated(files: string[], site: Site): boolean {
  const abs = path.join(ROOT, site.file);
  const lines = read(abs).split("\n");
  return `${site.text} ${lines[site.line] ?? ""}`.includes(ABSENT_MARK);
}

// ---------------------------------------------------------------------------
// Ratchet ceilings. Each is the census this file measured on 2026-10-15; the
// numbers are printed on every run so a reader never has to trust the constant.
// ---------------------------------------------------------------------------

/** `CCPP §2.2`-style decimal locators. The CCPP has no decimal sections. */
const CCPP_DECIMAL_CEILING = 29;
/** Citations of authority documents that are not in `docs/authorities/`. */
const MISSING_AUTHORITY_CEILING = 28;
/** `AGENTS.md` — this repository's constitution is `CLAUDE.md` (TSK-39 owner decision). */
const AGENTS_MD_CEILING = 10;
/** `todo.md` — the retired register, recoverable by `git show HEAD:todo.md` (TSK-07). */
const TODO_MD_CEILING = 45;

const MISSING_AUTHORITIES = [
  "VMNL-AZP-VMN-UIUX-001",
  "VMNL-AZP-VMN-UIUX-CCPP-001",
  "VMNL-AZP-VMN-UIUX-REG-001",
  "VMNL-AZP-VMN-DESIGN-TASK-001",
  "VMNL-AZP-VMN-CDDS-001",
];

/** Top-level `N. TITLE` section numbers actually present in an authority file. */
function sectionsOf(authority: string): number[] {
  return [...read(path.join(ROOT, "docs/authorities", authority)).matchAll(/^(\d+)\. [A-Z]/gm)].map((m) => +m[1]);
}

const fmt = (sites: Site[]) => sites.map((s) => `${s.file}:${s.line}`).join("\n");

describe("TSK-39 box 3: citation integrity", () => {
  const files = liveFiles();
  const sites = eachLine(files);

  it("cites no repository path that does not exist, unless annotated", () => {
    const dangling: string[] = [];
    let citations = 0;
    for (const site of sites) {
      for (const m of site.text.matchAll(PATH_TOKEN)) {
        const token = m[1];
        if (isPattern(token)) continue;
        for (const candidate of expandBraces(token)) {
          if (isPattern(candidate)) continue;
          citations++;
          if (existsSync(path.join(ROOT, candidate))) continue;
          if (annotated(files, site)) continue;
          dangling.push(`${site.file}:${site.line} → ${candidate}`);
        }
      }
    }
    expect(citations, "the sweep must actually be reading citations").toBeGreaterThan(1000);
    expect(dangling, `un-annotated citations to missing files:\n${dangling.join("\n")}`).toEqual([]);
    console.log(`[citation-integrity] ${citations} path citations resolved or annotated`);
  });

  it("fails on a citation to a section number the authority document does not have", () => {
    const prd = new Set(sectionsOf("VMNL-AZP-VMN-BRD-PRD-001-R1.2A.md"));
    const ccpp = new Set(sectionsOf("VMNL-AZP-VMN-CCPP-001-R1.1.md"));
    expect([...ccpp].length, "CCPP top-level sections").toBe(39);
    expect([...prd].length, "PRD top-level sections").toBeGreaterThan(70);

    const outOfRange: string[] = [];
    for (const site of sites) {
      for (const m of site.text.matchAll(/(?:PRD|R1\.2A)[^\n]{0,24}?§\s*(\d+)(?![.\d])/g)) {
        if (!prd.has(+m[1])) outOfRange.push(`${site.file}:${site.line} PRD §${m[1]}`);
      }
      for (const m of site.text.matchAll(/CCPP[^\n]{0,24}?§\s*(\d+)(?![.\d])/g)) {
        if (!ccpp.has(+m[1])) outOfRange.push(`${site.file}:${site.line} CCPP §${m[1]}`);
      }
    }
    expect(outOfRange, `section citations outside the authority's real numbering:\n${outOfRange.join("\n")}`).toEqual([]);
  });

  it("holds the decimal CCPP locator census at its measured ceiling", () => {
    const hits: Site[] = [];
    for (const site of sites) {
      if (/CCPP[^\n]{0,24}?§\s*\d+\.\d+/.test(site.text)) hits.push(site);
    }
    console.log(`[citation-integrity] CCPP decimal locators: ${hits.length} sites (ceiling ${CCPP_DECIMAL_CEILING})`);
    expect(hits.length, "CCPP §N.M sites may not grow; clearing them is TSK-39 box 2").toBeLessThanOrEqual(
      CCPP_DECIMAL_CEILING
    );
    // Every one of them names a section that exists; the decimal, not the number, is the phantom.
    const ccpp = new Set(sectionsOf("VMNL-AZP-VMN-CCPP-001-R1.1.md"));
    for (const hit of hits) {
      for (const m of hit.text.matchAll(/CCPP[^\n]{0,24}?§\s*(\d+)\.\d+/g)) {
        expect(ccpp.has(+m[1]), `${hit.file}:${hit.line} names CCPP §${m[1]}, which does not exist either`).toBe(true);
      }
    }
  });

  it("holds the missing-authority and renamed-authority censuses at their ceilings", () => {
    const count = (predicate: (text: string) => boolean) => sites.filter((s) => predicate(s.text));

    const authorities = count((t) => MISSING_AUTHORITIES.some((code) => t.includes(code)));
    const agents = count((t) => /AGENTS\.md/.test(t));
    const todo = count((t) => /(^|[^\w/.-])todo\.md/.test(t));

    console.log(
      `[citation-integrity] missing authorities ${authorities.length}/${MISSING_AUTHORITY_CEILING}, ` +
        `AGENTS.md ${agents.length}/${AGENTS_MD_CEILING}, ` +
        `todo.md (the retired register, superseded by this one) ${todo.length}/${TODO_MD_CEILING}`
    );

    expect(authorities.length, `authority codes with no file in docs/authorities/:\n${fmt(authorities)}`).toBeLessThanOrEqual(
      MISSING_AUTHORITY_CEILING
    );
    expect(agents.length, "AGENTS.md sites: this repository's constitution is CLAUDE.md").toBeLessThanOrEqual(
      AGENTS_MD_CEILING
    );
    expect(todo.length, "todo.md is the retired register; see DEC-REGISTER-SURVIVOR-001").toBeLessThanOrEqual(
      TODO_MD_CEILING
    );
  });

  it("keeps every annotation earning its place: it must sit on a genuinely absent path", () => {
    // `citation:absent` claims that a path on that line does not exist. Once the
    // path appears, the annotation is stale, and a stale annotation is worse than
    // none — it would let the next phantom hide behind a mark nobody re-read.
    const orphan: string[] = [];
    let annotatedLines = 0;
    for (const site of sites) {
      if (!site.text.includes(ABSENT_MARK)) continue;
      annotatedLines++;
      const missing = [...site.text.matchAll(PATH_TOKEN)]
        .flatMap((m) => expandBraces(m[1]))
        .filter((c) => !isPattern(c))
        .filter((c) => !existsSync(path.join(ROOT, c)));
      if (missing.length === 0) orphan.push(`${site.file}:${site.line}`);
    }
    expect(annotatedLines, "the register must carry the annotations this test exempts").toBeGreaterThan(4);
    expect(orphan, `citation:absent with no absent path on the line:\n${orphan.join("\n")}`).toEqual([]);
  });
});
