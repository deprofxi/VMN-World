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
