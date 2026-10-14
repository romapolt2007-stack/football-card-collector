import { prisma } from "./prisma.js";

/**
 * Flash-челлендж — один особый вызов на 3-дневный цикл (детерминированно
 * выбран по номеру цикла, одинаков для всех игроков). Выполняется одним
 * «Быстрым матчем» — проверка идёт по его итоговому результату, без
 * отдельного прогресса/накопления.
 */
const CYCLE_MS = 3 * 24 * 60 * 60 * 1000;

export interface MatchOutcomeForChallenge {
  userScore: number;
  oppScore: number;
  won: boolean;
  wonViaShootout: boolean;
}

export interface FlashChallengeDef {
  code: string;
  title: string;
  description: string;
  rewardCoins: number;
  check: (o: MatchOutcomeForChallenge) => boolean;
}

const CHALLENGES: FlashChallengeDef[] = [
  {
    code: "SHUTOUT",
    title: "Чистый лист",
    description: "Выиграйте матч, не пропустив ни одного гола (в основное время)",
    rewardCoins: 600,
    check: (o) => o.won && o.oppScore === 0,
  },
  {
    code: "GOAL_FEST",
    title: "Решето",
    description: "Забейте 4 или больше голов за матч",
    rewardCoins: 600,
    check: (o) => o.userScore >= 4,
  },
  {
    code: "PENALTY_HERO",
    title: "Герой пенальти",
    description: "Выиграйте матч по серии пенальти",
    rewardCoins: 500,
    check: (o) => o.won && o.wonViaShootout,
  },
  {
    code: "ROUT",
    title: "Разгром",
    description: "Победите с разницей в 3 и более гола",
    rewardCoins: 700,
    check: (o) => o.won && o.userScore - o.oppScore >= 3,
  },
];

export function currentCycleIndex(date: Date = new Date()): number {
  return Math.floor(date.getTime() / CYCLE_MS);
}

export function activeChallenge(date: Date = new Date()): FlashChallengeDef {
  return CHALLENGES[currentCycleIndex(date) % CHALLENGES.length];
}

export function msLeftInCycle(date: Date = new Date()): number {
  const cycleStart = currentCycleIndex(date) * CYCLE_MS;
  return cycleStart + CYCLE_MS - date.getTime();
}

export interface FlashChallengeClaimResult {
  claimed: boolean;
  code: string;
  title: string;
  rewardCoins: number;
}

/** Награждает, если активный челлендж выполнен и ещё не забран в этом цикле; иначе null. */
export async function tryClaimFlashChallenge(
  userId: string,
  outcome: MatchOutcomeForChallenge,
): Promise<FlashChallengeClaimResult | null> {
  const cycle = currentCycleIndex();
  const challenge = activeChallenge();

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { flashChallengeClaimedCycle: true } });
  if (user.flashChallengeClaimedCycle === cycle) return null;
  if (!challenge.check(outcome)) return null;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { coins: { increment: challenge.rewardCoins }, flashChallengeClaimedCycle: cycle },
    }),
    prisma.transaction.create({
      data: { userId, type: "QUEST_REWARD", amount: challenge.rewardCoins, meta: { flashChallenge: challenge.code } },
    }),
  ]);

  return { claimed: true, code: challenge.code, title: challenge.title, rewardCoins: challenge.rewardCoins };
}
