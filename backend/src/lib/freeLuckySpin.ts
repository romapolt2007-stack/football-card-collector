/**
 * Один бесплатный спин «Удачи» раз в сутки — чтобы можно было пробовать
 * удачу не только покупая платные спины за монеты.
 */
export const FREE_LUCKY_SPIN_INTERVAL_MS = 24 * 60 * 60 * 1000;

/** Шансы бесплатного спина соответствуют ставке 300 (между минимальной и средней) — не демпингует платные спины. */
export const FREE_LUCKY_SPIN_STAKE_EQUIVALENT = 300;

export function msUntilFreeLuckySpinReady(lastClaimAt: Date | null): number {
  if (!lastClaimAt) return 0;
  const elapsed = Date.now() - lastClaimAt.getTime();
  return Math.max(0, FREE_LUCKY_SPIN_INTERVAL_MS - elapsed);
}
