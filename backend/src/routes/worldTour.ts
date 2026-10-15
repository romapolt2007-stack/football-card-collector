import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { calcSquadStrength } from "../lib/squadStrength.js";
import { generateBotName, simulateMatch } from "../lib/matchSimulation.js";
import { WORLD_TOUR_STAGES, worldTourOpponentOvr } from "../lib/worldTour.js";
import { drawGuaranteedCard } from "../lib/cardDraw.js";
import { quickSellPrice } from "../lib/cardValue.js";
import { addXp } from "../lib/xp.js";
import type { SquadSlotJson } from "../lib/squadTypes.js";
import type { Prisma } from "@prisma/client";

const router = Router();

router.get("/status", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  res.json({
    stage: user.worldTourStage,
    totalStages: WORLD_TOUR_STAGES.length,
    completed: user.worldTourStage >= WORLD_TOUR_STAGES.length,
    stages: WORLD_TOUR_STAGES.map((s, i) => ({
      city: s.city,
      rewardCoins: s.rewardCoins,
      guaranteedRarity: s.guaranteedRarity,
      status: i < user.worldTourStage ? "done" : i === user.worldTourStage ? "current" : "locked",
    })),
  });
});

router.post("/play", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  if (user.worldTourStage >= WORLD_TOUR_STAGES.length) {
    res.status(400).json({ error: "World Tour уже пройден полностью" });
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

  const stageIndex = user.worldTourStage;
  const stage = WORLD_TOUR_STAGES[stageIndex];
  const { strength } = calcSquadStrength(starters);
  const opponentOvr = worldTourOpponentOvr(strength, stageIndex);
  const opponentName = `${stage.city} ${generateBotName()}`;

  const result = simulateMatch(strength, opponentOvr);
  const won = result.userScore > result.oppScore;

  let grantedCard = null;
  if (won && stage.guaranteedRarity) {
    const drawn = await drawGuaranteedCard(stage.guaranteedRarity);
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

  const rewardCoins = won ? stage.rewardCoins : Math.round(stage.rewardCoins * 0.2);
  const rewardXp = won ? stage.rewardXp : Math.round(stage.rewardXp * 0.2);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: req.userId },
      data: {
        coins: { increment: rewardCoins },
        worldTourStage: won ? { increment: 1 } : undefined,
      },
    }),
    prisma.transaction.create({
      data: {
        userId: req.userId!,
        type: "WORLD_TOUR",
        amount: rewardCoins,
        meta: { stage: stageIndex, city: stage.city, won, grantedCardId: grantedCard?.id ?? null },
      },
    }),
    prisma.match.create({
      data: {
        userId: req.userId!,
        mode: "DRAFT",
        opponentName,
        opponentOvr,
        userScore: result.userScore,
        oppScore: result.oppScore,
        events: result.events as unknown as Prisma.InputJsonValue,
        rewards: { coins: rewardCoins, xp: rewardXp, city: stage.city, won } as unknown as Prisma.InputJsonValue,
      },
    }),
  ]);

  const { xp, level, coins, levelUpReward } = await addXp(req.userId!, rewardXp);

  const newStage = won ? stageIndex + 1 : stageIndex;
  const tourCompleted = won && newStage >= WORLD_TOUR_STAGES.length;

  res.json({
    userScore: result.userScore,
    oppScore: result.oppScore,
    opponentName,
    opponentOvr,
    won,
    city: stage.city,
    tourCompleted,
    nextCity: tourCompleted ? null : WORLD_TOUR_STAGES[newStage]?.city ?? null,
    result: { rewardCoins, rewardXp, coins, xp, level, levelUpReward, grantedCard },
  });
});

export default router;
