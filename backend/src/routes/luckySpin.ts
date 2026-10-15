import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { isValidStake, MAX_STAKE, MIN_STAKE, rollRarity, STAKE_STEP, weightsForStake } from "../lib/luckySpin.js";
import {
  FREE_LUCKY_SPIN_INTERVAL_MS,
  FREE_LUCKY_SPIN_STAKE_EQUIVALENT,
  msUntilFreeLuckySpinReady,
} from "../lib/freeLuckySpin.js";
import { randomPlayerByRarity } from "../lib/cardDraw.js";
import { quickSellPrice } from "../lib/cardValue.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    minStake: MIN_STAKE,
    maxStake: MAX_STAKE,
    step: STAKE_STEP,
    minWeights: weightsForStake(MIN_STAKE),
    maxWeights: weightsForStake(MAX_STAKE),
  });
});

router.get("/free-status", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  const msLeft = msUntilFreeLuckySpinReady(user.lastFreeLuckySpinAt);
  res.json({
    ready: msLeft === 0,
    msLeft,
    intervalMs: FREE_LUCKY_SPIN_INTERVAL_MS,
    stakeEquivalent: FREE_LUCKY_SPIN_STAKE_EQUIVALENT,
  });
});

const spinSchema = z.object({ stake: z.number().int().optional(), free: z.boolean().optional() });

router.post("/spin", requireAuth, async (req, res) => {
  const parsed = spinSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректное тело запроса" });
    return;
  }

  const isFree = parsed.data.free === true;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });

  let stake: number;
  if (isFree) {
    const msLeft = msUntilFreeLuckySpinReady(user.lastFreeLuckySpinAt);
    if (msLeft > 0) {
      res.status(400).json({ error: "Бесплатный спин ещё не готов", msLeft });
      return;
    }
    stake = FREE_LUCKY_SPIN_STAKE_EQUIVALENT;
  } else {
    stake = parsed.data.stake ?? NaN;
    if (!isValidStake(stake)) {
      res.status(400).json({ error: `Ставка должна быть от ${MIN_STAKE} до ${MAX_STAKE}` });
      return;
    }
    if (user.coins < stake) {
      res.status(400).json({ error: "Недостаточно монет" });
      return;
    }
  }

  const spinNumberAfterThis = user.luckySpinCount + 1;
  const { rarity, wasPity } = rollRarity(stake, { spinNumberAfterThis, userLevel: user.level });

  const player = await randomPlayerByRarity(rarity);
  if (!player) {
    res.status(500).json({ error: "Не удалось найти игрока такой редкости" });
    return;
  }

  const now = new Date();
  const { updatedUser, card } = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: {
        coins: isFree ? undefined : { decrement: stake },
        luckySpinCount: spinNumberAfterThis,
        lastFreeLuckySpinAt: isFree ? now : undefined,
      },
    });
    const card = await tx.card.create({
      data: {
        playerId: player.id,
        ownerId: user.id,
        rarity,
        quickSellPrice: quickSellPrice(rarity, player),
      },
      include: { player: { include: { club: { include: { league: true } } } } },
    });
    await tx.transaction.create({
      data: {
        userId: user.id,
        type: "LUCKY_SPIN",
        amount: isFree ? 0 : -stake,
        meta: { stake, rarity, wasPity, free: isFree },
      },
    });
    return { updatedUser, card };
  });

  res.json({
    card,
    coins: updatedUser.coins,
    spinNumber: spinNumberAfterThis,
    wasPity,
    free: isFree,
  });
});

export default router;
