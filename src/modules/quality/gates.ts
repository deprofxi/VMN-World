/**
 * Broadcast Release Gates (BG0–BG9) Evaluator & Manifest
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §67
 *
 * Governing Broadcast Release Gates:
 * - BG0: Channel authority — Channel identity and ownership configured.
 * - BG1: Catalogue — Programme and master records imported.
 * - BG2: Rights — Broadcast rights linked and cleared.
 * - BG3: Schedule — Schedule workflow passes.
 * - BG4: Traffic — Advertising inventory and commercial workflow pass.
 * - BG5: Playout — Playlist/as-run integration passes.
 * - BG6: Carriage — StarTimes endpoints and contacts mapped (or verified existing carriage).
 * - BG7: Finance — Commercial proof-to-invoice reconciliation works (7-way separation).
 * - BG8: Azeebo+ — Linear-to-digital universal link works.
 * - BG9: Continuity — Broadcast failure drills pass (20/20 failure drills).
 *
 * Core Constitutional Law (R1.2A §67):
 * - NOT_TESTED is never represented as PASS.
 * - Requires an authorised human release owner recording GO / GO WITH CONDITIONS / HOLD / NO-GO.
 */

import fs from "node:fs";
import path from "node:path";

// PR-04: evidence resolution needs the filesystem. The helpers are local so the
// evaluator stays usable in a sandbox with no `fs` mocks.
const fileExists = (absolutePath: string): boolean => fs.existsSync(absolutePath);
const pathIsAbsolute = (candidate: string): boolean => path.isAbsolute(candidate);
const joinPath = (root: string, relative: string): string => path.resolve(root, relative);

export type BroadcastGateId =
  | "BG0_CHANNEL_AUTHORITY"
  | "BG1_CATALOGUE"
  | "BG2_RIGHTS"
  | "BG3_SCHEDULE"
  | "BG4_TRAFFIC"
  | "BG5_PLAYOUT"
  | "BG6_CARRIAGE"
  | "BG7_FINANCE"
  | "BG8_AZEEBO"
  | "BG9_CONTINUITY";

export type GateEvaluationStatus =
  | "PASS"
  | "BLOCKED"
  | "NOT_TESTED"
  | "NOT_APPLICABLE_WITH_REASON"
  | "FULFILLED_BY_VERIFIED_EXISTING_SYSTEM";

export type ReleaseDecision = "GO" | "GO_WITH_CONDITIONS" | "HOLD" | "NO_GO";

export interface BroadcastReleaseGate {
  id: BroadcastGateId;
  name: string;
  description: string;
  status: GateEvaluationStatus;
  evidenceRef?: string;
  reason?: string;
  evaluatedAt: Date;
  verifiedBy: string;
}

export interface ConditionsAcceptance {
  acceptedBy: string;
  role: string;
  employeeId: string;
  acceptedAt: Date;
  acceptedConditions: string[];
  rationale: string;
}

export interface HumanReleaseOwner {
  name: string;
  role: string;
  employeeId: string;
  signedAt: Date;
}

export interface BroadcastReleaseManifest {
  version: string;
  environment: "SANDBOX_S2" | "STAGING_S3" | "PRODUCTION_S5";
  gitCommitSha: string;
  humanReleaseOwner: HumanReleaseOwner;
  decision?: ReleaseDecision;
  decisionRationale?: string;
  conditionsAcceptance?: ConditionsAcceptance;
  /** PR-04: digest of the build this decision was signed against (see `artifact.ts`). */
  artifactDigest?: string;
  /** PR-04: HMAC of the canonical manifest payload, produced with the owner's signing key. */
  ownerSignature?: string;
  gates: Record<BroadcastGateId, BroadcastReleaseGate>;
}

export type EvidenceFindingCode =
  | "MISSING_EVIDENCE"
  | "UNRESOLVED_EVIDENCE_PATH"
  | "PROSE_ONLY_EVIDENCE"
  | "STALE_EVIDENCE";

/**
 * PR-04: a gate that claims PASS but cannot point at a file in this tree is a
 * claim, not evidence. Findings are returned rather than merely logged so the
 * caller decides the consequence and the operator sees the reason.
 */
