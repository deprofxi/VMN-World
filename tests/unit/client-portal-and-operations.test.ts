import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import { createApiServer, ApiServerInstance } from "../../src/api/server.js";
import { signSessionToken } from "../../src/core/auth/index.js";
import {
  renderClientProjectsListHtml,
  renderClientProjectDetailHtml,
  MOCK_CLIENT_PROJECTS,
} from "../../src/web/portal/client-portal.js";
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

  beforeAll(async () => {
    authToken = signSessionToken(operatorUser).accessToken;
    app = createApiServer(testPort, {
      NODE_ENV: "test",
      AUTH_BYPASS_ENABLED: "false",
    });
    await app.start();
  });

  afterAll(async () => {
    await app.stop();
  });

  describe("S-CLIENT Counterparty Portal (UX-PRJ-002, UX-COM-010, UX-POR-002)", () => {
    it("renders client projects list HTML accurately with approved scope and status", () => {
      const html = renderClientProjectsListHtml("org-dangote", Object.values(MOCK_CLIENT_PROJECTS));
      expect(html).toContain("Dangote Group Holdings");
      expect(html).toContain("Q3 2026 Pan-African Industrial Awareness Campaign");
      expect(html).toContain("COMM-DAG-8842");
      expect(html).toContain("ACTIVE");
      expect(html).toContain("45,000,000");
    });

    it("renders client project detail HTML with commitments table and released proof reports", () => {
      const project = MOCK_CLIENT_PROJECTS["PRJ-VMN-2026-088"];
      const html = renderClientProjectDetailHtml(project);
      expect(html).toContain("Q3 2026 Pan-African Industrial Awareness Campaign");
      expect(html).toContain("UX-PRJ-002");
      expect(html).toContain("UX-COM-010");
      expect(html).toContain("UX-POR-002");
      expect(html).toContain("CERT-TX-2026-09228");
      expect(html).toContain("Eutelsat 16A Ku-Band DTT Downlink");
      expect(html).toContain("Cryptographic Playout Hash");
      expect(html).toContain("Submit Inquiry or Discrepancy Notice");
    });

    it("serves GET /portal/client/organisations/:orgId/projects with 200 OK", async () => {
      // TODO-SEC-07 regression context: portal surfaces require a session with
      // an organisation relationship; unauthenticated/cross-org access no
      // longer renders portfolio data (see tests/security below).
      const res = await makeRequest(testPort, "/portal/client/organisations/org-dangote/projects", {
        headers: { "x-test-role": "ExecutiveLeader" },
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain("Dangote Group Holdings");
      expect(res.body).toContain("COMM-DAG-8842");
    });

    it("serves GET /portal/client/organisations/:orgId/projects/:projectId with 200 OK", async () => {
      const res = await makeRequest(
        testPort,
        "/portal/client/organisations/org-dangote/projects/PRJ-VMN-2026-088",
        {
          headers: { "x-test-role": "ExecutiveLeader" },
        }
      );
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain("Dangote Group Holdings");
      expect(res.body).toContain("CERT-TX-2026-09228");
    });

    it("blocks cross-org portal access without a client relationship (TODO-SEC-07)", async () => {
      const competitor = await makeRequest(testPort, "/portal/client/organisations/org-mtn-ng/projects", {
        headers: { "x-test-role": "AcademyLearner" },
      });
      expect(competitor.statusCode).toBe(403);

      const anonymous = await makeRequest(testPort, "/portal/client/organisations/org-dangote/projects");
      expect(anonymous.statusCode).toBe(200);
      expect(anonymous.body).not.toContain("COMM-DAG-8842");
    });

    it("accepts client discrepancy inquiry via POST /api/v1/client/projects/:projectId/questions", async () => {
      const payload = JSON.stringify({
        topic: "MAKE_GOOD_DISCREPANCY",
        priority: "URGENT",
        contactEmail: "audit@dangote.com",
        message: "Requesting schedule confirmation for make-good slot on Friday news.",
      });

      const res = await makeRequest(testPort, "/api/v1/client/projects/PRJ-VMN-2026-088/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      const postRes = await makeRequest(testPort, "/api/v1/broadcast/rights/review-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: "SLOT-4102",
          carrier: "STARTIMES_DTT",
          distributor: "Afro-Beat Media Global",
          justification: "Signed addendum extends window through October 2026.",
        }),
      });
      expect(postRes.statusCode).toBe(200);
      const json = JSON.parse(postRes.body);
      expect(json.status).toBe("SUCCESS");
      expect(json.ticketId).toMatch(/^RW-2026-\d+$/);
    });

    it("renders Proof-of-Air Exceptions Workbench (UX-BR-030 / UX-GOV-006) and handles resolve POST", async () => {
      const html = renderPoaExceptionsWorkbenchHtml();
      expect(html).toContain("UX-BR-030");
      expect(html).toContain("EXP-2026-081");
      expect(html).toContain("UNDER_DELIVERY_TIME");

      const resolveRes = await makeRequest(
        testPort,
        "/api/v1/broadcast/asrun/exceptions/EXP-2026-081/resolve",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resolutionType: "APPROVE_MAKE_GOOD" }),
        }
      );
      expect(resolveRes.statusCode).toBe(200);
      const json = JSON.parse(resolveRes.body);
      expect(json.status).toBe("SUCCESS");
      expect(json.exceptionId).toBe("EXP-2026-081");
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
