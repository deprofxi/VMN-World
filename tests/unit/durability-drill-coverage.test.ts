/**
 * TSK-47 — failure-drill coverage for every durable domain.
 *
 * TSK-17 turned ten domains into durable stores, TSK-19 added the provider-event
 * claim, TSK-32/TSK-33 the ledger, TSK-60 box 3 the deal portfolio and TSK-18 the
 * audit ledger. The register's remaining ask was that each of those domains *has*
 * a drill, because a durable store nobody restarts against is a claim, not a
 * control.
 *
 * This file makes that ask an instrument instead of a sentence. It reads the three
 * places the claim lives — the `registerDurableStore` call sites in `src/`, the
 * branches of the restart reader, and the drill bodies — and fails when they stop
 * agreeing: a new store with no drill, a drill that reads back inside its own
 * process, or a reader branch nothing owns.
 *
 * It also enforces the number printed in the register's own preamble ("13 journey
 * failure drills exist"), because a census in prose is the version of a number
 * nobody re-measures.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(new URL("../../", import.meta.url).pathname);
const SRC = path.join(REPO_ROOT, "src");
const DURABILITY_SUITE = "tests/unit/durability-release-critical.test.ts";
const RESTART_READER = "tests/helpers/durable-restart-reader.mjs";
const JOURNEY_DRILLS = "tests/integration/journey-failure-drills.test.ts";
const REGISTER = "tasks.md";

const read = (rel: string): string => fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");

function tsFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...tsFiles(abs));
    else if (entry.name.endsWith(".ts")) found.push(abs);
  }
  return found;
}

/**
 * The domain register. `storeKey` is the string the domain module passes to
 * `registerDurableStore`; `entity` is the branch name the restart reader answers
 * under. `null` storeKey means the domain is durable without the write-behind
 * journal — `providerEventClaim` is claimed by a unique row, not staged.
 */
interface DurableDomain {
  readonly domain: string;
  readonly storeKey: string | null;
  readonly entity: string;
  readonly addedBy: string;
}

const DOMAINS: readonly DurableDomain[] = [
  { domain: "commercial intake (Enquiry)", storeKey: "commercialEnquiry", entity: "enquiry", addedBy: "TSK-17" },
  { domain: "four-eyes approvals", storeKey: "approvalItem", entity: "approval", addedBy: "TSK-17" },
  { domain: "restricted privacy/security cases", storeKey: "privacySecurityCase", entity: "case", addedBy: "TSK-17" },
  { domain: "risk register", storeKey: "riskRecord", entity: "risk", addedBy: "TSK-17" },
  { domain: "issue register", storeKey: "issueRecord", entity: "issue", addedBy: "TSK-17" },
  { domain: "Azeebo+ destination registry", storeKey: "azeeboDestination", entity: "destination", addedBy: "TSK-17" },
  { domain: "DAM media assets", storeKey: "mediaAssetRecord", entity: "mediaAsset", addedBy: "TSK-17" },
  { domain: "auth sessions (digest only)", storeKey: "sessionRecord", entity: "session", addedBy: "TSK-17" },
  { domain: "idempotency outcomes", storeKey: "idempotencyRecord", entity: "idempotency", addedBy: "TSK-17" },
  { domain: "CMS revision chain", storeKey: "contentItem", entity: "content", addedBy: "TSK-17" },
  { domain: "ledger journal entries", storeKey: "journalEntry", entity: "journal", addedBy: "TSK-32" },
  { domain: "sponsor bindings", storeKey: "sponsorBinding", entity: "sponsorBinding", addedBy: "TSK-16" },
  { domain: "sponsor fulfilment evidence", storeKey: "sponsorFulfillment", entity: "sponsorFulfillment", addedBy: "TSK-16" },
  { domain: "Quote-to-Cash deal portfolio", storeKey: "salesDeal", entity: "salesDeal", addedBy: "TSK-60" },
  { domain: "tamper-evident audit ledger", storeKey: "auditLog", entity: "auditLedger", addedBy: "TSK-18" },
  { domain: "provider event claims", storeKey: null, entity: "providerClaim", addedBy: "TSK-19" },
];

/** store key -> `src/file:line`, measured from the tree rather than asserted from memory. */
function registeredStores(): Map<string, string> {
  const hits = new Map<string, string>();
  for (const file of tsFiles(SRC)) {
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      const m = /registerDurableStore<[^>]+>\(\s*"([^"]+)"/.exec(line);
      if (m) hits.set(m[1], `${path.relative(REPO_ROOT, file)}:${i + 1}`);
    });
  }
  return hits;
}

function readerBranches(): Set<string> {
  const src = read(RESTART_READER);
  return new Set([...src.matchAll(/^ {2}([A-Za-z]+): async \(key\)/gm)].map((m) => m[1]));
}

