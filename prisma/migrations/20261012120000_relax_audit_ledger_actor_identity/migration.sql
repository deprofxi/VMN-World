-- TSK-18 (box 1): make the durable audit ledger writable.
--
-- `AuditLog_userId_fkey` refused any entry whose actor had no `User` row and,
-- through `onDelete: SetNull`, retroactively blanked the actor of entries whose
-- user was later deleted. Measured on the development database before this
-- migration: 1783 of 1783 durable rows carried `userId = NULL`, and a write
-- rejected by the FK used to degrade the whole ledger to memory silently. An
-- append-only evidence ledger cannot take its authority from a mutable business
-- table, so the actor is recorded verbatim and resolved to a `User` at query
-- time instead. No row and no column is dropped; the values stay.
--
-- `tenantId` becomes a real column so a durable row can be scoped without
-- reopening the hashed payload.

-- AlterTable
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";
ALTER TABLE "AuditLog" ADD COLUMN     "tenantId" TEXT;

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");
