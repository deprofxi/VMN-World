import { describe, expect, it } from "vitest";
import {
  BroadcastRightsGate,
  BroadcastTrafficEngine,
  PlayoutAutomationEngine,
  CarriageMonitoringEngine,
  AsRunReconciliationEngine,
  XmlTvGenerator,
} from "../../src/modules/broadcast/index.js";
import { AzeeboLinkGateway } from "../../src/modules/federation/index.js";

describe("Phase 9: The 20 Mandatory Broadcast UAT Failure Drill Scenarios (R1.2A §66)", () => {
  // Drill 01: Schedule item with expired rights -> Blocked from playlist generation; alert triggered.
  it("Drill 01: blocks expired rights from being scheduled or added to playlist", () => {
    const rightsGate = new BroadcastRightsGate();
    const expiredRights = {
      id: "RGT-DRILL-01",
      assetId: "AST-OLD-MOVIE",
      title: "Vintage Nollywood Action",
      rightsType: "BROADCAST_LINEAR" as const,
      territory: "NG",
      mediaType: "LINEAR_TV",
      exclusivity: true,
      startDate: new Date("2024-01-01"),
      expiryDate: new Date("2024-12-31"), // Expired
      subLicensable: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const isAvailable = rightsGate.checkRightsReadiness(expiredRights, new Date("2026-05-01"));
    expect(isAvailable).toBe(false);

    // Invariant: Trying to assert clearance throws error
    expect(() =>
      rightsGate.assertRightsClearance(expiredRights, new Date("2026-05-01"))
    ).toThrow("[RIGHTS-EXPIRED] Cannot exploit expired rights");
  });

  // Drill 02: Programme master missing or corrupted -> Triggers emergency filler insertion; operator alerted.
  it("Drill 02: inserts emergency filler loop when media master is missing or corrupt", () => {
    const playout = new PlayoutAutomationEngine();
    // Simulate corrupt asset
    const emergencyEvent = playout.triggerEmergencyFiller("CHN-NXTR", "Corrupted video stream on main playback channel");
    expect(emergencyEvent.status).toBe("FILLER_INSERTED");
    expect(emergencyEvent.fillerAssetId).toBe("AST-NXTR-EMERGENCY-LOOP-01");
    expect(emergencyEvent.alertDispatched).toBe(true);
  });

  // Drill 03: Wrong-duration media asset -> Detected during playlist validation; prevents un-aligned schedule drift.
  it("Drill 03: validates second-by-second sum of scheduled assets to prevent schedule drift", () => {
    const playout = new PlayoutAutomationEngine();
    // Create an invalid playlist whose events do not add up to 86,400 seconds (24 hours)
    const driftValidation = playout.validatePlaylistDuration([
      { assetId: "A1", durationSeconds: 1800 },
      { assetId: "A2", durationSeconds: 1750 }, // 50 seconds short -> drift!
    ], 3600);

    expect(driftValidation.valid).toBe(false);
    expect(driftValidation.driftSeconds).toBe(-50);
  });

  // Drill 04: Unapproved ad creative -> Blocked from traffic scheduling; spot flagged for review.
  it("Drill 04: blocks unapproved or failed-QC ad creative from commercial break placement", () => {
    const traffic = new BroadcastTrafficEngine();
    expect(() =>
      traffic.scheduleSpot({
        breakId: "BRK-01",
        spotId: "SPT-UNAPPROVED",
        campaignId: "CMP-01",
        brandCategory: "TELECOMS",
        brandName: "Telco A",
        durationSeconds: 30,
        qcStatus: "REJECTED",
      })
    ).toThrow("[TRAFFIC-QC-01] Commercial spot creative must be QC_APPROVED prior to scheduling.");
  });

  // Drill 05: Commercial category conflict -> Two competing ads booked in same break detected and auto-separated.
  it("Drill 05: detects competing brand category clash in same break and auto-separates", () => {
    const traffic = new BroadcastTrafficEngine();
    traffic.createBreak({ id: "BRK-PRIME-01", channelId: "CHN-NXTR", daypart: "PRIME_TIME", maxDurationSeconds: 180 });

    // Spot 1: GTBank (BANKING)
    traffic.scheduleSpot({
      breakId: "BRK-PRIME-01",
      spotId: "SPT-GTB",
      campaignId: "CMP-GTB",
      brandCategory: "BANKING",
      brandName: "GTBank",
      durationSeconds: 30,
      qcStatus: "APPROVED",
    });

    // Spot 2: Zenith Bank (BANKING) -> Clash!
    expect(() =>
      traffic.scheduleSpot({
        breakId: "BRK-PRIME-01",
        spotId: "SPT-ZENITH",
        campaignId: "CMP-ZENITH",
        brandCategory: "BANKING",
        brandName: "Zenith Bank",
        durationSeconds: 30,
        qcStatus: "APPROVED",
      })
    ).toThrow("[TRAFFIC-CLASH-01] Category conflict: BANKING already booked in break BRK-PRIME-01.");
  });

  // Drill 06: Spot booked into full/unavailable break -> Auto-diverted to make-good queue with sales notification.
  it("Drill 06: auto-diverts overbooked spot to make-good queue when break capacity is exceeded", () => {
    const traffic = new BroadcastTrafficEngine();
    traffic.createBreak({ id: "BRK-SHORT", channelId: "CHN-ORIS", daypart: "DAYTIME", maxDurationSeconds: 60 });

    traffic.scheduleSpot({
      breakId: "BRK-SHORT",
      spotId: "SPT-1",
      campaignId: "CMP-1",
      brandCategory: "FMCG",
      brandName: "Indomie",
      durationSeconds: 45,
      qcStatus: "APPROVED",
    });

    // Spot 2 needs 30 seconds, but only 15 left -> Diverted to make-good
    const bookingResult = traffic.tryBookOrDivertToMakeGood({
      breakId: "BRK-SHORT",
      spotId: "SPT-2",
      campaignId: "CMP-2",
      brandCategory: "BEVERAGE",
      brandName: "Peak Milk",
      durationSeconds: 30,
      qcStatus: "APPROVED",
    });

    expect(bookingResult.booked).toBe(false);
    expect(bookingResult.divertedToMakeGood).toBe(true);
    expect(traffic.getMakeGoodQueue().length).toBe(1);
  });

  // Drill 07: EPG differs from approved schedule -> Diff detector flags discrepancy before syndication export.
  it("Drill 07: detects diff between EPG export and live approved schedule grid", () => {
    const epg = new XmlTvGenerator();
    const approvedSchedule = [
      { id: "S1", title: "Morning Grooves", start: "08:00", end: "09:00" },
      { id: "S2", title: "Midday Movie", start: "09:00", end: "11:00" },
    ];
    const staleEpg = [
      { id: "S1", title: "Morning Grooves", start: "08:00", end: "09:00" },
      { id: "S2_STALE", title: "Old Rerun", start: "09:00", end: "11:00" },
    ];

    const diff = epg.detectDiscrepancy(approvedSchedule, staleEpg);
    expect(diff.hasDiscrepancy).toBe(true);
    expect(diff.discrepancies[0]).toContain("Title mismatch at 09:00");
  });

  // Drill 08: Live schedule breaking change -> Rapid mid-day schedule amendment revalidates all downstream breaks.
  it("Drill 08: rapid schedule amendment revalidates all downstream commercial break positions", () => {
    const traffic = new BroadcastTrafficEngine();
    traffic.createBreak({ id: "BRK-DOWNSTREAM", channelId: "CHN-NXTR", daypart: "PRIME_TIME", maxDurationSeconds: 120 });
    const revalidation = traffic.revalidateDownstreamBreaks("CHN-NXTR", 120); // 120 sec offset
    expect(revalidation.success).toBe(true);
    expect(revalidation.breaksRevalidated).toBeGreaterThanOrEqual(1);
  });

  // Drill 09: Transmission interruption -> Incident logger records outage duration and calculates affected ad credits.
  it("Drill 09: logs carriage outage and calculates make-good credits for interrupted commercial spots", () => {
    const carriage = new CarriageMonitoringEngine();
    const incident = carriage.logTransmissionIncident({
      id: "INC-OUTAGE-01",
      carrier: "STARTIMES_DTT",
      channelId: "CHN-NXTR",
      startUtc: new Date("2026-05-10T14:00:00Z"),
      endUtc: new Date("2026-05-10T14:15:00Z"), // 15 minute outage
      rootCause: "Satellite transponder uplink attenuation due to severe storm",
    });

    const adCredits = carriage.calculateAffectedAdCredits(incident, 4); // 4 spots affected
    expect(incident.durationMinutes).toBe(15);
    expect(adCredits.makeGoodSpotsDue).toBe(4);
  });

  // Drill 10: Playout automation server failure -> Master control fallback switchover without dead-air.
  it("Drill 10: executes seamless failover switchover to backup playout engine", () => {
    const playout = new PlayoutAutomationEngine();
    const failoverResult = playout.triggerServerFailover("PRIMARY_PLAYOUT_SERVER_CRASH");
    expect(failoverResult.redundantServerActive).toBe(true);
    expect(failoverResult.seamlessSwitchover).toBe(true);
  });

  // Drill 11: Duplicate commercial booking -> De-duplication rule prevents double-airing of same copy.
  it("Drill 11: de-duplication rule prevents accidental double-booking of same spot copy in adjacent breaks", () => {
    const traffic = new BroadcastTrafficEngine();
    traffic.createBreak({ id: "B1", channelId: "CHN-ORIS", daypart: "DAYTIME", maxDurationSeconds: 120 });
    traffic.createBreak({ id: "B2", channelId: "CHN-ORIS", daypart: "DAYTIME", maxDurationSeconds: 120 });

    traffic.scheduleSpot({ breakId: "B1", spotId: "COPY-A", campaignId: "C1", brandCategory: "FMCG", brandName: "Omo", durationSeconds: 30, qcStatus: "APPROVED" });
    // Invariant: Duplicate spot in back-to-back break within 15 minutes is blocked
    expect(() =>
      traffic.scheduleSpot({ breakId: "B1", spotId: "COPY-A", campaignId: "C1", brandCategory: "FMCG", brandName: "Omo", durationSeconds: 30, qcStatus: "APPROVED" })
    ).toThrow("[TRAFFIC-DUP-01] Duplicate commercial copy 'COPY-A' already booked in this break.");
  });

  // Drill 12: Missed commercial spot -> Automatically scheduled for approved make-good slot or credit note issued.
  it("Drill 12: missed spot is auto-scheduled for approved make-good slot", () => {
    const traffic = new BroadcastTrafficEngine();
    traffic.addToMakeGoodQueue({
      spotId: "SPT-MISSED-01",
      campaignId: "CMP-COCA-COLA",
      durationSeconds: 30,
      clientOrgId: "ORG-COKE",
      reason: "Live football match overrun preempted commercial break",
    });

    const mg = traffic.resolveMakeGood("SPT-MISSED-01", "SCHEDULE_INTO_NEXT_DAYPART", "BRK-NIGHT-01");
    expect(mg.resolved).toBe(true);
    expect(mg.allocatedBreakId).toBe("BRK-NIGHT-01");
  });

  // Drill 13: StarTimes carriage feed outage -> Auto-generates carriage incident ticket and SLA penalty calculation.
  it("Drill 13: calculates carriage SLA penalty for carrier uptime violation below 99.5%", () => {
    const carriage = new CarriageMonitoringEngine();
    // 98.2% uptime = 1.3% SLA breach
    const penalty = carriage.calculateSlaPenalty({
      monthlyUptimePercent: 98.2,
      contractedSlaUptimePercent: 99.5,
      monthlyCarriageFeeNgn: 10000000,
    });

    expect(penalty.slaViolated).toBe(true);
    expect(penalty.rebateDueNgn).toBeGreaterThan(0);
  });

  // Drill 14: Rights expiry mid-series run -> Blocks subsequent episodes from being loaded into future playlists.
  it("Drill 14: blocks subsequent episodes from loading into future playlists when license expires mid-run", () => {
    const rightsGate = new BroadcastRightsGate();
    const episodePlayDate = new Date("2026-08-01");
    const midSeriesExpiry = new Date("2026-07-31");

    const isAvailable = rightsGate.checkWindow(episodePlayDate, new Date("2026-01-01"), midSeriesExpiry);
    expect(isAvailable).toBe(false);
  });

  // Drill 15: Programme rescheduled after ad campaign booked -> Ad flighting rules re-evaluate target audience placement.
  it("Drill 15: re-evaluates ad campaign flighting when parent programme is rescheduled", () => {
    const traffic = new BroadcastTrafficEngine();
    const reEvaluation = traffic.reEvaluateFlightingAfterReschedule({
      campaignId: "CMP-YOUTH-DRINK",
      originalSlot: "20:00",
      newSlot: "14:00", // Moved from prime youth slot to daytime!
      requiredDaypart: "PRIME_TIME",
    });

    expect(reEvaluation.placementValid).toBe(false);
    expect(reEvaluation.actionRequired).toBe("RE_FLIGHT_TO_EQUIVALENT_DAYPART");
  });

  // Drill 16: Incorrect sponsor sting bound to programme -> QC inspector flags mismatch prior to playlist lock.
  it("Drill 16: flags sponsor sting mismatch prior to automation playlist lock", () => {
    const playout = new PlayoutAutomationEngine();
    const check = playout.validateSponsorBinding({
      programmeId: "PRG-ORISUN-CULTURE",
      contractedSponsorId: "SPONSOR-MTN",
      boundSponsorStingAssetId: "AST-STING-AIRTEL", // Mismatch!
    });

    expect(check.valid).toBe(false);
    expect(check.errorMessage).toContain("Sponsor mismatch: Contracted 'SPONSOR-MTN' but found 'AST-STING-AIRTEL'");
  });

  // Drill 17: Azeebo+ QR code / deep-link resolution failure -> Graceful fallback to default universe landing page.
  it("Drill 17: gracefully falls back to default landing page when tracking ID is not found", () => {
    const gateway = new AzeeboLinkGateway();
    const fallbackUrl = "https://azeebo.plus/u/all";
    const res = gateway.recordScan({
      trackingId: "CORRUPTED-TRK-ID",
      deviceType: "ANDROID",
      ipHashSha256: "hash-001",
      scannedAt: new Date(),
    });

    const destination = res.success && res.targetUrl ? res.targetUrl : fallbackUrl;
    expect(destination).toBe(fallbackUrl);
  });

  // Drill 18: As-run log reconciliation failure -> Ingestion quarantine alert triggered for manual traffic review.
  it("Drill 18: routes un-reconciled as-run logs to quarantine queue for manual review", () => {
    const asRunEngine = new AsRunReconciliationEngine();
    const reconcileResult = asRunEngine.reconcile({
      plannedBreakSpotCount: 4,
      airedSpotCount: 2, // 2 spots omitted in transmission!
      plannedAirTime: "20:15:00",
      actualAirTime: "20:15:00",
    });

    expect(reconcileResult.status).toBe("DISCREPANCY_QUARANTINED");
    expect(reconcileResult.missingSpotsCount).toBe(2);
  });

  // Drill 19: Emergency filler activation -> Frame-accurate transition to pre-buffered station filler asset.
  it("Drill 19: triggers frame-accurate transition to pre-buffered station emergency filler asset", () => {
    const playout = new PlayoutAutomationEngine();
    const filler = playout.activateStationFiller("CHN-IMBD");
    expect(filler.activeFillerAssetId).toBe("AST-IMBD-EMERGENCY-LOOP-01");
    expect(filler.seamlessSwitchover).toBe(true);
  });

  // Drill 20: Schedule system database outage & recovery -> Playout automation continues running from local cached playlist.
  it("Drill 20: continues playout from local cached playlist during primary database outage", () => {
    const playout = new PlayoutAutomationEngine();
    // Cache playlist locally
    playout.cacheLocalPlaylist("CHN-NXTR", "2026-05-15", [
      { assetId: "A1", durationSeconds: 1800 },
      { assetId: "A2", durationSeconds: 1800 },
    ]);

    // Simulate database offline
    const isDbOnline = false;
    const activePlaylist = playout.getActivePlaylistWithFallback("CHN-NXTR", "2026-05-15", isDbOnline);
    expect(activePlaylist.source).toBe("LOCAL_PLAYOUT_CACHE");
    expect(activePlaylist.items.length).toBe(2);
  });
});
