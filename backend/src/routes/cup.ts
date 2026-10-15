import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { calcSquadStrength } from "../lib/squadStrength.js";
import { generateBotName, simulateMatch } from "../lib/matchSimulation.js";
import { CUP_FREE_INTERVAL_MS, CUP_ROUND_LABELS, calcCupRoundReward, cupOpponentOvr, msUntilFreeCupReady } from "../lib/cup.js";
import { createCupSession, deleteCupSession, getCupSession } from "../lib/cupStore.js";
import { drawGuaranteedCard } from "../lib/cardDraw.js";
import { quickSellPrice } from "../lib/cardValue.js";
import { addXp } from "../lib/xp.js";
import type { SquadSlotJson } from "../lib/squadTypes.js";
import type { Prisma } from "@prisma/client";

const router = Router();

router.get("/free-status", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  const msLeft = msUntilFreeCupReady(user.lastFreeCupAt);
  res.json({ ready: msLeft <= 0, msLeft, intervalMs: CUP_FREE_INTERVAL_MS });
});

router.post("/start", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  const msLeft = msUntilFreeCupReady(user.lastFreeCupAt);
  if (msLeft > 0) {
    res.status(400).json({ error: "Бесплатная попытка ещё не доступна", msLeft });
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

  const { strength, avgOvr, chemistry } = calcSquadStrength(starters);
  await prisma.user.update({ where: { id: user.id }, data: { lastFreeCupAt: new Date() } });

  const session = createCupSession({ userId: req.userId!, strength, avgOvr, chemistry });
  res.json({ draftId: session.draftId, round: session.round, roundLabel: CUP_ROUND_LABELS[session.round], strength });
});

router.post("/:draftId/round", requireAuth, async (req, res) => {
  const session = getCupSession(req.params.draftId, req.userId!);
  if (!session) {
    res.status(404).json({ error: "Кубок не найден или истёк" });
    return;
  }

  const playedRound = session.round;
  const opponentOvr = cupOpponentOvr(session.strength, playedRound);
  const opponentName = generateBotName();
  const result = simulateMatch(session.strength, opponentOvr);

  let userWon = result.userScore > result.oppScore;
  if (result.userScore === result.oppScore) {
    if (session.strength > opponentOvr) userWon = true;
    else if (session.strength < opponentOvr) userWon = false;
    else userWon = Math.random() < 0.5;
  }

  const reward = calcCupRoundReward(playedRound, userWon);

  let grantedCard = null;
  if (reward.guaranteedGoldCard) {
    const drawn = await drawGuaranteedCard("GOLD");
    if (drawn) {
      grantedCard = await prisma.card.create({
        data: {
          playerId: drawn.player.id,
          ownerId: req.userId!,
          rarity: drawn.rarity,
          quickSellPrice: quickSellPrice(drawn.rarity, drawn.player),
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
        type: "CUP",
        amount: reward.coins,
        meta: { round: playedRound, won: userWon, opponentName, grantedCardId: grantedCard?.id ?? null },
      },
    }),
    prisma.match.create({
      data: {
        userId: req.userId!,
        mode: "TOURNAMENT",
        opponentName,
        opponentOvr,
        userScore: result.userScore,
        oppScore: result.oppScore,
        events: result.events as unknown as Prisma.InputJsonValue,
        rewards: { coins: reward.coins, xp: reward.xp, round: CUP_ROUND_LABELS[playedRound], won: userWon } as unknown as Prisma.InputJsonValue,
      },
    }),
  ]);

  const { xp, level, coins, levelUpReward } = await addXp(req.userId!, reward.xp);

  const isFinalRound = playedRound === 2;
  const champion = userWon && isFinalRound;
  const eliminated = !userWon;

  if (eliminated || champion) {
    deleteCupSession(session.draftId);
  } else {
    session.round = (playedRound + 1) as typeof session.round;
    session.wins++;
  }

  res.json({
    userScore: result.userScore,
    oppScore: result.oppScore,
    opponentName,
    opponentOvr,
    won: userWon,
    roundLabel: CUP_ROUND_LABELS[playedRound],
    finished: eliminated || champion,
    champion,
    nextRound: eliminated || champion ? null : { round: session.round, label: CUP_ROUND_LABELS[session.round] },
    result: {
      rewardCoins: reward.coins,
      rewardXp: reward.xp,
      coins,
      xp,
      level,
      levelUpReward,
      grantedCard,
    },
  });
});

export default router;
