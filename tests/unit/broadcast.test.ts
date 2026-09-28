import { describe, it, expect } from "vitest";
import {
  CANONICAL_CHANNELS,
  getChannelByCode,
  getAllActiveChannels,
  validateBroadcastMasterQc,
  validateScheduleRights,
  validateDailySchedule,
  getDaypartForTime,
  generateXmltvFeed,
  validateCommercialBreak,
  insertEmergencyFiller,
  recordTransmissionOutage,
  reconcileAsRunLogs,
  ScheduleSlot,
  CommercialBreak,
  PlaylistItem,
  AsRunLogItem,
} from "../../src/modules/broadcast/index.js";
import { RightsRecordEntity } from "../../src/core/domain/types.js";
import { getConfig } from "../../src/core/config/index.js";

describe("Phase 2: Broadcast & Linear Television Operations", () => {
  describe("Channel Registry (TASK-P2-01)", () => {
    it("should retrieve all 3 active linear channels with StarTimes metadata (provisional)", () => {
      const config = getConfig();
      const channels = getAllActiveChannels();
      expect(channels.length).toBe(3);

      const nigezie = getChannelByCode("NXTR");
      expect(nigezie).toBeDefined();
      expect(nigezie?.name).toBe("Nigezie Xtreme");
      expect(nigezie?.starTimesCarriage.isProvisional).toBe(true);
      expect(nigezie?.starTimesCarriage.dttChannelNumber).toBe(config.NXTR_DTT_CHANNEL);

      const orisun = getChannelByCode("ORIS");
      expect(orisun).toBeDefined();
      expect(orisun?.name).toBe("Orisun — The Source");
      expect(orisun?.starTimesCarriage.isProvisional).toBe(true);
      expect(orisun?.starTimesCarriage.dttChannelNumber).toBe(config.ORIS_DTT_CHANNEL);

      const isiMbido = getChannelByCode("IMBD");
      expect(isiMbido).toBeDefined();
      expect(isiMbido?.name).toBe("Isi Mbido — The Beginning");
      expect(isiMbido?.starTimesCarriage.isProvisional).toBe(true);
      expect(isiMbido?.starTimesCarriage.dttChannelNumber).toBe(config.IMBD_DTT_CHANNEL);
    });
  });

  describe("Programme QC Master Gate (TASK-P2-02)", () => {
    it("should pass technical QC for compliant 1080i50 EBU R128 master", () => {
      const qc = validateBroadcastMasterQc({
        videoStandard: "1080i50",
        aspectRatio: "16:9",
        audioLoudnessLufs: -23.0,
        hasCountdownSlate: true,
        hasBlackGaps: false,
        isCompliant: true,
        notes: [],
      });
      expect(qc.isCompliant).toBe(true);
      expect(qc.errors.length).toBe(0);
    });

    it("should reject media master with loudness violations or black gaps", () => {
      const qc = validateBroadcastMasterQc({
        videoStandard: "1080i50",
        aspectRatio: "16:9",
        audioLoudnessLufs: -18.0, // too loud!
        hasCountdownSlate: true,
        hasBlackGaps: true,
        isCompliant: false,
        notes: [],
      });
      expect(qc.isCompliant).toBe(false);
      expect(qc.errors.some((e) => e.includes("Audio loudness out of EBU R128 spec"))).toBe(true);
      expect(qc.errors.some((e) => e.includes("black frame gaps"))).toBe(true);
    });
  });

  describe("Broadcast Rights Gate (TASK-P2-03)", () => {
    const validRights: RightsRecordEntity = {
      id: "rights-orisun-01",
      assetId: "ast-001",
      title: "Aworawo - Yoruba Cultural Series",
      rightsType: "BROADCAST_LINEAR",
      territory: "NG",
      mediaType: "LINEAR_TV",
      exclusivity: true,
      startDate: new Date("2026-01-01T00:00:00Z"),
      expiryDate: new Date("2026-12-31T23:59:59Z"),
      subLicensable: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should permit scheduling when rights are active and unexpired", () => {
      const check = validateScheduleRights({
        episodeId: "ep-001",
        channelCode: "ORIS",
        scheduledAirTime: new Date("2026-06-01T18:00:00Z"),
        scheduledDurationSeconds: 1800,
        rightsRecord: validRights,
      });
      expect(check.allowed).toBe(true);
    });

    it("should block scheduling if air time finishes past rights expiry (UAT Drill 1 & 14)", () => {
      const check = validateScheduleRights({
        episodeId: "ep-001",
        channelCode: "ORIS",
        scheduledAirTime: new Date("2026-12-31T23:50:00Z"),
        scheduledDurationSeconds: 1800, // Finishes 2027-01-01T00:20:00Z (Past expiry!)
        rightsRecord: validRights,
      });
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain("exceeds rights expiry date");
    });
  });

  describe("24/7 Daypart Schedule Grid (TASK-P2-04)", () => {
    it("should correctly classify dayparts", () => {
      expect(getDaypartForTime(new Date("2026-06-01T07:30:00"))).toBe("EARLY_MORNING");
      expect(getDaypartForTime(new Date("2026-06-01T12:00:00"))).toBe("DAYTIME");
      expect(getDaypartForTime(new Date("2026-06-01T20:00:00"))).toBe("PRIME_TIME");
      expect(getDaypartForTime(new Date("2026-06-01T01:00:00"))).toBe("LATE_NIGHT");
    });

    it("should detect overlaps and gaps in schedule timeline", () => {
      const dayStart = new Date("2026-06-01T00:00:00Z");
      const slots: ScheduleSlot[] = [
        {
          id: "s1",
          channelId: "chn-nx",
          startTime: new Date("2026-06-01T00:00:00Z"),
          durationSeconds: 3600,
          episodeId: "ep-1",
          title: "Night Beats",
          isLocked: true,
        },
        {
          id: "s2",
          channelId: "chn-nx",
          startTime: new Date("2026-06-01T01:30:00Z"), // Gap of 30 mins!
          durationSeconds: 3600,
          episodeId: "ep-2",
          title: "Urban Wave",
          isLocked: true,
        },
      ];

      const res = validateDailySchedule(slots, dayStart);
      expect(res.isValid).toBe(false);
      expect(res.gapCount).toBe(1);
      expect(res.errors.some((e) => e.includes("Gap of 1800s detected"))).toBe(true);
    });
  });

  describe("XMLTV EPG Generator (TASK-P2-05)", () => {
    it("should generate valid XMLTV format feed", () => {
      const channel = CANONICAL_CHANNELS.orisun;
      const slots: ScheduleSlot[] = [
        {
          id: "s1",
          channelId: channel.id,
          startTime: new Date("2026-06-01T18:00:00Z"),
          durationSeconds: 1800,
          episodeId: "ep-1",
          title: "Ariya Yoruba Music Spotlight",
          isLocked: true,
        },
      ];

      const xml = generateXmltvFeed(channel, slots);
      expect(xml).toContain(`<?xml version="1.0" encoding="UTF-8"?>`);
      expect(xml).toContain(`<channel id="ORIS">`);
      expect(xml).toContain(`<display-name>Orisun — The Source</display-name>`);
      expect(xml).toContain(`Ariya Yoruba Music Spotlight`);
    });
  });

  describe("Commercial Traffic & Category Clash (TASK-P2-06)", () => {
    it("should detect category clash when competing brands are booked in same break (UAT Drill 5)", () => {
      const commercialBreak: CommercialBreak = {
        id: "brk-001",
        channelId: "chn-nx",
        scheduledTime: new Date("2026-06-01T18:15:00Z"),
        maxDurationSeconds: 180,
        spots: [
          {
            id: "sp-1",
            campaignId: "cmp-gtbank",
            clientName: "GTBank",
            category: "BANKING_FINTECH",
            title: "Habari Pay Promo 30s",
            durationSeconds: 30,
            rateAmount: 150000,
          },
          {
            id: "sp-2",
            campaignId: "cmp-zenith",
            clientName: "Zenith Bank", // Competing bank in same break!
            category: "BANKING_FINTECH",
            title: "Zenith Mobile App 30s",
            durationSeconds: 30,
            rateAmount: 150000,
          },
        ],
      };

      const res = validateCommercialBreak(commercialBreak);
      expect(res.isValid).toBe(false);
      expect(res.clashDetected).toBe(true);
      expect(res.clashDetails[0]).toContain("Category clash");
      expect(res.clashDetails[0]).toContain("GTBank");
      expect(res.clashDetails[0]).toContain("Zenith Bank");
    });
  });

  describe("Emergency Filler Engine (TASK-P2-08)", () => {
    it("should insert emergency filler loop to prevent dead air on under-run (UAT Drill 2, 19)", () => {
      const items: PlaylistItem[] = [
        {
          id: "item-1",
          itemType: "PROGRAMME",
          title: "Prime Show",
          assetUrl: "https://cdn.vmn.ng/assets/prime.mp4",
          durationSeconds: 80000,
          expectedStartTime: new Date("2026-06-01T00:00:00Z"),
          isFiller: false,
        },
      ];

      const finalized = insertEmergencyFiller(items, 86400);
      expect(finalized.length).toBe(2);
      expect(finalized[1].itemType).toBe("EMERGENCY_FILLER");
      expect(finalized[1].durationSeconds).toBe(6400);
      expect(finalized[1].isFiller).toBe(true);
    });
  });

  describe("StarTimes Carriage & Outages (TASK-P2-09)", () => {
    it("should calculate outage duration and trigger SLA penalty when threshold exceeded (UAT Drill 9, 13)", () => {
      const start = new Date("2026-06-01T14:00:00Z");
      const end = new Date("2026-06-01T14:15:00Z"); // 15 minutes outage (> 300s)

      const incident = recordTransmissionOutage(
        "ORIS",
        "STARTIMES_DTT",
        start,
        end,
        "Transponder power supply failure",
        5
      );

      expect(incident.outageDurationSeconds).toBe(900);
      expect(incident.severity).toBe("MAJOR");
      expect(incident.slaPenaltyApplicable).toBe(true);
      expect(incident.affectedSpotsCount).toBe(5);
    });
  });

  describe("As-Run Reconciliation & Proof-of-Air (TASK-P2-10)", () => {
    it("should generate cryptographically signed Proof-of-Air certificates for aired spots", () => {
      const asRunItems: AsRunLogItem[] = [
        {
          spotId: "sp-101",
          clientName: "MTN Nigeria",
          campaignId: "cmp-mtn-5g",
          actualStartTime: new Date("2026-06-01T19:30:15Z"),
          actualDurationSeconds: 30,
          expectedDurationSeconds: 30,
          status: "AIRED_FULL",
        },
        {
          spotId: "sp-102",
          clientName: "Airtel Nigeria",
          campaignId: "cmp-airtel-data",
          actualStartTime: new Date("2026-06-01T19:45:00Z"),
          actualDurationSeconds: 0,
          expectedDurationSeconds: 30,
          status: "PREEMPTED", // Breaking news preemption!
        },
      ];

      const report = reconcileAsRunLogs("NXTR", asRunItems);
      expect(report.totalScheduledSpots).toBe(2);
      expect(report.totalAiredFull).toBe(1);
      expect(report.totalPreempted).toBe(1);
      expect(report.certificates.length).toBe(1);

      const cert = report.certificates[0];
      expect(cert.clientName).toBe("MTN Nigeria");
      expect(cert.cryptographicSignature).toBeDefined();
      expect(cert.cryptographicSignature.length).toBe(64); // SHA-256 hex
      expect(cert.isVerified).toBe(true);
      expect(report.makeGoodCreditsRequired).toBe(1);
    });
  });

  describe("33 Broadcast Screen Surfaces Inventory (TASK-P2-12)", () => {
    it("should have all 33 broadcast screen descriptors registered with routes and primary roles", async () => {
      const { BROADCAST_SCREEN_INVENTORY, getScreenDescriptor } = await import(
        "../../src/modules/broadcast/screens/index.js"
      );
      expect(BROADCAST_SCREEN_INVENTORY.length).toBe(33);

      // Verify Screen 1 (Executive Dashboard)
      const screen1 = getScreenDescriptor(1);
      expect(screen1).toBeDefined();
      expect(screen1?.name).toBe("Broadcast Executive Dashboard");
      expect(screen1?.primaryRole).toBe("ExecutiveLeader");

      // Verify Screen 12 (Schedule Grid)
      const screen12 = getScreenDescriptor(12);
      expect(screen12).toBeDefined();
      expect(screen12?.name).toBe("24/7 Visual Schedule Grid");
      expect(screen12?.route).toBe("/broadcast/schedule/grid");

      // Verify Screen 33 (Azeebo+ Conversion)
      const screen33 = getScreenDescriptor(33);
      expect(screen33).toBeDefined();
      expect(screen33?.name).toBe("Cross-Platform Azeebo+ Conversion");
    });
  });
});

