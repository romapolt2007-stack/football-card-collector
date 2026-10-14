-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'SBC_SUBMIT';

-- CreateTable
CREATE TABLE "sbc_completions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sbcId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sbc_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sbc_completions_userId_idx" ON "sbc_completions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "sbc_completions_userId_sbcId_key" ON "sbc_completions"("userId", "sbcId");

-- AddForeignKey
ALTER TABLE "sbc_completions" ADD CONSTRAINT "sbc_completions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
