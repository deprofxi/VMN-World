set -u
cd "$(dirname "${BASH_SOURCE[0]}")/../../../.."
E=docs/audit/evidence/tsk51-rollback-rehearsal-2026-10-15
LOG="$E/rehearsal-timings.txt"
PG="postgresql://root@localhost:5432/postgres"
GATES="postgresql://root@localhost:5432/vmnl_enterprise_gates"
A="vmnl_tsk51_rehearsal_a"
B="vmnl_tsk51_rehearsal_b"
# libpq (psql/pg_dump/pg_restore) rejects Prisma's ?schema= query parameter,
# so the two consumers use separate URL variables.
A_DB="postgresql://root@localhost:5432/$A"
B_DB="postgresql://root@localhost:5432/$B"
A_URL="${A_DB}?schema=public"
B_URL="${B_DB}?schema=public"
DUMP=/tmp/tsk51_rehearsal.dump
SEED="$E/seed.sql"
LAST="20261013142927_add_composite_keyset_indexes"
: > "$LOG"

say()  { echo "$@" >> "$LOG"; }
step() { say ""; say "### $1"; shift; say "cmd: $*"; /usr/bin/time -p "$@" >> "$LOG" 2>&1; say "step_exit=$?"; }
inv()  {
  say "tables=$(psql "$1" -tAc "select count(*) from information_schema.tables where table_schema='public'")"
  say "columns=$(psql "$1" -tAc "select count(*) from information_schema.columns where table_schema='public'")"
  say "indexes=$(psql "$1" -tAc "select count(*) from pg_indexes where schemaname='public'")"
  say "journal_rows=$(psql "$1" -tAc "select count(*) from _prisma_migrations")"
  say "journal_applied=$(psql "$1" -tAc "select count(*) from _prisma_migrations where finished_at is not null")"
  say "journal_rolled_back=$(psql "$1" -tAc "select count(*) from _prisma_migrations where rolled_back_at is not null")"
  say "seeded_rows=$(psql "$1" -tAc 'select count(*) from "DataSubjectRequest"')"
  say "distinct_migrations=$(psql "$1" -tAc "select count(distinct migration_name) from _prisma_migrations")"
}
diffset() { # <label> <url-a> <url-b> <sql>
  local out=/tmp/tsk51_diff_out.txt
  diff <(psql "$2" -tAc "$4") <(psql "$3" -tAc "$4") > "$out" 2>&1
  say "$1 exit=$? differing_lines=$(wc -l < "$out" | tr -d ' ')"
  if [ -s "$out" ]; then say "$1 first differing lines:"; head -6 "$out" >> "$LOG"; fi
}

say "TSK-51 rollback rehearsal — executed 2026-10-15 on the local PostgreSQL cluster"
say "host=$(uname -sr) client=$(psql --version) server=$(psql "$PG" -tAc 'show server_version')"
say "scratch databases: $A (source), $B (restore target). Both created by this script and dropped at the end."
say "prisma DATABASE_URL=${A_URL} / ${B_URL}; libpq targets are the same URLs without ?schema=public."
say "migration under rehearsal (newest in prisma/migrations): $LAST"

step "01 drop any leftover scratch databases" psql "$PG" -q -c "DROP DATABASE IF EXISTS $A WITH (FORCE)" -c "DROP DATABASE IF EXISTS $B WITH (FORCE)"
step "02 create the scratch source database" psql "$PG" -q -c "CREATE DATABASE $A"
step "03 prisma migrate deploy onto the empty source (T_apply_from_empty)" env DATABASE_URL="$A_URL" CI=1 pnpm exec prisma migrate deploy
say ""
say "### 04 seed the source with rehearsal rows (synthetic; dropped with the database)"
psql "$A_DB" -q -f "$SEED" >> "$LOG" 2>&1; say "seed_exit=$?"
say ""
say "### 05 source inventory (pre-snapshot)"
inv "$A_DB"

step "06 pg_dump -Fc --no-owner -n public (T_snapshot = the rollback restore point)" pg_dump -Fc --no-owner -n public -f "$DUMP" "$A_DB"
say "dump_bytes=$(wc -c < "$DUMP" | tr -d ' ')"
step "07 create the restore target and clear its default public schema" bash -c "psql '$PG' -q -c 'CREATE DATABASE $B TEMPLATE template0' && psql '$B_DB' -q -c 'DROP SCHEMA public CASCADE'"
step "08 pg_restore --exit-on-error --single-transaction (T_restore)" pg_restore -d "$B_DB" --no-owner --exit-on-error --single-transaction "$DUMP"
say ""
say "### 09 restored-target inventory"
inv "$B_DB"
say ""
say "### 10 source vs restored target — set comparisons (exit=0 and differing_lines=0 means identical)"
diffset "column_diff" "$A_DB" "$B_DB" "select table_name||'.'||column_name||' '||data_type||' '||is_nullable from information_schema.columns where table_schema='public' order by 1"
diffset "index_diff" "$A_DB" "$B_DB" "select indexname||' '||indexdef from pg_indexes where schemaname='public' order by 1"
diffset "journal_diff" "$A_DB" "$B_DB" "select migration_name, checksum, finished_at is not null, rolled_back_at is not null, applied_steps_count from _prisma_migrations order by migration_name"
diffset "seeded_row_diff" "$A_DB" "$B_DB" "select \"requestRef\",\"userId\",\"email\",\"requestType\",\"status\" from \"DataSubjectRequest\" order by \"requestRef\""

