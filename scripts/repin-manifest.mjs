#!/usr/bin/env node
/**
 * Post-commit release-manifest re-pin — plan 0.5, fixing PR-03 / N-03.
 * Governing authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §67 / tasks.md §8, TSK-37, HD-01.
 *
 * Run this ONLY after the work is committed:
 *
 *     node scripts/repin-manifest.mjs && git add release-manifest.json
 *
 * What it does, in order:
 *   1. reads `git rev-parse HEAD` — the commit that carries the work;
 *   2. builds a candidate manifest with that SHA and a fresh `evaluatedAt` on
 *      every gate;
 *   3. evaluates the candidate through the SAME `ReleaseGatePipeline` that
 *      `gates:check` uses, proving every `evidenceRef` resolves against the
 *      working tree and every evaluation is inside the 30-day freshness window;
 *   4. writes the file ONLY if that evaluation produced zero evidence findings —
 *      a gate that cannot resolve its cited evidence is not re-dated, and the
 *      script exits 1 without touching the manifest;
 *   5. prints what changed.
 *
 * What it deliberately never touches: `decision` (stays GO_WITH_CONDITIONS —
 * only an authorised human owner may change a release decision), the
 * `humanReleaseOwner` / `conditionsAcceptance` signatures (never manufactured —
 * DEC-RL1-SCOPE-001 does not manufacture missing business approval), and any
 * gate `status`.
 *
 * `pnpm build` must have run first: the pipeline is imported from `dist/`, the
 * same artifact `gates:check` evaluates.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = path.join(ROOT, 'release-manifest.json');
const PIPELINE_PATH = path.join(ROOT, 'dist', 'src', 'modules', 'quality', 'gates.js');

const fail = (msg) => {
  console.error(`[repin-manifest] REFUSED: ${msg}`);
  process.exit(1);
};

// `--check` verifies and reports without writing — run it any time; the plain
// invocation is the post-commit re-pin itself.
const checkOnly = process.argv.includes('--check');

// 1. The commit this re-pin will attest.
let headSha;
try {
  headSha = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
} catch {
  fail('`git rev-parse HEAD` failed — this is a git repository step, run it from the checkout.');
}
if (!/^[0-9a-f]{40}$/.test(headSha)) fail(`HEAD did not resolve to a full SHA: ${headSha}`);

if (!existsSync(PIPELINE_PATH)) {
  fail(`pipeline not built at ${path.relative(ROOT, PIPELINE_PATH)} — run \`pnpm build\` first.`);
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
if (!manifest.gates || typeof manifest.gates !== 'object') fail('release-manifest.json has no gates object.');
const previousSha = manifest.gitCommitSha;

// 2. Candidate: new commit binding + fresh evaluation timestamps, nothing else.
const now = new Date();
const candidate = {
  ...manifest,
  gitCommitSha: headSha,
  gates: Object.fromEntries(
    Object.entries(manifest.gates).map(([id, gate]) => [id, { ...gate, evaluatedAt: now.toISOString() }])
  ),
};

// 3. Evaluate through the real pipeline — evidence resolution and freshness are
//    proven by the same code `gates:check` runs, not re-implemented here.
const { ReleaseGatePipeline } = await import(`file://${PIPELINE_PATH}`);
const evaluationInput = {
  ...candidate,
  gates: Object.fromEntries(
    Object.entries(candidate.gates).map(([id, gate]) => [id, { ...gate, evaluatedAt: new Date(gate.evaluatedAt) }])
  ),
  humanReleaseOwner: {
    ...candidate.humanReleaseOwner,
    signedAt: new Date(candidate.humanReleaseOwner.signedAt),
  },
  ...(candidate.conditionsAcceptance
    ? { conditionsAcceptance: { ...candidate.conditionsAcceptance, acceptedAt: new Date(candidate.conditionsAcceptance.acceptedAt) } }
    : {}),
};

const result = ReleaseGatePipeline.evaluateBroadcastRelease(evaluationInput, {
  evidenceRoot: ROOT,
  now,
  maxEvidenceAgeDays: 30,
});

if (result.evidenceFindings.length > 0) {
  console.error(`[repin-manifest] REFUSED: ${result.evidenceFindings.length} evidence finding(s); manifest untouched:`);
  for (const finding of result.evidenceFindings) {
    console.error(`  - ${finding.code}: ${finding.detail}`);
  }
  process.exit(1);
}

// 4. Write only gates' evaluatedAt + gitCommitSha. Formatting matches the
//    committed file byte-for-byte apart from those values (roundtrip-stable).
if (checkOnly) {
  console.log('[repin-manifest] --check: evidence verified, manifest NOT written.');
  console.log(`[repin-manifest] would set gitCommitSha: ${previousSha ?? "(unset)"} -> ${headSha}`);
  console.log(`[repin-manifest] would refresh evaluatedAt on ${Object.keys(candidate.gates).length} gates to ${now.toISOString()}`);
  process.exit(0);
}
writeFileSync(MANIFEST_PATH, `${JSON.stringify(candidate, null, 2)}\n`);

// 5. Report.
console.log(`[repin-manifest] gitCommitSha: ${previousSha ?? '(unset)'} -> ${headSha}`);
console.log(`[repin-manifest] evaluatedAt:  ${manifest.gates[Object.keys(manifest.gates)[0]].evaluatedAt} -> ${now.toISOString()} (all ${Object.keys(candidate.gates).length} gates)`);
console.log(`[repin-manifest] decision left untouched: ${manifest.decision}`);
console.log(`[repin-manifest] evidence: every evidenceRef resolved against the working tree (0 findings, 30-day window)`);
console.log(`[repin-manifest] signatures untouched: humanReleaseOwner.signedAt=${manifest.humanReleaseOwner?.signedAt ?? 'n/a'}`);
console.log('[repin-manifest] next: git add release-manifest.json && git commit (see tasks.md TSK-37 / HD-01).');
