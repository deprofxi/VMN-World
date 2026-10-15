/**
 * VMNL Enterprise API Server Lifecycle Manager
 * Authority: VMNL-AZP-VMN-CCPP-001 §19, §21
 */

import http, { IncomingMessage, Server, ServerResponse } from "node:http";
import net from "node:net";
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
import { QuoteToCashSalesEngine, hydrateSalesEngine } from "../modules/finance/sales/index.js";
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
import { LedgerPostingService } from "../modules/finance/ledger/posting.js";
import { SevenWayLedgerEngine } from "../modules/finance/ledger/index.js";
import { PlayoutExportEngine } from "../modules/broadcast/export/index.js";
import { handleApiRequest, RequestHandlerContext } from "./router.js";
import { loadConfig } from "../core/config/index.js";
import { getAuditHealth, restoreAuditChainFromKv, setAuditDegradationListener } from "../core/audit/index.js";
import { assertSharedKvBackendForEnvironment, configureRedisAdapterFactory, resolveKeyValueAdapter } from "../core/cache/index.js";
import { useKeyValueAdapterForAuthStores } from "../core/auth/index.js";
import { useKeyValueAdapterForSessions } from "../core/auth/sessions.js";
import type { MinimalRedisClient } from "../core/cache/index.js";
import { CommercialProposalStore } from "../web/workspace/commercial-proposal.js";
import { wireMediaAssetLookup } from "../core/content/index.js";
import { getMediaAsset } from "../core/storage/index.js";
import { registerGoldenDamAssets } from "../db/seeds/dam-backfill.js";
import { ensureContentDemoSeed } from "./router.js";
import { refreshEpisodeMasterIndex } from "../modules/broadcast/episode-masters.js";
import { refreshRegisteredRightsIndex } from "../modules/broadcast/rights/index.js";
import { ensureScheduleDemoSeed } from "../modules/broadcast/schedule-demo.js";
import { flushDurableJournal, nextJournalGroup, withJournalGroup } from "../core/database/durable-journal.js";
import { refreshEnquiryIndex } from "../modules/hub/enquiry/index.js";
import { refreshApprovalIndex } from "../core/approvals/index.js";
import { refreshCaseIndex } from "../core/cases/index.js";
import { refreshRiskIssueIndex } from "../core/work/index.js";
import { refreshDestinationIndex } from "../core/federation/destinations.js";
import { refreshMediaAssetIndex } from "../core/storage/index.js";
import { refreshContentIndex } from "../core/content/index.js";
import { hydrateSponsorshipEngine } from "../modules/broadcast/sponsorship/index.js";
import { refreshSessionIndex } from "../core/auth/sessions.js";
import { refreshIdempotencyIndex } from "../core/websecurity/index.js";

