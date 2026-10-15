-- CreateIndex (AUD-15 / AUD-16)
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_resource_idx" ON "AuditLog"("action", "resource");

-- CreateIndex
CREATE INDEX "Programme_channelCode_idx" ON "Programme"("channelCode");

-- CreateIndex
CREATE INDEX "BroadcastEpisode_programmeCode_idx" ON "BroadcastEpisode"("programmeCode");

-- CreateIndex
CREATE INDEX "BroadcastEpisode_mediaAssetId_idx" ON "BroadcastEpisode"("mediaAssetId");

-- CreateIndex
CREATE INDEX "AsRunLogRecord_channelCode_transmissionDate_idx" ON "AsRunLogRecord"("channelCode", "transmissionDate");
