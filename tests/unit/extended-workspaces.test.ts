import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import { createApiServer, ApiServerInstance } from "../../src/api/server.js";
import { signSessionToken } from "../../src/core/auth/index.js";
import {
  renderProposalBuilderHtml,
  renderQuoteReviewHtml,
  renderLearningPlanHtml,
  renderAssignmentSubmissionHtml,
  renderFacultyGradingRubricHtml,
  renderCertificateGeneratorHtml,
  renderTalentAcceleratorDeskHtml,
  renderCommunityGuildsDeskHtml,
  renderVtmMatchingWorkbenchHtml,
  renderOneStudiosProductionDeskHtml,
  renderVcfCreatorMissionsHtml,
  renderFusionEventsDeskHtml,
  renderTendRightsDistributionHtml,
  renderHeadspaceIntelligenceHtml,
  renderCr8TechOperationsHtml,
  renderAgenticOsConsoleHtml,
  renderPartnerPortalHtml,
  renderCreatorPortalHtml,
  renderVendorPortalHtml,
  renderManagementOverviewHtml,
  renderRiskRegisterHtml,
  renderIssueTrackerHtml,
  CommercialProposalStore,
} from "../../src/web/index.js";
import { setFeatureFlagOverride, resetAllFeatureFlagOverrides } from "../../src/core/feature-flags/index.js";
import { QuoteToCashSalesEngine } from "../../src/modules/finance/sales/index.js";
import { checkDatabaseConnection, getPrismaClient } from "../../src/core/database/index.js";

function makeRequest(
  port: number,
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {}
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const payload = options.body;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method: options.method || "GET",
        headers: {
          ...(path.startsWith("/workspace") && (options.method || "GET") === "GET" && !options.headers?.["x-test-role"] && !options.headers?.Authorization
            ? { "x-test-role": "SuperAdmin" }
            : {}),
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
          ...options.headers,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers,
            body: data,
          });
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

