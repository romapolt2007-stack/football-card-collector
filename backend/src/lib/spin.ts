import { prisma } from "./prisma.js";

/** Кулдаун бесплатного спина — общий для игроков и стадионов. */
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

export interface SpinPlayerFilters {
  leagueId?: string;
  clubId?: string;
  nation?: string;
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
export async function spinPlayer(filters: SpinPlayerFilters = {}) {
  const where = {
    ...(filters.leagueId ? { club: { leagueId: filters.leagueId } } : {}),
    ...(filters.clubId ? { clubId: filters.clubId } : {}),
    ...(filters.nation ? { nation: filters.nation } : {}),
  };

  const candidates = await prisma.player.findMany({
    where,
    include: { club: { include: { league: true } }, _count: { select: { cards: true } } },
  });

  const available = candidates.filter((p) => p.maxSupply == null || p._count.cards < p.maxSupply);
  if (available.length === 0) return null;

  const positions = [...new Set(available.map((p) => p.position))];
  const position = positions[Math.floor(Math.random() * positions.length)];
  const inPosition = available.filter((p) => p.position === position);

  const weights = inPosition.map((p) => (p.overall > HIGH_OVERALL_THRESHOLD ? HIGH_OVERALL_WEIGHT_MULTIPLIER : 1));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  for (let i = 0; i < inPosition.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return inPosition[i];
  }
  return inPosition[inPosition.length - 1];
}

export async function spinStadium() {
  const candidates = await prisma.stadium.findMany({ include: { club: { include: { league: true } } } });
  if (candidates.length === 0) return null;

  const weights = candidates.map((s) => (s.capacity > 65000 ? HIGH_OVERALL_WEIGHT_MULTIPLIER : 1));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}
