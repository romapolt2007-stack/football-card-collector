-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'ARCADE_PENALTY';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastFreeArcadePenaltyAt" TIMESTAMP(3);
