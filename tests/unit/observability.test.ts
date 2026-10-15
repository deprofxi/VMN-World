import { describe, expect, it } from "vitest";
import http from "node:http";
import {
  TelemetryService,
  AlertDispatchAdapter,
  AlertDispatchPayload,
  isAllowedExporterUrl,
} from "../../src/core/observability/index.js";

describe("Phase 10: Observability & OpenTelemetry Instrumentation", () => {
  it("generates trace contexts, outputs structured logs, and triggers automated SLA alerts", () => {
    const telemetry = new TelemetryService();

    // 1. Trace Context
    const spanContext = TelemetryService.createSpanContext("BROADCAST_PLAYOUT");
    expect(spanContext.traceId).toBeDefined();
    expect(spanContext.spanId).toBeDefined();
    expect(spanContext.component).toBe("BROADCAST_PLAYOUT");

    // 2. Structured JSON Log
    const logStr = telemetry.logStructured(
      "INFO",
      "Automation playlist loaded for StarTimes DTT",
      spanContext,
      { channel: "NXTR", itemCount: 48 }
    );
    const parsedLog = JSON.parse(logStr);
    expect(parsedLog.level).toBe("INFO");
    expect(parsedLog.traceId).toBe(spanContext.traceId);
    expect(parsedLog.channel).toBe("NXTR");

    // 3. Normal Metric -> No alerts
    telemetry.recordMetric("http_5xx_error_rate_percent", 0.02);
    expect(telemetry.getAlertTriggers().length).toBe(0);

    // 4. SLA Breach Alert: HTTP 5xx Error Rate > 0.1%
    telemetry.recordMetric("http_5xx_error_rate_percent", 0.15);
    const alerts = telemetry.getAlertTriggers();
    expect(alerts.length).toBe(1);
    expect(alerts[0].ruleName).toBe("HIGH_5XX_ERROR_RATE");
    expect(alerts[0].severity).toBe("CRITICAL");

    // 5. Warning Alert: Playout Latency > 500ms
    telemetry.recordMetric("playout_api_latency_ms", 650);
    expect(telemetry.getAlertTriggers().length).toBe(2);
    expect(telemetry.getAlertTriggers()[1].ruleName).toBe("PLAYOUT_LATENCY_DEGRADATION");

    // 6. Critical Alert: DLQ Depth > 10
    telemetry.recordMetric("dlq_queue_depth", 25);
    expect(telemetry.getAlertTriggers().length).toBe(3);
    expect(telemetry.getAlertTriggers()[2].ruleName).toBe("ELEVATED_DLQ_DEPTH");
  });

  it("dispatches alert payloads to configured AlertDispatchAdapter on breach (T-21, B-19)", async () => {
    const dispatchedPayloads: AlertDispatchPayload[] = [];
    const mockDispatcher: AlertDispatchAdapter = {
      async dispatchAlert(payload) {
        dispatchedPayloads.push(payload);
        return true;
      },
    };

    const telemetry = new TelemetryService({ alertDispatcher: mockDispatcher });
    telemetry.recordMetric("http_5xx_error_rate_percent", 0.25);

    // Wait a tick for async dispatch
    await new Promise((r) => setTimeout(r, 10));

    expect(dispatchedPayloads.length).toBe(1);
    expect(dispatchedPayloads[0].ruleName).toBe("HIGH_5XX_ERROR_RATE");
    expect(dispatchedPayloads[0].severity).toBe("CRITICAL");
    expect(dispatchedPayloads[0].metricValue).toBe(0.25);
  });

  /**
   * TSK-18 (box 3): the durable audit ledger now fails closed — a ledger row
   * whose transaction aborts is rolled back with the business row it attests, and
   * the server reports it as `audit_durable_degraded_total`. Without a rule the
   * fact would stop at stdout, so a silently degraded ledger could serve an
   * operator who believed it was durable.
   */
  it("alerts when the durable audit ledger degrades, and only on a real degradation", async () => {
    const dispatched: AlertDispatchPayload[] = [];
    const dispatcher: AlertDispatchAdapter = {
      async dispatchAlert(payload) {
        dispatched.push(payload);
        return true;
      },
    };
    const telemetry = new TelemetryService({ alertDispatcher: dispatcher });

    // A healthy ledger emits nothing.
    telemetry.recordMetric("audit_durable_degraded_total", 0, { component: "audit" });
    expect(telemetry.getAlertTriggers().length).toBe(0);

    telemetry.recordMetric("audit_durable_degraded_total", 1, { component: "audit" });
    const alerts = telemetry.getAlertTriggers();
    expect(alerts.length).toBe(1);
    expect(alerts[0].ruleName).toBe("AUDIT_DURABLE_PERSISTENCE_DEGRADED");
    expect(alerts[0].severity).toBe("CRITICAL");
    expect(alerts[0].message).toContain("prisma_error");

    await new Promise((r) => setTimeout(r, 10));
    expect(dispatched.length).toBe(1);
    expect(dispatched[0].ruleName).toBe("AUDIT_DURABLE_PERSISTENCE_DEGRADED");

    // The counter is exported, so the degradation is scrapeable as well as paged.
    expect(telemetry.exportPrometheusMetrics()).toContain("audit_durable_degraded_total{component=\"audit\"} 1");
  });

  it("exports metrics batch to local mock OTLP endpoint over HTTP (T-21, B-19)", async () => {    let receivedPayload: any = null;

    const mockOtlpServer = http.createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        receivedPayload = JSON.parse(body);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "success" }));
      });
    });

    await new Promise<void>((resolve) => mockOtlpServer.listen(0, "127.0.0.1", resolve));
    const address = mockOtlpServer.address() as { port: number };
    const endpoint = `http://127.0.0.1:${address.port}/v1/metrics`;

    try {
      const telemetry = new TelemetryService({ otlpEndpoint: endpoint });
      telemetry.recordMetric("epg_syndication_total", 42, { channel: "NXTR" });
      telemetry.recordMetric("active_viewers", 15400, { channel: "NXTR" });

      const result = await telemetry.exportOtlpMetricsHttp(endpoint);
      expect(result.success).toBe(true);
      expect(result.exportedCount).toBe(2);

      expect(receivedPayload).not.toBeNull();
      expect(receivedPayload.resourceMetrics[0].scopeMetrics[0].metrics.length).toBe(2);
      expect(receivedPayload.resourceMetrics[0].scopeMetrics[0].metrics[0].name).toBe("epg_syndication_total");
    } finally {
      await new Promise<void>((resolve) => mockOtlpServer.close(() => resolve()));
    }
  });

  it("uses separate OTLP and alert-webhook host allowlists", () => {
    const originalEnv = {
      nodeEnv: process.env.NODE_ENV,
      otelHosts: process.env.OTEL_ALLOWED_HOSTS,
      webhookHosts: process.env.ALERT_WEBHOOK_ALLOWED_HOSTS,
    };
    process.env.NODE_ENV = "production";
    process.env.OTEL_ALLOWED_HOSTS = "otel.example";
    process.env.ALERT_WEBHOOK_ALLOWED_HOSTS = "alerts.example";
    try {
      expect(isAllowedExporterUrl("https://otel.example/v1/metrics", "otel")).toBe(true);
      expect(isAllowedExporterUrl("https://alerts.example/hook", "alert")).toBe(true);
      expect(isAllowedExporterUrl("https://otel.example/hook", "alert")).toBe(false);
      expect(isAllowedExporterUrl("https://alerts.example/v1/metrics", "otel")).toBe(false);
    } finally {
      if (originalEnv.nodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalEnv.nodeEnv;
      if (originalEnv.otelHosts === undefined) delete process.env.OTEL_ALLOWED_HOSTS;
      else process.env.OTEL_ALLOWED_HOSTS = originalEnv.otelHosts;
      if (originalEnv.webhookHosts === undefined) delete process.env.ALERT_WEBHOOK_ALLOWED_HOSTS;
      else process.env.ALERT_WEBHOOK_ALLOWED_HOSTS = originalEnv.webhookHosts;
    }
  });

  it("rejects private, loopback, link-local, and unapproved exporter destinations", () => {
    const originalEnv = {
      nodeEnv: process.env.NODE_ENV,
      otelHosts: process.env.OTEL_ALLOWED_HOSTS,
      webhookHosts: process.env.ALERT_WEBHOOK_ALLOWED_HOSTS,
    };
    process.env.NODE_ENV = "production";
    process.env.OTEL_ALLOWED_HOSTS = "10.1.2.3,127.0.0.1,169.254.10.20,192.168.1.2,172.31.4.5,example.com,[::1],[fd00::1]";
    delete process.env.ALERT_WEBHOOK_ALLOWED_HOSTS;
    try {
      for (const url of [
        "https://10.1.2.3/metrics",
        "https://127.0.0.1/metrics",
        "https://169.254.10.20/metrics",
        "https://192.168.1.2/metrics",
        "https://172.31.4.5/metrics",
        "https://[::1]/metrics",
        "https://[fd00::1]/metrics",
        "https://[2002:7f00:1::]/metrics",
        "https://unlisted.example/metrics",
        "http://example.com/metrics",
      ]) {
        expect(isAllowedExporterUrl(url), url).toBe(false);
      }
      process.env.NODE_ENV = "test";
      expect(isAllowedExporterUrl("http://127.0.0.1:4318/v1/metrics")).toBe(true);
      expect(isAllowedExporterUrl("https://example.com/v1/metrics")).toBe(true);
    } finally {
      if (originalEnv.nodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalEnv.nodeEnv;
      if (originalEnv.otelHosts === undefined) delete process.env.OTEL_ALLOWED_HOSTS;
      else process.env.OTEL_ALLOWED_HOSTS = originalEnv.otelHosts;
      if (originalEnv.webhookHosts === undefined) delete process.env.ALERT_WEBHOOK_ALLOWED_HOSTS;
      else process.env.ALERT_WEBHOOK_ALLOWED_HOSTS = originalEnv.webhookHosts;
    }
  });

  it("exports Prometheus formatted metrics with escaped label values (T-21)", () => {
    const telemetry = new TelemetryService();
    telemetry.recordMetric("active_streams", 120, { region: 'lagos"\\west\nline' });

    const prom = telemetry.exportPrometheusMetrics();
    expect(prom).toContain("# HELP vmnl_system_metrics");
    expect(prom).toContain('active_streams{region="lagos__west_line"} 120');
  });

  it("keeps metric label cardinality bounded and does not label unhandled errors by raw path", async () => {
    const telemetry = new TelemetryService();
    for (let i = 0; i < 1_100; i++) telemetry.recordMetric("http_requests_total", 1, { status: "200" });
    expect(telemetry.getMetrics()).toHaveLength(1_000);

    const source = await import("node:fs/promises");
    const routerSource = await source.readFile(new URL("../../src/api/router.ts", import.meta.url), "utf8");
    expect(routerSource).toContain('operation: "unhandled_route_error"');
    expect(routerSource).not.toContain('{ path: pathname });');
  });

  it("exports OpenTelemetry OTLP/HTTP traces payload (Phase 4 / OTLP Traces)", async () => {
    let receivedTracePayload: any = null;
    const mockTraceServer = http.createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        receivedTracePayload = JSON.parse(body);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "success" }));
      });
    });

    await new Promise<void>((resolve) => mockTraceServer.listen(0, "127.0.0.1", resolve));
    const address = mockTraceServer.address() as { port: number };
    const endpoint = `http://127.0.0.1:${address.port}/v1/traces`;

    try {
      const telemetry = new TelemetryService({ otlpEndpoint: endpoint });
      const spanContext = TelemetryService.createSpanContext("api_router", "test-trace-id-12345");
      const result = await telemetry.exportOtlpTracesHttp(
        [
          {
            context: spanContext,
            name: "HTTP GET /api/v1/broadcast/channels",
            durationMs: 45,
            attributes: { "http.status_code": 200, "http.method": "GET" },
          },
        ],
        endpoint
      );

      expect(result.success).toBe(true);
      expect(result.exportedCount).toBe(1);
      expect(receivedTracePayload).not.toBeNull();
      expect(receivedTracePayload.resourceSpans[0].scopeSpans[0].spans.length).toBe(1);
      expect(receivedTracePayload.resourceSpans[0].scopeSpans[0].spans[0].name).toBe(
        "HTTP GET /api/v1/broadcast/channels"
      );
    } finally {
      await new Promise<void>((resolve) => mockTraceServer.close(() => resolve()));
    }
  });
});
