import { prisma } from "./prisma.js";
import type { MatchEvent } from "./matchSimulation.js";

interface Params {
  starterCardIds: string[];
  benchCardIds: string[];
  events: MatchEvent[];
}

/**
 * Возвращает Prisma-операции (не awaited) для включения в общий $transaction
 * матча: у всех карт состава "сгорает" 1 матч пропуска (если был), и
 * начисляются новые — 2 матча за красную карточку, 1-3 (случайно) за травму.
 */
export async function buildDisciplineOps(params: Params) {
  const allCardIds = [...new Set([...params.starterCardIds, ...params.benchCardIds])];
  if (allCardIds.length === 0) return [];

  const currentCards = await prisma.card.findMany({
    where: { id: { in: allCardIds } },
    select: { id: true, unavailableMatches: true },
  });

  const newUnavailable = new Map<string, number>();
  for (const e of params.events) {
    if (e.team !== "user" || !e.cardId) continue;
    if (e.type === "RED") {
      newUnavailable.set(e.cardId, (newUnavailable.get(e.cardId) ?? 0) + 2);
    } else if (e.type === "INJURY") {
      const games = Math.floor(Math.random() * 3) + 1;
      newUnavailable.set(e.cardId, (newUnavailable.get(e.cardId) ?? 0) + games);
    }
  }

  return currentCards.map((card) => {
    const decayed = Math.max(0, card.unavailableMatches - 1);
    const added = newUnavailable.get(card.id) ?? 0;
    return prisma.card.update({ where: { id: card.id }, data: { unavailableMatches: decayed + added } });
  });
}