export interface ApiServerInstance {
  server: Server;
  port: number;
  context: RequestHandlerContext;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

export function createApiServer(port?: number, envOverrides: Record<string, string> = {}): ApiServerInstance {
  // AUD-04: AUTH_BYPASS_ENABLED must never be active in production or staging
  if (process.env.AUTH_BYPASS_ENABLED === "true") {
    const env = process.env.NODE_ENV;
    if (env === "production" || env === "staging") {
      throw new Error("[VMNL-SEC] AUTH_BYPASS_ENABLED=true is forbidden in production/staging environments (AUD-04)");
    }
  }
  // AUD-10: the sandbox fallback silently serves memory data instead of failing
  // closed when the database is unavailable. That trade-off may exist only in
  // explicit development/test; production/staging must fail closed.
  {
    const bootEnv = process.env.NODE_ENV;
    if (
      process.env.ALLOW_SANDBOX_FALLBACK === "true" &&
      (bootEnv === "production" || bootEnv === "staging")
    ) {
      throw new Error(
        "[VMNL-DB] ALLOW_SANDBOX_FALLBACK=true is forbidden in production/staging: the deployment must fail closed when the database is unavailable (AUD-10)"
      );
    }
  }
  // AUD-11: the environment for secret-purposes must be explicit. Only exact
  // "development" or "test" may use fallback secrets below; any other value
  // (including unset) is treated as production-like and must configure real
  // secrets. This prevents an unset or mistyped NODE_ENV from silently booting
  // with publicly-known signing keys.
  let config;
  const secretEnvironment = envOverrides.NODE_ENV || process.env.NODE_ENV;
  if (secretEnvironment !== "development" && secretEnvironment !== "test") {
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
  const telemetry = new TelemetryService(); wireAuditDegradationAlerting(telemetry);

  // AUD-03/AUD-04: wire the shared KV adapter at boot. The repo keeps its
  // dependency count at zero by injecting a minimal RESP client over node:net
  // (operators may supply node-redis/ioredis via configureRedisAdapterFactory
  // instead). resolveKeyValueAdapter prefers Redis when REDIS_URL is set and
  // logs its backend decision, so a deployment never silently assumes
  // distribution. The adapter is shared with the auth and session stores.
  if (process.env.REDIS_URL) {
    configureRedisAdapterFactory((url) => createMinimalRespRedisClient(url));
  }
  const kvAdapter = resolveKeyValueAdapter({
    telemetry: {
      logStructured: (level, message, _span, attrs) => {
        const span = TelemetryService.createSpanContext("server_bootstrap");
        telemetry.logStructured(level as "INFO" | "WARN" | "ERROR", message, span, attrs ?? {});
      },
    },
  });
  useKeyValueAdapterForAuthStores(kvAdapter);
  useKeyValueAdapterForSessions(kvAdapter);
  // AUD-03/AUD-04: a multi-instance production deployment must not silently run
  // on the process-local backend (sessions, lockouts, MFA challenges and rate
  // limits would multiply per instance).
  assertSharedKvBackendForEnvironment(kvAdapter);
  // AUD-05: continue the durable audit chain after a restart instead of
  // resetting it to genesis.
  void restoreAuditChainFromKv().then((restored) => {
    if (restored.restored) {
      telemetry.logStructured("INFO", "Audit chain restored from durable tail", TelemetryService.createSpanContext("server_bootstrap"), {
        sequence: restored.sequence ?? 0,
      });
    }
  });
  const azeeboBridge = new AzeeboFederationBridge(config.AZEEBO_WEBHOOK_SECRET);
  if (!config.AZEEBO_PLUS_UNIVERSAL_URL || !config.AZEEBO_API_BASE_URL) {
    // TSK-35: federation is deployment-configured. Absence disables outbound
    // links rather than inventing a partner endpoint — say so loudly at boot.
    telemetry.logStructured("WARN", "Azeebo+ federation origin not configured; outbound links fail closed", TelemetryService.createSpanContext("server_bootstrap"), {
      missing: [
        ...(!config.AZEEBO_PLUS_UNIVERSAL_URL ? ["AZEEBO_PLUS_UNIVERSAL_URL"] : []),
        ...(!config.AZEEBO_API_BASE_URL ? ["AZEEBO_API_BASE_URL"] : []),
      ].join(","),
    });
  }
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
  // TSK-33 (FIN-07): a make-good credit note is a financial fact, so the credit
  // remedy on the proof-of-air desk posts it through the canonical ledger rather
  // than stopping at the billing record. One engine per server instance, like the
  // other domain services here.
  const ledgerPostingService = new LedgerPostingService(new SevenWayLedgerEngine());
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
    ledgerService: ledgerPostingService,
    exportEngine,
  };

  const server = http.createServer((req, res) => {
    // TSK-18: one journal group per request, so its rows drain in one transaction.
    void serveRequestInJournalGroup(req, res, context);
  });
  // AUD-11: prevent slow-client/slow-body DoS attacks
  server.requestTimeout = 30_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 65_000;

  return {
    server,
    port: serverPort,
    context,
    start: async () => {
      // TSK-17 (report.md CA-12): the release-critical stores are read indexes
      // over durable rows, so a booting process must refill them before it
      // answers a single request. Order matters only where a projection depends
      // on another store: media assets first (the golden DAM backfill and the
      // demo content seed reference them), then the registers the work graph
      // aggregates. Each refresh fails soft: an unreachable database leaves the
      // store empty and the surfaces show the honest empty state — never a
      // fabricated record, and never a boot that blocks.
      try {
        const assets = await refreshMediaAssetIndex();
        await refreshSessionIndex();
        await refreshIdempotencyIndex();
        await refreshEnquiryIndex();
        await refreshApprovalIndex();
        await refreshCaseIndex();
        await refreshRiskIssueIndex();
        await refreshDestinationIndex();
        const content = await refreshContentIndex();
        const sponsorship = await hydrateSponsorshipEngine(sponsorshipEngine);
        // TSK-60 box 3: the counterparty portal projects this instance, so it
        // hydrates with the others. Deals come from an explicit console action
        // rather than a boot seed, so nothing has to be re-run after hydration.
        const sales = await hydrateSalesEngine(salesEngine);
        // Re-run the deterministic boot seeds against the hydrated registries:
        // created in `createApiServer` before hydration could run, they are
        // idempotent by assetId/contentId, so durable rows win and only genuinely
        // missing demo data is added.
        registerGoldenDamAssets();
        ensureContentDemoSeed();
        if (assets.assets > 0 || content.items > 0 || sponsorship.bindings > 0 || sales.deals > 0) {
          const span = TelemetryService.createSpanContext("server_bootstrap");
          telemetry.logStructured(
            "INFO",
            "Release-critical durable stores hydrated at boot",
            span,
            { ...assets, ...content, ...sponsorship, ...sales }
          );
        }
      } catch (err) {
        const span = TelemetryService.createSpanContext("server_bootstrap");
        telemetry.logStructured("WARN", "Durable store hydration failed — release-critical surfaces start empty", span, { error: String(err) });
      }
      // SCR-03 follow-on: project the canonical BroadcastEpisode → DAM master
      // chain into the sync index read by the EPG and channel schedule
      // surfaces, so the first request already sees populated rows (or the
      // honest empty state when no database/seed is present). Then seed
      // today's approved demo schedule from that index so the now/next widget
      // (BCST-08/09) can show live episode masters — it skips honestly when
      // the index is empty and never fabricates entries. Failures here must
      // never block serving.
      try {
        // TSK-10: the clearance gate decides on *registered* RightsRecords, so the
        // schedule lifecycle and the EPG export can only run against the durable
        // store once it is loaded. The order matters: rights first, then the
        // episode masters the demo schedule derives entries from, then the seed
        // that needs both. An unhydrated process approves nothing (fail closed)
        // rather than clearing slots against records it never read.
        const rights = await refreshRegisteredRightsIndex();
        await refreshEpisodeMasterIndex();
        if (rights.records > 0) {
          const span = TelemetryService.createSpanContext("server_bootstrap");
          telemetry.logStructured("INFO", "Registered rights records hydrated for the clearance gate", span, { ...rights });
        }
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
    stop: async () => {
      queueWorker.stop();
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) return reject(err);
          resolve();
        });
      });
      // TSK-17: graceful shutdown drains the write-behind journal. Anything still
      // staged after this never reached the database, which the journal reports
      // as sandbox-deferred rather than durable (Rule 0.4a).
      await flushDurableJournal();
    },
  };
}

