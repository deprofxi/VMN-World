import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import fs from "node:fs";
import { createApiServer, ApiServerInstance } from "../../src/api/server.js";
import { signSessionToken } from "../../src/core/auth/index.js";
import {
  renderClientProjectsListHtml,
  renderClientProjectDetailHtml,
  projectClientPortfolio,
  toClientProject,
  statusFromStage,
} from "../../src/web/portal/client-portal.js";
import * as clientPortalModule from "../../src/web/portal/client-portal.js";
import { QuoteToCashSalesEngine, SalesDeal } from "../../src/modules/finance/sales/index.js";
import {
  renderInvitationAcceptanceHtml,
  renderFirstUseProfileHtml,
  renderSessionExpiredHtml,
  renderNotificationPreferencesHtml,
  renderActiveSessionsHtml,
  renderContextualHelpHtml,
} from "../../src/web/public/auth-screens.js";
import {
  renderBroadcastScheduleReviewHtml,
  renderRightsReviewRequestHtml,
  renderPoaExceptionsWorkbenchHtml,
  renderContentReviewAndPublicationHtml,
  renderApprovalReviewHtml,
} from "../../src/web/workspace/governance-and-operations.js";
import { checkDatabaseConnection, getPrismaClient } from "../../src/core/database/index.js";
import { persistApprovalItem } from "../../src/core/database/repositories/release-critical.repository.js";

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

