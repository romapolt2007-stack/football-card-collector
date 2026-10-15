import type { Rarity } from "@prisma/client";

/**
 * World Tour — сюжетный режим: линейная последовательность вымышленных
 * городов, каждый этап разрешается мгновенно (переиспользует simulateMatch),
 * без ограничения по времени/энергии — свободный прогресс в своём темпе.
 * Поражение не откатывает прогресс, просто не продвигает — можно пробовать
 * снова сколько угодно раз.
 */
export interface WorldTourStage {
  city: string;
  opponentOffset: number;
  rewardCoins: number;
  rewardXp: number;
  guaranteedRarity: Rarity | null;
}

export const WORLD_TOUR_STAGES: WorldTourStage[] = [
  { city: "Норд Харбор", opponentOffset: -10, rewardCoins: 300, rewardXp: 20, guaranteedRarity: null },
  { city: "Стальной Посад", opponentOffset: -6, rewardCoins: 350, rewardXp: 22, guaranteedRarity: null },
  { city: "Озёрный Край", opponentOffset: -3, rewardCoins: 400, rewardXp: 25, guaranteedRarity: null },
  { city: "Громовой Вал", opponentOffset: 0, rewardCoins: 500, rewardXp: 28, guaranteedRarity: "BRONZE" },
  { city: "Южный Мыс", opponentOffset: 3, rewardCoins: 600, rewardXp: 32, guaranteedRarity: null },
  { city: "Горный Перевал", opponentOffset: 6, rewardCoins: 750, rewardXp: 36, guaranteedRarity: "SILVER" },
  { city: "Багровая Гавань", opponentOffset: 9, rewardCoins: 900, rewardXp: 40, guaranteedRarity: null },
  { city: "Ледяной Пик", opponentOffset: 12, rewardCoins: 1100, rewardXp: 45, guaranteedRarity: "SILVER" },
  { city: "Золотой Берег", opponentOffset: 15, rewardCoins: 1400, rewardXp: 55, guaranteedRarity: "GOLD" },
  { city: "Арена Чемпионов", opponentOffset: 18, rewardCoins: 2500, rewardXp: 100, guaranteedRarity: "GOLD" },
];

export function worldTourOpponentOvr(userStrength: number, stageIndex: number): number {
  const offset = WORLD_TOUR_STAGES[stageIndex]?.opponentOffset ?? 0;
  return Math.max(40, Math.min(99, Math.round(userStrength + offset)));
}
