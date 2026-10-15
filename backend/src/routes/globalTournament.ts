import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { calcSquadStrength } from "../lib/squadStrength.js";
import { generateBotName, simulateMatch } from "../lib/matchSimulation.js";
import {
  TOURNAMENT_BRACKET_SIZE,
  TOURNAMENT_FREE_INTERVAL_MS,
  TOURNAMENT_ROUND_LABELS,
  calcTournamentRoundReward,
  msUntilFreeTournamentReady,
  tournamentOpponentOvr,
} from "../lib/globalTournament.js";
import { createTournamentSession, deleteTournamentSession, getTournamentSession } from "../lib/tournamentStore.js";
import { drawGuaranteedCard } from "../lib/cardDraw.js";
import { quickSellPrice } from "../lib/cardValue.js";
import { addXp } from "../lib/xp.js";
import type { SquadSlotJson } from "../lib/squadTypes.js";
import type { Prisma } from "@prisma/client";

const router = Router();

router.get("/free-status", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  const msLeft = msUntilFreeTournamentReady(user.lastFreeTournamentAt);
  res.json({ ready: msLeft <= 0, msLeft, intervalMs: TOURNAMENT_FREE_INTERVAL_MS, bracketSize: TOURNAMENT_BRACKET_SIZE });
});

router.post("/start", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  const msLeft = msUntilFreeTournamentReady(user.lastFreeTournamentAt);
  if (msLeft > 0) {
    res.status(400).json({ error: "Следующая попытка турнира ещё не доступна", msLeft });
    return;
  }

  const squad = await prisma.squad.findFirst({ where: { userId: req.userId, isActive: true } });
  if (!squad) {
    res.status(400).json({ error: "Сначала соберите состав" });
    return;
  }
  const slots = squad.slots as unknown as SquadSlotJson[];
  const starterCardIds = slots
    .filter((s) => !s.slotId.startsWith("BENCH"))
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

  const { strength } = calcSquadStrength(starters);
  await prisma.user.update({ where: { id: user.id }, data: { lastFreeTournamentAt: new Date() } });

  const session = createTournamentSession({ userId: req.userId!, strength });
  res.json({
    draftId: session.draftId,
    round: session.round,
    roundLabel: TOURNAMENT_ROUND_LABELS[session.round],
    bracketSize: TOURNAMENT_BRACKET_SIZE,
    strength,
  });
});

router.post("/:draftId/round", requireAuth, async (req, res) => {
  const session = getTournamentSession(req.params.draftId, req.userId!);
  if (!session) {
    res.status(404).json({ error: "Турнир не найден или истёк" });
    return;
  }

  const playedRound = session.round;
  const opponentOvr = tournamentOpponentOvr(session.strength, playedRound);
  const opponentName = generateBotName();
  const result = simulateMatch(session.strength, opponentOvr);

  let userWon = result.userScore > result.oppScore;
  if (result.userScore === result.oppScore) {
    if (session.strength > opponentOvr) userWon = true;
    else if (session.strength < opponentOvr) userWon = false;
    else userWon = Math.random() < 0.5;
  }

  const reward = calcTournamentRoundReward(playedRound, userWon);

  let grantedCard = null;
  if (reward.guaranteedRarity) {
    const drawn = await drawGuaranteedCard(reward.guaranteedRarity);
    if (drawn) {
      grantedCard = await prisma.card.create({
        data: {
          playerId: drawn.player.id,
          ownerId: req.userId!,
          rarity: drawn.rarity,
          quickSellPrice: quickSellPrice(drawn.rarity, drawn.player.overall),
        },
        include: { player: { include: { club: { include: { league: true } } } } },
      });
    }
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: req.userId }, data: { coins: { increment: reward.coins } } }),
    prisma.transaction.create({
      data: {
        userId: req.userId!,
        type: "GLOBAL_TOURNAMENT",
        amount: reward.coins,
        meta: { round: playedRound, won: userWon, opponentName, grantedCardId: grantedCard?.id ?? null },
      },
    }),
    prisma.match.create({
      data: {
        userId: req.userId!,
        mode: "DIVISION_RIVALS",
        opponentName,
        opponentOvr,
        userScore: result.userScore,
        oppScore: result.oppScore,
        events: result.events as unknown as Prisma.InputJsonValue,
        rewards: { coins: reward.coins, xp: reward.xp, round: TOURNAMENT_ROUND_LABELS[playedRound], won: userWon } as unknown as Prisma.InputJsonValue,
      },
    }),
  ]);

  const { xp, level, coins, levelUpReward } = await addXp(req.userId!, reward.xp);

  const isFinalRound = playedRound === 5;
  const champion = userWon && isFinalRound;
  const eliminated = !userWon;

  if (eliminated || champion) {
    deleteTournamentSession(session.draftId);
  } else {
    session.round = (playedRound + 1) as typeof session.round;
  }

  res.json({
    userScore: result.userScore,
    oppScore: result.oppScore,
    opponentName,
    opponentOvr,
    won: userWon,
    roundLabel: TOURNAMENT_ROUND_LABELS[playedRound],
    finished: eliminated || champion,
    champion,
    nextRound: eliminated || champion ? null : { round: session.round, label: TOURNAMENT_ROUND_LABELS[session.round] },
    result: { rewardCoins: reward.coins, rewardXp: reward.xp, coins, xp, level, levelUpReward, grantedCard },
  });
});

export default router;
