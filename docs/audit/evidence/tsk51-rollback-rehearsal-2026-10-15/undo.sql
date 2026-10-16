-- TSK-51 rehearsal: undo 20261013142927_add_composite_keyset_indexes by hand, which is
-- what the runbook's "emergency schema rollback" half actually means. The migration SQL is
-- not idempotent (bare DROP INDEX / CREATE INDEX), so the DDL must be reverted before
-- `prisma migrate resolve --rolled-back` describes the database truthfully.
DROP INDEX IF EXISTS "BroadcastEpisode_programmeCode_episodeCode_idx";
DROP INDEX IF EXISTS "Programme_channelCode_code_idx";
CREATE INDEX IF NOT EXISTS "BroadcastEpisode_programmeCode_idx" ON "BroadcastEpisode"("programmeCode");
CREATE INDEX IF NOT EXISTS "Programme_channelCode_idx" ON "Programme"("channelCode");
