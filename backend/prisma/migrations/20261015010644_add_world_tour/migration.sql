-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'WORLD_TOUR';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "worldTourStage" INTEGER NOT NULL DEFAULT 0;
