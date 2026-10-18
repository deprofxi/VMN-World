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
import crypto from "node:crypto";
import { createApiServer, ApiServerInstance } from "../../src/api/server.js";
import { deleteFixtureRows, ensureFixturePerson } from "../helpers/db-parents.js";
import { signSessionToken } from "../../src/core/auth/index.js";
import { _resetConfigForTesting } from "../../src/core/config/index.js";
import { _resetStorageReadinessCacheForTesting } from "../../src/core/storage/index.js";
import { startStorageStub, type StorageStub } from "../helpers/storage-stub.js";

let sharedAuthToken: string | undefined;

const TEST_FEDERATION_ORIGIN = "https://federation-partner.example.test";

// TSK-19: run-unique provider event ids — see tests/unit/security-auth-rbac.test.ts.
const PSK_EVENT_ID = Number(`9${Date.now()}`.slice(0, 14));
const FLW_EVENT_ID = Number(`5${Date.now()}`.slice(0, 14));

function makeRequest(
  port: number,
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: any; rawText: string; rawBuffer: Buffer }> {
  return new Promise((resolve, reject) => {
    const payload = options.body ? JSON.stringify(options.body) : undefined;
    const chunks: Buffer[] = [];
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...(sharedAuthToken ? { Authorization: `Bearer ${sharedAuthToken}` } : {}),
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
          ...options.headers,
        },
      },
      (res) => {
        res.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
        res.on("end", () => {
          const rawBuffer = Buffer.concat(chunks);
          const data = rawBuffer.toString("utf8");
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
            rawBuffer,
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
  let storageStub: StorageStub;
  let previousStorageEndpoint: string | undefined;
  const testPort = 49152 + Math.floor(Math.random() * 1000);
  /** TSK-60 box 3: this suite's deal is now a durable row, so it is reset on both sides. */
  const DEAL_FIXTURE_IDS = ["deal-mtn-01"];

  beforeAll(async () => {
    await deleteFixtureRows({ dealIds: DEAL_FIXTURE_IDS });
    // PR-08: `/readyz` now proves object storage with a signed bucket request
    // rather than trusting that `STORAGE_ENDPOINT` parses. This suite asserts
    // the platform is ready, so it supplies a store that answers instead of
    // silently disabling the storage half of the readiness gate.
    storageStub = await startStorageStub();
    previousStorageEndpoint = process.env.STORAGE_ENDPOINT;
    process.env.STORAGE_ENDPOINT = storageStub.endpoint;
    _resetConfigForTesting();
    _resetStorageReadinessCacheForTesting();
    // TSK-35: the Azeebo+ origin is deployment configuration. The suite boots
    // with a test origin so the assertions below prove the link comes from
    // config — no partner domain may be hard-coded in the product.
    app = createApiServer(testPort, { AZEEBO_PLUS_UNIVERSAL_URL: TEST_FEDERATION_ORIGIN });
    await app.start();

    // TSK-05: talent onboarding writes a TalentProfile whose personId is an
    // enforced FK to Person. The route registers against an existing canonical
    // identity, so the fixture creates that identity first.
    await ensureFixturePerson("per-tiwa-01", { firstName: "Tiwa", lastName: "Adeyemi" });
    await ensureFixturePerson("per-vtm-denied", { firstName: "Denied", lastName: "Applicant" });

    process.env.PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "test_paystack_secret_key_32_characters_long";
    process.env.FLUTTERWAVE_SECRET_HASH = process.env.FLUTTERWAVE_SECRET_HASH || "test_flw_secret_hash_value_32_chars";
    const devPass = process.env.DEV_SEED_PASSWORD || "vmnl-dev-seed-pass-2026#secure";

    // Authenticate with seeded Admin credentials to obtain real session token (CR-1, CR-2)
    const loginRes = await makeRequest(testPort, "/api/v1/auth/login", {
      method: "POST",
      body: {
        email: "admin@vmnl.ng",
        password: devPass,
      },
    });
    sharedAuthToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await deleteFixtureRows({ personIds: ["per-tiwa-01", "per-vtm-denied"] });
    // `app.stop()` drains the write-behind journal, so the deal rows are removed
    // after it — deleting first would let the drain re-write them.
    await app.stop();
    await deleteFixtureRows({ dealIds: DEAL_FIXTURE_IDS });
    await storageStub.close();
    if (previousStorageEndpoint === undefined) delete process.env.STORAGE_ENDPOINT;
    else process.env.STORAGE_ENDPOINT = previousStorageEndpoint;
    _resetConfigForTesting();
    _resetStorageReadinessCacheForTesting();
  });

  describe("0. Public Web Pages & Operator Dashboard", () => {
    it("should serve the corporate overview HTML on GET /", async () => {
      const res = await makeRequest(testPort, "/");
      expect(res.statusCode).toBe(200);
      expect(res.rawText).toContain("Company information and preliminary channel and service profiles");
      expect(res.rawText).toContain("Virtual Media Network Limited");
      expect(res.rawText).toContain("Operational reach and availability require independent confirmation");
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
      // Renderer escapes "&" to "&amp;" via shared escapeHtml (AUD-01).
      expect(res.rawText).toContain("African Film &amp; Creative Arts Academy");
    });

    it("should serve the Broadcast Executive Dashboard on GET /broadcast/dashboard", async () => {
      const res = await makeRequest(testPort, "/broadcast/dashboard");
      expect(res.statusCode).toBe(200);
      expect(res.rawText).toContain("Broadcast Executive Dashboard");
      expect(res.rawText).toContain("SCR-BCST-01");
      expect(res.rawText).toContain("Transmission &amp; Carriage Status");
      expect(res.rawText).toContain("not connected to a verified source");
      expect(res.rawText).not.toContain("Ch. 428 DTT");
    });

    it("should serve the 33 Broadcast Screen Surfaces Catalog on GET /broadcast/screens", async () => {
      const res = await makeRequest(testPort, "/broadcast/screens");
      expect(res.statusCode).toBe(200);
      expect(res.rawText).toContain("Broadcast Operational Screen Inventory");
      expect(res.rawText).toContain("SCR-BCST-01");
      expect(res.rawText).toContain("SCR-BCST-33");
      expect(res.rawText).toContain("0 fully engine-sourced");
      expect(res.rawText).not.toContain("33 of 33 Screens Ready");
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

    it("should return friendly 404 error on GET /broadcast/screens/:id for invalid screen (AUD-32 soft-404 fix)", async () => {
      const res = await makeRequest(testPort, "/broadcast/screens/SCR-INVALID-99");
      expect(res.statusCode).toBe(404);
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
      expect(nxtrRes.rawText).toContain('<link rel="canonical" href="https://vmnl.ng/channels/nxtr"');
      expect(nxtrRes.rawText).toContain("Nigezie Xtreme");
      expect(nxtrRes.rawText).toContain("No approved, source-backed schedule is connected");
      expect(nxtrRes.rawText).not.toContain("ON AIR NOW");

      const orisRes = await makeRequest(testPort, "/channels/orisun");
      expect(orisRes.statusCode).toBe(200);
      expect(orisRes.rawText).toContain('<link rel="canonical" href="https://vmnl.ng/channels/orisun"');
      expect(orisRes.rawText).toContain("Orisun");

      const imbdRes = await makeRequest(testPort, "/channels/isimbido");
      expect(imbdRes.statusCode).toBe(200);
      expect(imbdRes.rawText).toContain('<link rel="canonical" href="https://vmnl.ng/channels/isimbido"');
      expect(imbdRes.rawText).toContain("Isi Mbido");

      const prgRes = await makeRequest(testPort, "/programmes/PRG-001");
      expect(prgRes.statusCode).toBe(200);
      expect(prgRes.rawText).toContain('<link rel="canonical" href="https://vmnl.ng/programmes/PRG-001"');
      expect(prgRes.rawText).toContain("Programme details are unavailable until an approved catalogue record is connected");
      expect(prgRes.rawText).not.toContain("Urban Beats Live Prime");
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

      const styleguideRes = await makeRequest(testPort, "/styleguide");
      expect(styleguideRes.statusCode).toBe(200);
      expect(styleguideRes.rawText).toContain("VMNL Living Design System & Styleguide");

      const faviconRes = await makeRequest(testPort, "/favicon.ico");
      expect(faviconRes.statusCode).toBe(200);
      expect(faviconRes.headers["content-type"]).toContain("image/svg+xml");

      const ogSvgRes = await makeRequest(testPort, "/assets/og-vmnl-master.svg");
      expect(ogSvgRes.statusCode).toBe(200);
      expect(ogSvgRes.rawText).toContain("<svg");

      const ogPngRes = await makeRequest(testPort, "/assets/og-vmnl-master.png");
      expect(ogPngRes.statusCode).toBe(200);
      expect(ogPngRes.headers["content-type"]).toContain("image/png");
      expect(ogPngRes.rawBuffer.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      expect(ogPngRes.rawBuffer.readUInt32BE(16)).toBe(1200);
      expect(ogPngRes.rawBuffer.readUInt32BE(20)).toBe(630);
      expect(Number(ogPngRes.headers["content-length"])).toBe(ogPngRes.rawBuffer.length);
    });

    // Surface B & C Tests
    it("should serve Surface B & C Enterprise Workspaces directory and desk pages", async () => {
      const dirRes = await makeRequest(testPort, "/workspace");
      expect(dirRes.statusCode).toBe(200);
      expect(dirRes.rawText).toContain("Enterprise Operating Hub");
      // TSK-23: the served directory must advertise the measured wiring, not "all operational".
      expect(dirRes.rawText).toContain("1 of 48 desks bound to engine state");
      expect(dirRes.rawText).not.toContain("48 of 48 Desks Operational");

      const execRes = await makeRequest(testPort, "/workspace/executive");
      expect(execRes.statusCode).toBe(200);
      expect(execRes.rawText).toContain("Enterprise Executive Command Dashboard");
      expect(execRes.rawText).toContain("ExecutiveLeader");

      const mcrRes = await makeRequest(testPort, "/workspace/mcr");
      expect(mcrRes.statusCode).toBe(200);
      expect(mcrRes.rawText).toContain("Master Control Room (MCR) Playout Supervisor");
      expect(mcrRes.rawText).toContain("MCRSupervisor");

      const soundstageRes = await makeRequest(testPort, "/workspace/soundstage");
      expect(soundstageRes.statusCode).toBe(200);
      expect(soundstageRes.rawText).toContain("Studio Soundstage, Acoustical & Set Operations");

      const finRes = await makeRequest(testPort, "/workspace/finance");
      expect(finRes.statusCode).toBe(200);
      expect(finRes.rawText).toContain("Consolidated Finance & Settlement Dashboard");

      const aosRes = await makeRequest(testPort, "/workspace/aos");
      expect(aosRes.statusCode).toBe(200);
      expect(aosRes.rawText).toContain("Agentic OS Registry & Evaluation Desk");

      // AUD-32: unknown desks now return a truthful 404 status.
      const invalidDesk = await makeRequest(testPort, "/workspace/unknown-desk");
      expect(invalidDesk.statusCode).toBe(404);
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

    it("should handle HEAD requests centrally with 200 OK and no body (AUD-13)", async () => {
      const headRes = await makeRequest(testPort, "/", { method: "HEAD" });
      expect(headRes.statusCode).toBe(200);
      expect(headRes.headers["content-type"]).toContain("text/html");
      expect(headRes.headers["content-length"]).toBeDefined();
      expect(headRes.rawText).toBe("");
    });

    it("should compress responses with gzip and apply Vary: Accept-Encoding (AUD-18)", async () => {
      const compRes = await makeRequest(testPort, "/assets/styles.css", {
        headers: { "Accept-Encoding": "gzip" },
      });
      expect(compRes.statusCode).toBe(200);
      expect(compRes.headers["content-encoding"]).toBe("gzip");
      expect(compRes.headers["vary"]).toContain("Accept-Encoding");
    });

    it("should mark authenticated HTML as private, no-store and public pages as must-revalidate (AUD-19)", async () => {
      const pubRes = await makeRequest(testPort, "/", { headers: { Authorization: "" } });
      expect(pubRes.headers["cache-control"]).toBe("public, max-age=0, must-revalidate");

      const personalizedHome = await makeRequest(testPort, "/", { headers: { Authorization: `Bearer ${sharedAuthToken}` } });
      expect(personalizedHome.headers["cache-control"]).toBe("private, no-store");
      expect(personalizedHome.rawText).toContain("admin");

      const authRes = await makeRequest(testPort, "/workspace");
      expect(authRes.headers["cache-control"]).toContain("private");
      expect(authRes.headers["cache-control"]).toContain("no-store");
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
      if (res.body.checks?.database === "connected") {
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe("ready");
        // PR-08: readiness is only green when the object store answered. The
        // stub above is what makes this assertion about the probe rather than
        // about a URL string.
        expect(res.body.checks.storage).toBe("ready");
        expect(res.body.checks.storageGating).toBe("enforced");
      } else {
        expect(res.statusCode).toBe(503);
        expect(res.body.status).toBe("unavailable");
        expect(res.body.checks?.database).toBe("unavailable");
      }
      expect(res.body.checks.federationBridge).toBe("CLOSED");
    });

    it("should expose Prometheus metrics on GET /metrics", async () => {
      const res = await makeRequest(testPort, "/metrics");
      expect(res.statusCode).toBe(200);
      expect(res.rawText).toContain("# TYPE");
      expect(res.rawText).toContain("http_requests_total");
      // TSK-36 box 3: the KV-health series the `KVBackendLoss` rule fires on is
      // recorded by the /readyz probe above and must be visible at the scrape
      // endpoint — an alert may never name a series nothing publishes (the
      // PR-14 failure mode, in the monitoring layer).
      expect(res.rawText).toContain("kv_backend_unhealthy");
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

    it("does not publish sample EPG data before an approved schedule source is connected", async () => {
      const res = await makeRequest(testPort, "/api/v1/broadcast/epg/NXTR");
      expect(res.statusCode).toBe(503);
      expect(res.body.code).toBe("APPROVED_SCHEDULE_UNAVAILABLE");
      expect(res.rawText).not.toContain("Urban Beats Live");
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

      // An as-run reconciliation creates a record, not independently verified transmission evidence.
      expect(cert.isVerified).toBe(false);
      const poaHtmlRes = await makeRequest(testPort, `/verify/poa/${cert.certificateId}`);
      expect(poaHtmlRes.statusCode).toBe(404);
      expect(poaHtmlRes.rawText).toContain("No source-verified Proof-of-Air record is available");
      expect(poaHtmlRes.rawText).not.toContain("Download PDF Certificate");

      const poaJsonRes = await makeRequest(testPort, `/verify/poa/${cert.certificateId}?format=json`);
      expect(poaJsonRes.statusCode).toBe(404);
      expect(poaJsonRes.body.valid).toBe(false);
      expect(poaJsonRes.body.certificate).toBeUndefined();

      const invalidPoaRes = await makeRequest(testPort, "/verify/poa/non-existent-poa-id");
      expect(invalidPoaRes.statusCode).toBe(404);
      expect(invalidPoaRes.rawText).toContain("Proof-of-Air Performance Not Found");
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

      // Public Verification Route: AFCA Academy Certificate
      const certHtmlRes = await makeRequest(testPort, `/verify/afca/${cert.certificateId}`);
      expect(certHtmlRes.statusCode).toBe(200);
      expect(certHtmlRes.rawText).toContain("Official AFCA Graduation Credential");
      expect(certHtmlRes.rawText).toContain("stu-101");
      expect(certHtmlRes.rawText).toContain(cert.verificationTokenSha256);

      const certJsonRes = await makeRequest(testPort, `/verify/afca/${cert.certificateId}?format=json`);
      expect(certJsonRes.statusCode).toBe(200);
      expect(certJsonRes.body.valid).toBe(true);
      expect(certJsonRes.body.certificate.certificateId).toBe(cert.certificateId);

      const invalidCertRes = await makeRequest(testPort, "/verify/afca/non-existent-afca-id");
      expect(invalidCertRes.statusCode).toBe(404);
      expect(invalidCertRes.rawText).toContain("Certificate Not Found");
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
      expect(res.body.link.universalUrl).toContain(`${TEST_FEDERATION_ORIGIN}/u/movies/mov-jagun-01`);
      expect(res.body.link.qrPayload).toBeDefined();
    });

    it("should dispatch webhooks and handle circuit breaker state", async () => {
      // TODO-SEC-09: inbound ingestion is HMAC-verified — the test signs the
      // raw body exactly as the Azeebo+ partner would (timestamp.body HMAC).
      const payload = {
        eventType: "CATALOGUE_SYNCED",
        targetEndpoint: "https://api.azeebo.plus/v1/webhooks",
        payload: { catalogCount: 15 },
      };
      const rawBody = JSON.stringify(payload);
      const timestamp = new Date().toISOString();
      const signature = crypto.createHmac("sha256", process.env.AZEEBO_WEBHOOK_SECRET || "azeebo-secret-minimum-16-chars")
        .update(`${timestamp}.${rawBody}`)
        .digest("hex");

      const res = await makeRequest(testPort, "/api/v1/federation/azeebo/webhook", {
        method: "POST",
        headers: {
          "X-Azeebo-Signature": `sha256=${signature}`,
          "X-Azeebo-Timestamp": timestamp,
        },
        // makeRequest stringifies the object; key order is preserved so the
        // HMAC computed over JSON.stringify(payload) matches the raw body.
        body: payload,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.webhook.status).toBe("DELIVERED");
      expect(res.body.authenticated).toBe(true);

      // A forged signature is rejected.
      const forged = await makeRequest(testPort, "/api/v1/federation/azeebo/webhook", {
        method: "POST",
        headers: {
          "X-Azeebo-Signature": `sha256=${"0".repeat(64)}`,
          "X-Azeebo-Timestamp": timestamp,
        },
        body: rawBody,
      });
      expect(forged.statusCode).toBe(401);
      expect(forged.body.code).toBe("FEDERATION_SIGNATURE_INVALID");
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

    it("should process Paystack and Flutterwave incoming webhook payloads and ingest transactions", async () => {
      // 1. Paystack Webhook
      const paystackPayload = {
        event: "charge.success",
        data: {
          id: PSK_EVENT_ID,
          reference: "PSK-E2E-REF-001",
          amount: 25000000, // 250,000 NGN in kobo
          currency: "NGN",
          paid_at: new Date().toISOString(),
          customer: { email: "agency@brandmedia.ng" },
          gateway_response: "Successful",
          status: "success",
        },
      };
      const rawPaystack = JSON.stringify(paystackPayload);
      const paystackSecret = process.env.PAYSTACK_SECRET_KEY!;
      const paystackSig = crypto.createHmac("sha512", paystackSecret).update(rawPaystack).digest("hex");

      const paystackRes = await makeRequest(testPort, "/api/v1/webhooks/paystack", {
        method: "POST",
        headers: { "x-paystack-signature": paystackSig },
        body: paystackPayload,
      });
      expect(paystackRes.statusCode).toBe(200);
      expect(paystackRes.body.status).toBe("success");

      // 2. Flutterwave Webhook
      const flwPayload = {
        event: "charge.completed",
        data: {
          id: FLW_EVENT_ID,
          tx_ref: "FLW-E2E-REF-002",
          amount: 500000,
          currency: "NGN",
          status: "successful",
          created_at: new Date().toISOString(),
          customer: { email: "sponsor@telco.ng" },
        },
      };
      const flwSecretHash = process.env.FLUTTERWAVE_SECRET_HASH!;

      const flwRes = await makeRequest(testPort, "/api/v1/webhooks/flutterwave", {
        method: "POST",
        headers: { "verif-hash": flwSecretHash },
        body: flwPayload,
      });
      expect(flwRes.statusCode).toBe(200);
      expect(flwRes.body.status).toBe("success");
    });
  });

  describe("7. Zero-Deferral Operational Flows & Feature Flag Engine Integration", () => {
    it("should retrieve and toggle feature flags via API with audit trail", async () => {
      // 1. Get all feature flags
      const flagsRes = await makeRequest(testPort, "/api/v1/feature-flags");
      expect(flagsRes.statusCode).toBe(200);
      expect(flagsRes.body.status).toBe("SUCCESS");
      expect(flagsRes.body.count).toBeGreaterThanOrEqual(24);

      // 2. Patch a flag override
      const patchRes = await makeRequest(testPort, "/api/v1/feature-flags/FF_VCF_CREATOR_MISSIONS", {
        method: "PATCH",
        body: { enabled: true, reason: "E2E Integration Verification" },
      });
      expect(patchRes.statusCode).toBe(200);
      expect(patchRes.body.flag.enabled).toBe(true);
    });

    it("should serve all expanded public screens with valid semantic HTML and 200 OK", async () => {
      const publicPaths = [
        "/about",
        "/schedule",
        "/advertising",
        "/contact",
        "/help",
        "/privacy",
        "/accessibility",
        "/apply",
        "/vtm/marketplace",
      ];

      for (const path of publicPaths) {
        const res = await makeRequest(testPort, path);
        expect(res.statusCode).toBe(200);
        expect(res.headers["content-type"]).toContain("text/html");
        expect(res.rawText).toContain("<!DOCTYPE html>");
      }
    });

    it("requires an authorized session for VTM terms and never accepts a fabricated contract signature", async () => {
      const termsAnonymous = await makeRequest(testPort, "/vtm/terms", { headers: { Authorization: "" } });
      expect(termsAnonymous.statusCode).toBe(401);
      const termsForbiddenToken = signSessionToken({ userId: "usr-vtm-denied", personId: "per-vtm-denied", email: "learner@example.ng", roles: ["AcademyLearner"] }).accessToken;
      const termsForbidden = await makeRequest(testPort, "/vtm/terms", { headers: { Authorization: `Bearer ${termsForbiddenToken}` } });
      expect(termsForbidden.statusCode).toBe(403);
      const termsAuthorized = await makeRequest(testPort, "/vtm/terms", { headers: { Authorization: `Bearer ${sharedAuthToken}` } });
      expect(termsAuthorized.statusCode).toBe(200);
      // /vtm/terms is auth-gated and deliberately excluded from
      // PUBLIC_INDEXABLE_ROUTES, so the layout renders noindex and omits a
      // canonical link (AUD-02). Indexing an auth-gated page is a policy
      // decision that must be made in the registry, not assumed here.
      expect(termsAuthorized.rawText).toContain('<meta name="robots" content="noindex, nofollow">');
      expect(termsAuthorized.rawText).not.toContain('<link rel="canonical" href="https://vmnl.ng/vtm/terms"');
      expect(termsAuthorized.rawText).toContain("DEMO ONLY");
      expect(termsAuthorized.headers["cache-control"]).toBe("private, no-store");

      const signAnonymous = await makeRequest(testPort, "/api/v1/vtm/contracts/CTR-UNKNOWN/sign", {
        method: "POST",
        headers: { Authorization: "" },
        body: { signature: "arbitrary" },
      });
      expect(signAnonymous.statusCode).toBe(401);
      const signAuthorized = await makeRequest(testPort, "/api/v1/vtm/contracts/CTR-UNKNOWN/sign", {
        method: "POST",
        headers: { Authorization: `Bearer ${sharedAuthToken}` },
        body: { signature: "arbitrary" },
      });
      expect(signAuthorized.statusCode).toBe(503);
      expect(signAuthorized.body.code).toBe("CANONICAL_CONTRACT_WORKFLOW_UNAVAILABLE");
    });

    it("should process commercial enquiry intake and refuse idempotency-key PII recovery", async () => {
      const enquiryPayload = {
        fullName: "Dr. Adebayo Adeleke",
        email: "adebayo@nigerianbrands.ng",
        companyName: "Adeleke & Partners Media",
        vertical: "COMMERCIAL_ADVERTISING",
        message: "Requesting rate card for Prime Time spots on Nigezie Xtreme.",
        ndprConsent: true,
        idempotencyKey: `idem-enq-e2e-${Date.now()}`,
      };

      // 1. Submit enquiry
      const submitRes = await makeRequest(testPort, "/api/v1/enquiries", {
        method: "POST",
        body: enquiryPayload,
      });
      expect(submitRes.statusCode).toBe(201);
      expect(submitRes.body.status).toBe("SUCCESS");
      expect(submitRes.body.reference).toMatch(/^ENQ-\d{8}-[A-Z0-9]{4}$/);

      // An idempotency key is not an authorization capability and cannot be
      // used to retrieve applicant PII.
      const recoveryRes = await makeRequest(
        testPort,
        `/api/v1/enquiries/recovery?idempotencyKey=${enquiryPayload.idempotencyKey}`
      );
      expect(recoveryRes.statusCode).toBe(410);
      expect(recoveryRes.body.code).toBe("ENQUIRY_RECOVERY_CAPABILITY_REQUIRED");
      expect(recoveryRes.body).not.toHaveProperty("enquiry");
    });

    it("should execute complete AFCA admissions lifecycle (submit, queue, evaluate)", async () => {
      const appPayload = {
        fullName: "Fatima Al-Hassan",
        email: "fatima@directors.ng",
        phone: "+234 803 999 8888",
        creativeTrack: "DIRECTING",
        experienceLevel: "INTERMEDIATE",
        portfolioUrl: "https://vimeo.com/showreel/fatima",
        statementOfIntent: "Directing indigenous African stories with cinematic depth.",
        financialAidRequested: true,
        idempotencyKey: `idem-afca-e2e-${Date.now()}`,
      };

      // 1. Submit application
      const submitRes = await makeRequest(testPort, "/api/v1/applications/submit", {
        method: "POST",
        body: appPayload,
      });
      expect(submitRes.statusCode).toBe(201);
      expect(submitRes.body.status).toBe("SUCCESS");
      expect(submitRes.body.application.reference).toMatch(/^APP-\d{8}-\d{4}$/);

      const appRef = submitRes.body.application.reference;

      // 2. Fetch application by reference
      const getRes = await makeRequest(testPort, `/api/v1/applications/${appRef}`);
      expect(getRes.statusCode).toBe(200);
      expect(getRes.body.application.fullName).toBe("Fatima Al-Hassan");

      // 3. List in admissions staff queue
      const queueRes = await makeRequest(testPort, "/api/v1/admissions/queue", { headers: { Authorization: `Bearer ${sharedAuthToken}` } });
      expect(queueRes.statusCode).toBe(200);
      expect(queueRes.body.count).toBeGreaterThanOrEqual(1);

      // 4. Record admissions decision
      const decisionRes = await makeRequest(testPort, `/api/v1/admissions/${appRef}/decision`, {
        method: "POST",
        headers: { Authorization: `Bearer ${sharedAuthToken}` },
        body: {
          reviewerId: "forged-client-actor",
          decision: "ACCEPTED",
          notes: "Approved for Directing 2026 Cohort with 50% merit scholarship.",
          scores: { portfolioScore: 95, statementScore: 90, overallRating: 93 },
        },
      });
      expect(decisionRes.statusCode).toBe(200);
      expect(decisionRes.body.application.status).toBe("ACCEPTED");
      expect(decisionRes.body.application.reviewedBy).toBe("usr-61646d696e40");
    });

    it("keeps digital contract signing disabled pending a canonical workflow", async () => {
      const contractId = "ctr-e2e-vtm-99";
      const signRes = await makeRequest(testPort, `/api/v1/vtm/contracts/${contractId}/sign`, {
        method: "POST",
        body: {
          legalSignature: "Babatunde Olumide",
          termsAffirmation: true,
        },
      });

      expect(signRes.statusCode).toBe(503);
      expect(signRes.body.code).toBe("CANONICAL_CONTRACT_WORKFLOW_UNAVAILABLE");
      expect(signRes.body).not.toHaveProperty("signedHash");
    });
  });
});
