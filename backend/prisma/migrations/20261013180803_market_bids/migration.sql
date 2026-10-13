-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "buyNowPrice" INTEGER;

-- CreateTable
CREATE TABLE "market_bids" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "bidderId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_bids_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "market_bids_listingId_idx" ON "market_bids"("listingId");

-- AddForeignKey
ALTER TABLE "market_bids" ADD CONSTRAINT "market_bids_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_bids" ADD CONSTRAINT "market_bids_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
