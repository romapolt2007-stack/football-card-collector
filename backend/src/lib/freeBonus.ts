/**
 * Таймер-бонус для удержания игроков. Чем короче интервал — тем чаще люди
 * возвращаются, но тем выше риск, что уведомления от бота начнут раздражать
 * и его замьютят/заблокируют. 15 минут — разумный баланс для старта;
 * если хотите агрессивнее/спокойнее — меняется одной константой.
 */
export const FREE_BONUS_INTERVAL_MS = 15 * 60 * 1000;

export type FreeBonusPrizeType = "COINS" | "CARD" | "PACK";

const WEIGHTS: Record<FreeBonusPrizeType, number> = {
  COINS: 55,
  CARD: 30,
  PACK: 15,
};

export function rollFreeBonusPrizeType(): FreeBonusPrizeType {
  const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [type, weight] of Object.entries(WEIGHTS) as [FreeBonusPrizeType, number][]) {
    roll -= weight;
    if (roll <= 0) return type;
  }
  return "COINS";
}

export function rollFreeBonusCoinsAmount(): number {
  return Math.floor(Math.random() * (300 - 100 + 1)) + 100;
}

export function msUntilFreeBonusReady(lastClaimAt: Date | null): number {
  if (!lastClaimAt) return 0;
  const elapsed = Date.now() - lastClaimAt.getTime();
  return Math.max(0, FREE_BONUS_INTERVAL_MS - elapsed);
}
