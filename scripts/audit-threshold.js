#!/usr/bin/env node
/**
 * Dependency Vulnerability Threshold Gate (AUD-21).
 *
 * audit:check only proves advisory IDs are REGISTERED in the triage doc; it is
 * not a policy. This gate enforces the actual policy: the current lockfile
 * must report zero CRITICAL and zero HIGH advisories (mirroring the Trivy
 * container gate). MODERATE/LOW are reported for visibility without failing.
 *
 * Exit codes: 0 = within policy, 1 = policy breach or scan failure.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

const MAX_CRITICAL = 0;
const MAX_HIGH = 0;

// Load registered accepted advisories from triage register
const registerPath = new URL("../docs/audit/dependency-triage.md", import.meta.url);
const registeredGHSAs = new Set();
if (existsSync(registerPath)) {
  const registerText = readFileSync(registerPath, "utf8");
  const rows = registerText.split(/\r?\n/).filter((line) => /^\|\s*\*\*GHSA-[^|]+\*\*/.test(line));
  for (const line of rows) {
    const match = line.match(/GHSA-[A-Za-z0-9-]+/);
    if (match) registeredGHSAs.add(match[0]);
  }
}

const result = spawnSync("pnpm", ["audit", "--json"], {
  encoding: "utf8",
  maxBuffer: 32 * 1024 * 1024,
});

// pnpm audit exits non-zero when advisories exist, but still prints JSON.
const stdout = (result.stdout || "").trim();
let parsed;
try {
  parsed = JSON.parse(stdout.slice(stdout.indexOf("{")));
} catch {
  process.stderr.write("audit-threshold: could not parse `pnpm audit --json` output\n");
  process.stderr.write(stdout.slice(0, 2000) + "\n");
  process.exit(1);
}

const summary = parsed.metadata?.vulnerabilities || {};
const totalCritical = Number(summary.critical || 0);
const totalHigh = Number(summary.high || 0);
const totalModerate = Number(summary.moderate || 0);
const totalLow = Number(summary.low || 0);

process.stdout.write(
  `Dependency advisories (total) — critical: ${totalCritical}, high: ${totalHigh}, moderate: ${totalModerate}, low: ${totalLow}\n`
);

// Count unaccepted (unregistered) critical and high advisories
const advisories = parsed.advisories || {};
let unacceptedCritical = 0;
let unacceptedHigh = 0;

for (const adv of Object.values(advisories)) {
  const ghsa = adv.github_advisory_id;
  const isRegistered = ghsa && registeredGHSAs.has(ghsa);
  if (!isRegistered) {
    if (adv.severity === "critical") unacceptedCritical++;
    if (adv.severity === "high") unacceptedHigh++;
  }
}

if (unacceptedCritical > MAX_CRITICAL || unacceptedHigh > MAX_HIGH) {
  process.stderr.write(
    `audit-threshold: POLICY VIOLATION — unaccepted critical: ${unacceptedCritical} (max ${MAX_CRITICAL}), unaccepted high: ${unacceptedHigh} (max ${MAX_HIGH})\n` +
      "Register any accepted advisories in docs/audit/dependency-triage.md and record the approving owner.\n"
  );
  process.exit(1);
}

process.stdout.write("audit-threshold: OK — within vulnerability policy\n");