/**
 * Minimal RESP-2 client over node:net implementing the MinimalRedisClient
 * contract used by RedisKeyValueAdapter (GET/SET/DEL/SET-NX/INCRBY/PEXPIRE/
 * KEYS/PING; AUTH when the URL carries credentials). Injection via the
 * factory keeps the repository dependency-free (no node-redis/ioredis).
 *
 * Scope note: a single in-flight array accumulator handles flat bulk arrays
 * (KEYS); nested array types are outside this client's documented scope.
 * AUTH is queued as a no-op pending reply so its response can never be
 * mis-attributed to the first real command. Sockets connect lazily; commands
 * fail fast once the socket has errored or closed, which the adapter surfaces
 * as degraded telemetry.
 */
export function createMinimalRespRedisClient(urlString: string): MinimalRedisClient {
  const url = new URL(urlString);
  const socket = net.connect({
    host: url.hostname,
    port: Number(url.port || 6379),
  });
  socket.setNoDelay(true);

  type Pending = { resolve: (value: unknown) => void; reject: (err: Error) => void };
  const queue: Pending[] = [];
  let buffer = Buffer.alloc(0);
  let closed = false;
  // Accumulator for a multi-bulk reply in progress (one command at a time in
  // flight per connection is not required — replies settle strictly in order).
  let arrayReply: { expected: number; items: unknown[] } | null = null;

  function settleReply(value: unknown): void {
    if (arrayReply) {
      arrayReply.items.push(value);
      if (arrayReply.items.length < arrayReply.expected) return;
      const completed = arrayReply.items;
      arrayReply = null;
      finish(completed);
      return;
    }
    finish(value);
  }

  function finish(value: unknown): void {
    const pendingReply = queue.shift();
    if (pendingReply) pendingReply.resolve(value);
  }

  function rejectNext(err: Error): void {
    const pendingReply = queue.shift();
    if (pendingReply) pendingReply.reject(err);
  }

  const parse = (): void => {
    for (;;) {
      const lineEnd = buffer.indexOf("\r\n");
      if (lineEnd === -1) return;
      const prefix = String.fromCharCode(buffer[0]!);
      if (prefix === "+" || prefix === "-" || prefix === ":") {
        const line = buffer.subarray(0, lineEnd + 2).toString("utf8");
        buffer = buffer.subarray(lineEnd + 2);
        const payload = line.slice(1, -2);
        if (prefix === "+") settleReply(payload);
        else if (prefix === "-") rejectNext(new Error(payload));
        else settleReply(Number(payload));
        continue;
      }
      if (prefix === "$") {
        const length = Number(buffer.subarray(0, lineEnd).toString("utf8").slice(1));
        if (length === -1) {
          buffer = buffer.subarray(lineEnd + 2);
          settleReply(null);
          continue;
        }
        const total = lineEnd + 2 + length + 2;
        if (buffer.length < total) return; // wait for the full bulk string
        const bulk = buffer.subarray(lineEnd + 2, lineEnd + 2 + length).toString("utf8");
        buffer = buffer.subarray(total);
        settleReply(bulk);
        continue;
      }
      if (prefix === "*") {
        const count = Number(buffer.subarray(0, lineEnd).toString("utf8").slice(1));
        buffer = buffer.subarray(lineEnd + 2);
        if (count <= 0) {
          settleReply([]);
        } else {
          arrayReply = { expected: count, items: [] };
        }
        continue;
      }
      return; // unknown frame: stop parsing rather than desynchronize
    }
  };

  function drainRejections(reason: string): void {
    closed = true;
    arrayReply = null;
    for (;;) {
      const pendingReply = queue.shift();
      if (!pendingReply) break;
      pendingReply.reject(new Error(reason));
    }
  }

  socket.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    parse();
  });
  socket.on("error", () => drainRejections("REDIS_CONNECTION_ERROR"));
  socket.on("close", () => {
    if (!closed) drainRejections("REDIS_CONNECTION_CLOSED");
  });

  const password = url.password || (url.username && url.username !== "default" ? url.username : "");
  if (password) {
    // Reserve the AUTH reply slot so it is never attributed to a real command.
    queue.push({ resolve: () => {}, reject: () => {} });
    socket.write(`*2\r\n$4\r\nAUTH\r\n$${Buffer.byteLength(password)}\r\n${password}\r\n`);
  }

  return {
    call: (command, ...args) =>
      new Promise<unknown>((resolve, reject) => {
        if (closed) {
          reject(new Error("REDIS_CONNECTION_CLOSED"));
          return;
        }
        queue.push({ resolve, reject });
        const parts = [command.toUpperCase(), ...args.map(String)];
        socket.write(`*${parts.length}\r\n` + parts.map((p) => `$${Buffer.byteLength(p)}\r\n${p}\r\n`).join(""));
      }),
  };
}

