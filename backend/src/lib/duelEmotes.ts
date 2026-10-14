/**
 * Эмоции после Дуэли — Дуэль асинхронная (снимок состава соперника, не живой
 * канал), поэтому это не трэш-ток в реальном времени, а личная "поза
 * победителя/реакция" в истории матчей. Фиксированный белый список.
 */
export const DUEL_EMOTES = ["🎉", "😎", "🔥", "💪", "😤", "🤝", "😢", "🫡"] as const;
export type DuelEmote = (typeof DUEL_EMOTES)[number];

export function isValidDuelEmote(value: unknown): value is DuelEmote {
  return typeof value === "string" && (DUEL_EMOTES as readonly string[]).includes(value);
}
