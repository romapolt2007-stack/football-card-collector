/**
 * Трофейная комната / стадион — пассивный доход от уровня стадиона, копится
 * лениво по времени (без крон-джобы, тот же паттерн, что energy.ts), с
 * потолком накопления, чтобы не было смысла не заходить месяцами.
 */
export const STADIUM_MAX_LEVEL = 20;
const INCOME_PER_LEVEL_PER_HOUR = 40;
const MAX_PENDING_HOURS = 8;

export function incomePerHour(level: number): number {
  return level * INCOME_PER_LEVEL_PER_HOUR;
}

export function pendingIncome(level: number, collectedAt: Date): number {
  const elapsedMs = Math.max(0, Date.now() - collectedAt.getTime());
  const cappedHours = Math.min(elapsedMs / 3_600_000, MAX_PENDING_HOURS);
  return Math.floor(cappedHours * incomePerHour(level));
}

export function upgradeCost(currentLevel: number): number | null {
  if (currentLevel >= STADIUM_MAX_LEVEL) return null;
  return 4_000 * currentLevel;
}
