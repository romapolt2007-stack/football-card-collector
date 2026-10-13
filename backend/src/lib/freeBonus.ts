/**
 * Таймер-бонус для удержания игроков. Чем короче интервал — тем чаще люди
 * возвращаются, но тем выше риск, что уведомления от бота начнут раздражать
 * и его замьютят/заблокируют. 15 минут — разумный баланс для старта;
 * если хотите агрессивнее/спокойнее — меняется одной константой.
 */
export const FREE_BONUS_INTERVAL_MS = 15 * 60 * 1000;

export function rollFreeBonusCoins(): number {
  return Math.floor(Math.random() * (300 - 100 + 1)) + 100;
}

export function msUntilFreeBonusReady(lastClaimAt: Date | null): number {
  if (!lastClaimAt) return 0;
  const elapsed = Date.now() - lastClaimAt.getTime();
  return Math.max(0, FREE_BONUS_INTERVAL_MS - elapsed);
}