export interface EvidenceFinding {
  gateId: BroadcastGateId;
  code: EvidenceFindingCode;
  detail: string;
}

export interface BroadcastReleaseEvaluationOptions {
  /** Working tree against which `evidenceRef` paths are resolved. */
  evidenceRoot?: string;
  /** Escape hatch for unit tests that exercise gate statuses, not evidence. */
  verifyEvidence?: boolean;
  /** Maximum permitted age of `evaluatedAt`. Default 30 days. */
  maxEvidenceAgeDays?: number;
  now?: Date;
  /** PRODUCTION_S5 requires the manifest to name the artefact it decides on. */
  requireArtifactBinding?: boolean;
  /** Digest computed from the build being released, if one was computed. */
  artifactDigest?: string;
}

export interface ParsedEvidenceRef {
  paths: string[];
  prose: string[];
}

// Backward compatibility interfaces
export interface ReleaseGateCheck {
  gateTier: 0 | 1 | 2 | 3;
  name: string;
  passed: boolean;
  checkedBy: string;
  timestamp: Date;
  details?: string;
}

export interface ReleaseManifest {
  version: string;
  gitCommitSha: string;
  gates: Record<0 | 1 | 2 | 3, ReleaseGateCheck>;
  isReadyForProduction: boolean;
  signOffSignatures: Array<{ role: string; officerName: string; signedAt: Date }>;
}

export class ReleaseGatePipeline {
  /**
   * Validates that the human release owner is an identified, accountable individual (F-9-13).
   */
  public static validateReleaseOwner(owner: HumanReleaseOwner): { valid: boolean; error?: string } {
    if (!owner || !owner.name || owner.name.trim().length === 0) {
      return { valid: false, error: "Human release owner name is required." };
    }
    const genericTitles = [
      "broadcast architecture authority",
      "architecture team",
      "engineering lead",
      "release authority",
      "lead system architect",
    ];
    if (genericTitles.includes(owner.name.trim().toLowerCase())) {
      return {
        valid: false,
        error: `Release owner '${owner.name}' is an organizational role label, not a named accountable person per §67.`,
      };
    }
    if (!owner.employeeId || owner.employeeId.trim().length === 0) {
      return { valid: false, error: "Human release owner employee identifier (employeeId) is required." };
    }
    return { valid: true };
  }

  /**
   * Splits an `evidenceRef` into resolvable paths and prose. The field is free
   * text by history — some gates cite several files joined by `&`, some cite a
   * parenthesised symbol, and one cited a contract name. All three must stay
   * legible, but only a path can be checked.
   */
  public static parseEvidenceRef(ref?: string): ParsedEvidenceRef {
    const paths: string[] = [];
    const prose: string[] = [];
    if (!ref || ref.trim().length === 0) return { paths, prose };

    const segments = ref
      .split(/[&;\n]/)
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0);

    for (const segment of segments) {
      const cleaned = segment
        .replace(/\s*\([^)]*\)\s*/g, " ")
        .replace(/\.\s+Reason:.*$/i, "")
        .trim();
      if (cleaned.length === 0) continue;
      // A path has no whitespace; anything else is narrative evidence and is
      // reported as prose so it is never mistaken for a resolved artefact.
      if (/\s/.test(cleaned)) {
        prose.push(segment);
      } else {
        paths.push(cleaned.replace(/^\.\//, ""));
      }
    }
    return { paths, prose };
  }

