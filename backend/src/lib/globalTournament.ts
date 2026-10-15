import type { Rarity } from "@prisma/client";

/**
 * Глобальный турнир — честный компромисс вместо выдуманной базы в 1024 живых
 * игрока: сетка на 64 (вы + 63 процедурных бота, как и везде в проекте —
 * generateBotName()), 6 раундов на выбывание, разрешаются мгновенно (тот же
 * принцип, что Кубок). Редкая попытка — раз в 7 дней, финал даёт топовую
 * награду (гарантированная ICON-карта).
 */
export const TOURNAMENT_BRACKET_SIZE = 64;
export const TOURNAMENT_ROUNDS = 6; // log2(64)
export const TOURNAMENT_FREE_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

export const TOURNAMENT_ROUND_LABELS = [
  "1/64 финала",
  "1/32 финала",
  "1/16 финала",
  "Четвертьфинал",
  "Полуфинал",
  "Финал",
] as const;

export type TournamentRoundIndex = 0 | 1 | 2 | 3 | 4 | 5;

export function msUntilFreeTournamentReady(lastClaimAt: Date | null): number {
  if (!lastClaimAt) return 0;
  const elapsed = Date.now() - lastClaimAt.getTime();
  return Math.max(0, TOURNAMENT_FREE_INTERVAL_MS - elapsed);
}

/** Соперники сильнее к финалу — турнир на 64 жёстче Кубка на 8. */
const ROUND_OPPONENT_OFFSET = [-8, -4, 0, 5, 10, 16];

export function tournamentOpponentOvr(userStrength: number, round: TournamentRoundIndex): number {
  const offset = ROUND_OPPONENT_OFFSET[round];
  const spread = Math.round(Math.random() * 8) - 4;
  return Math.max(40, Math.min(99, Math.round(userStrength + offset + spread)));
}

export interface TournamentRoundReward {
  coins: number;
  xp: number;
  guaranteedRarity: Rarity | null;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function calcTournamentRoundReward(round: TournamentRoundIndex, won: boolean): TournamentRoundReward {
  if (!won) return { coins: randInt(100, 220), xp: 12, guaranteedRarity: null };
  const table: TournamentRoundReward[] = [
    { coins: randInt(300, 450), xp: 20, guaranteedRarity: null },
    { coins: randInt(500, 700), xp: 28, guaranteedRarity: null },
    { coins: randInt(800, 1100), xp: 35, guaranteedRarity: "BRONZE" },
    { coins: randInt(1300, 1700), xp: 45, guaranteedRarity: "SILVER" },
    { coins: randInt(2200, 2800), xp: 60, guaranteedRarity: "GOLD" },
    { coins: randInt(5000, 7000), xp: 150, guaranteedRarity: "ICON" },
  ];
  return table[round];
}
