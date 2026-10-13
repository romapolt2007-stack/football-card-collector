import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { findStakeTier, rollRarity, STAKE_TIERS } from "../lib/luckySpin.js";
import { randomPlayerByRarity } from "../lib/cardDraw.js";
import { quickSellPrice } from "../lib/cardValue.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ tiers: STAKE_TIERS });
});

const spinSchema = z.object({ stake: z.number().int() });

router.post("/spin", requireAuth, async (req, res) => {
  const parsed = spinSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректное тело запроса" });
    return;
  }

  const tier = findStakeTier(parsed.data.stake);
  if (!tier) {
    res.status(404).json({ error: "Такой ставки не существует" });
    return;
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  if (user.coins < tier.stake) {
    res.status(400).json({ error: "Недостаточно монет" });
    return;
  }

  const spinNumberAfterThis = user.luckySpinCount + 1;
  const { rarity, wasPity } = rollRarity(tier, { spinNumberAfterThis, userLevel: user.level });

  const player = await randomPlayerByRarity(rarity);
  if (!player) {
    res.status(500).json({ error: "Не удалось найти игрока такой редкости" });
    return;
  }

  const { updatedUser, card } = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: { coins: { decrement: tier.stake }, luckySpinCount: spinNumberAfterThis },
    });
    const card = await tx.card.create({
      data: {
        playerId: player.id,
        ownerId: user.id,
        rarity,
        quickSellPrice: quickSellPrice(rarity, player.overall),
      },
      include: { player: { include: { club: { include: { league: true } } } } },
    });
    await tx.transaction.create({
      data: {
        userId: user.id,
        type: "LUCKY_SPIN",
        amount: -tier.stake,
        meta: { stake: tier.stake, rarity, wasPity },
      },
    });
    return { updatedUser, card };
  });

  res.json({
    card,
    coins: updatedUser.coins,
    spinNumber: spinNumberAfterThis,
    wasPity,
  });
});

export default router;
