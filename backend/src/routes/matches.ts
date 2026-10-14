import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { calcSquadStrength } from "../lib/squadStrength.js";
import {
  calcRewards,
  generateBotName,
  generateBotOvr,
  rollDisciplineEvents,
  simulateMatch,
  type MatchEvent,
  type MatchRewards,
} from "../lib/matchSimulation.js";
import { drawPackCards } from "../lib/cardDraw.js";
import { quickSellPrice } from "../lib/cardValue.js";
import { incrementQuestProgress } from "../lib/quests.js";
import { addXp } from "../lib/xp.js";
import { buildDisciplineOps } from "../lib/applyMatchConsequences.js";
import { createShootoutSession, deleteShootoutSession, getShootoutSession } from "../lib/shootoutStore.js";
import { isShootoutDecided, isValidPower, isValidZone, resolveRound, type RoundOutcome } from "../lib/shootout.js";
import { recordPenaltyOutcome } from "../lib/penaltyStats.js";
import { effectiveOverall } from "../lib/cardStats.js";
import { applyCareerResult, CAREER_LEAGUE_LABEL_RU, ensureCareerTrophy } from "../lib/careerLeague.js";
import type { SquadSlotJson } from "../lib/squadTypes.js";
import type { Prisma } from "@prisma/client";

const router = Router();

interface FinalizeParams {
  userId: string;
  opponentName: string;
  opponentOvr: number;
  userScore: number;
  oppScore: number;
  events: MatchEvent[];
  rewards: MatchRewards;
  starterCardIds: string[];
  benchCardIds: string[];
  shootout: { userScore: number; oppScore: number; rounds: RoundOutcome[] } | null;
}

async function finalizeMatch(p: FinalizeParams) {
  let wonCard = null;
  if (p.rewards.cardRarityFloor) {
    const [drawn] = await drawPackCards(1, p.rewards.cardRarityFloor, 0);
    if (drawn) {
      wonCard = await prisma.card.create({
        data: {
          playerId: drawn.player.id,
          ownerId: p.userId,
          rarity: drawn.rarity,
          quickSellPrice: quickSellPrice(drawn.rarity, drawn.player.overall),
        },
        include: { player: { include: { club: { include: { league: true } } } } },
      });
    }
  }

  const disciplineOps = await buildDisciplineOps({
    starterCardIds: p.starterCardIds,
    benchCardIds: p.benchCardIds,
    events: p.events,
  });

  const [match, updatedUser] = await prisma.$transaction([
    prisma.match.create({
      data: {
        userId: p.userId,
        mode: "QUICK",
        opponentName: p.opponentName,
        opponentOvr: p.opponentOvr,
        userScore: p.userScore,
        oppScore: p.oppScore,
        events: p.events as unknown as Prisma.InputJsonValue,
        rewards: { ...p.rewards, cardId: wonCard?.id ?? null, shootout: p.shootout } as unknown as Prisma.InputJsonValue,
      },
    }),
    prisma.user.update({ where: { id: p.userId }, data: { coins: { increment: p.rewards.coins } } }),
    prisma.transaction.create({
      data: { userId: p.userId, type: "MATCH_REWARD", amount: p.rewards.coins, meta: { mode: "QUICK" } },
    }),
    ...disciplineOps,
  ]);

  return { match, updatedUser, wonCard };
}

router.post("/quick", requireAuth, async (req, res) => {
  const squad = await prisma.squad.findFirst({
    where: { userId: req.userId, isActive: true },
  });
  if (!squad) {
    res.status(400).json({ error: "Сначала соберите состав" });
    return;
  }

  const slots = squad.slots as unknown as SquadSlotJson[];
  const starterCardIds = slots
    .filter((s) => !s.slotId.startsWith("BENCH"))
    .map((s) => s.cardId)
    .filter((id): id is string => Boolean(id));
  const benchCardIds = slots
    .filter((s) => s.slotId.startsWith("BENCH"))
    .map((s) => s.cardId)
    .filter((id): id is string => Boolean(id));

  if (starterCardIds.length < 7) {
    res.status(400).json({ error: "В составе должно быть минимум 7 игроков" });
    return;
  }

  const starters = await prisma.card.findMany({
    where: { id: { in: starterCardIds } },
    include: { player: { include: { club: true } } },
  });

  const unavailable = starters.filter((c) => c.unavailableMatches > 0);
  if (unavailable.length > 0) {
    res.status(400).json({
      error: `Недоступны (дисквалификация/травма): ${unavailable.map((c) => c.player.name).join(", ")}`,
    });
    return;
  }

  const { strength, avgOvr, chemistry } = calcSquadStrength(starters);
  const opponentName = generateBotName();
  const opponentOvr = generateBotOvr(strength);

  const result = simulateMatch(strength, opponentOvr);
  const disciplineEvents = rollDisciplineEvents(starters.map((c) => ({ cardId: c.id, name: c.player.name })));
  const events = [...result.events, ...disciplineEvents].sort((a, b) => a.minute - b.minute);

  if (result.userScore === result.oppScore) {
    const gk = starters.find((c) => c.player.position === "GK");
    const session = createShootoutSession({
      userId: req.userId!,
      opponentName,
      opponentOvr,
      userGkOverall: gk ? effectiveOverall(gk.player.overall, gk.trainingBoost) : 65,
      squad: { strength, avgOvr, chemistry },
      ninetyMin: { userScore: result.userScore, oppScore: result.oppScore, events, stats: result.stats },
      starterCardIds,
      benchCardIds,
    });
    res.json({
      needsShootout: true,
      draftId: session.draftId,
      ninetyMin: session.ninetyMin,
      opponentName,
      opponentOvr,
      squad: session.squad,
    });
    return;
  }

  const rewards = calcRewards(result.userScore, result.oppScore);
  const { match, wonCard } = await finalizeMatch({
    userId: req.userId!,
    opponentName,
    opponentOvr,
    userScore: result.userScore,
    oppScore: result.oppScore,
    events,
    rewards,
    starterCardIds,
    benchCardIds,
    shootout: null,
  });

  await incrementQuestProgress(req.userId!, "PLAY_MATCH");
  if (result.userScore > result.oppScore) {
    await incrementQuestProgress(req.userId!, "WIN_MATCH");
  }
  const { xp, level, coins, levelUpReward } = await addXp(req.userId!, rewards.xp);
  const career = await applyCareerResult(req.userId!, result.userScore > result.oppScore);

  res.json({
    match,
    stats: result.stats,
    squad: { strength, avgOvr, chemistry },
    coins,
    xp,
    level,
    wonCard,
    shootout: null,
    levelUpReward,
    career,
  });
});

