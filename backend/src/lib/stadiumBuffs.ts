import { Rarity } from "@prisma/client";
import { prisma } from "./prisma.js";

export interface StadiumBuff {
  /** Добавка к весу LEGEND/ICON при спине игроков/открытии кейсов стадионов (0.05 = +5%). */
  topTierWeightBonus: number;
  /** Доп. слотов активных лотов на рынке сверх базового лимита. */
  extraListingSlots: number;
  /** Редкость лучшего стадиона игрока (для UI) — null, если стадионов нет. */
  bestRarity: Rarity | null;
}

const RARITY_ORDER: Rarity[] = ["BRONZE", "SILVER", "GOLD", "LEGEND", "ICON"];

const BUFF_BY_RARITY: Record<Rarity, { topTierWeightBonus: number; extraListingSlots: number }> = {
  BRONZE: { topTierWeightBonus: 0, extraListingSlots: 0 },
  SILVER: { topTierWeightBonus: 0.01, extraListingSlots: 1 },
  GOLD: { topTierWeightBonus: 0.03, extraListingSlots: 3 },
  LEGEND: { topTierWeightBonus: 0.05, extraListingSlots: 6 },
  ICON: { topTierWeightBonus: 0.08, extraListingSlots: 10 },
};

/**
 * Стадионы — не просто коллекция, а бафф: лучший ИЗ ВЛАДЕЕМЫХ стадионов
 * (по редкости вместимости) даёт постоянный пассивный эффект, пока карта в
 * коллекции (продали/сожгли — бафф слетает естественно, без счётчиков).
 */
export async function getUserStadiumBuff(userId: string): Promise<StadiumBuff> {
  const owned = await prisma.stadiumCard.findMany({
    where: { ownerId: userId },
    select: { stadium: { select: { rarity: true } } },
  });
  if (owned.length === 0) return { topTierWeightBonus: 0, extraListingSlots: 0, bestRarity: null };

  let best: Rarity = "BRONZE";
  for (const { stadium } of owned) {
    if (RARITY_ORDER.indexOf(stadium.rarity) > RARITY_ORDER.indexOf(best)) best = stadium.rarity;
  }

  return { ...BUFF_BY_RARITY[best], bestRarity: best };
}
