-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'GLOBAL_TOURNAMENT';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastFreeTournamentAt" TIMESTAMP(3);
