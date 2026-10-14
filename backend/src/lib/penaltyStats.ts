import { prisma } from "./prisma.js";
import type { RoundOutcome } from "./shootout.js";

/** Единый счётчик пенальти-мастерства — инкрементируется из всех 3 режимов (серия/аркада/Дуэль), т.к. все используют resolveRound(). */
export async function recordPenaltyOutcome(userId: string, outcome: RoundOutcome): Promise<void> {
  if (!outcome.userScored && !outcome.userSaved) return;
  await prisma.user.update({
    where: { id: userId },
    data: {
      penaltyGoals: outcome.userScored ? { increment: 1 } : undefined,
      penaltySaves: outcome.userSaved ? { increment: 1 } : undefined,
    },
  });
}

export const PENALTY_TIER_THRESHOLDS = [10, 50, 150, 500];
export const PENALTY_TIER_LABELS = ["Бронза", "Серебро", "Золото", "Платина"];

export interface PenaltyTierInfo {
  tier: number; // 0 = ещё не открыт первый уровень
  tierLabel: string | null;
  nextThreshold: number | null;
}

export function tierFor(count: number): PenaltyTierInfo {
  let tier = 0;
  for (const threshold of PENALTY_TIER_THRESHOLDS) {
    if (count >= threshold) tier++;
    else break;
  }
  const nextThreshold = tier < PENALTY_TIER_THRESHOLDS.length ? PENALTY_TIER_THRESHOLDS[tier] : null;
  return { tier, tierLabel: tier > 0 ? PENALTY_TIER_LABELS[tier - 1] : null, nextThreshold };
}
