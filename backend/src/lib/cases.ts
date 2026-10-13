import { Rarity } from "@prisma/client";

export type PrizeType = "CARD" | "COINS" | "JACKPOT";

export interface PrizeDef {
  type: PrizeType;
  weight: number;
  rarity?: Rarity;
  coinsMin?: number;
  coinsMax?: number;
  jackpotMultiplier?: number;
}

export interface CaseDef {
  id: string;
  title: string;
  priceCoins: number;
  prizes: PrizeDef[];
}

export const CASES: CaseDef[] = [
  {
    id: "common",
    title: "Common Case",
    priceCoins: 5000,
    prizes: [
      { type: "COINS", weight: 60, coinsMin: 500, coinsMax: 2000 },
      { type: "CARD", weight: 25, rarity: Rarity.BRONZE },
      { type: "CARD", weight: 10, rarity: Rarity.SILVER },
      { type: "CARD", weight: 4, rarity: Rarity.GOLD },
      { type: "JACKPOT", weight: 1, jackpotMultiplier: 3 },
    ],
  },
  {
    id: "rare",
    title: "Rare Case",
    priceCoins: 25000,
    prizes: [
      { type: "COINS", weight: 50, coinsMin: 3000, coinsMax: 10000 },
      { type: "CARD", weight: 25, rarity: Rarity.SILVER },
      { type: "CARD", weight: 15, rarity: Rarity.GOLD },
      { type: "CARD", weight: 8, rarity: Rarity.LEGEND },
      { type: "JACKPOT", weight: 2, jackpotMultiplier: 3 },
    ],
  },
  {
    id: "epic",
    title: "Epic Case",
    priceCoins: 100_000,
    prizes: [
      { type: "COINS", weight: 40, coinsMin: 15_000, coinsMax: 40_000 },
      { type: "CARD", weight: 20, rarity: Rarity.GOLD },
      { type: "CARD", weight: 25, rarity: Rarity.LEGEND },
      { type: "CARD", weight: 10, rarity: Rarity.ICON },
      { type: "JACKPOT", weight: 5, jackpotMultiplier: 3 },
    ],
  },
  {
    id: "mythic",
    title: "Mythic Case",
    priceCoins: 500_000,
    prizes: [
      { type: "COINS", weight: 30, coinsMin: 80_000, coinsMax: 200_000 },
      { type: "CARD", weight: 20, rarity: Rarity.LEGEND },
      { type: "CARD", weight: 35, rarity: Rarity.ICON },
      { type: "JACKPOT", weight: 15, jackpotMultiplier: 3 },
    ],
  },
];

export function findCase(id: string): CaseDef | undefined {
  return CASES.find((c) => c.id === id);
}

export function rollPrize(caseDef: CaseDef): PrizeDef {
  const total = caseDef.prizes.reduce((sum, p) => sum + p.weight, 0);
  let roll = Math.random() * total;
  for (const prize of caseDef.prizes) {
    roll -= prize.weight;
    if (roll <= 0) return prize;
  }
  return caseDef.prizes[caseDef.prizes.length - 1];
}
