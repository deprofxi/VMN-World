# VMN Canary Deployment & Automated Rollback Runbook

**Authority:** VMNL-AZP-VMN-CCPP-001 §21 / VMNL-AZP-VMN-EXEC-001  
**Applies to:** Production & Staging Environments  
**Target RTO:** < 60 seconds rollback time with zero data loss

> **STATUS: TARGET (TODO-PRC-07, 2026-09-30).** The `kubectl` objects referenced below (`vmn-canary`, `vmn-app-service`, `infra/k8s/*`) DO NOT exist in this repository, and CI has no canary stage today. This runbook describes the target-state pipeline and is not evidence of an implemented pipeline. Preconditions to move this runbook from TARGET to OPERATIONAL: (1) committed deployment manifests or compose-based equivalents; (2) a CI canary stage wiring the §1 triggers to real telemetry (`/metrics` scrape already scaffolded via prometheus.yml); (3) a rehearsal drill with recorded timings; (4) named on-call owner. Deployment today is single-shot container builds (Dockerfile) with no automated rollback — incident response is manual per this procedure.

> **Rehearsal status (2026-10-15):** precondition **(3) is met for §3 only**, and §3.3 was rewritten from what the drill measured rather than what this file assumed — see `docs/audit/evidence/tsk51-rollback-rehearsal-2026-10-15/README.md`. Nothing else moved. §1 and §2 were **not** exercised: the `kubectl` objects they act on do not exist, so there is no canary to switch traffic away from and no telemetry path to trip a trigger. Precondition (1) is satisfied in the compose sense (`docker-compose.yml` is committed) but the stack was never brought up for this drill — no Docker binary on the machine used, the same blocker recorded against TSK-57 — so the rehearsal ran against scratch databases on the local PostgreSQL server, not a scratch deployment. Preconditions (2) and (4) are unmet and are not engineerable from this tree. **STATUS remains TARGET.**

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
3. If an emergency schema rollback is required, prefer a forward-fix migration. Reverting a
   migration means three ordered halves — the schema, then the journal, then the re-apply:

   ```bash
   # 1. revert the migration's own DDL, by hand, back to its pre-migration state.
   #    libpq rejects Prisma's ?schema= query parameter, so strip it from the URL first.
   psql "${DATABASE_URL%%\?*}" -f <manual-revert.sql>
   # 2. then tell Prisma it is rolled back
   pnpm prisma migrate resolve --rolled-back <migration_name>
   # 3. then move forward — deploy re-applies what is now pending
   pnpm prisma migrate deploy
   ```

   **Rehearsed 2026-10-15; step 2 on its own is not a rollback.** Executed on a scratch PostgreSQL
   18.3 database against `20261013142927_add_composite_keyset_indexes`, `migrate resolve --rolled-back`
   succeeded (exit 0) while the DDL was never reverted, because it only rewrites `_prisma_migrations`.
   The next `migrate deploy` then failed with `P3018` / SQLSTATE `42704`
   (`ERROR: index "BroadcastEpisode_programmeCode_idx" does not exist`) and the journal row went back
   to the failed state — following the command literally loops. This repository's migration SQL is
   not idempotent (bare `DROP INDEX` / `CREATE INDEX`, no `IF EXISTS`), which is what turns skipping
   step 1 into a loop rather than a cosmetic gap.

   If the migration failed mid-flight and the schema *is* already back to its pre-migration state,
   step 1 is already done, and `migrate status` prints both resolve options (rolled back, or
   `--applied` for the hotfix where the database was fixed forward by hand). Measured timings for
   the whole path (dirty journal → revert DDL → resolve → deploy): **11.44 s** wall on the local
   machine, of which the two Prisma CLI calls individually measured **5.22 s** (resolve) and
   **5.84 s** (deploy) — i.e. CLI and schema-engine startup, not database work, dominates; the
   `pg_dump -Fc` restore point itself measured **0.51 s** and the `pg_restore` **0.65 s**.
   Evidence, the exact scripts (`undo.sql`, `drill.sh`, `counterfactual.sh`) and the limitations:
   `docs/audit/evidence/tsk51-rollback-rehearsal-2026-10-15/README.md`.

---

## 4. Post-Rollback Verification Checklist

- [ ] Linear television transmission (StarTimes Ch 428, 430, 432) operating without interruption.
- [ ] Emergency filler has not been tripped.
- [ ] Commercial traffic logs continue recording aired spots.
- [ ] Azeebo+ federation webhooks draining without DLQ accumulation.
- [ ] Post-mortem report generated within 24 hours.