  private static collectEvidenceFindings(
    gateId: BroadcastGateId,
    gate: BroadcastReleaseGate,
    options: BroadcastReleaseEvaluationOptions
  ): EvidenceFinding[] {
    const findings: EvidenceFinding[] = [];
    const root = options.evidenceRoot ?? process.cwd();
    const now = options.now ?? new Date();
    const maxAgeDays = options.maxEvidenceAgeDays ?? 30;

    const evaluatedAt = gate.evaluatedAt instanceof Date ? gate.evaluatedAt : new Date(gate.evaluatedAt as unknown as string);
    const ageDays = Number.isNaN(evaluatedAt.getTime())
      ? Infinity
      : (now.getTime() - evaluatedAt.getTime()) / 86_400_000;
    if (ageDays > maxAgeDays) {
      findings.push({
        gateId,
        code: "STALE_EVIDENCE",
        detail: Number.isFinite(ageDays)
          ? `evaluatedAt is ${Math.floor(ageDays)} days old (policy maximum ${maxAgeDays} days).`
          : `evaluatedAt is missing or unparseable, so freshness cannot be established.`,
      });
    }

    const parsed = this.parseEvidenceRef(gate.evidenceRef);
    if (parsed.paths.length === 0 && parsed.prose.length === 0) {
      findings.push({
        gateId,
        code: "MISSING_EVIDENCE",
        detail: "Gate is recorded as verified but cites no evidenceRef at all.",
      });
      return findings;
    }

    for (const relative of parsed.paths) {
      const absolute = pathIsAbsolute(relative) ? relative : joinPath(root, relative);
      if (!fileExists(absolute)) {
        findings.push({
          gateId,
          code: "UNRESOLVED_EVIDENCE_PATH",
          detail: `Cited evidence '${relative}' does not exist in the release tree.`,
        });
      }
    }

    if (parsed.paths.length === 0 && parsed.prose.length > 0) {
      findings.push({
        gateId,
        code: "PROSE_ONLY_EVIDENCE",
        detail: `No file or test can be resolved from evidenceRef '${gate.evidenceRef}' — it is narrative, not evidence.`,
      });
    }

    return findings;
  }