/**
 * TSK-18 (box 3): a durable audit failure already emits a structured WARN, which
 * a log drain can see, and it already flips `getAuditPersistenceMode()` to
 * `prisma_error`, which `/readyz` publishes. An operator's alerting needs the
 * same fact as a metric so `TelemetryService`'s rule engine can fire and dispatch
 * it (console or `ALERT_WEBHOOK_URL`); without this the degradation is visible
 * only to whoever is reading stdout.
 */
function wireAuditDegradationAlerting(telemetry: TelemetryService): void {
  setAuditDegradationListener(() => {
    telemetry.recordMetric("audit_durable_degraded_total", getAuditHealth().durableFailures, { component: "audit" });
  });
}

/**
 * TSK-18 (box 1): each request runs in its own durable-journal group, so the rows
 * it stages — the business write and the audit entries that attest it — drain
 * inside ONE Prisma transaction at the response choke point. The `finally`
 * backstop covers requests that answer without passing a choke point or that
 * throw mid-handler: their group must still drain, because a later request
 * flushes only its own group and would never pick these rows up. A rejected
 * drain is already observable (the journal counts it, the audit ledger reports
 * `prisma_error` with its own WARN and alert metric, and `sendJson` has failed
 * closed with 503 when it was the one flushing), so it must not additionally
 * surface as an unhandled rejection on a socket that has already finished.
 */
async function serveRequestInJournalGroup(
  req: IncomingMessage,
  res: ServerResponse,
  context: RequestHandlerContext
): Promise<void> {
  await withJournalGroup(nextJournalGroup(), async () => {
    try {
      await handleApiRequest(req, res, context);
    } finally {
      await flushDurableJournal().catch((err: unknown) => {
        const span = TelemetryService.createSpanContext("request_journal");
        context.telemetry.logStructured("ERROR", "Durable journal drain failed after response", span, {
          reason: err instanceof Error ? err.message : String(err),
        });
      });
    }
  });
}
