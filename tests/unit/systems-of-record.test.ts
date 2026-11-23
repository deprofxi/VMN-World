/**
 * TSK-52 — `docs/domain/systems-of-record.md` is an instrument, not a narrative.
 *
 * The document's whole finding is a count ("27 declared models, 14 touched by code, 10 written at
 * runtime") plus a table of file:line pointers to the store that authoritatively holds each entity.
 * Both are the kind of claim that silently rots: CA-23 exists because three domain documents
 * described a system none of them had measured. So the census is recomputed from `src/` here, and
 * every citation is opened — the document cannot drift from the code without CI failing.
 *
 * Deliberately NOT asserted: whether a migration applies to a real database (TSK-06, `[B]`), or
 * whether any `M`-category store survives a restart in a given deployment. The document says so too.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeSandboxCoverage } from "../../src/core/config/screen-register.js";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const DOC = "docs/domain/systems-of-record.md";
const REGISTER = "docs/decisions/screen-register.json";
const MATRIX = "docs/audit/journey-readiness-matrix.md";
const SCHEMA = "prisma/schema.prisma";
const MIGRATION_DIR = "prisma/migrations";
/** Roots that can carry a Prisma delegate access, including the chained/newline forms. */
const ACCESSOR_RE =
  /\b(?:prisma|client|db|tx|getPrismaClient\s*\(\s*\))\s*\.\s*([a-z][A-Za-z0-9_]*)\s*\.\s*(?:createMany|create|updateMany|update|upsert|deleteMany|delete|findMany|findFirst|findUnique|count|aggregate|groupBy)\b/g;

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

function declaredModels(): string[] {
  return [...read(SCHEMA).matchAll(/^model (\w+)/gm)].map((m) => m[1]);
}

function accessorCounts(): Map<string, number> {
  const counts = new Map<string, number>();
  for (const file of tsFiles()) {
    for (const match of read(file).matchAll(ACCESSOR_RE)) {
      counts.set(match[1], (counts.get(match[1]) ?? 0) + 1);
    }
  }
  return counts;
}

const lowerFirst = (name: string): string => name[0].toLowerCase() + name.slice(1);

/** Section 2's census table: rows of `| # | \`Model\` | accessors | where | kind |`. */
function censusRows(doc: string): Array<{ model: string; claimed: number }> {
  const section = doc.split("## 2. ")[1].split("\n## ")[0];
  const rows: Array<{ model: string; claimed: number }> = [];
  for (const line of section.split("\n")) {
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 5 || !/^\d+$/.test(cells[1] ?? "")) continue;
    const model = cells[2]?.replace(/`/g, "");
    const claimed = cells[3]?.replace(/[^\d]/g, "");
    if (!model || claimed === "" || !/^[A-Z]\w+$/.test(model)) continue;
    rows.push({ model, claimed: Number(claimed) });
  }
  return rows;
}

/**
 * Every `path/file.ts:NN` citation in the document, including `file.ts:40,:133` continuations
 * and `:NN-MM` ranges. A range checks **both** endpoints: a pointer whose block grew or shrank
 * has slid, and the instrument's job is to catch that rather than bless the start line alone.
 */
function citations(doc: string): Array<{ file: string; line: number }> {
  const out: Array<{ file: string; line: number }> = [];
  for (const match of doc.matchAll(/`([\w./-]+\.ts):(\d+)(?:-(\d+))?((?:\s*,\s*:?\d+)*)`/g)) {
    out.push({ file: match[1], line: Number(match[2]) });
    if (match[3]) out.push({ file: match[1], line: Number(match[3]) });
    for (const extra of match[4].matchAll(/(\d+)/g)) out.push({ file: match[1], line: Number(extra[1]) });
  }
  return out;
}

function resolveCitedFile(file: string): string | null {
  const candidates = [file, `src/${file}`, `docs/${file}`];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(REPO_ROOT, candidate)) && fs.statSync(path.join(REPO_ROOT, candidate)).isFile()) {
      return candidate;
    }
  }
  return null;
}

/**
 * §3.3's entity table, parsed. The store cell is `` `file.ts:NN` `symbol` `` sequences, and a
 * family can continue the same file with `` `:NN` `` — both forms become `file.ts:NN` tokens.
 */
function sandboxRows(doc: string): Array<{ entity: string; stores: string[] }> {
  const section = doc.split("### 3.3 Process memory — not persistence")[1].split("**Rows 19-29")[0];
  const rows: Array<{ entity: string; stores: string[] }> = [];
  for (const line of section.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 5 || cells[2].includes("---") || cells[2] === "Store (file:line)") continue;
    let current: string | null = null;
    const stores: string[] = [];
    // A store cell is a run of backtick spans: `` `file.ts:NN` `` starts a file, `` `:MM` ``
    // continues it, `` `file.ts:NN,:MM,:OO` `` does both at once, and a bare `` `symbol` `` is
    // neither. Span-wise scanning keeps all three forms on one rule.
    for (const span of cells[2].matchAll(/`([^`]+)`/g)) {
      const body = span[1];
      const numbers = body.match(/\d+/g) ?? [];
      const fileMatch = body.match(/^([\w./-]+\.ts)/);
      if (fileMatch) current = fileMatch[1];
      if (fileMatch && numbers.length === 0) stores.push(current as string);
      else if (current) for (const n of numbers) stores.push(`${current}:${n}`);
    }
    rows.push({ entity: cells[1], stores: [...new Set(stores)] });
  }
  return rows;
}

