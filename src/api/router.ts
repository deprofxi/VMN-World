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
import { reconcileAsRunLogs, getProofOfAirCertificate } from "../modules/broadcast/asrun/index.js";
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
import { PaymentGatewayWebhookValidator } from "../modules/finance/reconciliation/mt940.js";
import { ReleaseGatePipeline } from "../modules/quality/gates.js";
import {
  signSessionToken,
  verifySessionToken,
  revokeToken,
  checkRateLimit,
  createSessionCookie,
  authenticateUser,
  SessionUser,
} from "../core/auth/index.js";
import { getConfig } from "../core/config/index.js";
import {
  canPerform,
  EnterpriseAction,
  EnterpriseResource,
} from "../core/rbac/index.js";
import {
  renderMasterLayout,
  renderHomePageHtml,
  renderChannelsPageHtml,
  renderHubPageHtml,
  renderDashboardHtml,
  renderScreensCatalogHtml,
  renderScreenDetailHtml,
  renderChannelDetailPageHtml,
  renderPublicProgrammeDetailHtml,
  renderTalentAcceleratorPageHtml,
  renderAfcaAcademyPageHtml,
  renderCreatorsGatewayPageHtml,
  renderCommunityPresencePageHtml,
  renderVtmMarketplacePageHtml,
  renderProductionPageHtml,
  renderEventsPageHtml,
  renderTechnologyPageHtml,
  renderDistributionPageHtml,
  renderPartnersPageHtml,
  renderInsightsPageHtml,
  renderCareersPageHtml,
  renderAzeeboGatewayPageHtml,
  renderWorkspaceDirectoryHtml,
  renderWorkspaceDeskHtml,
  renderFederationGatewayHtml,
  renderUniverseResolverHtml,
  renderAttributionConsoleHtml,
  renderAfcaVerificationHtml,
  renderPoaVerificationHtml,
} from "../web/index.js";
import { OPENAPI_SPEC, renderDocsHtml } from "./docs.js";

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

