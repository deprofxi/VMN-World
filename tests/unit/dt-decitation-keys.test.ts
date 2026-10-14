/**
 * TSK-40 (CA-25): every `DT-*` key in live code and instruments is re-keyed to
 * the de-citation record, or this test fails.
 *
 * `design-task.md` has never existed in this repository (verified 2026-09-30 and
 * recorded in `docs/decisions/design-task-de-citation.md`), so a bare `DT-108`
 * citation points at nothing and confers no acceptance authority. The decision
 * allows the ids to survive as *internal labels* — that is what re-keying means
 * here. This file keeps the re-keying honest: a live source or test that leans on
 * a `DT-*` id must name the record that says what the id is allowed to mean.
 *
 * Measurement artifacts under `docs/audit/evidence/` and `report.md` are excluded
 * on purpose. They are dated transcripts of what a run printed; rewriting them to
 * add a pointer would falsify the evidence.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const DECISION = "docs/decisions/design-task-de-citation.md";

/**
 * A `DT-` id. The lookbehind is what keeps seed data such as the AFCA course code
 * `AFCA-EDT-201` from being read as a design-task citation.
 */
const DT_KEY = /(?<![A-Za-z])DT-\d{2,3}\b/g;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry === ".git") continue;
    const p = path.join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (entry.endsWith(".ts")) out.push(p);
  }
  return out;
}

const rel = (p: string) => path.relative(ROOT, p).split(path.sep).join("/");

/** Live code plus test instruments, then the three design documents that key debt by `DT-*`. */
const liveFiles = [
  ...walk(path.join(ROOT, "src")),
  ...walk(path.join(ROOT, "tests")),
  "docs/design-debt-register.md",
  "docs/ui-copy-standards.md",
  "docs/design-review-gate.md",
].map((p) => (path.isAbsolute(p) ? rel(p) : p));

function keysIn(file: string): string[] {
  return [...new Set(readFileSync(path.join(ROOT, file), "utf8").match(DT_KEY) ?? [])];
}

describe("TSK-40: DT-* keys are re-keyed, not left pointing at a document that does not exist", () => {
  const citing = liveFiles
    .filter((f) => existsSync(path.join(ROOT, f)))
    .map((f) => ({ file: f, keys: keysIn(f) }))
    .filter((entry) => entry.keys.length > 0);

  it("fails on any live file that cites a DT-* key without naming the de-citation record", () => {
    const bare = citing.filter(
      (entry) => !readFileSync(path.join(ROOT, entry.file), "utf8").includes("design-task-de-citation")
    );
    expect(bare, `DT citations with no re-key record:\n${bare.map((b) => b.file).join("\n")}`).toEqual([]);
  });

  it("re-keys every cited key, and prints the census so the number is measured, not remembered", () => {
    // This file quotes an example key in its own comments; it is not a citation.
    const others = citing.filter((entry) => entry.file !== "tests/unit/dt-decitation-keys.test.ts");
    const keys = new Set(others.flatMap((entry) => entry.keys));
    console.log(
      `[TSK-40] DT census: ${keys.size} distinct keys across ${others.length} live files (${others
        .map((c) => `${c.file}:${c.keys.length}`)
        .sort()
        .join(", ")})`
    );
    expect(keys.size).toBeGreaterThan(0);
    expect(others.length).toBeGreaterThan(0);
  });

  it("keeps the record the pointers land on present, and carrying the label-only rule", () => {
    const decision = readFileSync(path.join(ROOT, DECISION), "utf8");
    expect(decision, "DT ids must remain internal labels only, or the pointers promise nothing").toMatch(
      /internal labels only/
    );
    expect(decision).toMatch(/NOT recreated synthetically/);
  });

  it("does not let an unresolvable DT key be cited as an authority", () => {
    // Re-keying is allowed; restoring `design-task.md` as a governing document is not.
    const offenders = citing
      .map((entry) => ({ file: entry.file, text: readFileSync(path.join(ROOT, entry.file), "utf8") }))
      .filter(({ text }) => /design-task\.md/.test(text) && !/does not exist|de-cit|unavailable external/i.test(text));
    expect(offenders, `files presenting design-task.md as live authority:\n${offenders.map((o) => o.file).join("\n")}`).toEqual([]);
  });
});
