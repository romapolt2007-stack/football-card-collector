import type { Rarity } from "@prisma/client";
import { prisma } from "./prisma.js";

/** Кулдаун бесплатного спина — теперь только для стадионов (спин игроков платный, без кулдауна). */
export const FREE_SPIN_COOLDOWN_MS = 4 * 60 * 60 * 1000;

export function freeSpinReady(lastFreeSpinAt: Date | null): boolean {
  if (!lastFreeSpinAt) return true;
  return Date.now() - lastFreeSpinAt.getTime() >= FREE_SPIN_COOLDOWN_MS;
}

export function msUntilFreeSpin(lastFreeSpinAt: Date | null): number {
  if (!lastFreeSpinAt) return 0;
  const left = FREE_SPIN_COOLDOWN_MS - (Date.now() - lastFreeSpinAt.getTime());
  return Math.max(0, left);
}

/** Внутри позиции игроки с овералом выше порога выпадают реже — сила тоже должна быть трофеем. */
const HIGH_OVERALL_THRESHOLD = 85;
const HIGH_OVERALL_WEIGHT_MULTIPLIER = 0.3;

// ──────────────────────────────────────────
// Платный спин игроков: без кулдауна, игрок сам выбирает сумму ставки —
// чем больше платит, тем выше шанс выбить игрока с высоким overall (а значит
// и более высокую редкость, т.к. редкость — чистая функция от overall).
// ──────────────────────────────────────────

export const MIN_SPIN_COST = 1_000;
export const MAX_SPIN_COST = 10_000_000;

/** На минимальной ставке — те же шансы, что были при бесплатном спине (0.3x). На максимальной — сильные игроки выпадают в 6 раз ЧАЩЕ обычных, не реже. Шкала логарифмическая — диапазон охватывает 4 порядка. */
export function paidSpinWeightMultiplier(amount: number): number {
  const clamped = Math.min(MAX_SPIN_COST, Math.max(MIN_SPIN_COST, amount));
  const t = Math.log(clamped / MIN_SPIN_COST) / Math.log(MAX_SPIN_COST / MIN_SPIN_COST);
  const MAX_MULTIPLIER = 6;
  return HIGH_OVERALL_WEIGHT_MULTIPLIER + t * (MAX_MULTIPLIER - HIGH_OVERALL_WEIGHT_MULTIPLIER);
}

export interface SpinPlayerFilters {
  leagueId?: string;
  clubId?: string;
  nation?: string;
}

function playerWhere(filters: SpinPlayerFilters) {
  return {
    ...(filters.leagueId ? { club: { leagueId: filters.leagueId } } : {}),
    ...(filters.clubId ? { clubId: filters.clubId } : {}),
    ...(filters.nation ? { nation: filters.nation } : {}),
  };
}

/**
 * Крутит игрока: сначала позиция из тех, что реально есть в отфильтрованном
 * (лига/клуб/страна) пуле — так сужение фильтров никогда не даёт "пустой"
 * результат из-за того, что в клубе, например, нет вратаря в базе — затем
 * взвешенный выбор внутри позиции. Редкость не рестится отдельно — она уже
 * закреплена на Player.rarity при сидировании (чистая функция от overall).
 *
 * Ультра-редкие игроки (Player.maxSupply) исключаются из пула, когда живых
 * карт этого игрока уже maxSupply или больше — лимит по факту владения, не
 * отдельный счётчик, поэтому освобождается сам, если копии распроданы/сожжены.
 */
export async function spinPlayer(filters: SpinPlayerFilters = {}, weightMultiplier = HIGH_OVERALL_WEIGHT_MULTIPLIER) {
  const candidates = await prisma.player.findMany({
    where: playerWhere(filters),
    include: { club: { include: { league: true } }, _count: { select: { cards: true } } },
  });

  const available = candidates.filter((p) => p.maxSupply == null || p._count.cards < p.maxSupply);
  if (available.length === 0) return null;

  const positions = [...new Set(available.map((p) => p.position))];
  const position = positions[Math.floor(Math.random() * positions.length)];
  const inPosition = available.filter((p) => p.position === position);

  const weights = inPosition.map((p) => (p.overall > HIGH_OVERALL_THRESHOLD ? weightMultiplier : 1));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  for (let i = 0; i < inPosition.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return inPosition[i];
  }
  return inPosition[inPosition.length - 1];
}

export async function spinStadium(topTierWeightBonus = 0) {
  const candidates = await prisma.stadium.findMany({ include: { club: { include: { league: true } } } });
  if (candidates.length === 0) return null;

  const weights = candidates.map((s) =>
    s.capacity > 65000 ? HIGH_OVERALL_WEIGHT_MULTIPLIER + topTierWeightBonus * 3 : 1,
  );
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

// ──────────────────────────────────────────
// Азарт (Hot Streak) — растущий шанс апгрейда результата спина до LEGEND/ICON
// ──────────────────────────────────────────

/** Спин без кулдауна — серия растёт, пока игрок крутит без долгих пауз; простой дольше этого — и серия сбрасывается. */
export const HOT_STREAK_IDLE_RESET_MS = 30 * 60 * 1000;
export const HOT_STREAK_MAX = 12;

/** Следующее значение серии: +1 за спин без долгой паузы, ещё +1 за жёсткий фильтр (выбран конкретный клуб). */
export function nextHotStreak(currentStreak: number, lastSpinAt: Date | null, hardFilter: boolean): number {
  let streak: number;
  if (!lastSpinAt) {
    streak = 1;
  } else {
    const staleAt = lastSpinAt.getTime() + HOT_STREAK_IDLE_RESET_MS;
    streak = Date.now() <= staleAt ? currentStreak + 1 : 1;
  }
  if (hardFilter) streak += 1;
  return Math.min(HOT_STREAK_MAX, streak);
}

export function hotStreakUpgradeChance(streak: number, stadiumTopTierBonus: number): number {
  return Math.min(0.5, streak * 0.03 + stadiumTopTierBonus);
}

const TOP_TIER: Rarity[] = ["LEGEND", "ICON"];

/** Попытка "подброса" — если повезло, подменяет результат на LEGEND/ICON из того же отфильтрованного пула. */
export async function attemptTopTierUpgrade(filters: SpinPlayerFilters, chance: number) {
  if (chance <= 0 || Math.random() >= chance) return null;

  const candidates = await prisma.player.findMany({
    where: { ...playerWhere(filters), rarity: { in: TOP_TIER } },
    include: { club: { include: { league: true } }, _count: { select: { cards: true } } },
  });
  const available = candidates.filter((p) => p.maxSupply == null || p._count.cards < p.maxSupply);
  if (available.length === 0) return null;

  return available[Math.floor(Math.random() * available.length)];
}