/** entity -> how many times a drill actually restarts against it. */
function restartReadsByEntity(): Map<string, number> {
  const src = read(DURABILITY_SUITE);
  const counts = new Map<string, number>();
  for (const m of src.matchAll(/restartRead\("([A-Za-z]+)"/g)) {
    counts.set(m[1], (counts.get(m[1]) ?? 0) + 1);
  }
  return counts;
}

/**
 * Every declared test in the durability suite, restart or not — the failure-half
 * drills below are plain `it(...)` cases, because a rollback needs no child process.
 */
function testLabels(): string[] {
  return [...read(DURABILITY_SUITE).matchAll(/^\s{2}(?:restartIt|it)\("([^"]+)"/gm)].map((m) => m[1]);
}

describe("TSK-47: every durable domain has a restart/failure drill", () => {
  const stores = registeredStores();
  const branches = readerBranches();
  const restarts = restartReadsByEntity();

  it("registers the durable stores the domain table names — and refuses an unregistered new one", () => {
    const expected = DOMAINS.map((d) => d.storeKey).filter((k): k is string => k !== null).sort();
    const measured = [...stores.keys()].sort();
    expect(
      measured,
      `src/ registers ${measured.length} durable stores but the TSK-47 domain table names ${expected.length}`
    ).toEqual(expected);
    // A store added to src/ without a row above fails the comparison, so the
    // only way to register a durable domain is to give it a drill as well.
    expect(measured.length).toBeGreaterThanOrEqual(14);
  });

  it("gives every durable domain a restart-reader branch", () => {
    const missing = DOMAINS.filter((d) => !branches.has(d.entity));
    expect(missing.map((d) => d.entity), `no restart-reader branch for: ${missing.map((d) => d.entity).join(", ")}`).toEqual([]);
  });

  it("restarts against every durable domain at least once", () => {
    const unmeasured = DOMAINS.filter((d) => (restarts.get(d.entity) ?? 0) === 0);
    expect(
      unmeasured.map((d) => d.entity),
      `no restart drill for: ${unmeasured.map((d) => `${d.entity} (${d.domain}, ${d.addedBy})`).join(", ")}`
    ).toEqual([]);
  });

  it("leaves no reader branch orphaned — every branch is owned by a domain", () => {
    const owned = new Set(DOMAINS.map((d) => d.entity));
    const orphans = [...branches].filter((b) => !owned.has(b));
    expect(orphans, `restart-reader branches no domain claims: ${orphans.join(", ")}`).toEqual([]);
  });

  it("measures durability through a child process, not a re-read in the same one", () => {
    const src = read(DURABILITY_SUITE);
    // The three source shapes that make a restart real. Dropping any of them
    // turns the suite back into the Map-echo CA-12 was raised for.
    expect(src).toContain("durable-restart-reader.mjs");
    expect(src).toMatch(/execFileSync\(process\.execPath, \[RESTART_READER/);
    expect(src).toMatch(/expect\(result\.database[\s\S]{0,160}\.toBe\(true\)/);
    // And the child is built from the production artifact, so a stale dist/ cannot
    // be certified as durable.
    expect(src).toMatch(/function ensureCompiledArtifact\(\)[\s\S]{0,400}TSC_BIN/);
  });

  it("keeps the failure half of the drill set: rollback, fail-closed 503, and an unregistered store", () => {
    const labels = testLabels();
    const has = (needle: string): boolean => labels.some((l) => l.toLowerCase().includes(needle));
    expect(has("fails closed with 503"), "the rejected-row / 503 drill disappeared from the durability suite").toBe(true);
    expect(has("rolls the approval back"), "the write-rollback drill disappeared").toBe(true);
    expect(has("sandbox"), "the sandbox-deferred census drill disappeared").toBe(true);
    expect(has("replay"), "the cross-process provider replay drill disappeared").toBe(true);
    expect(has("nobody registered"), "the unregistered-store refusal drill disappeared").toBe(true);
    expect(labels.length, "the durability suite's declared test count drifted from its restartIt/it labels").toBe(19);
    // The unregistered-store case is asserted at the seam, not only by label.
    const suite = read(DURABILITY_SUITE);
    expect(suite).toContain("RepositoryUnavailableError");
    expect(suite).toMatch(/refuses to stage a write for a store nobody registered/);
  });

  it("prints the coverage census the register quotes", () => {
    const rows = DOMAINS.map((d) => {
      const where = d.storeKey ? stores.get(d.storeKey) ?? "MISSING" : "claim row (not journal-staged)";
      const drills = restarts.get(d.entity) ?? 0;
      return `  ${d.entity.padEnd(19)} ${String(drills)} restart drill(s)  ${d.addedBy.padEnd(7)} ${where}`;
    });
    console.log(
      `\n[TSK-47] durable domains: ${DOMAINS.length} · registered stores in src/: ${stores.size} · ` +
        `reader branches: ${branches.size} · restart reads in the suite: ${[...restarts.values()].reduce((a, b) => a + b, 0)}\n` +
        rows.join("\n")
    );
  });
});

describe("TSK-47: the journey-drill census the register prints is the file's", () => {
  const claim = /(\d+) journey failure drills exist/.exec(read(REGISTER));
  // Anchored on the line start this would miss DRILL-APP-01, which shares a line
  // with its `describe(...)` opener in that file.
  const measured = [...read(JOURNEY_DRILLS).matchAll(/\bit\("DRILL-/g)].length;

  it("states the preamble number, or the prose changes", () => {
    expect(claim, `tasks.md no longer prints '<N> journey failure drills exist' — re-pin this test and the sentence together`).not.toBeNull();
    expect(
      Number(claim?.[1]),
      `tasks.md claims ${claim?.[1]} journey failure drills; ${JOURNEY_DRILLS} contains ${measured}`
    ).toBe(measured);
    expect(measured).toBeGreaterThanOrEqual(13);
  });

  it("names the drill ids so a silent deletion shows up as a change, not a pass", () => {
    const ids = [...read(JOURNEY_DRILLS).matchAll(/it\("(DRILL-[A-Z]+-\d+)/g)].map((m) => m[1]);
    expect(ids.length).toBe(measured);
    console.log(`[TSK-47] journey failure drills (${ids.length}): ${ids.join(", ")}`);
  });
});
