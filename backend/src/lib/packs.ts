import { Rarity } from "@prisma/client";

export interface PackDef {
  id: string;
  title: string;
  priceCoins: number;
  cardCount: number;
  /** Нижняя граница редкости для каждой карты (кроме бонусных слотов) */
  minRarity: Rarity;
  /** Шанс апгрейда последней карты до следующего по редкости уровня (0..1) */
  bonusChance: number;
  /** true — доступен один раз бесплатно */
  isStarter?: boolean;
}

const RARITY_ORDER: Rarity[] = [
  Rarity.BRONZE,
  Rarity.SILVER,
  Rarity.GOLD,
  Rarity.LEGEND,
  Rarity.ICON,
];

export function rarityIndex(rarity: Rarity): number {
  return RARITY_ORDER.indexOf(rarity);
}

export function nextRarity(rarity: Rarity): Rarity {
  const i = rarityIndex(rarity);
  return RARITY_ORDER[Math.min(i + 1, RARITY_ORDER.length - 1)];
}

export const PACKS: PackDef[] = [
  {
    id: "starter",
    title: "Starter Pack",
    priceCoins: 0,
    cardCount: 5,
    minRarity: Rarity.BRONZE,
    bonusChance: 1, // последняя карта гарантированно золото
    isStarter: true,
  },
  {
    id: "bronze",
    title: "Bronze Pack",
    priceCoins: 3500,
    cardCount: 3,
    minRarity: Rarity.BRONZE,
    bonusChance: 0,
  },
  {
    id: "silver",
    title: "Silver Pack",
    priceCoins: 16000,
    cardCount: 3,
    minRarity: Rarity.SILVER,
    bonusChance: 0,
  },
  {
    id: "gold",
    title: "Gold Pack",
    priceCoins: 65000,
    cardCount: 5,
    minRarity: Rarity.GOLD,
    bonusChance: 0,
  },
  {
    id: "legend",
    title: "Legend Pack",
    priceCoins: 320000,
    cardCount: 3,
    minRarity: Rarity.GOLD,
    bonusChance: 0.05, // шанс апгрейда одной карты до LEGEND
  },
  {
    id: "icon",
    title: "Icon Pack",
    priceCoins: 1600000,
    cardCount: 1,
    minRarity: Rarity.LEGEND,
    bonusChance: 0.05, // шанс апгрейда до ICON
  },
];

export function findPack(id: string): PackDef | undefined {
  return PACKS.find((p) => p.id === id);
}
