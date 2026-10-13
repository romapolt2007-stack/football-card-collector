import { Rarity } from "@prisma/client";

export const MIN_STAKE = 100;
export const MAX_STAKE = 1000;
export const STAKE_STEP = 50;

/** Веса при минимальной ставке (100) — безопасно, почти всегда бронза/серебро. */
const MIN_WEIGHTS: Record<Rarity, number> = {
  BRONZE: 70,
  SILVER: 22,
  GOLD: 7,
  LEGEND: 0.9,
  ICON: 0.1,
};

/** Веса при максимальной ставке (1000) — заметно выше шанс на золото/легенду/икону. */
const MAX_WEIGHTS: Record<Rarity, number> = {
  BRONZE: 20,
  SILVER: 30,
  GOLD: 32,
  LEGEND: 13,
  ICON: 5,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Шансы — линейная интерполяция между MIN_WEIGHTS и MAX_WEIGHTS по ставке. */
export function weightsForStake(stake: number): Record<Rarity, number> {
  const t = clamp((stake - MIN_STAKE) / (MAX_STAKE - MIN_STAKE), 0, 1);
  const result = {} as Record<Rarity, number>;
  for (const rarity of Object.keys(MIN_WEIGHTS) as Rarity[]) {
    result[rarity] = MIN_WEIGHTS[rarity] + (MAX_WEIGHTS[rarity] - MIN_WEIGHTS[rarity]) * t;
  }
  return result;
}

export function isValidStake(stake: number): boolean {
  return Number.isInteger(stake) && stake >= MIN_STAKE && stake <= MAX_STAKE;
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

export function rollRarity(stake: number, ctx: LuckRollContext): { rarity: Rarity; wasPity: boolean } {
  const baseWeights = weightsForStake(stake);
  const levelMultiplier = Math.min(
    MAX_LEVEL_LUCK_MULTIPLIER,
    1 + (ctx.userLevel - 1) * LUCK_PER_LEVEL,
  );
  const wasPity = isPitySpin(ctx.spinNumberAfterThis);
  const pityMultiplier = wasPity ? PITY_MULTIPLIER : 1;

  // буст применяем только к редким уровням (GOLD и выше) — бронза/серебро не растут,
  // иначе эффект размывается и в сумме ничего не меняется
  const boosted: Record<Rarity, number> = {
    BRONZE: baseWeights.BRONZE,
    SILVER: baseWeights.SILVER,
    GOLD: baseWeights.GOLD * levelMultiplier * (wasPity ? pityMultiplier : 1),
    LEGEND: baseWeights.LEGEND * levelMultiplier * pityMultiplier,
    ICON: baseWeights.ICON * levelMultiplier * pityMultiplier,
  };

  const total = Object.values(boosted).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const rarity of [Rarity.BRONZE, Rarity.SILVER, Rarity.GOLD, Rarity.LEGEND, Rarity.ICON]) {
    roll -= boosted[rarity];
    if (roll <= 0) return { rarity, wasPity };
  }
  return { rarity: Rarity.ICON, wasPity };
}
