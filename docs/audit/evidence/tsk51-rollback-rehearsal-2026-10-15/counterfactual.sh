#!/usr/bin/env bash
# TSK-51 rehearsal, counterfactual leg: what runbook §3.3 does when the DDL was never
# reverted. It exists to measure the gap, not to paper over it.
# usage: counterfactual.sh <source-libpq-url> <target-libpq-url> <target-prisma-url> <migration-name> <evidence-dir>
set -u
A_DB="$1"
B_DB="$2"
B_URL="$3"
LAST="$4"
E="$5"

echo "### C1 dirty the newest journal row (simulated mid-flight failure) and deliberately leave the schema in its post-migration state"
psql "$B_DB" -q -c "UPDATE _prisma_migrations SET finished_at=NULL, applied_steps_count=0, logs='TSK-51 counterfactual: journal dirtied, DDL left applied' WHERE migration_name='$LAST'"
echo "index_state=$(psql "$B_DB" -tAc "select indexname from pg_indexes where schemaname='public' and indexname in ('BroadcastEpisode_programmeCode_idx','Programme_channelCode_idx','BroadcastEpisode_programmeCode_episodeCode_idx','Programme_channelCode_code_idx') order by 1" | paste -sd, -)"
echo ""
echo "### C2 runbook §3.3 command, on its own"
echo "cmd: env DATABASE_URL=$B_URL CI=1 pnpm exec prisma migrate resolve --rolled-back $LAST"
env DATABASE_URL="$B_URL" CI=1 pnpm exec prisma migrate resolve --rolled-back "$LAST"
echo "resolve_exit=$?"
echo ""
echo "### C3 migrate deploy from that state (the schema never moved — this is what the runbook's one-liner invites)"
echo "cmd: env DATABASE_URL=$B_URL CI=1 pnpm exec prisma migrate deploy"
env DATABASE_URL="$B_URL" CI=1 pnpm exec prisma migrate deploy
echo "deploy_exit=$?"
echo "journal_now=$(psql "$B_DB" -tAc "select migration_name||' applied='||(finished_at is not null)||' rolled_back='||(rolled_back_at is not null)||' steps='||applied_steps_count from _prisma_migrations where migration_name='$LAST' order by started_at desc limit 1")"
echo ""
echo "### C4 the corrected procedure from the broken state: revert the DDL, then §3.3, then deploy"
echo "cmd: psql $B_DB -q -f $E/undo.sql"
psql "$B_DB" -q -f "$E/undo.sql"
echo "undo_exit=$?"
echo "index_state=$(psql "$B_DB" -tAc "select indexname from pg_indexes where schemaname='public' and indexname in ('BroadcastEpisode_programmeCode_idx','Programme_channelCode_idx','BroadcastEpisode_programmeCode_episodeCode_idx','Programme_channelCode_code_idx') order by 1" | paste -sd, -)"
echo "cmd: env DATABASE_URL=$B_URL CI=1 pnpm exec prisma migrate resolve --rolled-back $LAST"
env DATABASE_URL="$B_URL" CI=1 pnpm exec prisma migrate resolve --rolled-back "$LAST"
echo "resolve_exit=$?"
echo "cmd: env DATABASE_URL=$B_URL CI=1 pnpm exec prisma migrate deploy"
env DATABASE_URL="$B_URL" CI=1 pnpm exec prisma migrate deploy
echo "deploy_exit=$?"
echo ""
echo "### C5 recovery from the counterfactual leaves the target schema identical to the source"
diff <(psql "$A_DB" -tAc "select indexname||' '||indexdef from pg_indexes where schemaname='public' order by 1") \
     <(psql "$B_DB" -tAc "select indexname||' '||indexdef from pg_indexes where schemaname='public' order by 1") > /tmp/tsk51_cf_index_diff.txt 2>&1
echo "index_diff exit=$? differing_lines=$(wc -l < /tmp/tsk51_cf_index_diff.txt | tr -d ' ')"
if [ -s /tmp/tsk51_cf_index_diff.txt ]; then head -8 /tmp/tsk51_cf_index_diff.txt; fi
echo "seeded_rows=$(psql "$B_DB" -tAc 'select count(*) from "DataSubjectRequest"')"
