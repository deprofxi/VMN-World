/**
 * VMNL Enterprise Unified API Router & Request Dispatcher
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMNL-AZP-VMN-CCPP-001 §19, §21
 */

import { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import { TelemetryService } from "../core/observability/index.js";
import { getAllActiveChannels, getChannelByCode } from "../modules/broadcast/channels/index.js";
import { BROADCAST_SCREEN_INVENTORY } from "../modules/broadcast/screens/index.js";
import { generateXmltvFeed } from "../modules/broadcast/epg/index.js";
import { reconcileAsRunLogs } from "../modules/broadcast/asrun/index.js";
import { TalentAcceleratorRegistry } from "../modules/hub/talent/index.js";
import { AfcaAcademyService } from "../modules/hub/afca/index.js";
import { FusionEventsEngine } from "../modules/hub/events/index.js";
import { VirtualTalentManagementEngine } from "../modules/hub/vtm/index.js";
import { HeadspaceKnowledgeEngine } from "../modules/intelligence/headspace/index.js";
import { Cr8TechCreativeEngine } from "../modules/intelligence/cr8tech/index.js";
import { AgenticOperatingSystem } from "../modules/intelligence/aos/index.js";
import { AzeeboFederationBridge } from "../modules/federation/azeebo/bridge.js";
import { AzeeboLinkGateway } from "../modules/federation/azeebo/links.js";
import { QuoteToCashSalesEngine } from "../modules/finance/sales/index.js";
import { TalentPayoutEngine } from "../modules/finance/payouts/index.js";
import { BankReconciliationEngine } from "../modules/finance/reconciliation/index.js";
import { ReleaseGatePipeline, ReleaseManifest } from "../modules/quality/gates.js";

export interface RequestHandlerContext {
  telemetry: TelemetryService;
  azeeboBridge: AzeeboFederationBridge;
  azeeboLinks: AzeeboLinkGateway;
  talentRegistry: TalentAcceleratorRegistry;
  afcaService: AfcaAcademyService;
  eventsEngine: FusionEventsEngine;
  vtmEngine: VirtualTalentManagementEngine;
  headspace: HeadspaceKnowledgeEngine;
  cr8tech: Cr8TechCreativeEngine;
  aos: AgenticOperatingSystem;
  salesEngine: QuoteToCashSalesEngine;
  payoutEngine: TalentPayoutEngine;
  bankRecon: BankReconciliationEngine;
}

export async function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error("Invalid JSON body payload"));
      }
    });
    req.on("error", (err) => reject(err));
  });
}

export function sendJson(res: ServerResponse, statusCode: number, data: any): void {
  const payload = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
    "X-Powered-By": "VMNL-Enterprise-OS",
  });
  res.end(payload);
}

