import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { SBC_DEFS, findSbc, validateSbcCards } from "../lib/sbc.js";
import { drawGuaranteedCard } from "../lib/cardDraw.js";
import { quickSellPrice } from "../lib/cardValue.js";
import { clearCardFromSquads } from "../lib/squadCleanup.js";
import { addXp } from "../lib/xp.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const completions = await prisma.sbcCompletion.findMany({
    where: { userId: req.userId },
    select: { sbcId: true },
  });
  res.json({ sbcs: SBC_DEFS, completedIds: completions.map((c) => c.sbcId) });
});

const submitSchema = z.object({ sbcId: z.string(), cardIds: z.array(z.string()).min(1).max(8) });

router.post("/submit", requireAuth, async (req, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректное тело запроса" });
    return;
  }

  const def = findSbc(parsed.data.sbcId);
  if (!def) {
    res.status(404).json({ error: "Сборка не найдена" });
    return;
  }

  if (!def.repeatable) {
    const already = await prisma.sbcCompletion.findUnique({
      where: { userId_sbcId: { userId: req.userId!, sbcId: def.id } },
    });
    if (already) {
      res.status(400).json({ error: "Эта сборка уже выполнена" });
      return;
    }
  }

  const cards = await prisma.card.findMany({
    where: { id: { in: parsed.data.cardIds }, ownerId: req.userId, isListed: false },
    include: { player: true },
  });
  if (cards.length !== parsed.data.cardIds.length) {
    res.status(400).json({ error: "Часть карт недоступна или не принадлежит вам" });
    return;
  }

  const validationError = validateSbcCards(def, cards);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  let rewardCard = null;
  if (def.reward.guaranteedRarity) {
    rewardCard = await drawGuaranteedCard(def.reward.guaranteedRarity);
    if (!rewardCard) {
      res.status(500).json({ error: "Не удалось сформировать награду — пустая база игроков" });
      return;
    }
  }

  const cardIds = cards.map((c) => c.id);
  for (const id of cardIds) {
    await clearCardFromSquads(req.userId!, id);
  }

  const grantedCard = await prisma.$transaction(async (tx) => {
    await tx.card.deleteMany({ where: { id: { in: cardIds } } });

    let granted = null;
    if (rewardCard) {
      granted = await tx.card.create({
        data: {
          playerId: rewardCard.player.id,
          ownerId: req.userId!,
          rarity: rewardCard.rarity,
          quickSellPrice: quickSellPrice(rewardCard.rarity, rewardCard.player),
        },
        include: { player: { include: { club: { include: { league: true } } } } },
      });
    }

    if (def.reward.coins) {
      await tx.user.update({ where: { id: req.userId }, data: { coins: { increment: def.reward.coins } } });
    }

    await tx.transaction.create({
      data: {
        userId: req.userId!,
        type: "SBC_SUBMIT",
        amount: def.reward.coins ?? 0,
        meta: { sbcId: def.id, consumedCardIds: cardIds, grantedCardId: granted?.id ?? null },
      },
    });

    if (!def.repeatable) {
      await tx.sbcCompletion.create({ data: { userId: req.userId!, sbcId: def.id } });
    }

    return granted;
  });

  const { xp, level, coins, levelUpReward } = await addXp(req.userId!, def.reward.xp ?? 0);

  res.json({ coins, xp, level, levelUpReward, grantedCard, consumedCardIds: cardIds });
});

export default router;
