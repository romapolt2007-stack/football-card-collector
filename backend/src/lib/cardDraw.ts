import { Rarity } from "@prisma/client";
import { prisma } from "./prisma.js";
import { nextRarity, rarityIndex } from "./packs.js";

/** Распределение редкости — Icon и Legend стали заметно реже, чтобы оставаться настоящими трофеями. */
const BASE_WEIGHTS: Record<Rarity, number> = {
  [Rarity.BRONZE]: 54,
  [Rarity.SILVER]: 32,
  [Rarity.GOLD]: 11.7,
  [Rarity.LEGEND]: 2,
  [Rarity.ICON]: 0.3,
};

/** Внутри редкости карты с овералом выше этого порога выпадают реже — сила тоже должна быть "трофеем". */
const HIGH_OVERALL_THRESHOLD = 85;
const HIGH_OVERALL_WEIGHT_MULTIPLIER = 0.3;

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

/**
 * Случайный игрок заданной редкости — карты с овералом выше HIGH_OVERALL_THRESHOLD
 * выпадают реже даже внутри своей редкости (сила — тоже трофей, не только тир).
 * Берём пачку кандидатов и выбираем взвешенно в памяти, а не равновероятным skip.
 */
export async function randomPlayerByRarity(rarity: Rarity) {
  const candidates = await prisma.player.findMany({
    where: { rarity },
    include: { club: { include: { league: true } } },
  });
  if (candidates.length === 0) return null;

  const weights = candidates.map((p) => (p.overall > HIGH_OVERALL_THRESHOLD ? HIGH_OVERALL_WEIGHT_MULTIPLIER : 1));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
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