  /**
   * Evaluates the governing R1.2A §67 Broadcast Release Gates (BG0–BG9).
   */
  public static evaluateBroadcastRelease(
    manifest: BroadcastReleaseManifest,
    options: BroadcastReleaseEvaluationOptions = {}
  ): {
    canDeploy: boolean;
    decision: ReleaseDecision;
    failingGates: string[];
    blockedGates: string[];
    untestedGates: string[];
    passedGates: string[];
    ownerValidationError?: string;
    evidenceFindings: EvidenceFinding[];
    artifactAttested: boolean;
  } {
    const failingGates: string[] = [];
    const blockedGates: string[] = [];
    const untestedGates: string[] = [];
    const passedGates: string[] = [];
    const evidenceFindings: EvidenceFinding[] = [];
    const verifyEvidence = options.verifyEvidence !== false;

    // PR-04: the artefact the decision names is part of the decision. An absent
    // digest is not a mismatch, but where the caller demands binding (PRODUCTION
    // S5) it is a failure rather than a silent pass.
    let artifactAttested = false;
    const manifestDigest = manifest.artifactDigest?.trim().toLowerCase();
    const computedDigest = options.artifactDigest?.trim().toLowerCase();
    if (manifestDigest && computedDigest) {
      if (manifestDigest !== computedDigest) {
        failingGates.push(
          `ARTIFACT_DIGEST: the manifest names build ${manifestDigest.slice(0, 12)}… but the artefact under evaluation is ${computedDigest.slice(0, 12)}….`
        );
      } else {
        artifactAttested = true;
      }
    } else if (options.requireArtifactBinding) {
      failingGates.push(
        manifestDigest
          ? "ARTIFACT_DIGEST: the manifest names a build digest but no digest was computed for the artefact under evaluation, so the binding could not be checked."
          : "ARTIFACT_DIGEST: this environment requires the manifest to bind the release decision to a built artefact, and it carries no artifactDigest."
      );
    }

    const ownerCheck = this.validateReleaseOwner(manifest.humanReleaseOwner);
    const ownerValidationError = ownerCheck.valid ? undefined : ownerCheck.error;
    if (!ownerCheck.valid) {
      failingGates.push(`HUMAN_RELEASE_OWNER: ${ownerCheck.error}`);
    }

    const gateEntries = Object.entries(manifest.gates) as [BroadcastGateId, BroadcastReleaseGate][];

    for (const [gateId, gate] of gateEntries) {
      if (gate.status === "BLOCKED") {
        blockedGates.push(`${gateId}: ${gate.name} is BLOCKED. ${gate.reason || ""}`);
        failingGates.push(`${gateId} (BLOCKED)`);
      } else if (gate.status === "NOT_TESTED") {
        untestedGates.push(`${gateId}: ${gate.name} is NOT_TESTED (never represented as PASS).`);
        failingGates.push(`${gateId} (NOT_TESTED)`);
      } else if (gate.status === "PASS" || gate.status === "FULFILLED_BY_VERIFIED_EXISTING_SYSTEM") {
        passedGates.push(gateId);
        if (verifyEvidence) {
          for (const finding of this.collectEvidenceFindings(gateId, gate, options)) {
            evidenceFindings.push(finding);
            failingGates.push(finding.detail);
          }
        }
      } else if (gate.status === "NOT_APPLICABLE_WITH_REASON") {
        if (!gate.reason || gate.reason.trim().length === 0) {
          failingGates.push(`${gateId}: Marked NOT_APPLICABLE without mandatory recorded reason.`);
        } else {
          passedGates.push(gateId);
          if (verifyEvidence) {
            for (const finding of this.collectEvidenceFindings(gateId, gate, options)) {
              evidenceFindings.push(finding);
              failingGates.push(finding.detail);
            }
          }
        }
      }
    }

    let canDeploy = false;
    let decision: ReleaseDecision = "HOLD";

    if (blockedGates.length > 0 || !ownerCheck.valid) {
      decision = "NO_GO";
      canDeploy = false;
    } else if (evidenceFindings.length > 0) {
      // A verified gate whose evidence does not resolve cannot clear a release,
      // and it must not be laundered into GO_WITH_CONDITIONS either.
      decision = "HOLD";
      canDeploy = false;
    } else if (untestedGates.length === gateEntries.length) {
      // Invariant: An all-NOT_TESTED manifest can NEVER deploy under any circumstances (T9-15)
      decision = "HOLD";
      canDeploy = false;
    } else if (untestedGates.length > 0) {
      if (manifest.environment === "PRODUCTION_S5") {
        decision = "HOLD";
        canDeploy = false;
      } else {
        // In non-prod S2/S3, allow GO_WITH_CONDITIONS ONLY if a signed conditionsAcceptance block exists
        const acceptance = manifest.conditionsAcceptance;
        const hasValidAcceptance =
          acceptance &&
          acceptance.acceptedBy &&
          acceptance.acceptedBy.trim().length > 0 &&
          acceptance.employeeId &&
          acceptance.employeeId.trim().length > 0 &&
          acceptance.acceptedConditions &&
          acceptance.acceptedConditions.length > 0 &&
          passedGates.length > 0;

        if (hasValidAcceptance) {
          decision = "GO_WITH_CONDITIONS";
          canDeploy = true;
        } else {
          decision = "HOLD";
          canDeploy = false;
        }
      }
    } else if (failingGates.length === 0) {
      decision = "GO";
      canDeploy = true;
    }

    return {
      canDeploy,
      decision,
      failingGates,
      blockedGates,
      untestedGates,
      passedGates,
      ownerValidationError,
      evidenceFindings,
      artifactAttested,
    };
  }

  /**
   * Backward-compatible evaluator for legacy four-tier manifest.
   */
  public static evaluateRelease(manifest: ReleaseManifest): {
    canDeploy: boolean;
    failingGates: string[];
  } {
    const failingGates: string[] = [];

    for (const tier of [0, 1, 2, 3] as const) {
      const gate = manifest.gates[tier];
      if (!gate || !gate.passed) {
        failingGates.push(`Gate ${tier}: ${gate?.name || "Unknown"} failed.`);
      }
    }

    const requiredRoles = ["BroadcastDirector", "TrafficManager", "FinanceController"];
    for (const role of requiredRoles) {
      const hasSignature = manifest.signOffSignatures?.some((s) => s.role === role);
      if (!hasSignature) {
        failingGates.push(`Gate 3: Missing mandatory sign-off from '${role}'.`);
      }
    }

    const canDeploy = failingGates.length === 0;
    manifest.isReadyForProduction = canDeploy;

    return { canDeploy, failingGates };
  }
}
