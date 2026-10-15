import { prisma } from "./prisma.js";

/** Дивиденды за владение реликвией (maxSupply-лимитированной картой) — за штуку в сутки. */
export const RELIC_DIVIDEND_PER_CARD_PER_DAY = 500;
/** Копится лениво, но не бесконечно — потолок накопления, чтобы не было смысла не заходить месяцами. */
export const RELIC_DIVIDEND_MAX_ACCUMULATION_DAYS = 3;

export async function countUserRelics(userId: string): Promise<number> {
  return prisma.card.count({ where: { ownerId: userId, player: { maxSupply: { not: null } } } });
}

export function pendingRelicDividends(relicCount: number, collectedAt: Date | null, now: Date = new Date()): number {
  if (relicCount === 0) return 0;
  const since = collectedAt ?? new Date(now.getTime() - RELIC_DIVIDEND_MAX_ACCUMULATION_DAYS * 86_400_000);
  const elapsedDays = Math.min(
    RELIC_DIVIDEND_MAX_ACCUMULATION_DAYS,
    (now.getTime() - since.getTime()) / 86_400_000,
  );
  return Math.max(0, Math.round(relicCount * RELIC_DIVIDEND_PER_CARD_PER_DAY * elapsedDays));
}
