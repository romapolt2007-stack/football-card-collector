import type { Rarity } from "@prisma/client";
import { prisma } from "./prisma.js";

/** Кулдаун бесплатного спина — только для стадионов (спин игроков платный, без кулдауна). */
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

/** Только для стадионов — крупные арены реже, вес ниже 1. */
const STADIUM_HIGH_CAPACITY_WEIGHT = 0.3;

// ──────────────────────────────────────────
// Платный спин игроков: без кулдауна, ставка от 1 000 до 10 000 000.
// Редкость выбирается ПЕРВОЙ по фиксированным весам (не зависит от того, кто
// конкретно попадётся) — так топ-карты вроде Холанда выпадают строго по
// своему проценту, а не "случайно чаще, чем должны". Игрок внутри выпавшей
// редкости выбирается уже потом, равномерно среди подходящих под фильтр.
// ──────────────────────────────────────────

export const MIN_SPIN_COST = 1_000;
export const MAX_SPIN_COST = 10_000_000;

const RARITY_ORDER: Rarity[] = ["BRONZE", "SILVER", "GOLD", "LEGEND", "ICON"];

/** Базовые шансы (на минимальной ставке, без баффов) — Бронза ~60%, Серебро ~25%, Золото ~12%, Легенда ~2.5%, Икона ~0.5% (резерв под игроков 94+). */
export const RARITY_WEIGHTS_BASE: Record<Rarity, number> = {
  BRONZE: 60,
  SILVER: 25,
  GOLD: 12,
  LEGEND: 2.5,
  ICON: 0.5,
};

/** Распределение на максимальной ставке — топ-редкости ощутимо вероятнее, но всё ещё не гарантированы. */
const RARITY_WEIGHTS_TOP: Record<Rarity, number> = {
  BRONZE: 8,
  SILVER: 17,
  GOLD: 35,
  LEGEND: 30,
  ICON: 10,
};

function stakeFactor(amount: number): number {
  const clamped = Math.min(MAX_SPIN_COST, Math.max(MIN_SPIN_COST, amount));
  return Math.log(clamped / MIN_SPIN_COST) / Math.log(MAX_SPIN_COST / MIN_SPIN_COST);
}

/** Линейная интерполяция весов от BASE (ставка = минимум) к TOP (ставка = максимум), плюс небольшой сдвиг от баффа стадиона. */
export function rarityWeightsForSpin(amount: number, stadiumBonus = 0): Record<Rarity, number> {
  const t = Math.min(1, Math.max(0, stakeFactor(amount) + stadiumBonus));
  const weights = {} as Record<Rarity, number>;
  for (const r of RARITY_ORDER) {
    weights[r] = RARITY_WEIGHTS_BASE[r] + (RARITY_WEIGHTS_TOP[r] - RARITY_WEIGHTS_BASE[r]) * t;
  }
  return weights;
}

