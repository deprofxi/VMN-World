#!/usr/bin/env bash
# TSK-51 rehearsal: one timed run of the whole documented recovery path.
# usage: drill.sh <libpq-url> <prisma-url> <migration-name>
set -u
DB="$1"
URL="$2"
LAST="$3"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

psql "$DB" -q -c "UPDATE _prisma_migrations SET finished_at=NULL, applied_steps_count=0 WHERE migration_name='$LAST'"
psql "$DB" -q -f "$HERE/undo.sql"
echo "cmd: env DATABASE_URL=$URL pnpm exec prisma migrate resolve --rolled-back $LAST"
env DATABASE_URL="$URL" CI=1 pnpm exec prisma migrate resolve --rolled-back "$LAST"
echo "cmd: env DATABASE_URL=$URL pnpm exec prisma migrate deploy"
env DATABASE_URL="$URL" CI=1 pnpm exec prisma migrate deploy
echo "recovered_journal_rows=$(psql "$DB" -tAc "select count(*) from _prisma_migrations where migration_name='$LAST' and finished_at is not null")"
echo "seeded_rows=$(psql "$DB" -tAc 'select count(*) from "DataSubjectRequest"')"
