-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'FREE_BONUS';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "freeBonusNotifiedAt" TIMESTAMP(3),
ADD COLUMN     "lastFreeBonusAt" TIMESTAMP(3);
