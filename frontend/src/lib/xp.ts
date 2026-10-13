/** Та же формула, что в backend/src/lib/xp.ts — для отображения прогресс-бара. */
export function xpForLevel(level: number): number {
  return (500 * ((level - 1) * level)) / 2;
}
