-- TSK-17, second block (report.md CA-12 rows 3, 5, 9): the CMS revision chain, the
-- double-entry journal and the sponsor binding/fulfilment ledger.
-- Purely additive — no DROP, no ALTER, no backfill of existing rows.

-- CreateTable
CREATE TABLE "ContentItemRecord" (
    "id" TEXT NOT NULL,
    "currentRevision" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "destinationId" TEXT,
    "publication" JSONB,
    "withdrawal" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItemRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentRevisionRecord" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "relatedUnit" TEXT NOT NULL,
    "mediaAssetIds" JSONB NOT NULL,
    "claimSources" JSONB NOT NULL,
    "alternativeText" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "submittedForReviewAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "reviewNotes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentRevisionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntryRecord" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "lines" JSONB NOT NULL,
    "currency" TEXT NOT NULL,
    "totalDebitNgn" DECIMAL(14,2) NOT NULL,
    "totalCreditNgn" DECIMAL(14,2) NOT NULL,
    "isBalanced" BOOLEAN NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntryRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorBindingRecord" (
    "id" TEXT NOT NULL,
    "entitlementId" TEXT NOT NULL,
    "programmeCode" TEXT NOT NULL,
    "daypart" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "assetDurationSeconds" INTEGER NOT NULL,
    "requiredPlacementsPerEpisode" INTEGER NOT NULL,
    "fulfilledPlacements" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorBindingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorFulfillmentRecord" (
    "id" TEXT NOT NULL,
    "bindingId" TEXT NOT NULL,
    "episodeCode" TEXT NOT NULL,
    "asRunLogId" TEXT NOT NULL,
    "airedAt" TIMESTAMP(3) NOT NULL,
    "placementsFulfilled" INTEGER NOT NULL,
    "placementsRequired" INTEGER NOT NULL,
    "isComplete" BOOLEAN NOT NULL,
    "fulfillmentPercent" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorFulfillmentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentItemRecord_status_updatedAt_idx" ON "ContentItemRecord"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "ContentRevisionRecord_slug_idx" ON "ContentRevisionRecord"("slug");

-- CreateIndex
CREATE INDEX "ContentRevisionRecord_authorId_idx" ON "ContentRevisionRecord"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentRevisionRecord_contentId_revision_key" ON "ContentRevisionRecord"("contentId", "revision");

-- CreateIndex
CREATE INDEX "JournalEntryRecord_reference_idx" ON "JournalEntryRecord"("reference");

-- CreateIndex
CREATE INDEX "JournalEntryRecord_postedAt_idx" ON "JournalEntryRecord"("postedAt");

-- CreateIndex
CREATE INDEX "SponsorBindingRecord_programmeCode_daypart_idx" ON "SponsorBindingRecord"("programmeCode", "daypart");

-- CreateIndex
CREATE INDEX "SponsorBindingRecord_entitlementId_idx" ON "SponsorBindingRecord"("entitlementId");

-- CreateIndex
CREATE INDEX "SponsorFulfillmentRecord_bindingId_idx" ON "SponsorFulfillmentRecord"("bindingId");

-- CreateIndex
CREATE UNIQUE INDEX "SponsorFulfillmentRecord_bindingId_episodeCode_asRunLogId_key" ON "SponsorFulfillmentRecord"("bindingId", "episodeCode", "asRunLogId");

