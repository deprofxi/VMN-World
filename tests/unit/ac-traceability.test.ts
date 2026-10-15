/**
 * TSK-43 (report.md CA-21): the AC traceability index may only claim what an
 * executable test labels.
 *
 * CA-21's finding was structural, not editorial: the index marked journeys
 * **VERIFIED** with AC-ID *ranges*, while grep of the literal IDs under `tests/`
 * found only `AC-UI-RL1-R03-01…06,08,11` and `AC-SCR-03-01…03`. A range is not
 * evidence — `R03-01…12` was read as "12 criteria — full AC coverage" even though
 * four of those IDs appeared in no assertion anywhere. The index's own maintenance
 * rule (§Maintenance rule) already invalidates a completeness claim without an
 * indexed AC block; nothing enforced it.
 *
 * This suite is that enforcement:
 *   1. parse the index table into rows;
 *   2. expand every ID range into discrete IDs (same arithmetic as the screen
 *      register — a range tallies as the IDs it stands for, never as one claim);
 *   3. require every VERIFIED row to have each of its IDs present as a literal
 *      string in a test file;
 *   4. forbid a "full AC coverage" claim unless every ID in that row is labelled;
 *   5. require every cited evidence path to exist.
 *
 * Statuses a row may carry, and what each is allowed to assert:
 *   VERIFIED        — every claimed AC ID is labelled in an executable test
 *   PARTIAL         — some IDs are labelled; the row states how many
 *   IMPLEMENTED     — cited tests exist and exercise the journey, no AC-ID label
 *   DRILL-VERIFIED  — evidence is a recorded drill artifact, not an AC label
 *   NOT_RUN         — human-run coverage absent
 *   NOT_TESTED      — blocked on a human decision or absent authority
 *
 * Authority: tasks.md TSK-43 · Rule 0.2 (evidence before claims) · Rule 0.4.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const INDEX_PATH = path.join(REPO_ROOT, "docs/audit/ac-traceability-index.md");

const ALLOWED_STATUSES = ["VERIFIED", "PARTIAL", "IMPLEMENTED", "DRILL-VERIFIED", "NOT_RUN", "NOT_TESTED"] as const;
type RowStatus = (typeof ALLOWED_STATUSES)[number];

interface IndexRow {
  journey: string;
  requirementRow: string;
  /** Discrete AC IDs the row claims, after range expansion. */
  ids: string[];
  /** AC IDs that appear as a literal string somewhere under tests/. */
  labelled: string[];
  missing: string[];
  status: RowStatus | "UNKNOWN";
  statusRaw: string;
  evidencePaths: string[];
}

const RANGE_RE = /\b(AC(?:-[A-Za-z0-9]+)+-)(\d{2})…(\d{2})/g;
const SINGLE_RE = /\bAC(?:-[A-Za-z0-9]+)+-\d{2}\b(?!…)/g;
const EVIDENCE_PATH_RE = /\b(?:tests|src|docs|prisma)\/[\w./-]*\w/g;

/** `AC-UI-RL1-R03-01…12` stands for twelve criteria, so it must tally as twelve. */
function expandIds(cell: string): string[] {
  const ids: string[] = [];
  for (const m of cell.matchAll(RANGE_RE)) {
    const [, prefix, from, to] = m;
    for (let n = Number(from); n <= Number(to); n++) ids.push(`${prefix}${String(n).padStart(from.length, "0")}`);
  }
  const withoutRanges = cell.replace(RANGE_RE, " ");
  for (const m of withoutRanges.matchAll(SINGLE_RE)) ids.push(m[0]);
  return [...new Set(ids)];
}

/**
 * Collect every literal string under tests/ once, so the grep is one directory walk.
 *
 * This file is excluded: it quotes AC IDs as *data* (`expect(ids).toContain("…-07")`),
 * which would otherwise satisfy its own label grep. Measured 2026-10-07 — with itself in
 * the corpus the census counted `AC-UI-RL1-R03-07` as labelled in an assertion, which is
 * exactly the range-read-as-census error this suite exists to catch.
 */
const SELF = "ac-traceability.test.ts";

function testFileContents(): string {
  const chunks: string[] = [];
  const stack = [path.join(REPO_ROOT, "tests")];
  while (stack.length) {
    const dir = stack.pop() as string;
    for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, d.name);
      if (d.isDirectory()) stack.push(abs);
      else if (d.isFile() && /\.(ts|tsx|js|mjs)$/.test(d.name) && d.name !== SELF) chunks.push(fs.readFileSync(abs, "utf8"));
    }
  }
  return chunks.join("\n");
}

