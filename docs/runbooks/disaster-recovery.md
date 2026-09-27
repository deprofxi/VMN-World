# VMN Disaster Recovery & Business Continuity Runbook

**Authority:** VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §57 / VMNL-AZP-VMN-CCPP-001 §20  
**Recovery Objectives:** RPO < 5 minutes | RTO < 15 minutes

---

## 1. Business Continuity Architecture

In accordance with R1.2A §57, Virtual Media Network Limited guarantees 24/7/365 uninterrupted broadcast transmission even during total cloud datacenter loss or central database outages:

1. **48-Hour Autonomous Playout Cache:**
   - Every local playout automation server at StarTimes transmission uplink centers maintains a pre-buffered, locally cached 48-hour playlist grid and high-definition video master cache.
   - If the central VMN database or internet connectivity drops, playout transitions automatically to local cache with zero dead-air.

2. **Automated Database Backups & Point-in-Time Recovery (PITR):**
   - Automated continuous Write-Ahead Log (WAL) archiving to encrypted multi-region S3/MinIO offsite buckets.
   - Full daily database snapshots at 02:00 WAT retained for 90 days.

---

## 2. Emergency Recovery Procedures

### Scenario A: Central Database Corruption or Total Datacenter Loss

```bash
# 1. Engage Global Playout Cache Lock
# Local playout engines switch to local cached playlists automatically (UAT Drill 20)

# 2. Spin up Standby PostgreSQL Database Cluster
kubectl apply -f infra/k8s/postgres-dr-cluster.yaml -n production

# 3. Restore from Latest Point-in-Time S3 Archive
pg_restore -h postgres-dr.internal -U vmnl_admin -d vmnl_control --clean /mnt/backup/latest_wal_snapshot.dump

# 4. Verify Database Integrity & Foreign Key Constraints
pnpm tsx src/core/domain/integrity-check.ts

# 5. Point Production Traffic to Restored Cluster
kubectl set env deployment/vmn-backend DATABASE_URL="postgresql://vmnl_admin:***@postgres-dr.internal:5432/vmnl_control"
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
