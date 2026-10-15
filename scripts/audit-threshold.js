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

const MAX_CRITICAL = 0;
const MAX_HIGH = 0;

const result = spawnSync("pnpm", ["audit", "--json"], {
  encoding: "utf8",
  maxBuffer: 32 * 1024 * 1024,
});

// pnpm audit exits non-zero when advisories exist, but still prints JSON.
const stdout = (result.stdout || "").trim();
let summary;
try {
  const parsed = JSON.parse(stdout.slice(stdout.indexOf("{")));
  summary = parsed.metadata?.vulnerabilities;
  if (!summary) throw new Error("missing metadata.vulnerabilities");
} catch {
  process.stderr.write("audit-threshold: could not parse `pnpm audit --json` output\n");
  process.stderr.write(stdout.slice(0, 2000) + "\n");
  process.exit(1);
}

const critical = Number(summary.critical || 0);
const high = Number(summary.high || 0);
const moderate = Number(summary.moderate || 0);
const low = Number(summary.low || 0);

process.stdout.write(
  `Dependency advisories — critical: ${critical}, high: ${high}, moderate: ${moderate}, low: ${low}\n`
);

if (critical > MAX_CRITICAL || high > MAX_HIGH) {
  process.stderr.write(
    `audit-threshold: POLICY VIOLATION — allowed critical<=${MAX_CRITICAL}, high<=${MAX_HIGH}\n` +
      "Register any accepted advisories in docs/audit/dependency-triage.md and record the approving owner.\n"
  );
  process.exit(1);
}

process.stdout.write("audit-threshold: OK — within vulnerability policy\n");
