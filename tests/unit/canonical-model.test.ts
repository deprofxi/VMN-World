/**
 * TSK-52 — `docs/domain/canonical-model.md` and `docs/domain/data-dictionary.md` are instruments.
 *
 * Both documents publish counts and file:line pointers derived from `prisma/schema.prisma` and `src/`.
 * CA-23 exists because three domain documents described a system none of them had measured, so the
 * reconciliation is recomputed here instead of being asserted in prose: the model census (fields,
 * unique/idx, code access, presence in the intended model document), the enum→model→accessor
 * reachability chain, the Prisma-enum/TypeScript-mirror identity, every §-level count in the data
 * dictionary, and every citation in both files.
 *
 * Deliberately NOT asserted: that a migration applies to a live database (TSK-06, `[B]`), or that a
 * reachable vocabulary is *correct* business vocabulary — that stays with the authority documents.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const MODEL_DOC = "docs/domain/canonical-model.md";
const DICT_DOC = "docs/domain/data-dictionary.md";
const INTENDED_DOC = "docs/domain/master-data-model.md";
const SCHEMA = "prisma/schema.prisma";
const TYPES = "src/core/domain/types.ts";
const SEED = "src/db/migrate-and-seed.ts";

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

/** Same accessor grammar `systems-of-record.test.ts` pins, so the two instruments cannot disagree. */
const ACCESSOR_RE =
  /\b(?:prisma|client|db|tx|getPrismaClient\s*\(\s*\))\s*\.\s*([a-z][A-Za-z0-9_]*)\s*\.\s*(?:createMany|create|updateMany|update|upsert|deleteMany|delete|findMany|findFirst|findUnique|count|aggregate|groupBy)\b/g;

const lowerFirst = (name: string): string => name[0].toLowerCase() + name.slice(1);

const schema = read(SCHEMA);

const enumBlocks = [...schema.matchAll(/^enum (\w+) \{([^}]*)\}/gm)].map((m) => ({
  name: m[1],
  members: (m[2].match(/^\s*([A-Z][A-Z0-9_]*)\s*$/gm) ?? []).map((s) => s.trim()),
}));
const ENUM_NAMES = new Set(enumBlocks.map((e) => e.name));

const SCALAR_TYPES = new Set(["String", "Int", "Float", "Decimal", "Boolean", "DateTime", "Json"]);

const modelBlocks = [...schema.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)].map((m) => {
  const body = m[2];
  let fields = 0;
  for (const line of body.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("//") || t.startsWith("@@")) continue;
    const decl = /^\w+\s+([A-Za-z][\w]*)(\?|\[\])?\s*(@|$|\/\/)/.exec(t);
    if (decl && (SCALAR_TYPES.has(decl[1]) || ENUM_NAMES.has(decl[1]))) fields += 1;
  }
  return {
    model: m[1],
    fields,
    uniq: /@unique|@@unique/.test(body),
    idx: (body.match(/@@index/g) ?? []).length,
  };
});

function accessorFiles(): Map<string, Set<string>> {
  const hits = new Map<string, Set<string>>();
  for (const file of tsFiles()) {
    for (const match of read(file).matchAll(ACCESSOR_RE)) {
      if (!hits.has(match[1])) hits.set(match[1], new Set());
      hits.get(match[1])!.add(file);
    }
  }
  return hits;
}

const HITS = accessorFiles();
const touched = (model: string): boolean => HITS.has(lowerFirst(model));
const seedOnly = (model: string): boolean => {
  const files = HITS.get(lowerFirst(model));
  return !!files && [...files].every((f) => f === SEED);
};

/** Models whose field list mentions an enum, per `prisma/schema.prisma`. */
function enumUsage(): Map<string, string[]> {
  const usage = new Map<string, string[]>();
  for (const block of [...schema.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)]) {
    for (const name of ENUM_NAMES) {
      if (new RegExp(`^\\s+\\w+\\s+${name}(\\?|\\[\\])?\\s`, "m").test(block[2])) {
        usage.set(name, [...(usage.get(name) ?? []), block[1]]);
      }
    }
  }
  return usage;
}

