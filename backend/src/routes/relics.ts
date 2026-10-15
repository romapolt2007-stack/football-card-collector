import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { countUserRelics, pendingRelicDividends, RELIC_DIVIDEND_PER_CARD_PER_DAY } from "../lib/relics.js";

const router = Router();

router.get("/status", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  const relicCount = await countUserRelics(req.userId!);
  const pending = pendingRelicDividends(relicCount, user.relicDividendsCollectedAt);
  res.json({ relicCount, pending, perCardPerDay: RELIC_DIVIDEND_PER_CARD_PER_DAY });
});

router.post("/collect", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  const relicCount = await countUserRelics(req.userId!);
  const pending = pendingRelicDividends(relicCount, user.relicDividendsCollectedAt);

  if (pending <= 0) {
    res.status(400).json({ error: relicCount === 0 ? "У вас нет реликвий (лимитированных карт)" : "Пока нечего собирать" });
    return;
  }

  const [updated] = await prisma.$transaction([
    prisma.user.update({
      where: { id: req.userId },
      data: { coins: { increment: pending }, relicDividendsCollectedAt: new Date() },
    }),
    prisma.transaction.create({
      data: { userId: req.userId!, type: "DAILY_BONUS", amount: pending, meta: { source: "relic_dividends", relicCount } },
    }),
  ]);

  res.json({ coins: updated.coins, collected: pending });
});

export default router;
