import type { Card } from "../types/game";

export const TRAINING_BOOST_CAP = 5;

/** Зеркало backend/src/lib/cardStats.ts — держать в синхроне. */
export function effectiveOverall(card: Pick<Card, "trainingBoost"> & { player: { overall: number } }): number {
  return Math.min(99, card.player.overall + card.trainingBoost);
}
