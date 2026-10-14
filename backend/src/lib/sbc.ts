import { Rarity } from "@prisma/client";
import { rarityIndex } from "./packs.js";
import { effectiveOverall } from "./cardStats.js";

export interface SbcReward {
  coins?: number;
  xp?: number;
  guaranteedRarity?: Rarity;
}

export interface SbcDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  count: number;
  minRarity?: Rarity;
  minOverallSum?: number;
  sameClub?: boolean;
  distinctNations?: boolean;
  reward: SbcReward;
  /** false — вызов можно выполнить только один раз за всю игру (отслеживается в SbcCompletion). */
  repeatable: boolean;
}

export const SBC_DEFS: SbcDef[] = [
  {
    id: "bronze_reserve",
    title: "Бронзовый резерв",
    description: "Сдайте 3 карты не ниже уровня Бронза с суммой рейтинга от 180",
    icon: "🥉",
    count: 3,
    minRarity: Rarity.BRONZE,
    minOverallSum: 180,
    reward: { guaranteedRarity: Rarity.SILVER, xp: 30 },
    repeatable: true,
  },
  {
    id: "silver_asset",
    title: "Серебряный актив",
    description: "Сдайте 4 карты не ниже уровня Серебро с суммой рейтинга от 320",
    icon: "🥈",
    count: 4,
    minRarity: Rarity.SILVER,
    minOverallSum: 320,
    reward: { guaranteedRarity: Rarity.GOLD, xp: 60 },
    repeatable: true,
  },
  {
    id: "club_loyalty",
    title: "Клубная преданность",
    description: "Сдайте 3 карты одного клуба не ниже уровня Серебро",
    icon: "🛡️",
    count: 3,
    minRarity: Rarity.SILVER,
    sameClub: true,
    reward: { coins: 5000, xp: 50 },
    repeatable: true,
  },
  {
    id: "golden_squad",
    title: "Золотой состав",
    description: "Одноразовый вызов: 3 карты не ниже уровня Золото с суммой рейтинга от 270",
    icon: "🏆",
    count: 3,
    minRarity: Rarity.GOLD,
    minOverallSum: 270,
    reward: { guaranteedRarity: Rarity.LEGEND, xp: 500 },
    repeatable: false,
  },
  {
    id: "nations_squad",
    title: "Сборная наций",
    description: "Одноразовый вызов: 5 карт игроков из 5 разных стран",
    icon: "🌍",
    count: 5,
    distinctNations: true,
    reward: { guaranteedRarity: Rarity.GOLD, coins: 10000, xp: 200 },
    repeatable: false,
  },
  {
    id: "legendary_breakthrough",
    title: "Легендарный прорыв",
    description: "Одноразовый вызов: 2 карты уровня Легенда с суммой рейтинга от 190",
    icon: "⭐",
    count: 2,
    minRarity: Rarity.LEGEND,
    minOverallSum: 190,
    reward: { guaranteedRarity: Rarity.ICON, xp: 1000 },
    repeatable: false,
  },
];

export function findSbc(id: string): SbcDef | undefined {
  return SBC_DEFS.find((d) => d.id === id);
}

export interface SbcCardLike {
  rarity: Rarity;
  trainingBoost: number;
  player: { overall: number; nation: string; clubId: string };
}

/** Возвращает текст ошибки, если карты не подходят под требования вызова, иначе null. */
export function validateSbcCards(def: SbcDef, cards: SbcCardLike[]): string | null {
  if (cards.length !== def.count) return `Нужно сдать ровно ${def.count} карт(ы)`;

  if (def.minRarity) {
    const floor = rarityIndex(def.minRarity);
    if (cards.some((c) => rarityIndex(c.rarity) < floor)) {
      return `Все карты должны быть не ниже уровня ${def.minRarity}`;
    }
  }

  if (def.minOverallSum) {
    const sum = cards.reduce((s, c) => s + effectiveOverall(c.player.overall, c.trainingBoost), 0);
    if (sum < def.minOverallSum) return `Сумма рейтинга должна быть не меньше ${def.minOverallSum}`;
  }

  if (def.sameClub) {
    const clubIds = new Set(cards.map((c) => c.player.clubId));
    if (clubIds.size !== 1) return "Все карты должны быть из одного клуба";
  }

  if (def.distinctNations) {
    const nations = new Set(cards.map((c) => c.player.nation));
    if (nations.size !== cards.length) return "Все карты должны быть из разных стран";
  }

  return null;
}
