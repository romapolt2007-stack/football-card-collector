import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { incomePerHour, pendingIncome, upgradeCost, STADIUM_MAX_LEVEL } from "../lib/stadium.js";

const router = Router();

router.get("/status", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.userId },
    select: { stadiumLevel: true, stadiumCollectedAt: true },
  });
  res.json({
    level: user.stadiumLevel,
    maxLevel: STADIUM_MAX_LEVEL,
    incomePerHour: incomePerHour(user.stadiumLevel),
    pending: pendingIncome(user.stadiumLevel, user.stadiumCollectedAt),
    upgradeCost: upgradeCost(user.stadiumLevel),
  });
});

router.post("/collect", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.userId },
    select: { stadiumLevel: true, stadiumCollectedAt: true },
  });
  const amount = pendingIncome(user.stadiumLevel, user.stadiumCollectedAt);
  if (amount <= 0) {
    res.status(400).json({ error: "Пока нечего собирать" });
    return;
  }

  const [updated] = await prisma.$transaction([
    prisma.user.update({
      where: { id: req.userId },
      data: { coins: { increment: amount }, stadiumCollectedAt: new Date() },
    }),
    prisma.transaction.create({
      data: { userId: req.userId!, type: "STADIUM", amount, meta: { action: "collect" } },
    }),
  ]);

  res.json({ coins: updated.coins, collected: amount });
});

router.post("/upgrade", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.userId },
    select: { stadiumLevel: true, stadiumCollectedAt: true, coins: true },
  });

  const cost = upgradeCost(user.stadiumLevel);
  if (cost === null) {
    res.status(400).json({ error: "Стадион уже максимального уровня" });
    return;
  }

  const pending = pendingIncome(user.stadiumLevel, user.stadiumCollectedAt);
  const availableCoins = user.coins + pending;
  if (availableCoins < cost) {
    res.status(400).json({ error: "Недостаточно монет" });
    return;
  }

  const [updated] = await prisma.$transaction([
    prisma.user.update({
      where: { id: req.userId },
      data: {
        coins: availableCoins - cost,
        stadiumLevel: { increment: 1 },
        stadiumCollectedAt: new Date(),
      },
    }),
    prisma.transaction.create({
      data: { userId: req.userId!, type: "STADIUM", amount: -cost, meta: { action: "upgrade", autoCollected: pending } },
    }),
  ]);

  res.json({ coins: updated.coins, level: updated.stadiumLevel });
});

export default router;
