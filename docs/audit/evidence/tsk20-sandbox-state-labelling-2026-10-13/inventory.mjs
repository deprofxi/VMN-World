import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../../..", import.meta.url));
process.chdir(ROOT);
const { computeSandboxCoverage, computeDocumentedIdCounts, expandScreenRegister } = await import(
  path.join(ROOT, "src/core/config/screen-register.ts")
);

const register = JSON.parse(fs.readFileSync("docs/decisions/screen-register.json", "utf8"));
const matrix = fs.readFileSync("docs/audit/journey-readiness-matrix.md", "utf8");
const doc = fs.readFileSync("docs/domain/systems-of-record.md", "utf8");

const section = doc.split("### 3.3 Process memory — not persistence")[1].split("**Rows 19-30")[0];
const rows = section
  .split("\n")
  .filter((l) => l.startsWith("|") && !l.includes(":---") && !l.startsWith("| Entity"))
  .filter((l) => l.split("|")[2]?.replace(/`/g, "").trim());

const coverage = computeSandboxCoverage();
const documented = computeDocumentedIdCounts();
const expanded = expandScreenRegister();
const labelledIds = expanded.filter((e) => e.dataState === "sandbox-state").map((e) => e.id);
const familyIds = register.sandboxState.families.map((f) => f.id);
const matrixMissing = familyIds.filter((id) => !matrix.includes("`" + id + "`"));
const unlabelledFamilies = familyIds.filter((id) => !coverage.byFamily[id]);

const out = [];
out.push("TSK-20 — sandbox-state labelling, measured inventory (2026-10-13)");
out.push("");
out.push("Reproduce: node --experimental-strip-types docs/audit/evidence/tsk20-sandbox-state-labelling-2026-10-13/inventory.mjs");
out.push("         (imports src/core/config/screen-register.ts — the same module the register serves,");
out.push("          so every figure below is recomputed, never tallied by hand)");
out.push("");
out.push(`systems-of-record.md §3.3 rows (authority)      : ${rows.length}`);
out.push(`screen-register.json sandboxState.families      : ${familyIds.length}`);
out.push(`register entries labelled sandbox-state          : ${coverage.labelledEntries}`);
out.push(`documented IDs carrying the label                : ${coverage.labelledIds}`);
out.push(`documented IDs total (all statuses)              : ${documented.ids} from ${documented.entries} entries`);
out.push(`by status                                        : ${JSON.stringify(documented.byStatus)}`);
out.push(`families with at least one labelled screen        : ${Object.keys(coverage.byFamily).length}`);
out.push(`families with NO labelled screen (labelling resid): ${unlabelledFamilies.join(", ") || "none"}`);
out.push(`matrix: §3.3 family ids the matrix never names    : ${matrixMissing.join(", ") || "none"}`);
out.push(`matrix: parity-table rows                         : ${matrix.split("\n").filter((l) => /^\| `[a-z][a-z0-9-]*` \|/.test(l)).length}`);
out.push("");
out.push("Per-family labelled-screen tally (recomputed by computeSandboxCoverage):");
for (const id of familyIds) {
  out.push(`  ${id.padEnd(24)} ${String(coverage.byFamily[id] ?? 0).padStart(3)} screen ids`);
}
out.push("");
out.push("Labelled entry ids, in register order:");
out.push("  " + labelledIds.join(", "));
out.push("");
out.push("Deliberately NOT labelled (Rule 0.4a — the screen's own evidence reads no §3.3 store):");
out.push("  UX-BR-012  renders channel/episode-master state + fixed blocker copy (src/web/workspace/governance-and-operations.ts)");
out.push("  UX-SYS-013 keeps its registry in Postgres (SessionRecord, systems-of-record.md §3.1); only the preferences/");
out.push("             first-use/inbox side stores are sandbox-state, and this screen reads neither.");
fs.writeFileSync("docs/audit/evidence/tsk20-sandbox-state-labelling-2026-10-13/sandbox-state-inventory.txt", out.join("\n") + "\n");
console.log(out.join("\n"));