say ""
say "### 11 simulate the incident: leave the newest journal row unclean, as a mid-flight failure records it"
psql "$B_DB" -q -c "UPDATE _prisma_migrations SET finished_at=NULL, applied_steps_count=0, logs='TSK-51 rehearsal: simulated mid-flight failure' WHERE migration_name='$LAST'" >> "$LOG" 2>&1; say "simulate_exit=$?"
say ""
say "### 12 migrate status against the failed migration (expected: the database is not clean)"
step "12 migrate status" env DATABASE_URL="$B_URL" CI=1 pnpm exec prisma migrate status
say ""
say "### 13 migrate deploy against the failed migration (expected: blocked; this is why runbook 3.3 exists)"
step "13 migrate deploy while the journal is unclean" env DATABASE_URL="$B_URL" CI=1 pnpm exec prisma migrate deploy

say ""
say "### 14 undo the migration DDL by hand (T_undo_ddl) — the schema half of an emergency rollback"
step "14 revert $LAST to its pre-migration state" psql "$B_DB" -q -f "$E/undo.sql"

say ""
say "### 15 the runbook 3.3 command verbatim (T_resolve)"
step "15 pnpm prisma migrate resolve --rolled-back $LAST" env DATABASE_URL="$B_URL" CI=1 pnpm exec prisma migrate resolve --rolled-back "$LAST"
say ""
say "### 16 journal row for that migration after the resolve"
psql "$B_DB" -tAc "select migration_name||' applied='||(finished_at is not null)||' rolled_back='||(rolled_back_at is not null)||' steps='||applied_steps_count from _prisma_migrations where migration_name='$LAST'" >> "$LOG" 2>&1; say "journal_check_exit=$?"
say ""
say "### 17 migrate status after the resolve (expected: the migration is pending again)"
step "17 migrate status" env DATABASE_URL="$B_URL" CI=1 pnpm exec prisma migrate status

say ""
say "### 18 re-apply it with migrate deploy (T_reapply) — the documented forward path"
step "18 migrate deploy" env DATABASE_URL="$B_URL" CI=1 pnpm exec prisma migrate deploy
say ""
say "### 19 post-recovery comparison against the source (must match the pre-incident state)"
inv "$B_DB"
diffset "post_recovery_column_diff" "$A_DB" "$B_DB" "select table_name||'.'||column_name||' '||data_type||' '||is_nullable from information_schema.columns where table_schema='public' order by 1"
diffset "post_recovery_seeded_row_diff" "$A_DB" "$B_DB" "select \"requestRef\",\"userId\",\"email\",\"requestType\",\"status\" from \"DataSubjectRequest\" order by \"requestRef\""

say ""
say "### 20 one timed end-to-end drill of the recovery path (dirty journal + undo DDL + resolve + re-apply)"
step "20 full recovery path in one measured run" bash "$E/drill.sh" "$B_DB" "$B_URL" "$LAST"

say ""
say "### 21 counterfactual: runbook 3.3 on its own, with the DDL never reverted — measured, because the runbook reads as if one command is the whole recovery"
step "21 counterfactual leg" bash "$E/counterfactual.sh" "$A_DB" "$B_DB" "$B_URL" "$LAST" "$E"

step "22 final inventory after the counterfactual recovery" psql "$B_DB" -tAc "select (select count(*) from information_schema.tables where table_schema='public')||' tables, '||(select count(distinct migration_name) from _prisma_migrations)||' distinct migrations journaled, '||(select count(*) from \"DataSubjectRequest\")||' seeded rows survive'"
step "23 drop both scratch databases" psql "$PG" -q -c "DROP DATABASE $A WITH (FORCE)" -c "DROP DATABASE $B WITH (FORCE)"
say ""
say "### 24 cluster state after the rehearsal"
say "scratch_databases_remaining=$(psql "$PG" -tAc "select count(*) from pg_database where datname like 'vmnl_tsk51%'")"
say ""
say "### 25 the gate/test database was not modified by this rehearsal (read-only check after the run)"
inv "$GATES"
say "rehearsal_rows_in_gate_database=$(psql "$GATES" -tAc "select count(*) from \"DataSubjectRequest\" where \"requestRef\" like 'TSK51-A%'")"
rm -f "$DUMP"
