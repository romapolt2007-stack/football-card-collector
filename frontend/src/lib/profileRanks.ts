export interface RankTier {
  title: string;
  minLevel: number;
}

const RANK_TIERS: RankTier[] = [
  { minLevel: 1, title: "Новичок" },
  { minLevel: 5, title: "Любитель" },
  { minLevel: 10, title: "Профи" },
  { minLevel: 15, title: "Мастер Драфта" },
  { minLevel: 25, title: "Легенда Драфта" },
  { minLevel: 40, title: "Величие Футбола" },
];

export function rankForLevel(level: number): string {
  let title = RANK_TIERS[0].title;
  for (const tier of RANK_TIERS) {
    if (level >= tier.minLevel) title = tier.title;
  }
  return title;
}

/** Условный "общий рейтинг аккаунта" — не точная метрика, а мотивирующее число для профиля. */
export function accountRating(level: number, xp: number): number {
  return level * 100 + Math.floor(xp / 20);
}
