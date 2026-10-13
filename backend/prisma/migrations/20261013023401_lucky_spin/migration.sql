-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'EMERGENCY_BONUS';
ALTER TYPE "TransactionType" ADD VALUE 'LUCKY_SPIN';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastEmergencyBonusAt" TIMESTAMP(3),
ADD COLUMN     "luckySpinCount" INTEGER NOT NULL DEFAULT 0;
