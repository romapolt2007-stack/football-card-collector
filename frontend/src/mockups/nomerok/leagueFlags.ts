// Реальные лиги в БД называются по-русски без официального бренда — сопоставляем country-flag эмодзи
// по названию. Это только для отображения в макете, сами названия уже идут с бэкенда (GET /api/meta/leagues).
const LEAGUE_FLAGS: Record<string, string> = {
  "Премьер-лига": "🏴",
  "Ла Лига": "🇪🇸",
  "Серия А": "🇮🇹",
  Бундеслига: "🇩🇪",
  "Лига 1": "🇫🇷",
  "Российская Премьер-лига": "🇷🇺",
};

export function flagForLeague(name: string): string {
  return LEAGUE_FLAGS[name] ?? "⚽";
}
