-- TSK-60 (box 3): make the Quote-to-Cash portfolio durable.
-- Purely additive: one new table keyed by the minted deal id, no DROP, no ALTER
-- of an existing table, no backfill (there is no durable predecessor to read).
-- Money columns carry their unit in the name and are Decimal(14,2), matching the
-- journal precedent — a portfolio total that arrived rounded would not be the
-- same financial record the portal projected before the restart.

-- CreateTable
CREATE TABLE "SalesDealRecord" (
    "id" TEXT NOT NULL,
    "clientOrgId" TEXT NOT NULL,
    "dealName" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "totalContractValueNgn" DECIMAL(14,2) NOT NULL,
    "salesLeadId" TEXT NOT NULL,
    "salesLeadApprovedAt" TIMESTAMP(3),
    "financeApproverId" TEXT,
    "financeApprovedAt" TIMESTAMP(3),
    "depositAmountNgn" DECIMAL(14,2) NOT NULL,
    "depositPaidAt" TIMESTAMP(3),
    "invoicedAmountNgn" DECIMAL(14,2) NOT NULL,
    "cashCollectedAmountNgn" DECIMAL(14,2) NOT NULL,
    "recognizedRevenueNgn" DECIMAL(14,2) NOT NULL,
    "proofOfPerformanceVerified" BOOLEAN NOT NULL,
    "proofDocumentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesDealRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesDealRecord_clientOrgId_stage_idx" ON "SalesDealRecord"("clientOrgId", "stage");

-- CreateIndex
CREATE INDEX "SalesDealRecord_updatedAt_idx" ON "SalesDealRecord"("updatedAt");
