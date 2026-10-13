-- DropIndex
DROP INDEX "BroadcastEpisode_programmeCode_idx";

-- DropIndex
DROP INDEX "Programme_channelCode_idx";

-- CreateIndex
CREATE INDEX "BroadcastEpisode_programmeCode_episodeCode_idx" ON "BroadcastEpisode"("programmeCode", "episodeCode");

-- CreateIndex
CREATE INDEX "Programme_channelCode_code_idx" ON "Programme"("channelCode", "code");
