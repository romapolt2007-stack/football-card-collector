/**
 * Страховка от «залипания» без монет: если у игрока почти ничего не осталось,
 * раз в несколько минут можно забрать крупный разовый бонус — вместо того
 * чтобы просто упереться в стену и уйти из игры.
 */
export const EMERGENCY_BONUS_INTERVAL_MS = 2.5 * 60 * 1000;
export const EMERGENCY_BONUS_COINS_THRESHOLD = 500;
export const EMERGENCY_BONUS_REWARD = 50_000;

export function msUntilEmergencyBonusReady(lastClaimAt: Date | null): number {
  if (!lastClaimAt) return 0;
  const elapsed = Date.now() - lastClaimAt.getTime();
  return Math.max(0, EMERGENCY_BONUS_INTERVAL_MS - elapsed);
}
