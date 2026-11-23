/**
 * Unit verification for Modular Domain Routes (Broadcast & Commercial)
 */

import { describe, expect, it } from "vitest";
import type { IncomingMessage, ServerResponse } from "node:http";
import { EventEmitter } from "node:events";
import { dispatchDomainRoute } from "../../src/api/routes/index.js";
import { commercialSalesEngine } from "../../src/api/routes/commercial.routes.js";
import type { SessionUser } from "../../src/core/auth/index.js";

interface Captured {
  status: number;
  body: string;
  headers: Record<string, string | number>;
}

function createMockReq(data: unknown): IncomingMessage {
  const emitter = new EventEmitter() as unknown as IncomingMessage;
  const str = typeof data === "string" ? data : JSON.stringify(data);
  process.nextTick(() => {
    (emitter as any).emit("data", Buffer.from(str));
    (emitter as any).emit("end");
  });
  return emitter;
}

function createResponse(): { res: ServerResponse; captured: Captured } {
  const captured: Captured = { status: 0, body: "", headers: {} };
  const res = {
    get statusCode() {
      return captured.status;
    },
    set statusCode(code: number) {
      captured.status = code;
    },
    setHeader(name: string, value: string | number) {
      captured.headers[name] = value;
    },
    writeHead(status: number, headers?: Record<string, string | number>) {
      captured.status = status;
      if (headers) Object.assign(captured.headers, headers);
      return res;
    },
    end(chunk?: string | Buffer) {
      if (chunk) captured.body += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
    },
  };
  return { res: res as unknown as ServerResponse, captured };
}

describe("Modular Domain Routes: Broadcast", () => {
  it("GET /api/v1/broadcast/headend/carrier-status answers carrier lock info", async () => {
    const { res, captured } = createResponse();
    const handled = await dispatchDomainRoute({
      req: {} as IncomingMessage,
      res,
      pathname: "/api/v1/broadcast/headend/carrier-status",
      method: "GET",
      parsedUrl: new URL("http://localhost/api/v1/broadcast/headend/carrier-status?channel=NXTR"),
      user: null,
    });

    expect(handled).toBe(true);
    expect(captured.status).toBe(200);
    const json = JSON.parse(captured.body);
    expect(json.channelCode).toBe("NXTR");
    expect(json.carrierStatus.locked).toBe(true);
    expect(json.carrierStatus.carrier).toBe("STARTIMES_DTT");
  });
});

describe("Modular Domain Routes: Commercial (TSK-60)", () => {
  const salesEngine = commercialSalesEngine;
  const testDeal = salesEngine.createDeal({
    id: "deal-test-q4-001",
    dealName: "Test Campaign Q4",
    clientOrgId: "org-coke-ng",
    salesLeadId: "lead-coke-01",
    totalContractValueNgn: 50_000_000,
  });

  const _staffUser: SessionUser = {
    userId: "u-staff",
    personId: "p-staff",
    email: "commercial@vmnl.ng",
    roles: ["CommercialDirector"],
  };

  const clientUser: SessionUser = {
    userId: "u-client",
    personId: "p-client",
    email: "brand@coke.ng",
    roles: ["ClientRepresentative"],
    tenantId: "org-coke-ng",
  };

  const otherClientUser: SessionUser = {
    userId: "u-pepsi",
    personId: "p-pepsi",
    email: "brand@pepsi.ng",
    roles: ["ClientRepresentative"],
    tenantId: "org-pepsi-ng",
  };

  it("GET /api/v1/commercial/deals demands authentication", async () => {
    const { res, captured } = createResponse();
    const handled = await dispatchDomainRoute({
      req: {} as IncomingMessage,
      res,
      pathname: "/api/v1/commercial/deals",
      method: "GET",
      parsedUrl: new URL("http://localhost/api/v1/commercial/deals"),
      user: null,
    });

    expect(handled).toBe(true);
    expect(captured.status).toBe(401);
  });

  it("GET /api/v1/commercial/deals scopes deals by tenant", async () => {
    const { res, captured } = createResponse();
    const handled = await dispatchDomainRoute({
      req: {} as IncomingMessage,
      res,
      pathname: "/api/v1/commercial/deals",
      method: "GET",
      parsedUrl: new URL("http://localhost/api/v1/commercial/deals"),
      user: clientUser,
    });

    expect(handled).toBe(true);
    expect(captured.status).toBe(200);
    const json = JSON.parse(captured.body);
    expect(json.deals.every((d: { clientOrgId: string }) => d.clientOrgId === "org-coke-ng")).toBe(true);
  });

  it("GET /api/v1/commercial/deals/:id refuses cross-tenant deal inspection with 403", async () => {
    const { res, captured } = createResponse();
    const handled = await dispatchDomainRoute({
      req: {} as IncomingMessage,
      res,
      pathname: `/api/v1/commercial/deals/${testDeal.id}`,
      method: "GET",
      parsedUrl: new URL(`http://localhost/api/v1/commercial/deals/${testDeal.id}`),
      user: otherClientUser,
    });

    expect(handled).toBe(true);
    expect(captured.status).toBe(403);
  });

  it("GET /api/v1/commercial/deals/:id/proof-certificate returns verifiable PDF seal", async () => {
    const { res, captured } = createResponse();
    const handled = await dispatchDomainRoute({
      req: {} as IncomingMessage,
      res,
      pathname: `/api/v1/commercial/deals/${testDeal.id}/proof-certificate`,
      method: "GET",
      parsedUrl: new URL(`http://localhost/api/v1/commercial/deals/${testDeal.id}/proof-certificate`),
      user: clientUser,
    });

    expect(handled).toBe(true);
    expect(captured.status).toBe(200);
    const json = JSON.parse(captured.body);
    expect(json.dealId).toBe(testDeal.id);
    expect(json.verificationUrl).toContain(`/verify/poa/POA-DEAL-${testDeal.id}`);
    expect(json.documentBase64).toBeDefined();
    // Validate PDF magic bytes %PDF in decoded base64
    const pdfBuf = Buffer.from(json.documentBase64, "base64");
    expect(pdfBuf.subarray(0, 4).toString("utf8")).toBe("%PDF");
  });
});

