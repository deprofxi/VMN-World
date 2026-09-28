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

export interface BroadcastReleaseManifest {
  version: string;
  environment: "SANDBOX_S2" | "STAGING_S3" | "PRODUCTION_S5";
  gitCommitSha: string;
  humanReleaseOwner: {
    name: string;
    role: string;
    signedAt: Date;
  };
  decision: ReleaseDecision;
  decisionRationale: string;
  gates: Record<BroadcastGateId, BroadcastReleaseGate>;
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
   * Evaluates the governing R1.2A §67 Broadcast Release Gates (BG0–BG9).
   */
  public static evaluateBroadcastRelease(manifest: BroadcastReleaseManifest): {
    canDeploy: boolean;
    decision: ReleaseDecision;
    failingGates: string[];
    blockedGates: string[];
    untestedGates: string[];
    passedGates: string[];
  } {
    const failingGates: string[] = [];
    const blockedGates: string[] = [];
    const untestedGates: string[] = [];
    const passedGates: string[] = [];

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
      } else if (gate.status === "NOT_APPLICABLE_WITH_REASON") {
        if (!gate.reason || gate.reason.trim().length === 0) {
          failingGates.push(`${gateId}: Marked NOT_APPLICABLE without mandatory recorded reason.`);
        } else {
          passedGates.push(gateId);
        }
      }
    }

    let canDeploy = false;
    let decision: ReleaseDecision = manifest.decision;

    if (blockedGates.length > 0) {
      decision = "NO_GO";
      canDeploy = false;
    } else if (untestedGates.length > 0) {
      if (manifest.environment === "PRODUCTION_S5") {
        decision = "HOLD";
        canDeploy = false;
      } else {
        // In S2 sandbox, allow GO_WITH_CONDITIONS if explicitly signed off
        decision = manifest.decision === "GO_WITH_CONDITIONS" ? "GO_WITH_CONDITIONS" : "HOLD";
        canDeploy = decision === "GO_WITH_CONDITIONS";
      }
    } else if (failingGates.length === 0) {
      decision = manifest.decision === "GO" ? "GO" : "GO_WITH_CONDITIONS";
      canDeploy = true;
    }

    return {
      canDeploy,
      decision,
      failingGates,
      blockedGates,
      untestedGates,
      passedGates,
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
