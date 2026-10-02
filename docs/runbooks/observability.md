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

```yaml
groups:
  - name: vmn_broadcast_critical
    rules:
      - alert: PlayoutDisconnect
        expr: playout_server_connected == 0
        for: 15s
        labels:
          severity: critical
        annotations:
          summary: "Playout automation server disconnected for channel {{ $labels.channel }}"

      - alert: High5xxErrorRate
        expr: http_5xx_error_rate_percent > 0.1
        for: 60s
        labels:
          severity: critical
        annotations:
          summary: "HTTP 5xx error rate exceeded 0.1% SLA threshold"

      - alert: ElevatedDlqBacklog
        expr: dlq_queue_depth > 10
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Azeebo+ federation DLQ backlog exceeded 10 items"
```

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
