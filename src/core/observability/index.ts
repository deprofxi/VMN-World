/**
 * VMN Observability, Telemetry & OpenTelemetry Instrumentation
 * Authority: VMNL-AZP-VMN-CCPP-001 §19 / VMNL-AZP-VMN-BRD-PRD-001 — R1.2A
 *
 * Core Mandate:
 * Structured JSON logging with trace/span correlation.
 * Metric counters and histograms (latency, error rate, queue depth).
 * Automated alerting rules triggering alerts on SLAs (5xx rate > 0.1%, latency > 500ms).
 * OTLP/HTTP export and webhook alert dispatching (T-21, B-19).
 */

import { randomUUID } from "node:crypto";

export interface LogContext {
  traceId: string;
  spanId: string;
  userId?: string;
  channelId?: string;
  component: string;
}

export interface MetricPoint {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: Date;
}

export interface AlertTrigger {
  ruleName: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  message: string;
  metricValue: number;
  threshold: number;
  triggeredAt: Date;
}

export interface AlertDispatchPayload {
  ruleName: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  message: string;
  metricValue: number;
  threshold: number;
  triggeredAt: string;
  text?: string;
}

export interface AlertDispatchAdapter {
  dispatchAlert(payload: AlertDispatchPayload): Promise<boolean>;
}

export class ConsoleAlertDispatchAdapter implements AlertDispatchAdapter {
  public async dispatchAlert(payload: AlertDispatchPayload): Promise<boolean> {
    console.warn(`[VMNL-ALERT] [${payload.severity}] ${payload.ruleName}: ${payload.message}`);
    return true;
  }
}

export class WebhookAlertDispatchAdapter implements AlertDispatchAdapter {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  public async dispatchAlert(payload: AlertDispatchPayload): Promise<boolean> {
    try {
      const body = JSON.stringify({
        text: `*[VMNL Alert - ${payload.severity}]* ${payload.ruleName}\n>${payload.message}\n_Metric: ${payload.metricValue} | Threshold: ${payload.threshold} | ${payload.triggeredAt}_`,
        ...payload,
      });

      const res = await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      return res.ok;
    } catch (err: any) {
      console.error(`[VMNL-ALERT-ERR] Failed to dispatch alert to webhook ${this.webhookUrl}: ${err.message}`);
      return false;
    }
  }
}

export interface TelemetryServiceOptions {
  alertDispatcher?: AlertDispatchAdapter;
  otlpEndpoint?: string;
}

export class TelemetryService {
  private metrics: MetricPoint[] = [];
  private alertTriggers: AlertTrigger[] = [];
  private alertDispatcher: AlertDispatchAdapter;
  private otlpEndpoint?: string;

  constructor(options: TelemetryServiceOptions = {}) {
    const defaultWebhook = process.env.ALERT_WEBHOOK_URL;
    this.alertDispatcher =
      options.alertDispatcher ||
      (defaultWebhook ? new WebhookAlertDispatchAdapter(defaultWebhook) : new ConsoleAlertDispatchAdapter());
    this.otlpEndpoint = options.otlpEndpoint || process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  }

  public static createSpanContext(component: string, existingTraceId?: string): LogContext {
    return {
      traceId: existingTraceId || randomUUID(),
      spanId: randomUUID().substring(0, 16),
      component,
    };
  }

  public recordMetric(name: string, value: number, tags: Record<string, string> = {}): MetricPoint {
    const point: MetricPoint = {
      name,
      value,
      tags,
      timestamp: new Date(),
    };
    this.metrics.push(point);

    // Check automated alert rules
    this.evaluateAlertRules(point);
    return point;
  }

