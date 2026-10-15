import { Position, Rarity } from "@prisma/client";

// ──────────────────────────────────────────
// Общая логика для сидирования РЕАЛЬНЫХ данных (prisma/data/clubs.json,
// prisma/data/players.json) — имена/клубы/нации реальные (текст, без
// фото/логотипов), рейтинг и суб-статы — собственная формула.
// ──────────────────────────────────────────

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Редкость — чистая функция от overall. Пороги откалиброваны под полный пул
 * ~1600 игроков топ-5 лиг + РПЛ (полные составы клубов, не только звёзды) —
 * такой пул распределён гораздо ближе к реальному (большинство — рядовые
 * игроки ростера), поэтому границы ниже, чем в версии под маленький
 * пул из 80 звёзд. Эмпирически на текущих данных: Бронза ~46%, Серебро ~39%,
 * Золото ~12%, Легенда ~2.5%, Икона — пока пусто (резерв под игроков 94+).
 */
export function rarityForOverall(overall: number): Rarity {
  if (overall <= 80) return Rarity.BRONZE;
  if (overall <= 84) return Rarity.SILVER;
  if (overall <= 90) return Rarity.GOLD;
  if (overall <= 93) return Rarity.LEGEND;
  return Rarity.ICON;
}

/** Стадионы — отдельная шкала редкости по вместимости (пороги из ТЗ). */
export function rarityForCapacity(capacity: number): Rarity {
  if (capacity < 30000) return Rarity.BRONZE;
  if (capacity < 50000) return Rarity.SILVER;
  if (capacity < 70000) return Rarity.GOLD;
  if (capacity < 85000) return Rarity.LEGEND;
  return Rarity.ICON;
}

/**
 * Статы — профиль множителей по позиции, в сумме дающий среднее 1.0, поэтому
 * среднее 6 суб-статов стремится к overall. Небольшой джиттер — живой
 * разброс между игроками одной позиции и рейтинга.
 */
const STAT_PROFILES: Record<
  Position,
  Record<"pace" | "shooting" | "passing" | "dribbling" | "defending" | "physical", number>
> = {
  GK: { pace: 0.75, shooting: 0.5, passing: 1.0, dribbling: 0.75, defending: 1.55, physical: 1.45 },
  CB: { pace: 0.85, shooting: 0.6, passing: 0.95, dribbling: 0.75, defending: 1.55, physical: 1.3 },
  LB: { pace: 1.15, shooting: 0.7, passing: 1.05, dribbling: 1.05, defending: 1.25, physical: 0.8 },
  RB: { pace: 1.15, shooting: 0.7, passing: 1.05, dribbling: 1.05, defending: 1.25, physical: 0.8 },
  CDM: { pace: 0.9, shooting: 0.75, passing: 1.15, dribbling: 0.9, defending: 1.35, physical: 0.95 },
  CM: { pace: 1.0, shooting: 0.95, passing: 1.2, dribbling: 1.15, defending: 0.95, physical: 0.75 },
  CAM: { pace: 1.05, shooting: 1.15, passing: 1.25, dribbling: 1.25, defending: 0.55, physical: 0.75 },
  LW: { pace: 1.3, shooting: 1.1, passing: 1.05, dribbling: 1.3, defending: 0.5, physical: 0.75 },
  RW: { pace: 1.3, shooting: 1.1, passing: 1.05, dribbling: 1.3, defending: 0.5, physical: 0.75 },
  ST: { pace: 1.15, shooting: 1.4, passing: 0.85, dribbling: 1.1, defending: 0.45, physical: 1.05 },
  CF: { pace: 1.15, shooting: 1.4, passing: 0.85, dribbling: 1.1, defending: 0.45, physical: 1.05 },
};

export function rollStats(overall: number, position: Position) {
  const profile = STAT_PROFILES[position];
  const jitter = () => randInt(-4, 4);
  const stat = (mult: number) => clamp(Math.round(overall * mult) + jitter(), 20, 99);

  return {
    pace: stat(profile.pace),
    shooting: stat(profile.shooting),
    passing: stat(profile.passing),
    dribbling: stat(profile.dribbling),
    defending: stat(profile.defending),
    physical: stat(profile.physical),
  };
}