describe("Extended Workspaces & Counterparty Portals Unit Tests", () => {
  let app: ApiServerInstance;
  const testPort = 4235;
  const adminUser = {
    userId: "usr-admin-ops",
    personId: "per-admin-ops",
    email: "admin@vmnl.ng",
    roles: ["SuperAdmin" as const],
  };
  let authToken: string;

  /**
   * SCR-19 mints its risk and issue through the durable route (TSK-17), so the
   * rows outlive this process and boot hydration would load them back as
   * already-existing fixtures ([RISK-01]) on the next run. The file owns its
   * rows: drop them before the server hydrates, and again on the way out.
   */
  async function dropScr19Fixtures(): Promise<void> {
    const db = await checkDatabaseConnection();
    if (!db.connected) return;
    await getPrismaClient().issueRecord.deleteMany({ where: { id: "ISSUE-SCR19-1" } });
    await getPrismaClient().riskRecord.deleteMany({ where: { id: "RSK-SCR19-1" } });
  }

  beforeAll(async () => {
    await dropScr19Fixtures();
    authToken = signSessionToken(adminUser).accessToken;
    app = createApiServer(testPort, {
      NODE_ENV: "test",
      SESSION_SECRET: "test-secret-at-least-32-bytes-long-vmnl",
      PORT: String(testPort),
    });
    await app.start();
  });

  afterAll(async () => {
    resetAllFeatureFlagOverrides();
    await app.stop();
    await dropScr19Fixtures();
  });

  describe("HTML Component Renderers (SCR-17/18/19 engine projections)", () => {
    it("SCR-17: renders proposal builder + quote review from canonical store, honest empty state otherwise", () => {
      // Empty store → honest empty state, no invented rows.
      const emptyStore = new CommercialProposalStore(new QuoteToCashSalesEngine());
      const emptyHtml = renderProposalBuilderHtml(emptyStore);
      expect(emptyHtml).toContain("UX-COM-006");
      expect(emptyHtml).toContain("Commercial Proposal Builder");
      expect(emptyHtml).toContain("never invents rows");

      // With a canonical proposal → renders proposal + canonical deal ref.
      const engine = new QuoteToCashSalesEngine();
      const store = new CommercialProposalStore(engine);
      store.createProposal({
        id: "PROP-TEST-1",
        clientName: "Dangote Group Holdings",
        clientOrgId: "org-dangote",
        campaignTitle: "Q4 Pan-African Flight",
        flightStart: "2026-10-01",
        flightEnd: "2026-12-31",
        accountExec: "Test Exec",
        items: [
          { id: "item-1", name: "30s Prime Spot", channel: "NXTR", daypart: "Prime", units: 60, ratePerUnitNgn: 450000, discountPercent: 10 },
        ],
        salesLeadId: "usr-1",
      });
      const html = renderProposalBuilderHtml(store);
      expect(html).toContain("Dangote Group Holdings");
      expect(html).toContain("PROP-TEST-1");
      expect(html).toContain("Canonical deal");

      const quote = renderQuoteReviewHtml(store.getProposal("PROP-TEST-1"));
      expect(quote).toContain("UX-COM-007");
      expect(quote).toContain("Broadcasting Quotation");
      expect(quote).toContain("PROP-TEST-1");
    });

    it("renders AFCA Extended LMS Components (UX-AFCA-004..008)", () => {
      const planHtml = renderLearningPlanHtml();
      expect(planHtml).toContain("UX-AFCA-004");
      expect(planHtml).toContain("Professional Cinematography Diploma");

      const subHtml = renderAssignmentSubmissionHtml();
      expect(subHtml).toContain("UX-AFCA-005");
      expect(subHtml).toContain("Submit Practical Media Assignment");

      const rubricHtml = renderFacultyGradingRubricHtml();
      expect(rubricHtml).toContain("UX-AFCA-006");
      expect(rubricHtml).toContain("Practical Assignment Grading");

      const certHtml = renderCertificateGeneratorHtml("LRN-2026-042");
      expect(certHtml).toContain("UX-AFCA-008");
      expect(certHtml).toContain("Certificate of Professional Competency");
    });

    it("SCR-18: renders the seven creative desks over engine snapshots with honest empty states", () => {
      const accHtml = renderTalentAcceleratorDeskHtml({ hubs: [], totalTalentCount: 0, verifiedTalentCount: 0, pipelineTalentCount: 0 });
      expect(accHtml).toContain("UX-ACC-001..008");
      expect(accHtml).toContain("Talent Accelerator Partner Network");
      expect(accHtml).toContain("renders canonical registry records only");

      const gldHtml = renderCommunityGuildsDeskHtml({ locations: [], resources: [], members: [], bookings: [] });
      expect(gldHtml).toContain("UX-AFC-001..006");
      expect(gldHtml).toContain("Afro-Fusion Guilds");

      const vtmHtml = renderVtmMatchingWorkbenchHtml(undefined, "OPP-2026-88");
      expect(vtmHtml).toContain("UX-VTM-003..007, 012");
      expect(vtmHtml).toContain("Talent Matching &amp; Protected Deployment");

      const oneHtml = renderOneStudiosProductionDeskHtml({ assets: [], bookings: [], callSheets: [] });
      expect(oneHtml).toContain("UX-ONE-001..009");
      expect(oneHtml).toContain("ONE Studios Production Command");

      const vcfHtml = renderVcfCreatorMissionsHtml({ pitches: [], activeSlate: [] });
      expect(vcfHtml).toContain("UX-VCF-001..008");
      expect(vcfHtml).toContain("VCF Creator Missions");

      const evtHtml = renderFusionEventsDeskHtml({ events: [] });
      expect(evtHtml).toContain("UX-EVT-001..008");
      expect(evtHtml).toContain("Fusion Events Stage Manager");

      const tendHtml = renderTendRightsDistributionHtml({ titles: [], licenses: [] });
      expect(tendHtml).toContain("UX-TEND-001..008");
      expect(tendHtml).toContain("TEND B2B Rights Catalogue");
    });

    it("SCR-18: renders populated engine snapshots with canonical records", () => {
      const accHtml = renderTalentAcceleratorDeskHtml({
        hubs: [{ id: "HUB-LOS-001", name: "Lagos Creative Hub (VMN Campus)", state: "Lagos", leadCoordinator: "Babatunde Adeleke", activeTalentCount: 350, isAccredited: true, facilitiesAvailable: ["Soundstage"] }],
        totalTalentCount: 10,
        verifiedTalentCount: 5,
        pipelineTalentCount: 3,
      });
      expect(accHtml).toContain("HUB-LOS-001");
      expect(accHtml).toContain("50% Verified");

      const evtHtml = renderFusionEventsDeskHtml({
        events: [
          { id: "EVT-1", name: "Afro-Fusion Live Showcase", category: "SHOWCASE", venueName: "Eko Convention Centre", venueCity: "Lagos", eventDate: "2026-10-10", doorsOpenTime: "18:00", capacity: 1200, totalSold: 486, totalCheckedIn: 120 },
        ],
      });
      expect(evtHtml).toContain("EVT-1");
      expect(evtHtml).toContain("120 / 486");

      const vtmHtml = renderVtmMatchingWorkbenchHtml(
        {
          brief: { id: "OPP-1", title: "Pan-African Commercial", roleCategory: "ACTING", requiredTier: "VERIFIED", locationCity: "Lagos", budgetPerDayNgn: 500000, buyoutTier: "REGIONAL_PAYTV" },
          matches: [{ talentId: "TAL-1", fullName: "Test Talent", matchScorePercent: 85, qualificationReasons: ["Primary skill match: ACTING"], dayRateNgn: 250000, tier: "VERIFIED", status: "VERIFIED" }],
        },
        "OPP-1"
      );
      expect(vtmHtml).toContain("Test Talent");
      expect(vtmHtml).toContain("85% Match");
    });

    it("SCR-18 tail: headspace renders real documents; cr8tech honest NOT_CONFIGURED; AOS renders registry", () => {
      const hspHtml = renderHeadspaceIntelligenceHtml({
        documents: [{ id: "DOC-NBC-CODE-01", title: "NBC Compliance Summary", category: "REGULATORY_CODE", confidentiality: "INTERNAL", tags: ["NBC"], authorId: "LEGAL-TEAM-01", updatedAt: "2026-09-30" }],
        totalDocuments: 1,
      });
      expect(hspHtml).toContain("UX-HSP-001..008");
      expect(hspHtml).toContain("Headspace Strategic Intelligence");
      expect(hspHtml).toContain("DOC-NBC-CODE-01");

      const cr8Html = renderCr8TechOperationsHtml([
        { name: "Azeebo+ Federation Bridge", configured: true, detail: "Circuit: CLOSED", state: "OPERATIONAL" },
        { name: "StarTimes Telemetry Ingest", configured: false, detail: "NOT_CONFIGURED", state: "NOT_CONFIGURED" },
      ]);
      expect(cr8Html).toContain("UX-CR8-001..008");
      expect(cr8Html).toContain("Cr8Tech DevOps Integration");
      expect(cr8Html).toContain("NOT_CONFIGURED");
      expect(cr8Html).not.toContain("https://telemetry.startimes.com");

      const agtHtml = renderAgenticOsConsoleHtml({
        agents: [{ id: "bot-001", name: "Broadcast Schedule Assistant", role: "SCHEDULE_OPTIMIZER", operationalScope: "Linear grid balancing", allowedTools: ["grid_query"], actionsPerformedToday: 0, maxDailyActions: 50, status: "ACTIVE", killSwitchEngaged: false }],
        pendingProposals: 0,
        auditTrail: [],
        globalKillSwitchEngaged: false,
      });
      expect(agtHtml).toContain("UX-AGT-001..009");
      expect(agtHtml).toContain("Agentic OS Autonomous AI Governance");
      expect(agtHtml).toContain("bot-001");
    });

    it("SCR-19: portals render canonical records and honest empty states", () => {
      const partHtml = renderPartnerPortalHtml({ partnerOrgId: "org-dangote", partnerName: "Dangote Group", deals: [] });
      expect(partHtml).toContain("UX-POR-003");
      expect(partHtml).toContain("Strategic Partner &amp; Broadcaster");
      expect(partHtml).toContain("never displays another counterparty");

      const crtHtml = renderCreatorPortalHtml({ creatorId: "CRT-2026-09", settlements: [] });
      expect(crtHtml).toContain("UX-POR-004");
      expect(crtHtml).toContain("Creator Earnings &amp; 7-Way Royalty");

      const vndHtml = renderVendorPortalHtml({ vendorId: "VND-2026-04", vendorName: "Acoustic Systems Nigeria Ltd", purchaseOrders: [] });
      expect(vndHtml).toContain("UX-POR-005");
      expect(vndHtml).toContain("Vendor Procurement &amp; Invoice");
      expect(vndHtml).toContain("DEC-RL1-SCOPE-001");

      const hubHtml = renderManagementOverviewHtml({
        broadcastChannels: 3,
        openBroadcastIncidents: 0,
        salesPipeline: { deals: 2, contractValueNgn: 1000000, cashCollectedNgn: 250000, recognizedRevenueNgn: 200000 },
        totalTalent: 10,
        verifiedTalent: 5,
        academyCertificates: 4,
      });
      expect(hubHtml).toContain("UX-HUB-004");
      expect(hubHtml).toContain("VMN Consolidated Management Overview");

      const rskHtml = renderRiskRegisterHtml({ risks: [] });
      expect(rskHtml).toContain("UX-REC-004");
      expect(rskHtml).toContain("Enterprise Risk Register");

      const issHtml = renderIssueTrackerHtml({ issues: [] });
      expect(issHtml).toContain("UX-REC-005");
      expect(issHtml).toContain("Operational Issue Tracker");
    });

    it("respects feature flag gating with accessible notice when flag is disabled", () => {
      setFeatureFlagOverride("FF_AGENTIC_OS_AUTOMATION", false, "Test Kill Switch");
      const disabledHtml = renderAgenticOsConsoleHtml(undefined);
      expect(disabledHtml).toContain("Currently Inactive");
      expect(disabledHtml).toContain("FF_AGENTIC_OS_AUTOMATION");
      resetAllFeatureFlagOverrides();
    });
  });

  describe("HTTP Routes & Workflows Integration", () => {
    it("GET /workspace/commercial/proposals/builder responds with 200 (empty store, honest)", async () => {
      const res = await makeRequest(testPort, "/workspace/commercial/proposals/builder");
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain("Commercial Proposal Builder");
    });

    it("GET /workspace/accelerator responds with 200 and seeded registry hubs", async () => {
      const res = await makeRequest(testPort, "/workspace/accelerator");
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain("Talent Accelerator Partner Network");
      expect(res.body).toContain("HUB-LOS-001");
    });

    it("GET /workspace/vtm/match responds with 200 (brief-missing honest state)", async () => {
      const res = await makeRequest(testPort, "/workspace/vtm/match");
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain("Talent Matching");
    });

    it("GET /workspace/production/desk responds with 200 and canonical seeded assets", async () => {
      const res = await makeRequest(testPort, "/workspace/production/desk");
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain("ONE Studios Production Command");
      expect(res.body).toContain("STG-MAIN-A");
    });

    it("GET /workspace/vcf/missions responds with 200", async () => {
      const res = await makeRequest(testPort, "/workspace/vcf/missions");
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain("VCF Creator Missions");
    });

    it("GET /workspace/events/desk responds with 200 (empty engine honest state)", async () => {
      const res = await makeRequest(testPort, "/workspace/events/desk");
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain("Fusion Events Stage Manager");
    });

    it("GET /workspace/tend/catalogue responds with 200", async () => {
      const res = await makeRequest(testPort, "/workspace/tend/catalogue");
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain("TEND B2B Rights Catalogue");
    });

    it("GET /workspace/headspace/intelligence responds with 200 and real seed documents", async () => {
      const res = await makeRequest(testPort, "/workspace/headspace/intelligence");
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain("Headspace Strategic Intelligence");
      expect(res.body).toContain("DOC-NBC-CODE-01");
    });

    it("GET /workspace/cr8tech/operations responds with 200 without invented endpoints", async () => {
      const res = await makeRequest(testPort, "/workspace/cr8tech/operations");
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain("Cr8Tech DevOps Integration");
      expect(res.body).toContain("NOT_CONFIGURED");
      expect(res.body).not.toContain("telemetry.startimes.com");
      expect(res.body).not.toContain("api.paystack.co");
    });

    it("GET /workspace/aos/console responds with 200 and the registered bot-001 agent", async () => {
      const res = await makeRequest(testPort, "/workspace/aos/console");
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain("Agentic OS Autonomous AI Governance");
      expect(res.body).toContain("bot-001");
    });

    it("blocks partner portfolio data until canonical organisation membership is connected", async () => {
      const anonymous = await makeRequest(testPort, "/portal/partner/ORG-PART-01");
      expect(anonymous.statusCode).toBe(401);
      const staff = await makeRequest(testPort, "/portal/partner/ORG-PART-01", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(staff.statusCode).toBe(503);
      expect(staff.body).toContain("ORGANISATION_RELATIONSHIP_UNAVAILABLE");
      expect(staff.body).not.toContain("totalContractValue");
    });

    it("blocks creator settlements until canonical beneficiary ownership is connected", async () => {
      const anonymous = await makeRequest(testPort, "/portal/creator/CRT-2026-09");
      expect(anonymous.statusCode).toBe(401);

      const staff = await makeRequest(testPort, "/portal/creator/CRT-2026-09", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(staff.statusCode).toBe(503);
      expect(staff.body).toContain("BENEFICIARY_RELATIONSHIP_UNAVAILABLE");
      expect(staff.body).not.toContain("Creator Earnings");
    });

    it("blocks vendor procurement until canonical counterparty ownership is connected", async () => {
      const anonymous = await makeRequest(testPort, "/portal/vendor/VND-2026-04");
      expect(anonymous.statusCode).toBe(401);

      const staff = await makeRequest(testPort, "/portal/vendor/VND-2026-04", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(staff.statusCode).toBe(503);
      expect(staff.body).toContain("COUNTERPARTY_RELATIONSHIP_UNAVAILABLE");
      expect(staff.body).not.toContain("Vendor Procurement");
    });

    it("GET /workspace/management/overview responds with 200 with computed figures", async () => {
      const res = await makeRequest(testPort, "/workspace/management/overview");
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain("VMN Consolidated Management Overview");
      expect(res.body).toContain("Linear Channels Under Management");
    });

    it("GET /workspace/governance/risks responds with 200", async () => {
      const res = await makeRequest(testPort, "/workspace/governance/risks");
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain("Enterprise Risk Register");
    });

    it("GET /workspace/governance/issues responds with 200", async () => {
      const res = await makeRequest(testPort, "/workspace/governance/issues");
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain("Operational Issue Tracker");
    });

    it("SCR-17: POST /api/v1/commercial/proposals creates canonical proposal + deal (auth required)", async () => {
      const unauth = await makeRequest(testPort, "/api/v1/commercial/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName: "MTN Nigeria", campaignTitle: "5G Rollout Flight" }),
      });
      expect(unauth.statusCode).toBe(401);

      const res = await makeRequest(testPort, "/api/v1/commercial/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}`, "x-test-role": "SuperAdmin" },
        body: JSON.stringify({
          clientName: "MTN Nigeria",
          clientOrgId: "org-mtn",
          campaignTitle: "5G Rollout Flight",
          items: [{ id: "i1", name: "Prime Spot", channel: "NXTR", daypart: "Prime", units: 10, ratePerUnitNgn: 500000, discountPercent: 5 }],
        }),
      });
      expect(res.statusCode).toBe(201);
      const parsed = JSON.parse(res.body);
      expect(parsed.status).toBe("SUCCESS");
      expect(parsed.dealId).toBeDefined();

      // Quote acceptance executes the canonical contract handoff.
      const accept = await makeRequest(testPort, `/api/v1/commercial/proposals/${parsed.proposalId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ salesLeadId: "usr-admin-ops", financeApproverId: "usr-finance-approver", signatoryName: "Group Commercial Director" }),
      });
      expect(accept.statusCode).toBe(200);
      const accepted = JSON.parse(accept.body);
      expect(accepted.dealStage).toBe("CONTRACT_SIGNED");

      // Double acceptance is rejected.
      const repeat = await makeRequest(testPort, `/api/v1/commercial/proposals/${parsed.proposalId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ salesLeadId: "usr-admin-ops", financeApproverId: "usr-finance-approver" }),
      });
      expect(repeat.statusCode).toBe(422);
    });

    it("SCR-18: POST /api/v1/workspace/accelerator/partners registers a canonical hub", async () => {
      const res = await makeRequest(testPort, "/api/v1/workspace/accelerator/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ name: "Jos Plateau Creative Collective", city: "Jos", state: "Plateau", leadCoordinator: "Test Lead", contactEmail: "jos@example.com" }),
      });
      expect(res.statusCode).toBe(201);
      const parsed = JSON.parse(res.body);
      expect(parsed.status).toBe("SUCCESS");
      const desk = await makeRequest(testPort, "/workspace/accelerator");
      expect(desk.body).toContain(parsed.hubId);
    });

    it("SCR-18: POST /api/v1/workspace/events/scan rejects an unknown ticket truthfully", async () => {
      const res = await makeRequest(testPort, "/api/v1/workspace/events/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ eventId: "EVT-NONE", ticketCode: "FUS-89K2-XQ" }),
      });
      expect(res.statusCode).toBe(422);
      const parsed = JSON.parse(res.body);
      expect(parsed.verified).toBe(false);
    });

    it("SCR-19: risk + issue lifecycle works end-to-end through guarded routes", async () => {
      const unauth = await makeRequest(testPort, "/api/v1/workspace/governance/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "x" }),
      });
      expect(unauth.statusCode).toBe(401);

      const risk = await makeRequest(testPort, "/api/v1/workspace/governance/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ id: "RSK-SCR19-1", title: "Rain fade on primary uplink", category: "BROADCAST_TRANSMISSION", likelihood: 3, impact: 4, mitigation: "Fibre failover", owner: "MCR Chief Engineer", reviewDueAt: "2026-12-01" }),
      });
      expect(risk.statusCode).toBe(201);

      const register = await makeRequest(testPort, "/workspace/governance/risks");
      expect(register.body).toContain("RSK-SCR19-1");

      const issue = await makeRequest(testPort, "/api/v1/workspace/governance/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ id: "ISSUE-SCR19-1", title: "Audio crackle on feed", description: "Intermittent", severity: "S1", linkedRiskId: "RSK-SCR19-1" }),
      });
      expect(issue.statusCode).toBe(201);

      const tracker = await makeRequest(testPort, "/workspace/governance/issues");
      expect(tracker.body).toContain("ISSUE-SCR19-1");

      const t1 = await makeRequest(testPort, "/api/v1/workspace/governance/issues/ISSUE-SCR19-1/transition", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ target: "ACKNOWLEDGED" }),
      });
      expect(t1.statusCode).toBe(200);

      // Domain forbids skipping lifecycle steps.
      const skip = await makeRequest(testPort, "/api/v1/workspace/governance/issues/ISSUE-SCR19-1/transition", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ target: "RESOLVED" }),
      });
      expect(skip.statusCode).toBe(422);

      const t2 = await makeRequest(testPort, "/api/v1/workspace/governance/issues/ISSUE-SCR19-1/transition", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ target: "FIX_IN_PROGRESS" }),
      });
      expect(t2.statusCode).toBe(200);
    });

    it("SCR-18: POST /api/v1/workspace/cr8tech/test-all is retired with 410", async () => {
      const res = await makeRequest(testPort, "/api/v1/workspace/cr8tech/test-all", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({}),
      });
      expect(res.statusCode).toBe(410);
    });
  });
});
