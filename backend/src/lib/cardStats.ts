/**
 * Все боевые расчёты (сила состава, GK overall, требования СБК) идут через эту
 * функцию, а не через голый `player.overall` — иначе тренировка карты (Блок 10
 * ГДД) не будет ничего менять в реальной силе состава. Индивидуальные под-статы
 * (pace/shooting/...) остаются чисто декоративными — нигде в движке не участвуют,
 * так что буст трогает только overall.
 */
export const TRAINING_BOOST_CAP = 5;

export function effectiveOverall(baseOverall: number, trainingBoost: number): number {
  return Math.min(99, baseOverall + trainingBoost);
}
