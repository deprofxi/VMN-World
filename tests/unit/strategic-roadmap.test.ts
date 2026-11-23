import { describe, expect, it } from "vitest";
import {
  PlayoutAdapterRegistry,
  GrassValleyAmpAdapter,
  PebbleBeachAdapter,
  PlayboxNeoAdapter,
} from "../../src/modules/broadcast/playout/index.js";
import {
  BankDisbursementGateway,
  TalentPayoutEngine,
} from "../../src/modules/finance/payouts/index.js";
import { Scte35ScheduleCoordinator } from "../../src/modules/broadcast/playout/scte35.js";
import { AzeeboFederationService } from "../../src/core/federation/index.js";

describe("Strategic Roadmap & Future Recommendations Implementation", () => {
  describe("Phase A: Hardware Playout Automation Adapters", () => {
    it("manages playout adapter registry across channels", () => {
      const registry = PlayoutAdapterRegistry.getInstance();
      const nxtrAdapter = registry.getAdapter("CHN-NXTR");
      expect(nxtrAdapter).toBeDefined();

      const heartbeats = registry.getAllHeartbeats();
      expect(heartbeats["CHN-NXTR"]).toBeDefined();
      expect(heartbeats["CHN-ORIS"]).toBeDefined();
      expect(heartbeats["CHN-IMBD"]).toBeDefined();
    });

    it("connects, loads schedule, and reports telemetry across protocols", async () => {
      const ampAdapter = new GrassValleyAmpAdapter({
        channelId: "CHN-NXTR",
        endpoint: "tcp://192.168.10.50:5000",
      });

      expect(ampAdapter.config.protocol).toBe("GRASS_VALLEY_AMP");
      const connected = await ampAdapter.connect();
      expect(connected).toBe(true);

      const scheduleRes = await ampAdapter.loadSchedule([
        {
          id: "item-1",
          itemType: "PROGRAMME",
          title: "Afro-Beats Chart Show",
          assetUrl: "http://storage/show1.mp4",
          durationSeconds: 1800,
          expectedStartTime: new Date(),
          isFiller: false,
        },
      ]);
      expect(scheduleRes.loadedCount).toBe(1);
      expect(scheduleRes.status).toBe("SCHEDULE_LOADED");

      const heartbeat = ampAdapter.getHeartbeat();
      expect(heartbeat.connected).toBe(true);
      expect(heartbeat.latencyMs).toBeLessThan(100);
      expect(heartbeat.currentClip).toBe("Afro-Beats Chart Show");
      expect(heartbeat.signalQualityDbm).toBeGreaterThan(-60);

      // Emergency filler trigger
      const fillerRes = await ampAdapter.triggerEmergencyFiller("Primary under-run");
      expect(fillerRes.success).toBe(true);
      expect(fillerRes.fillerAssetId).toContain("AST-NXTR-EMERGENCY-LOOP");

      // Redundant server failover
      const failoverRes = await ampAdapter.switchoverToRedundant();
      expect(failoverRes.success).toBe(true);
      expect(failoverRes.activeServer).toContain("REDUNDANT-GRASS_VALLEY_AMP");

      await ampAdapter.disconnect();
      expect(ampAdapter.getHeartbeat().connected).toBe(false);
    });

    it("supports Pebble Beach and PlayBox Neo adapters", async () => {
      const pb = new PebbleBeachAdapter({ channelId: "CHN-ORIS", endpoint: "tcp://192.168.10.51:5000" });
      const neo = new PlayboxNeoAdapter({ channelId: "CHN-IMBD", endpoint: "tcp://192.168.10.52:5000" });

      expect(pb.config.protocol).toBe("PEBBLE_BEACH");
      expect(neo.config.protocol).toBe("PLAYBOX_NEO");

      await pb.connect();
      await neo.connect();
      expect(pb.getHeartbeat().connected).toBe(true);
      expect(neo.getHeartbeat().connected).toBe(true);
    });
  });

  describe("Phase B: Automated Commercial Banking Settlement Rails", () => {
    it("generates 30-digit NIP Session IDs according to NIBSS specifications", () => {
      const sessionId = BankDisbursementGateway.generateNipSessionId("999001", 42);
      expect(sessionId.length).toBe(30);
      expect(sessionId.startsWith("999001")).toBe(true);
    });

    it("executes batch disbursement with strict Maker-Checker enforcement", async () => {
      const payoutEngine = new TalentPayoutEngine();
      const gateway = new BankDisbursementGateway();

      // Maker creates draft batch
      const batch = payoutEngine.createPayoutBatch({
        id: "BATCH-ROADMAP-01",
        batchReference: "VTM-PAY-2026-R01",
        makerUserId: "usr-finance-maker",
        items: [
          {
            beneficiaryId: "BEN-001",
            beneficiaryName: "Tunde Kelani",
            beneficiaryTaxType: "INDIVIDUAL",
            bankName: "Zenith Bank",
            accountNumber: "1002345678",
            grossAmountNgn: 1_000_000,
            platformFeePercent: 15,
          },
        ],
      });

      // Disbursing without approval throws
      await expect(
        gateway.processBatchDisbursement(batch, {
          batchId: batch.id,
          batchReference: batch.batchReference,
          authorizedCheckerId: "usr-finance-checker",
          disbursementRail: "NIBSS_NIP",
        })
      ).rejects.toThrow("[DISB-01]");

      // Checker approves batch
      payoutEngine.approvePayoutBatch(batch.id, "usr-finance-checker");
      expect(batch.status).toBe("APPROVED_FOR_DISBURSEMENT");

      // Attempting disbursement by Maker violates Maker-Checker
      await expect(
        gateway.processBatchDisbursement(batch, {
          batchId: batch.id,
          batchReference: batch.batchReference,
          authorizedCheckerId: "usr-finance-maker",
          disbursementRail: "NIBSS_NIP",
        })
      ).rejects.toThrow("[DISB-02]");

      // Successful disbursement by authorized Checker
      const result = await gateway.processBatchDisbursement(batch, {
        batchId: batch.id,
        batchReference: batch.batchReference,
        authorizedCheckerId: "usr-finance-checker",
        disbursementRail: "NIBSS_NIP",
      });

      expect(result.successfulCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(result.rail).toBe("NIBSS_NIP");
      expect(result.transactions[0].nipSessionId.length).toBe(30);
      expect(result.transactions[0].status).toBe("SETTLED");
      expect(result.transactions[0].responseCode).toBe("00");
      expect(batch.status).toBe("PROCESSED");
    });
  });

  describe("Phase C: Automated SCTE-35 Break Scheduler & Cue Coordinator", () => {
    it("schedules, executes, and completes commercial breaks with SCTE-35 cueing", async () => {
      const coordinator = new Scte35ScheduleCoordinator();

      const scheduled = coordinator.scheduleBreak({
        breakId: "BRK-NXTR-TEST-001",
        channelCode: "NXTR",
        scheduledTime: new Date(Date.now() + 60000),
        durationSeconds: 120,
        spotCount: 4,
        uniqueProgramId: 101,
      });

      expect(scheduled.status).toBe("SCHEDULED");
      expect(coordinator.getScheduledBreaks("NXTR").length).toBe(1);

      // Trigger Cue Out (Start of commercial break)
      const cueOutRes = await coordinator.triggerBreakCueOut(scheduled.breakId);
      expect(cueOutRes.success).toBe(true);
      expect(cueOutRes.cue.insertCommand?.outOfNetworkIndicator).toBe(true);
      expect(scheduled.status).toBe("CUE_OUT_ACTIVE");

      // Trigger Cue In (Return to network)
      const cueInRes = await coordinator.triggerBreakCueIn(scheduled.breakId);
      expect(cueInRes.success).toBe(true);
      expect(cueInRes.cue.insertCommand?.outOfNetworkIndicator).toBe(false);
      expect(scheduled.status).toBe("COMPLETED");
    });

    it("supports break cancellation before cue-out", () => {
      const coordinator = new Scte35ScheduleCoordinator();
      const b = coordinator.scheduleBreak({
        channelCode: "ORIS",
        scheduledTime: new Date(),
        durationSeconds: 60,
      });

      const cancelled = coordinator.cancelBreak(b.breakId);
      expect(cancelled).toBe(true);
      expect(b.status).toBe("CANCELLED");
    });
  });

  describe("Phase D: Azeebo+ Production Identity & Token Federation", () => {
    it("issues and cryptographically verifies Azeebo+ federation SSO tokens", () => {
      const service = new AzeeboFederationService("test_secret_key_vmnl_2026");

      const handoff = service.issueToken({
        userId: "usr-sub-9942",
        email: "subscriber@vmnl.ng",
        displayName: "Chuka Obi",
        roles: ["PREMIUM_SUBSCRIBER"],
        entitlements: ["NXTR_LIVE", "ORIS_LIVE", "IMBD_LIVE", "CINEMAXIS_PASS"],
        targetPath: "/cinemaxis/movie-lagos-heist",
        expiresInSeconds: 300,
      });

      expect(handoff.token).toBeDefined();
      expect(handoff.redirectUrl).toContain("fed_token=");
      expect(handoff.claims.sub).toBe("usr-sub-9942");
      expect(handoff.claims.entitlements).toContain("CINEMAXIS_PASS");

      // Verification succeeds with matching key
      const verification = service.verifyToken(handoff.token);
      expect(verification.valid).toBe(true);
      expect(verification.claims?.sub).toBe("usr-sub-9942");
      expect(verification.claims?.displayName).toBe("Chuka Obi");
    });

    it("rejects tampered or wrong-key federation tokens", () => {
      const service1 = new AzeeboFederationService("key_one");
      const service2 = new AzeeboFederationService("key_two");

      const handoff = service1.issueToken({ userId: "usr-tamper-01" });
      const verifyTamper = service2.verifyToken(handoff.token);

      expect(verifyTamper.valid).toBe(false);
      expect(verifyTamper.error).toBe("Signature mismatch");
    });
  });
});
