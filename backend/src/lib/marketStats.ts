import { prisma } from "./prisma.js";

const RECENT_SALES_SAMPLE = 400;
const MAX_SALES_PER_ITEM = 10;

/**
 * Средняя цена продажи по игроку/стадиону за последние сделки — ориентир для
 * покупателя на рынке. Источник — завершённые (SOLD) лоты, а не Listing.price
 * (которое остаётся стартовой ценой и не обновляется финальной суммой);
 * реальная уплаченная сумма берётся из Transaction MARKET_BUY.
 */
export async function getAverageSalePrices(): Promise<{
  playerAvg: Map<string, number>;
  stadiumAvg: Map<string, number>;
}> {
  const buys = await prisma.transaction.findMany({
    where: { type: "MARKET_BUY" },
    orderBy: { createdAt: "desc" },
    take: RECENT_SALES_SAMPLE,
    select: { amount: true, meta: true },
  });

  const listingIds = [...new Set(buys.map((t) => (t.meta as { listingId?: string })?.listingId).filter((id): id is string => Boolean(id)))];
  if (listingIds.length === 0) return { playerAvg: new Map(), stadiumAvg: new Map() };

  const listings = await prisma.listing.findMany({
    where: { id: { in: listingIds } },
    select: { id: true, card: { select: { playerId: true } }, stadiumCard: { select: { stadiumId: true } } },
  });
  const listingById = new Map(listings.map((l) => [l.id, l]));

  const playerPrices = new Map<string, number[]>();
  const stadiumPrices = new Map<string, number[]>();

  for (const t of buys) {
    const listingId = (t.meta as { listingId?: string })?.listingId;
    if (!listingId) continue;
    const listing = listingById.get(listingId);
    if (!listing) continue;
    const price = Math.abs(t.amount);

    if (listing.card?.playerId) {
      const arr = playerPrices.get(listing.card.playerId) ?? [];
      if (arr.length < MAX_SALES_PER_ITEM) arr.push(price);
      playerPrices.set(listing.card.playerId, arr);
    } else if (listing.stadiumCard?.stadiumId) {
      const arr = stadiumPrices.get(listing.stadiumCard.stadiumId) ?? [];
      if (arr.length < MAX_SALES_PER_ITEM) arr.push(price);
      stadiumPrices.set(listing.stadiumCard.stadiumId, arr);
    }
  }

  const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  return {
    playerAvg: new Map([...playerPrices].map(([id, arr]) => [id, avg(arr)])),
    stadiumAvg: new Map([...stadiumPrices].map(([id, arr]) => [id, avg(arr)])),
  };
}
