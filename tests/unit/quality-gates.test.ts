import { describe, expect, it } from "vitest";
import { ReleaseGatePipeline, ReleaseManifest } from "../../src/modules/quality/gates.js";
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
  });
});
