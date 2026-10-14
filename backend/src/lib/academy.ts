import type { Rarity } from "@prisma/client";

/**
 * Академия молодёжи — BRONZE/SILVER карта растёт на 1 уровень редкости за
 * фиксированное время (lazy, без крон-джобы — тот же паттерн, что
 * lastFreeLuckySpinAt/lastFreeArcadePenaltyAt). Стартует от GOLD и выше.
 * Наравне с ростом редкости даёт +1 OVR тем же trainingBoost-полем, что
 * обычная тренировка — иначе "рост" был бы чисто декоративным (боевая сила
 * считается по player.overall + trainingBoost, не по rarity).
 */
export const ACADEMY_DURATION_MS = 20 * 60 * 60 * 1000; // 20 часов

export const ACADEMY_ENROLL_COST: Partial<Record<Rarity, number>> = {
  BRONZE: 300,
  SILVER: 800,
};

const PROMOTION: Partial<Record<Rarity, Rarity>> = {
  BRONZE: "SILVER",
  SILVER: "GOLD",
};

export function isAcademyEligible(rarity: Rarity): boolean {
  return rarity in ACADEMY_ENROLL_COST;
}

export function nextRarity(rarity: Rarity): Rarity | null {
  return PROMOTION[rarity] ?? null;
}

export function msUntilGraduation(enrolledAt: Date | null): number {
  if (!enrolledAt) return Infinity;
  const elapsed = Date.now() - enrolledAt.getTime();
  return Math.max(0, ACADEMY_DURATION_MS - elapsed);
}
