-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'BATTLE_PASS';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "battlePassPremium" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "battlePassXp" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "battle_pass_claims" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "track" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "battle_pass_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "battle_pass_claims_userId_idx" ON "battle_pass_claims"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "battle_pass_claims_userId_level_track_key" ON "battle_pass_claims"("userId", "level", "track");

-- AddForeignKey
ALTER TABLE "battle_pass_claims" ADD CONSTRAINT "battle_pass_claims_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
