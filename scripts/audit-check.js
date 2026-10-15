#!/usr/bin/env node
/**
 * VMNL Dependency Advisory Register Verification
 * Governing Authority: VMNL-AZP-VMN-CCPP-001 §11 / docs/audit/dependency-triage.md
 *
 * Rules:
 * 1. Executes `pnpm audit --json`.
 * 2. Compares discovered advisory IDs against the documented triage register.
 * 3. If an advisory is not registered, execution HARD FAILS (exit 1).
 * 4. A successful check confirms registration only; it does not validate exploitability or approval.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const registerPath = new URL('../docs/audit/dependency-triage.md', import.meta.url);
const registerText = readFileSync(registerPath, 'utf8');
const advisoryRows = registerText.split(/\r?\n/).filter((line) => /^\|\s*\*\*GHSA-[^|]+\*\*/.test(line));
const REGISTERED_GHSAS = new Set(advisoryRows.map((line) => line.match(/GHSA-[A-Za-z0-9-]+/)?.[0]).filter(Boolean));
if (advisoryRows.length === 0 || REGISTERED_GHSAS.size !== advisoryRows.length) {
  console.error('[AUDIT] Dependency triage register is missing advisory IDs or has malformed rows.');
  process.exit(1);
}

console.log('[AUDIT] Running pnpm audit against dependency vulnerability database...');

let auditOutput = '';
try {
  auditOutput = execSync('pnpm audit --json', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
} catch (err) {
  // pnpm audit exits with non-zero when vulnerabilities are found; stdout still contains JSON
  if (err && err.stdout) {
    auditOutput = err.stdout.toString();
  } else {
    console.error('[AUDIT] Failed to execute pnpm audit:', err.message);
    process.exit(1);
  }
}

let auditJson;
try {
  auditJson = JSON.parse(auditOutput);
} catch (err) {
  console.error('[AUDIT] Failed to parse pnpm audit JSON output:', err.message);
  process.exit(1);
}

const advisories = auditJson.advisories || {};
const totalFound = Object.keys(advisories).length;

if (totalFound === 0) {
  console.log(`[AUDIT] Zero vulnerabilities found; ${REGISTERED_GHSAS.size} historical advisory records remain in the triage register. Approval and applicability are not checked.`);
  process.exit(0);
}

const unregistered = [];
const registered = [];

for (const [id, adv] of Object.entries(advisories)) {
  const ghsa = adv.github_advisory_id;
  const pkg = adv.module_name;
  const severity = adv.severity;
  const title = adv.title;

  if (ghsa && REGISTERED_GHSAS.has(ghsa)) {
    registered.push({ ghsa, pkg, severity, title });
  } else {
    unregistered.push({ id, ghsa: ghsa || 'NO-GHSA', pkg, severity, title, url: adv.url });
  }
}

console.log(`[AUDIT] Total vulnerabilities identified: ${totalFound}`);
console.log(`[AUDIT] Registered advisory IDs: ${registered.length}`);

for (const item of registered) {
  console.log(`  - [REGISTERED; REVIEW REQUIRED] [${item.severity.toUpperCase()}] ${item.pkg} (${item.ghsa}): ${item.title}`);
}

if (unregistered.length > 0) {
  console.error(`\n[AUDIT] ❌ ${unregistered.length} UNREGISTERED VULNERABILITY ADVISORIES DETECTED!`);
  for (const item of unregistered) {
    console.error(`  - [UNREGISTERED] [${item.severity.toUpperCase()}] ${item.pkg} (${item.ghsa}): ${item.title}`);
    console.error(`    Advisory: ${item.url}`);
  }
  console.error('\nAction Required: Update dependencies or document and review the advisory in docs/audit/dependency-triage.md.');
  process.exit(1);
}

console.log('\n[AUDIT] All discovered advisories are present in docs/audit/dependency-triage.md. Approval, exploitability, and release suitability were not validated.');
process.exit(0);
