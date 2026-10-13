import { Rarity } from "@prisma/client";

export interface StakeTier {
  stake: number;
  label: string;
  weights: Record<Rarity, number>;
}

/**
 * Чем выше ставка — тем лучше базовые шансы на редкую карту.
 * Веса не обязаны суммироваться в 100 — нормализуются при розыгрыше.
 */
export const STAKE_TIERS: StakeTier[] = [
  {
    stake: 100,
    label: "Осторожно",
    weights: { BRONZE: 70, SILVER: 22, GOLD: 7, LEGEND: 0.9, ICON: 0.1 },
  },
  {
    stake: 300,
    label: "Уверенно",
    weights: { BRONZE: 55, SILVER: 28, GOLD: 14, LEGEND: 2.5, ICON: 0.5 },
  },
  {
    stake: 500,
    label: "Рискованно",
    weights: { BRONZE: 40, SILVER: 30, GOLD: 22, LEGEND: 6, ICON: 2 },
  },
  {
    stake: 1000,
    label: "Ва-банк",
    weights: { BRONZE: 20, SILVER: 30, GOLD: 32, LEGEND: 13, ICON: 5 },
  },
];

export function findStakeTier(stake: number): StakeTier | undefined {
  return STAKE_TIERS.find((t) => t.stake === stake);
}

const PITY_EVERY = 100;
const PITY_MULTIPLIER = 5;
/** +10% к весам редких уровней за уровень игрока, не выше 3x суммарно */
const LUCK_PER_LEVEL = 0.1;
const MAX_LEVEL_LUCK_MULTIPLIER = 3;

export interface LuckRollContext {
  spinNumberAfterThis: number; // счётчик ПОСЛЕ инкремента (1-based)
  userLevel: number;
}

export function isPitySpin(spinNumberAfterThis: number): boolean {
  return spinNumberAfterThis % PITY_EVERY === 0;
}

export function rollRarity(tier: StakeTier, ctx: LuckRollContext): { rarity: Rarity; wasPity: boolean } {
  const levelMultiplier = Math.min(
    MAX_LEVEL_LUCK_MULTIPLIER,
    1 + (ctx.userLevel - 1) * LUCK_PER_LEVEL,
  );
  const wasPity = isPitySpin(ctx.spinNumberAfterThis);
  const pityMultiplier = wasPity ? PITY_MULTIPLIER : 1;

  // буст применяем только к редким уровням (GOLD и выше) — бронза/серебро не растут,
  // иначе эффект размывается и в сумме ничего не меняется
  const boosted: Record<Rarity, number> = {
    BRONZE: tier.weights.BRONZE,
    SILVER: tier.weights.SILVER,
    GOLD: tier.weights.GOLD * levelMultiplier * (wasPity ? pityMultiplier : 1),
    LEGEND: tier.weights.LEGEND * levelMultiplier * pityMultiplier,
    ICON: tier.weights.ICON * levelMultiplier * pityMultiplier,
  };

  const total = Object.values(boosted).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const rarity of [Rarity.BRONZE, Rarity.SILVER, Rarity.GOLD, Rarity.LEGEND, Rarity.ICON]) {
    roll -= boosted[rarity];
    if (roll <= 0) return { rarity, wasPity };
  }
  return { rarity: Rarity.ICON, wasPity };
}
