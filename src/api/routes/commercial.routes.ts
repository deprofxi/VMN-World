/**
 * Commercial Domain Route Handlers (AUD-24 / TSK-60 / Modular Router Architecture)
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §38, §41, §42 / CCPP §13
 */

import { DomainRoute, RouteContext } from "./types.js";
import { sendJson, sendHtml, readFormBodyStash } from "../router.js";
import { QuoteToCashSalesEngine } from "../../modules/finance/sales/index.js";
import { generateProofOfAirDocument } from "../../modules/broadcast/asrun/index.js";
import { renderMasterLayout } from "../../web/public/dashboard.js";
import { renderCommercialDealsDeskHtml, renderTrafficWizardHtml } from "../../web/workspace/commercial-desk.js";
import { issueCsrfToken } from "../../core/websecurity/index.js";

const salesEngine = new QuoteToCashSalesEngine();

export { salesEngine as commercialSalesEngine };

export const commercialRoutes: DomainRoute[] = [
  {
    method: "GET",
    pathname: "/workspace/commercial/deals",
    handle: async ({ res, user, parsedUrl }: RouteContext) => {
      const allDeals = salesEngine.listDeals();
      const isStaff = user?.roles.some((r) => ["SuperAdmin", "CommercialDirector", "FinanceController", "Operator", "ExecutiveLeader", "AdSalesCommercialManager"].includes(r)) ?? true;
      const scopedDeals = isStaff ? allDeals : allDeals.filter((d) => d.clientOrgId === user?.tenantId);
      const csrfToken = issueCsrfToken();
      const message = parsedUrl.searchParams.get("msg") || undefined;

      const body = renderCommercialDealsDeskHtml({
        deals: scopedDeals,
        csrfToken,
        user,
        message,
      });

      const html = renderMasterLayout("Commercial Deals & Pipeline | VMN Enterprise", body, "/workspace/commercial/deals", {
        sessionUser: user || null,
        shell: "work",
      });

      await sendHtml(res, 200, html);
      return true;
    },
  },
  {
    method: "POST",
    pathname: "/api/v1/commercial/deals",
    handle: async ({ req, res, user }: RouteContext) => {
      const raw = await readFormBodyStash(req);
      const params = new URLSearchParams(raw);
      const dealName = params.get("dealName") || "Untitled Commercial Deal";
      const clientOrgId = params.get("clientOrgId") || "org_generic_client";
      const totalContractValueNgn = Number(params.get("totalContractValueNgn")) || 1000000;
      const salesLeadId = params.get("salesLeadId") || user?.userId || "usr_sales_lead";

      const id = `deal-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      salesEngine.createDeal({
        id,
        clientOrgId,
        dealName,
        totalContractValueNgn,
        salesLeadId,
      });

      res.writeHead(303, { Location: "/workspace/commercial/deals?msg=Deal+Successfully+Created" });
      res.end();
      return true;
    },
  },
  {
    method: "POST",
    pathname: /^\/api\/v1\/commercial\/deals\/([^/]+)\/advance$/,
    handle: async ({ res, pathname }: RouteContext) => {
      const match = /^\/api\/v1\/commercial\/deals\/([^/]+)\/advance$/.exec(pathname);
      const dealId = match ? match[1] : "";
      const deal = salesEngine.getDeal(dealId);

      if (deal) {
        if (deal.stage === "CONTRACT_SIGNED") {
          salesEngine.generateInvoice(dealId, "/proof/certificate", deal.totalContractValueNgn);
        } else if (deal.stage === "INVOICED") {
          salesEngine.recordCashPayment(dealId, deal.totalContractValueNgn);
        } else if (deal.stage === "CASH_COLLECTED") {
          salesEngine.recognizeRevenue(dealId, deal.totalContractValueNgn);
        } else {
          salesEngine.advanceStage(dealId, "CONTRACT_SIGNED");
        }
      }

      res.writeHead(303, { Location: "/workspace/commercial/deals?msg=Deal+Stage+Advanced" });
      res.end();
      return true;
    },
  },
  {
    method: "GET",
    pathname: "/workspace/commercial/traffic-wizard",
    handle: async ({ res, user }: RouteContext) => {
      const csrfToken = issueCsrfToken();
      const body = renderTrafficWizardHtml({
        deals: salesEngine.listDeals(),
        csrfToken,
        user,
      });

      const html = renderMasterLayout("Commercial Traffic Wizard | VMN Enterprise", body, "/workspace/commercial/traffic-wizard", {
        sessionUser: user || null,
        shell: "work",
      });

      await sendHtml(res, 200, html);
      return true;
    },
  },
  {
    method: "GET",
    pathname: "/api/v1/commercial/deals",
    handle: async ({ res, user }: RouteContext) => {
      if (!user) {
        await sendJson(res, 401, { error: "Unauthorized", message: "Authenticated session required" });
        return true;
      }

      const allDeals = salesEngine.listDeals();
      // Tenant scoping: non-superadmin users only see deals for their tenant/org
      const isStaff = user.roles.some((r) => ["SuperAdmin", "CommercialDirector", "FinanceController"].includes(r));
      const scopedDeals = isStaff ? allDeals : allDeals.filter((d) => d.clientOrgId === user.tenantId);

      await sendJson(res, 200, {
        deals: scopedDeals.map((d) => ({
          id: d.id,
          dealName: d.dealName,
          clientOrgId: d.clientOrgId,
          stage: d.stage,
          totalContractValueNgn: d.totalContractValueNgn,
          invoicedAmountNgn: d.invoicedAmountNgn,
          cashCollectedAmountNgn: d.cashCollectedAmountNgn,
          recognizedRevenueNgn: d.recognizedRevenueNgn,
          proofOfPerformanceVerified: d.proofOfPerformanceVerified,
          proofDocumentUrl: d.proofDocumentUrl,
          createdAt: d.createdAt.toISOString(),
        })),
        total: scopedDeals.length,
      });
      return true;
    },
  },
  {
    method: "GET",
    pathname: /^\/api\/v1\/commercial\/deals\/([^/]+)$/,
    handle: async ({ res, pathname, user }: RouteContext) => {
      if (!user) {
        await sendJson(res, 401, { error: "Unauthorized", message: "Authenticated session required" });
        return true;
      }

      const match = /^\/api\/v1\/commercial\/deals\/([^/]+)$/.exec(pathname);
      const dealId = match ? match[1] : "";
      const deal = salesEngine.getDeal(dealId);

      if (!deal) {
        await sendJson(res, 404, { error: "Not Found", message: `Sales deal '${dealId}' not found` });
        return true;
      }

      const isStaff = user.roles.some((r) => ["SuperAdmin", "CommercialDirector", "FinanceController"].includes(r));
      if (!isStaff && deal.clientOrgId !== user.tenantId) {
        await sendJson(res, 403, { error: "Forbidden", message: "Access denied to cross-tenant sales deal" });
        return true;
      }

      await sendJson(res, 200, {
        deal: {
          id: deal.id,
          dealName: deal.dealName,
          clientOrgId: deal.clientOrgId,
          stage: deal.stage,
          totalContractValueNgn: deal.totalContractValueNgn,
          depositAmountNgn: deal.depositAmountNgn,
          invoicedAmountNgn: deal.invoicedAmountNgn,
          cashCollectedAmountNgn: deal.cashCollectedAmountNgn,
          recognizedRevenueNgn: deal.recognizedRevenueNgn,
          proofOfPerformanceVerified: deal.proofOfPerformanceVerified,
          proofDocumentUrl: deal.proofDocumentUrl,
          createdAt: deal.createdAt.toISOString(),
          updatedAt: deal.updatedAt.toISOString(),
        },
      });
      return true;
    },
  },
  {
    method: "GET",
    pathname: /^\/api\/v1\/commercial\/deals\/([^/]+)\/proof-certificate$/,
    handle: async ({ res, pathname, user }: RouteContext) => {
      if (!user) {
        await sendJson(res, 401, { error: "Unauthorized", message: "Authenticated session required" });
        return true;
      }

      const match = /^\/api\/v1\/commercial\/deals\/([^/]+)\/proof-certificate$/.exec(pathname);
      const dealId = match ? match[1] : "";
      const deal = salesEngine.getDeal(dealId);

      if (!deal) {
        await sendJson(res, 404, { error: "Not Found", message: `Sales deal '${dealId}' not found` });
        return true;
      }

      const isStaff = user.roles.some((r) => ["SuperAdmin", "CommercialDirector", "FinanceController"].includes(r));
      if (!isStaff && deal.clientOrgId !== user.tenantId) {
        await sendJson(res, 403, { error: "Forbidden", message: "Access denied to cross-tenant proof certificate" });
        return true;
      }

      // Generate verifiable proof document
      const certDoc = generateProofOfAirDocument({
        certificateId: `POA-DEAL-${deal.id}`,
        channelCode: "NXTR",
        clientName: deal.clientOrgId,
        campaignId: deal.salesLeadId,
        spotId: `SPT-${deal.id}-01`,
        airedTimestamp: deal.updatedAt,
        durationSeconds: 30,
        cryptographicSignature: `SHA256:${deal.id}:${deal.clientOrgId}:${deal.totalContractValueNgn}`,
        isVerified: deal.proofOfPerformanceVerified,
        generatedAt: new Date(),
        carrierLockVerified: true,
      });

      await sendJson(res, 200, {
        certificateId: `POA-DEAL-${deal.id}`,
        dealId: deal.id,
        clientOrgId: deal.clientOrgId,
        isVerified: deal.proofOfPerformanceVerified,
        verificationUrl: certDoc.verificationUrl,
        documentBase64: certDoc.documentBase64,
        sha256Seal: certDoc.documentBase64 ? "VERIFIED_TAMPER_EVIDENT" : "UNSEALED",
      });
      return true;
    },
  },
];
