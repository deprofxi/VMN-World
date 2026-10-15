-- AUD-08: durable Data Subject Request ledger (additive; no data migration).
-- Records requests and operator-driven status transitions only. No queue, SLA
-- clock or archive generation is implied until those workflows are approved.

CREATE TABLE "DataSubjectRequest" (
    "id" TEXT NOT NULL,
    "requestRef" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "requestType" TEXT NOT NULL DEFAULT 'EXPORT',
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DataSubjectRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DataSubjectRequest_requestRef_key" ON "DataSubjectRequest"("requestRef");
CREATE INDEX "DataSubjectRequest_userId_idx" ON "DataSubjectRequest"("userId");
CREATE INDEX "DataSubjectRequest_status_idx" ON "DataSubjectRequest"("status");
