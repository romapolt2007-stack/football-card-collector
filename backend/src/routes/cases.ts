import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { CASES, findCase, rollPrize } from "../lib/cases.js";
import { randomPlayerByRarity } from "../lib/cardDraw.js";
import { quickSellPrice } from "../lib/cardValue.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ cases: CASES });
});

const spinSchema = z.object({ caseId: z.string() });

router.post("/spin", requireAuth, async (req, res) => {
  const parsed = spinSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректное тело запроса" });
    return;
  }

  const caseDef = findCase(parsed.data.caseId);
  if (!caseDef) {
    res.status(404).json({ error: "Кейс не найден" });
    return;
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  if (user.coins < caseDef.priceCoins) {
    res.status(400).json({ error: "Недостаточно монет" });
    return;
  }

  const prize = rollPrize(caseDef);

  let coinsWon = 0;
  let wonCard = null;

  if (prize.type === "COINS") {
    coinsWon = Math.round(Math.random() * ((prize.coinsMax ?? 0) - (prize.coinsMin ?? 0)) + (prize.coinsMin ?? 0));
  } else if (prize.type === "JACKPOT") {
    coinsWon = caseDef.priceCoins * (prize.jackpotMultiplier ?? 2);
  } else if (prize.type === "CARD" && prize.rarity) {
    const player = await randomPlayerByRarity(prize.rarity);
    if (player) {
      wonCard = await prisma.card.create({
        data: {
          playerId: player.id,
          ownerId: req.userId!,
          rarity: prize.rarity,
          quickSellPrice: quickSellPrice(prize.rarity, player.overall),
        },
        include: { player: { include: { club: { include: { league: true } } } } },
      });
    }
  }

  const netChange = coinsWon - caseDef.priceCoins;
  const updatedUser = await prisma.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id: req.userId },
      data: { coins: { increment: netChange } },
    });
    await tx.transaction.create({
      data: {
        userId: req.userId!,
        type: "CASE_SPIN",
        amount: netChange,
        meta: { caseId: caseDef.id, prizeType: prize.type, cardId: wonCard?.id },
      },
    });
    return u;
  });

  res.json({
    prize: { type: prize.type, coins: coinsWon, card: wonCard },
    coins: updatedUser.coins,
  });
});

export default router;
