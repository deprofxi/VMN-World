# VMN Disaster Recovery & Business Continuity Runbook

**Authority:** VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §57 / VMNL-AZP-VMN-CCPP-001 §20  
**Recovery Objectives:** RPO < 5 minutes (TARGET) | RTO < 15 minutes (TARGET)
**Status (TODO-DOC-03 / TODO-PRC-08):** Database name corrected to the canonical sandbox `vmn_enterprise` (ADR-013 supersession). The `kubectl`/`infra/k8s` objects in Scenario A are TARGET-state procedure — no Kubernetes manifests exist in this repository (see `docs/runbooks/rollback-runbook.md` TARGET note). Backup automation that DOES exist today is the compose-hosted `vmnl-postgres-backup` service (docker/backups/), whose first measured RPO/RTO drill evidence is PENDING.

---

## 1. Business Continuity Architecture

In accordance with R1.2A §57, Virtual Media Network Limited targets 24/7/365 uninterrupted broadcast transmission even during total cloud datacenter loss or central database outages. Item 1 below is a CONTRACT + SIMULATOR only today (TODO-BCST-06: `PlayoutAutomationEngine.evaluateAutonomousCacheContract` / `simulateDrill20CacheOutage`); physical playout servers at StarTimes uplink centres are not operated by this codebase:

1. **48-Hour Autonomous Playout Cache (CONTRACT, hardware TARGET):**
   - Contract: every local playout automation server must hold a pre-buffered, locally cached 48-hour playlist grid; `evaluateAutonomousCacheContract` verifies ≥48h coverage and Drill 20 simulation (`simulateDrill20CacheOutage`) exercises the DB-offline fallback.
   - Hardware integration at StarTimes transmission uplink centres is tracked separately with the MCR/StarTimes engineering owner (HUMAN DECISION — `tasks.md` HD list, inherited identifier TODO-BCST-06) and is NOT claimed as operational.

2. **Automated Database Backups & Point-in-Time Recovery (PITR) — TARGET:**
   - TARGET-state: continuous Write-Ahead Log (WAL) archiving to encrypted multi-region S3/MinIO offsite buckets; full daily database snapshots at 02:00 WAT retained for 90 days.
   - Implemented today (TODO-PRC-08): nightly 02:00 `pg_dump` + retention sweep via the `vmnl-postgres-backup` compose service (docker/backups/backup.sh). WAL archiving and measured RPO/RTO evidence remain PENDING first sandbox drill.

---

## 2. Emergency Recovery Procedures

### Scenario A: Central Database Corruption or Total Datacenter Loss

```bash
# 1. Engage Global Playout Cache Lock
# Local playout engines switch to local cached playlists automatically (UAT Drill 20)

# 2. TARGET-state step (no k8s manifests in repo): spin up standby PostgreSQL cluster.
# Implemented sandbox path today: docker compose up vmnl-postgres restored from docker/backups dump.

# 3. Restore from Latest Point-in-Time S3 Archive
pg_restore -h postgres-dr.internal -U vmn_user -d vmn_enterprise --clean /mnt/backup/latest_wal_snapshot.dump

# 4. Verify Database Integrity & Foreign Key Constraints — `src/core/domain/integrity-check.ts` is citation:absent (no such script exists in this repository; restored-data integrity is checked against the live cluster, not a repo script)
psql "$DATABASE_URL" -c "SELECT count(*) AS invalid_constraints FROM pg_constraint WHERE contype = 'f' AND NOT convalidated"

# 5. Point Production Traffic to Restored Cluster (TARGET-state kubectl form; sandbox: update DATABASE_URL in compose env)
kubectl set env deployment/vmn-backend DATABASE_URL="postgresql://vmn_user:***@postgres-dr.internal:5432/vmn_enterprise"
```

### Scenario B: Studio Uplink Loss / StarTimes Satellite Carrier Incident

```bash
# 1. Trigger StarTimes Terrestrial Backup Feed (DTT Uplink Failover)
curl -X POST http://startimes-feed.internal:8080/api/v1/failover -d '{"primaryFeed": "DTH", "switchTarget": "DTT"}'

# 2. Log Carriage Outage Ticket for SLA Penalties (UAT Drill 09, 13)
pnpm tsx -e 'import { CarriageMonitoringEngine } from "./src/modules/broadcast/index.js"; ...'
```

---

## 3. Disaster Recovery Testing Cadence

- **Quarterly Drill:** Unannounced failover simulation of secondary playout server.
- **Bi-annual Drill:** Full PITR restoration from offsite S3 archives into isolated test sandbox. Target execution time: < 15 minutes.
