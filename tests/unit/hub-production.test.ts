import { describe, expect, it } from "vitest";
import {
  VirtualContentFundEngine,
  OneStudiosEngine,
  TendDistributionEngine,
  FusionEventsEngine,
} from "../../src/modules/hub/index.js";

describe("Phase 4: Creative Economy Hub — Creator, Production & Distribution", () => {
  describe("TASK-P4-01: Virtual Content Fund (VCF)", () => {
    it("handles pitch submissions, investment rubrics, slate tracking, and 4-tier waterfalls", () => {
      const vcf = new VirtualContentFundEngine();

      // 1. Submit pitch
      const pitch = vcf.submitPitch({
        id: "PTC-001",
        creatorId: "CRE-001",
        title: "Lagos Street Stories",
        logline: "An anthology exploring youth hustle in Computer Village.",
        synopsis: "Full synopsis of 6 episodic narratives...",
        format: "EPISODIC_SERIES",
        targetAudience: "Gen Z & Millennials (18-35)",
        budgetEstimateNgn: 45000000,
        treatmentDeckUrl: "https://vmnl.ng/dam/decks/lagos_stories.pdf",
      });

      expect(pitch.status).toBe("SUBMITTED");

      // 2. Evaluate pitch with high scores
      const evaluation = vcf.evaluatePitch("PTC-001", "EXEC-PRODUCER-01", {
        commercialViability: 85,
        culturalRelevance: 90,
        distributionPotential: 80,
        productionFeasibility: 75,
        notes: "High streaming appeal across African diaspora.",
      });

      expect(evaluation.compositeScore).toBeGreaterThanOrEqual(80);
      expect(evaluation.recommendedAction).toBe("APPROVE_GREENLIGHT");
      expect(vcf.getPitch("PTC-001")?.status).toBe("GREENLIT");

      // 3. Greenlight to Slate
      const project = vcf.greenlightToSlate("PTC-001", {
        projectId: "SLT-2026-001",
        approvedBudgetNgn: 45000000,
        seniorInvestorPrincipalNgn: 30000000,
        preferredReturnRate: 0.1, // 10%
      });

      expect(project.stage).toBe("DEVELOPMENT");
      expect(vcf.getPitch("PTC-001")?.status).toBe("CONTRACTED");

      // 4. Disburse capital
      vcf.disburseCapital("SLT-2026-001", 15000000);
      expect(vcf.getSlateProject("SLT-2026-001")?.disbursedCapitalNgn).toBe(15000000);

      // Invariant: Cannot exceed budget
      expect(() => vcf.disburseCapital("SLT-2026-001", 35000000)).toThrow(
        "[VCF-CAP-01] Disbursed capital (50000000) exceeds approved budget (45000000)."
      );

      // 5. Advance to distribution
      vcf.advanceStage("SLT-2026-001", "DISTRIBUTION");

      // 6. Recoupment Waterfall Tranche 1: Gross 20,000,000 NGN
      // Distribution fee (15%): 3,000,000 NGN
      // Net receivable: 17,000,000 NGN
      // Target to recoup: 30,000,000 * 1.10 = 33,000,000 NGN
      // Since 17m < 33m, 100% goes to investor recoupment
      const tranche1 = vcf.calculateWaterfall("SLT-2026-001", 20000000, 0);
      expect(tranche1.distributionFeeNgn).toBe(3000000);
      expect(tranche1.netReceivableNgn).toBe(17000000);
      expect(tranche1.seniorInvestorRecoupmentNgn).toBe(17000000);
      expect(tranche1.netProfitsNgn).toBe(0);
      expect(tranche1.isFullyRecouped).toBe(false);

      // Recoupment Waterfall Tranche 2: Gross 30,000,000 NGN
      // Distribution fee (15%): 4,500,000 NGN
      // Net receivable: 25,500,000 NGN
      // Remaining to recoup: 33,000,000 - 17,000,000 = 16,000,000 NGN
      // Senior gets 16,000,000 NGN -> Remaining 9,500,000 NGN split 50/50
      const tranche2 = vcf.calculateWaterfall("SLT-2026-001", 30000000, 0);
      expect(tranche2.seniorInvestorRecoupmentNgn).toBe(16000000);
      expect(tranche2.netProfitsNgn).toBe(9500000);
      expect(tranche2.investorProfitShareNgn).toBe(4750000);
      expect(tranche2.producerProfitShareNgn).toBe(4750000);
      expect(tranche2.isFullyRecouped).toBe(true);

      expect(vcf.getSlateProject("SLT-2026-001")?.stage).toBe("RECOUPED");
    });
  });

  describe("TASK-P4-02: ONE Studios Production Facilities", () => {
    it("manages stage/gear inventory, prevents double bookings, and logs damage deductions", () => {
      const studios = new OneStudiosEngine();

      // Check default assets
      const stageA = studios.getAsset("AST-STG-A");
      expect(stageA).toBeDefined();
      expect(stageA?.dailyRateNgn).toBe(450000);

      const bookingStart = new Date("2026-06-01T08:00:00Z");
      const bookingEnd = new Date("2026-06-05T20:00:00Z");

      // 1. Create booking
      const booking = studios.createBooking({
        id: "BKG-PROD-01",
        productionName: "The Last Jagun",
        producerId: "PRD-99",
        assetIds: ["AST-STG-A", "AST-CAM-ARRI-01"],
        startDate: bookingStart,
        endDate: bookingEnd,
        securityDepositNgn: 500000,
      });

      expect(booking.status).toBe("RESERVED");

      // 2. Invariant: Double booking prevention
      expect(() =>
        studios.createBooking({
          id: "BKG-CONFLICT",
          productionName: "Music Video Shoot",
          producerId: "PRD-88",
          assetIds: ["AST-STG-A"], // Overlaps with Stage A
          startDate: new Date("2026-06-03T08:00:00Z"),
          endDate: new Date("2026-06-04T20:00:00Z"),
          securityDepositNgn: 200000,
        })
      ).toThrow("[ONE-BKG-05] Asset 'Soundstage A (5,000 sq ft Soundproof)' is already reserved for the requested dates.");

      // 3. Check-out
      studios.checkOut("BKG-PROD-01");

      // 4. Check-in with minor damage to lens coating
      const checkInResult = studios.checkIn("BKG-PROD-01", {
        damageReport: "Minor scratch on 35mm prime front element",
        damageCostNgn: 85000,
      });

      expect(checkInResult.booking.status).toBe("RETURNED");
      expect(checkInResult.booking.damageDeductionNgn).toBe(85000);
      expect(checkInResult.depositRefundNgn).toBe(415000); // 500,000 - 85,000

      // 5. Call sheet publishing
      const callSheet = studios.publishCallSheet({
        id: "CS-DAY-01",
        productionName: "The Last Jagun",
        shootDate: new Date("2026-06-02"),
        generalCallTime: "06:30",
        location: "Soundstage A, ONE Studios",
        keyCast: [{ character: "General", actorName: "Femi Adebayo", callTime: "07:00" }],
        keyCrew: [{ department: "Camera", name: "Tunde Kelani", callTime: "06:30" }],
        scenesToShoot: [{ sceneNumber: "14", dayNight: "NIGHT", description: "Throne room showdown" }],
        nearestHospital: "Lagos State University Teaching Hospital (LASUTH), Ikeja",
        publishedAt: new Date(),
      });

      expect(studios.getCallSheet("CS-DAY-01")?.productionName).toBe(callSheet.productionName);
    });
  });

  describe("TASK-P4-03: The Entertainment Network Distribution (TEND)", () => {
    it("evaluates avails across territories/media and prevents exclusive license clashes", () => {
      const tend = new TendDistributionEngine();

      // 1. Register title
      tend.registerTitle({
        id: "TIT-001",
        title: "Echoes of the Delta",
        originalLanguage: "English / Pidgin",
        subtitlesAvailable: ["English", "French"],
        runningTimeMinutes: 110,
        genre: "Drama / Thriller",
        masterDeliveryStatus: "QC_APPROVED",
        minimumLicenseFeeUsd: 15000,
      });

      // 2. Grant exclusive license in West Africa for SVOD
      const licStart = new Date("2026-07-01");
      const licEnd = new Date("2027-06-30");

      tend.createLicense({
        id: "LIC-001",
        titleId: "TIT-001",
        licenseeOrgId: "ORG-STREAMER-A",
        licenseeName: "AfroStream VIP",
        territory: "WEST_AFRICA",
        medium: "SVOD",
        isExclusive: true,
        startDate: licStart,
        endDate: licEnd,
        licenseFeeUsd: 25000,
        withholdingTaxPercent: 10,
      });

      const lic = tend.getLicense("LIC-001");
      expect(lic?.netReceivableUsd).toBe(22500); // 25,000 - 10% WHT (2,500)

      // 3. Invariant: Check avails blocks overlapping exclusive license in Nigeria for SVOD
      const availsCheck = tend.checkAvails({
        titleId: "TIT-001",
        territory: "NG", // Nigeria is in West Africa!
        medium: "SVOD",
        startDate: new Date("2026-09-01"),
        endDate: new Date("2026-12-31"),
      });

      expect(availsCheck.available).toBe(false);
      expect(availsCheck.conflictReason).toContain("Conflict: Already licensed exclusively");

      // Invariant: Creating exclusive license throws error
      expect(() =>
        tend.createLicense({
          id: "LIC-CLASH",
          titleId: "TIT-001",
          licenseeOrgId: "ORG-COMPETITOR",
          licenseeName: "Rival OTT",
          territory: "NG",
          medium: "SVOD",
          isExclusive: true,
          startDate: new Date("2026-09-01"),
          endDate: new Date("2026-12-31"),
          licenseFeeUsd: 10000,
        })
      ).toThrow("[TEND-LIC-02] Cannot create exclusive license");

      // 4. Non-conflicting license in Airline Inflight is allowed
      const airlineAvails = tend.checkAvails({
        titleId: "TIT-001",
        territory: "GLOBAL",
        medium: "AIRLINE_INFLIGHT",
        startDate: new Date("2026-08-01"),
        endDate: new Date("2026-11-01"),
      });
      expect(airlineAvails.available).toBe(true);

      // 5. Ingest royalty statement
      const statement = tend.ingestRoyaltyStatement({
        id: "STMT-001",
        licenseId: "LIC-001",
        reportingPeriodStart: new Date("2026-07-01"),
        reportingPeriodEnd: new Date("2026-09-30"),
        reportedViewsOrAdImpressions: 450000,
        grossRoyaltyUsd: 8000,
        commissionPercent: 20, // 1,600 USD
      });

      expect(statement.distributorCommissionUsd).toBe(1600);
      expect(statement.withholdingTaxUsd).toBe(800); // 10%
      expect(statement.netPayableToRightsHolderUsd).toBe(5600);
    });
  });

  describe("TASK-P4-04: Fusion Events Management", () => {
    it("issues cryptographically signed tickets and blocks duplicate gate check-in fraud", () => {
      const events = new FusionEventsEngine("test-secure-event-key");

      // 1. Create Event
      events.createEvent({
        id: "EVT-FEST-2026",
        name: "Fusion Afrobeat & Arts Festival 2026",
        category: "FESTIVAL",
        venueName: "Eko Atlantic City Ground",
        venueCity: "Lagos",
        eventDate: new Date("2026-12-20"),
        doorsOpenTime: "16:00",
        capacity: 5000,
        tiers: {
          REGULAR: { priceNgn: 15000, allocation: 4000, sold: 0 },
          VIP: { priceNgn: 50000, allocation: 800, sold: 0 },
          VVIP: { priceNgn: 150000, allocation: 150, sold: 0 },
          BACKSTAGE_PASS: { priceNgn: 300000, allocation: 50, sold: 0 },
        },
        isPublished: true,
      });

      // 2. Issue VIP Ticket
      const ticket = events.issueTicket({
        eventId: "EVT-FEST-2026",
        attendeeName: "Kelechi Nnamdi",
        attendeeEmail: "kelechi@vmnl.ng",
        tier: "VIP",
      });

      expect(ticket.status).toBe("ISSUED");
      expect(ticket.pricePaidNgn).toBe(50000);
      expect(ticket.qrSignatureHmac).toBeDefined();

      // 3. Scan ticket at the gate (First entry -> Success)
      const firstScan = events.scanGateTicket({
        ticketNumber: ticket.ticketNumber,
        eventId: "EVT-FEST-2026",
        gateStaffId: "STAFF-GATE-01",
      });

      expect(firstScan.valid).toBe(true);
      expect(firstScan.message).toContain("Welcome, Kelechi Nnamdi!");

      // 4. Invariant: Anti-Fraud Gate Verification (Second entry with same ticket -> FRAUD ALERT)
      const secondScan = events.scanGateTicket({
        ticketNumber: ticket.ticketNumber,
        eventId: "EVT-FEST-2026",
        gateStaffId: "STAFF-GATE-02",
      });

      expect(secondScan.valid).toBe(false);
      expect(secondScan.reason).toBe("ALREADY_CHECKED_IN");
      expect(secondScan.message).toContain("FRAUD ALERT: Ticket");

      // 5. Gate statistics
      const stats = events.getGateStatistics("EVT-FEST-2026");
      expect(stats.totalTicketsSold).toBe(1);
      expect(stats.totalCheckedIn).toBe(1);
      expect(stats.checkedInPercentage).toBe(100);
      expect(stats.byTier.VIP.sold).toBe(1);
      expect(stats.byTier.VIP.checkedIn).toBe(1);
    });
  });
});
