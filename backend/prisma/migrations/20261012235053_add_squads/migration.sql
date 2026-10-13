-- CreateTable
CREATE TABLE "squads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Состав 1',
    "formation" TEXT NOT NULL,
    "slots" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "squads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "squads_userId_idx" ON "squads"("userId");

-- AddForeignKey
ALTER TABLE "squads" ADD CONSTRAINT "squads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
