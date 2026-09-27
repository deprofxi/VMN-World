import { describe, expect, it } from "vitest";
import { TelemetryService } from "../../src/core/observability/index.js";

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
});
