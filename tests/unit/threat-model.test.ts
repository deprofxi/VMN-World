/**
 * TSK-41 box 1: `docs/security/threat-model.md` exists because CCPP §16 demands
 * it, and stays true because this file re-reads it.
 *
 * CCPP-001-R1.1 §16 (docs/authorities/VMNL-AZP-VMN-CCPP-001-R1.1.md) prescribes
 * the deliverable: nineteen scope areas, ten fields identified for every threat,
 * twenty-one explicit test vectors, written to `/docs/security/threat-model.md`,
 * with severe findings enforced server-side rather than hidden in the UI.
 *
 * A document of that shape decays silently — an area dropped, a field left out,
 * a vector marked covered when no test exercises it, a `file:line` that moves.
 * Each of those is asserted here against the authority's own lists, which are
 * parsed from the CCPP text rather than restated, so the document cannot satisfy
 * a copy of the requirement that drifts from the requirement.
 */

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const MODEL = "docs/security/threat-model.md";
const CCPP = "docs/authorities/VMNL-AZP-VMN-CCPP-001-R1.1.md";

const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

/** The §16 slice of the CCPP, bounded by its own section numbers. */
function ccppSection16(): string {
  const lines = read(CCPP).split("\n");
  const start = lines.findIndex((l) => /^16\. THREAT MODEL PROMPT/.test(l));
  const end = lines.findIndex((l, i) => i > start && /^17\. /.test(l));
  expect(start, "CCPP §16 must exist to be modelled").toBeGreaterThanOrEqual(0);
  expect(end, "CCPP §17 must exist to bound §16").toBeGreaterThan(start);
  return lines.slice(start, end).join("\n");
}

/**
 * §16 writes each list as `item;` lines whose final entry closes with `.`.
 * A `;$`-only parser silently drops that entry, so the parser would assert a
 * shorter list than the authority carries and the document could pass while
 * missing an area or a vector.
 */
const LIST_ITEM = /^([A-Za-z][A-Za-z+ ./-]{2,60})[.;]$/gm;

/** `<scope>` items, parsed from the authority rather than copied into this test. */
function scopeAreas(): string[] {
  const block = ccppSection16();
  const body = block.slice(block.indexOf("<scope>"), block.indexOf("</scope>"));
  return [...body.matchAll(LIST_ITEM)]
    .map((m) => m[1].trim())
    .filter((a) => a.toLowerCase() !== "include");
}

/** The "Explicitly test for:" list. */
function explicitVectors(): string[] {
  const block = ccppSection16();
  const body = block.slice(block.indexOf("Explicitly test for:"), block.indexOf("</method>"));
  return [...body.matchAll(LIST_ITEM)].map((m) => m[1].trim());
}

/** The ten fields §16 requires for every threat. */
const REQUIRED_FIELDS = [
  "Asset",
  "Attacker",
  "Attack path",
  "Impact",
  "Current control",
  "Control gap",
  "Severity",
  "Mitigation",
  "Test",
  "Owner",
];

/**
 * Symbol anchors, scanned line by line.
 *
 * The model cites in two shapes — `src/core/rbac/index.ts:80` (`ROLE_PERMISSIONS`)
 * and the bare continuation `:521` (`canPerform`) — and the bare shape carries the
 * file from the explicit pin before it on the same line. Checking only the explicit
 * shape would leave most of the document's pins unverified.
 */
const PIN =
  /(?:`([\w./-]+\.(?:ts|tsx|js|mjs|json|md|prisma|yml)):(\d+)(?:-\d+)?`|`:(\d+)(?:-\d+)?`)(?:\s*\(`([A-Za-z_$][A-Za-z0-9_$.]{2,})`\))?/g;

