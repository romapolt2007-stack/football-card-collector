import { Rarity } from "@prisma/client";
import { prisma } from "./prisma.js";

export interface StadiumCaseDef {
  id: string;
  title: string;
  priceCoins: number;
  weights: Record<Rarity, number>;
}

/** 4 типа кейсов стадионов — платная альтернатива бесплатному спину, растущая цена и шанс на топ-редкость. */
export const STADIUM_CASES: StadiumCaseDef[] = [
  {
    id: "bronze",
    title: "Бронзовый кейс",
    priceCoins: 15_000,
    weights: { BRONZE: 60, SILVER: 32, GOLD: 8, LEGEND: 0, ICON: 0 },
  },
  {
    id: "silver",
    title: "Серебряный кейс",
    priceCoins: 40_000,
    weights: { BRONZE: 15, SILVER: 45, GOLD: 32, LEGEND: 8, ICON: 0 },
  },
  {
    id: "gold",
    title: "Золотой кейс",
    priceCoins: 90_000,
    weights: { BRONZE: 0, SILVER: 15, GOLD: 50, LEGEND: 30, ICON: 5 },
  },
  {
    id: "legendary",
    title: "Легендарный кейс",
    priceCoins: 200_000,
    weights: { BRONZE: 0, SILVER: 0, GOLD: 20, LEGEND: 60, ICON: 20 },
  },
];

export function findStadiumCase(id: string): StadiumCaseDef | undefined {
  return STADIUM_CASES.find((c) => c.id === id);
}

/** Роллит редкость по весам кейса (среди тиров, которые реально есть в базе), потом стадион внутри тира. */
export async function openStadiumCase(caseDef: StadiumCaseDef) {
  const allStadiums = await prisma.stadium.findMany({ include: { club: { include: { league: true } } } });
  if (allStadiums.length === 0) return null;

  const byRarity = new Map<Rarity, typeof allStadiums>();
  for (const s of allStadiums) {
    if (!byRarity.has(s.rarity)) byRarity.set(s.rarity, []);
    byRarity.get(s.rarity)!.push(s);
  }

  const availableTiers = [...byRarity.keys()].filter((r) => caseDef.weights[r] > 0);
  if (availableTiers.length === 0) return null;

  const totalWeight = availableTiers.reduce((sum, r) => sum + caseDef.weights[r], 0);
  let roll = Math.random() * totalWeight;
  let chosenRarity = availableTiers[availableTiers.length - 1];
  for (const r of availableTiers) {
    roll -= caseDef.weights[r];
    if (roll <= 0) {
      chosenRarity = r;
      break;
    }
  }

  const pool = byRarity.get(chosenRarity)!;
  return pool[Math.floor(Math.random() * pool.length)];
}
