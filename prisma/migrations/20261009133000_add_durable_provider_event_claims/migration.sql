-- TSK-19 (AUD-07 remainder): the durable provider-event replay claim.
-- Purely additive — no DROP, no ALTER, no backfill of existing rows.

-- CreateTable
CREATE TABLE "ProviderEventClaim" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderEventClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderEventClaim_provider_eventId_key" ON "ProviderEventClaim"("provider", "eventId");

-- CreateIndex
CREATE INDEX "ProviderEventClaim_claimedAt_idx" ON "ProviderEventClaim"("claimedAt");