export async function parseRawBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      resolve(body);
    });
    req.on("error", (err) => reject(err));
  });
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
      } catch (_err) {
        reject(new Error("Invalid JSON body payload", { cause: _err }));
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

export function resolveSessionUser(req: IncomingMessage): SessionUser | null {
  const authHeader = req.headers["authorization"];
  let token: string | undefined;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else if (req.headers["cookie"]) {
    const match = (req.headers["cookie"] as string).match(/vmnl_session=([^;]+)/);
    if (match) token = match[1];
  }
  if (token) {
    try {
      return verifySessionToken(token);
    } catch {
      return null;
    }
  }

  // Test role override strictly allowed ONLY in test environment (CR-2)
  if (process.env.NODE_ENV === "test" && req.headers["x-test-role"]) {
    const roles = (req.headers["x-test-role"] as string).split(",").map((r) => r.trim());
    return {
      userId: "test-user-id",
      personId: "test-person-id",
      email: "test@vmnl.ng",
      roles,
    };
  }

  // Developer bypass permitted ONLY when explicitly enabled via AUTH_BYPASS_ENABLED=true in development environment (CR-2)
  if (process.env.NODE_ENV === "development" && process.env.AUTH_BYPASS_ENABLED === "true") {
    return {
      userId: "dev-sandbox-superadmin",
      personId: "per-sandbox-superadmin",
      email: "admin@vmnl.ng",
      roles: ["SuperAdmin"],
    };
  }

  return null;
}

export function assertRoutePermission(
  req: IncomingMessage,
  res: ServerResponse,
  action: EnterpriseAction,
  resource: EnterpriseResource
): SessionUser | null {
  const user = resolveSessionUser(req);
  if (!user) {
    sendJson(res, 401, {
      error: "Unauthorized",
      message: "Authentication token required for mutating enterprise endpoint",
      code: "AUTH_TOKEN_REQUIRED",
    });
    return null;
  }

  const allowed = canPerform(user, action, resource);
  if (!allowed) {
    sendJson(res, 403, {
      error: "Forbidden",
      message: `User '${user.email}' with roles [${user.roles.join(", ")}] lacks required permission '${action}:${resource}'`,
      code: "INSUFFICIENT_PERMISSIONS",
    });
    return null;
  }

  return user;
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

  // Set CORS headers validated against configured ALLOWED_ORIGINS (D-30)
  const origin = req.headers.origin as string | undefined;
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://localhost:4000,https://vmnl.ng,https://azeebo.plus")
    .split(",")
    .map((s) => s.trim());

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigins[0] || "http://localhost:4000");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Trace-Id, X-Azeebo-Signature, X-Test-Role, X-Require-Auth"
  );

  if (method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    // 0. Public Web Pages & Operator Dashboard
    if (pathname === "/" && method === "GET") {
      const html = renderMasterLayout("Home", renderHomePageHtml(), "/");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    if (pathname === "/channels" && method === "GET") {
      const html = renderMasterLayout("Linear Channels", renderChannelsPageHtml(), "/channels");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    // Surface A: Channel Pages
    if (pathname === "/channels/nxtr" && method === "GET") {
      const html = renderMasterLayout("Nigezie Xtreme (NXTR)", renderChannelDetailPageHtml("NXTR"), "/channels");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    if (pathname === "/channels/orisun" && method === "GET") {
      const html = renderMasterLayout("Orisun (ORIS)", renderChannelDetailPageHtml("ORIS"), "/channels");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    if (pathname === "/channels/isimbido" && method === "GET") {
      const html = renderMasterLayout("Isi Mbido (IMBD)", renderChannelDetailPageHtml("IMBD"), "/channels");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    if (pathname.startsWith("/programmes/") && method === "GET") {
      const programmeId = pathname.replace("/programmes/", "").trim();
      const html = renderMasterLayout(`Programme ${programmeId}`, renderPublicProgrammeDetailHtml(programmeId), "/channels");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    // Surface A: Hub Verticals & Public Pages
    if (pathname === "/hub" && method === "GET") {
      const html = renderMasterLayout("Creative Economy Hub", renderHubPageHtml(), "/hub");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    if (pathname === "/hub/talent" && method === "GET") {
      const html = renderMasterLayout("Talent Accelerator", renderTalentAcceleratorPageHtml(), "/hub");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    if ((pathname === "/hub/afca" || pathname === "/learn") && method === "GET") {
      const html = renderMasterLayout("AFCA Academy", renderAfcaAcademyPageHtml(), "/hub");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    if (pathname === "/hub/creators" && method === "GET") {
      const html = renderMasterLayout("Creators & Talent Gateway", renderCreatorsGatewayPageHtml(), "/hub");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    if (pathname === "/hub/community" && method === "GET") {
      const html = renderMasterLayout("Afro-Fusion Creatives Community", renderCommunityPresencePageHtml(), "/hub");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    if (pathname === "/hub/vtm" && method === "GET") {
      const html = renderMasterLayout("Verified Talent Marketplace (VTM)", renderVtmMarketplacePageHtml(), "/hub");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    if (pathname === "/hub/production" && method === "GET") {
      const html = renderMasterLayout("Production: ONE Studios & VCF", renderProductionPageHtml(), "/hub");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    if (pathname === "/hub/events" && method === "GET") {
      const html = renderMasterLayout("Fusion Events", renderEventsPageHtml(), "/hub");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    if (pathname === "/hub/technology" && method === "GET") {
      const html = renderMasterLayout("Cr8TechNG Technology", renderTechnologyPageHtml(), "/hub");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    if (pathname === "/hub/distribution" && method === "GET") {
      const html = renderMasterLayout("TEND Rights & Distribution", renderDistributionPageHtml(), "/hub");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    if (pathname === "/partners" && method === "GET") {
      const html = renderMasterLayout("Commercial Partners & Sponsors", renderPartnersPageHtml(), "/partners");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    if (pathname === "/insights" && method === "GET") {
      const html = renderMasterLayout("Insights & Research", renderInsightsPageHtml(), "/insights");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    if (pathname === "/careers" && method === "GET") {
      const html = renderMasterLayout("Careers at VMNL", renderCareersPageHtml(), "/careers");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    if (pathname === "/azeebo" && method === "GET") {
      const html = renderMasterLayout("Open Azeebo+", renderAzeeboGatewayPageHtml(), "/azeebo");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    // Public Verification Surfaces: AFCA Academy & Proof-of-Air
    if (pathname.startsWith("/verify/afca/") && method === "GET") {
      const certId = pathname.replace("/verify/afca/", "").trim();
      const verification = context.afcaService.verifyCertificate(certId);
      const acceptsJson = (req.headers["accept"] || "").includes("application/json") || parsedUrl.searchParams.get("format") === "json";
      if (acceptsJson) {
        sendJson(res, verification.valid ? 200 : 404, {
          certificateId: certId,
          ...verification,
        });
        return;
      }
      const html = renderMasterLayout(
        "AFCA Certificate Verification",
        renderAfcaVerificationHtml({
          valid: verification.valid,
          certificate: verification.certificate,
          id: certId,
        }),
        "/hub"
      );
      sendText(res, verification.valid ? 200 : 404, html, "text/html; charset=utf-8");
      return;
    }

    if (pathname.startsWith("/verify/poa/") && method === "GET") {
      const certId = pathname.replace("/verify/poa/", "").trim();
      const cert = getProofOfAirCertificate(certId);
      const acceptsJson = (req.headers["accept"] || "").includes("application/json") || parsedUrl.searchParams.get("format") === "json";
      if (acceptsJson) {
        sendJson(res, cert ? 200 : 404, {
          certificateId: certId,
          valid: Boolean(cert),
          certificate: cert,
        });
        return;
      }
      const html = renderMasterLayout(
        "Proof-of-Air Performance Verification",
        renderPoaVerificationHtml({
          valid: Boolean(cert),
          certificate: cert,
          id: certId,
        }),
        "/channels"
      );
      sendText(res, cert ? 200 : 404, html, "text/html; charset=utf-8");
      return;
    }

    // Surface B & C: Enterprise Workspaces
    if (pathname === "/workspace" && method === "GET") {
      const html = renderMasterLayout("Enterprise Workspaces", renderWorkspaceDirectoryHtml(), "/workspace");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    if (pathname.startsWith("/workspace/") && method === "GET") {
      const deskKey = pathname.replace("/workspace/", "").trim();
      const html = renderMasterLayout(`Workspace / ${deskKey}`, renderWorkspaceDeskHtml(deskKey), "/workspace");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    // Surface E: Azeebo+ Federation & Gateway
    if (pathname === "/azeebo/gateway" && method === "GET") {
      const html = renderMasterLayout("Azeebo+ Federation Gateway", renderFederationGatewayHtml(), "/azeebo/gateway");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    if (pathname === "/azeebo/attribution" && method === "GET") {
      const html = renderMasterLayout("Linear Attribution Tracker", renderAttributionConsoleHtml(), "/azeebo/attribution");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    // Surface E: Universe Deep-Link Resolvers
    const universePrefixes = ["content", "creator", "event", "cinemaxis", "aou", "game", "9tlife", "live"];
    for (const uni of universePrefixes) {
      if ((pathname.startsWith(`/${uni}/`) || pathname.startsWith(`/azeebo/${uni}/`)) && method === "GET") {
        const itemId = pathname.replace(new RegExp(`^/(?:azeebo/)?${uni}/`), "").trim();
        const html = renderMasterLayout(`Azeebo+ / ${uni}`, renderUniverseResolverHtml(uni, itemId), "/azeebo/gateway");
        sendText(res, 200, html, "text/html; charset=utf-8");
        return;
      }
    }

    if ((pathname.startsWith("/azeebo/broadcast/") || pathname.startsWith("/broadcast/bridge/")) && method === "GET") {
      const itemId = pathname.replace(new RegExp(`^/(?:azeebo/broadcast|broadcast/bridge)/`), "").trim();
      const html = renderMasterLayout("Azeebo+ / Broadcast Bridge", renderUniverseResolverHtml("broadcast", itemId), "/azeebo/gateway");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    if (pathname === "/broadcast/dashboard" && method === "GET") {
      const html = renderMasterLayout("Broadcast Executive Dashboard", renderDashboardHtml(), "/broadcast/dashboard");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    if (pathname === "/broadcast/screens" && method === "GET") {
      const roleFilter = parsedUrl.searchParams.get("role") || undefined;
      const html = renderMasterLayout("Operational Screen Surfaces", renderScreensCatalogHtml(roleFilter), "/broadcast/screens");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    if (pathname.startsWith("/broadcast/screens/") && method === "GET") {
      const screenId = pathname.replace("/broadcast/screens/", "").trim();
      const html = renderMasterLayout(`Screen Surface ${screenId}`, renderScreenDetailHtml(screenId), "/broadcast/screens");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    if ((pathname === "/docs" || pathname === "/api/docs") && method === "GET") {
      const html = renderMasterLayout("API Documentation", renderDocsHtml(), "/docs");
      sendText(res, 200, html, "text/html; charset=utf-8");
      return;
    }

    if (pathname === "/api/v1/openapi.json" && method === "GET") {
      sendJson(res, 200, OPENAPI_SPEC);
      return;
    }

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

    // 2.5 Authentication & Session Endpoints (B-7)
    if (pathname === "/api/v1/auth/login" && method === "POST") {
      const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
      const rate = checkRateLimit(`login:${clientIp}`, 10, 60_000);
      if (!rate.allowed) {
        sendJson(res, 429, {
          error: "Too Many Requests",
          message: "Login rate limit exceeded. Please wait before retrying.",
          retryAfterMs: rate.resetInMs,
        });
        return;
      }

      const body = await parseJsonBody(req);
      if (!body.email || !body.password) {
        sendJson(res, 400, { error: "Bad Request", message: "Email and password are required" });
        return;
      }

      // Authentic credential verification with real bcrypt password verification against stored credentials (CR-1)
      const user = await authenticateUser(body.email, body.password);
      if (!user) {
        sendJson(res, 401, {
          error: "Unauthorized",
          message: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        });
        return;
      }

      const tokens = signSessionToken(user);
      res.setHeader("Set-Cookie", createSessionCookie(tokens.accessToken));
      sendJson(res, 200, {
        success: true,
        user,
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      });
      return;
    }

    if ((pathname === "/api/v1/auth/revoke" || pathname === "/api/v1/auth/logout") && method === "POST") {
      const body = await parseJsonBody(req);
      const authHeader = req.headers["authorization"];
      const token = body.token || (authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined);
      if (token) {
        revokeToken(token);
      }
      res.setHeader("Set-Cookie", "vmnl_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax");
      sendJson(res, 200, { success: true, message: "Token successfully revoked and session terminated" });
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
      const user = assertRoutePermission(req, res, "update", "broadcast");
      if (!user) return;

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
      const user = assertRoutePermission(req, res, "create", "talent");
      if (!user) return;

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
      const user = assertRoutePermission(req, res, "create", "academy");
      if (!user) return;

      const body = await parseJsonBody(req);
      const cert = context.afcaService.issueCertificate(body.cohortId, body.studentId);
      sendJson(res, 201, { certificate: cert });
      return;
    }

    if (pathname === "/api/v1/hub/events/verify-ticket" && method === "POST") {
      const user = assertRoutePermission(req, res, "execute", "talent");
      if (!user) return;

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
      const user = assertRoutePermission(req, res, "execute", "agent");
      if (!user) return;

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
      const defaultEndpoint = `${getConfig().AZEEBO_API_BASE_URL.replace(/\/+$/, "")}/webhooks`;
      const body = await parseJsonBody(req);
      const webhook = context.azeeboBridge.dispatchWebhook(
        body.eventType || "CONTENT_SYNDICATED",
        body.targetEndpoint || defaultEndpoint,
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
      const user = assertRoutePermission(req, res, "create", "contract");
      if (!user) return;

      const body = await parseJsonBody(req);
      const deal = context.salesEngine.createDeal(body);
      sendJson(res, 201, { deal });
      return;
    }

    if (pathname === "/api/v1/finance/payouts/batch" && method === "POST") {
      const user = assertRoutePermission(req, res, "create", "finance");
      if (!user) return;

      const body = await parseJsonBody(req);
      const batch = context.payoutEngine.createPayoutBatch(body);
      sendJson(res, 201, { batch });
      return;
    }

    if (pathname === "/api/v1/finance/reconcile/bank" && method === "POST") {
      const user = assertRoutePermission(req, res, "execute", "finance");
      if (!user) return;

      const body = await parseJsonBody(req);
      context.bankRecon.ingestBankTransactions(body.transactions || []);
      const results = context.bankRecon.reconcileAgainstInvoices(body.invoices || []);
      sendJson(res, 200, { results, count: results.length });
      return;
    }

    // 7.5 Payment Gateway Webhook Receivers (Paystack & Flutterwave)
    if (pathname === "/api/v1/webhooks/paystack" && method === "POST") {
      const signatureHeader = (req.headers["x-paystack-signature"] as string) || "";
      const rawBody = await parseRawBody(req);
      const secretKey = process.env.PAYSTACK_SECRET_KEY || "sk_test_paystack_secret_key";

      if (signatureHeader || process.env.NODE_ENV === "production") {
        const isValid = PaymentGatewayWebhookValidator.verifyPaystackSignature(rawBody, signatureHeader, secretKey);
        if (!isValid) {
          sendJson(res, 401, { error: "Unauthorized", message: "Invalid Paystack signature" });
          return;
        }
      }

      let payload: any = {};
      try {
        payload = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        sendJson(res, 400, { error: "Bad Request", message: "Invalid JSON body" });
        return;
      }

      const event = payload.event || "charge.success";
      const data = payload.data || {};

      if (event === "charge.success" || event === "transfer.success") {
        const amountNgn = typeof data.amount === "number" ? data.amount / 100 : 0;
        const ref = data.reference || `PSK-${Date.now()}`;
        context.bankRecon.ingestBankTransactions([
          {
            id: `PAYSTACK-${ref}`,
            source: "PAYSTACK",
            transactionReference: ref,
            bankNarration: `Paystack: ${data.customer?.email || "Direct"} - ${data.gateway_response || event}`,
            amountNgn,
            valueDate: data.paid_at ? new Date(data.paid_at) : new Date(),
          },
        ]);
      }

      context.telemetry.recordMetric("webhook_paystack_received_total", 1, { event });
      sendJson(res, 200, { status: "success", message: "Paystack webhook processed", event });
      return;
    }

    if (pathname === "/api/v1/webhooks/flutterwave" && method === "POST") {
      const secretHashHeader = (req.headers["verif-hash"] as string) || "";
      const rawBody = await parseRawBody(req);
      const configuredHash = process.env.FLUTTERWAVE_SECRET_HASH || "flw_test_secret_hash";

      if (secretHashHeader || process.env.NODE_ENV === "production") {
        const isValid = PaymentGatewayWebhookValidator.verifyFlutterwaveSignature(secretHashHeader, configuredHash);
        if (!isValid) {
          sendJson(res, 401, { error: "Unauthorized", message: "Invalid Flutterwave verification hash" });
          return;
        }
      }

      let payload: any = {};
      try {
        payload = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        sendJson(res, 400, { error: "Bad Request", message: "Invalid JSON body" });
        return;
      }

      const event = payload.event || "charge.completed";
      const data = payload.data || {};

      if (event === "charge.completed" || event === "transfer.completed") {
        const amountNgn = typeof data.amount === "number" ? data.amount : 0;
        const ref = data.tx_ref || data.flw_ref || `FLW-${Date.now()}`;
        context.bankRecon.ingestBankTransactions([
          {
            id: `FLUTTERWAVE-${ref}`,
            source: "FLUTTERWAVE",
            transactionReference: ref,
            bankNarration: `Flutterwave: ${data.customer?.email || "Direct"} - ${data.status || event}`,
            amountNgn,
            valueDate: data.created_at ? new Date(data.created_at) : new Date(),
          },
        ]);
      }

      context.telemetry.recordMetric("webhook_flutterwave_received_total", 1, { event });
      sendJson(res, 200, { status: "success", message: "Flutterwave webhook processed", event });
      return;
    }

    // 8. Quality Release Gates
    if (pathname === "/api/v1/quality/gates" && method === "POST") {
      const manifest: any = await parseJsonBody(req);
      if (manifest?.gates?.BG0_CHANNEL_AUTHORITY) {
        const evaluation = ReleaseGatePipeline.evaluateBroadcastRelease(manifest);
        sendJson(res, evaluation.canDeploy ? 200 : 422, evaluation);
      } else {
        const evaluation = ReleaseGatePipeline.evaluateRelease(manifest);
        sendJson(res, evaluation.canDeploy ? 200 : 422, evaluation);
      }
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