describe("Modular Domain Routes: Branding & Dynamic Channels", () => {
  it("GET /api/v1/branding/config answers brand identity config", async () => {
    const { res, captured } = createResponse();
    const handled = await dispatchDomainRoute({
      req: {} as IncomingMessage,
      res,
      pathname: "/api/v1/branding/config",
      method: "GET",
      parsedUrl: new URL("http://localhost/api/v1/branding/config"),
      user: null,
    });

    expect(handled).toBe(true);
    expect(captured.status).toBe(200);
    const json = JSON.parse(captured.body);
    expect(json.brandName).toBe("Virtual Media Network Limited");
    expect(json.channelsCount).toBeGreaterThanOrEqual(3);
  });

  it("POST /api/v1/branding/logo updates logo and DELETE resets it", async () => {
    const fakeReq = createMockReq({ logoDataUrl: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=" });

    const { res, captured } = createResponse();
    const handled = await dispatchDomainRoute({
      req: fakeReq,
      res,
      pathname: "/api/v1/branding/logo",
      method: "POST",
      parsedUrl: new URL("http://localhost/api/v1/branding/logo"),
      user: null,
    });

    expect(handled).toBe(true);
    expect(captured.status).toBe(200);
    const json = JSON.parse(captured.body);
    expect(json.success).toBe(true);
    expect(json.config.logoUrl).toBe("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=");

    // DELETE reset
    const { res: delRes, captured: delCaptured } = createResponse();
    const delHandled = await dispatchDomainRoute({
      req: {} as IncomingMessage,
      res: delRes,
      pathname: "/api/v1/branding/logo",
      method: "DELETE",
      parsedUrl: new URL("http://localhost/api/v1/branding/logo"),
      user: null,
    });

    expect(delHandled).toBe(true);
    expect(delCaptured.status).toBe(200);
    const delJson = JSON.parse(delCaptured.body);
    expect(delJson.success).toBe(true);
    expect(delJson.config.logoUrl).toBeNull();
  });

  it("GET /api/v1/branding/channels retrieves dynamic channel lineup and POST registers new channels", async () => {
    const { res, captured } = createResponse();
    const handled = await dispatchDomainRoute({
      req: {} as IncomingMessage,
      res,
      pathname: "/api/v1/branding/channels",
      method: "GET",
      parsedUrl: new URL("http://localhost/api/v1/branding/channels"),
      user: null,
    });

    expect(handled).toBe(true);
    expect(captured.status).toBe(200);
    const json = JSON.parse(captured.body);
    expect(Array.isArray(json.channels)).toBe(true);
    expect(json.channels.some((c: { code: string }) => c.code === "NXTR")).toBe(true);

    // Register a new channel dynamically
    const newChanReq = createMockReq({
      code: "AFRO_BEATS_TV",
      name: "AfroBeats 24/7",
      tagline: "Non-stop African Dance & Pop",
      genre: "Music Television",
      primaryLanguage: "English",
      targetAudience: "Global Diaspora",
      accentColor: "#10b981",
      isProvisional: true,
    });

    const { res: regRes, captured: regCaptured } = createResponse();
    const regHandled = await dispatchDomainRoute({
      req: newChanReq,
      res: regRes,
      pathname: "/api/v1/branding/channels",
      method: "POST",
      parsedUrl: new URL("http://localhost/api/v1/branding/channels"),
      user: null,
    });

    expect(regHandled).toBe(true);
    expect(regCaptured.status).toBe(201);
    const regJson = JSON.parse(regCaptured.body);
    expect(regJson.channel.code).toBe("AFRO_BEATS_TV");
  });
});

describe("Modular Domain Routes: Wave 1 & 2 Workstations & Wizards", () => {
  const staffUser: SessionUser = {
    userId: "usr_test_admin",
    personId: "per_test_admin",
    email: "admin@vmnl.ng",
    tenantId: "org_vmn_hq",
    roles: ["SuperAdmin", "CommercialDirector", "FinanceController"],
  };

  it("GET /workspace/commercial/deals renders commercial deals desk HTML", async () => {
    const { res, captured } = createResponse();
    const handled = await dispatchDomainRoute({
      req: {} as IncomingMessage,
      res,
      pathname: "/workspace/commercial/deals",
      method: "GET",
      parsedUrl: new URL("http://localhost/workspace/commercial/deals"),
      user: staffUser,
    });

    expect(handled).toBe(true);
    expect(captured.status).toBe(200);
    expect(captured.body).toContain("Commercial Sales &amp; Deal Pipeline");
    expect(captured.body).toContain("Register New Commercial Deal");
  });

  it("GET /workspace/commercial/traffic-wizard renders traffic clash wizard", async () => {
    const { res, captured } = createResponse();
    const handled = await dispatchDomainRoute({
      req: {} as IncomingMessage,
      res,
      pathname: "/workspace/commercial/traffic-wizard",
      method: "GET",
      parsedUrl: new URL("http://localhost/workspace/commercial/traffic-wizard"),
      user: staffUser,
    });

    expect(handled).toBe(true);
    expect(captured.status).toBe(200);
    expect(captured.body).toContain("Commercial Break Placement &amp; Conflict Resolver");
  });

  it("GET /broadcast/rights renders rights & CA-32 desk", async () => {
    const { res, captured } = createResponse();
    const handled = await dispatchDomainRoute({
      req: {} as IncomingMessage,
      res,
      pathname: "/broadcast/rights",
      method: "GET",
      parsedUrl: new URL("http://localhost/broadcast/rights"),
      user: staffUser,
    });

    expect(handled).toBe(true);
    expect(captured.status).toBe(200);
    expect(captured.body).toContain("Intellectual Property &amp; Rights Clearinghouse");
  });

  it("GET /broadcast/episodes renders episode masters desk", async () => {
    const { res, captured } = createResponse();
    const handled = await dispatchDomainRoute({
      req: {} as IncomingMessage,
      res,
      pathname: "/broadcast/episodes",
      method: "GET",
      parsedUrl: new URL("http://localhost/broadcast/episodes"),
      user: staffUser,
    });

    expect(handled).toBe(true);
    expect(captured.status).toBe(200);
    expect(captured.body).toContain("Programme &amp; Episode Master Index");
  });

  it("GET /broadcast/scte35 renders SCTE-35 playout console", async () => {
    const { res, captured } = createResponse();
    const handled = await dispatchDomainRoute({
      req: {} as IncomingMessage,
      res,
      pathname: "/broadcast/scte35",
      method: "GET",
      parsedUrl: new URL("http://localhost/broadcast/scte35"),
      user: staffUser,
    });

    expect(handled).toBe(true);
    expect(captured.status).toBe(200);
    expect(captured.body).toContain("Live SCTE-35 Cue Inserter &amp; Headend Controller");
  });

  it("GET /broadcast/asrun/reconcile renders as-run reconciliation wizard", async () => {
    const { res, captured } = createResponse();
    const handled = await dispatchDomainRoute({
      req: {} as IncomingMessage,
      res,
      pathname: "/broadcast/asrun/reconcile",
      method: "GET",
      parsedUrl: new URL("http://localhost/broadcast/asrun/reconcile"),
      user: staffUser,
    });

    expect(handled).toBe(true);
    expect(captured.status).toBe(200);
    expect(captured.body).toContain("Broadcast As-Run Log Reconciliation");
  });

  it("GET /workspace/finance/ledger renders general ledger desk", async () => {
    const { res, captured } = createResponse();
    const handled = await dispatchDomainRoute({
      req: {} as IncomingMessage,
      res,
      pathname: "/workspace/finance/ledger",
      method: "GET",
      parsedUrl: new URL("http://localhost/workspace/finance/ledger"),
      user: staffUser,
    });

    expect(handled).toBe(true);
    expect(captured.status).toBe(200);
    expect(captured.body).toContain("General Ledger &amp; Journal Registry");
  });

  it("GET /workspace/finance/payouts renders talent payouts desk", async () => {
    const { res, captured } = createResponse();
    const handled = await dispatchDomainRoute({
      req: {} as IncomingMessage,
      res,
      pathname: "/workspace/finance/payouts",
      method: "GET",
      parsedUrl: new URL("http://localhost/workspace/finance/payouts"),
      user: staffUser,
    });

    expect(handled).toBe(true);
    expect(captured.status).toBe(200);
    expect(captured.body).toContain("Talent Payout Batches &amp; Statutory WHT");
  });

  it("GET /workspace/admin/users renders IAM users desk", async () => {
    const { res, captured } = createResponse();
    const handled = await dispatchDomainRoute({
      req: {} as IncomingMessage,
      res,
      pathname: "/workspace/admin/users",
      method: "GET",
      parsedUrl: new URL("http://localhost/workspace/admin/users"),
      user: staffUser,
    });

    expect(handled).toBe(true);
    expect(captured.status).toBe(200);
    expect(captured.body).toContain("User Identity, Role Matrix &amp; Access Control");
  });

  it("GET /portal/vtm/release-wizard renders VTM milestone release wizard", async () => {
    const { res, captured } = createResponse();
    const handled = await dispatchDomainRoute({
      req: {} as IncomingMessage,
      res,
      pathname: "/portal/vtm/release-wizard",
      method: "GET",
      parsedUrl: new URL("http://localhost/portal/vtm/release-wizard"),
      user: staffUser,
    });

    expect(handled).toBe(true);
    expect(captured.status).toBe(200);
    expect(captured.body).toContain("Talent Milestone Verification &amp; Escrow Disbursement");
  });
});

describe("Modular Domain Routes: Wave 3 & 4 Governance, Audit & Portals", () => {
  const staffUser: SessionUser = {
    userId: "usr_test_admin",
    personId: "per_test_admin",
    email: "admin@vmnl.ng",
    tenantId: "org_vmn_hq",
    roles: ["SuperAdmin"],
  };

  it("GET /workspace/admin/audit renders cryptographic audit desk", async () => {
    const { res, captured } = createResponse();
    const handled = await dispatchDomainRoute({
      req: {} as IncomingMessage,
      res,
      pathname: "/workspace/admin/audit",
      method: "GET",
      parsedUrl: new URL("http://localhost/workspace/admin/audit"),
      user: staffUser,
    });

    expect(handled).toBe(true);
    expect(captured.status).toBe(200);
    expect(captured.body).toContain("Cryptographic Audit Trail");
  });

  it("GET /workspace/governance/registers renders GRC risk registers", async () => {
    const { res, captured } = createResponse();
    const handled = await dispatchDomainRoute({
      req: {} as IncomingMessage,
      res,
      pathname: "/workspace/governance/registers",
      method: "GET",
      parsedUrl: new URL("http://localhost/workspace/governance/registers"),
      user: staffUser,
    });

    expect(handled).toBe(true);
    expect(captured.status).toBe(200);
    expect(captured.body).toContain("Enterprise Risk, Issue &amp; Privacy Desk");
  });

  it("GET /portal/client renders client & advertiser portal", async () => {
    const { res, captured } = createResponse();
    const handled = await dispatchDomainRoute({
      req: {} as IncomingMessage,
      res,
      pathname: "/portal/client",
      method: "GET",
      parsedUrl: new URL("http://localhost/portal/client"),
      user: staffUser,
    });

    expect(handled).toBe(true);
    expect(captured.status).toBe(200);
    expect(captured.body).toContain("Client &amp; Advertiser Portal");
  });

  it("GET /portal/vtm renders VTM talent marketplace portal", async () => {
    const { res, captured } = createResponse();
    const handled = await dispatchDomainRoute({
      req: {} as IncomingMessage,
      res,
      pathname: "/portal/vtm",
      method: "GET",
      parsedUrl: new URL("http://localhost/portal/vtm"),
      user: staffUser,
    });

    expect(handled).toBe(true);
    expect(captured.status).toBe(200);
    expect(captured.body).toContain("Talent Marketplace");
  });

  it("GET /workspace/afca renders AFCA learning plan", async () => {
    const { res, captured } = createResponse();
    const handled = await dispatchDomainRoute({
      req: {} as IncomingMessage,
      res,
      pathname: "/workspace/afca",
      method: "GET",
      parsedUrl: new URL("http://localhost/workspace/afca"),
      user: staffUser,
    });

    expect(handled).toBe(true);
    expect(captured.status).toBe(200);
    expect(captured.body).toContain("AFCA Learning Plan &amp; Curriculum");
  });
});
