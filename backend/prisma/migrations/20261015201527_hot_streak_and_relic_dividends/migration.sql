-- AlterTable
ALTER TABLE "users" ADD COLUMN     "hotStreakCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "relicDividendsCollectedAt" TIMESTAMP(3);
