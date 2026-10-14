/**
 * TSK-21 (CA-13): `docs/events/catalogue.md` must stay a description of the code
 * that exists, not of the architecture the ADRs describe.
 *
 * The register's complaint was that the documented event model and the code's
 * event model are different systems. A prose catalogue drifts the same way the
 * ADR did, so every count and status in it is re-derived here: the `JobType`
 * union, where handlers are registered, which types have producers, the sixteen
 * PRD §39 candidate names, and whether any of them is emitted in `src/`.
 */

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const CATALOGUE = "docs/events/catalogue.md";
const QUEUE = "src/core/queue/index.ts";
const SERVER = "src/api/server.ts";
const BRIDGE = "src/modules/federation/azeebo/bridge.ts";
const PRD = "docs/authorities/VMNL-AZP-VMN-BRD-PRD-001-R1.2A.md";

const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");
const catalogue = read(CATALOGUE);

/** The declared union, not a remembered list. */
function jobTypes(): string[] {
  const block = read(QUEUE).match(/export type JobType =([\s\S]*?);/)![1];
  return [...block.matchAll(/"([A-Z_]+)"/g)].map((m) => m[1]);
}

/** Row of the catalogue's §2 table: `| \`TYPE\` | handler | producers | ... |` */
function catalogueJobRows(): Map<string, { handler: string; producers: string }> {
  const rows = new Map<string, { handler: string; producers: string }>();
  for (const line of catalogue.split("\n")) {
    const m = line.match(/^\| `(EPG_GENERATION|NOTIFICATION_DELIVERY|WEBHOOK_DISPATCH|RECONCILIATION_RUN)` \| (.*)$/);
    if (!m) continue;
    const cells = m[2].split("|");
    rows.set(m[1], { handler: cells[0].trim(), producers: cells[1].trim() });
  }
  return rows;
}

function srcFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry === "dist" || entry === ".git") continue;
      const p = path.join(dir, entry);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (entry.endsWith(".ts")) out.push(p);
    }
  };
  walk(path.join(ROOT, "src"));
  return out;
}

/** PRD §39's candidate list, read out of the authority document itself. */
function prdCandidates(): string[] {
  const prd = read(PRD);
  const start = prd.indexOf("39. CANONICAL BROADCAST EVENT CANDIDATES");
  expect(start, "PRD §39 has disappeared; this catalogue and TSK-21 need re-writing, not re-pinning").toBeGreaterThan(-1);
  const section = prd.slice(start, prd.indexOf("\n40.", start));
  return [...new Set(section.match(/broadcast\.[a-z_.]+/g) ?? [])];
}

describe("TSK-21: the event catalogue is the code, re-measured", () => {
  it("lists exactly the JobType union the worker declares", () => {
    const declared = jobTypes();
    const documented = [...catalogueJobRows().keys()];
    expect(declared).toHaveLength(4);
    expect(documented.sort()).toEqual(declared.slice().sort());
  });

  it("keeps every handler where the catalogue says it is, and none unregistered", () => {
    const registrations = [...read(SERVER).matchAll(/queueWorker\.registerHandler\("([A-Z_]+)"/g)].map((m) => m[1]);
    expect(registrations.sort()).toEqual(jobTypes().slice().sort());
    for (const [type, row] of catalogueJobRows()) {
      expect(row.handler, `${type} handler citation`).toContain("src/api/server.ts:");
      const line = Number(row.handler.match(/server\.ts:(\d+)/)![1]);
      const serverLines = read(SERVER).split("\n");
      const window = serverLines.slice(line - 1, line + 1).join(" ");
      expect(window, `${type}: catalogue points at a line that is not its handler`).toContain(`"${type}"`);
    }
  });

  it("names the two job types that have no producer in src/, and fails if one gains a route without a document update", () => {
    // A producer is an `enqueue("TYPE", …)` call or a `scheduleRecurring("TYPE", …)`
    // wiring. The union declaration in the queue module is not one, and it does not
    // match either pattern, so no file has to be excluded.
    const producerSites = (type: string) =>
      srcFiles()
        .map((f) => ({ rel: path.relative(ROOT, f).split(path.sep).join("/"), text: readFileSync(f, "utf8") }))
        .filter(({ text }) =>
          new RegExp(`enqueue\\(\\s*"${type}"`).test(text) || new RegExp(`scheduleRecurring\\(\\s*"${type}"`).test(text)
        )
        .map(({ rel }) => rel);

    const withNoProducer = jobTypes().filter((type) => producerSites(type).length === 0);
    expect(withNoProducer.sort()).toEqual(["RECONCILIATION_RUN", "WEBHOOK_DISPATCH"]);
    expect(producerSites("EPG_GENERATION").sort()).toEqual(["src/api/server.ts", "src/core/queue/index.ts"]);
    expect(producerSites("NOTIFICATION_DELIVERY")).toEqual(["src/web/public/hub.ts"]);

    for (const type of withNoProducer) {
      expect(catalogueJobRows().get(type)!.producers).toContain("**0**");
    }
    for (const type of jobTypes().filter((t) => !withNoProducer.includes(t))) {
      expect(catalogueJobRows().get(type)!.producers, `${type} is documented as producerless but has one`).not.toContain("**0**");
    }
  });

  it("assesses all sixteen PRD §39 candidates and records that none is emitted", () => {
    const candidates = prdCandidates();
    expect(candidates).toHaveLength(16);
    const documented = [...catalogue.matchAll(/^\| `(broadcast\.[a-z_.]+)`\s*\(`:\d+`\)\s*\|\s*NOT_EMITTED\s*\|/gm)].map((m) => m[1]);
    expect(documented.sort()).toEqual(candidates.slice().sort());

    // The claim the register made in CA-13, re-measured: none of the sixteen
    // candidate names appears anywhere in `src/`. Three look-alike strings do exist
    // and are **not** candidates — `broadcast.schedule_state` is a provenance field
    // id (`src/core/config/source-mappings.ts:68`), and `broadcast.epg.push_attempted`
    // (`src/api/router.ts:5941`) and `broadcast.version.rfa` (`:7467`) are audit-log
    // action labels. They are named here so nobody later mistakes them for evidence
    // that §39 was implemented.
    const found: string[] = [];
    for (const f of srcFiles()) {
      const rel = path.relative(ROOT, f).split(path.sep).join("/");
      readFileSync(f, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (candidates.some((name) => line.includes(name))) found.push(`${rel}:${i + 1}`);
        });
    }
    expect(found, `PRD §39 candidate names now appear in code — assess them in §4 before this passes:\n${found.join("\n")}`).toEqual([]);
  });

  it("keeps the federation delivery defect visible in the document while it is present in the code", () => {
    const bridge = read(BRIDGE);
    const assumedDelivery = /mockTransport \? mockTransport\(webhook\) : true/.test(bridge);
    if (assumedDelivery) {
      expect(catalogue).toContain("without any HTTP call");
      expect(catalogue).toMatch(/delivery defect/i);
    } else {
      throw new Error(
        "bridge.ts no longer marks a webhook delivered without a transport — pay off the defect, then remove the §3 warning row from docs/events/catalogue.md"
      );
    }
  });
});
