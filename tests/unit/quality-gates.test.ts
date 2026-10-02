import { describe, expect, it } from "vitest";
import { ReleaseGatePipeline, ReleaseManifest, BroadcastReleaseManifest } from "../../src/modules/quality/gates.js";
import { generateGoldenDataset } from "../../src/db/seeds/golden/index.js";

describe("Phase 9: Quality Gates & Golden Datasets", () => {
  describe("TASK-P9-03: Golden Test Datasets Compilation", () => {
    it("generates deterministic golden datasets matching enterprise specifications", () => {
      const data = generateGoldenDataset();

      expect(data.channels.length).toBe(3);
      expect(data.programmes.length).toBe(50);
      expect(data.episodes.length).toBe(200);
      expect(data.schedules.length).toBe(42); // 14 days * 3 channels
      expect(data.commercialCampaigns.length).toBe(10);
      expect(data.asRunLogs.length).toBe(10);
      expect(data.talentProfiles.length).toBe(20);
      expect(data.afcaCourses.length).toBe(5);
      expect(data.vcfSlates.length).toBe(10);
      expect(data.tendDeals.length).toBe(5);
    });
  });

  describe("TASK-P9-04: Four-Tier Release Gates Execution", () => {
    it("evaluates release readiness and blocks deployment if any gate or sign-off is missing", () => {
      // 1. Incomplete manifest (Gate 1 failed)
      const failingManifest: ReleaseManifest = {
        version: "1.0.0-rc1",
        gitCommitSha: "abc1234",
        gates: {
          0: { gateTier: 0, name: "Authority Mapping", passed: true, checkedBy: "ARCH-01", timestamp: new Date() },
          1: { gateTier: 1, name: "Security & NDPR Audit", passed: false, checkedBy: "SEC-01", timestamp: new Date() },
          2: { gateTier: 2, name: "Engineering Tests", passed: true, checkedBy: "QA-01", timestamp: new Date() },
          3: { gateTier: 3, name: "Operator UAT Sign-off", passed: true, checkedBy: "OPS-01", timestamp: new Date() },
        },
        isReadyForProduction: false,
        signOffSignatures: [
          { role: "BroadcastDirector", officerName: "Femi Aderibigbe", signedAt: new Date() },
          { role: "TrafficManager", officerName: "Babatunde Adeleke", signedAt: new Date() },
          { role: "FinanceController", officerName: "Chioma Okoli", signedAt: new Date() },
        ],
      };

      const failingResult = ReleaseGatePipeline.evaluateRelease(failingManifest);
      expect(failingResult.canDeploy).toBe(false);
      expect(failingResult.failingGates.some((g) => g.includes("Gate 1"))).toBe(true);

      // 2. Complete manifest with all gates passed and all 3 signatures
      failingManifest.gates[1].passed = true;
      const passingResult = ReleaseGatePipeline.evaluateRelease(failingManifest);
      expect(passingResult.canDeploy).toBe(true);
      expect(passingResult.failingGates.length).toBe(0);
      expect(failingManifest.isReadyForProduction).toBe(true);
    });

    it("evaluates governing R1.2A §67 Broadcast Release Gates BG0–BG9 with strict NOT_TESTED invariant", () => {
      // 1. Invariant: NOT_TESTED is never represented as PASS
      const manifestWithUntested: BroadcastReleaseManifest = {
        version: "1.0.0-rc1",
        environment: "PRODUCTION_S5" as const,
        gitCommitSha: "abc1234",
        humanReleaseOwner: {
          name: "Dr. Babatunde Adeyemi",
          role: "Release Authority",
          employeeId: "VMNL-CTO-001",
          signedAt: new Date(),
        },
        decision: "GO" as const,
        decisionRationale: "Initial production release candidate",
        gates: {
          BG0_CHANNEL_AUTHORITY: { id: "BG0_CHANNEL_AUTHORITY" as const, name: "Channel Authority", description: "Channel identity and ownership", status: "PASS" as const, evaluatedAt: new Date(), verifiedBy: "EAB" },
          BG1_CATALOGUE: { id: "BG1_CATALOGUE" as const, name: "Catalogue", description: "Programme and master records", status: "PASS" as const, evaluatedAt: new Date(), verifiedBy: "EAB" },
          BG2_RIGHTS: { id: "BG2_RIGHTS" as const, name: "Rights", description: "Broadcast rights linked", status: "PASS" as const, evaluatedAt: new Date(), verifiedBy: "EAB" },
          BG3_SCHEDULE: { id: "BG3_SCHEDULE" as const, name: "Schedule", description: "Schedule workflow passes", status: "PASS" as const, evaluatedAt: new Date(), verifiedBy: "EAB" },
          BG4_TRAFFIC: { id: "BG4_TRAFFIC" as const, name: "Traffic", description: "Ad inventory workflow passes", status: "PASS" as const, evaluatedAt: new Date(), verifiedBy: "EAB" },
          BG5_PLAYOUT: { id: "BG5_PLAYOUT" as const, name: "Playout", description: "Playout integration passes", status: "PASS" as const, evaluatedAt: new Date(), verifiedBy: "EAB" },
          BG6_CARRIAGE: { id: "BG6_CARRIAGE" as const, name: "Carriage", description: "StarTimes endpoints mapped", status: "NOT_TESTED" as const, evaluatedAt: new Date(), verifiedBy: "EAB" },
          BG7_FINANCE: { id: "BG7_FINANCE" as const, name: "Finance", description: "Proof-to-invoice reconciliation", status: "PASS" as const, evaluatedAt: new Date(), verifiedBy: "EAB" },
          BG8_AZEEBO: { id: "BG8_AZEEBO" as const, name: "Azeebo+", description: "Linear-to-digital link works", status: "PASS" as const, evaluatedAt: new Date(), verifiedBy: "EAB" },
          BG9_CONTINUITY: { id: "BG9_CONTINUITY" as const, name: "Continuity", description: "Failure drills pass", status: "PASS" as const, evaluatedAt: new Date(), verifiedBy: "EAB" },
        },
      };

      const untestedResult = ReleaseGatePipeline.evaluateBroadcastRelease(manifestWithUntested);
      expect(untestedResult.canDeploy).toBe(false);
      expect(untestedResult.decision).toBe("HOLD");
      expect(untestedResult.untestedGates.length).toBe(1);
      expect(untestedResult.untestedGates[0]).toContain("BG6_CARRIAGE");

      // 2. Invariant: BLOCKED gate forces NO_GO
      manifestWithUntested.gates.BG6_CARRIAGE.status = "BLOCKED";
      manifestWithUntested.gates.BG6_CARRIAGE.reason = "Uplink carrier lock not confirmed by StarTimes NOC";
      const blockedResult = ReleaseGatePipeline.evaluateBroadcastRelease(manifestWithUntested);
      expect(blockedResult.canDeploy).toBe(false);
      expect(blockedResult.decision).toBe("NO_GO");
      expect(blockedResult.blockedGates.length).toBe(1);

      // 3. Complete verified manifest with FULFILLED_BY_VERIFIED_EXISTING_SYSTEM
      manifestWithUntested.gates.BG6_CARRIAGE.status = "FULFILLED_BY_VERIFIED_EXISTING_SYSTEM";
      const readyResult = ReleaseGatePipeline.evaluateBroadcastRelease(manifestWithUntested);
      expect(readyResult.canDeploy).toBe(true);
      expect(readyResult.decision).toBe("GO");
      expect(readyResult.passedGates.length).toBe(10);
    });

    it("strictly blocks deployment when all gates are NOT_TESTED even if decision claims GO_WITH_CONDITIONS (T9-15, F-9-13)", () => {
      const allUntestedGates: any = {};
      const gateIds = [
        "BG0_CHANNEL_AUTHORITY", "BG1_CATALOGUE", "BG2_RIGHTS", "BG3_SCHEDULE",
        "BG4_TRAFFIC", "BG5_PLAYOUT", "BG6_CARRIAGE", "BG7_FINANCE", "BG8_AZEEBO", "BG9_CONTINUITY"
      ] as const;

      for (const id of gateIds) {
        allUntestedGates[id] = {
          id,
          name: id,
          description: "Untested gate",
          status: "NOT_TESTED",
          evaluatedAt: new Date(),
          verifiedBy: "Tester",
        };
      }

      const allUntestedManifest: BroadcastReleaseManifest = {
        version: "1.0.0-rc1",
        environment: "SANDBOX_S2",
        gitCommitSha: "abc1234",
        humanReleaseOwner: {
          name: "Femi Aderibigbe",
          role: "Executive Chairman",
          employeeId: "VMNL-EXEC-001",
          signedAt: new Date(),
        },
        decision: "GO_WITH_CONDITIONS", // Attempting self-certification without tested evidence!
        gates: allUntestedGates,
      };

      const result = ReleaseGatePipeline.evaluateBroadcastRelease(allUntestedManifest);
      expect(result.canDeploy).toBe(false);
      expect(result.decision).toBe("HOLD");
      expect(result.untestedGates.length).toBe(10);
    });

    it("requires a named accountable person with employeeId for humanReleaseOwner (T9-15, F-9-13)", () => {
      const invalidOwner1 = {
        name: "Broadcast Architecture Authority", // Generic title rejected
        role: "Release Authority",
        employeeId: "VMNL-001",
        signedAt: new Date(),
      };
      expect(ReleaseGatePipeline.validateReleaseOwner(invalidOwner1).valid).toBe(false);

      const invalidOwner2 = {
        name: "Femi Aderibigbe",
        role: "Release Authority",
        employeeId: "", // Missing employeeId rejected
        signedAt: new Date(),
      };
      expect(ReleaseGatePipeline.validateReleaseOwner(invalidOwner2).valid).toBe(false);

      const validOwner = {
        name: "Femi Aderibigbe",
        role: "Executive Chairman",
        employeeId: "VMNL-EXEC-001",
        signedAt: new Date(),
      };
      expect(ReleaseGatePipeline.validateReleaseOwner(validOwner).valid).toBe(true);
    });
  });
});
