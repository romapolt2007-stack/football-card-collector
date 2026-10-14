import { Rarity } from "@prisma/client";
import { prisma } from "./prisma.js";
import { nextRarity, rarityIndex } from "./packs.js";

/** Базовое распределение редкости — то же, что в сиде игроков. */
const BASE_WEIGHTS: Record<Rarity, number> = {
  [Rarity.BRONZE]: 60,
  [Rarity.SILVER]: 25,
  [Rarity.GOLD]: 13.3,
  [Rarity.LEGEND]: 1.2,
  [Rarity.ICON]: 0.5,
};

const ALL_RARITIES = [Rarity.BRONZE, Rarity.SILVER, Rarity.GOLD, Rarity.LEGEND, Rarity.ICON];

/** Редкость среди тех, что >= minRarity, по перенормированным весам. */
function rollRarityAtLeast(minRarity: Rarity): Rarity {
  const allowed = ALL_RARITIES.filter((r) => rarityIndex(r) >= rarityIndex(minRarity));
  const totalWeight = allowed.reduce((sum, r) => sum + BASE_WEIGHTS[r], 0);
  let roll = Math.random() * totalWeight;
  for (const rarity of allowed) {
    roll -= BASE_WEIGHTS[rarity];
    if (roll <= 0) return rarity;
  }
  return allowed[allowed.length - 1];
}

/** Случайный игрок заданной редкости (равновероятно среди всех подходящих). */
export async function randomPlayerByRarity(rarity: Rarity) {
  const count = await prisma.player.count({ where: { rarity } });
  if (count === 0) return null;
  const skip = Math.floor(Math.random() * count);
  const [player] = await prisma.player.findMany({
    where: { rarity },
    include: { club: { include: { league: true } } },
    take: 1,
    skip,
  });
  return player ?? null;
}

export interface DrawnCard {
  player: NonNullable<Awaited<ReturnType<typeof randomPlayerByRarity>>>;
  rarity: Rarity;
}

/**
 * Разыгрывает карты для пака: `count` карт не ниже `minRarity`,
 * с шансом `bonusChance` апгрейдить последнюю карту на уровень выше.
 */
export async function drawPackCards(
  count: number,
  minRarity: Rarity,
  bonusChance: number,
): Promise<DrawnCard[]> {
  const results: DrawnCard[] = [];

  for (let i = 0; i < count; i++) {
    let rarity = rollRarityAtLeast(minRarity);

    const isLastSlot = i === count - 1;
    if (isLastSlot && bonusChance > 0 && Math.random() < bonusChance) {
      rarity = nextRarity(rarity);
    }

    let player = await randomPlayerByRarity(rarity);
    // На случай, если в базе нет игроков именно этой редкости — берём ближайшую ниже
    while (!player && rarityIndex(rarity) > 0) {
      rarity = ALL_RARITIES[rarityIndex(rarity) - 1];
      player = await randomPlayerByRarity(rarity);
    }
    if (!player) continue;

    results.push({ player, rarity });
  }

  return results;
}

/** Один гарантированный игрок заданной редкости — для наград SBC и подобных гарантированных выдач. */
export async function drawGuaranteedCard(rarity: Rarity): Promise<DrawnCard | null> {
  const player = await randomPlayerByRarity(rarity);
  if (!player) return null;
  return { player, rarity };
}
