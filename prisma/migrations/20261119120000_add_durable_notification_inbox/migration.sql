-- UX-HUB-003 / UX-SYS-012: the in-app inbox and its preference record become
-- durable stores.
--
-- Purely additive: two new tables, no ALTER of an existing one, no DROP, no
-- backfill. There is no durable predecessor to read, because the maps these
-- tables replace died with the process that wrote them — inventing rows for
-- notifications or preferences from a previous run is not possible, and the
-- surfaces state the empty state rather than fabricate one.
--
-- `InAppNotificationRecord` is keyed by the notification id the dispatcher
-- minted (`ntf-…`), so a hydrated inbox is the inbox the reader was looking at,
-- not a renumbered copy. `readAt` is stored, never re-derived: a notification
-- that comes back unread after a restart is exactly the defect this row removes.
--
-- `NotificationPreferenceRecord` is one row per user. The category flags are
-- columns rather than JSON because the dispatcher reads them individually and a
-- missing key must fail loudly in the schema rather than default to "allowed".

-- CreateTable
CREATE TABLE "InAppNotificationRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "route" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "InAppNotificationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InAppNotificationRecord_userId_createdAt_idx" ON "InAppNotificationRecord"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "InAppNotificationRecord_readAt_idx" ON "InAppNotificationRecord"("readAt");

-- CreateTable
CREATE TABLE "NotificationPreferenceRecord" (
    "userId" TEXT NOT NULL,
    "email" BOOLEAN NOT NULL,
    "sms" BOOLEAN NOT NULL,
    "inApp" BOOLEAN NOT NULL,
    "playoutDisruption" BOOLEAN NOT NULL,
    "rightsBlocks" BOOLEAN NOT NULL,
    "financeApprovals" BOOLEAN NOT NULL,
    "admissionsDecisions" BOOLEAN NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreferenceRecord_pkey" PRIMARY KEY ("userId")
);