  public logStructured(
    level: "INFO" | "WARN" | "ERROR",
    message: string,
    context: LogContext,
    extra: Record<string, unknown> = {}
  ): string {
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      message,
      traceId: context.traceId,
      spanId: context.spanId,
      component: context.component,
      ...extra,
    };
    return JSON.stringify(payload);
  }

  private evaluateAlertRules(point: MetricPoint): void {
    let triggered: AlertTrigger | null = null;

    // Rule 1: HTTP 5xx Error Rate > 0.1%
    if (point.name === "http_5xx_error_rate_percent" && point.value > 0.1) {
      triggered = {
        ruleName: "HIGH_5XX_ERROR_RATE",
        severity: "CRITICAL",
        message: `HTTP 5xx error rate exceeded threshold: ${point.value}% > 0.1%`,
        metricValue: point.value,
        threshold: 0.1,
        triggeredAt: new Date(),
      };
    }

    // Rule 2: Playout Latency > 500ms
    if (point.name === "playout_api_latency_ms" && point.value > 500) {
      triggered = {
        ruleName: "PLAYOUT_LATENCY_DEGRADATION",
        severity: "WARNING",
        message: `Playout API latency elevated: ${point.value}ms > 500ms`,
        metricValue: point.value,
        threshold: 500,
        triggeredAt: new Date(),
      };
    }

    // Rule 3: Dead Letter Queue depth > 10
    if (point.name === "dlq_queue_depth" && point.value > 10) {
      triggered = {
        ruleName: "ELEVATED_DLQ_DEPTH",
        severity: "CRITICAL",
        message: `Azeebo+ federation DLQ backlog exceeded threshold: ${point.value} items > 10`,
        metricValue: point.value,
        threshold: 10,
        triggeredAt: new Date(),
      };
    }

    if (triggered) {
      this.alertTriggers.push(triggered);
      const payload: AlertDispatchPayload = {
        ruleName: triggered.ruleName,
        severity: triggered.severity,
        message: triggered.message,
        metricValue: triggered.metricValue,
        threshold: triggered.threshold,
        triggeredAt: triggered.triggeredAt.toISOString(),
      };
      // Dispatch alert asynchronously
      this.alertDispatcher.dispatchAlert(payload).catch(() => {});
    }
  }

  public getAlertTriggers(): AlertTrigger[] {
    return [...this.alertTriggers];
  }

  public getMetrics(): MetricPoint[] {
    return [...this.metrics];
  }

  public exportPrometheusMetrics(): string {
    const lines: string[] = [
      "# HELP vmnl_system_metrics Prometheus metrics exporter for VMNL Enterprise Platform",
      "# TYPE vmnl_system_metrics gauge",
    ];
    const grouped: Record<string, MetricPoint[]> = {};
    for (const m of this.metrics) {
      if (!grouped[m.name]) grouped[m.name] = [];
      grouped[m.name].push(m);
    }
    for (const [name, points] of Object.entries(grouped)) {
      lines.push(`# TYPE ${name} gauge`);
      for (const p of points) {
        const tagEntries = Object.entries(p.tags).map(([k, v]) => `${k}="${v}"`).join(",");
        const formattedTags = tagEntries ? `{${tagEntries}}` : "";
        lines.push(`${name}${formattedTags} ${p.value}`);
      }
    }
    return lines.join("\n");
  }

  /**
   * Exports recorded metrics as OpenTelemetry OTLP/HTTP JSON payload (T-21, B-19).
   */
  public async exportOtlpMetricsHttp(endpoint?: string): Promise<{ success: boolean; exportedCount: number }> {
    const targetUrl = endpoint || this.otlpEndpoint || "http://localhost:4318/v1/metrics";
    const otlpPayload = {
      resourceMetrics: [
        {
          resource: {
            attributes: [
              { key: "service.name", value: { stringValue: "vmnl-enterprise-orchestrator" } },
              { key: "deployment.environment", value: { stringValue: process.env.NODE_ENV || "production" } },
            ],
          },
          scopeMetrics: [
            {
              scope: { name: "vmnl.observability" },
              metrics: this.metrics.map((m) => ({
                name: m.name,
                gauge: {
                  dataPoints: [
                    {
                      asDouble: m.value,
                      timeUnixNano: String(m.timestamp.getTime() * 1_000_000),
                      attributes: Object.entries(m.tags).map(([k, v]) => ({
                        key: k,
                        value: { stringValue: v },
                      })),
                    },
                  ],
                },
              })),
            },
          ],
        },
      ],
    };

    try {
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(otlpPayload),
      });
      return { success: res.ok, exportedCount: this.metrics.length };
    } catch {
      return { success: false, exportedCount: this.metrics.length };
    }
  }
}
