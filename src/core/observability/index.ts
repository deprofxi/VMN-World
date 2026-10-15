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
import { isIP } from "node:net";

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

function isIpLiteral(hostname: string): boolean {
  return isIP(hostname.replace(/^\[|\]$/g, "")) !== 0;
}

export type ExporterPurpose = "otel" | "alert";

export function isAllowedExporterUrl(value: string, purpose: ExporterPurpose = "otel"): boolean {
  let url: URL;
  try { url = new URL(value); } catch { return false; }
  if (url.username || url.password || !["http:", "https:"].includes(url.protocol)) return false;
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const localHostAllowed = ["development", "test"].includes(process.env.NODE_ENV || "development") &&
    (host === "localhost" || host === "127.0.0.1" || host === "::1");
  if (localHostAllowed) return true;
  if (url.protocol !== "https:") return false;
  // Reject IP literals outside the explicit local dev/test exception. This
  // avoids private-range parsing gaps and DNS rebinding assumptions.
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || isIpLiteral(host)) return false;
  const allowedHostSetting = purpose === "alert" ? process.env.ALERT_WEBHOOK_ALLOWED_HOSTS : process.env.OTEL_ALLOWED_HOSTS;
  const configuredHosts = (allowedHostSetting || "")
    .split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  return configuredHosts.includes(host);
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

      if (!isAllowedExporterUrl(this.webhookUrl, "alert")) return false;
      const res = await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: AbortSignal.timeout(5_000),
      });
      return res.ok;
    } catch {
      console.error("[VMNL-ALERT-ERR] Failed to dispatch alert to configured webhook");
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
    const allowedTagKeys = new Set(["status", "channel", "region", "component", "event", "operation", "backend", "queue"]);
    const safeTags = Object.fromEntries(Object.entries(tags)
      .filter(([key]) => allowedTagKeys.has(key))
      .slice(0, 5)
      .map(([key, tagValue]) => [key, String(tagValue).replace(/[^a-zA-Z0-9_.-]/g, "_").slice(0, 48)]));
    const point: MetricPoint = {
      name: name.replace(/[^a-zA-Z0-9_:]/g, "_").slice(0, 100),
      value: Number.isFinite(value) ? value : 0,
      tags: safeTags,
      timestamp: new Date(),
    };
    this.metrics.push(point);
    if (this.metrics.length > 1000) this.metrics.splice(0, this.metrics.length - 1000);

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
    const serialized = JSON.stringify(payload);
    // AUD-16: a log line that is built but never emitted is not an observable
    // signal. WARN/ERROR previously reached nowhere (every caller discarded
    // the return value); emit every level to stdout as one JSON line so
    // container log drains, journaling and OTLP log pipelines receive them.
    console.log(serialized);
    return serialized;
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

    // Rule 4: Durable audit ledger degradation (TSK-18)
    if (point.name === "audit_durable_degraded_total" && point.value > 0) {
      triggered = {
        ruleName: "AUDIT_DURABLE_PERSISTENCE_DEGRADED",
        severity: "CRITICAL",
        message: `Audit ledger durable write rolled back with its transaction; ledger degraded to in-memory (prisma_error): ${point.value} entry(ies) affected`,
        metricValue: point.value,
        threshold: 0,
        triggeredAt: new Date(),
      };
    }

    if (triggered) {
      this.alertTriggers.push(triggered);
      if (this.alertTriggers.length > 100) this.alertTriggers.shift();
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
    const latestBySeries = new Map<string, MetricPoint>();
    for (const point of this.metrics) latestBySeries.set(`${point.name}:${JSON.stringify(point.tags)}`, point);
    const lines: string[] = [
      "# HELP vmnl_system_metrics Prometheus metrics exporter for VMNL Enterprise Platform",
      "# TYPE vmnl_system_metrics gauge",
    ];
    const grouped: Record<string, MetricPoint[]> = {};
    for (const m of latestBySeries.values()) {
      if (!grouped[m.name]) grouped[m.name] = [];
      grouped[m.name].push(m);
    }
    for (const [name, points] of Object.entries(grouped)) {
      lines.push(`# TYPE ${name} gauge`);
      for (const p of points) {
        const escapeLabelValue = (value: string): string =>
          value.replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll('"', '\\"');
        const tagEntries = Object.entries(p.tags)
          .map(([k, v]) => `${k}="${escapeLabelValue(v)}"`)
          .join(",");
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
      if (!isAllowedExporterUrl(targetUrl)) return { success: false, exportedCount: this.metrics.length };
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(otlpPayload),
        signal: AbortSignal.timeout(5_000),
      });
      return { success: res.ok, exportedCount: this.metrics.length };
    } catch {
      return { success: false, exportedCount: this.metrics.length };
    }
  }

  /**
   * Exports trace spans as OpenTelemetry OTLP/HTTP JSON payload (Phase 4 / OTLP Traces).
   */
  public async exportOtlpTracesHttp(
    spans: Array<{ context: LogContext; name: string; durationMs: number; attributes?: Record<string, unknown> }>,
    endpoint?: string
  ): Promise<{ success: boolean; exportedCount: number }> {
    const targetUrl =
      endpoint ||
      (this.otlpEndpoint
        ? `${this.otlpEndpoint.replace(/\/v1\/metrics$/, "")}/v1/traces`
        : "http://localhost:4318/v1/traces");
    const otlpPayload = {
      resourceSpans: [
        {
          resource: {
            attributes: [
              { key: "service.name", value: { stringValue: "vmnl-enterprise-orchestrator" } },
              { key: "deployment.environment", value: { stringValue: process.env.NODE_ENV || "production" } },
            ],
          },
          scopeSpans: [
            {
              scope: { name: "vmnl.tracing" },
              spans: spans.map((s) => ({
                traceId: s.context.traceId.replace(/-/g, "").padEnd(32, "0").substring(0, 32),
                spanId: s.context.spanId.replace(/-/g, "").padEnd(16, "0").substring(0, 16),
                name: s.name,
                kind: 1, // SPAN_KIND_INTERNAL
                startTimeUnixNano: String((Date.now() - s.durationMs) * 1_000_000),
                endTimeUnixNano: String(Date.now() * 1_000_000),
                attributes: Object.entries(s.attributes || {}).map(([k, v]) => ({
                  key: k,
                  value: typeof v === "number" ? { intValue: v } : { stringValue: String(v) },
                })),
              })),
            },
          ],
        },
      ],
    };

    try {
      if (!isAllowedExporterUrl(targetUrl)) return { success: false, exportedCount: spans.length };
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(otlpPayload),
        signal: AbortSignal.timeout(5_000),
      });
      return { success: res.ok, exportedCount: spans.length };
    } catch {
      return { success: false, exportedCount: spans.length };
    }
  }
}
