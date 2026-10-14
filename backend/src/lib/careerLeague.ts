import type { CareerLeague } from "@prisma/client";
import { prisma } from "./prisma.js";

/**
 * Лига-карьера «Быстрого матча» (Division Rivals) — отдельная от Дуэли система:
 * очки за исход обычного полного матча, а не ELO против конкретного рейтинга
 * соперника (тут нет фиксированного "соперника" — бот всегда подгоняется под
 * силу состава, так что ELO-дельта была бы околонулевой). Простая турнирная
 * арифметика: победа весомее поражения, как очки в таблице лиги.
 */
const WIN_POINTS = 15;
const LOSS_POINTS = 8;

const LEAGUE_THRESHOLDS: { league: CareerLeague; min: number }[] = [
  { league: "CHAMPION", min: 700 },
  { league: "GOLD", min: 300 },
  { league: "SILVER", min: 100 },
  { league: "BRONZE", min: 0 },
];

export function leagueForPoints(points: number): CareerLeague {
  return LEAGUE_THRESHOLDS.find((t) => points >= t.min)!.league;
}

export const CAREER_LEAGUE_LABEL_RU: Record<CareerLeague, string> = {
  BRONZE: "Бронзовая лига",
  SILVER: "Серебряная лига",
  GOLD: "Золотая лига",
  CHAMPION: "Лига чемпионов",
};

export async function ensureCareerTrophy(userId: string) {
  return prisma.careerTrophy.upsert({ where: { userId }, create: { userId }, update: {} });
}

export interface CareerResult {
  points: number;
  league: CareerLeague;
  pointsDelta: number;
}

/** Обновляет очки/лигу карьеры после завершённого «Быстрого матча» (с учётом серии пенальти, если была). */
export async function applyCareerResult(userId: string, won: boolean): Promise<CareerResult> {
  const trophy = await ensureCareerTrophy(userId);
  const pointsDelta = won ? WIN_POINTS : -LOSS_POINTS;
  const points = Math.max(0, trophy.points + pointsDelta);
  const league = leagueForPoints(points);

  await prisma.careerTrophy.update({
    where: { userId },
    data: { points, league, wins: { increment: won ? 1 : 0 }, losses: { increment: won ? 0 : 1 } },
  });

  return { points, league, pointsDelta };
}
