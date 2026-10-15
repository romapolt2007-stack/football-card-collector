-- CreateEnum
CREATE TYPE "Position" AS ENUM ('GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF');

-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'LEGEND', 'ICON');

-- CreateEnum
CREATE TYPE "Foot" AS ENUM ('LEFT', 'RIGHT');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'SOLD', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('SPIN_PLAYER', 'SPIN_STADIUM', 'QUICK_SELL', 'MARKET_BUY', 'MARKET_SELL', 'MARKET_FEE', 'DAILY_BONUS');

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
CREATE TABLE "stadiums" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "openedYear" INTEGER NOT NULL,
    "rarity" "Rarity" NOT NULL,
    "clubId" TEXT NOT NULL,

    CONSTRAINT "stadiums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stadium_cards" (
    "id" TEXT NOT NULL,
    "stadiumId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "isListed" BOOLEAN NOT NULL DEFAULT false,
    "quickSellPrice" INTEGER NOT NULL,
    "obtainedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stadium_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tgId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "photoUrl" TEXT,
    "avatarIcon" TEXT,
    "coins" INTEGER NOT NULL DEFAULT 5000,
    "dailyStreak" INTEGER NOT NULL DEFAULT 0,
    "lastDailyClaimAt" TIMESTAMP(3),
    "lastFreeSpinAt" TIMESTAMP(3),
    "lastFreeStadiumSpinAt" TIMESTAMP(3),
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
    "cardId" TEXT,
    "stadiumCardId" TEXT,
    "sellerId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "buyNowPrice" INTEGER,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_bids" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "bidderId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_bids_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE UNIQUE INDEX "leagues_name_key" ON "leagues"("name");

-- CreateIndex
CREATE UNIQUE INDEX "clubs_leagueId_name_key" ON "clubs"("leagueId", "name");

-- CreateIndex
CREATE INDEX "players_rarity_idx" ON "players"("rarity");

-- CreateIndex
CREATE INDEX "players_clubId_idx" ON "players"("clubId");

-- CreateIndex
CREATE UNIQUE INDEX "stadiums_clubId_key" ON "stadiums"("clubId");

-- CreateIndex
CREATE INDEX "stadiums_rarity_idx" ON "stadiums"("rarity");

-- CreateIndex
CREATE INDEX "stadium_cards_ownerId_idx" ON "stadium_cards"("ownerId");

-- CreateIndex
CREATE INDEX "stadium_cards_stadiumId_idx" ON "stadium_cards"("stadiumId");

-- CreateIndex
CREATE UNIQUE INDEX "users_tgId_key" ON "users"("tgId");

-- CreateIndex
CREATE INDEX "cards_ownerId_idx" ON "cards"("ownerId");

-- CreateIndex
CREATE INDEX "cards_playerId_idx" ON "cards"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "listings_cardId_key" ON "listings"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "listings_stadiumCardId_key" ON "listings"("stadiumCardId");

-- CreateIndex
CREATE INDEX "listings_status_idx" ON "listings"("status");

-- CreateIndex
CREATE INDEX "market_bids_listingId_idx" ON "market_bids"("listingId");

-- CreateIndex
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");

-- AddForeignKey
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stadiums" ADD CONSTRAINT "stadiums_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stadium_cards" ADD CONSTRAINT "stadium_cards_stadiumId_fkey" FOREIGN KEY ("stadiumId") REFERENCES "stadiums"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stadium_cards" ADD CONSTRAINT "stadium_cards_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_stadiumCardId_fkey" FOREIGN KEY ("stadiumCardId") REFERENCES "stadium_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_bids" ADD CONSTRAINT "market_bids_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_bids" ADD CONSTRAINT "market_bids_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
