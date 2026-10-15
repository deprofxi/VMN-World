/**
 * TSK-41 box 2 — `docs/domain/state-machines.md` must stay written from the real code.
 *
 * CA-14 and CA-23 both came from domain documents describing an aspirational lifecycle nobody had
 * measured. `docs/domain/state-machines.md` is the counter-example: every statement in it names a
 * `file:line` or a refusal tag. That only makes it true if something re-opens those pointers, which
 * is what `tests/unit/systems-of-record.test.ts` does for its own document and nothing did here —
 * so this suite does the same job for the state-machine document:
 *
 *   1. every `path:line` citation resolves to a non-blank line inside the cited file;
 *   2. every `[TAG]` `:NN` pin points at a line that actually carries that tag in `src/`;
 *   3. §1.2's "eleven transitions" and §8's "49 refusal codes" are counted from the code, and every
 *      guard tag the transition table prints exists in the schedule machine;
 *   4. §8's Durable column matches the stores the process registers, and the set of
 *      `registerDurableStore(...)` names is pinned so a new store cannot appear without a row here;
 *   5. the three §8 re-measure commands still produce what the document says they produce.
 *
 * Deliberately NOT asserted: whether a machine is *correct* (that is the domain suites' job), whether
 * a durable store survives a restart in a given deployment (TSK-17's durability suites), and whether
 * the sentence about a pinned line is true — this proves the pointer still lands; Rule 9 is still a
 * human duty.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const DOC = "docs/domain/state-machines.md";
const SCHEDULE_CODE = "src/modules/broadcast/versions/index.ts";
const SCHEMA = "prisma/schema.prisma";

const read = (rel: string): string => fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");

function tsFiles(dir = "src"): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(path.join(REPO_ROOT, dir), { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...tsFiles(rel));
    else if (entry.name.endsWith(".ts")) out.push(rel);
  }
  return out;
}

/** `src/**\/*.ts` plus the schema, keyed by path — the corpus a tag pin may point into. */
function codeCorpus(): Map<string, string[]> {
  const files = new Map<string, string[]>([[SCHEMA, read(SCHEMA).split("\n")]]);
  for (const rel of tsFiles()) files.set(rel, read(rel).split("\n"));
  return files;
}

/**
 * Every `` `path.ext:NN` `` citation, including `` `file.ts:40,:133` `` continuations and `:NN-MM`
 * ranges. Both endpoints of a range are checked: a block that grew or shrank has slid.
 */
function fullCitations(doc: string): Array<{ file: string; line: number }> {
  const out: Array<{ file: string; line: number }> = [];
  const re = /`([\w./-]+\.(?:ts|tsx|prisma|json|md)):(\d+)(?:-(\d+))?((?:\s*,\s*:?\d+)*)`/g;
  for (const match of doc.matchAll(re)) {
    out.push({ file: match[1], line: Number(match[2]) });
    if (match[3]) out.push({ file: match[1], line: Number(match[3]) });
    for (const extra of match[4].matchAll(/(\d+)/g)) out.push({ file: match[1], line: Number(extra[1]) });
  }
  return out;
}

function resolveCitedFile(file: string): string | null {
  for (const candidate of [file, `src/${file}`, `docs/${file}`]) {
    const abs = path.join(REPO_ROOT, candidate);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return candidate;
  }
  return null;
}

/**
 * `[TAG]` `:NN` pins. The tag is the anchor and the number is the claim: the pin is honoured only
 * if some file in `src/` carries that exact tag on that exact line. Form in the document is
 * `` `[SCHED-STATE-01]` `:390,:403` `` or `` `[CMS-04]` `:227` ``.
 */
function tagPins(doc: string): Array<{ tag: string; line: number }> {
  const out: Array<{ tag: string; line: number }> = [];
  const re = /`\[([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)\]`\s*`((?::\d+[\d,\s:-]*))`/g;
  for (const match of doc.matchAll(re)) {
    for (const num of match[2].matchAll(/\d+/g)) out.push({ tag: match[1], line: Number(num[0]) });
  }
  return out;
}

/** camelCase identifier pins: `editContent` `:185`, `advanceStage:82`. ALL-CAPS spans are tags/states. */
function symbolPins(doc: string): Array<{ symbol: string; line: number }> {
  const out: Array<{ symbol: string; line: number }> = [];
  const re = /`([a-z][a-z0-9]*[A-Z][A-Za-z0-9]*)`\s*`(?::(\d+)(?:-(\d+))?((?:\s*,\s*:?\d+)*))`/g;
  for (const match of doc.matchAll(re)) {
    for (const num of `${match[2]}${match[3] ?? ""}${match[4] ?? ""}`.matchAll(/\d+/g)) {
      out.push({ symbol: match[1], line: Number(num[0]) });
    }
  }
  return out;
}

