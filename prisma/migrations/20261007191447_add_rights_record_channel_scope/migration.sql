-- TSK-14: additive, nullable channel scope on the durable RightsRecord (NULL = every channel permitted).
-- AlterTable
ALTER TABLE "RightsRecord" ADD COLUMN     "channelCode" TEXT;

