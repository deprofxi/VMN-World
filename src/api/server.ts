/**
 * VMNL Enterprise API Server Lifecycle Manager
 * Authority: VMNL-AZP-VMN-CCPP-001 §19, §21
 */

import http, { Server } from "node:http";
import { TelemetryService } from "../core/observability/index.js";
import { AzeeboFederationBridge } from "../modules/federation/azeebo/bridge.js";
import { AzeeboLinkGateway } from "../modules/federation/azeebo/links.js";
import { TalentAcceleratorRegistry } from "../modules/hub/talent/index.js";
import { AfcaAcademyService } from "../modules/hub/afca/index.js";
import { FusionEventsEngine } from "../modules/hub/events/index.js";
import { VirtualTalentManagementEngine } from "../modules/hub/vtm/index.js";
import { HeadspaceKnowledgeEngine } from "../modules/intelligence/headspace/index.js";
import { Cr8TechCreativeEngine } from "../modules/intelligence/cr8tech/index.js";
import { AgenticOperatingSystem } from "../modules/intelligence/aos/index.js";
import { QuoteToCashSalesEngine } from "../modules/finance/sales/index.js";
import { TalentPayoutEngine } from "../modules/finance/payouts/index.js";
import { BankReconciliationEngine } from "../modules/finance/reconciliation/index.js";
import { handleApiRequest, RequestHandlerContext } from "./router.js";
import { loadConfig } from "../core/config/index.js";

export interface ApiServerInstance {
  server: Server;
  port: number;
  context: RequestHandlerContext;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

export function createApiServer(port?: number, envOverrides: Record<string, string> = {}): ApiServerInstance {
  const isProductionOrStaging =
    (envOverrides.NODE_ENV || process.env.NODE_ENV) === "production" ||
    (envOverrides.NODE_ENV || process.env.NODE_ENV) === "staging";

  let config;
  if (isProductionOrStaging) {
    // In production or staging, strictly fail fast without fallback secrets (CR-6)
    config = loadConfig({ ...process.env, ...envOverrides });
  } else {
    const testDefaults: Record<string, string> = {
      DATABASE_URL: process.env.DATABASE_URL || "postgresql://vmn_user:vmn_password@localhost:5432/vmn_db",
      JWT_SECRET: process.env.JWT_SECRET || "vmnl-secure-jwt-secret-with-at-least-32-chars-long",
      AZEEBO_WEBHOOK_SECRET: process.env.AZEEBO_WEBHOOK_SECRET || "azeebo-secret-minimum-16-chars",
    };
    config = loadConfig({ ...testDefaults, ...process.env, ...envOverrides });
  }
  const serverPort = port || config.PORT || 4000;
  const telemetry = new TelemetryService();
  const azeeboBridge = new AzeeboFederationBridge(config.AZEEBO_WEBHOOK_SECRET);
  const azeeboLinks = new AzeeboLinkGateway({
    universalBaseUrl: config.AZEEBO_PLUS_UNIVERSAL_URL,
    appScheme: config.AZEEBO_APP_SCHEME,
  });
  const talentRegistry = new TalentAcceleratorRegistry();
  const afcaService = new AfcaAcademyService(config.APP_URL);
  const eventsEngine = new FusionEventsEngine(config.FUSION_EVENTS_HMAC_SECRET);
  const vtmEngine = new VirtualTalentManagementEngine();
  const headspace = new HeadspaceKnowledgeEngine();
  const cr8tech = new Cr8TechCreativeEngine();
  const aos = new AgenticOperatingSystem();
  const salesEngine = new QuoteToCashSalesEngine();
  const payoutEngine = new TalentPayoutEngine();
  const bankRecon = new BankReconciliationEngine();

  // Register a default agent for AOS
  aos.registerAgent({
    id: "bot-001",
    name: "Broadcast Schedule Assistant",
    role: "SCHEDULE_OPTIMIZER",
    operationalScope: "Linear daypart grid balancing",
    allowedTools: ["grid_query", "avail_check"],
    maxDailyActions: 50,
    actionsPerformedToday: 0,
    status: "ACTIVE",
    killSwitchEngaged: false,
    registeredAt: new Date(),
  });

  const context: RequestHandlerContext = {
    telemetry,
    azeeboBridge,
    azeeboLinks,
    talentRegistry,
    afcaService,
    eventsEngine,
    vtmEngine,
    headspace,
    cr8tech,
    aos,
    salesEngine,
    payoutEngine,
    bankRecon,
  };

  const server = http.createServer((req, res) => {
    handleApiRequest(req, res, context);
  });

  return {
    server,
    port: serverPort,
    context,
    start: () =>
      new Promise<void>((resolve, reject) => {
        server.listen(serverPort, () => {
          const span = TelemetryService.createSpanContext("server_bootstrap");
          telemetry.logStructured("INFO", `VMNL Enterprise Server listening on port ${serverPort}`, span, {
            port: serverPort,
            env: config.NODE_ENV,
          });
          resolve();
        });
        server.on("error", (err) => reject(err));
      }),
    stop: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) return reject(err);
          resolve();
        });
      }),
  };
}
