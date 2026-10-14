export const FREE_ARCADE_PENALTY_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function msUntilFreeArcadePenaltyReady(lastClaimAt: Date | null): number {
  if (!lastClaimAt) return 0;
  const elapsed = Date.now() - lastClaimAt.getTime();
  return Math.max(0, FREE_ARCADE_PENALTY_INTERVAL_MS - elapsed);
}
