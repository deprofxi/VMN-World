#!/bin/sh
# VMNL Enterprise — PostgreSQL nightly backup (TODO-PRC-08, TASK-P10-03)
#
# Runs as the `vmnl-postgres-backup` compose service at 02:00 WAT (cron inside
# the container). Produces a compressed plain-SQL dump per run, verifies the
# archive is non-empty, and prunes dumps beyond VMNL_BACKUP_RETENTION_DAYS.
#
# SCOPE (honest): this implements snapshot backup + retention + verification.
# Continuous WAL archiving (PITR to arbitrary instants) remains TARGET-state —
# see docs/runbooks/disaster-recovery.md. The first measured RPO/RTO drill is
# PENDING; run docs/audit/backup-restore-drill.md to record it.
set -u

BACKUP_DIR="${VMNL_BACKUP_DIR:-/backups}"
RETENTION_DAYS="${VMNL_BACKUP_RETENTION_DAYS:-14}"
PGHOST="${PGHOST:-postgres}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-vmn_user}"
PGDATABASE="${PGDATABASE:-vmn_enterprise}"

mkdir -p "${BACKUP_DIR}"
STAMP="$(date -u +%Y%m%dT020000Z)"
OUT="${BACKUP_DIR}/vmn_enterprise_${STAMP}.sql.gz"

echo "[vmnl-backup] ${STAMP} starting dump of ${PGDATABASE}@${PGHOST}:${PGPORT}/${PGUSER}"

pg_dump -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${PGDATABASE}" --no-owner --clean --if-exists | gzip > "${OUT}"
DUMP_STATUS=$?

if [ ${DUMP_STATUS} -ne 0 ]; then
  echo "[vmnl-backup] ERROR: pg_dump exited ${DUMP_STATUS}; removing partial archive" >&2
  rm -f "${OUT}"
  exit 1
fi

# Verification: archive must exist, be non-trivially sized, and decompress cleanly.
if [ ! -s "${OUT}" ]; then
  echo "[vmnl-backup] ERROR: archive is empty: ${OUT}" >&2
  rm -f "${OUT}"
  exit 1
fi
if ! gzip -t "${OUT}"; then
  echo "[vmnl-backup] ERROR: archive failed gzip integrity check: ${OUT}" >&2
  rm -f "${OUT}"
  exit 1
fi

SIZE=$(du -h "${OUT}" | cut -f1)
echo "[vmnl-backup] OK: ${OUT} (${SIZE})"

# Retention sweep.
echo "[vmnl-backup] pruning ${BACKUP_DIR} older than ${RETENTION_DAYS} days"
find "${BACKUP_DIR}" -name "vmn_enterprise_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -print -delete

echo "[vmnl-backup] done."
