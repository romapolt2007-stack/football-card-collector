import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { calcSquadStrength } from "../lib/squadStrength.js";
import { calcRewards, generateBotName, generateBotOvr, simulateMatch } from "../lib/matchSimulation.js";
import { drawPackCards } from "../lib/cardDraw.js";
import { quickSellPrice } from "../lib/cardValue.js";
import { incrementQuestProgress } from "../lib/quests.js";
import { addXp } from "../lib/xp.js";
import type { SquadSlotJson } from "../lib/squadTypes.js";
import type { Prisma } from "@prisma/client";

const router = Router();

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

  if (starterCardIds.length < 7) {
    res.status(400).json({ error: "В составе должно быть минимум 7 игроков" });
    return;
  }

  const starters = await prisma.card.findMany({
    where: { id: { in: starterCardIds } },
    include: { player: { include: { club: true } } },
  });

  const { strength, avgOvr, chemistry } = calcSquadStrength(starters);
  const opponentName = generateBotName();
  const opponentOvr = generateBotOvr(strength);

  const result = simulateMatch(strength, opponentOvr);
  const rewards = calcRewards(result.userScore, result.oppScore);

  let wonCard = null;
  if (rewards.cardRarityFloor) {
    const [drawn] = await drawPackCards(1, rewards.cardRarityFloor, 0);
    if (drawn) {
      wonCard = await prisma.card.create({
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

  const [match, updatedUser] = await prisma.$transaction([
    prisma.match.create({
      data: {
        userId: req.userId!,
        mode: "QUICK",
        opponentName,
        opponentOvr,
        userScore: result.userScore,
        oppScore: result.oppScore,
        events: result.events as unknown as Prisma.InputJsonValue,
        rewards: { ...rewards, cardId: wonCard?.id ?? null } as unknown as Prisma.InputJsonValue,
      },
    }),
    prisma.user.update({
      where: { id: req.userId },
      data: { coins: { increment: rewards.coins } },
    }),
    prisma.transaction.create({
      data: { userId: req.userId!, type: "MATCH_REWARD", amount: rewards.coins, meta: { mode: "QUICK" } },
    }),
  ]);

  await incrementQuestProgress(req.userId!, "PLAY_MATCH");
  if (result.userScore > result.oppScore) {
    await incrementQuestProgress(req.userId!, "WIN_MATCH");
  }
  const { xp, level } = await addXp(req.userId!, rewards.xp);

  res.json({
    match,
    stats: result.stats,
    squad: { strength, avgOvr, chemistry },
    coins: updatedUser.coins,
    xp,
    level,
    wonCard,
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