describe("Client Portal (J-RL1-07), UX-SYS Onboarding & Operational Workbenches (J-RL1-08 to 14)", () => {
  let app: ApiServerInstance;
  const testPort = 4219;
  const operatorUser = {
    userId: "usr-mcr-supervisor",
    personId: "per-mcr-supervisor",
    email: "mcr@vmnl.ng",
    roles: ["MCRSupervisor" as const],
  };
  let authToken: string;

  /**
   * UX-GOV-002 decides the seeded `APV-2026-004` through the durable approval
   * route (TSK-17), so that decision is a real row and boot hydration would
   * reload it as already-decided on the next run. Both demo queue rows are
   * `APPROVAL_SEEDED_IDS` fixtures, so the file resets them around its own
   * server: before boot hydration, and again after the journal flush on stop.
   *
   * Same reason for the CMS demo item: `ensureContentDemoSeed()` skips when the
   * id already exists, and the publish journey writes `CNT-LAGOS-201` as
   * PUBLISHED durably. Without this reset the second run of the file hydrates a
   * PUBLISHED revision and the publication assertion fails on dirty state, not
   * on behaviour.
   */
  async function resetDurableDemoFixtures(): Promise<void> {
    const db = await checkDatabaseConnection();
    if (!db.connected) return;
    const prisma = getPrismaClient();
    await prisma.approvalItem.deleteMany({
      where: { id: { in: ["APV-2026-004", "APV-2026-009"] } },
    });
    await prisma.contentRevisionRecord.deleteMany({ where: { contentId: "CNT-LAGOS-201" } });
    await prisma.contentItemRecord.deleteMany({ where: { id: "CNT-LAGOS-201" } });
    // TSK-60 box 3: the leak probe's deal is a durable row now, so an interrupted
    // run that never reached `afterAll` would leave it behind and the next POST
    // would be refused as a duplicate id instead of exercising the portal gate.
    await prisma.salesDealRecord.deleteMany({
      where: { id: { startsWith: "DEAL-TSK13-LEAKPROBE" } },
    });
  }

  /**
   * `ensureApprovalDemoSeed()` fills the queue only when it is **empty**, so any
   * durable approval left behind by another run — a interrupted suite leaves its
   * `APV-<run>-FIN` probe row — keeps this file's fixture out of the page. The
   * two demo rows are therefore written here through the same durable writer the
   * journal drains, and boot hydration finds them whether or not the queue
   * already holds other rows. The behaviour under test (the desk renders the
   * live queue and a decision is a row) is unchanged; only the fixture's
   * dependence on global emptiness is removed.
   */
  async function seedDurableDemoApprovals(): Promise<void> {
    const db = await checkDatabaseConnection();
    if (!db.connected) return;
    const now = new Date();
    const fixtures = [
      {
        id: "APV-2026-004",
        category: "RATE_CARD_OVERRIDE" as const,
        subject: "Prime Time 15% Volume Discount",
        justification: "Dangote Q3 2026 Industrial Campaign",
        financialScopeNgn: 45_000_000,
        initiatorId: "usr-chidinma-nwosu",
        initiatorName: "Chidinma Nwosu (Commercial)",
        objectRevision: 3,
      },
      {
        id: "APV-2026-009",
        category: "AFCA_MILESTONE" as const,
        subject: "Milestone 2 Studio Build Disbursement",
        justification: "Creative Economy Media Hub Yaba",
        financialScopeNgn: 18_500_000,
        initiatorId: "usr-adebayo-adeleke",
        initiatorName: "Adebayo Adeleke (AFCA Dean)",
        objectRevision: 1,
      },
    ];
    for (const fixture of fixtures) {
      await persistApprovalItem({
        ...fixture,
        currency: "NGN",
        requiresFourEyes: true,
        status: "PENDING",
        createdAt: now,
      });
    }
  }

  beforeAll(async () => {
    await resetDurableDemoFixtures();
    await seedDurableDemoApprovals();
    authToken = signSessionToken(operatorUser).accessToken;
    app = createApiServer(testPort, {
      NODE_ENV: "test",
      AUTH_BYPASS_ENABLED: "false",
    });
    await app.start();
  });

  afterAll(async () => {
    await app.stop();
    await resetDurableDemoFixtures();
  });

  describe("S-CLIENT Counterparty Portal (UX-PRJ-002, UX-COM-010, UX-POR-002)", () => {
    /**
     * TSK-13: the portal's fixture is a canonical deal advanced through the
     * engine's own invariants (dual sign-off → deposit → invoice → cash), not a
     * literal someone could quietly edit. The second organisation's deal exists
     * only to prove scoping filters it out of the first one's page.
     */
    function canonicalDeals(): SalesDeal[] {
      const engine = new QuoteToCashSalesEngine();
      const dangote = engine.createDeal({
        id: "DEAL-TSK13-DAG",
        clientOrgId: "org-dangote",
        dealName: "Q3 2026 Pan-African Industrial Awareness Campaign",
        totalContractValueNgn: 45_000_000,
        salesLeadId: "COMM-DAG-8842",
      });
      engine.signContract({
        dealId: dangote.id,
        salesLeadId: "usr-chidinma-nwosu",
        financeApproverId: "usr-adebayo-adeleke",
      });
      engine.recordDeposit(dangote.id, 9_000_000);
      engine.generateInvoice(dangote.id, "https://proof.vmnl.ng/DEAL-TSK13-DAG.pdf", 45_000_000);
      engine.recordCashPayment(dangote.id, 9_000_000);
      engine.createDeal({
        id: "DEAL-TSK13-OTH",
        clientOrgId: "org-separate-client",
        dealName: "Separate Client Fertiliser Flight",
        totalContractValueNgn: 7_500_000,
        salesLeadId: "COMM-OTH-1001",
      });
      return engine.listDeals();
    }

    it("renders the portfolio from canonical deals scoped to the caller's organisation", () => {
      const projects = projectClientPortfolio(canonicalDeals(), "org-dangote");
      expect(projects.map((p) => p.id)).toEqual(["DEAL-TSK13-DAG"]);

      const html = renderClientProjectsListHtml("org-dangote", projects);
      expect(html).toContain("Q3 2026 Pan-African Industrial Awareness Campaign");
      expect(html).toContain("COMM-DAG-8842");
      expect(html).toContain("45,000,000");
      // The engine's own arithmetic: a ₦9m deposit and a ₦9m payment are both
      // cash, so the portfolio shows the deal's collected total, not a label.
      expect(html).toContain("18,000,000");
      expect(html).toContain("IN_RECONCILIATION");
      // TSK-60 box 3: provenance names the durable store the rows come from, not
      // only the in-process engine that projects them.
      expect(html).toContain(
        "SOURCE: SalesDealRecord (durable, Postgres) hydrated into QuoteToCashSalesEngine.listDeals()"
      );
      expect(html).not.toContain("Separate Client Fertiliser Flight");
      expect(html).not.toContain("DEAL-TSK13-OTH");
    });

    it("renders an honest empty portfolio instead of records from somewhere else", () => {
      const html = renderClientProjectsListHtml(
        "org-no-deals",
        projectClientPortfolio(canonicalDeals(), "org-no-deals")
      );
      expect(html).toContain("No canonical deal exists for organisation <code>org-no-deals</code>");
      expect(html).not.toContain("Q3 2026 Pan-African");
    });

    it("renders only what the canonical deal carries and states NOT CONNECTED where it carries nothing", () => {
      const deal = canonicalDeals().find((d) => d.id === "DEAL-TSK13-DAG");
      expect(deal).toBeDefined();
      const project = toClientProject(deal as SalesDeal);
      expect(project.proofOfPerformanceVerified).toBe(true);

      const html = renderClientProjectDetailHtml(project);
      expect(html).toContain("UX-PRJ-002");
      expect(html).toContain("SOURCE: SalesDealRecord (durable, Postgres)");
      expect(html).toContain("UX-COM-010");
      expect(html).toContain("UX-POR-002");
      expect(html).toContain("Open proof document");
      expect(html).toContain("NOT CONNECTED");
      expect(html).toContain("Submit Inquiry or Discrepancy Notice");
      // The fabricated transmission evidence the deleted fixture shipped with
      // must not return, in any form, on a counterparty surface.
      for (const fabricated of [
        "CERT-TX-2026-09228",
        "Cryptographic Playout Hash",
        "Eutelsat 16A Ku-Band DTT Downlink",
        "PRJ-VMN-2026-088",
      ]) {
        expect(html).not.toContain(fabricated);
      }
    });

    it("derives the portal status from the canonical stage, never a stored label", () => {
      expect(statusFromStage("PROPOSAL")).toBe("ACTIVE");
      expect(statusFromStage("OPERATIONAL_DELIVERY")).toBe("ACTIVE");
      expect(statusFromStage("INVOICED")).toBe("IN_RECONCILIATION");
      expect(statusFromStage("CASH_COLLECTED")).toBe("IN_RECONCILIATION");
      expect(statusFromStage("REVENUE_RECOGNIZED")).toBe("COMPLETED");
    });

    it("keeps the client-portal mock registry deleted (TSK-13 guard)", () => {
      const portal = fs.readFileSync(new URL("../../src/web/portal/client-portal.ts", import.meta.url), "utf8");
      const router = fs.readFileSync(new URL("../../src/api/router.ts", import.meta.url), "utf8");
      expect(Object.keys(clientPortalModule).filter((k) => k.startsWith("MOCK_"))).toEqual([]);
      expect(portal).not.toMatch(/^\s*export const MOCK_/m);
      expect(portal).not.toMatch(/^\s*const MOCK_/m);
      expect(router).not.toContain("MOCK_CLIENT_PROJECTS");
    });

    it("requires a verified canonical relationship and returns 401/403 for missing or guessed membership", async () => {
      const anonymous = await makeRequest(testPort, "/portal/client/organisations/org-dangote/projects");
      expect(anonymous.statusCode).toBe(401);
      const domainGuess = await makeRequest(testPort, "/portal/client/organisations/org-dangote/projects", {
        headers: { "x-test-role": "AcademyLearner" },
      });
      expect(domainGuess.statusCode).toBe(403);
      expect(domainGuess.body).not.toContain("COMM-DAG-8842");

      const token = signSessionToken({ userId: "usr-domain-guess", personId: "per-domain-guess", email: "audit@dangote.com", roles: ["AcademyLearner"] }).accessToken;
      const emailDomainGuess = await makeRequest(testPort, "/portal/client/organisations/org-dangote/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(emailDomainGuess.statusCode).toBe(403);
    });

    it("fails closed for staff until canonical client membership is available", async () => {
      const res = await makeRequest(testPort, "/portal/client/organisations/org-dangote/projects", {
        headers: { "x-test-role": "ExecutiveLeader" },
      });
      expect(res.statusCode).toBe(503);
      expect(res.body).toContain("ORGANISATION_RELATIONSHIP_UNAVAILABLE");
      expect(res.body).not.toContain("COMM-DAG-8842");
    });

    it("fails closed for client project details until canonical membership is available", async () => {
      const res = await makeRequest(
        testPort,
        "/portal/client/organisations/org-dangote/projects/PRJ-VMN-2026-088",
        { headers: { "x-test-role": "ExecutiveLeader" } }
      );
      expect(res.statusCode).toBe(503);
      expect(res.body).toContain("ORGANISATION_RELATIONSHIP_UNAVAILABLE");
      expect(res.body).not.toContain("CERT-TX-2026-09228");
    });

    /**
     * TSK-13 replaces the old fixture-shaped leak probe with a real one: the
     * deal below is a canonical record in the running engine, so a portal that
     * leaked would leak actual money, not a sample string. The gate is what
     * keeps it closed, and this test is what keeps the gate honest.
     */
    it("keeps a real canonical deal out of the portal until membership is verified", async () => {
      const created = await makeRequest(testPort, "/api/v1/finance/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-test-role": "SuperAdmin" },
        body: JSON.stringify({
          id: "DEAL-TSK13-LEAKPROBE",
          clientOrgId: "org-dangote",
          dealName: "Canonical deal written for the portal leak probe",
          totalContractValueNgn: 12345678,
          salesLeadId: "COMM-LEAK-PROBE",
        }),
      });
      expect(created.statusCode).toBe(201);

      const asOutsider = await makeRequest(testPort, "/portal/client/organisations/org-dangote/projects", {
        headers: { "x-test-role": "AcademyLearner" },
      });
      expect(asOutsider.statusCode).toBe(403);
      expect(asOutsider.body).not.toContain("COMM-LEAK-PROBE");
      expect(asOutsider.body).not.toContain("Canonical deal written for the portal leak probe");
      expect(asOutsider.body).not.toContain("DEAL-TSK13-LEAKPROBE");

      const asStaff = await makeRequest(testPort, "/portal/client/organisations/org-dangote/projects", {
        headers: { "x-test-role": "ExecutiveLeader" },
      });
      expect(asStaff.statusCode).toBe(503);
      expect(asStaff.body).not.toContain("COMM-LEAK-PROBE");
      expect(asStaff.body).not.toContain("12,345,678");

      const asDetail = await makeRequest(
        testPort,
        "/portal/client/organisations/org-dangote/projects/DEAL-TSK13-LEAKPROBE",
        { headers: { "x-test-role": "ExecutiveLeader" } }
      );
      expect(asDetail.statusCode).toBe(503);
      expect(asDetail.body).not.toContain("Canonical deal written for the portal leak probe");
    });

    it("blocks cross-org portal access without a client relationship (TODO-SEC-07)", async () => {
      const competitor = await makeRequest(testPort, "/portal/client/organisations/org-mtn-ng/projects", {
        headers: { "x-test-role": "AcademyLearner" },
      });
      expect(competitor.statusCode).toBe(403);

      const anonymous = await makeRequest(testPort, "/portal/client/organisations/org-dangote/projects");
      expect(anonymous.statusCode).toBe(401);
      expect(anonymous.body).not.toContain("COMM-DAG-8842");
    });

    it("accepts client discrepancy inquiry via POST /api/v1/client/projects/:projectId/questions", async () => {
      const payload = JSON.stringify({
        topic: "MAKE_GOOD_DISCREPANCY",
        priority: "URGENT",
        contactEmail: "audit@dangote.com",
        message: "Requesting schedule confirmation for make-good slot on Friday news.",
      });

      const anonymous = await makeRequest(testPort, "/api/v1/client/projects/PRJ-VMN-2026-088/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
      expect(anonymous.statusCode).toBe(401);

      const res = await makeRequest(testPort, "/api/v1/client/projects/PRJ-VMN-2026-088/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-test-role": "SuperAdmin" },
        body: payload,
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.status).toBe("SUCCESS");
      expect(json.ticketId).toMatch(/^INQ-2026-\d+$/);
    });
  });

  describe("Remaining UX-SYS Screens (UX-SYS-004, 005, 007, 012, 013, 014)", () => {
    it("renders Invitation Acceptance (UX-SYS-004) and handles GET /auth/invitation", async () => {
      const html = renderInvitationAcceptanceHtml("INV-TEST-999", "new.operator@vmnl.ng");
      expect(html).toContain("UX-SYS-004");
      expect(html).toContain("INV-TEST-999");
      expect(html).toContain("new.operator@vmnl.ng");

      const res = await makeRequest(testPort, "/auth/invitation?token=INV-TEST-999&email=new.operator@vmnl.ng");
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain("Accept Enterprise Invitation");
    });

    it("renders First-Use Profile Review (UX-SYS-005) and handles GET /auth/profile-setup", async () => {
      const html = renderFirstUseProfileHtml(operatorUser);
      expect(html).toContain("UX-SYS-005");
      expect(html).toContain("Africa/Lagos");
      expect(html).toContain("Emergency MCR Duty Phone");

      const res = await makeRequest(testPort, "/auth/profile-setup");
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain("First-Use Profile");
    });

    it("renders Session Expired / Resume (UX-SYS-007) and handles GET /auth/session-expired", async () => {
      const html = renderSessionExpiredHtml("/broadcast/dashboard");
      expect(html).toContain("UX-SYS-007");
      expect(html).toContain("Sign In to Resume Session");

      const res = await makeRequest(testPort, "/auth/session-expired?returnUrl=/broadcast/dashboard");
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain("Operational Session Expired");
    });

    it("renders Notification Preferences (UX-SYS-012) and handles GET /account/notifications", async () => {
      const html = renderNotificationPreferencesHtml(operatorUser);
      expect(html).toContain("UX-SYS-012");
      expect(html).toContain("Playout Disruption &amp; Dead-Air Failures");

      const res = await makeRequest(testPort, "/account/notifications", {
        headers: { Cookie: `vmnl_session=${authToken}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain("Notification &amp; Escalation Preferences");
    });

    it("renders Active Sessions (UX-SYS-013) and handles GET /account/sessions", async () => {
      const html = renderActiveSessionsHtml(operatorUser);
      expect(html).toContain("UX-SYS-013");
      expect(html).toContain("Active Workstation Sessions");
      expect(html).toContain("Current Workstation");

      const res = await makeRequest(testPort, "/account/sessions", {
        headers: { Cookie: `vmnl_session=${authToken}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain("Active Workstation Sessions");
    });

    it("renders Contextual Operator Help & SOPs (UX-SYS-014) and handles GET /help/operator", async () => {
      const html = renderContextualHelpHtml("rights");
      expect(html).toContain("UX-SYS-014");
      expect(html).toContain("SOP-BCST-002: Broadcast Rights Clearance");

      const res = await makeRequest(testPort, "/help/operator?topic=rights");
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain("SOP-BCST-002");
    });
  });

  describe("Broadcast Operational Workbenches (J-RL1-08 to J-RL1-14)", () => {
    it("renders Broadcast Schedule Review (UX-BR-012) with rights blocker explanation", async () => {
      const html = renderBroadcastScheduleReviewHtml({ hasBlocker: true });
      expect(html).toContain("UX-BR-012");
      expect(html).toContain("CRITICAL RIGHTS BLOCKER");
      expect(html).toContain("Urban Sound Showcase #4102");
      expect(html).toContain("StarTimes Carriage Clearance");

      const res = await makeRequest(testPort, "/broadcast/schedule/review", {
        headers: { Cookie: `vmnl_session=${authToken}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain("Broadcast Master Schedule Review");
    });

    it("renders Rights Review Request (UX-GOV-004) and handles POST /api/v1/broadcast/rights/review-requests", async () => {
      const html = renderRightsReviewRequestHtml({ slotId: "SLOT-4102" });
      expect(html).toContain("UX-GOV-004");
      expect(html).toContain("SLOT-4102");
      // TSK-14: the desk collects what the workflow requires and never presents
      // itself as a waiver — opening a request leaves the rights block intact.
      for (const field of ["rightsRecordId", "intendedUse", "observedBlocker", "receivingOwner"]) {
        expect(html).toContain(`name="${field}"`);
      }
      expect(html).not.toMatch(/waiver/i);

      const anonymousPost = await makeRequest(testPort, "/api/v1/broadcast/rights/review-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: "SLOT-4102", justification: "Signed addendum." }),
      });
      expect(anonymousPost.statusCode).toBe(401);

      const wrongRole = await makeRequest(testPort, "/api/v1/broadcast/rights/review-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-test-role": "PlayoutOperator" },
        body: JSON.stringify({ slotId: "SLOT-4102", justification: "Signed addendum." }),
      });
      expect(wrongRole.statusCode).toBe(403);

      const postRes = await makeRequest(testPort, "/api/v1/broadcast/rights/review-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-test-role": "RightsManager" },
        body: JSON.stringify({
          slotId: "SLOT-4102",
          carrier: "STARTIMES_DTT",
          distributor: "Afro-Beat Media Global",
          justification: "Signed addendum extends window through October 2026.",
          rightsRecordId: "RGT-UX-GOV-004",
          intendedUse: "Linear transmission on NXTR, 20:30-21:45 WAT",
          observedBlocker: "POST_EXPIRY_DATE — slot finishes after the recorded rights expiry",
          receivingOwner: "Broadcast Rights Coordinator",
        }),
      });
      expect(postRes.statusCode).toBe(200);
      const json = JSON.parse(postRes.body);
      expect(json.status).toBe("SUCCESS");
      expect(json.ticketId).toMatch(/^RW-2026-\d+$/);
      // TSK-14: the ticket is now a workflow record, not a floating number.
      expect(json.requestId).toMatch(/^rrr-/);
      expect(json.affectedRecordId).toBe("RGT-UX-GOV-004");
      expect(json.requestStatus).toBe("RECEIVED");
      expect(json.rightsBlockIntact).toBe(true);

      // A request that does not name the record it concerns is rejected, not
      // silently accepted as a tracking number (UIUX-001 §2.2 R09).
      const incomplete = await makeRequest(testPort, "/api/v1/broadcast/rights/review-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-test-role": "RightsManager" },
        body: JSON.stringify({ slotId: "SLOT-4102", justification: "Signed addendum." }),
      });
      expect(incomplete.statusCode).toBe(400);
      expect(JSON.parse(incomplete.body).code).toBe("RRR-07");
    });

    it("renders Proof-of-Air Exceptions Workbench (UX-BR-030 / UX-GOV-006) and handles resolve POST", async () => {
      // TSK-16: the desk is engine-backed — no canned rows. Raise a real delivery
      // discrepancy through the reconcile route so the workbench has data to show.
      const now = new Date();
      const reconcileRes = await makeRequest(testPort, "/api/v1/broadcast/asrun/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-test-role": "BroadcastDirector" },
        body: JSON.stringify({
          channelCode: "NXTR",
          asRunItems: [
            { spotId: "SPT-CLIP-01", clientName: "Dangote Group", campaignId: "CMP-DAG-2026", actualStartTime: now.toISOString(), actualDurationSeconds: 22, expectedDurationSeconds: 30, status: "AIRED_PARTIAL" },
          ],
        }),
      });
      expect(reconcileRes.statusCode).toBe(200);
      const reconcileJson = JSON.parse(reconcileRes.body);
      expect(reconcileJson.report.totalDiscrepancies).toBeGreaterThanOrEqual(1);

      const html = renderPoaExceptionsWorkbenchHtml();
      expect(html).toContain("UX-BR-030");
      expect(html).toContain("EXP-CMP-DAG-2026-SPT-CLIP-01");
      expect(html).toContain("UNDER_DELIVERY_TIME");
      expect(html).toContain("-8s owed");

      const anonymousResolve = await makeRequest(
        testPort,
        "/api/v1/broadcast/asrun/exceptions/EXP-CMP-DAG-2026-SPT-CLIP-01/resolve",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resolutionType: "APPROVE_MAKE_GOOD", targetBreakId: "BRK-NIGHT-01" }),
        }
      );
      expect(anonymousResolve.statusCode).toBe(401);

      // Without creative identity the traffic engine refuses rebooking ([MG-03]);
      // the desk must report the refusal rather than pretend success.
      const resolveRes = await makeRequest(
        testPort,
        "/api/v1/broadcast/asrun/exceptions/EXP-CMP-DAG-2026-SPT-CLIP-01/resolve",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-test-role": "BroadcastDirector" },
          body: JSON.stringify({ resolutionType: "APPROVE_MAKE_GOOD", targetBreakId: "BRK-NIGHT-01" }),
        }
      );
      expect(resolveRes.statusCode).toBe(400);
      expect(JSON.parse(resolveRes.body).code).toMatch(/MG-03/);

      // TSK-33: the credit remedy is the other half of FIN-07. Through this route
      // it must reach a real ledger instance and name the journal entry it posted.
      const creditRes = await makeRequest(
        testPort,
        "/api/v1/broadcast/asrun/exceptions/EXP-CMP-DAG-2026-SPT-CLIP-01/resolve",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-test-role": "BroadcastDirector" },
          body: JSON.stringify({ resolutionType: "ISSUE_CREDIT_NOTE" }),
        }
      );
      expect(creditRes.statusCode).toBe(200);
      const creditJson = JSON.parse(creditRes.body);
      expect(creditJson.outcome).toBe("CREDIT_NOTE_ISSUED");
      expect(creditJson.creditNoteId).toBe("CN-CMP-DAG-2026-SPT-CLIP-01");
      expect(creditJson.journalEntryId).toBe("CREDIT:CN-CMP-DAG-2026-SPT-CLIP-01");
      expect(app.context.ledgerService!.getLedger().getEntries().map((e) => e.id)).toContain(
        "CREDIT:CN-CMP-DAG-2026-SPT-CLIP-01"
      );

      const banner = renderPoaExceptionsWorkbenchHtml({ resolvedId: "EXP-CMP-DAG-2026-SPT-CLIP-01" });
      expect(banner).toContain("Posted to the seven-way ledger as journal entry");
    });

    it("renders Content Review & Publication (UX-CMS-001..008) and handles publish POST", async () => {
      const html = renderContentReviewAndPublicationHtml();
      expect(html).toContain("UX-CMS-001..008");
      expect(html).toContain("Lagos Noir");

      // TODO-SCR-01/02 regression: publication now runs the real revision
      // domain — the seeded demo item is APPROVED and the publisher differs
      // from its author, so the publish succeeds and names the actor.
      const pubRes = await makeRequest(testPort, "/api/v1/workspace/content/CNT-LAGOS-201/publish", {
        method: "POST",
        headers: { "x-test-role": "SuperAdmin" },
      });
      expect(pubRes.statusCode).toBe(200);
      const json = JSON.parse(pubRes.body);
      expect(json.status).toBe("SUCCESS");
      expect(json.published).toBe(true);
      expect(json.revision).toBeGreaterThan(0);
    });

    it("refuses publication of unapproved content (TODO-SCR-02)", async () => {
      const rejected = await makeRequest(testPort, "/api/v1/workspace/content/CNT-LAGOS-201/publish", {
        method: "POST",
        headers: { "x-test-role": "SuperAdmin" },
      });
      // First publish succeeded above; the item is now PUBLISHED, so a second
      // publish attempt must be refused (only APPROVED revisions publish).
      expect(rejected.statusCode).toBe(422);
      expect(JSON.parse(rejected.body).code).toBe("CMS-08");
    });

    it("renders Governance Approval Review (UX-GOV-001/002) and handles decide POST", async () => {
      const html = renderApprovalReviewHtml(operatorUser);
      expect(html).toContain("UX-GOV-001/002");
      expect(html).toContain("APV-2026-004");
      expect(html).toContain("RATE_CARD_OVERRIDE");

      // TODO-SCR-06: the decide endpoint now enforces the real four-eyes
      // domain (server-side authority recheck). A RATE_CARD_OVERRIDE decision
      // requires an authorised role (SuperAdmin/Exec/Finance/Traffic) and —
      // per separation of duties — cannot be made by the initiator.
      const decideRes = await makeRequest(
        testPort,
        "/api/v1/workspace/approvals/APV-2026-004/decide",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-test-role": "SuperAdmin",
          },
          body: JSON.stringify({ decision: "APPROVED", reason: "Reviewed against revision 3; commercial authority confirmed." }),
        }
      );
      expect(decideRes.statusCode).toBe(200);
      const json = JSON.parse(decideRes.body);
      expect(json.status).toBe("SUCCESS");
      expect(json.decision).toBe("APPROVED");
    });

    it("rejects approval decisions that violate the four-eyes domain (TODO-SCR-06)", async () => {
      // Authority recheck: MCRSupervisor is not authorised for RATE_CARD_OVERRIDE.
      const forbidden = await makeRequest(
        testPort,
        "/api/v1/workspace/approvals/APV-2026-009/decide",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-test-role": "MCRSupervisor" },
          body: JSON.stringify({ decision: "APPROVED", reason: "Not my authority." }),
        }
      );
      expect(forbidden.statusCode).toBe(403);
      expect(JSON.parse(forbidden.body).code).toBe("APR_FORBIDDEN");

      // Reason mandatory.
      const noReason = await makeRequest(
        testPort,
        "/api/v1/workspace/approvals/APV-2026-009/decide",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-test-role": "SuperAdmin" },
          body: JSON.stringify({ decision: "APPROVED", reason: "" }),
        }
      );
      expect(noReason.statusCode).toBe(422);
      expect(JSON.parse(noReason.body).code).toBe("APR_REASON_REQUIRED");
    });
  });
});
