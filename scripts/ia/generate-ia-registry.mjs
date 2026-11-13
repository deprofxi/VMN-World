#!/usr/bin/env node
/**
 * Generate the typed IA registry from the VMN World IA R1.1 inventory.
 *
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 *
 * The CSV is the source of truth. This script never invents, merges or renames a
 * record: it normalises the seven type labels into archetypes, classifies how each
 * row is reached, and fails loudly on anything it cannot represent faithfully.
 *
 * Usage: pnpm ia:generate  (or: node scripts/ia/generate-ia-registry.mjs --check)
 *   --check   write nothing; exit 1 if the checked-in registry differs from the CSV
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const CSV_PATH = resolve(ROOT, "docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv");
const OUT_PATH = resolve(ROOT, "src/web/ia/registry.generated.ts");
const REL_CSV_PATH = "docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv";

const REQUIRED_COLUMNS = [
  "ID",
  "Journey",
  "Journey code",
  "Step",
  "Type",
  "Screen name",
  "Role IDs",
  "Core UI components",
  "Primary user action",
  "Gate",
  "Proposed route pattern",
  "Host screen ID",
  "UI archetype",
  "Business action class",
  "Domain objects / source data",
  "Data classification",
  "Responsible source office",
  "Server-side permission contract",
  "Consequential effect permitted",
  "Mandatory adverse-state scenarios",
  "Human fallback / recovery route",
  "Evidence and audit contract",
  "A11y / responsive pattern",
  "Primary acceptance criterion",
  "IA acceptance ID",
  "Release priority",
  "Verified release status",
  "Change class",
  "Authority / source",
  "Implementation hint",
  "Role of screen",
];

const GATES = new Set(["W0", "W1", "W2", "W3", "W4", "G"]);

const ARCHETYPES = new Map([
  ["Page", "PAGE"],
  ["Edge / exception screen", "STATE"],
  ["Modal / drawer", "DIALOG"],
  ["Dashboard", "DASHBOARD"],
  ["Wizard / multistep", "WIZARD"],
  ["Page instance", "CONTENT_INSTANCE"],
  ["View / tab", "TAB"],
]);

/** RFC 4180 CSV parser: handles quoted fields, embedded commas, quotes and newlines. */
function parseCsv(source) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char === "\r") {
      // Normalise CRLF; a bare CR is not a record separator in this inventory.
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function fail(message) {
  console.error(`ia:generate: ${message}`);
  process.exit(1);
}

function text(value) {
  return (value ?? "").replace(/\r\n/g, "\n").trim();
}

function singleLine(value) {
  return text(value).replace(/\s*\n\s*/g, " ");
}

const checkOnly = process.argv.includes("--check");

if (!existsSync(CSV_PATH)) fail(`inventory not found at ${REL_CSV_PATH}`);

const raw = readFileSync(CSV_PATH, "utf8");
const sha256 = createHash("sha256").update(raw).digest("hex");
const rows = parseCsv(raw);
if (rows.length < 2) fail("inventory has no data rows");

const header = rows[0].map((h) => h.replace(/^\uFEFF/, "").trim());
for (const column of REQUIRED_COLUMNS) {
  if (!header.includes(column)) fail(`missing required column: ${column}`);
}
const col = new Map(header.map((name, index) => [name, index]));
const cell = (row, name) => text(row[col.get(name)]);

const records = [];
const ids = new Set();
const routeOwners = new Map();
let hostedCount = 0;
let routedCount = 0;

for (const [index, row] of rows.entries()) {
  if (index === 0) continue;
  if (row.every((value) => text(value) === "")) continue;

  const id = cell(row, "ID");
  if (!id) fail(`row ${index + 1} has no ID`);
  if (ids.has(id)) fail(`duplicate ID: ${id}`);
  ids.add(id);

  const gate = cell(row, "Gate");
  if (!GATES.has(gate)) fail(`${id}: unknown gate "${gate}"`);

  const rawType = cell(row, "Type");
  const archetype = ARCHETYPES.get(rawType);
  if (!archetype) fail(`${id}: unknown type "${rawType}"`);

  const step = Number.parseInt(cell(row, "Step"), 10);
  if (!Number.isInteger(step)) fail(`${id}: step is not an integer`);

  const routePattern = cell(row, "Proposed route pattern");
  let route = "";
  let routeKind = "ROUTED";
  let hostPath = "";

  if (routePattern.startsWith("/")) {
    route = routePattern;
    routedCount += 1;
  } else if (routePattern.startsWith("HOSTED@")) {
    routeKind = "HOSTED";
    hostPath = routePattern.slice("HOSTED@".length).trim();
    hostedCount += 1;
  } else if (routePattern.startsWith("STATE@HOST")) {
    routeKind = "GLOBAL_STATE";
    hostedCount += 1;
  } else {
    fail(`${id}: unrecognised route pattern "${routePattern}"`);
  }

  if (routeKind === "ROUTED") {
    const previous = routeOwners.get(route);
    if (previous && previous.archetype !== "CONTENT_INSTANCE" && archetype !== "CONTENT_INSTANCE") {
      fail(`${id}: route ${route} already owned by ${previous.id} (${previous.screenName})`);
    }
    if (!previous || archetype !== "CONTENT_INSTANCE") {
      routeOwners.set(route, { id, screenName: cell(row, "Screen name"), archetype });
    }
  }

  records.push({
    id,
    journeyCode: cell(row, "Journey code"),
    journey: singleLine(cell(row, "Journey")),
    step,
    type: rawType,
    screenName: singleLine(cell(row, "Screen name")),
    roles: singleLine(cell(row, "User role(s)")),
    roleIds: cell(row, "Role IDs")
      .split(",")
      .map((role) => role.trim())
      .filter(Boolean),
    coreUi: singleLine(cell(row, "Core UI components")),
    primaryAction: singleLine(cell(row, "Primary user action")),
    gate,
    route,
    routeKind,
    hostScreenId: cell(row, "Host screen ID"),
    hostPath,
    entryTrigger: singleLine(cell(row, "Entry trigger")),
    archetype,
    renderContract: singleLine(cell(row, "Render contract")),
    actionClass: cell(row, "Business action class"),
    domainObjects: singleLine(cell(row, "Domain objects / source data")),
    dataClass: cell(row, "Data classification"),
    sourceOffice: singleLine(cell(row, "Responsible source office")),
    permissionContract: singleLine(cell(row, "Server-side permission contract")),
    consequentialEffect: singleLine(cell(row, "Consequential effect permitted")),
    adverseStates: singleLine(cell(row, "Mandatory adverse-state scenarios")),
    recoveryRoute: singleLine(cell(row, "Human fallback / recovery route")),
    evidenceContract: singleLine(cell(row, "Evidence and audit contract")),
    a11y: singleLine(cell(row, "A11y / responsive pattern")),
    acceptanceCriterion: singleLine(cell(row, "Primary acceptance criterion")),
    acceptanceId: cell(row, "IA acceptance ID"),
    priority: cell(row, "Release priority"),
    releaseStatus: cell(row, "Verified release status"),
    changeClass: cell(row, "Change class"),
    sourceFamily: cell(row, "Source screen-family alignment"),
    authority: singleLine(cell(row, "Authority / source")),
    implementationHint: singleLine(cell(row, "Implementation hint")),
    screenRole: singleLine(cell(row, "Role of screen")),
  });
}

// Second pass: hosted screens whose host is named by ID but not by path.
//
// A hosted state can itself host another state (BRD-012 is hosted by BRD-008,
// which is hosted by the /brands directory), and the CSV's HOSTED@ path can
// name a parent area rather than the host's own URL (AUTH-005 says
// HOSTED@/account while AUTH-001 serves /sign-in). Neither case is invented
// here: hostPath is resolved from the host chain the CSV itself declares, and
// the host screen ID stays the authoritative link.
const byId = new Map(records.map((record) => [record.id, record]));
for (let pass = 0; pass < 5; pass += 1) {
  let resolved = 0;
  for (const record of records) {
    if (record.routeKind !== "HOSTED" || record.hostPath) continue;
    const host = record.hostScreenId ? byId.get(record.hostScreenId) : undefined;
    if (!host) continue;
    const hostLocation = host.routeKind === "ROUTED" ? host.route : host.hostPath;
    if (!hostLocation) continue;
    record.hostPath = hostLocation;
    resolved += 1;
  }
  if (resolved === 0) break;
}

const uniqueRoutes = new Set(records.filter((r) => r.routeKind === "ROUTED").map((r) => r.route));
const journeys = new Set(records.map((r) => r.journeyCode));

const headerLines = [
  "/* eslint-disable */",
  "/**",
  " * GENERATED FILE — DO NOT EDIT BY HAND.",
  " *",
  " * Source: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv",
  ` * SHA-256: ${sha256}`,
  " * Regenerate with: pnpm ia:generate",
  " */",
  "",
  'import type { IAScreen, IARegistrySource } from "./types.js";',
  "",
  "export const IA_REGISTRY_SOURCE: IARegistrySource = {",
  `  csvPath: ${JSON.stringify(REL_CSV_PATH)},`,
  `  sha256: ${JSON.stringify(sha256)},`,
  `  rowCount: ${records.length},`,
  `  routedCount: ${routedCount},`,
  `  hostedCount: ${hostedCount},`,
  `  journeyCount: ${journeys.size},`,
  '  generatedBy: "scripts/ia/generate-ia-registry.mjs",',
  "};",
  "",
  "export const IA_REGISTRY: readonly IAScreen[] = [",
];

const body = records
  .map((record) => {
    const lines = Object.entries(record)
      .map(([key, value]) => `    ${key}: ${JSON.stringify(value)},`)
      .join("\n");
    return `  {\n${lines}\n  },`;
  })
  .join("\n");

const output = `${headerLines.join("\n")}\n${body}\n];\n`;

if (checkOnly) {
  const current = existsSync(OUT_PATH) ? readFileSync(OUT_PATH, "utf8") : "";
  if (current !== output) {
    fail("checked-in registry is stale; run pnpm ia:generate");
  }
  console.log(
    `ia:generate --check OK (${records.length} records, ${uniqueRoutes.size} route patterns, sha256 ${sha256.slice(0, 12)})`
  );
  process.exit(0);
}

writeFileSync(OUT_PATH, output, "utf8");
console.log(
  `ia:generate wrote ${records.length} records (${routedCount} routed, ${hostedCount} hosted, ${uniqueRoutes.size} unique route patterns, ${journeys.size} journeys) to src/web/ia/registry.generated.ts`
);
