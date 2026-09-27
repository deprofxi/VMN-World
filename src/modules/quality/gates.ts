/**
 * Four-Tier Release Gates Evaluator & Manifest
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §67 / VMNL-AZP-VMN-EXEC-001
 *
 * Enforces strict Four-Tier Release Gates:
 * - Gate 0 (Authority & Contract): Requirements mapped to R1.2A; ADR-001 to ADR-012 approved.
 * - Gate 1 (Security & Privacy): Zero high/critical vulnerabilities; NDPR compliance verified.
 * - Gate 2 (Operational & Engineering): Automated test pyramid 100% pass; zero regressions.
 * - Gate 3 (Operator & UAT Sign-off): Tri-party sign-off (Broadcast Director + Traffic Manager + Finance Controller).
 *
 * Invariant: Deployment pipeline halts automatically if any release gate fails.
 */

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
  public static evaluateRelease(manifest: ReleaseManifest): {
    canDeploy: boolean;
    failingGates: string[];
  } {
    const failingGates: string[] = [];

    // Gate 0
    if (!manifest.gates[0].passed) {
      failingGates.push(`Gate 0 (Authority): ${manifest.gates[0].name} failed.`);
    }

    // Gate 1
    if (!manifest.gates[1].passed) {
      failingGates.push(`Gate 1 (Security & Privacy): ${manifest.gates[1].name} failed.`);
    }

    // Gate 2
    if (!manifest.gates[2].passed) {
      failingGates.push(`Gate 2 (Engineering & Tests): ${manifest.gates[2].name} failed.`);
    }

    // Gate 3
    if (!manifest.gates[3].passed) {
      failingGates.push(`Gate 3 (Operator Sign-off): ${manifest.gates[3].name} failed.`);
    }

    // Gate 3 requires at least 3 distinct officer sign-offs (Broadcast Director, Traffic Manager, Finance Controller)
    const requiredRoles = ["BroadcastDirector", "TrafficManager", "FinanceController"];
    for (const role of requiredRoles) {
      const hasSignature = manifest.signOffSignatures.some((s) => s.role === role);
      if (!hasSignature) {
        failingGates.push(`Gate 3: Missing mandatory sign-off from '${role}'.`);
      }
    }

    const canDeploy = failingGates.length === 0;
    manifest.isReadyForProduction = canDeploy;

    return { canDeploy, failingGates };
  }
}
