/**
 * PR-04: the BG0–BG9 release gate must attest evidence, not restate a manifest.
 *
 * The audit measured the defect as reproduced: `gates:check` answered
 * `GO_WITH_CONDITIONS` because `release-manifest.json` said `"status": "PASS"`,
 * and the only independent control was that the release owner had a name.
 * `evidenceRef` was never opened and `evaluatedAt` was never freshness-checked —
 * every gate carried the same `2026-09-28` date from the day the manifest was
 * written. Deleting a cited test file changed nothing.
 *
 * Authority: `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A` §67 (NOT_TESTED is never
 * represented as PASS); plan §5.1–5.2 of
 * `docs/audit/production-readiness-deepcheck-2026-10-16.md`.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  ReleaseGatePipeline,
  type BroadcastGateId,
  type BroadcastReleaseGate,
  type BroadcastReleaseManifest,
} from "../../src/modules/quality/gates.js";
import {
  canonicalManifestPayload,
  computeArtifactDigest,
  signCanonicalManifest,
  verifyManifestSignature,
} from "../../src/modules/quality/artifact.js";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const EVIDENCE_REF = "tests/unit/release-evidence-integrity.test.ts";
const SIGNING_KEY = "test-signing-key-not-a-real-secret";

const GATE_IDS: BroadcastGateId[] = [
  "BG0_CHANNEL_AUTHORITY",
  "BG1_CATALOGUE",
  "BG2_RIGHTS",
  "BG3_SCHEDULE",
  "BG4_TRAFFIC",
  "BG5_PLAYOUT",
  "BG6_CARRIAGE",
  "BG7_FINANCE",
  "BG8_AZEEBO",
  "BG9_CONTINUITY",
];

function gate(overrides: Partial<BroadcastReleaseGate> = {}): BroadcastReleaseGate {
  return {
    id: "BG0_CHANNEL_AUTHORITY",
    name: "Channel Authority",
    description: "Channel identity and ownership configured",
    status: "PASS",
    evidenceRef: EVIDENCE_REF,
    evaluatedAt: new Date(),
    verifiedBy: "QAAutomation",
    ...overrides,
  };
}

function manifest(gateOverrides: Record<string, Partial<BroadcastReleaseGate>> = {}, topLevel: Partial<BroadcastReleaseManifest> = {}): BroadcastReleaseManifest {
  const gates = {} as Record<BroadcastGateId, BroadcastReleaseGate>;
  for (const id of GATE_IDS) {
    gates[id] = gate({ id, name: id, ...(gateOverrides[id] ?? {}) });
  }
  return {
    version: "1.0.0-rc1",
    environment: "SANDBOX_S2",
    gitCommitSha: "HEAD",
    humanReleaseOwner: {
      name: "Femi Aderibigbe",
      role: "Executive Chairman & Broadcast Authority",
      employeeId: "VMNL-EXEC-001",
      signedAt: new Date(),
    },
    gates,
    ...topLevel,
  };
}

const OPTIONS = { evidenceRoot: REPO_ROOT, now: new Date() } as const;

describe("PR-04: release gates resolve the evidence they cite", () => {
  it("refuses a PASS gate whose cited evidence path does not exist", () => {
    const result = ReleaseGatePipeline.evaluateBroadcastRelease(
      // The cited path must stay absent for the assertion to mean anything.
      manifest({ BG2_RIGHTS: { evidenceRef: "tests/unit/this-file-was-deleted.test.ts" } }), // citation:absent
      OPTIONS
    );

    expect(result.canDeploy).toBe(false);
    expect(result.decision).toBe("HOLD");
    expect(result.evidenceFindings).toHaveLength(1);
    expect(result.evidenceFindings[0].code).toBe("UNRESOLVED_EVIDENCE_PATH");
    expect(result.evidenceFindings[0].gateId).toBe("BG2_RIGHTS");
  });

  it("refuses a PASS gate that cites no evidence at all", () => {
    const result = ReleaseGatePipeline.evaluateBroadcastRelease(
      manifest({ BG9_CONTINUITY: { evidenceRef: undefined } }),
      OPTIONS
    );

    expect(result.canDeploy).toBe(false);
    expect(result.evidenceFindings.map((f) => f.code)).toContain("MISSING_EVIDENCE");
  });

  it("refuses narrative evidence, because a contract name cannot be re-checked", () => {
    const result = ReleaseGatePipeline.evaluateBroadcastRelease(
      manifest({ BG5_PLAYOUT: { evidenceRef: "StarTimes DTT Carriage Agreement (Provisional / Configurable)" } }),
      OPTIONS
    );

    expect(result.canDeploy).toBe(false);
    expect(result.evidenceFindings.map((f) => f.code)).toContain("PROSE_ONLY_EVIDENCE");
  });

  it("refuses an evaluation older than the policy window", () => {
    const stale = new Date(Date.now() - 400 * 86_400_000);
    const result = ReleaseGatePipeline.evaluateBroadcastRelease(
      manifest({ BG7_FINANCE: { evaluatedAt: stale } }),
      OPTIONS
    );

    expect(result.canDeploy).toBe(false);
    expect(result.decision).toBe("HOLD");
    expect(result.evidenceFindings.map((f) => f.code)).toContain("STALE_EVIDENCE");
  });

  it("honours an explicit freshness policy rather than a fixed window", () => {
    const twoDaysOld = new Date(Date.now() - 2 * 86_400_000);
    const result = ReleaseGatePipeline.evaluateBroadcastRelease(
      manifest({ BG7_FINANCE: { evaluatedAt: twoDaysOld } }),
      { ...OPTIONS, maxEvidenceAgeDays: 1 }
    );

    expect(result.evidenceFindings.map((f) => f.code)).toContain("STALE_EVIDENCE");
  });

  it("does not punish a NOT_TESTED gate for lacking resolvable evidence", () => {
    // A gate that admits it was never tested is making no claim to verify: BG6
    // carries a carriage-agreement description and must stay awkward, not
    // fabricated into something that looks testable.
    const result = ReleaseGatePipeline.evaluateBroadcastRelease(
      manifest({
        BG6_CARRIAGE: {
          status: "NOT_TESTED",
          reason: "No machine interface exists post-adapter-removal.",
          evidenceRef: "StarTimes DTT Carriage Agreement (Provisional / Configurable)",
        },
      }),
      OPTIONS
    );

    expect(result.evidenceFindings).toEqual([]);
    expect(result.untestedGates).toHaveLength(1);
  });

  it("parses the composite evidenceRefs the shipped manifest actually uses", () => {
    const parsed = ReleaseGatePipeline.parseEvidenceRef(
      "src/core/queue/index.ts (configureRollingEpgScheduler) & tests/unit/quality-gates.test.ts"
    );

    expect(parsed.paths).toEqual([
      "src/core/queue/index.ts",
      "tests/unit/quality-gates.test.ts",
    ]);
    expect(parsed.prose).toEqual([]);
  });

  it("resolves every cited path in the shipped release manifest", () => {
    // The register's §7 reproduction says "deleting a cited test file fails
    // gates:check". This is that assertion, without spawning the CLI.
    const shipped = JSON.parse(
      fs.readFileSync(path.join(REPO_ROOT, "release-manifest.json"), "utf8")
    ) as BroadcastReleaseManifest;
    const gates = Object.fromEntries(
      Object.entries(shipped.gates).map(([id, g]) => [id, { ...g, evaluatedAt: new Date(g.evaluatedAt) }])
    ) as Record<BroadcastGateId, BroadcastReleaseGate>;

    const result = ReleaseGatePipeline.evaluateBroadcastRelease(
      { ...shipped, gates, humanReleaseOwner: { ...shipped.humanReleaseOwner, signedAt: new Date(shipped.humanReleaseOwner.signedAt) } },
      { ...OPTIONS, maxEvidenceAgeDays: 60 }
    );

    expect(result.evidenceFindings).toEqual([]);
  });

  it("deletes a cited test file and watches the gate refuse", () => {
    // The falsification probe from the audit's §7, run for real: copy the
    // manifest's evidence into a scratch tree, resolve it, then remove the file
    // and resolve again. A control that cannot fail is not a control.
    const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "vmnl-evidence-"));
    const cited = path.join(scratch, "cited-evidence.test.ts");
    fs.writeFileSync(cited, "// evidence\n");

    // Every gate cites the scratch file, so the scratch tree is self-consistent
    // and the only variable under test is the deletion.
    const allCitingScratch = Object.fromEntries(
      GATE_IDS.map((id) => [id, { evidenceRef: "cited-evidence.test.ts" }])
    );

    const before = ReleaseGatePipeline.evaluateBroadcastRelease(manifest(allCitingScratch), {
      evidenceRoot: scratch,
      now: new Date(),
    });
    expect(before.evidenceFindings).toEqual([]);
    expect(before.canDeploy).toBe(true);

    fs.rmSync(cited);
    const after = ReleaseGatePipeline.evaluateBroadcastRelease(manifest(allCitingScratch), {
      evidenceRoot: scratch,
      now: new Date(),
    });
    expect(after.canDeploy).toBe(false);
    expect(after.evidenceFindings[0].code).toBe("UNRESOLVED_EVIDENCE_PATH");

    fs.rmSync(scratch, { recursive: true, force: true });
  });
});

describe("PR-04 §5.2: the release decision is bound to a built artefact", () => {
  it("requires an artefact digest in PRODUCTION_S5 and accepts a matching one", () => {
    const withoutDigest = ReleaseGatePipeline.evaluateBroadcastRelease(
      manifest({}, { environment: "PRODUCTION_S5" }),
      { ...OPTIONS, requireArtifactBinding: true, artifactDigest: "a".repeat(64) }
    );
    expect(withoutDigest.canDeploy).toBe(false);
    expect(withoutDigest.artifactAttested).toBe(false);
    expect(withoutDigest.failingGates.some((g) => g.includes("ARTIFACT_DIGEST"))).toBe(true);

    const digest = "b".repeat(64);
    const matching = ReleaseGatePipeline.evaluateBroadcastRelease(
      manifest({}, { environment: "PRODUCTION_S5", artifactDigest: digest }),
      { ...OPTIONS, requireArtifactBinding: true, artifactDigest: digest }
    );
    expect(matching.artifactAttested).toBe(true);
    expect(matching.canDeploy).toBe(true);
  });

  it("refuses a decision signed against a different build", () => {
    const result = ReleaseGatePipeline.evaluateBroadcastRelease(
      manifest({}, { environment: "PRODUCTION_S5", artifactDigest: "c".repeat(64) }),
      { ...OPTIONS, requireArtifactBinding: true, artifactDigest: "d".repeat(64) }
    );

    expect(result.canDeploy).toBe(false);
    expect(result.artifactAttested).toBe(false);
  });

  it("computes a digest that changes when the build changes", () => {
    const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "vmnl-dist-"));
    fs.writeFileSync(path.join(scratch, "index.js"), "export const a = 1;\n");

    const first = computeArtifactDigest(scratch);
    expect(first).not.toBeNull();
    expect(first!.fileCount).toBe(1);

    fs.writeFileSync(path.join(scratch, "index.js"), "export const a = 2;\n");
    const second = computeArtifactDigest(scratch);
    expect(second!.digest).not.toBe(first!.digest);

    // An absent build is not an empty build.
    fs.rmSync(scratch, { recursive: true, force: true });
    expect(computeArtifactDigest(scratch)).toBeNull();
  });

  it("verifies an owner signature and refuses a manifest altered after signing", () => {
    const signed = manifest({}, { environment: "PRODUCTION_S5", artifactDigest: "e".repeat(64) });
    signed.ownerSignature = signCanonicalManifest(signed, SIGNING_KEY);

    expect(verifyManifestSignature(signed, SIGNING_KEY).verified).toBe(true);

    // Same signature, one gate silently downgraded: the owner did not sign this.
    const tampered = { ...signed, gates: { ...signed.gates, BG2_RIGHTS: { ...signed.gates.BG2_RIGHTS, status: "NOT_APPLICABLE_WITH_REASON" as const } } };
    const verdict = verifyManifestSignature(tampered, SIGNING_KEY);
    expect(verdict.verified).toBe(false);
    expect(verdict.reason).toContain("SIGNATURE_INVALID");
  });

  it("distinguishes a missing key from a forged signature", () => {
    const unsigned = manifest();
    expect(verifyManifestSignature(unsigned, SIGNING_KEY).reason).toContain("NO_SIGNATURE");

    const signed = { ...manifest(), ownerSignature: "f".repeat(64) };
    expect(verifyManifestSignature(signed, undefined).reason).toContain("NO_SIGNING_KEY");
  });

  it("binds the digest and every gate status into the signed payload", () => {
    const payload = canonicalManifestPayload(manifest({}, { artifactDigest: "a".repeat(64) }));
    expect(payload).toContain("artifactDigest");
    expect(payload).toContain("BG9_CONTINUITY");
    expect(payload).toContain(EVIDENCE_REF);
  });
});
