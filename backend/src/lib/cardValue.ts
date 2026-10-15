import { Rarity } from "@prisma/client";

/** Базовая цена быстрой продажи системе — выше, чем раньше, под новую экономику. */
const VALUE_MULTIPLIER: Record<Rarity, number> = {
  [Rarity.BRONZE]: 3,
  [Rarity.SILVER]: 14,
  [Rarity.GOLD]: 70,
  [Rarity.LEGEND]: 550,
  [Rarity.ICON]: 4000,
};

export interface PlayerStatsLike {
  overall: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Множитель от характеристик — одинаковый overall, но разный "профиль" даёт
 * разную цену: крепкий, сбалансированный игрок (под-статы выше overall)
 * ценится дороже однобокого с тем же overall.
 */
function statFactor(stats: PlayerStatsLike): number {
  const avgSubStats = (stats.pace + stats.shooting + stats.passing + stats.dribbling + stats.defending + stats.physical) / 6;
  return clamp(1 + (avgSubStats - stats.overall) / 80, 0.8, 1.3);
}

export function quickSellPrice(rarity: Rarity, player: number | PlayerStatsLike): number {
  const overall = typeof player === "number" ? player : player.overall;
  const factor = typeof player === "number" ? 1 : statFactor(player);
  return Math.round(overall * VALUE_MULTIPLIER[rarity] * factor);
}

/** Цена быстрой продажи стадиона — по редкости (от вместимости) и самой вместимости. */
export function stadiumQuickSellPrice(rarity: Rarity, capacity: number): number {
  return Math.round((capacity / 100) * VALUE_MULTIPLIER[rarity]);
}
