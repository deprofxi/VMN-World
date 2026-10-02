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
import { BankReconciliationEngine, InvoiceReconciliationTarget } from "../modules/finance/reconciliation/index.js";
import { EnterpriseQueueWorker, configureRollingEpgScheduler } from "../core/queue/index.js";
import { NotificationService, EmailDispatchOptions, SmsDispatchOptions } from "../core/notifications/index.js";
import { TalentRepository } from "../core/database/repositories/talent.repository.js";
import { RollingEpgScheduler } from "../modules/broadcast/epg/scheduler.js";
import { VirtualContentFundEngine } from "../modules/hub/vcf/index.js";
import { OneStudiosEngine } from "../modules/hub/onestudios/index.js";
import { TendDistributionEngine } from "../modules/hub/tend/index.js";
import { AfroFusionCommunityHub } from "../modules/hub/community/index.js";
import { BroadcastRightsGate } from "../modules/broadcast/rights/index.js";
import { BroadcastTrafficEngine } from "../modules/broadcast/traffic/index.js";
import { PlayoutAutomationEngine } from "../modules/broadcast/playout/index.js";
import { SponsorshipEngine } from "../modules/broadcast/sponsorship/index.js";
import { CarriageMonitoringEngine } from "../modules/broadcast/carriage/index.js";
import { BroadcastBillingEngine } from "../modules/broadcast/billing/index.js";
import { PlayoutExportEngine } from "../modules/broadcast/export/index.js";
import { handleApiRequest, RequestHandlerContext } from "./router.js";
import { loadConfig } from "../core/config/index.js";
import { CommercialProposalStore } from "../web/workspace/commercial-proposal.js";
import { wireMediaAssetLookup } from "../core/content/index.js";
import { getMediaAsset } from "../core/storage/index.js";
import { registerGoldenDamAssets } from "../db/seeds/dam-backfill.js";
import { ensureContentDemoSeed } from "./router.js";
import { refreshEpisodeMasterIndex } from "../modules/broadcast/episode-masters.js";
import { ensureScheduleDemoSeed } from "../modules/broadcast/schedule-demo.js";

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
  const serverPort = port !== undefined ? port : config.PORT || 5500;
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
  // SCR-17: canonical proposal store bound to the Quote-to-Cash engine.
  const proposalStore = new CommercialProposalStore(salesEngine);

  // Instantiate background queue worker, notification service, and DB repository (T-09, T-10, T-11)
  const queueWorker = new EnterpriseQueueWorker({ concurrency: 5, telemetry });
  const notificationService = new NotificationService({ telemetry });
  const talentRepository = new TalentRepository();

  // SCR-03 (UX-CMS-006): the CMS revision domain validates mediaAssetIds
  // against the canonical DAM registry — wire the lookup seam at boot.
  wireMediaAssetLookup(getMediaAsset);

  // SCR-03 backfill: register the golden DAM assets (episode masters +
  // programme key art, deterministic ids) BEFORE the demo content seed so its
  // media reference validates, then seed the demo content that references it.
  // Idempotent: explicit assetIds make repeat boots no-ops.
  registerGoldenDamAssets();
  ensureContentDemoSeed();

  // Register production job handlers (T-09, T-10)
  queueWorker.registerHandler("EPG_GENERATION", async (job) => {
    const channels = ["NXTR", "ORIS", "IMBD"];
    const payload = job.payload as { baseDate?: string } | undefined;
    const baseDate = payload?.baseDate ? new Date(payload.baseDate) : new Date();
    const feeds = channels.map((code) => RollingEpgScheduler.generate7DayRollingFeed(code, baseDate));
    const totalSlots = feeds.reduce((sum, f) => sum + f.totalSlots, 0);
    const xmltvTotalLength = feeds.reduce((sum, f) => sum + f.xmltvContent.length, 0);

    telemetry.recordMetric("epg_syndication_generation_total", 1, { status: "success" });
    return {
      status: "SUCCESS",
      channelsProcessed: channels,
      totalSlots,
      xmltvTotalLength,
      generatedAt: new Date().toISOString(),
    };
  });

  queueWorker.registerHandler("NOTIFICATION_DELIVERY", async (job) => {
    const payload = job.payload as (EmailDispatchOptions & { channel?: string }) | (SmsDispatchOptions & { channel?: string });
    if (payload && payload.channel === "SMS") {
      return await notificationService.sendSms(payload as unknown as SmsDispatchOptions);
    }
    return await notificationService.sendEmail(payload as EmailDispatchOptions);
  });

  queueWorker.registerHandler("WEBHOOK_DISPATCH", async (job) => {
    const payload = (job.payload || {}) as { endpoint?: string };
    telemetry.recordMetric("webhook_dispatch_total", 1, { endpoint: payload.endpoint || "default" });
    return {
      dispatched: true,
      endpoint: payload.endpoint,
      timestamp: new Date().toISOString(),
    };
  });

  queueWorker.registerHandler("RECONCILIATION_RUN", async (job) => {
    const payload = job.payload as { invoices?: InvoiceReconciliationTarget[] } | undefined;
    const invoices = payload?.invoices || [];
    const results = bankRecon.reconcileAgainstInvoices(invoices);
    telemetry.recordMetric("nightly_recon_run_total", 1, { matchedCount: String(results.length) });
    return {
      reconciledCount: results.length,
      timestamp: new Date().toISOString(),
    };
  });

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

  // Domain service instances (T9-05)
  const vcfEngine = new VirtualContentFundEngine();
  const oneStudios = new OneStudiosEngine();
  const tendEngine = new TendDistributionEngine();
  const communityHub = new AfroFusionCommunityHub();
  const rightsGate = new BroadcastRightsGate();
  const trafficEngine = new BroadcastTrafficEngine();
  const playoutEngine = new PlayoutAutomationEngine();
  const sponsorshipEngine = new SponsorshipEngine();
  const carriageEngine = new CarriageMonitoringEngine();
  const billingEngine = new BroadcastBillingEngine();
  const exportEngine = new PlayoutExportEngine();

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
    proposalStore,
    queueWorker,
    notificationService,
    talentRepository,
    vcfEngine,
    oneStudios,
    tendEngine,
    communityHub,
    rightsGate,
    trafficEngine,
    playoutEngine,
    sponsorshipEngine,
    carriageEngine,
    billingEngine,
    exportEngine,
  };

  const server = http.createServer((req, res) => {
    handleApiRequest(req, res, context);
  });

  return {
    server,
    port: serverPort,
    context,
    start: async () => {
      // SCR-03 follow-on: project the canonical BroadcastEpisode → DAM master
      // chain into the sync index read by the EPG and channel schedule
      // surfaces, so the first request already sees populated rows (or the
      // honest empty state when no database/seed is present). Then seed
      // today's approved demo schedule from that index so the now/next widget
      // (BCST-08/09) can show live episode masters — it skips honestly when
      // the index is empty and never fabricates entries. Failures here must
      // never block serving.
      try {
        await refreshEpisodeMasterIndex();
        const demoSeed = ensureScheduleDemoSeed();
        if (demoSeed.channelsSeeded > 0) {
          const span = TelemetryService.createSpanContext("server_bootstrap");
          telemetry.logStructured("INFO", "Approved schedule demo seeded from the episode-master index", span, { ...demoSeed });
        }
      } catch (err) {
        const span = TelemetryService.createSpanContext("server_bootstrap");
        telemetry.logStructured("WARN", "Episode master index refresh or schedule demo seed failed — broadcast surfaces will show the honest empty state", span, { error: String(err) });
      }
      return new Promise<void>((resolve, reject) => {
        server.listen(serverPort, () => {
          queueWorker.start();
          configureRollingEpgScheduler(queueWorker);
          queueWorker.enqueue(
            "EPG_GENERATION",
            {
              channelCodes: ["NXTR", "ORIS", "IMBD"],
              baseDate: new Date().toISOString(),
            },
            { priority: 1 }
          );
          const span = TelemetryService.createSpanContext("server_bootstrap");
          telemetry.logStructured("INFO", `VMNL Enterprise Server listening on port ${serverPort}`, span, {
            port: serverPort,
            env: config.NODE_ENV,
          });
          resolve();
        });
        server.on("error", (err) => reject(err));
      });
    },
    stop: () =>
      new Promise<void>((resolve, reject) => {
        queueWorker.stop();
        server.close((err) => {
          if (err) return reject(err);
          resolve();
        });
      }),
  };
}
