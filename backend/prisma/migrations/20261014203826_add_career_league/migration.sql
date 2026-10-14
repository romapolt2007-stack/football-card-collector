-- CreateEnum
CREATE TYPE "CareerLeague" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'CHAMPION');

-- CreateTable
CREATE TABLE "career_trophies" (
    "userId" TEXT NOT NULL,
    "league" "CareerLeague" NOT NULL DEFAULT 'BRONZE',
    "points" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_trophies_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "career_trophies" ADD CONSTRAINT "career_trophies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
