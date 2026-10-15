/**
 * Кубок на выбывание — 3 раунда (ЧФ→ПФ→Финал) против ботов нарастающей силы,
 * каждый раунд разрешается мгновенно (без интерактивных пенальти — ничья
 * решается сравнением силы составов, как "кто играл лучше по ходу матча").
 * Одна бесплатная попытка в сутки — тот же lazy-паттерн, что lucky spin/аркада.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export const CUP_FREE_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function msUntilFreeCupReady(lastClaimAt: Date | null): number {
  if (!lastClaimAt) return 0;
  const elapsed = Date.now() - lastClaimAt.getTime();
  return Math.max(0, CUP_FREE_INTERVAL_MS - elapsed);
}

export const CUP_ROUND_LABELS = ["Четвертьфинал", "Полуфинал", "Финал"] as const;
export type CupRoundIndex = 0 | 1 | 2;

/** Смещение силы бота относительно состава игрока — кубок становится заметно труднее к финалу. */
const ROUND_OPPONENT_OFFSET = [-6, 2, 10];

export function cupOpponentOvr(userStrength: number, round: CupRoundIndex): number {
  const offset = ROUND_OPPONENT_OFFSET[round];
  const spread = Math.round(Math.random() * 6) - 3;
  return clamp(Math.round(userStrength + offset + spread), 40, 99);
}

export interface CupRoundReward {
  coins: number;
  xp: number;
  guaranteedGoldCard: boolean;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function calcCupRoundReward(round: CupRoundIndex, won: boolean): CupRoundReward {
  if (!won) return { coins: randInt(80, 180), xp: 10, guaranteedGoldCard: false };
  const table: CupRoundReward[] = [
    { coins: randInt(350, 550), xp: 25, guaranteedGoldCard: false },
    { coins: randInt(700, 1000), xp: 40, guaranteedGoldCard: false },
    { coins: randInt(1500, 2200), xp: 80, guaranteedGoldCard: true },
  ];
  return table[round];
}
