import { prisma } from "./prisma.js";

/** Детерминированный хэш строки — тот же приём, что для процедурной графики на фронте. */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function todayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

/**
 * "Слухи трансферов" — раз в UTC-сутки каждая лига получает множитель цены
 * 0.8-1.2x, детерминированный от даты+id лиги (не хранится в БД — честно
 * пересчитывается, одинаков для всех на весь день, меняется в полночь UTC).
 */
export function leagueTrendMultiplier(leagueId: string, date: Date = new Date()): number {
  const seed = hashString(`${todayKey(date)}:${leagueId}`);
  const t = (seed % 1000) / 1000; // 0..1
  return 0.8 + t * 0.4; // 0.8..1.2
}

export async function todaysLeagueTrends(date: Date = new Date()) {
  const leagues = await prisma.league.findMany({ orderBy: { order: "asc" } });
  return leagues.map((l) => {
    const multiplier = leagueTrendMultiplier(l.id, date);
    return {
      leagueId: l.id,
      leagueName: l.name,
      multiplier: Math.round(multiplier * 100) / 100,
      changePct: Math.round((multiplier - 1) * 100),
    };
  });
}