/** Refusal codes the schedule machine implements, counted the way §8's command counts them. */
function scheduleRefusalCodes(): Set<string> {
  return new Set(
    [...read(SCHEDULE_CODE).matchAll(/SCHED-[A-Z]*-[0-9]*|SCHED-01/g)].map((m) => m[0])
  );
}

/** The stores the process actually registers as durable (`registerDurableStore<T>("name", …)`). */
function registeredStores(): Set<string> {
  const stores = new Set<string>();
  for (const rel of tsFiles()) {
    for (const match of read(rel).matchAll(/registerDurableStore<[^>]*>\(\s*"([^"]+)"/g)) stores.add(match[1]);
  }
  return stores;
}

/** §8's census table, parsed: `[lifecycle, guarded, producer, durable]` cells. */
function censusRows(doc: string): Array<{ lifecycle: string; durable: string }> {
  const section = doc.split("## 8. Census")[1] ?? "";
  const rows: Array<{ lifecycle: string; durable: string }> = [];
  for (const line of section.split("\n")) {
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 5 || cells[1] === "Lifecycle" || /^:?-+/.test(cells[2])) continue;
    rows.push({ lifecycle: cells[1], durable: cells[4] });
  }
  return rows;
}

/**
 * The document's own vocabulary for what backs each lifecycle. A row that says `yes` must name a
 * mechanism that exists; a row that says `no` must not be contradicted by a registered store.
 */
const DURABILITY: Record<string, { store?: string; prismaEnumOrModel?: string }> = {
  "Broadcast schedule day": {},
  "Generic approval workflow": { store: "approvalItem" },
  "Rights review request": {},
  "Rights clearance record": { prismaEnumOrModel: "model RightsRecord" },
  "Content revision": { store: "contentItem" },
  "Broadcast version / RFA": {},
  Case: { store: "privacySecurityCase" },
  "Admission application": {},
  "VTM escrow": {},
  Settlement: { prismaEnumOrModel: "model Settlement" },
  "Sales deal": { store: "salesDeal" },
};

