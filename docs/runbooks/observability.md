# VMN Observability, Telemetry & OpenTelemetry Operations Guide

**Authority:** VMNL-AZP-VMN-CCPP-001 §19 / ADR-011  
**Target Coverage:** 100% Core Domain & Broadcast Endpoints

---

## 1. Observability Architecture

VMN employs a distributed observability architecture conforming to OpenTelemetry standards:

1. **Traces & Spans:** Every incoming HTTP request and asynchronous task is stamped with a unique `traceId` and `spanId`. These propagate downstream to S3 storage operations, database transactions, and outbound webhooks.
2. **Structured JSON Logs:** All logs are output in machine-readable JSON format with fields: `timestamp`, `level`, `message`, `traceId`, `spanId`, `component`.
3. **Metrics & SLIs:** Key service level indicators are recorded as Prometheus gauges and counters:
   - `http_requests_total`
   - `http_5xx_error_rate_percent`
   - `playout_api_latency_ms`
   - `traffic_break_fill_ratio`
   - `dlq_queue_depth`
   - `carrier_uptime_percent`
4. **OTLP/HTTP Exporter (T-21):** OpenTelemetry metric batches are exported via HTTP POST to `OTEL_EXPORTER_OTLP_ENDPOINT` (e.g. `http://localhost:4318/v1/metrics`).
5. **Webhook Alert Dispatcher (T-21):** When SLA thresholds breach, alerts are dispatched automatically via Slack/Teams compatible JSON webhooks configured via `ALERT_WEBHOOK_URL`.

---

## 2. Prometheus Alerting Rules

The rules are shipped as a real file — [`prometheus.rules.yml`](../../prometheus.rules.yml)
— mounted read-only into the `prometheus` compose service and loaded through
`rule_files` in [`prometheus.yml`](../../prometheus.yml). Change the rules there,
not in this document.

| Alert | Expression | Severity |
|:---|:---|:---|
| `High5xxErrorRate` | `http_5xx_error_rate_percent > 0.1`, for 60s | critical |
| `AuditDurabilityDegraded` | `delta(audit_durable_degraded_total[10m]) > 0` | critical |
| `KVBackendLoss` | `kv_backend_unhealthy > 0`, for 2m (series recorded on every `/readyz` probe) | critical |
| `FederationDeadLetterGrowth` | `delta(queue_total_dead_letter[15m]) > 0` | warning |
| `NotificationDeliveryFailing` | `delta(notification_email_failed_total[15m]) + delta(notification_sms_failed_total[15m]) > 0`, for 5m | warning |
| `WebhookDurabilityDegraded` | `delta(webhook_durable_claim_degraded_total[15m]) > 0` | critical |

`tests/unit/deployment-artifacts.test.ts` keeps the properties above true: every
alert named here exists in the shipped file, every metric named in an `expr` is
published by `src/` through `recordMetric(...)`, and the `prometheus` compose
service mounts the file.

**Recorded as TARGET (PR-21):** this section previously specified
`PlayoutDisconnect` on `playout_server_connected`, `ElevatedDlqBacklog` on
`dlq_queue_depth`, plus `carrier_uptime_percent` and `traffic_break_fill_ratio`
in §1.3. No code publishes any of those series — playout, carriage and the DLQ
have no integrated telemetry source — so the rules could never fire. They are
removed rather than restated, because an alert that cannot fire reads as
monitoring while providing none. Wiring them belongs with the same integration
work that owns playout/carriage telemetry (CLAUDE.md `<broadcast>`: inspect and
integrate the actual broadcast systems before representing them).

**Also TARGET:** no Alertmanager is configured, so these rules evaluate and are
visible in the Prometheus UI but are not routed to a receiver. The platform's
own rule engine dispatches to `ALERT_WEBHOOK_URL` (§1.5); deployment-side
routing needs the target's receiver, which this repository does not hold.

---

## 3. Incident Response & Pager Escalation

- **P1 (Broadcast Outage / Playout Failure):** On-call Master Control Engineer + Broadcast Director paged immediately (SLA: 5 min response).
- **P2 (Commercial Traffic Overlap / Billing Block):** Traffic Manager + Finance Lead paged (SLA: 15 min response).
- **P3 (Federation Webhook DLQ Elevation):** Integration Engineer alerted via Slack (SLA: 1 hour response).

---

## 4. Grafana Dashboard Specification (Generated from Metrics)

To visualize metrics in Grafana, import the following dashboard definition:

```json
{
  "annotations": { "list": [] },
  "editable": true,
  "fiscalYearStartMonth": 0,
  "graphTooltip": 0,
  "id": null,
  "links": [],
  "liveNow": false,
  "panels": [
    {
      "title": "HTTP 5xx Error Rate (%)",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 },
      "targets": [{ "expr": "http_5xx_error_rate_percent", "legendFormat": "{{channel}}" }],
      "thresholds": {
        "mode": "absolute",
        "steps": [
          { "color": "green", "value": null },
          { "color": "red", "value": 0.1 }
        ]
      }
    },
    {
      "title": "Playout API Latency (ms)",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 12, "x": 12, "y": 0 },
      "targets": [{ "expr": "playout_api_latency_ms", "legendFormat": "{{channel}}" }],
      "thresholds": {
        "mode": "absolute",
        "steps": [
          { "color": "green", "value": null },
          { "color": "yellow", "value": 500 }
        ]
      }
    },
    {
      "title": "Azeebo+ Federation DLQ Queue Depth",
      "type": "stat",
      "gridPos": { "h": 6, "w": 8, "x": 0, "y": 8 },
      "targets": [{ "expr": "dlq_queue_depth", "legendFormat": "DLQ Depth" }]
    },
    {
      "title": "EPG Syndication Generation Total",
      "type": "stat",
      "gridPos": { "h": 6, "w": 8, "x": 8, "y": 8 },
      "targets": [{ "expr": "epg_syndication_generation_total", "legendFormat": "Generated Feeds" }]
    },
    {
      "title": "Active Channel Viewers",
      "type": "timeseries",
      "gridPos": { "h": 6, "w": 8, "x": 16, "y": 8 },
      "targets": [{ "expr": "active_viewers", "legendFormat": "{{channel}}" }]
    }
  ],
  "refresh": "5s",
  "schemaVersion": 38,
  "style": "dark",
  "tags": ["vmnl", "broadcast", "telemetry"],
  "time": { "from": "now-6h", "to": "now" },
  "timepicker": {},
  "timezone": "Africa/Lagos",
  "title": "VMNL Enterprise Playout & Operations Dashboard",
  "uid": "vmnl-ops-001",
  "version": 1
}
```
