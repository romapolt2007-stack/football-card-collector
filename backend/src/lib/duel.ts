import type { DuelLeague } from "@prisma/client";
import { prisma } from "./prisma.js";
import { calcSquadStrength } from "./squadStrength.js";
import { effectiveOverall } from "./cardStats.js";
import { generateBotName, generateBotOvr } from "./matchSimulation.js";
import type { SquadSlotJson } from "./squadTypes.js";

/**
 * PvP «Дуэль» — третий потребитель resolveRound() (после ShootoutMiniGame и
 * ArcadePenaltyGame): тот же 9-зоновый пенальти, но соперник — реальный состав
 * другого игрока (его средняя сила состава), а не фиксированная сложность.
 * Матч асинхронный (как Division Rivals): не требует, чтобы соперник был
 * онлайн одновременно — его данные берутся снимком на момент поиска.
 */
export const DUEL_ENERGY_COST = 2;
const ELO_K = 32;

const LEAGUE_THRESHOLDS: { league: DuelLeague; min: number }[] = [
  { league: "CHAMPION", min: 700 },
  { league: "GOLD", min: 300 },
  { league: "SILVER", min: 100 },
  { league: "BRONZE", min: 0 },
];

export function leagueForPoints(points: number): DuelLeague {
  return LEAGUE_THRESHOLDS.find((t) => points >= t.min)!.league;
}

export const LEAGUE_LABEL_RU: Record<DuelLeague, string> = {
  BRONZE: "Бронзовая лига",
  SILVER: "Серебряная лига",
  GOLD: "Золотая лига",
  CHAMPION: "Лига чемпионов",
};

/** Δ = K·(W − 1/(1+10^((Ropp−Rself)/400))) — очки кубков трактуются как рейтинг. */
export function eloDelta(selfPoints: number, opponentPoints: number, won: boolean): number {
  const expected = 1 / (1 + 10 ** ((opponentPoints - selfPoints) / 400));
  return Math.round(ELO_K * ((won ? 1 : 0) - expected));
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface DuelRewards {
  coins: number;
  xp: number;
  bonusCardChance: number;
}

/** Награды выше аркады (сложнее найти реального соперника силой) и даются вместе с изменением кубков. */
export function calcDuelRewards(won: boolean): DuelRewards {
  if (won) return { coins: randInt(400, 900), xp: 60, bonusCardChance: 0.2 };
  return { coins: randInt(80, 200), xp: 15, bonusCardChance: 0 };
}

export interface SelfSquadInfo {
  starterCardIds: string[];
  userGkOverall: number;
  strength: number;
}

/** Та же выборка стартового состава, что в /matches/quick и /arcade-penalty/start. */
export async function loadSelfSquadInfo(userId: string): Promise<SelfSquadInfo | null> {
  const squad = await prisma.squad.findFirst({ where: { userId, isActive: true } });
  if (!squad) return null;

  const slots = squad.slots as unknown as SquadSlotJson[];
  const starterCardIds = slots
    .filter((s) => !s.slotId.startsWith("BENCH"))
    .map((s) => s.cardId)
    .filter((id): id is string => Boolean(id));
  if (starterCardIds.length < 7) return null;

  const starters = await prisma.card.findMany({
    where: { id: { in: starterCardIds } },
    include: { player: { include: { club: true } } },
  });
  if (starters.length < 7) return null;

  const { strength } = calcSquadStrength(starters as Parameters<typeof calcSquadStrength>[0]);
  const gk = starters.find((c) => c.player.position === "GK");
  const userGkOverall = gk ? effectiveOverall(gk.player.overall, gk.trainingBoost) : 65;
  return { starterCardIds, userGkOverall, strength };
}

export interface OpponentInfo {
  opponentName: string;
  opponentOvr: number;
  opponentUserId: string | null;
  opponentPoints: number;
  isRealOpponent: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Ищет реального соперника с собранным составом (снимок его силы на момент поиска —
 * без необходимости быть онлайн одновременно). Если никого не нашлось — честный бот.
 */
export async function findOpponent(selfUserId: string, selfStrength: number): Promise<OpponentInfo> {
  const candidateSquads = await prisma.squad.findMany({
    where: { isActive: true, userId: { not: selfUserId } },
    take: 25,
    orderBy: { updatedAt: "desc" },
  });

  for (const squad of shuffle(candidateSquads)) {
    const slots = squad.slots as unknown as SquadSlotJson[];
    const starterCardIds = slots
      .filter((s) => !s.slotId.startsWith("BENCH"))
      .map((s) => s.cardId)
      .filter((id): id is string => Boolean(id));
    if (starterCardIds.length < 7) continue;

    const starters = await prisma.card.findMany({
      where: { id: { in: starterCardIds } },
      include: { player: { include: { club: true } } },
    });
    if (starters.length < 7) continue;

    const { strength } = calcSquadStrength(starters as Parameters<typeof calcSquadStrength>[0]);
    const [opponent, trophy] = await Promise.all([
      prisma.user.findUnique({ where: { id: squad.userId }, select: { teamName: true, username: true, firstName: true } }),
      prisma.duelTrophy.findUnique({ where: { userId: squad.userId } }),
    ]);

    return {
      opponentName: opponent?.teamName || opponent?.username || opponent?.firstName || "Соперник",
      opponentOvr: Math.round(strength),
      opponentUserId: squad.userId,
      opponentPoints: trophy?.points ?? 0,
      isRealOpponent: true,
    };
  }

  return {
    opponentName: generateBotName(),
    opponentOvr: generateBotOvr(selfStrength),
    opponentUserId: null,
    opponentPoints: 0,
    isRealOpponent: false,
  };
}

export async function ensureDuelTrophy(userId: string) {
  return prisma.duelTrophy.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}