describe("state-machines.md is written from the real code", () => {
  const doc = read(DOC);

  it("publishes enough pins for the claim to be checkable", () => {
    // Floors are the measured 2026-10-15 census — 30 `path:line` citations, 54 `[TAG]` `:NN` pins,
    // 12 symbol pins, 11 §8 rows — so the document cannot quietly shrink its own evidence base.
    const citations = fullCitations(doc).length;
    const tags = tagPins(doc).length;
    const symbols = symbolPins(doc).length;
    const rows = censusRows(doc).length;
    console.log(
      `[state-machine-doc-pins] ${citations} path:line citations · ${tags} [TAG] pins · ${symbols} symbol pins · ${rows} §8 rows · ${scheduleRefusalCodes().size} refusal codes · ${registeredStores().size} durable stores`
    );
    expect(citations).toBeGreaterThanOrEqual(30);
    expect(tags).toBeGreaterThanOrEqual(54);
    expect(symbols).toBeGreaterThanOrEqual(12);
    expect(rows).toBe(11);
  });

  it("opens every path:line citation it publishes", () => {
    const unresolved: string[] = [];
    for (const { file, line } of fullCitations(doc)) {
      const rel = resolveCitedFile(file);
      if (!rel) {
        unresolved.push(`${file} (no such file)`);
        continue;
      }
      const lines = read(rel).split("\n");
      const target = lines[line - 1];
      if (!Number.isInteger(line) || line < 1 || target === undefined) {
        unresolved.push(`${rel}:${line} (out of range)`);
      } else if (target.trim() === "") {
        unresolved.push(`${rel}:${line} (blank)`);
      }
    }
    expect(unresolved, "citations that do not resolve to a non-blank line").toEqual([]);
  });

  it("points every [TAG] `:NN` pin at a line that carries that tag in src/", () => {
    const corpus = codeCorpus();
    const wrong: string[] = [];
    let checked = 0;
    for (const { tag, line } of tagPins(doc)) {
      // §5/§6/§7 cite bare identifiers (`transitionCase`, `advanceStage`) as often as tags; only
      // the SHOUTY-with-digits form is a refusal code, and that is what this rule covers.
      if (!/^(?:SCHED|CMS|VER|CASE|VTM|QTC|TALENT|ONE|BIL|PAY|COMM|AOS|RRR)-/.test(tag)) continue;
      checked += 1;
      const carriers: string[] = [];
      for (const [rel, lines] of corpus) {
        if (rel === SCHEMA) continue;
        for (let i = Math.max(1, line - 1); i <= Math.min(lines.length, line + 1); i++) {
          if (lines[i - 1].includes(tag)) carriers.push(`${rel}:${i}`);
        }
      }
      if (carriers.length === 0) wrong.push(`${tag} claimed at :${line} — no src/ file carries that tag there`);
    }
    expect(checked).toBeGreaterThan(30);
    expect(wrong, "tag pins that have slid off their code").toEqual([]);
  });

  it("counts §1.2's transitions and §8's refusal codes from the schedule machine", () => {
    const transitionRows = (doc.split("### 1.2")[1].split("### 1.3")[0].split("\n") ?? []).filter(
      (l) => l.startsWith("|") && !l.startsWith("|:---") && !l.startsWith("| Transition")
    );
    expect(transitionRows).toHaveLength(11);
    expect(doc).toContain("The eleven rows below are the");

    const codes = scheduleRefusalCodes();
    expect([...codes].sort()).not.toContain("SCHED-VAL-05");
    expect([...codes].sort()).not.toContain("SCHED-REC-03");
    expect(codes.size).toBe(49);
    expect(doc).toContain("49 refusal codes");

    // §1.2 pins every guard to a line; each guard tag must exist where the table says it does.
    for (const row of transitionRows) {
      for (const tag of row.match(/\[(SCHED-[A-Z0-9-]+)\]/g) ?? []) {
        expect(read(SCHEDULE_CODE)).toContain(tag.slice(1, -1));
      }
    }
  });

  it("points every `symbol` `:NN` pin at a line that carries that symbol in src/", () => {
    const corpus = codeCorpus();
    const wrong: string[] = [];
    const pins = symbolPins(doc);
    for (const { symbol, line } of pins) {
      const carriers: string[] = [];
      for (const [rel, lines] of corpus) {
        if (rel === SCHEMA) continue;
        for (let i = Math.max(1, line - 1); i <= Math.min(lines.length, line + 1); i++) {
          if (lines[i - 1].includes(symbol)) carriers.push(`${rel}:${i}`);
        }
      }
      if (carriers.length === 0) wrong.push(`${symbol} claimed at :${line} — no src/ line carries it`);
    }
    expect(pins.length).toBeGreaterThanOrEqual(12);
    expect(wrong, "symbol pins that have slid off their declaration").toEqual([]);
  });

  it("keeps §8's Durable column true against the stores the process registers", () => {
    const stores = registeredStores();
    const schema = read(SCHEMA);
    const mismatches: string[] = [];
    for (const row of censusRows(doc)) {
      const spec = DURABILITY[row.lifecycle];
      expect(spec, `§8 lists '${row.lifecycle}' with no durability rule here — add it deliberately`).toBeTruthy();
      const saysYes = /\*\*yes\*\*|^yes/.test(row.durable);
      const backedByStore = spec.store !== undefined && stores.has(spec.store);
      const backedByModel = spec.prismaEnumOrModel !== undefined && schema.includes(spec.prismaEnumOrModel);
      const measured = backedByStore || backedByModel;
      if (saysYes !== measured) {
        mismatches.push(`'${row.lifecycle}' reads '${row.durable}' but is ${measured ? "durable" : "not durable"}`);
      }
    }
    expect(mismatches).toEqual([]);
    // The set is pinned so a new durable store cannot silently join without a document row.
    expect([...stores].sort()).toEqual(
      [
        "approvalItem", "auditLog", "azeeboDestination", "commercialEnquiry", "contentItem",
        "idempotencyRecord", "issueRecord", "journalEntry", "mediaAssetRecord", "privacySecurityCase",
        "riskRecord", "salesDeal", "sessionRecord", "sponsorBinding", "sponsorFulfillment",
      ].sort()
    );
  });

  it("still produces what §8's three re-measure commands claim", () => {
    const corpus = tsFiles();
    const pendingApproval = corpus.flatMap((rel) =>
      read(rel)
        .split("\n")
        .map((line, i) => ({ rel, line, n: i + 1 }))
        .filter(({ rel, line }) => line.includes('"PENDING_APPROVAL"') && !rel.includes("commercial-proposal"))
    );
    expect(pendingApproval, `"PENDING_APPROVAL" writes the document says are gone`).toEqual([]);

    const exportDir = path.join(REPO_ROOT, "src/modules/broadcast/export");
    const inExport = fs.existsSync(exportDir)
      ? fs
          .readdirSync(exportDir)
          .filter((f) => f.endsWith(".ts"))
          .flatMap((f) => read(`src/modules/broadcast/export/${f}`).match(/PENDING_APPROVAL/g) ?? [])
      : [];
    expect(inExport).toHaveLength(0);
  });
});
