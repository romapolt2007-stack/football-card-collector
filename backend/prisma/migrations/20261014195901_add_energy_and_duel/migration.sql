-- CreateEnum
CREATE TYPE "DuelLeague" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'CHAMPION');

-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'DUEL';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "energy" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "energyUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "duel_trophies" (
    "userId" TEXT NOT NULL,
    "league" "DuelLeague" NOT NULL DEFAULT 'BRONZE',
    "points" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "duel_trophies_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "duel_matches" (
    "id" TEXT NOT NULL,
    "attackerId" TEXT NOT NULL,
    "opponentName" TEXT NOT NULL,
    "opponentOvr" INTEGER NOT NULL,
    "isRealOpponent" BOOLEAN NOT NULL DEFAULT false,
    "attackerScore" INTEGER NOT NULL,
    "defenderScore" INTEGER NOT NULL,
    "won" BOOLEAN NOT NULL,
    "pointsDelta" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "duel_matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "duel_matches_attackerId_idx" ON "duel_matches"("attackerId");

-- AddForeignKey
ALTER TABLE "duel_trophies" ADD CONSTRAINT "duel_trophies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duel_matches" ADD CONSTRAINT "duel_matches_attackerId_fkey" FOREIGN KEY ("attackerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