function rollRarity(weights: Record<Rarity, number>): Rarity {
  const total = RARITY_ORDER.reduce((sum, r) => sum + weights[r], 0);
  let roll = Math.random() * total;
  for (const r of RARITY_ORDER) {
    roll -= weights[r];
    if (roll <= 0) return r;
  }
  return RARITY_ORDER[RARITY_ORDER.length - 1];
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

/** Живые (не распроданные сверх maxSupply) кандидаты под фильтр в конкретной редкости. */
async function candidatesForRarity(filters: SpinPlayerFilters, rarity: Rarity) {
  const candidates = await prisma.player.findMany({
    where: { ...playerWhere(filters), rarity },
    include: { club: { include: { league: true } }, _count: { select: { cards: true } } },
  });
  return candidates.filter((p) => p.maxSupply == null || p._count.cards < p.maxSupply);
}

/**
 * Крутит игрока: редкость — по фиксированным весам (см. rarityWeightsForSpin),
 * затем равномерный выбор игрока этой редкости среди подходящих под фильтр
 * (лига/клуб/страна). Если в выпавшей редкости под фильтром никого нет —
 * спускаемся по лесенке вниз (а если и там пусто — поднимаемся вверх), чтобы
 * узкий фильтр никогда не давал "пустой" результат, если хоть кто-то подходит.
 */
export async function spinPlayer(filters: SpinPlayerFilters, amount: number, stadiumBonus = 0) {
  const weights = rarityWeightsForSpin(amount, stadiumBonus);
  const startIdx = RARITY_ORDER.indexOf(rollRarity(weights));

  for (let i = startIdx; i >= 0; i--) {
    const pool = await candidatesForRarity(filters, RARITY_ORDER[i]);
    if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
  }
  for (let i = startIdx + 1; i < RARITY_ORDER.length; i++) {
    const pool = await candidatesForRarity(filters, RARITY_ORDER[i]);
    if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
  }
  return null;
}

/** Гарантированная топ-карта (награда за полную шкалу "Азарт") — ICON, а если таких нет под фильтром, то LEGEND, а если и их нет — GOLD. */
export async function spinPlayerGuaranteedTop(filters: SpinPlayerFilters) {
  for (const rarity of ["ICON", "LEGEND", "GOLD"] as Rarity[]) {
    const pool = await candidatesForRarity(filters, rarity);
    if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
  }
  return null;
}

export interface SpinStadiumFilters {
  leagueId?: string;
  clubId?: string;
}

function stadiumWhere(filters: SpinStadiumFilters) {
  return {
    ...(filters.leagueId ? { club: { leagueId: filters.leagueId } } : {}),
    ...(filters.clubId ? { clubId: filters.clubId } : {}),
  };
}

async function candidatesForStadiumRarity(filters: SpinStadiumFilters, rarity: Rarity) {
  return prisma.stadium.findMany({
    where: { ...stadiumWhere(filters), rarity },
    include: { club: { include: { league: true } } },
  });
}

/**
 * Платный спин стадионов по тому же принципу, что и игроков (см. spinPlayer): редкость — по
 * ставке через rarityWeightsForSpin, затем равномерный выбор среди стадионов под фильтр
 * (лига/клуб); лесенка вниз/вверх по редкости, если в выпавшей под фильтром никого нет.
 */
export async function spinStadiumStaked(filters: SpinStadiumFilters, amount: number, stadiumBonus = 0) {
  const weights = rarityWeightsForSpin(amount, stadiumBonus);
  const startIdx = RARITY_ORDER.indexOf(rollRarity(weights));

  for (let i = startIdx; i >= 0; i--) {
    const pool = await candidatesForStadiumRarity(filters, RARITY_ORDER[i]);
    if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
  }
  for (let i = startIdx + 1; i < RARITY_ORDER.length; i++) {
    const pool = await candidatesForStadiumRarity(filters, RARITY_ORDER[i]);
    if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
  }
  return null;
}

export async function spinStadium(topTierWeightBonus = 0) {
  const candidates = await prisma.stadium.findMany({ include: { club: { include: { league: true } } } });
  if (candidates.length === 0) return null;

  const weights = candidates.map((s) =>
    s.capacity > 65000 ? STADIUM_HIGH_CAPACITY_WEIGHT + topTierWeightBonus * 3 : 1,
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
// Азарт (Hot Streak) — серия спинов без долгих пауз заполняет шкалу; по
// достижении порога следующий спин ГАРАНТИРОВАННО топ-редкости (ICON/LEGEND/
// GOLD по убыванию доступности), затем серия сбрасывается. Порог зависит от
// уровня аккаунта: чем больше всего спинов сделано за всю историю, тем выше
// уровень и тем короче путь до гарантии.
// ──────────────────────────────────────────

export const HOT_STREAK_IDLE_RESET_MS = 30 * 60 * 1000;
export const SPINS_PER_LEVEL = 25;
export const HOT_STREAK_BASE_THRESHOLD = 150;
export const HOT_STREAK_LEVEL_REDUCTION = 2;
export const HOT_STREAK_MIN_THRESHOLD = 30;

export function playerLevel(totalSpins: number): number {
  return 1 + Math.floor(totalSpins / SPINS_PER_LEVEL);
}

/** Порог "Азарта" = 150 - уровень*2, но не ниже 30 (иначе гарантия станет слишком частой на высоких уровнях). */
export function hotStreakThreshold(totalSpins: number): number {
  const level = playerLevel(totalSpins);
  return Math.max(HOT_STREAK_MIN_THRESHOLD, HOT_STREAK_BASE_THRESHOLD - level * HOT_STREAK_LEVEL_REDUCTION);
}

/** Следующее значение серии: +1 за спин без долгой паузы, ещё +1 за жёсткий фильтр (выбран конкретный клуб). Капается порогом (нет смысла копить сверх него). */
export function nextHotStreak(currentStreak: number, lastSpinAt: Date | null, hardFilter: boolean, threshold: number): number {
  let streak: number;
  if (!lastSpinAt) {
    streak = 1;
  } else {
    const staleAt = lastSpinAt.getTime() + HOT_STREAK_IDLE_RESET_MS;
    streak = Date.now() <= staleAt ? currentStreak + 1 : 1;
  }
  if (hardFilter) streak += 1;
  return Math.min(threshold, streak);
}
