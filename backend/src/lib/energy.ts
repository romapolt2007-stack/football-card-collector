import { prisma } from "./prisma.js";

/**
 * Энергия ограничивает платные/PvP-режимы (сейчас — только Дуэль) и создаёт повод
 * вернуться позже. Восстанавливается лениво по времени (без крон-джобы) — тот же
 * паттерн, что lastFreeLuckySpinAt/lastFreeArcadePenaltyAt.
 */
export const ENERGY_MAX = 20;
const REGEN_INTERVAL_MS = 5 * 60 * 1000;

export function currentEnergy(base: number, updatedAt: Date, boost = 1): number {
  const elapsedMs = Math.max(0, Date.now() - updatedAt.getTime());
  const regenerated = Math.floor((elapsedMs * boost) / REGEN_INTERVAL_MS);
  return Math.min(ENERGY_MAX, Math.max(0, base) + regenerated);
}

export function msUntilNextEnergy(base: number, updatedAt: Date, boost = 1): number {
  if (base >= ENERGY_MAX) return 0;
  const elapsedMs = Math.max(0, Date.now() - updatedAt.getTime());
  const msIntoTick = elapsedMs % (REGEN_INTERVAL_MS / boost);
  return Math.round(REGEN_INTERVAL_MS / boost - msIntoTick);
}

/** Пересчитывает и сохраняет текущую энергию пользователя в БД (settle-on-read). */
export async function settleEnergy(userId: string): Promise<{ energy: number; energyUpdatedAt: Date }> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { energy: true, energyUpdatedAt: true, isVip: true },
  });
  const boost = user.isVip ? 2 : 1;
  const value = currentEnergy(user.energy, user.energyUpdatedAt, boost);
  if (value === user.energy) return { energy: user.energy, energyUpdatedAt: user.energyUpdatedAt };

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { energy: value, energyUpdatedAt: new Date() },
    select: { energy: true, energyUpdatedAt: true },
  });
  return updated;
}

/** Возвращает новое значение энергии после траты или null, если не хватает. */
export function trySpendEnergy(energy: number, cost: number): number | null {
  if (energy < cost) return null;
  return energy - cost;
}