/** `| \`Model\` | 9 | yes | 0 | seed | yes |` rows from canonical-model.md §2. */
function modelCensusRows(doc: string): Array<{ model: string; fields: number; uniq: string; idx: number; code: string; inDoc: string }> {
  const section = doc.split("## 2. ")[1].split("\n## ")[0];
  const rows: Array<{ model: string; fields: number; uniq: string; idx: number; code: string; inDoc: string }> = [];
  for (const line of section.split("\n")) {
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length !== 8 || !/^\d+$/.test(cells[2] ?? "")) continue;
    const model = cells[1]?.replace(/`/g, "");
    if (!model || !/^[A-Z]\w+$/.test(model)) continue;
    rows.push({
      model,
      fields: Number(cells[2]),
      uniq: cells[3].replace(/[*`]/g, ""),
      idx: Number(cells[4]),
      code: cells[5].replace(/\*\*|`/g, ""),
      inDoc: cells[6].replace(/\*\*|`/g, ""),
    });
  }
  return rows;
}

/**
 * Citations in `file.ts:NN` form, also accepting `:NN-MM` ranges and `:NN,:MM` continuations.
 * A range checks both endpoints; the instrument's job is to catch a pointer that slid.
 */
function citations(doc: string): Array<{ file: string; line: number }> {
  const out: Array<{ file: string; line: number }> = [];
  for (const match of doc.matchAll(/`([\w./-]+\.(?:ts|prisma)):(\d+)(?:-(\d+))?((?:\s*,\s*:?\d+)*)`/g)) {
    out.push({ file: match[1], line: Number(match[2]) });
    if (match[3]) out.push({ file: match[1], line: Number(match[3]) });
    for (const extra of (match[4] ?? "").matchAll(/(\d+)/g)) out.push({ file: match[1], line: Number(extra[1]) });
  }
  return out;
}

function resolveCitedFile(file: string): string | null {
  for (const candidate of [file, `src/${file}`, `docs/${file}`, `prisma/${file}`]) {
    const abs = path.join(REPO_ROOT, candidate);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return candidate;
  }
  return null;
}

/** Count `@default("UPPER")` string columns as `{model, column, value, line}`. */
function stringDefaultColumns(): Array<{ model: string; column: string; value: string; line: number }> {
  const out: Array<{ model: string; column: string; value: string; line: number }> = [];
  let model = "";
  const lines = schema.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = /^model (\w+)/.exec(lines[i]);
    if (m) model = m[1];
    const d = /^\s+(\w+)\s+String\s+@default\("([A-Z][A-Z0-9_]{2,})"\)/.exec(lines[i]);
    if (d) out.push({ model, column: d[1], value: d[2], line: i + 1 });
  }
  return out;
}

/** Decimal money columns split by whether the name states its unit. */
function moneyColumns(): { all: string[]; unitNamed: string[]; unitless: string[] } {
  const all: string[] = [];
  for (const line of schema.split("\n")) {
    const d = /^\s+(\w+)\s+Decimal\b/.exec(line);
    if (d) all.push(d[1]);
  }
  const unitNamed = all.filter((n) => /Ngn$|Kobo$/.test(n));
  return { all, unitNamed, unitless: all.filter((n) => !/Ngn$|Kobo$/.test(n)) };
}

const INTENDED = read(INTENDED_DOC);
const dict = read(DICT_DOC);
const modelDoc = read(MODEL_DOC);

