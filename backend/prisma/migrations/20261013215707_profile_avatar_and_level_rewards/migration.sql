-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'LEVEL_UP';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarIcon" TEXT;