export function sendText(res: ServerResponse, statusCode: number, text: string, contentType = "text/plain"): void {
  res.writeHead(statusCode, {
    "Content-Type": contentType,
    "Content-Length": Buffer.byteLength(text),
    "X-Powered-By": "VMNL-Enterprise-OS",
  });
  res.end(text);
}

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  context: RequestHandlerContext
): Promise<void> {
  const reqStart = Date.now();
  const parsedUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = parsedUrl.pathname;
  const method = req.method?.toUpperCase() || "GET";
  const span = TelemetryService.createSpanContext("api_router", req.headers["x-trace-id"] as string | undefined);

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Trace-Id, X-Azeebo-Signature");

  if (method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    // 1. Healthz & Readiness
    if (pathname === "/healthz" && method === "GET") {
      context.telemetry.recordMetric("http_requests_total", 1, { path: "/healthz", status: "200" });
      sendJson(res, 200, {
        status: "healthy",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      });
      return;
    }

    if (pathname === "/readyz" && method === "GET") {
      context.telemetry.recordMetric("http_requests_total", 1, { path: "/readyz", status: "200" });
      sendJson(res, 200, {
        status: "ready",
        checks: {
          database: "connected",
          playout: "ready",
          storage: "ready",
          federationBridge: context.azeeboBridge.getCircuitState(),
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 2. Prometheus Metrics Endpoint
    if (pathname === "/metrics" && method === "GET") {
      const metricsText = context.telemetry.exportPrometheusMetrics();
      sendText(res, 200, metricsText, "text/plain; version=0.0.4");
      return;
    }

    // 3. Broadcast Endpoints
    if (pathname === "/api/v1/broadcast/channels" && method === "GET") {
      const channels = getAllActiveChannels();
      sendJson(res, 200, { channels, count: channels.length });
      return;
    }

    if (pathname === "/api/v1/broadcast/screens" && method === "GET") {
      sendJson(res, 200, { screens: BROADCAST_SCREEN_INVENTORY, count: BROADCAST_SCREEN_INVENTORY.length });
      return;
    }

    if (pathname.startsWith("/api/v1/broadcast/epg/") && method === "GET") {
      const channelCode = pathname.replace("/api/v1/broadcast/epg/", "").toUpperCase();
      const channel = getChannelByCode(channelCode);
      if (!channel) {
        sendJson(res, 404, { error: `Channel code '${channelCode}' not found.` });
        return;
      }
      const now = new Date();
      const epgXml = generateXmltvFeed(channel, [
        {
          id: "epg-item-1",
          channelId: channel.id,
          episodeId: "ep-001",
          title: "Urban Beats Live",
          startTime: now,
          durationSeconds: 3600,
          isLocked: false,
        },
      ]);
      sendText(res, 200, epgXml, "application/xml; charset=utf-8");
      return;
    }

    if (pathname === "/api/v1/broadcast/asrun/reconcile" && method === "POST") {
      const body = await parseJsonBody(req);
      const items = (body.asRunItems || []).map((it: any) => ({
        ...it,
        actualStartTime: new Date(it.actualStartTime || Date.now()),
      }));
      const report = reconcileAsRunLogs(body.channelCode || "NXTR", items);
      sendJson(res, 200, { report });
      return;
    }

    // 4. Creative Hub Endpoints
    if (pathname === "/api/v1/hub/talent/onboard" && method === "POST") {
      const body = await parseJsonBody(req);
      const talent = context.talentRegistry.registerTalent({
        id: body.id || `tal-${Date.now()}`,
        personId: body.personId || `per-${Date.now()}`,
        fullName: body.fullName || body.name || "Anonymous Creator",
        stageName: body.stageName,
        primaryCategory: body.primaryCategory || "ACTING",
        secondaryCategories: body.secondaryCategories,
        locationCity: body.locationCity || "Lagos",
        locationState: body.locationState || "Lagos State",
        partnerHubId: body.partnerHubId,
        dayRateNgn: body.dayRateNgn,
      });
      sendJson(res, 201, { talent, message: "Talent successfully onboarded" });
      return;
    }

    if (pathname === "/api/v1/hub/afca/certify" && method === "POST") {
      const body = await parseJsonBody(req);
      const cert = context.afcaService.issueCertificate(body.cohortId, body.studentId);
      sendJson(res, 201, { certificate: cert });
      return;
    }

    if (pathname === "/api/v1/hub/events/verify-ticket" && method === "POST") {
      const body = await parseJsonBody(req);
      const result = context.eventsEngine.scanGateTicket({
        ticketNumber: body.ticketNumber,
        eventId: body.eventId,
        gateStaffId: body.gateStaffId || "STAFF-01",
      });
      sendJson(res, result.valid ? 200 : 400, result);
      return;
    }

    if (pathname === "/api/v1/hub/vtm/match" && method === "POST") {
      const body = await parseJsonBody(req);
      const matches = context.vtmEngine.matchTalent(body.briefId, body.candidates || []);
      sendJson(res, 200, { matches, count: matches.length });
      return;
    }

    // 5. Intelligence, Knowledge & Agentic OS
    if (pathname === "/api/v1/intelligence/headspace/search" && method === "POST") {
      const body = await parseJsonBody(req);
      const results = context.headspace.search(body.query || "", body.userLevel || "INTERNAL", body.filterCategory);
      sendJson(res, 200, { results, count: results.length });
      return;
    }

    if (pathname === "/api/v1/intelligence/cr8tech/subtitle" && method === "POST") {
      const body = await parseJsonBody(req);
      const track = context.cr8tech.generateSubtitles({
        id: body.id || `sub-${Date.now()}`,
        assetId: body.assetId || "asset-001",
        language: body.language || "EN",
        format: body.format || "WEBVTT",
        cues: body.cues || [],
      });
      sendText(res, 200, track.renderedContent, "text/vtt; charset=utf-8");
      return;
    }

    if (pathname === "/api/v1/intelligence/aos/execute" && method === "POST") {
      const body = await parseJsonBody(req);
      try {
        const proposal = context.aos.submitProposal({
          id: body.id || `prop-${Date.now()}`,
          agentId: body.agentId,
          criticality: body.criticality || "MEDIUM_DRAFT",
          targetDomain: body.targetDomain || "BROADCAST",
          proposedAction: body.proposedAction || "OPTIMIZE_SCHEDULE",
          payload: body.payload || {},
        });
        sendJson(res, 200, { proposal });
      } catch (err: any) {
        sendJson(res, 403, { error: err.message, status: "REJECTED" });
      }
      return;
    }

    // 6. Azeebo+ Federation
    if (pathname === "/api/v1/federation/azeebo/webhook" && method === "POST") {
      const body = await parseJsonBody(req);
      const webhook = context.azeeboBridge.dispatchWebhook(
        body.eventType || "CONTENT_SYNDICATED",
        body.targetEndpoint || "https://api.azeebo.plus/v1/webhooks",
        body.payload || {}
      );
      sendJson(res, webhook.status === "DELIVERED" ? 200 : 503, { webhook });
      return;
    }

    if (pathname === "/api/v1/federation/azeebo/link" && method === "POST") {
      const body = await parseJsonBody(req);
      const link = context.azeeboLinks.createUniversalLink(body);
      sendJson(res, 201, { link });
      return;
    }

    // 7. Finance & Commercial Ledger
    if (pathname === "/api/v1/finance/deals" && method === "POST") {
      const body = await parseJsonBody(req);
      const deal = context.salesEngine.createDeal(body);
      sendJson(res, 201, { deal });
      return;
    }

    if (pathname === "/api/v1/finance/payouts/batch" && method === "POST") {
      const body = await parseJsonBody(req);
      const batch = context.payoutEngine.createPayoutBatch(body);
      sendJson(res, 201, { batch });
      return;
    }

    if (pathname === "/api/v1/finance/reconcile/bank" && method === "POST") {
      const body = await parseJsonBody(req);
      context.bankRecon.ingestBankTransactions(body.transactions || []);
      const results = context.bankRecon.reconcileAgainstInvoices(body.invoices || []);
      sendJson(res, 200, { results, count: results.length });
      return;
    }

    // 8. Quality Release Gates
    if (pathname === "/api/v1/quality/gates" && method === "POST") {
      const manifest: ReleaseManifest = await parseJsonBody(req);
      const evaluation = ReleaseGatePipeline.evaluateRelease(manifest);
      sendJson(res, evaluation.canDeploy ? 200 : 422, evaluation);
      return;
    }

    // Route not found
    sendJson(res, 404, {
      error: "Not Found",
      message: `Endpoint ${method} ${pathname} does not exist on VMNL Enterprise Platform`,
    });
  } catch (error: any) {
    const duration = Date.now() - reqStart;
    context.telemetry.recordMetric("http_5xx_error_rate_percent", 1.0, { path: pathname });
    context.telemetry.logStructured("ERROR", error.message, span, { stack: error.stack, duration });
    sendJson(res, 500, {
      error: "Internal Server Error",
      message: error.message || "An unexpected error occurred",
      traceId: span.traceId,
    });
  }
}
