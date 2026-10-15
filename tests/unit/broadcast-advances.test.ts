import { describe, it, expect } from "vitest";
import { BroadcastBillingEngine } from "../../src/modules/broadcast/billing/index.js";
import { SponsorshipEngine } from "../../src/modules/broadcast/sponsorship/index.js";
import { PlayoutExportEngine } from "../../src/modules/broadcast/export/index.js";
import { RollingEpgScheduler } from "../../src/modules/broadcast/epg/scheduler.js";
import {
  performThreeWayMatch,
  parseAsRunLogText,
  TrafficSpotBooking,
  CarrierTelemetryRecord,
} from "../../src/modules/broadcast/asrun/index.js";

describe("Broadcast Advanced Operations (B-10, B-11, B-12, B-13, B-14)", () => {
  it("should calculate spot price and generate commercial billing schedules (B-11)", () => {
    const billing = new BroadcastBillingEngine();

    const primePrice = billing.calculateSpotPrice("NXTR", "PRIME_TIME", 30);
    const daytimePrice = billing.calculateSpotPrice("NXTR", "DAYTIME", 30);
    expect(primePrice).toBeGreaterThan(daytimePrice);

    const schedule = billing.createBillingSchedule({
      campaignCode: "CMP-COCACOLA-01",
      clientName: "Coca-Cola Nigeria",
      brand: "Coke Zero",
      channelCode: "NXTR",
      spots: [
        { daypart: "PRIME_TIME", durationSeconds: 30 },
        { daypart: "DAYTIME", durationSeconds: 30 },
      ],
      startDate: new Date("2026-10-01"),
      endDate: new Date("2026-10-31"),
    });

    expect(schedule.contractedSpots).toBe(2);
    expect(schedule.totalContractValueNgn).toBe(primePrice + daytimePrice);

    // Link aired spot
    const linkResult = billing.linkAiredSpotToContract("CMP-COCACOLA-01", primePrice);
    expect(linkResult.schedule.airedSpotsMatched).toBe(1);
    expect(linkResult.invoiceReady).toBe(false);

    // Link second spot
    const finalResult = billing.linkAiredSpotToContract("CMP-COCACOLA-01", daytimePrice);
    expect(finalResult.schedule.airedSpotsMatched).toBe(2);
    expect(finalResult.invoiceReady).toBe(true);
    expect(finalResult.schedule.billingStatus).toBe("READY_FOR_INVOICE");
  });

  it("should track sponsorship entitlements and fulfillment audits (B-12)", () => {
    const sponsorship = new SponsorshipEngine();

    const entitlement = sponsorship.createEntitlement({
      id: "SPON-AIRTEL-01",
      sponsorName: "Airtel Nigeria",
      brand: "Airtel 4G",
      channelCode: "NXTR",
      programmeCode: "PROG-BEATS-01",
      campaignCode: "CMP-AIRTEL-01",
      contractedOnScreenSeconds: 300,
      contractedBillboardsCount: 10,
      contractedLowerThirdsCount: 20,
      startDate: new Date("2026-10-01"),
      endDate: new Date("2026-10-07"),
    });

    expect(entitlement.status).toBe("ACTIVE");

    // Log impression
    const result = sponsorship.logImpression({
      entitlementId: "SPON-AIRTEL-01",
      asRunLogId: "AR-001",
      impressionType: "BILLBOARD",
      durationSeconds: 15,
      loggedAt: new Date(),
    });

    expect(result.entitlement.deliveredBillboardsCount).toBe(1);
    expect(result.fulfillmentPercent).toBeGreaterThan(0);

    const report = sponsorship.getAuditReport("SPON-AIRTEL-01");
    expect(report.isDeliveredFully).toBe(false);
    expect(report.deficitSeconds).toBe(285);
  });

  it("should serialize playlists into SMPTE-2067, BXF, Harris CSV, and Grass Valley formats (B-13)", () => {
    const sampleItems = [
      {
        id: "ITEM-001",
        itemType: "PROGRAMME" as const,
        title: "Urban Sounds Premiere",
        assetUrl: "http://localhost:9000/vmnl-assets/urban_01.mp4",
        mediaAssetId: "ASSET-URBAN-001",
        durationSeconds: 1800,
        expectedStartTime: new Date("2026-10-01T12:00:00Z"),
        isFiller: false,
      },
    ];

    const smpte = PlayoutExportEngine.toSmpte2067Xml("NXTR", "2026-10-01", sampleItems);
    expect(smpte).toContain("<CompositionPlaylist");
    expect(smpte).toContain("Urban Sounds Premiere");

    const bxf = PlayoutExportEngine.toBxfXml("NXTR", "2026-10-01", sampleItems);
    expect(bxf).toContain("<BxfMessage");
    expect(bxf).toContain("ASSET-URBAN-001");

    const harris = PlayoutExportEngine.toHarrisCsv("NXTR", sampleItems);
    expect(harris).toContain("EventID,Channel,Title");
    expect(harris).toContain("Urban Sounds Premiere");

    const gv = PlayoutExportEngine.toGrassValleyXml("NXTR", sampleItems);
    expect(gv).toContain("<GrassValleyPlaylist");
    expect(gv).toContain("clipName=\"ASSET-URBAN-001\"");
  });

  it("should generate automated rolling 7-day EPG feeds (B-14)", () => {
    const epg = RollingEpgScheduler.generate7DayRollingFeed("NXTR", new Date("2026-10-01T00:00:00Z"));
    expect(epg.channelCode).toBe("NXTR");
    expect(epg.totalSlots).toBe(28); // 4 slots * 7 days
    expect(epg.xmltvContent).toContain("<tv");
    expect(epg.xmltvContent).toContain("<programme");
  });

  it("should parse raw as-run logs and execute true 3-way match reconciliation with Base64 Certificate (B-10)", () => {
    const rawHarrisLog = `
EventID,Channel,Title,Type,DurationSec,SOM,MediaID,ScheduledTime
SPT-001,NXTR,"Nestle Milo Morning Energy",COMMERCIAL_SPOT,30,06:15:00:00,MILO-30S,2026-10-01T06:15:00.000Z
`;
    const parsedItems = parseAsRunLogText(rawHarrisLog);
    expect(parsedItems.length).toBe(1);
    expect(parsedItems[0].spotId).toBe("SPT-001");

    const bookings: TrafficSpotBooking[] = [
      {
        bookingId: "SPT-001",
        campaignId: "CMP-MILO-01",
        clientName: "Nestle Nigeria",
        channelCode: "NXTR",
        plannedAirTime: new Date("2026-10-01T06:15:00.000Z"),
        durationSeconds: 30,
        rateNgn: 450000,
      },
    ];

    const carrierEvidence: CarrierTelemetryRecord[] = [
      {
        carrierId: "STARTIMES_DTT",
        rfFrequencyMhz: 522.0,
        // Fixture PID literal: config no longer defaults carriage numbers (AUD-09).
        servicePid: 1042,
        timestamp: new Date("2026-10-01T06:15:10.000Z"),
        signalStrengthDbm: -55,
        carrierLock: true,
        transportStreamId: 101,
      },
    ];

    const threeWay = performThreeWayMatch("NXTR", bookings, parsedItems, carrierEvidence);
    expect(threeWay.reconciliationStatus).toBe("ALL_SUPPLIED_INPUTS_MATCHED");
    expect(threeWay.fullyReconciledSpots).toBe(1);
    expect(threeWay.certificates.length).toBe(1);

    const cert = threeWay.certificates[0];
    // The in-process match uses supplied telemetry; it is not independent carrier validation.
    expect(cert.isVerified).toBe(false);
    expect(cert.carrierLockVerified).toBe(true);
    expect(cert.documentBase64).toBeDefined();

    // Verify generated document
    const decoded = Buffer.from(cert.documentBase64!, "base64").toString("utf-8");
    expect(decoded).toContain("PROOF-OF-AIR RECONCILIATION RECORD - NOT TRANSMISSION VERIFICATION");
    expect(decoded).toContain(cert.certificateId);
    expect(decoded).toContain("Nestle Nigeria");
    expect(decoded).toContain("NOT INDEPENDENTLY VALIDATED");
  });
});
