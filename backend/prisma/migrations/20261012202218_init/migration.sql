-- CreateEnum
CREATE TYPE "Position" AS ENUM ('GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF');

-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'LEGEND', 'ICON');

-- CreateEnum
CREATE TYPE "Foot" AS ENUM ('LEFT', 'RIGHT');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'SOLD', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MatchMode" AS ENUM ('QUICK', 'DIVISION_RIVALS', 'TOURNAMENT', 'DRAFT');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PACK_OPEN', 'CASE_SPIN', 'QUICK_SELL', 'MARKET_BUY', 'MARKET_SELL', 'MARKET_FEE', 'MATCH_REWARD', 'DAILY_BONUS', 'QUEST_REWARD', 'REFERRAL_BONUS', 'STARS_PURCHASE');

-- CreateTable
CREATE TABLE "leagues" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "leagues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clubs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "colorPrimary" TEXT NOT NULL,
    "colorSecondary" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "photoUrl" TEXT,
    "nation" TEXT NOT NULL,
    "nationFlag" TEXT NOT NULL,
    "position" "Position" NOT NULL,
    "overall" INTEGER NOT NULL,
    "pace" INTEGER NOT NULL,
    "shooting" INTEGER NOT NULL,
    "passing" INTEGER NOT NULL,
    "dribbling" INTEGER NOT NULL,
    "defending" INTEGER NOT NULL,
    "physical" INTEGER NOT NULL,
    "age" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "foot" "Foot" NOT NULL,
    "weakFoot" INTEGER NOT NULL DEFAULT 3,
    "skillMoves" INTEGER NOT NULL DEFAULT 3,
    "rarity" "Rarity" NOT NULL,
    "clubId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tgId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "photoUrl" TEXT,
    "coins" INTEGER NOT NULL DEFAULT 5000,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "teamName" TEXT,
    "teamLogo" TEXT,
    "teamColors" TEXT,
    "isVip" BOOLEAN NOT NULL DEFAULT false,
    "vipUntil" TIMESTAMP(3),
    "referralCode" TEXT NOT NULL,
    "referredBy" TEXT,
    "hasClaimedStarter" BOOLEAN NOT NULL DEFAULT false,
    "dailyStreak" INTEGER NOT NULL DEFAULT 0,
    "lastDailyClaimAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "rarity" "Rarity" NOT NULL,
    "isListed" BOOLEAN NOT NULL DEFAULT false,
    "quickSellPrice" INTEGER NOT NULL,
    "obtainedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "MatchMode" NOT NULL,
    "opponentName" TEXT NOT NULL,
    "opponentOvr" INTEGER NOT NULL,
    "userScore" INTEGER NOT NULL DEFAULT 0,
    "oppScore" INTEGER NOT NULL DEFAULT 0,
    "events" JSONB NOT NULL,
    "rewards" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quests" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "target" INTEGER NOT NULL,
    "reward" INTEGER NOT NULL,
    "isDaily" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_quests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_quests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leagues_name_key" ON "leagues"("name");

-- CreateIndex
CREATE UNIQUE INDEX "clubs_leagueId_name_key" ON "clubs"("leagueId", "name");

-- CreateIndex
CREATE INDEX "players_rarity_idx" ON "players"("rarity");

-- CreateIndex
CREATE INDEX "players_clubId_idx" ON "players"("clubId");

-- CreateIndex
CREATE UNIQUE INDEX "users_tgId_key" ON "users"("tgId");

-- CreateIndex
CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");

-- CreateIndex
CREATE INDEX "cards_ownerId_idx" ON "cards"("ownerId");

-- CreateIndex
CREATE INDEX "cards_playerId_idx" ON "cards"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "listings_cardId_key" ON "listings"("cardId");

-- CreateIndex
CREATE INDEX "listings_status_idx" ON "listings"("status");

-- CreateIndex
CREATE INDEX "matches_userId_idx" ON "matches"("userId");

-- CreateIndex
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "quests_code_key" ON "quests"("code");

-- CreateIndex
CREATE UNIQUE INDEX "user_quests_userId_questId_expiresAt_key" ON "user_quests"("userId", "questId", "expiresAt");

-- AddForeignKey
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quests" ADD CONSTRAINT "user_quests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quests" ADD CONSTRAINT "user_quests_questId_fkey" FOREIGN KEY ("questId") REFERENCES "quests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