describe("systems-of-record.md census", () => {
  it("every declared model has a table in the migration set, and the count matches the document", () => {
    const models = declaredModels();
    const migrations = fs
      .readdirSync(path.join(REPO_ROOT, MIGRATION_DIR), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => `${MIGRATION_DIR}/${d.name}/migration.sql`);
    const tables = new Set(
      migrations.flatMap((file) => [...read(file).matchAll(/CREATE TABLE (?:IF NOT EXISTS )?"(\w+)"/g)].map((m) => m[1]))
    );
    const missing = models.filter((m) => !tables.has(m));
    const docCount = read(DOC).match(/grep -c "\^model " prisma\/schema\.prisma\/?\n# → (\d+)/);

    expect(missing, `models with no CREATE TABLE under ${MIGRATION_DIR}`).toEqual([]);
    expect(models).toHaveLength(45);
    expect(Number(docCount?.[1])).toBe(models.length);
  });

  it("recomputes the per-model accessor counts the census table claims", () => {
    const counts = accessorCounts();
    const rows = censusRows(read(DOC));
    const mismatches = rows.filter((row) => (counts.get(lowerFirst(row.model)) ?? 0) !== row.claimed);

    expect(rows.length, "census table should carry all 32 touched models as individual rows").toBe(32);
    expect(mismatches, "accessor counts that do not match src/").toEqual([]);
  });

  it("names exactly the models with zero accessors as untouched", () => {
    const counts = accessorCounts();
    const doc = read(DOC);
    const zeroRow = doc.split("\n").find((l) => l.includes("| **0** |"));
    expect(zeroRow, "the census must keep a grouped zero-accessor row").toBeTruthy();

    const claimedUntouched = [...new Set((zeroRow as string).match(/`(\w+)`/g)?.map((s) => s.replace(/`/g, "")))];
    const measuredUntouched = declaredModels().filter((m) => !counts.has(lowerFirst(m)));

    expect(claimedUntouched.sort()).toEqual(measuredUntouched.sort());
    expect(measuredUntouched).toHaveLength(13);
  });

  it("opens every file:line citation it publishes", () => {
    const doc = read(DOC);
    const unresolved: string[] = [];
    for (const { file, line } of citations(doc)) {
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
    expect(unresolved, "citations that do not resolve to a non-blank line").toEqual([]);
    expect(citations(doc).length).toBeGreaterThan(40);
  });

  it("checks a cited line actually names the symbol printed next to it", () => {
    const doc = read(DOC);
    const wrong: string[] = [];
    for (const match of doc.matchAll(/`([\w./-]+\.ts):(\d+)` `([A-Za-z_]\w*)`/g)) {
      const [, file, lineRaw, symbol] = match;
      const rel = resolveCitedFile(file);
      expect(rel, `${file} must exist`).toBeTruthy();
      const window = read(rel as string).split("\n").slice(Number(lineRaw) - 1, Number(lineRaw) + 2).join("\n");
      if (!window.includes(symbol)) wrong.push(`${rel}:${lineRaw} does not contain '${symbol}'`);
    }
    expect(wrong, "cited lines that do not carry the symbol the document prints beside them").toEqual([]);
  });

  it("keeps the store inventory counts the document publishes in §3.3 and §6", () => {
    const moduleLevel = /^(?:export )?(?:const|let) [A-Za-z_0-9]+\??\s*(:[^=;]*)?=\s*new (?:Map|Set)/;
    const classField = /^\s+(?:(?:private|public|protected) )?(?:readonly )?[A-Za-z_0-9]+\??\s*(:[^=;]+)?=\s*new (?:Map|Set)/;
    let modules = 0;
    let fields = 0;
    for (const file of tsFiles()) {
      for (const line of read(file).split("\n")) {
        if (moduleLevel.test(line)) modules += 1;
        else if (classField.test(line)) fields += 1;
      }
    }
    const doc = read(DOC);
    expect(doc).toContain(`**${modules}**`);
    expect(doc).toContain(`**${fields}**`);
  });

  // TSK-20: §3.3 is the authority for what is process memory, and the screen register's
  // `sandboxState` block is a copy of it. A copy needs a parity check or it becomes a
  // second, softer truth — which is how CA-12 and CA-23 were written in the first place.
  it("mirrors §3.3 row-for-row into the screen register's sandboxState families", () => {
    const docRows = sandboxRows(read(DOC));
    const register = JSON.parse(read(REGISTER)) as {
      sandboxState?: { families: Array<{ id: string; entity: string; stores: string[]; anchors: string[] }> };
    };
    const families = register.sandboxState?.families ?? [];

    expect(families.length, "one register family per §3.3 row").toBe(docRows.length);
    expect(new Set(families.map((f) => f.id)).size, "family ids must be unique").toBe(families.length);
    expect(families.map((f) => f.entity).sort()).toEqual(docRows.map((r) => r.entity).sort());
    for (const row of docRows) {
      const twin = families.find((f) => f.entity === row.entity);
      expect(twin?.stores.sort(), `${row.entity}: store citations`).toEqual([...row.stores].sort());
    }
    for (const family of families) {
      expect(family.anchors.length, `${family.id}: an unanchored family can label nothing`).toBeGreaterThan(0);
      expect(family.stores.length, `${family.id}: a family with no store is not a §3.3 row`).toBeGreaterThan(0);
    }
  });

  it("labels exactly the register entries whose evidence names a sandbox store", () => {
    const register = JSON.parse(read(REGISTER)) as {
      sandboxState?: { families: Array<{ id: string; stores: string[]; anchors: string[] }> };
      groups: Array<{ entries: Array<{ id: string; evidence: string; dataState?: string; sandboxFamilies?: string[] }> }>;
    };
    const families = register.sandboxState?.families ?? [];

    // Anchors are the only link between a label and the code, so they must resolve.
    const deadAnchors: string[] = [];
    for (const family of families) {
      const storeFiles = [...new Set(family.stores.map((s) => s.split(":")[0]))];
      for (const anchor of family.anchors) {
        if (anchor.includes(".ts")) {
          const [file, lineRaw] = anchor.split(":");
          const rel = resolveCitedFile(file);
          if (!rel) {
            deadAnchors.push(`${family.id}: ${file} (no such file)`);
          } else if (lineRaw) {
            const lines = read(rel).split("\n");
            if (Number(lineRaw) > lines.length || lines[Number(lineRaw) - 1].trim() === "") {
              deadAnchors.push(`${family.id}: ${rel}:${lineRaw} (out of range or blank)`);
            }
          }
        } else if (!storeFiles.some((f) => resolveCitedFile(f) && read(resolveCitedFile(f) as string).includes(anchor))) {
          deadAnchors.push(`${family.id}: '${anchor}' is in none of ${storeFiles.join(", ")}`);
        }
      }
    }
    expect(deadAnchors, "anchors that do not resolve to a real file, line or symbol").toEqual([]);

    const missing: string[] = [];
    const spurious: string[] = [];
    for (const group of register.groups) {
      for (const entry of group.entries) {
        const derived = families.filter((f) => f.anchors.some((a) => entry.evidence.includes(a))).map((f) => f.id);
        const declared = entry.dataState === "sandbox-state" ? entry.sandboxFamilies ?? [] : [];
        if (entry.dataState === "sandbox-state" && derived.length === 0) {
          spurious.push(`${entry.id}: labelled but its evidence names no store`);
        }
        if (derived.length > 0 && entry.dataState !== "sandbox-state") {
          missing.push(`${entry.id}: evidence names ${derived.join(", ")} and carries no label`);
        }
        if (entry.dataState === "sandbox-state" && derived.length > 0) {
          const a = [...declared].sort();
          const b = [...derived].sort();
          if (a.join(",") !== b.join(",")) {
            spurious.push(`${entry.id}: declared [${a.join(", ")}] but evidence anchors to [${b.join(", ")}]`);
          }
        }
      }
    }
    expect(missing, "entries that read a sandbox store without saying so").toEqual([]);
    expect(spurious, "labels the register cannot anchor").toEqual([]);
    const coverage = computeSandboxCoverage();
    const declaredEntries = register.groups
      .flatMap((g) => g.entries)
      .filter((e) => e.dataState === "sandbox-state").length;
    expect(coverage.labelledEntries, "computeSandboxCoverage must agree with the file").toBe(declaredEntries);
    expect(coverage.families).toBe(families.length);
    expect(coverage.labelledIds).toBeGreaterThan(coverage.labelledEntries);
    expect(Object.keys(coverage.byFamily).sort()).toEqual(
      families.filter((f) => coverage.byFamily[f.id] !== undefined).map((f) => f.id).sort()
    );
  });

  // TSK-20's second half: the readiness matrix must carry the same inventory in the same vocabulary,
  // or the two documents become two truths about the same Maps (CA-23's failure mode again).
  it("labels the readiness matrix's Persistence column with §3.3 family ids", () => {
    const matrix = read(MATRIX);
    const register = JSON.parse(read(REGISTER)) as {
      sandboxState?: { families: Array<{ id: string }>; limits?: string };
    };
    const ids = (register.sandboxState?.families ?? []).map((f) => f.id);

    const absent = ids.filter((id) => !matrix.includes(`\`${id}\``));
    expect(absent, "§3.3 families the matrix never names").toEqual([]);

    // The parity table: one row per family, first cell a family id. No invented families either way.
    const section = matrix.split("## §3.3 family → journey parity")[1]?.split("## Human decisions")[0] ?? "";
    const rows = section.split("\n").filter((l) => /^\| `[a-z][a-z0-9-]*` \|/.test(l));
    const named = rows.map((l) => (l.match(/`([a-z][a-z0-9-]*)`/) as RegExpMatchArray)[1]);
    expect(rows.length, "one parity row per §3.3 family").toBe(ids.length);
    expect([...new Set(named)].sort(), "parity table family ids must be exactly §3.3's").toEqual([...ids].sort());

    // Persistence is the 5th column of the journey table. A cell that talks about process memory
    // must use the label, because "IMPLEMENTED (in-memory)" is exactly what Rule 0.4a forbids.
    const unlabelled: string[] = [];
    for (const line of matrix.split("\n")) {
      const cells = line.split("|").map((c) => c.trim());
      if (cells.length < 8 || !/^J-RL1-|^\*\*J-RL1|Broadcast BG0|Finance quote|Payment release/.test(cells[1] ?? "")) continue;
      // Backticked spans are quotations of what a cell used to say, not claims it makes.
      const persistence = (cells[5] ?? "").replace(/`[^`]*`/g, "");
      if (/\bin-memory\b|process[- ]memory|only copy|per-process/i.test(persistence) && !(cells[5] ?? "").includes("sandbox-state")) {
        unlabelled.push(`${cells[1]}: ${persistence.slice(0, 80)}…`);
      }
    }
    expect(unlabelled, "Persistence cells that describe process memory without labelling it").toEqual([]);

    // Every file:line the matrix prints must resolve, and the counts it quotes must be measured.
    const unresolved: string[] = [];
    for (const { file, line } of citations(matrix)) {
      const rel = resolveCitedFile(file);
      const lines = rel ? read(rel).split("\n") : [];
      if (!rel || line > lines.length || lines[line - 1].trim() === "") unresolved.push(`${file}:${line}`);
    }
    expect(unresolved, "matrix citations that do not resolve to a non-blank line").toEqual([]);
    expect(matrix).toContain(`**${ids.length}** \`sandbox-state\` families`);
    expect(matrix).toContain(`**${computeSandboxCoverage().labelledEntries}** register`);
  });
});
