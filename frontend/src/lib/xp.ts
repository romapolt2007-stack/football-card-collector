/** Та же формула, что в backend/src/lib/xp.ts — для отображения прогресс-бара. */
export function xpForLevel(level: number): number {
  return (500 * ((level - 1) * level)) / 2;
}

/** Та же формула, что backend/src/lib/xp.ts levelUpReward — для превью награды следующего уровня. */
export function levelUpReward(level: number): number {
  return level * 200;
}
