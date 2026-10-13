import { Rarity } from "@prisma/client";

/** Примерная цена быстрой продажи системе — черновая балансировка экономики. */
const VALUE_MULTIPLIER: Record<Rarity, number> = {
  [Rarity.BRONZE]: 2,
  [Rarity.SILVER]: 8,
  [Rarity.GOLD]: 40,
  [Rarity.LEGEND]: 300,
  [Rarity.ICON]: 2000,
};

export function quickSellPrice(rarity: Rarity, overall: number): number {
  return Math.round(overall * VALUE_MULTIPLIER[rarity]);
}
