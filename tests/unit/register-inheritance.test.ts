/**
 * TSK-07 (report.md CA-06) — the deleted registers resolve.
 *
 * CA-06's defect is structural, not cosmetic: `todo.md` (VMNL-AZP-VMN-TODO-001) and the previous
 * `tasks.md` content (VMNL-AZP-VMN-TASK-001) are tracked in git but absent from the working tree,
 * while ~70 `TODO-*` identifiers still tag code, tests and audit documents. Traceability was the
 * spine of the evidence system, so a register that resolves to nothing makes every claim resting on
 * it unverifiable — and nothing in CI noticed, which is how it stayed that way for a release cycle.
 *
 * This suite reads `tasks.md` §1.4 as data and enforces the decision recorded in
 * `docs/decisions/DEC-REGISTER-SURVIVOR-001.md`:
 *
 *   1. every inherited identifier cited anywhere in the repository has a census row;
 *   2. every census row resolves to something that exists — a `TSK-nn` heading in this register, an
 *      `HD-nn` row in §5, a live evidence row in `docs/audit/todo-remediation-evidence.md`, or a
 *      file in this repository;
 *   3. no document depends on the retired `todo.md` as a live source, and `File 1.txt` — which has
 *      never existed in any commit — is named nowhere except the two places that record its removal.
 *
 * Like `tests/unit/ac-traceability.test.ts`, this file is excluded from its own citation corpus: it
 * carries ID literals as test *data*, which would otherwise read as citations.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const SELF = "register-inheritance.test.ts";

const ID_RE = /\bTODO-(?:SEC|SCR|BCST|FIN|PRC|GVR|DOC)-\d{2}\b/g;
const DECISION_DOC = "docs/decisions/DEC-REGISTER-SURVIVOR-001.md";
const SURVEY_DIRS = ["src", "tests", "docs", "scripts"];
const SURVEY_FILES = ["audit.md", "CLAUDE.md", "tasks.md", "report.md"];
const EXTENSIONS = /\.(ts|tsx|js|mjs|json|md)$/;
/** A mention of the retired register is historical only if its line (or the line it continues onto) says so. */
const HISTORICAL_RE =
  /retired|deleted|withdrawn|historical|inherited|superseded|recorded decision|never existed|VMNL-AZP-VMN-TODO-001|ROUND 6|Round 6|no longer|\bTSK-07\b|register the project was managed/i;

