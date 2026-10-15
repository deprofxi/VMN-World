// TSK-09 self-containment probe: for one revision, list every tracked `src/` or `tests/` module
// whose relative import target is absent from that same revision's tracked file list.
// Usage: node self-containment-probe.mjs <rev>
import { execFileSync } from "node:child_process";
import path from "node:path";

const rev = process.argv[2];
if (!rev) throw new Error("usage: node self-containment-probe.mjs <rev>");

const git = (args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 1 << 28 });
const tracked = new Set(git(["ls-tree", "-r", rev, "--name-only"]).trim().split("\n"));
const srcTracked = [...tracked].filter(
  (f) => f.endsWith(".ts") && (f.startsWith("src/") || f.startsWith("tests/"))
);
const show = (p) => {
  try {
    return git(["show", `${rev}:${p}`]);
  } catch {
    return "";
  }
};

const missing = new Set();
for (const f of srcTracked) {
  for (const m of show(f).matchAll(/from\s+"(\.[^"]+)"/g)) {
    const rel = path.posix.join(path.posix.dirname(f), m[1]);
    const base = rel.replace(/\.js$/, "");
    const candidates = [rel, base + ".ts", base + ".js", base + ".mjs", base + "/index.ts", base];
    if (!candidates.some((c) => tracked.has(c))) missing.add(rel);
  }
}

const list = [...missing].sort();
console.log(`rev ${rev}: tracked src/tests files importing something absent at that rev: ${list.length}`);
console.log(list.join("\n"));
