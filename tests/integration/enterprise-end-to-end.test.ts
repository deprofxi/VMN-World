/**
 * VMNL Enterprise End-to-End Integration Test Suite
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMNL-AZP-VMN-CCPP-001 / VMNL-AZP-VMN-EXEC-001
 *
 * Verifies full unified platform lifecycle:
 * 1. HTTP Server & Observability (`/healthz`, `/readyz`, `/metrics`)
 * 2. Broadcast Linear Operations (Channels, 33 Screens, XMLTV EPG, As-Run Proof-of-Air)
 * 3. Creative Economy Hub (Talent, AFCA Verifiable Certs, VTM Casting, Event Ticket Fraud)
 * 4. Intelligence & Agentic OS (Headspace Search, Cr8Tech WebVTT, AOS Policy Gate)
 * 5. Azeebo+ Federation (Deep Links, HMAC Webhook, Circuit Breaker)
 * 6. Commercial Finance & Release Gates (QTC Deals, Payout WHT, Quality Gates 0-3)
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import { createApiServer, ApiServerInstance } from "../../src/api/server.js";

function makeRequest(
  port: number,
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: any; rawText: string }> {
  return new Promise((resolve, reject) => {
    const payload = options.body ? JSON.stringify(options.body) : undefined;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
          ...options.headers,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let parsedBody;
          try {
            parsedBody = JSON.parse(data);
          } catch {
            parsedBody = data;
          }
          resolve({
            statusCode: res.statusCode || 500,
            headers: res.headers,
            body: parsedBody,
            rawText: data,
          });
        });
      }
    );
    req.on("error", reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

describe("VMNL Enterprise End-to-End Platform Integration", () => {
  let app: ApiServerInstance;
  const testPort = 49152 + Math.floor(Math.random() * 1000);

  beforeAll(async () => {
    app = createApiServer(testPort);
    await app.start();
  });

  afterAll(async () => {
    await app.stop();
  });

  describe("0. Public Web Pages & Operator Dashboard", () => {
    it("should serve the corporate overview HTML on GET /", async () => {
      const res = await makeRequest(testPort, "/");
      expect(res.statusCode).toBe(200);
      expect(res.rawText).toContain("Powering the African Creative Economy");
      expect(res.rawText).toContain("Virtual Media Network Limited");
    });

    it("should serve the channels showcase HTML on GET /channels", async () => {
      const res = await makeRequest(testPort, "/channels");
      expect(res.statusCode).toBe(200);
      expect(res.rawText).toContain("Nigezie Xtreme");
      expect(res.rawText).toContain("Orisun");
      expect(res.rawText).toContain("Isi Mbido");
    });

    it("should serve the Hub verticals HTML on GET /hub", async () => {
      const res = await makeRequest(testPort, "/hub");
      expect(res.statusCode).toBe(200);
      expect(res.rawText).toContain("Creative Economy Hub");
      expect(res.rawText).toContain("African Film & Creative Arts Academy");
    });

    it("should serve the Broadcast Executive Dashboard on GET /broadcast/dashboard", async () => {
      const res = await makeRequest(testPort, "/broadcast/dashboard");
      expect(res.statusCode).toBe(200);
      expect(res.rawText).toContain("Broadcast Executive Dashboard");
      expect(res.rawText).toContain("SCR-BCST-01");
      expect(res.rawText).toContain("StarTimes Carriage");
    });

    it("should serve the 33 Broadcast Screen Surfaces Catalog on GET /broadcast/screens", async () => {
      const res = await makeRequest(testPort, "/broadcast/screens");
      expect(res.statusCode).toBe(200);
      expect(res.rawText).toContain("Broadcast Operational Screen Inventory");
      expect(res.rawText).toContain("SCR-BCST-01");
      expect(res.rawText).toContain("SCR-BCST-33");
      expect(res.rawText).toContain("33 of 33 Screens Ready");
    });

    it("should filter the 33 Screens Catalog by role on GET /broadcast/screens?role=PlayoutOperator", async () => {
      const res = await makeRequest(testPort, "/broadcast/screens?role=PlayoutOperator");
      expect(res.statusCode).toBe(200);
      expect(res.rawText).toContain("SCR-BCST-22");
      expect(res.rawText).toContain("SCR-BCST-23");
    });

    it("should serve individual screen detail view on GET /broadcast/screens/:id", async () => {
      const res = await makeRequest(testPort, "/broadcast/screens/SCR-BCST-14");
      expect(res.statusCode).toBe(200);
      expect(res.rawText).toContain("EPG Inspector & Syndication");
      expect(res.rawText).toContain("TrafficManager");
      expect(res.rawText).toContain("push_startimes");
    });

    it("should return friendly error on GET /broadcast/screens/:id for invalid screen", async () => {
      const res = await makeRequest(testPort, "/broadcast/screens/SCR-INVALID-99");
      expect(res.statusCode).toBe(200);
      expect(res.rawText).toContain("Screen Surface Not Found");
    });

    it("should serve the interactive API Documentation on GET /docs", async () => {
      const res = await makeRequest(testPort, "/docs");
      expect(res.statusCode).toBe(200);
      expect(res.rawText).toContain("VMNL Enterprise API Reference");
      expect(res.rawText).toContain("OpenAPI 3.1");
      expect(res.rawText).toContain("/api/v1/broadcast/channels");
      expect(res.rawText).toContain("/api/v1/finance/payouts/batch");
    });

    it("should serve standard OpenAPI 3.1.0 JSON specification on GET /api/v1/openapi.json", async () => {
      const res = await makeRequest(testPort, "/api/v1/openapi.json");
      expect(res.statusCode).toBe(200);
      expect(res.body.openapi).toBe("3.1.0");
      expect(res.body.info.title).toContain("Virtual Media Network Limited");
      expect(res.body.paths["/api/v1/broadcast/asrun/reconcile"]).toBeDefined();
      expect(res.body.paths["/api/v1/quality/gates"]).toBeDefined();
    });

    // Surface A Tests
    it("should serve linear channel pages (NXTR, ORIS, IMBD) and public programme detail", async () => {
      const nxtrRes = await makeRequest(testPort, "/channels/nxtr");
      expect(nxtrRes.statusCode).toBe(200);
      expect(nxtrRes.rawText).toContain("Nigezie Xtreme");
      expect(nxtrRes.rawText).toContain("ON AIR LIVE");

      const orisRes = await makeRequest(testPort, "/channels/orisun");
      expect(orisRes.statusCode).toBe(200);
      expect(orisRes.rawText).toContain("Orisun");

      const imbdRes = await makeRequest(testPort, "/channels/isimbido");
      expect(imbdRes.statusCode).toBe(200);
      expect(imbdRes.rawText).toContain("Isi Mbido");

      const prgRes = await makeRequest(testPort, "/programmes/PRG-001");
      expect(prgRes.statusCode).toBe(200);
      expect(prgRes.rawText).toContain("Urban Beats Live Prime");
    });

    it("should serve all Surface A Creative Hub verticals and public pages", async () => {
      const talentRes = await makeRequest(testPort, "/hub/talent");
      expect(talentRes.statusCode).toBe(200);
      expect(talentRes.rawText).toContain("Talent Accelerator Network");

      const afcaRes = await makeRequest(testPort, "/hub/afca");
      expect(afcaRes.statusCode).toBe(200);
      expect(afcaRes.rawText).toContain("African Film & Creative Arts Academy");

      const partnersRes = await makeRequest(testPort, "/partners");
      expect(partnersRes.statusCode).toBe(200);
      expect(partnersRes.rawText).toContain("Commercial Partnerships");

      const insightsRes = await makeRequest(testPort, "/insights");
      expect(insightsRes.statusCode).toBe(200);
      expect(insightsRes.rawText).toContain("HeadspaceNG Strategic Intelligence");

      const careersRes = await makeRequest(testPort, "/careers");
      expect(careersRes.statusCode).toBe(200);
      expect(careersRes.rawText).toContain("Careers at VMNL");

      const azeeboRes = await makeRequest(testPort, "/azeebo");
      expect(azeeboRes.statusCode).toBe(200);
      expect(azeeboRes.rawText).toContain("Azeebo+ Streaming & Creator App");
    });

    // Surface B & C Tests
    it("should serve Surface B & C Enterprise Workspaces directory and desk pages", async () => {
      const dirRes = await makeRequest(testPort, "/workspace");
      expect(dirRes.statusCode).toBe(200);
      expect(dirRes.rawText).toContain("Enterprise Operating Hub & Specialist Desks");
      expect(dirRes.rawText).toContain("23 of 23 Desks Operational");

      const execRes = await makeRequest(testPort, "/workspace/executive");
      expect(execRes.statusCode).toBe(200);
      expect(execRes.rawText).toContain("Enterprise Executive Command Dashboard");
      expect(execRes.rawText).toContain("ExecutiveLeader");

      const finRes = await makeRequest(testPort, "/workspace/finance");
      expect(finRes.statusCode).toBe(200);
      expect(finRes.rawText).toContain("Consolidated Finance & Settlement Dashboard");

      const aosRes = await makeRequest(testPort, "/workspace/aos");
      expect(aosRes.statusCode).toBe(200);
      expect(aosRes.rawText).toContain("Agentic OS Registry & Evaluation Desk");

      const invalidDesk = await makeRequest(testPort, "/workspace/unknown-desk");
      expect(invalidDesk.statusCode).toBe(200);
      expect(invalidDesk.rawText).toContain("Workspace Desk Not Found");
    });

    // Surface E Tests
    it("should serve Surface E Azeebo+ Federation gateway, attribution, and universe resolvers", async () => {
      const gwRes = await makeRequest(testPort, "/azeebo/gateway");
      expect(gwRes.statusCode).toBe(200);
      expect(gwRes.rawText).toContain("Azeebo+ Federation & Universal Gateway");

      const attrRes = await makeRequest(testPort, "/azeebo/attribution");
      expect(attrRes.statusCode).toBe(200);
      expect(attrRes.rawText).toContain("Linear-to-Digital Attribution Tracker");

      const contentRes = await makeRequest(testPort, "/content/mov-123");
      expect(contentRes.statusCode).toBe(200);
      expect(contentRes.rawText).toContain("Content Referral Gateway");
      expect(contentRes.rawText).toContain("mov-123");

      const cnmRes = await makeRequest(testPort, "/cinemaxis/cnm-789");
      expect(cnmRes.statusCode).toBe(200);
      expect(cnmRes.rawText).toContain("Cinemaxis Universe");
      expect(cnmRes.rawText).toContain("cnm-789");
    });
  });

  describe("1. Observability, Health & Telemetry", () => {
    it("should respond to GET /healthz with healthy status and uptime", async () => {
      const res = await makeRequest(testPort, "/healthz");
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("healthy");
      expect(res.body.version).toBe("1.0.0");
    });

    it("should respond to GET /readyz with subsystem health and circuit breaker status", async () => {
      const res = await makeRequest(testPort, "/readyz");
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("ready");
      expect(res.body.checks.database).toBe("connected");
      expect(res.body.checks.federationBridge).toBe("CLOSED");
    });

    it("should expose Prometheus metrics on GET /metrics", async () => {
      const res = await makeRequest(testPort, "/metrics");
      expect(res.statusCode).toBe(200);
      expect(res.rawText).toContain("# TYPE");
      expect(res.rawText).toContain("http_requests_total");
    });
  });

  describe("2. Broadcast Linear Operations", () => {
    it("should return the canonical linear channels (NXTR, ORIS, IMBD) on GET /api/v1/broadcast/channels", async () => {
      const res = await makeRequest(testPort, "/api/v1/broadcast/channels");
      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBe(3);
      const codes = res.body.channels.map((c: any) => c.code);
      expect(codes).toContain("NXTR");
      expect(codes).toContain("ORIS");
      expect(codes).toContain("IMBD");
    });

    it("should return the complete 33 Broadcast Screen Surfaces inventory", async () => {
      const res = await makeRequest(testPort, "/api/v1/broadcast/screens");
      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBe(33);
      expect(res.body.screens[0].screenId).toBe("SCR-BCST-01");
      expect(res.body.screens[32].screenId).toBe("SCR-BCST-33");
    });

    it("should generate a valid XMLTV EPG feed for StarTimes on GET /api/v1/broadcast/epg/:channelCode", async () => {
      const res = await makeRequest(testPort, "/api/v1/broadcast/epg/NXTR");
      expect(res.statusCode).toBe(200);
      expect(res.rawText).toContain("<tv");
      expect(res.rawText).toContain("<programme");
      expect(res.rawText).toContain("Urban Beats Live");
    });

    it("should reconcile As-Run logs and generate cryptographically signed Certificates of Airing", async () => {
      const now = new Date();
      const asRunItems = [
        {
          spotId: "spt-001",
          clientName: "Zenith Bank Plc",
          campaignId: "cmp-001",
          actualStartTime: now,
          actualDurationSeconds: 30,
          expectedDurationSeconds: 30,
          status: "AIRED_FULL" as const,
        },
      ];

      const res = await makeRequest(testPort, "/api/v1/broadcast/asrun/reconcile", {
        method: "POST",
        body: { channelCode: "NXTR", asRunItems },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.report.totalAiredFull).toBe(1);
      const cert = res.body.report.certificates[0];
      expect(cert.spotId).toBe("spt-001");
      expect(cert.cryptographicSignature).toBeDefined();
      expect(cert.cryptographicSignature.length).toBe(64);
    });
  });

  describe("3. Creative Economy Hub Integration", () => {
    it("should onboard creative talent with verified skills and profile ID", async () => {
      const payload = {
        id: "tal-tiwa-01",
        personId: "per-tiwa-01",
        fullName: "Tiwa Adeyemi",
        primaryCategory: "CINEMATOGRAPHY" as const,
        locationCity: "Lagos",
        locationState: "Lagos State",
        dayRateNgn: 45000,
      };

      const res = await makeRequest(testPort, "/api/v1/hub/talent/onboard", {
        method: "POST",
        body: payload,
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.talent.fullName).toBe("Tiwa Adeyemi");
      expect(res.body.talent.primaryCategory).toBe("CINEMATOGRAPHY");
    });

    it("should issue verifiable AFCA certificate when competency rubrics pass", async () => {
      // Set up course, project, cohort, and graded student submission
      app.context.afcaService.createCourse({
        id: "afca-dir-01",
        courseCode: "DIR-101",
        title: "Afro-Fusion Directing",
        description: "Core directing principles",
        level: "FOUNDATION",
        totalCredits: 10,
        passingScore: 70,
        prerequisiteCourseIds: [],
        modules: [],
        createdAt: new Date(),
      });

      app.context.afcaService.createAssessmentProject({
        id: "prj-01",
        courseId: "afca-dir-01",
        title: "Short Film Scene",
        description: "Direct a 3-minute scene",
        submissionDeadline: new Date(Date.now() + 86400000),
        rubric: [
          { id: "rub-1", name: "Storytelling", description: "Narrative clarity", maxScore: 50, weight: 0.5 },
          { id: "rub-2", name: "Visuals", description: "Camera work", maxScore: 50, weight: 0.5 },
        ],
      });

      app.context.afcaService.createCohort({
        id: "coh-01",
        cohortCode: "DIR-2026-C1",
        courseId: "afca-dir-01",
        leadInstructorId: "inst-01",
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000 * 30),
        capacity: 25,
      });

      app.context.afcaService.enrollStudent("coh-01", "stu-101");
      app.context.afcaService.submitProjectDeliverable({
        id: "sub-01",
        cohortId: "coh-01",
        projectId: "prj-01",
        studentId: "stu-101",
        deliverableUrl: "https://storage.vmnl.ng/submissions/sub-01.mp4",
      });

      app.context.afcaService.gradeProjectSubmission("sub-01", "grader-01", [
        { criterionId: "rub-1", score: 45 },
        { criterionId: "rub-2", score: 45 },
      ]);

      const res = await makeRequest(testPort, "/api/v1/hub/afca/certify", {
        method: "POST",
        body: { cohortId: "coh-01", studentId: "stu-101" },
      });

      expect(res.statusCode).toBe(201);
      const cert = res.body.certificate;
      expect(cert.courseId).toBe("afca-dir-01");
      expect(cert.verificationTokenSha256).toBeDefined();
      expect(cert.verificationTokenSha256.length).toBe(64);
      expect(cert.verificationUrl).toContain("/verify/afca/");
      expect(cert.qrPayload).toContain("AFCA-CERT-2026");
    });

    it("should verify event tickets and prevent double entry (UAT Drill 18)", async () => {
      // 1. Create event
      app.context.eventsEngine.createEvent({
        id: "evt-gala-01",
        name: "AFCA Creative Gala",
        category: "AWARD_SHOW",
        venueName: "Eko Hotels",
        venueCity: "Lagos",
        eventDate: new Date(),
        doorsOpenTime: "18:00",
        capacity: 500,
        tiers: {
          REGULAR: { priceNgn: 10000, allocation: 200, sold: 0 },
          VIP: { priceNgn: 25000, allocation: 100, sold: 0 },
          VVIP: { priceNgn: 50000, allocation: 50, sold: 0 },
          BACKSTAGE_PASS: { priceNgn: 100000, allocation: 10, sold: 0 },
        },
        isPublished: true,
      });

      // 2. Issue ticket
      const ticket = app.context.eventsEngine.issueTicket({
        eventId: "evt-gala-01",
        attendeeName: "Bolanle Austen",
        attendeeEmail: "bolanle@terra.ng",
        tier: "VIP",
      });

      // 3. First entry scan -> Success
      const firstScan = await makeRequest(testPort, "/api/v1/hub/events/verify-ticket", {
        method: "POST",
        body: { ticketNumber: ticket.ticketNumber, eventId: "evt-gala-01" },
      });
      expect(firstScan.statusCode).toBe(200);
      expect(firstScan.body.valid).toBe(true);

      // 4. Second entry scan with duplicate token -> Rejected
      const secondScan = await makeRequest(testPort, "/api/v1/hub/events/verify-ticket", {
        method: "POST",
        body: { ticketNumber: ticket.ticketNumber, eventId: "evt-gala-01" },
      });
      expect(secondScan.statusCode).toBe(400);
      expect(secondScan.body.valid).toBe(false);
      expect(secondScan.body.reason).toBe("ALREADY_CHECKED_IN");
    });
  });

  describe("4. Intelligence, Knowledge & Agentic OS", () => {
    it("should search Headspace IP and regulations with role-based filtering", async () => {
      const res = await makeRequest(testPort, "/api/v1/intelligence/headspace/search", {
        method: "POST",
        body: { query: "NBC", userLevel: "INTERNAL" },
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBeGreaterThan(0);
      expect(res.body.results[0].document.category).toBe("REGULATORY_CODE");
    });

    it("should generate standard WebVTT subtitles via Cr8Tech", async () => {
      const res = await makeRequest(testPort, "/api/v1/intelligence/cr8tech/subtitle", {
        method: "POST",
        body: {
          assetId: "ast-001",
          language: "EN",
          format: "WEBVTT",
          cues: [
            {
              startTimeSec: 1.0,
              endTimeSec: 3.5,
              text: "Welcome to Nigezie Xtreme.",
            },
          ],
        },
      });
      expect(res.statusCode).toBe(200);
      expect(res.rawText).toContain("WEBVTT");
      expect(res.rawText).toContain("Welcome to Nigezie Xtreme.");
    });

    it("should submit proposals through AOS Agentic OS and enforce HITL supervisor checks", async () => {
      const res = await makeRequest(testPort, "/api/v1/intelligence/aos/execute", {
        method: "POST",
        body: {
          agentId: "bot-001",
          criticality: "HIGH_SCHEDULE",
          targetDomain: "BROADCAST",
          proposedAction: "REBALANCE_PRIME_SCHEDULE",
          payload: { channelId: "NXTR" },
        },
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.proposal.status).toBe("PENDING_SUPERVISOR_APPROVAL");
      expect(res.body.proposal.auditHashSha256).toBeDefined();
    });
  });

  describe("5. Azeebo+ Federation & Circuit Breaker", () => {
    it("should generate dynamic universal deep links across universes", async () => {
      const res = await makeRequest(testPort, "/api/v1/federation/azeebo/link", {
        method: "POST",
        body: {
          universe: "MOVIES",
          contentId: "mov-jagun-01",
          campaignId: "startimes_cross_promo",
          channelId: "ORIS",
        },
      });
      expect(res.statusCode).toBe(201);
      expect(res.body.link.universalUrl).toContain("https://azeebo.plus/u/movies/mov-jagun-01");
      expect(res.body.link.qrPayload).toBeDefined();
    });

    it("should dispatch webhooks and handle circuit breaker state", async () => {
      const res = await makeRequest(testPort, "/api/v1/federation/azeebo/webhook", {
        method: "POST",
        body: {
          eventType: "CATALOGUE_SYNCED",
          targetEndpoint: "https://api.azeebo.plus/v1/webhooks",
          payload: { catalogCount: 15 },
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.webhook.status).toBe("DELIVERED");
    });
  });

  describe("6. Commercial Finance & Release Gates", () => {
    it("should create commercial QTC deals with stage progression", async () => {
      const res = await makeRequest(testPort, "/api/v1/finance/deals", {
        method: "POST",
        body: {
          id: "deal-mtn-01",
          clientOrgId: "org-mtn",
          dealName: "MTN 5G Mega Campaign",
          totalContractValueNgn: 15000000,
          salesLeadId: "usr-sales-01",
        },
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.deal.id).toBe("deal-mtn-01");
      expect(res.body.deal.stage).toBe("LEAD");
      expect(res.body.deal.totalContractValueNgn).toBe(15000000);
    });

    it("should generate talent payout batch with statutory Nigerian WHT deductions (5% / 10%)", async () => {
      const items = [
        {
          beneficiaryId: "tal-01",
          beneficiaryName: "Femi Kuti",
          beneficiaryTaxType: "INDIVIDUAL" as const,
          bankName: "Guaranty Trust Bank",
          accountNumber: "0123456789",
          grossAmountNgn: 1000000,
        },
        {
          beneficiaryId: "tal-02",
          beneficiaryName: "EbonyLife Media Ltd",
          beneficiaryTaxType: "CORPORATE" as const,
          bankName: "Zenith Bank",
          accountNumber: "2019283746",
          grossAmountNgn: 5000000,
        },
      ];

      const res = await makeRequest(testPort, "/api/v1/finance/payouts/batch", {
        method: "POST",
        body: {
          id: "bat-001",
          batchReference: "NIP-2026-B1",
          makerUserId: "usr-finance-maker",
          items,
        },
      });

      expect(res.statusCode).toBe(201);
      const batch = res.body.batch;
      expect(batch.totalGrossNgn).toBe(6000000);
      // Individual: 15% platform fee = 150,000; remaining 850,000 * 5% WHT = 42,500; net = 807,500
      // Corporate: 15% platform fee = 750,000; remaining 4,250,000 * 10% WHT = 425,000; net = 3,825,000
      expect(batch.totalPlatformFeeNgn).toBe(900000);
      expect(batch.totalWhtNgn).toBe(467500);
      expect(batch.totalNetDisbursementNgn).toBe(4632500);
    });

    it("should evaluate Four-Tier Release Gates and confirm deployment clearance", async () => {
      const manifest = {
        version: "1.0.0",
        gitCommitSha: "a1b2c3d4e5",
        gates: {
          0: { gateTier: 0, name: "ADR Alignment", passed: true, checkedBy: "Architect", timestamp: new Date() },
          1: { gateTier: 1, name: "NDPR Security", passed: true, checkedBy: "SecOps", timestamp: new Date() },
          2: { gateTier: 2, name: "Automated Tests", passed: true, checkedBy: "QA", timestamp: new Date() },
          3: { gateTier: 3, name: "Operator UAT Sign-off", passed: true, checkedBy: "Ops", timestamp: new Date() },
        },
        isReadyForProduction: true,
        signOffSignatures: [
          { role: "BroadcastDirector", officerName: "Femi Aderibigbe", signedAt: new Date() },
          { role: "TrafficManager", officerName: "Bukola Johnson", signedAt: new Date() },
          { role: "FinanceController", officerName: "Emeka Okafor", signedAt: new Date() },
        ],
      };

      const res = await makeRequest(testPort, "/api/v1/quality/gates", {
        method: "POST",
        body: manifest,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.canDeploy).toBe(true);
      expect(res.body.failingGates.length).toBe(0);
    });
  });
});