describe("canonical-model.md §1–§3: the census the reconciliation is built on", () => {
  it("publishes exactly the declared models, with the field/unit/index counts the schema has", () => {
    const rows = modelCensusRows(modelDoc);
    expect(rows.map((r) => r.model)).toEqual(modelBlocks.map((b) => b.model));

    const wrong: string[] = [];
    for (const row of rows) {
      const block = modelBlocks.find((b) => b.model === row.model)!;
      if (block.fields !== row.fields) wrong.push(`${row.model}: fields ${block.fields} ≠ ${row.fields}`);
      if ((block.uniq ? "yes" : "none") !== row.uniq) wrong.push(`${row.model}: unique ${block.uniq ? "yes" : "none"} ≠ ${row.uniq}`);
      if (block.idx !== row.idx) wrong.push(`${row.model}: @@index ${block.idx} ≠ ${row.idx}`);
      if (!INTENDED.includes(row.model) && row.inDoc !== "no") wrong.push(`${row.model}: absent from master-data-model.md but row says in-doc`);
      if (INTENDED.includes(row.model) && row.inDoc !== "yes") wrong.push(`${row.model}: present in master-data-model.md but row says in-doc=no`);
      const expectedCode = !touched(row.model) ? "no" : seedOnly(row.model) ? "seed" : "yes";
      if (row.code !== expectedCode) wrong.push(`${row.model}: code ${expectedCode} ≠ ${row.code}`);
    }
    expect(wrong, "census rows that do not match prisma/schema.prisma or src/").toEqual([]);
    expect(rows).toHaveLength(43);
  });

  it("keeps §1's three headline numbers and §5's in-doc count equal to the table", () => {
    const rows = modelCensusRows(modelDoc);
    const notInDoc = rows.filter((r) => r.inDoc === "no").length;
    const touchedModels = rows.filter((r) => r.code !== "no").length;
    const seedModels = rows.filter((r) => r.code === "seed").length;

    expect(rows).toHaveLength(43);
    expect(touchedModels).toBe(30);
    expect(touchedModels - seedModels).toBe(26);
    expect(notInDoc).toBe(29);
    expect(modelDoc).toContain("| **43** |");
    expect(modelDoc).toContain("| **30** |");
    expect(modelDoc).toContain("| **29** |");
  });

  it("derives §3's enum reachability from the schema and the accessor census", () => {
    const usage = enumUsage();
    const section = modelDoc.split("## 3. ")[1].split("\n## ")[0];
    for (const block of enumBlocks) {
      const row = section.split("\n").find((l) => l.includes(`| \`${block.name}\` |`));
      expect(row, `${block.name} must have a §3 row`).toBeTruthy();
      const models = usage.get(block.name) ?? [];
      expect(models.length, `${block.name} should be referenced by at least one model`).toBeGreaterThan(0);

      const reachable = models.some((m) => touched(m));
      const cell = row!.split("|").map((c) => c.trim());
      const claimsReachable = !/\*\*no\*\*/.test(cell[4] ?? "");
      expect(claimsReachable, `${block.name}: §3 reachability ≠ derived reachability over ${models.join("/")}`).toBe(reachable);
      expect(Number(cell[2])).toBe(block.members.length);
      for (const m of models) expect(cell[3], `${block.name} §3 must name referencing model ${m}`).toContain(m);
    }
  });
});

