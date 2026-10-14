/**
 * Погода матча — общая для всех игроков в сутки (детерминированно по UTC-дню,
 * без БД и крон-джобы), даёт симметричный множитель к xG обеих команд в
 * simulateMatch(). Чисто флейвор + лёгкая вариативность, не должна давать
 * одной из сторон перекос (множитель применяется к userXg и oppXg одинаково).
 */
export interface WeatherDef {
  code: string;
  label: string;
  emoji: string;
  goalMultiplier: number;
}

const WEATHERS: WeatherDef[] = [
  { code: "CLEAR", label: "Ясно", emoji: "☀️", goalMultiplier: 1 },
  { code: "RAIN", label: "Дождь", emoji: "🌧️", goalMultiplier: 0.85 },
  { code: "WIND", label: "Ветрено", emoji: "💨", goalMultiplier: 1.05 },
  { code: "FOG", label: "Туман", emoji: "🌫️", goalMultiplier: 0.9 },
  { code: "SNOW", label: "Снег", emoji: "❄️", goalMultiplier: 0.8 },
];

export function weatherForDate(date: Date = new Date()): WeatherDef {
  const dayIndex = Math.floor(date.getTime() / 86_400_000);
  return WEATHERS[dayIndex % WEATHERS.length];
}
