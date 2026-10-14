import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import {
  ARCADE_PAID_COST,
  calcArcadeRewards,
  createArcadeSession,
  deleteArcadeSession,
  difficultyOvr,
  getArcadeSession,
  isValidDifficulty,
} from "../lib/arcadePenalty.js";
import { FREE_ARCADE_PENALTY_INTERVAL_MS, msUntilFreeArcadePenaltyReady } from "../lib/freeArcadePenalty.js";
import { isShootoutDecided, isValidPower, isValidZone, resolveRound } from "../lib/shootout.js";
import { recordPenaltyOutcome } from "../lib/penaltyStats.js";
import { drawGuaranteedCard } from "../lib/cardDraw.js";
import { quickSellPrice } from "../lib/cardValue.js";
import { addXp } from "../lib/xp.js";

const router = Router();

router.get("/free-status", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  const msLeft = msUntilFreeArcadePenaltyReady(user.lastFreeArcadePenaltyAt);
  res.json({ ready: msLeft <= 0, msLeft, intervalMs: FREE_ARCADE_PENALTY_INTERVAL_MS, paidCost: ARCADE_PAID_COST });
});

const startSchema = z.object({ difficulty: z.string(), free: z.boolean().optional() });

router.post("/start", requireAuth, async (req, res) => {
  const parsed = startSchema.safeParse(req.body);
  if (!parsed.success || !isValidDifficulty(parsed.data.difficulty)) {
    res.status(400).json({ error: "Некорректные данные" });
    return;
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });

  let userGkOverall = 65;
  const squad = await prisma.squad.findFirst({ where: { userId: req.userId, isActive: true } });
  if (squad) {
    const slots = squad.slots as unknown as { cardId: string | null }[];
    const cardIds = slots.map((s) => s.cardId).filter((id): id is string => Boolean(id));
    if (cardIds.length > 0) {
      const cards = await prisma.card.findMany({ where: { id: { in: cardIds } }, include: { player: true } });
      const gk = cards.find((c) => c.player.position === "GK");
      if (gk) userGkOverall = gk.player.overall;
    }
  }

  if (parsed.data.free) {
    const msLeft = msUntilFreeArcadePenaltyReady(user.lastFreeArcadePenaltyAt);
    if (msLeft > 0) {
      res.status(400).json({ error: "Бесплатная серия ещё не доступна", msLeft });
      return;
    }
    await prisma.user.update({ where: { id: user.id }, data: { lastFreeArcadePenaltyAt: new Date() } });
  } else {
    if (user.coins < ARCADE_PAID_COST) {
      res.status(400).json({ error: "Недостаточно монет" });
      return;
    }
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { coins: { decrement: ARCADE_PAID_COST } } }),
      prisma.transaction.create({
        data: { userId: user.id, type: "ARCADE_PENALTY", amount: -ARCADE_PAID_COST, meta: { action: "start" } },
      }),
    ]);
  }

  const session = createArcadeSession({
    userId: req.userId!,
    difficulty: parsed.data.difficulty,
    opponentOvr: difficultyOvr(parsed.data.difficulty),
    userGkOverall,
  });

  res.json({ draftId: session.draftId, opponentOvr: session.opponentOvr, difficulty: session.difficulty });
});

const roundSchema = z.object({
  kickZone: z.number().int(),
  kickPower: z.string(),
  saveZone: z.number().int(),
});

router.post("/:draftId/round", requireAuth, async (req, res) => {
  const session = getArcadeSession(req.params.draftId, req.userId!);
  if (!session) {
    res.status(404).json({ error: "Серия не найдена или истекла" });
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
    res.json({ outcome, userScore: session.userScore, oppScore: session.oppScore, round: session.round, finished: false });
    return;
  }

  const userWon = session.userScore > session.oppScore;
  const rewards = calcArcadeRewards(userWon);

  let grantedCard = null;
  if (userWon && Math.random() < rewards.bonusCardChance) {
    const drawn = await drawGuaranteedCard("BRONZE");
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
        type: "ARCADE_PENALTY",
        amount: rewards.coins,
        meta: { won: userWon, difficulty: session.difficulty, grantedCardId: grantedCard?.id ?? null },
      },
    }),
  ]);

  const { xp, level, coins, levelUpReward } = await addXp(req.userId!, rewards.xp);

  deleteArcadeSession(session.draftId);

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
    },
  });
});

export default router;
