import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { incrementQuestProgress } from "../lib/quests.js";
import { clearCardFromSquads } from "../lib/squadCleanup.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const cards = await prisma.card.findMany({
    where: { ownerId: req.userId },
    include: { player: { include: { club: { include: { league: true } } } } },
    orderBy: { obtainedAt: "desc" },
  });
  res.json({ cards });
});

const quickSellSchema = z.object({ cardId: z.string() });

router.post("/quick-sell", requireAuth, async (req, res) => {
  const parsed = quickSellSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректное тело запроса" });
    return;
  }

  const card = await prisma.card.findUnique({ where: { id: parsed.data.cardId } });
  if (!card || card.ownerId !== req.userId) {
    res.status(404).json({ error: "Карта не найдена" });
    return;
  }
  if (card.isListed) {
    res.status(400).json({ error: "Карта выставлена на продажу — сначала снимите с рынка" });
    return;
  }

  await clearCardFromSquads(req.userId!, card.id);

  const updatedUser = await prisma.$transaction(async (tx) => {
    await tx.card.delete({ where: { id: card.id } });
    const user = await tx.user.update({
      where: { id: req.userId },
      data: { coins: { increment: card.quickSellPrice } },
    });
    await tx.transaction.create({
      data: {
        userId: req.userId!,
        type: "QUICK_SELL",
        amount: card.quickSellPrice,
        meta: { cardId: card.id },
      },
    });
    return user;
  });

  await incrementQuestProgress(req.userId!, "SELL_CARD");
  res.json({ coins: updatedUser.coins });
});

export default router;
