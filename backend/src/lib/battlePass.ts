import type { Rarity } from "@prisma/client";

/**
 * Battle Pass — один бессрочный сезон в v1 (без реальной временной ротации,
 * можно параметризовать позже). XP растёт синхронно с обычным account XP
 * (см. xp.ts), поэтому прогресс органический — без отдельного фарма.
 * Премиум-ветка покупается за игровые монеты, а не за Telegram Stars.
 */
export const BATTLE_PASS_MAX_LEVEL = 30;
export const BATTLE_PASS_XP_PER_LEVEL = 500;
export const BATTLE_PASS_PREMIUM_COST = 15000;

export function battlePassLevel(xp: number): number {
  return Math.min(BATTLE_PASS_MAX_LEVEL, Math.floor(xp / BATTLE_PASS_XP_PER_LEVEL));
}

export interface BattlePassReward {
  coins: number;
  guaranteedRarity: Rarity | null;
}

export function freeReward(level: number): BattlePassReward {
  const guaranteedRarity: Rarity | null = level === BATTLE_PASS_MAX_LEVEL ? "SILVER" : level % 5 === 0 ? "BRONZE" : null;
  return { coins: 100 + level * 20, guaranteedRarity };
}

export function premiumReward(level: number): BattlePassReward {
  const guaranteedRarity: Rarity | null =
    level === BATTLE_PASS_MAX_LEVEL ? "LEGEND" : level % 10 === 0 ? "GOLD" : level % 5 === 0 ? "SILVER" : null;
  return { coins: 300 + level * 60, guaranteedRarity };
}

export function rewardFor(level: number, track: "FREE" | "PREMIUM"): BattlePassReward {
  return track === "FREE" ? freeReward(level) : premiumReward(level);
}
