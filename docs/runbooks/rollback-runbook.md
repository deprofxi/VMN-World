# VMN Canary Deployment & Automated Rollback Runbook

**Authority:** VMNL-AZP-VMN-CCPP-001 §21 / VMNL-AZP-VMN-EXEC-001  
**Applies to:** Production & Staging Environments  
**Target RTO:** < 60 seconds rollback time with zero data loss

> **STATUS: TARGET (TODO-PRC-07, 2026-09-30).** The `kubectl` objects referenced below (`vmn-canary`, `vmn-app-service`, `infra/k8s/*`) DO NOT exist in this repository, and CI has no canary stage today. This runbook describes the target-state pipeline and is not evidence of an implemented pipeline. Preconditions to move this runbook from TARGET to OPERATIONAL: (1) committed deployment manifests or compose-based equivalents; (2) a CI canary stage wiring the §1 triggers to real telemetry (`/metrics` scrape already scaffolded via prometheus.yml); (3) a rehearsal drill with recorded timings; (4) named on-call owner. Deployment today is single-shot container builds (Dockerfile) with no automated rollback — incident response is manual per this procedure.

---

## 1. Automated Rollback Triggers

Canary deployments are routed 10% traffic for the first 15 minutes. The deployment pipeline halts and automatically executes a rollback if any of the following telemetry breaches occur:

1. **HTTP 5xx Error Rate:** Exceeds `0.1%` over a 60-second window.
2. **API P95 Latency:** Degrades by more than `50%` compared to the pre-deployment baseline (or absolute P95 > 500ms).
3. **Playout Sync Drift:** Any schedule drift > 0 frames detected on master control automation playlist generator.
4. **Circuit Breaker Trip:** Federation bridge trips to `OPEN` state due to deployment schema incompatibilities.

---

## 2. Automated Rollback Sequence

When an automated trigger fires or an on-call operator initiates rollback:

```bash
# 1. Immediate Traffic Switchback to Stable Green Target
kubectl set selector service/vmn-app-service -n production app.kubernetes.io/version=stable-previous

# 2. Halt Canary Pod Replicas
kubectl scale deployment/vmn-canary -n production --replicas=0

# 3. Verify Playout Automation Continuity
# Ensure broadcast playlist generation continues from local cache
curl -s -f http://master-control.internal:3000/health/playout

# 4. Notify Engineering War Room & On-Call Incident Lead
# Automated alert dispatched to PagerDuty & #incident-ops Slack
```

---

## 3. Database Migration Safety & Backwards Compatibility

1. **Expand/Contract Pattern:** Database schema migrations must ALWAYS be backward-compatible with the running `N-1` application version.
2. **No Destructive Drops:** Column renames or table drops must occur in subsequent releases after the code utilizing the column has been retired.
3. If an emergency schema rollback is required, use Prisma down-migrations or forward-fix migrations:
   ```bash
   pnpm prisma migrate resolve --rolled-back <migration_name>
   ```

---

## 4. Post-Rollback Verification Checklist

- [ ] Linear television transmission (StarTimes Ch 428, 430, 432) operating without interruption.
- [ ] Emergency filler has not been tripped.
- [ ] Commercial traffic logs continue recording aired spots.
- [ ] Azeebo+ federation webhooks draining without DLQ accumulation.
- [ ] Post-mortem report generated within 24 hours.
