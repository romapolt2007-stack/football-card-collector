import { Position } from "@prisma/client";
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

const ALL_POSITIONS = Object.values(Position);

export function rollPosition(): Position {
  return ALL_POSITIONS[Math.floor(Math.random() * ALL_POSITIONS.length)];
}

/** Внутри позиции игроки с овералом выше порога выпадают реже — сила тоже должна быть трофеем. */
const HIGH_OVERALL_THRESHOLD = 85;
const HIGH_OVERALL_WEIGHT_MULTIPLIER = 0.3;

/**
 * Крутит игрока под уже выпавшую позицию (+опционально лигу). Редкость не
 * рестится отдельно — она уже закреплена на Player.rarity при сидировании
 * (чистая функция от overall), спин просто выбирает КОГО из пула.
 */
export async function spinPlayer(position: Position, leagueId?: string) {
  const candidates = await prisma.player.findMany({
    where: { position, ...(leagueId ? { club: { leagueId } } : {}) },
    include: { club: { include: { league: true } } },
  });
  if (candidates.length === 0) return null;

  const weights = candidates.map((p) => (p.overall > HIGH_OVERALL_THRESHOLD ? HIGH_OVERALL_WEIGHT_MULTIPLIER : 1));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
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
