-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'CUP';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastFreeCupAt" TIMESTAMP(3);