describe("data-dictionary.md §1–§3: the five vocabularies", () => {
  it("counts enums, members and enum-typed fields as §1 and §2 publish them", () => {
    const memberTotal = enumBlocks.reduce((s, e) => s + e.members.length, 0);
    const enumTypedFields = (
      schema.match(/^[ \t]+\w+[ \t]+(?:KycStatus|UserStatus|OrgType|TalentTier|ProjectStatus|ContractStatus|RightsType|SettlementStatus|EvidenceType|AgentStatus)\b/gm) ?? []
    ).length;
    expect(enumBlocks.length).toBe(10);
    expect(memberTotal).toBe(44);
    expect(enumTypedFields).toBe(12);
    expect(dict).toContain("**10 enums / 44 members / 12 fields**");
  });

  it("asserts every Prisma enum is mirrored verbatim as a TypeScript union", () => {
    const typesSrc = read(TYPES).replace(/\n\s*\|\s*/g, " | ");
    for (const block of enumBlocks) {
      const re = new RegExp(`export type ${block.name} = ([^;]+);`);
      const mirror = re.exec(typesSrc);
      expect(mirror, `${block.name} has no TS mirror in ${TYPES}`).toBeTruthy();
      const ts = [...(mirror![1].match(/"([A-Z0-9_]+)"/g) ?? [])].map((s) => s.replace(/"/g, ""));
      expect(ts.sort(), `${block.name} mirror members drifted from the Prisma enum`).toEqual([...block.members].sort());
    }
  });

  it("republishes §3's table of state-carrying bare String columns", () => {
    const measured = stringDefaultColumns();
    expect(measured.length).toBe(11);
    const section = dict.split("## 3. ")[1].split("\n## ")[0];
    for (const col of measured) {
      const row = section
        .split("\n")
        .find((l) => l.includes(`| \`${col.model}\` | \`${col.column}\` (\`prisma/schema.prisma:${col.line}\`)`));
      expect(row, `§3 must carry ${col.model}.${col.column} at schema line ${col.line}`).toBeTruthy();
      expect(row, `§3 ${col.model}.${col.column} default`).toContain(`"${col.value}"`);
    }
    const stateShaped = measured.filter((c) => !/currency/i.test(c.column));
    expect(stateShaped.map((c) => c.value).sort()).toEqual(["BOOKED", "DRAFT", "EXPORT", "ISSUED", "RECEIVED", "UNMATCHED"]);
    expect(dict).toContain("| **11 columns** |");
  });

  it("counts the state-shaped TypeScript unions §1 publishes", () => {
    const names = new Set<string>();
    let members = 0;
    for (const file of tsFiles()) {
      for (const m of read(file).matchAll(/export type (\w*(?:Status|Stage|State|Kind|Type|Result)\w*)\s*=\s*([^;]+);/g)) {
        const lits = (m[2].match(/"[A-Z][A-Z0-9_]*"/g) ?? []).length;
        if (!lits) continue;
        names.add(m[1]);
        members += lits;
      }
    }
    expect(names.size).toBe(49);
    expect(members).toBe(227);
    expect(dict).toContain("**49 distinct state-shaped union names / 227 members**");
  });
});

describe("data-dictionary.md §4–§7: money, time, identifiers, codes", () => {
  it("keeps §4's money facts: kobo helpers at the cited lines and the 23/13/10 column split", () => {
    for (const [fn, line] of [
      ["export type Kobo", 243],
      ["export function toKobo", 245],
      ["export function isWholeKobo", 255],
      ["export function requireKoboExact", 265],
      ["export function fromKobo", 279],
      ["export function parseDecimalToKobo", 283],
    ] as Array<[string, number]>) {
      expect(read(TYPES).split("\n")[line - 1], `${fn} must still be at line ${line}`).toContain(fn);
    }
    const money = moneyColumns();
    expect(money.all).toHaveLength(23);
    expect(money.unitNamed.sort()).toEqual([
      "amountNgn",
      "cashCollectedAmountNgn",
      "depositAmountNgn",
      "financialScopeNgn",
      "invoicedAmountNgn",
      "pricePaidNgn",
      "recognizedRevenueNgn",
      "totalAmountNgn",
      "totalContractValueNgn",
      "totalContractValueNgn",
      "totalCreditNgn",
      "totalDebitNgn",
      "tuitionNgn",
    ]);
    expect(money.unitless).toHaveLength(10);
    expect(dict).toMatch(/\*\*23 such\s+columns\*\*/);
    expect(dict).toContain("**10 do not**");
    expect(schema).not.toMatch(/^\s+\w*(Ngn|Kobo)\w*\s+(Int|Float)\s/m);
    // the seven mandatory separation columns the (dead) validator governs
    expect(schema.split("\n").slice(291, 298).join("\n")).toContain("partnerShareAmount");
    expect(dict).toContain("`prisma/schema.prisma:292-298`");
  });

  it("keeps §5's time counts and §6's identifier counts", () => {
    const all = tsFiles();
    /** Lines containing the needle — the same counting rule `grep -rn … | wc -l` applies in §8. */
    const occurrences = (needle: string): number =>
      all.reduce((sum, f) => sum + read(f).split("\n").filter((l) => l.includes(needle)).length, 0);

    const dateTimes = (schema.match(/^\s+\w+\s+DateTime\b/gm) ?? []).length;
    expect(dateTimes).toBe(110);
    expect((schema.match(/@default\(now\(\)\)/g) ?? []).length).toBe(26);
    expect((schema.match(/@updatedAt/g) ?? []).length).toBe(18);
    // PR-08: re-measured 2026-10-16. The object-storage readiness probe signs its
    // bucket request (SigV4), which needs an AMZ date string and a TTL clock:
    // +1 `new Date()` line, +1 `.toISOString()` line, +2 `Date.now()` lines. The
    // document is updated to the same numbers in the same change.
    // PR-04: re-measured 2026-10-17. The release gate's evidence-freshness policy
    // needs a clock to compare `evaluatedAt` against the policy window:
    // +1 `new Date()` line (src/modules/quality/gates.ts). The document is updated
    // to the same number in the same change.
    expect(occurrences("new Date()")).toBe(258);
    // PR-04: re-measured 2026-10-17 — the signed manifest payload serialises two
    // instants (`signedAt`, `evaluatedAt`) so the signature covers the times it
    // attests: +2 `.toISOString()` lines (src/modules/quality/artifact.ts).
    expect(occurrences(".toISOString()")).toBe(110);
    expect(occurrences("Date.now()")).toBe(134);

    expect((schema.match(/@default\(uuid\(\)\)/g) ?? []).length).toBe(27);
    const uuidSites = occurrences("randomUUID()");
    const uuidFiles = all.filter((f) => read(f).includes("randomUUID()")).length;
    expect(uuidSites).toBe(11);
    expect(uuidFiles).toBe(7);
    expect(dict).toContain("| Application-minted ids | 11 `randomUUID()` call sites across 7 files");

    const blocksWithUnique = modelBlocks.filter((b) => b.uniq).length;
    expect(blocksWithUnique).toBe(26);
    expect(dict).toContain("**26 of 43**");
    // The TSK-17 block adds 11 models whose primary key *is* the minted domain id,
    // so they declare no second unique constraint by design; TSK-60's `SalesDealRecord`
    // follows the same convention (`id` is the minted `SD-*` deal id).
    expect(modelBlocks.filter((b) => !b.uniq).map((b) => b.model).sort()).toEqual([
      "ApprovalItem",
      "AsRunLogRecord",
      "AuditLog",
      "AzeeboDestination",
      "BankStatementRecord",
      "ContentItemRecord",
      "Evidence",
      "IdempotencyRecord",
      "IssueRecord",
      "JournalEntryRecord",
      "MediaAssetRecord",
      "PrivacySecurityCase",
      "RightsRecord",
      "RiskRecord",
      "SalesDealRecord",
      "SessionRecord",
      "SponsorBindingRecord",
    ]);
  });

  it("recounts §7's two code conventions and the three schedule counting rules", () => {
    const all = tsFiles();
    const tags = new Set<string>();
    const occurrences = { n: 0 };
    for (const f of all) {
      for (const m of read(f).matchAll(/\[([A-Z]{2,12}-[A-Z0-9]{2,12}-[0-9]{2,4})\]/g)) {
        tags.add(m[1]);
        occurrences.n += 1;
      }
    }
    const families = new Set([...tags].map((t) => t.split("-")[0]));
    expect(tags.size).toBe(184);
    expect(families.size).toBe(24);
    expect(occurrences.n).toBe(194);
    expect(dict).toContain("**184 distinct across 24 families**");

    const apiCodes = new Set<string>();
    for (const f of all) {
      for (const m of read(f).matchAll(/code:\s*"([A-Z][A-Z0-9_]{3,60})"/g)) apiCodes.add(m[1]);
    }
    // PR-09: re-measured 2026-10-16 — the tenant-scope refusal added one
    // machine-readable code (`TENANT_SCOPE_DENIED`, src/api/router.ts:787).
    // PR-04: re-measured 2026-10-17 — the release gate returns four
    // evidence-finding codes (`MISSING_EVIDENCE`, `UNRESOLVED_EVIDENCE_PATH`,
    // `PROSE_ONLY_EVIDENCE`, `STALE_EVIDENCE`; src/modules/quality/gates.ts), so
    // the set is 117 and the dictionary carries the same number.
    expect(apiCodes.size).toBe(117);
    expect([...apiCodes]).toEqual(expect.arrayContaining(["NXTR", "ORIS", "IMBD"]));

    const versions = read("src/modules/broadcast/versions/index.ts");
    const bare = new Set([...versions.matchAll(/SCHED-[A-Z0-9]+-[0-9]+/g)].map((m) => m[0]));
    const bracketed = new Set([...versions.matchAll(/\[SCHED-[A-Z0-9]+-[0-9]+\]/g)].map((m) => m[0].slice(1, -1)));
    expect(bare.size).toBe(48);
    expect(bracketed.size).toBe(39);
    expect(dict).toContain("48 distinct bare `SCHED-*` identifiers");
    expect(bare.has("SCHED-VAL-05")).toBe(false);
    expect(bare.has("SCHED-REC-03")).toBe(false);
  });
});

describe("both reconciliation documents cite files that exist and lines that carry what they print", () => {
  const docs = [modelDoc, dict];

  it("opens every file:line citation", () => {
    const unresolved: string[] = [];
    let total = 0;
    for (const doc of docs) {
      for (const { file, line } of citations(doc)) {
        total += 1;
        const rel = resolveCitedFile(file);
        if (!rel) {
          unresolved.push(`${file} (no such file)`);
          continue;
        }
        const lines = read(rel).split("\n");
        if (line > lines.length || lines[line - 1].trim() === "") {
          unresolved.push(`${rel}:${line} (out of range or blank)`);
        }
      }
    }
    expect(total, "the two documents must keep carrying citations").toBeGreaterThan(70);
    expect(unresolved, "citations that do not resolve to a non-blank line").toEqual([]);
  });

  it("checks a cited line actually names the symbol printed beside it", () => {
    const wrong: string[] = [];
    for (const doc of docs) {
      for (const match of doc.matchAll(/`([\w./-]+\.(?:ts|prisma)):(\d+)(?:-(\d+))?` `([A-Za-z_]\w*)`/g)) {
        const [, file, lineRaw, , symbol] = match;
        const rel = resolveCitedFile(file);
        expect(rel, `${file} must exist`).toBeTruthy();
        const start = Number(lineRaw) - 1;
        const window = read(rel as string).split("\n").slice(start, start + 3).join("\n");
        if (!window.includes(symbol)) wrong.push(`${rel}:${lineRaw} does not contain '${symbol}'`);
      }
    }
    expect(wrong, "cited lines that do not carry the symbol the document prints beside them").toEqual([]);
  });

  it("keeps the register rows the documents point at real", () => {
    const tasks = read("tasks.md");
    for (const tsk of [...dict.matchAll(/\bTSK-\d{2}\b/g), ...modelDoc.matchAll(/\bTSK-\d{2}\b/g)].map((m) => m[0])) {
      expect(tasks, `${tsk} is cited by a domain document but is not in the register`).toContain(`#### ${tsk} ·`);
    }
    for (const doc of docs) {
      for (const rel of [...doc.matchAll(/`((?:src|tests|docs|prisma|scripts)\/[\w./-]*\w\.(?:ts|md|sql))`/g)].map((m) => m[1])) {
        expect(fs.existsSync(path.join(REPO_ROOT, rel)), `${rel} must exist`).toBe(true);
      }
    }
  });
});