function symbolAnchors(doc: string): { file: string; line: number; symbol: string }[] {
  const found: { file: string; line: number; symbol: string }[] = [];
  for (const line of doc.split("\n")) {
    let currentFile: string | undefined;
    for (const m of line.matchAll(PIN)) {
      if (m[1]) currentFile = m[1];
      const pin = m[2] ?? m[3];
      if (!currentFile || !m[4] || !pin) continue;
      found.push({ file: currentFile, line: Number(pin), symbol: m[4] });
    }
  }
  return found;
}

const threatBlocks = (doc: string) =>
  [...doc.matchAll(/^#### (TM-[A-Z]+-\d+) · ([^·\n]+)·?([^\n]*)$/gm)].map((m) => {
    const [, id, stride] = m;
    const start = doc.indexOf(m[0]);
    const next = doc.slice(start + m[0].length).match(/^#### |^### |^---$/m);
    const body = doc.slice(start, next ? start + m[0].length + (next.index ?? 0) : undefined);
    return { id, stride: stride.trim(), body };
  });

describe("TSK-41 box 1: the CCPP §16 threat model", () => {
  const doc = read(MODEL);

  it("covers every scope area §16 names", () => {
    const areas = scopeAreas();
    expect(areas.length, "CCPP §16 scope areas parsed from the authority").toBe(19);

    const headings = [...doc.matchAll(/^### 2\.\d+ (.+)$/gm)].map((m) => m[1].trim());
    const missing = areas.filter(
      (area) => !headings.some((h) => h.toLowerCase().startsWith(area.toLowerCase()))
    );
    expect(missing, `§16 scope areas with no register section:\n${missing.join("\n")}`).toEqual([]);
  });

  it("identifies all ten §16 fields for every threat", () => {
    const blocks = threatBlocks(doc);
    expect(blocks.length, "the register must carry real threats, not an empty frame").toBeGreaterThanOrEqual(19);

    const incomplete: string[] = [];
    for (const b of blocks) {
      for (const field of REQUIRED_FIELDS) {
        if (!b.body.includes(`**${field}:**`)) incomplete.push(`${b.id} → ${field}`);
      }
    }
    expect(incomplete, `threats missing a §16 field:\n${incomplete.join("\n")}`).toEqual([]);

    // STRIDE classification is §16's method requirement.
    const strideWords = /^(Spoofing|Tampering|Repudiation|Information disclosure|Denial of service|Elevation of privilege)/;
    const unclassified = blocks.filter((b) => !strideWords.test(b.stride));
    expect(unclassified, `threats outside STRIDE:\n${unclassified.map((b) => b.id).join("\n")}`).toEqual([]);
  });

  it("states a status for every one of §16's explicit test vectors, and earns EXERCISED", () => {
    const vectors = explicitVectors();
    expect(vectors.length, "CCPP §16 explicit vectors parsed from the authority").toBe(21);

    const table = doc.slice(doc.indexOf("## 3. §16 explicit test vectors"));
    expect(table.length, "§3 of the model must exist").toBeGreaterThan(200);

    const rows = [...table.matchAll(/^\|\s*\d+\s*\|\s*([^|]+?)\s*\|\s*`([A-Z_]+)`\s*\|\s*([^|]+?)\s*\|/gm)];
    expect(rows.length, "one status row per vector").toBe(vectors.length);

    const allowed = new Set(["EXERCISED", "PARTIAL", "NOT_EXERCISED"]);
    const named = rows.map((r) => r[1].trim().toLowerCase());
    const missing = vectors.filter((v) => !named.includes(v.toLowerCase()));
    expect(missing, `vectors with no status row:\n${missing.join("\n")}`).toEqual([]);

    // The prose census under this table must be the table's own numbers. It was
    // written wrong once (six PARTIAL where the rows count ten), which is exactly
    // the decay a document that describes itself is supposed to catch.
    const tally = (status: string) => rows.filter((r) => r[2] === status).length;
    const severityTally = (level: string) =>
      [...doc.matchAll(/\*\*Severity:\*\* (\w+)/g)].filter((m) => m[1] === level).length;
    expect(doc, "§3's sentence must state the measured vector tally").toContain(
      `Four vectors are \`NOT_EXERCISED\`, ten are honest \`PARTIAL\` and seven are \`EXERCISED\``
    );
    expect(tally("NOT_EXERCISED"), "the sentence says four").toBe(4);
    expect(tally("PARTIAL"), "the sentence says ten").toBe(10);
    expect(tally("EXERCISED"), "the sentence says seven").toBe(7);
    expect(
      doc.includes(`${severityTally("High")} High, ${severityTally("Medium")} Medium, ${severityTally("Low")} Low`),
      "§3 must state the measured severity census"
    ).toBe(true);

    for (const [, label, status, evidence] of rows) {
      expect(allowed.has(status), `${label}: unknown status ${status}`).toBe(true);
      if (status !== "EXERCISED") continue;
      // An instrument is a spec or a harness under tests/ — the durable-restart
      // reader is a .mjs that a second OS process runs, and it is what proves
      // the replay vector, so refusing to count it would be a naming test.
      const tests = [...evidence.matchAll(/((?:tests|scripts)\/[\w./-]+\.(?:ts|mjs|js))/g)].map((m) => m[1]);
      expect(tests.length, `${label}: EXERCISED must name a test file`).toBeGreaterThan(0);
      for (const t of tests) {
        expect(existsSync(path.join(ROOT, t)), `${label}: ${t} does not exist`).toBe(true);
      }
    }
  });

  it("cites only code that is on this tree, at the line it names", () => {
    const citations = [...doc.matchAll(/`([\w./-]+\.(?:ts|tsx|js|mjs|json|md|prisma|yml)):(\d+)(?:-(\d+))?`/g)];
    expect(citations.length, "the model is built from code citations").toBeGreaterThan(60);

    const bad: string[] = [];
    for (const m of citations) {
      const file = m[1];
      const token = `${file}:${m[2]}${m[3] ? `-${m[3]}` : ""}`;
      const abs = path.join(ROOT, file);
      if (!existsSync(abs)) {
        bad.push(`${token} — file absent`);
        continue;
      }
      const lines = read(file).split("\n");
      const first = Number(m[2]);
      const last = Number(m[3] ?? m[2]);
      if (first < 1 || last > lines.length) {
        bad.push(`${token} — file has ${lines.length} lines`);
        continue;
      }
      if (lines.slice(first - 1, last).every((l) => l.trim() === "")) {
        bad.push(`${token} — cited span is blank`);
      }
    }
    expect(bad, `citations that do not resolve:\n${bad.join("\n")}`).toEqual([]);
  });

  it("checks the symbol a citation names, not merely that the line is non-blank", () => {
    // Rule 9's own lesson: a stale-but-in-range pin passes a line-exists check.
    // Where the model writes `path:NN` (`Symbol`), the symbol must be near NN.
    const pairs = symbolAnchors(doc);
    expect(pairs.length, "symbol-anchored citations").toBeGreaterThanOrEqual(40);

    const drifted: string[] = [];
    for (const { file, line, symbol } of pairs) {
      const lines = read(file).split("\n");
      const window = lines.slice(Math.max(0, line - 4), line + 3).join("\n");
      if (!window.includes(symbol)) drifted.push(`${file}:${line} no longer holds ${symbol}`);
    }
    expect(drifted, `citation drift:\n${drifted.join("\n")}`).toEqual([]);
  });

  it("enforces server-side: no finding is closed by hiding the surface", () => {
    // §16's output clause, asserted as a property of the document.
    expect(doc).toMatch(/hiding functionality in the UI/i);
    for (const b of threatBlocks(doc)) {
      const mitigation = b.body.match(/\*\*Mitigation:\*\* ([^\n]+)/)?.[1] ?? "";
      expect(
        /hide|disable in the UI|remove the (?:button|link|desk)/i.test(mitigation),
        `${b.id}: mitigation ${b.id} must not be a UI hide`
      ).toBe(false);
    }
  });
});