function readRepo(rel: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

function surveyFiles(): string[] {
  const out: string[] = [...SURVEY_FILES];
  const walk = (dir: string) => {
    for (const d of fs.readdirSync(path.join(REPO_ROOT, dir), { withFileTypes: true })) {
      if (d.name === "node_modules" || d.name === "dist" || d.name.startsWith(".")) continue;
      const rel = `${dir}/${d.name}`;
      if (d.isDirectory()) walk(rel);
      else if (EXTENSIONS.test(d.name) && d.name !== SELF) out.push(rel);
    }
  };
  for (const dir of SURVEY_DIRS) if (fs.existsSync(path.join(REPO_ROOT, dir))) walk(dir);
  return [...new Set(out)].sort();
}

type Disposition = "CLOSED" | "CLOSED_WITH_HUMAN" | "REOPENED" | "HUMAN";

interface CensusRow {
  /** Every inherited ID the row covers — `TODO-BCST-08 / 09` stands for two. */
  ids: string[];
  item: string;
  disposition: Disposition;
  resolvesTo: string;
}

function parseDisposition(cell: string): Disposition {
  if (cell.includes("REOPENED")) return "REOPENED";
  if (/open human/i.test(cell)) return "CLOSED_WITH_HUMAN";
  if (cell.includes("HUMAN")) return "HUMAN";
  return "CLOSED";
}

function parseCensus(tasks: string): CensusRow[] {
  const start = tasks.indexOf("### 1.4 Inherited identifier census");
  if (start < 0) throw new Error("tasks.md has no §1.4 inherited-identifier census");
  const end = tasks.indexOf("\n## 2. ", start);
  const section = tasks.slice(start, end < 0 ? undefined : end);
  const rows: CensusRow[] = [];
  for (const line of section.split("\n")) {
    if (!line.startsWith("| `TODO-")) continue;
    const cells = line.split("|").map((c) => c.trim());
    // | <id cell> | <item> | <disposition> | <resolves to> |  → cells[0] is "" before the first pipe
    const idCell = cells[1];
    const primary = idCell.match(ID_RE);
    if (!primary?.length) throw new Error(`census row names no inherited ID: ${idCell}`);
    const slashTail = idCell.match(/\/\s*(\d{2})\b/);
    const ids = new Set<string>(primary);
    if (slashTail) {
      const [, num] = primary[0].match(/(TODO-[A-Z]+)-\d{2}/) as [string, string];
      ids.add(`${num}-${slashTail[1]}`);
    }
    rows.push({
      ids: [...ids],
      item: cells[2],
      disposition: parseDisposition(cells[3]),
      resolvesTo: cells[4],
    });
  }
  return rows;
}

/** The item labels that must exist verbatim in the retired register's evidence tables. */
function evidenceLabels(resolvesTo: string): string[] {
  return [...resolvesTo.matchAll(/“([^”]+)”/g)].map((m) => m[1]);
}

function hdRefs(resolvesTo: string): string[] {
  return [...resolvesTo.matchAll(/\bHD-\d{2}\b/g)].map((m) => m[0]);
}

function tskRefs(resolvesTo: string): string[] {
  return [...resolvesTo.matchAll(/\bTSK-\d{2}\b/g)].map((m) => m[0]);
}

function fileRefs(resolvesTo: string): string[] {
  return [...resolvesTo.matchAll(/(?:^|\s)((?:src|docs|tests|prisma|scripts)\/[\w./-]*\w)/g)].map((m) => m[1]);
}

const tasks = readRepo("tasks.md");
const census = parseCensus(tasks);
const evidenceDoc = readRepo("docs/audit/todo-remediation-evidence.md");
const files = surveyFiles();

/** id → files citing it, across the repository. */
const citations = new Map<string, string[]>();
for (const f of files) {
  const ids = [...new Set(readRepo(f).match(ID_RE) ?? [])];
  for (const id of ids) citations.set(id, [...(citations.get(id) ?? []), f]);
}

const censusIds = new Set(census.flatMap((r) => r.ids));
const uncited = census.filter((r) => !r.ids.some((id) => citations.has(id)));

describe("TSK-07 (CA-06): the surviving register resolves every inherited identifier", () => {
  it("records the surviving-register decision", () => {
    const decision = readRepo(DECISION_DOC);
    expect(decision).toContain("VMNL-AZP-VMN-TODO-002");
    expect(decision).toContain("VMNL-AZP-VMN-TODO-001");
    expect(decision).toContain("VMNL-AZP-VMN-TASK-001");
    // the decision must name the mechanism that makes the deletion deliberate, not accidental
    expect(decision).toMatch(/TSK-09/);
    // and the register must point back at it
    expect(tasks.slice(tasks.indexOf("### 1.4"), tasks.indexOf("\n## 2. "))).toContain(DECISION_DOC);
  });

  it("carries a census row for every inherited identifier cited anywhere in the repository", () => {
    const dangling = [...citations.entries()]
      .filter(([id]) => !censusIds.has(id))
      .map(([id, fs]) => `${id} (cited in ${fs.slice(0, 3).join(", ")})`);
    expect(dangling, `inherited IDs that resolve to no census row:\n${dangling.join("\n")}`).toEqual([]);

    // Measured 2026-10-07. Pinned so the census cannot silently shrink: deleting a row that a
    // citation depends on fails here, and so does a citation that has drifted off the register.
    // 71 register items — `TODO-BCST-08/09` is one item covering two IDs, hence 72 identifiers.
    console.log(
      `\n[TSK-07] inherited-identifier census — rows: ${census.length} · IDs covered: ${censusIds.size} · ` +
        `cited in tree: ${citations.size} · uncited rows: ${uncited.length} ` +
        `(${uncited.map((r) => r.ids.join("+")).join(", ") || "none"})`
    );
    expect(census).toHaveLength(71);
    expect(censusIds.size).toBe(72);
    expect(citations.size).toBe(72);
    const byDisposition = census.reduce<Record<string, number>>((acc, r) => {
      acc[r.disposition] = (acc[r.disposition] ?? 0) + 1;
      return acc;
    }, {});
    console.log(`[TSK-07] dispositions: ${JSON.stringify(byDisposition)}`);
  });

  it("resolves every census row to something that exists", () => {
    const sectionFive = tasks.slice(tasks.indexOf("## 5. Human decisions"), tasks.indexOf("## 6."));
    const bad: string[] = [];
    for (const row of census) {
      const id = row.ids.join(" / ");
      if (row.disposition === "REOPENED") {
        const refs = tskRefs(row.resolvesTo);
        if (!refs.length) bad.push(`${id}: REOPENED row names no TSK-nn`);
        for (const tsk of refs)
          if (!tasks.includes(`#### ${tsk} ·`)) bad.push(`${id}: reopened as ${tsk}, which has no heading in tasks.md`);
      }
      if (row.disposition === "HUMAN" || row.disposition === "CLOSED_WITH_HUMAN") {
        for (const hd of hdRefs(row.resolvesTo)) {
          if (!sectionFive.includes(`| \`${hd}\` |`)) bad.push(`${id}: ${hd} is not a row in tasks.md §5`);
        }
      }
      for (const label of evidenceLabels(row.resolvesTo)) {
        // an evidence row must be a table cell in the evidence document, not prose
        if (!evidenceDoc.includes(`| ${label} |`))
          bad.push(`${id}: no evidence row “${label}” in docs/audit/todo-remediation-evidence.md`);
      }
      for (const ref of fileRefs(row.resolvesTo)) {
        if (!fs.existsSync(path.join(REPO_ROOT, ref))) bad.push(`${id}: ${ref} does not exist`);
      }
      if (row.resolvesTo.includes("no citation outside this register")) {
        // The census itself necessarily names the ID; anything *else* citing it would mean the
        // closure note is missing from a live document, which the row would then have to point at.
        const citing = row.ids.flatMap((i) => citations.get(i) ?? []).filter((f) => f !== "tasks.md");
        if (citing.length) bad.push(`${id}: resolved to the retired register but is cited in ${citing.join(", ")}`);
      }
    }
    expect(bad, `census rows that do not resolve:\n${bad.join("\n")}`).toEqual([]);
  });

  it("reopens only items this register actually tracks", () => {
    const reopened = census.filter((r) => r.disposition === "REOPENED").map((r) => `${r.ids[0]}→${tskRefs(r.resolvesTo)[0]}`);
    // Measured 2026-10-08: a subset of §1.3's reopen mapping — two of the six rows it recorded on
    // 2026-10-07 have since been closed by the tasks they named (`TODO-BCST-03`→TSK-12,
    // `TODO-DOC-05`→TSK-08), so those two left this list. `TODO-FIN-07` left it on 2026-10-09,
    // closed by TSK-16 (real make-good rebooking) and TSK-33 (credit notes journaled), and
    // `TODO-SCR-19` left it the same day, closed by TSK-13 (client portal projects canonical deals;
    // the unbound delivery feeds moved to a new register item, TSK-60, rather than staying implied),
    // and `TODO-SEC-10` left it on 2026-10-10, closed by TSK-27 (adapter-first auth/session stores:
    // the Map-first `kvGetJson` mirror CA-26 named is deleted, lockout and the one-time MFA claim are
    // atomic, and revocation is shared across instances — tests/unit/auth-shared-across-instances.test.ts).
    expect(reopened.sort()).toEqual(["TODO-BCST-01→TSK-11"]);
    // …and each reopening task is still open in this register, so a reopen is not decorative.
    for (const row of census.filter((r) => r.disposition === "REOPENED")) {
      const tsk = tskRefs(row.resolvesTo)[0];
      const start = tasks.indexOf(`#### ${tsk} ·`);
      const block = tasks.slice(start, tasks.indexOf("\n#### ", start + 1));
      expect(block, `${tsk} carries no unresolved box for reopened ${row.ids[0]}`).toMatch(/^- \[[ ~B]\]/m);
    }
  });

  it("keeps every mention of the retired registers historical", () => {
    const live: string[] = [];
    for (const f of files) {
      if (f === DECISION_DOC) continue; // the decision record is where the retirement is stated
      if (f === "tasks.md") continue; // §1.3/§1.4 cite them *as* the retired registers
      // report.md is the dated audit that raised CA-06; naming the deleted registers is its subject,
      // not a dependency on them. It is excluded for that reason, not because it is trusted.
      if (f === "report.md") continue;
      const lines = readRepo(f).split("\n");
      lines.forEach((line, i) => {
        if (!/todo\.md|File 1\.txt/.test(line)) return;
        if (HISTORICAL_RE.test(line) || HISTORICAL_RE.test(lines.slice(i, i + 3).join(" "))) return;
        // A traceability tag — `todo.md TODO-SCR-06` — points at a register *item*, and the item
        // resolves through §1.4 (asserted by the census tests above). That is a label, not a file
        // dependency, provided every ID on the line is actually in the census.
        const tagged = line.match(/todo\.md[^\n]*$/)?.[0] ?? "";
        const ids = tagged.match(ID_RE) ?? [];
        if (ids.length && ids.every((id) => censusIds.has(id))) return;
        live.push(`${f}:${i + 1} ${line.trim().slice(0, 90)}`);
      });
    }
    expect(live, `documents that still depend on a deleted register:\n${live.join("\n")}`).toEqual([]);
  });

  it("names File 1.txt nowhere except the two records of its removal", () => {
    const hits = files
      .filter((f) => f !== DECISION_DOC)
      .filter((f) => readRepo(f).includes("File 1.txt"))
      .map((f) => {
        const lines = readRepo(f).split("\n");
        const first = lines.findIndex((l) => l.includes("File 1.txt"));
        const ok = first >= 0 && /never existed|withdrawn|removed/.test(lines.slice(first - 1, first + 4).join(" "));
        return ok ? null : `${f}:${first + 1}`;
      })
      .filter((x): x is string => x !== null);
    expect(hits, `File 1.txt cited as an authority: ${hits.join(", ")}`).toEqual([]);
    // the governing Authority line must name a document that exists
    const authorityLine = readRepo("docs/audit/evidence-register.md")
      .split("\n")
      .find((l) => l.startsWith("**Authority:**"));
    expect(authorityLine, "evidence-register.md has no Authority line").toBeDefined();
    expect(authorityLine).not.toContain("File 1.txt");
    expect(authorityLine).toContain("VMNL-AZP-VMN-CCPP-001");
  });

  it("keeps the retired register recoverable by a command in this repository", () => {
    // Rule 0.2: the census says the retired items' own text is recoverable from git; prove it here
    // rather than asserting it. After the TSK-09 commit series lands the deletion the blob moves to
    // the pre-deletion commit, which is why the command is recorded rather than hard-pinned to HEAD.
    expect(tasks).toContain("git show HEAD:todo.md");
    expect(readRepo(DECISION_DOC)).toContain("git show HEAD:todo.md");
  });
});
