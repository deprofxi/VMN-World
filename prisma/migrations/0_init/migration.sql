-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('CORPORATE', 'BROADCAST_PARTNER', 'PRODUCTION_HOUSE', 'ACADEMY_PARTNER', 'SPONSOR', 'ADVERTISER');

-- CreateEnum
CREATE TYPE "TalentTier" AS ENUM ('EMERGING', 'VERIFIED', 'PROFESSIONAL', 'MASTER');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PROPOSED', 'APPROVED', 'IN_PRODUCTION', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'SIGNED', 'EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "RightsType" AS ENUM ('BROADCAST_LINEAR', 'DIGITAL_STREAMING', 'SYNDICATION', 'DERIVATIVE');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'RECONCILED', 'DISPUTED', 'PAID');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('PROOF_OF_AIR', 'KYC_DOCUMENT', 'PAYMENT_RECEIPT', 'SIGNED_CONTRACT', 'AS_RUN_LOG');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'TERMINATED');

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "nationalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isSystemRole" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "tenantId" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "type" "OrgType" NOT NULL DEFAULT 'CORPORATE',
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentProfile" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "stageName" TEXT,
    "tier" "TalentTier" NOT NULL DEFAULT 'EMERGING',
    "bio" TEXT,
    "skills" JSONB NOT NULL DEFAULT '[]',
    "rateCardAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "rateCardCurrency" TEXT NOT NULL DEFAULT 'NGN',
    "verificationStatus" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorProfile" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "primaryNiche" TEXT NOT NULL,
    "platforms" JSONB NOT NULL DEFAULT '{}',
    "audienceMetrics" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organisationId" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PROPOSED',
    "budget" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organisationId" TEXT,
    "personId" TEXT,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "contractValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "signedAt" TIMESTAMP(3),
    "signedDocumentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RightsRecord" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "granterOrgId" TEXT,
    "granteeOrgId" TEXT,
    "rightsType" "RightsType" NOT NULL,
    "territory" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "exclusivity" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "subLicensable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RightsRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "settlementNumber" TEXT NOT NULL,
    "contractId" TEXT,
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "contractValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "gmvAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "invoicedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "recognizedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "cashCollectedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "talentPayableAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "partnerShareAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "reconciledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "type" "EvidenceType" NOT NULL,
    "title" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "agentIdentifier" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "operationalScope" TEXT NOT NULL,
    "humanOwnerId" TEXT NOT NULL,
    "allowedTools" JSONB NOT NULL DEFAULT '[]',
    "status" "AgentStatus" NOT NULL DEFAULT 'ACTIVE',
    "killSwitchEngaged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "changesJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BroadcastChannel" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "primaryLanguage" TEXT NOT NULL,
    "dttChannelNumber" INTEGER,
    "dthChannelNumber" INTEGER,
    "bouquetTier" TEXT NOT NULL DEFAULT 'Basic',
    "servicePid" INTEGER,
    "isProvisional" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BroadcastChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Programme" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "channelCode" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "targetDemographic" TEXT NOT NULL,
    "synopsis" TEXT NOT NULL,
    "totalEpisodes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Programme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BroadcastEpisode" (
    "id" TEXT NOT NULL,
    "episodeCode" TEXT NOT NULL,
    "programmeCode" TEXT NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "segmentCount" INTEGER NOT NULL DEFAULT 4,
    "mediaAssetId" TEXT,
    "rightsWindowStart" TIMESTAMP(3),
    "rightsWindowEnd" TIMESTAMP(3),
    "complianceRating" TEXT NOT NULL DEFAULT '15',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BroadcastEpisode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsRunLogRecord" (
    "id" TEXT NOT NULL,
    "channelCode" TEXT NOT NULL,
    "transmissionDate" TIMESTAMP(3) NOT NULL,
    "totalPlannedSpots" INTEGER NOT NULL,
    "totalAiredSpots" INTEGER NOT NULL,
    "matchedSpots" INTEGER NOT NULL,
    "discrepancyCount" INTEGER NOT NULL,
    "reconciliationStatus" TEXT NOT NULL,
    "certificateHashSha256" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AsRunLogRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AfcaCourse" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "faculty" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "tuitionNgn" DECIMAL(14,2) NOT NULL,
    "durationWeeks" INTEGER NOT NULL,
    "maxCohortSize" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AfcaCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FusionEvent" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "venueName" TEXT NOT NULL,
    "venueCity" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "doorsOpenTime" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FusionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "attendeeName" TEXT NOT NULL,
    "attendeeEmail" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "pricePaidNgn" DECIMAL(14,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "qrSignatureHmac" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedInAt" TIMESTAMP(3),

    CONSTRAINT "EventTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialCampaign" (
    "id" TEXT NOT NULL,
    "campaignCode" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "bookedSpots" INTEGER NOT NULL,
    "totalContractValueNgn" DECIMAL(14,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'BOOKED',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentPayoutBatch" (
    "id" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "totalAmountNgn" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "itemCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentPayoutBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankStatementRecord" (
    "id" TEXT NOT NULL,
    "statementReference" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "rawSwiftCode" TEXT,
    "amountNgn" DECIMAL(14,2) NOT NULL,
    "isCredit" BOOLEAN NOT NULL,
    "narrative" TEXT NOT NULL,
    "reconciledStatus" TEXT NOT NULL DEFAULT 'UNMATCHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankStatementRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Person_email_key" ON "Person"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_personId_key" ON "User"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_action_resource_key" ON "Permission"("action", "resource");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_tenantId_key" ON "UserRole"("userId", "roleId", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Organisation_slug_key" ON "Organisation"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Organisation_tenantId_key" ON "Organisation"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TalentProfile_personId_key" ON "TalentProfile"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorProfile_personId_key" ON "CreatorProfile"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorProfile_handle_key" ON "CreatorProfile"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "Project_code_key" ON "Project"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_contractNumber_key" ON "Contract"("contractNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_settlementNumber_key" ON "Settlement"("settlementNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_agentIdentifier_key" ON "Agent"("agentIdentifier");

-- CreateIndex
CREATE UNIQUE INDEX "BroadcastChannel_code_key" ON "BroadcastChannel"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Programme_code_key" ON "Programme"("code");

-- CreateIndex
CREATE UNIQUE INDEX "BroadcastEpisode_episodeCode_key" ON "BroadcastEpisode"("episodeCode");

-- CreateIndex
CREATE UNIQUE INDEX "AfcaCourse_code_key" ON "AfcaCourse"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FusionEvent_code_key" ON "FusionEvent"("code");

-- CreateIndex
CREATE UNIQUE INDEX "EventTicket_ticketNumber_key" ON "EventTicket"("ticketNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialCampaign_campaignCode_key" ON "CommercialCampaign"("campaignCode");

-- CreateIndex
CREATE UNIQUE INDEX "TalentPayoutBatch_batchNumber_key" ON "TalentPayoutBatch"("batchNumber");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentProfile" ADD CONSTRAINT "TalentProfile_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorProfile" ADD CONSTRAINT "CreatorProfile_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Programme" ADD CONSTRAINT "Programme_channelCode_fkey" FOREIGN KEY ("channelCode") REFERENCES "BroadcastChannel"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastEpisode" ADD CONSTRAINT "BroadcastEpisode_programmeCode_fkey" FOREIGN KEY ("programmeCode") REFERENCES "Programme"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTicket" ADD CONSTRAINT "EventTicket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "FusionEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

