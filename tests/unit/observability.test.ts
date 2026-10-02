import { describe, expect, it } from "vitest";
import http from "node:http";
import {
  TelemetryService,
  AlertDispatchAdapter,
  AlertDispatchPayload,
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

  it("exports metrics batch to local mock OTLP endpoint over HTTP (T-21, B-19)", async () => {
    let receivedPayload: any = null;

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

  it("exports Prometheus formatted metrics (T-21)", () => {
    const telemetry = new TelemetryService();
    telemetry.recordMetric("active_streams", 120, { region: "lagos" });

    const prom = telemetry.exportPrometheusMetrics();
    expect(prom).toContain("# HELP vmnl_system_metrics");
    expect(prom).toContain('active_streams{region="lagos"} 120');
  });
});
