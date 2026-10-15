-- TSK-17 (report.md CA-12): durable tables for the release-critical domains that
-- lived only in process memory. Purely additive — no DROP, no ALTER, no backfill:
-- the in-process Maps keep serving as read indexes and are refilled from these
-- tables at boot.
--
-- Design rules for this block (see prisma/schema.prisma §TSK-17):
--   * no foreign keys — references are id strings, so a durable write cannot fail
--     because its parent row does not exist;
--   * no state defaults — every status is written explicitly by the repository;
--   * application-minted ids — the domain id is the primary key.

-- CreateTable
CREATE TABLE "CommercialEnquiry" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "vertical" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "organisationName" TEXT,
    "message" TEXT NOT NULL,
    "ndprConsent" BOOLEAN NOT NULL,
    "submissionStatus" TEXT NOT NULL,
    "routingStatus" TEXT NOT NULL,
    "downstreamLeadId" TEXT,
    "assignedOperator" TEXT,
    "routingError" TEXT,
    "retryCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalItem" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "financialScopeNgn" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "initiatorName" TEXT NOT NULL,
    "objectRevision" INTEGER NOT NULL,
    "requiresFourEyes" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,
    "decidedBy" TEXT,
    "decidedByName" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionReason" TEXT,
    "decisionRevision" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivacySecurityCase" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "reporterContact" TEXT NOT NULL,
    "dataSubjects" JSONB,
    "slaDueAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "assignedCaseOwner" TEXT,
    "auditTrail" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivacySecurityCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskRecord" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "likelihood" INTEGER NOT NULL,
    "impact" INTEGER NOT NULL,
    "mitigation" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reviewDueAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueRecord" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "raisedBy" TEXT NOT NULL,
    "assignedTo" TEXT,
    "status" TEXT NOT NULL,
    "linkedRiskId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IssueRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AzeeboDestination" (
    "id" TEXT NOT NULL,
    "universe" TEXT NOT NULL,
    "universalUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "statusReason" TEXT,
    "stateChangedAt" TIMESTAMP(3) NOT NULL,
    "campaignContextAllowed" BOOLEAN NOT NULL,
    "registeredBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AzeeboDestination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAssetRecord" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "assetKey" TEXT NOT NULL,
    "tenantId" TEXT,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "provenance" TEXT NOT NULL,
    "virusScanPassed" BOOLEAN NOT NULL,
    "accessState" TEXT NOT NULL,
    "accessNotes" TEXT,
    "registeredBy" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAssetRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "deviceLabel" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "SessionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyRecord" (
    "id" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "responseBody" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommercialEnquiry_reference_key" ON "CommercialEnquiry"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialEnquiry_idempotencyKey_key" ON "CommercialEnquiry"("idempotencyKey");

-- CreateIndex
CREATE INDEX "CommercialEnquiry_vertical_createdAt_idx" ON "CommercialEnquiry"("vertical", "createdAt");

-- CreateIndex
CREATE INDEX "CommercialEnquiry_routingStatus_createdAt_idx" ON "CommercialEnquiry"("routingStatus", "createdAt");

-- CreateIndex
CREATE INDEX "ApprovalItem_status_category_idx" ON "ApprovalItem"("status", "category");

-- CreateIndex
CREATE INDEX "ApprovalItem_initiatorId_idx" ON "ApprovalItem"("initiatorId");

-- CreateIndex
CREATE INDEX "PrivacySecurityCase_status_type_idx" ON "PrivacySecurityCase"("status", "type");

-- CreateIndex
CREATE INDEX "PrivacySecurityCase_assignedCaseOwner_idx" ON "PrivacySecurityCase"("assignedCaseOwner");

-- CreateIndex
CREATE INDEX "RiskRecord_status_idx" ON "RiskRecord"("status");

-- CreateIndex
CREATE INDEX "RiskRecord_owner_idx" ON "RiskRecord"("owner");

-- CreateIndex
CREATE INDEX "IssueRecord_status_severity_idx" ON "IssueRecord"("status", "severity");

-- CreateIndex
CREATE INDEX "IssueRecord_linkedRiskId_idx" ON "IssueRecord"("linkedRiskId");

-- CreateIndex
CREATE INDEX "AzeeboDestination_universe_status_idx" ON "AzeeboDestination"("universe", "status");

-- CreateIndex
CREATE INDEX "AzeeboDestination_status_idx" ON "AzeeboDestination"("status");

-- CreateIndex
CREATE INDEX "MediaAssetRecord_tenantId_accessState_idx" ON "MediaAssetRecord"("tenantId", "accessState");

-- CreateIndex
CREATE INDEX "MediaAssetRecord_checksumSha256_idx" ON "MediaAssetRecord"("checksumSha256");

-- CreateIndex
CREATE INDEX "SessionRecord_userId_createdAt_idx" ON "SessionRecord"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SessionRecord_revokedAt_idx" ON "SessionRecord"("revokedAt");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_recordedAt_idx" ON "IdempotencyRecord"("recordedAt");