const roundSchema = z.object({
  kickZone: z.number().int(),
  kickPower: z.string(),
  saveZone: z.number().int(),
});

router.post("/shootout/:draftId/round", requireAuth, async (req, res) => {
  const session = getShootoutSession(req.params.draftId, req.userId!);
  if (!session) {
    res.status(404).json({ error: "Серия пенальти не найдена или истекла" });
    return;
  }

  const parsed = roundSchema.safeParse(req.body);
  if (
    !parsed.success ||
    !isValidZone(parsed.data.kickZone) ||
    !isValidZone(parsed.data.saveZone) ||
    !isValidPower(parsed.data.kickPower)
  ) {
    res.status(400).json({ error: "Некорректные данные раунда" });
    return;
  }

  const outcome = resolveRound({
    kickZone: parsed.data.kickZone,
    kickPower: parsed.data.kickPower,
    saveZone: parsed.data.saveZone,
    opponentOvr: session.opponentOvr,
    userGkOverall: session.userGkOverall,
  });

  if (outcome.userScored) session.userScore++;
  if (outcome.userConceded) session.oppScore++;
  session.rounds.push(outcome);
  const roundJustPlayed = session.round;
  session.round++;
  await recordPenaltyOutcome(req.userId!, outcome);

  const decided = isShootoutDecided(session.userScore, session.oppScore, roundJustPlayed);

  if (!decided) {
    res.json({
      outcome,
      userScore: session.userScore,
      oppScore: session.oppScore,
      round: session.round,
      finished: false,
    });
    return;
  }

  const userWon = session.userScore > session.oppScore;
  const rewards = userWon ? calcRewards(1, 0) : calcRewards(0, 0);

  const { match, wonCard } = await finalizeMatch({
    userId: req.userId!,
    opponentName: session.opponentName,
    opponentOvr: session.opponentOvr,
    userScore: session.ninetyMin.userScore,
    oppScore: session.ninetyMin.oppScore,
    events: session.ninetyMin.events,
    rewards,
    starterCardIds: session.starterCardIds,
    benchCardIds: session.benchCardIds,
    shootout: { userScore: session.userScore, oppScore: session.oppScore, rounds: session.rounds },
  });

  await incrementQuestProgress(req.userId!, "PLAY_MATCH");
  if (userWon) await incrementQuestProgress(req.userId!, "WIN_MATCH");
  const { xp, level, coins, levelUpReward } = await addXp(req.userId!, rewards.xp);
  const career = await applyCareerResult(req.userId!, userWon);

  deleteShootoutSession(session.draftId);

  res.json({
    outcome,
    userScore: session.userScore,
    oppScore: session.oppScore,
    round: session.round,
    finished: true,
    result: {
      match,
      stats: session.ninetyMin.stats,
      squad: session.squad,
      coins,
      xp,
      level,
      wonCard,
      levelUpReward,
      shootout: { userScore: session.userScore, oppScore: session.oppScore, won: userWon },
      career,
    },
  });
});

router.get("/career", requireAuth, async (req, res) => {
  const trophy = await ensureCareerTrophy(req.userId!);
  res.json({
    league: trophy.league,
    leagueLabel: CAREER_LEAGUE_LABEL_RU[trophy.league],
    points: trophy.points,
    wins: trophy.wins,
    losses: trophy.losses,
  });
});

router.get("/history", requireAuth, async (req, res) => {
  const matches = await prisma.match.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  res.json({ matches });
});

export default router;
