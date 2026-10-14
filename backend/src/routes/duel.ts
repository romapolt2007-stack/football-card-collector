import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { settleEnergy, trySpendEnergy, ENERGY_MAX } from "../lib/energy.js";
import {
  DUEL_ENERGY_COST,
  calcDuelRewards,
  ensureDuelTrophy,
  eloDelta,
  findOpponent,
  leagueForPoints,
  loadSelfSquadInfo,
  LEAGUE_LABEL_RU,
} from "../lib/duel.js";
import { createDuelSession, deleteDuelSession, getDuelSession } from "../lib/duelStore.js";
import { isShootoutDecided, isValidPower, isValidZone, resolveRound } from "../lib/shootout.js";
import { drawGuaranteedCard } from "../lib/cardDraw.js";
import { quickSellPrice } from "../lib/cardValue.js";
import { addXp } from "../lib/xp.js";
import { incrementQuestProgress } from "../lib/quests.js";

const router = Router();

router.get("/status", requireAuth, async (req, res) => {
  const { energy, energyUpdatedAt } = await settleEnergy(req.userId!);
  const trophy = await ensureDuelTrophy(req.userId!);
  res.json({
    energy,
    energyUpdatedAt,
    energyMax: ENERGY_MAX,
    energyCost: DUEL_ENERGY_COST,
    league: trophy.league,
    leagueLabel: LEAGUE_LABEL_RU[trophy.league],
    points: trophy.points,
    wins: trophy.wins,
    losses: trophy.losses,
  });
});

router.post("/find", requireAuth, async (req, res) => {
  const squadInfo = await loadSelfSquadInfo(req.userId!);
  if (!squadInfo) {
    res.status(400).json({ error: "Сначала соберите состав минимум из 7 игроков" });
    return;
  }

  const { energy } = await settleEnergy(req.userId!);
  const remaining = trySpendEnergy(energy, DUEL_ENERGY_COST);
  if (remaining === null) {
    res.status(400).json({ error: "Недостаточно энергии", energy, energyCost: DUEL_ENERGY_COST });
    return;
  }

  const trophy = await ensureDuelTrophy(req.userId!);
  const opponent = await findOpponent(req.userId!, squadInfo.strength);

  await prisma.user.update({ where: { id: req.userId }, data: { energy: remaining, energyUpdatedAt: new Date() } });

  const session = createDuelSession({
    userId: req.userId!,
    opponentName: opponent.opponentName,
    opponentOvr: opponent.opponentOvr,
    opponentUserId: opponent.opponentUserId,
    opponentPoints: opponent.opponentPoints,
    isRealOpponent: opponent.isRealOpponent,
    userGkOverall: squadInfo.userGkOverall,
    selfPoints: trophy.points,
  });

  res.json({
    draftId: session.draftId,
    opponentName: session.opponentName,
    opponentOvr: session.opponentOvr,
    isRealOpponent: session.isRealOpponent,
    energy: remaining,
  });
});

const roundSchema = z.object({
  kickZone: z.number().int(),
  kickPower: z.string(),
  saveZone: z.number().int(),
});

router.post("/:draftId/round", requireAuth, async (req, res) => {
  const session = getDuelSession(req.params.draftId, req.userId!);
  if (!session) {
    res.status(404).json({ error: "Дуэль не найдена или истекла" });
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

  const decided = isShootoutDecided(session.userScore, session.oppScore, roundJustPlayed);
  if (!decided) {
    res.json({ outcome, userScore: session.userScore, oppScore: session.oppScore, round: session.round, finished: false });
    return;
  }

  const userWon = session.userScore > session.oppScore;
  const rewards = calcDuelRewards(userWon);
  const pointsDelta = eloDelta(session.selfPoints, session.opponentPoints, userWon);
  const newPoints = Math.max(0, session.selfPoints + pointsDelta);
  const newLeague = leagueForPoints(newPoints);

  let grantedCard = null;
  if (userWon && Math.random() < rewards.bonusCardChance) {
    const drawn = await drawGuaranteedCard("SILVER");
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
    prisma.user.update({ where: { id: req.userId }, data: { coins: { increment: rewards.coins } } }),
    prisma.transaction.create({
      data: {
        userId: req.userId!,
        type: "DUEL",
        amount: rewards.coins,
        meta: { won: userWon, isRealOpponent: session.isRealOpponent, pointsDelta, grantedCardId: grantedCard?.id ?? null },
      },
    }),
    prisma.duelTrophy.update({
      where: { userId: req.userId },
      data: {
        points: newPoints,
        league: newLeague,
        wins: { increment: userWon ? 1 : 0 },
        losses: { increment: userWon ? 0 : 1 },
      },
    }),
    prisma.duelMatch.create({
      data: {
        attackerId: req.userId!,
        opponentName: session.opponentName,
        opponentOvr: session.opponentOvr,
        isRealOpponent: session.isRealOpponent,
        attackerScore: session.userScore,
        defenderScore: session.oppScore,
        won: userWon,
        pointsDelta,
      },
    }),
  ]);

  const { xp, level, coins, levelUpReward } = await addXp(req.userId!, rewards.xp);
  if (userWon) await incrementQuestProgress(req.userId!, "WIN_DUEL");

  deleteDuelSession(session.draftId);

  res.json({
    outcome,
    userScore: session.userScore,
    oppScore: session.oppScore,
    round: session.round,
    finished: true,
    result: {
      won: userWon,
      rewardCoins: rewards.coins,
      rewardXp: rewards.xp,
      coins,
      xp,
      level,
      levelUpReward,
      grantedCard,
      pointsDelta,
      points: newPoints,
      league: newLeague,
      leagueLabel: LEAGUE_LABEL_RU[newLeague],
      opponentName: session.opponentName,
      isRealOpponent: session.isRealOpponent,
    },
  });
});

export default router;
