/**
 * VMN Observability, Telemetry & OpenTelemetry Instrumentation
 * Authority: VMNL-AZP-VMN-CCPP-001 §19 / VMNL-AZP-VMN-BRD-PRD-001 — R1.2A
 *
 * Core Mandate:
 * Structured JSON logging with trace/span correlation.
 * Metric counters and histograms (latency, error rate, queue depth).
 * Automated alerting rules triggering alerts on SLAs (5xx rate > 0.1%, latency > 500ms).
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

export class TelemetryService {
  private metrics: MetricPoint[] = [];
  private alertTriggers: AlertTrigger[] = [];

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
    // Rule 1: HTTP 5xx Error Rate > 0.1%
    if (point.name === "http_5xx_error_rate_percent" && point.value > 0.1) {
      this.alertTriggers.push({
        ruleName: "HIGH_5XX_ERROR_RATE",
        severity: "CRITICAL",
        message: `HTTP 5xx error rate exceeded threshold: ${point.value}% > 0.1%`,
        metricValue: point.value,
        threshold: 0.1,
        triggeredAt: new Date(),
      });
    }

    // Rule 2: Playout Latency > 500ms
    if (point.name === "playout_api_latency_ms" && point.value > 500) {
      this.alertTriggers.push({
        ruleName: "PLAYOUT_LATENCY_DEGRADATION",
        severity: "WARNING",
        message: `Playout API latency elevated: ${point.value}ms > 500ms`,
        metricValue: point.value,
        threshold: 500,
        triggeredAt: new Date(),
      });
    }

    // Rule 3: Dead Letter Queue depth > 10
    if (point.name === "dlq_queue_depth" && point.value > 10) {
      this.alertTriggers.push({
        ruleName: "ELEVATED_DLQ_DEPTH",
        severity: "CRITICAL",
        message: `Azeebo+ federation DLQ backlog exceeded threshold: ${point.value} items > 10`,
        metricValue: point.value,
        threshold: 10,
        triggeredAt: new Date(),
      });
    }
  }

  public getAlertTriggers(): AlertTrigger[] {
    return [...this.alertTriggers];
  }

  public getMetrics(): MetricPoint[] {
    return [...this.metrics];
  }
}