function parseRows(markdown: string): IndexRow[] {
  const lines = markdown.split("\n");
  const header = lines.findIndex((l) => l.startsWith("| Journey | Requirement row |"));
  if (header < 0) throw new Error("[TSK-43] the AC index table header is missing — the instrument has nothing to check");
  // Only the contiguous block of rows under *this* header counts as index entries;
  // the status-vocabulary and census tables further down are prose, not claims.
  const cellRows: string[][] = [];
  for (const line of lines.slice(header + 2)) {
    if (!line.startsWith("|")) break;
    cellRows.push(line.split("|").slice(1, -1).map((c) => c.trim()));
  }
  const blob = testFileContents();
  return cellRows.map(([journey, requirementRow, acCell = "", evidenceCell = "", statusCell = ""]) => {
    const ids = expandIds(acCell);
    const labelled = ids.filter((id) => blob.includes(id));
    const statusRaw = statusCell.replace(/\*\*/g, "").trim();
    const status = (ALLOWED_STATUSES.find((s) => statusRaw.startsWith(s)) ?? "UNKNOWN") as RowStatus | "UNKNOWN";
    return {
      journey,
      requirementRow,
      ids,
      labelled,
      missing: ids.filter((id) => !labelled.includes(id)),
      status,
      statusRaw,
      evidencePaths: [...new Set([...evidenceCell.matchAll(EVIDENCE_PATH_RE)].map((m) => m[0]))],
    };
  });
}

const indexSource = fs.readFileSync(INDEX_PATH, "utf8");
const rows = parseRows(indexSource);

describe("TSK-43 (CA-21): the AC traceability index claims only what tests label", () => {
  it("parses the index into rows with an allowed status", () => {
    expect(rows.length).toBeGreaterThanOrEqual(15);
    const unknown = rows.filter((r) => !ALLOWED_STATUSES.includes(r.status as RowStatus)).map((r) => `${r.journey} → ${r.statusRaw}`);
    expect(unknown, `rows with a status outside the vocabulary: ${unknown.join("; ")}`).toEqual([]);
  });

  it("expands claimed ID ranges instead of tallying a range as one criterion", () => {
    const r03 = rows.find((r) => r.requirementRow.includes("R03") && r.journey.includes("enquiry"));
    expect(r03?.ids).toHaveLength(12);
    expect(r03?.ids).toContain("AC-UI-RL1-R03-07");
    expect(r03?.ids).not.toContain("AC-UI-RL1-R03-13");
    const scr = rows.find((r) => r.journey.includes("media picker"));
    expect(scr?.ids).toHaveLength(5);
  });

  it("only marks a journey VERIFIED when every claimed AC ID is labelled in a test", () => {
    const unproven = rows
      .filter((r) => r.status === "VERIFIED")
      .filter((r) => r.missing.length > 0 || r.ids.length === 0)
      .map((r) => `${r.journey} (${r.requirementRow}) claims VERIFIED with ${r.labelled.length}/${r.ids.length} labelled: missing ${r.missing.join(", ") || "—none declared—"}`);
    expect(unproven, `VERIFIED rows without full AC-ID labels:\n${unproven.join("\n")}`).toEqual([]);
  });

  it("never claims full AC coverage while an ID in the row is absent from tests", () => {
    const overclaiming = rows
      .filter((r) => /full AC coverage/i.test(r.statusRaw))
      .filter((r) => r.missing.length > 0)
      .map((r) => `${r.journey}: ${r.missing.join(", ")}`);
    expect(overclaiming, `rows claiming full coverage with unlabelled IDs: ${overclaiming.join("; ")}`).toEqual([]);
  });

  it("cites evidence paths that exist", () => {
    const missing = rows
      .flatMap((r) => r.evidencePaths.map((p) => ({ journey: r.journey, p })))
      .filter(({ p }) => !fs.existsSync(path.join(REPO_ROOT, p)))
      .map(({ journey, p }) => `${journey} → ${p}`);
    expect(missing, `cited evidence that does not resolve: ${missing.join("; ")}`).toEqual([]);
  });

  it("keeps a DRILL-VERIFIED row anchored to a real artifact, not a test label", () => {
    const drills = rows.filter((r) => r.status === "DRILL-VERIFIED");
    for (const r of drills) {
      expect(r.evidencePaths.length, `${r.journey} declares no artifact`).toBeGreaterThan(0);
    }
  });

  it("reports the measured AC census", () => {
    const claimed = rows.reduce((n, r) => n + r.ids.length, 0);
    const labelled = rows.reduce((n, r) => n + r.labelled.length, 0);
    console.log(
      `\n[TSK-43] AC census — rows: ${rows.length} · claimed IDs (ranges expanded): ${claimed} · ` +
        `labelled in tests: ${labelled} · unlabelled: ${claimed - labelled}`
    );
    for (const r of rows) {
      console.log(
        `[TSK-43] | ${r.journey} | ${r.requirementRow} | ${r.status} | ids ${r.ids.length} | labelled ${r.labelled.length} | ` +
          `${r.missing.length ? `unlabelled: ${r.missing.map((i) => i.replace(/^AC-[A-Z]+-[A-Z0-9]+-/, "")).join(",")}` : "all labelled"}`
      );
    }
    // Measured 2026-10-07. Pinned so the index cannot quietly re-inflate a range
    // into a coverage claim again. 103 claimed vs 17 labelled is the CA-21 gap;
    // the +6/+6 step from 97/11 is TSK-10's R07-13…18 row, labelled in
    // tests/unit/broadcast-rights-gate.test.ts and asserted as business outcomes.
    expect(claimed).toBe(103);
    expect(labelled).toBe(17);
  });
});
