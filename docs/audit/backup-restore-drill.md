# VMNL Enterprise — Sandbox Restore Drill Evidence (TODO-PRC-08)

**Runbook:** [disaster-recovery.md](../runbooks/disaster-recovery.md)  
**Backup automation:** `vmnl-postgres-backup` compose service → [docker/backups/backup.sh](../../docker/backups/backup.sh)  
**Scope implemented:** nightly 02:00 WAT compressed `pg_dump` + gzip integrity verification + 14-day retention sweep.  
**Scope still TARGET:** continuous WAL archiving (arbitrary-instant PITR), multi-region offsite copy.

## Drill procedure (record actuals below — this file is the evidence artifact)

1. `docker compose up -d postgres` and let the backup service produce at least one archive, or run:
   `docker compose run --rm vmnl-postgres-backup /bin/sh /usr/local/bin/backup.sh`
2. Record the archive path and size: `docker compose exec postgres ls -la /backups` → `.drill-backups/vmn_enterprise_20261001T020000Z.sql.gz` (12,270 bytes; gzip integrity verified by the script)
3. Destroy and recreate the database volume, then restore:
   ```bash
   gunzip -c /backups/vmn_enterprise_<STAMP>.sql.gz | \
     docker compose exec -T postgres psql -U vmn_user -d vmn_enterprise
   ```
4. Verify integrity: row counts on canonical tables + smoke request against the app (`/healthz`). Result: **PASS — 26/26 tables byte-for-byte row-count parity with the pre-backup baseline; app served 200 from the restored copy** (see actuals below)
5. Record timings:
   - Backup wall time: **0.198 s** (12,270-byte golden-seed dataset, sandbox)
   - Restore wall time (RTO contribution): **0.132 s** (`gunzip | psql` into a freshly created empty database, `ON_ERROR_STOP=1`, exit 0)
   - Data-loss window measured = time since previous archive (max 24h until WAL archiving lands) → measured RPO: **≤ 24 h by design; effectively ~0 s in this drill** (the only writes were the seed rows moments before the backup; the drill was a single-pass backup→restore with no writes after the archive)
6. Compare against targets (RPO < 5 min TARGET, RTO < 15 min TARGET) and record PASS/FAIL with the gap analysis.

## Result — DRILL-01 (2026-10-01, sandbox)

**STATUS: PASS for snapshot-restore scope ( Drill-20 execution record below). Operator: VMNL engineering contributor (Codebuff agent, supervised run); host: local macOS sandbox.**

| Measure | Actual | Target | Verdict |
|---|---|---|---|
| Backup wall time | 0.198 s | n/a (duration only) | — |
| Archive | `vmn_enterprise_20261001T020000Z.sql.gz`, 12,270 bytes, `gzip -t` clean | non-empty + integrity-checked | PASS |
| Restore wall time (RTO contribution) | 0.132 s | RTO < 15 min | PASS (≈0.015% of budget) |
| Row-count parity | 26/26 tables identical pre/post (`BroadcastChannel=3, Programme=50, BroadcastEpisode=200, TalentProfile=20, CommercialCampaign=10, AsRunLogRecord=10, Person=20, …`) | full parity | PASS |
| App smoke on restored copy | `/healthz` 200 · `/channels/nxtr` 200 · `/broadcast/schedule/review` 200 (HTTP API healthy; the EPG data endpoint's honest 503 `APPROVED_SCHEDULE_UNAVAILABLE` is its designed no-approved-schedule state, not a restore defect) | `/healthz` 200 | PASS |
| Measured RPO | ≈0 s in-drill; **≤ 24 h by design** (snapshot cadence, no WAL archiving yet) | RPO < 5 min | **FAIL vs TARGET — expected** |

**Environment note (recorded honestly):** this drill ran on a **native PostgreSQL 18.3 instance** (`psql` 18.3 tooling, role `vmn_user` / database `vmn_enterprise` created to the compose service's exact credential contract, canonical `prisma db push` schema + golden seed `POSTGRESQL_PERSISTED`) rather than inside the `vmnl-postgres` container, because the host's Podman/Docker runtime was non-functional at drill time (applehv machine would not start — infrastructure fault outside the repository). The procedure, script (`docker/backups/backup.sh` invoked with service-equivalent env: `VMNL_BACKUP_DIR`/`PGHOST`/`PGPORT`/`PGUSER`/`PGDATABASE`), archive format and verification gates are identical to the compose service; only the server process is native. **The container-path drill must be repeated when a working Docker/Podman runtime is available** to close that gap.

**Gap analysis / still-TARGET items:**
- RPO remains governed by the 24 h snapshot cadence — continuous WAL archiving (PITR) is unimplemented and keeps the RPO < 5 min TARGET unmet (a scheduled-nightly deployment loses up to a day of writes). This is the dominant open risk.
- Offsite/multi-region copy of archives is unimplemented (archives are local-disk only in this drill).
- Restore-in-place into the *original* (dropped-volume) database was validated via the empty-database copy; the compose-volume destruction path itself needs the container runtime for a like-for-like repetition.
- Retention sweep executed (nothing to prune on first run; 14-day policy active).

**Residual sandbox state (disclosed):** the drill required creating the sandbox role `vmn_user` and database `vmn_enterprise` on the host-local PostgreSQL instance (previously absent — the local dev `.env` points at `root@localhost/vmnl_enterprise`). These persist after the drill; the throwaway restore target `vmn_enterprise_drill` was dropped. Drill archive retained at `.drill-backups/` (git-ignored).
