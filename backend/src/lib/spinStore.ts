/**
 * Результат спина, ожидающий решения игрока (Сохранить/Продать) — хранится
 * на сервере, а не передаётся клиенту для обратного заполнения, чтобы
 * нельзя было подменить playerId/stadiumId в запросе save/sell. Только для
 * одного процесса (как и остальные ephemeral-стораджи в этом бэкенде);
 * при горизонтальном масштабировании нужно вынести в Redis.
 */
import type { Rarity } from "@prisma/client";

interface PendingPlayerSpin {
  kind: "player";
  playerId: string;
  rarity: Rarity;
  price: number;
}

interface PendingStadiumSpin {
  kind: "stadium";
  stadiumId: string;
  rarity: Rarity;
  price: number;
}

type PendingSpin = PendingPlayerSpin | PendingStadiumSpin;

const pending = new Map<string, PendingSpin>();

export function setPendingSpin(userId: string, spin: PendingSpin): void {
  pending.set(userId, spin);
}

export function takePendingSpin(userId: string): PendingSpin | null {
  const spin = pending.get(userId);
  if (!spin) return null;
  pending.delete(userId);
  return spin;
}
