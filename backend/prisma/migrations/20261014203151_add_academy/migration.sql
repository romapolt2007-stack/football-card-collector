-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'ACADEMY';

-- AlterTable
ALTER TABLE "cards" ADD COLUMN     "academyEnrolledAt" TIMESTAMP(3);
