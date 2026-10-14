/** Happy Hours — скидка на паки по выходным (UTC), без крон-джобы: чистая функция от текущего времени. */
export const HAPPY_HOUR_DISCOUNT = 0.2;

export function isHappyHour(date: Date = new Date()): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

export function packPrice(baseCoins: number, date: Date = new Date()): number {
  if (baseCoins <= 0) return baseCoins;
  return isHappyHour(date) ? Math.round(baseCoins * (1 - HAPPY_HOUR_DISCOUNT)) : baseCoins;
}
