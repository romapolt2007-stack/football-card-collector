import { prisma } from "./prisma.js";
import { getIo } from "./socket.js";
import { MARKET_FEE_RATE } from "./marketConstants.js";

const SWEEP_EVERY_MS = 30_000;

/**
 * Раз в 30с закрывает истёкшие аукционы: карта уходит победителю со ставкой —
 * если у него ХВАТАЕТ монет прямо сейчас (баланс мог измениться с момента
 * ставки), иначе пробуем следующую по убыванию ставку (каскад). Без эскроу
 * при самой ставке — не блокируем чужие монеты заранее, просто перепроверяем
 * на расчёте. Если ни одна ставка не прошла — лот снимается, карта
 * возвращается продавцу непроданной.
 */
export function startMarketAuctionSettler() {
  setInterval(async () => {
    try {
      const expired = await prisma.listing.findMany({
        where: { status: "ACTIVE", expiresAt: { lte: new Date() } },
        include: { bids: { orderBy: { amount: "desc" } } },
      });

      for (const listing of expired) {
        await settleOne(listing.id);
      }
    } catch (err) {
      console.error("Ошибка закрытия аукционов:", err);
    }
  }, SWEEP_EVERY_MS);
}

async function settleOne(listingId: string) {
  // Перечитываем внутри — на случай, если за время цикла лот уже купили через Buy Now.
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { bids: { orderBy: { amount: "desc" } } },
  });
  if (!listing || listing.status !== "ACTIVE") return;

  for (const bid of listing.bids) {
    const bidder = await prisma.user.findUnique({ where: { id: bid.bidderId } });
    if (!bidder || bidder.coins < bid.amount) continue;

    const fee = Math.round(bid.amount * MARKET_FEE_RATE);
    const sellerPayout = bid.amount - fee;

    const settled = await prisma.$transaction(async (tx) => {
      const fresh = await tx.listing.findUnique({ where: { id: listing.id } });
      if (!fresh || fresh.status !== "ACTIVE") return false;

      await tx.listing.update({ where: { id: listing.id }, data: { status: "SOLD" } });
      if (listing.cardId) {
        await tx.card.update({ where: { id: listing.cardId }, data: { ownerId: bid.bidderId, isListed: false } });
      } else if (listing.stadiumCardId) {
        await tx.stadiumCard.update({ where: { id: listing.stadiumCardId }, data: { ownerId: bid.bidderId, isListed: false } });
      }
      await tx.user.update({ where: { id: bid.bidderId }, data: { coins: { decrement: bid.amount } } });
      await tx.user.update({ where: { id: listing.sellerId }, data: { coins: { increment: sellerPayout } } });
      await tx.transaction.createMany({
        data: [
          { userId: bid.bidderId, type: "MARKET_BUY", amount: -bid.amount, meta: { listingId: listing.id, auction: true } },
          { userId: listing.sellerId, type: "MARKET_SELL", amount: sellerPayout, meta: { listingId: listing.id, auction: true } },
          { userId: listing.sellerId, type: "MARKET_FEE", amount: -fee, meta: { listingId: listing.id } },
        ],
      });
      return true;
    });

    if (settled) {
      getIo()?.emit("market:sold", { listingId: listing.id });
      return;
    }
  }

  // Ни одна ставка не прошла (или ставок не было вовсе) — лот снимается без продажи.
  await prisma.$transaction([
    prisma.listing.update({ where: { id: listing.id }, data: { status: "EXPIRED" } }),
    ...(listing.cardId ? [prisma.card.update({ where: { id: listing.cardId }, data: { isListed: false } })] : []),
    ...(listing.stadiumCardId ? [prisma.stadiumCard.update({ where: { id: listing.stadiumCardId }, data: { isListed: false } })] : []),
  ]);
  getIo()?.emit("market:removed", { listingId: listing.id });
}
