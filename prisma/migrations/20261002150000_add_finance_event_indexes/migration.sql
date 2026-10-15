-- AddIndex (AUD-15): Missing read-path indexes on finance and event domain models
-- Identified by full-stack audit 2026-10-02

-- BankStatementRecord: reconciliation queries filter by status and date
CREATE INDEX "BankStatementRecord_transactionDate_idx" ON "BankStatementRecord"("transactionDate");
CREATE INDEX "BankStatementRecord_reconciledStatus_idx" ON "BankStatementRecord"("reconciledStatus");

-- CommercialCampaign: campaign management filters by status
CREATE INDEX "CommercialCampaign_status_idx" ON "CommercialCampaign"("status");
CREATE INDEX "CommercialCampaign_startDate_endDate_idx" ON "CommercialCampaign"("startDate", "endDate");

-- TalentPayoutBatch: payout management filters by status and creation date
CREATE INDEX "TalentPayoutBatch_status_createdAt_idx" ON "TalentPayoutBatch"("status", "createdAt");

-- EventTicket: ticket lookup by event and status
CREATE INDEX "EventTicket_eventId_status_idx" ON "EventTicket"("eventId", "status");
CREATE INDEX "EventTicket_attendeeEmail_idx" ON "EventTicket"("attendeeEmail");

-- FusionEvent: event queries filter by published state and date
CREATE INDEX "FusionEvent_isPublished_eventDate_idx" ON "FusionEvent"("isPublished", "eventDate");
