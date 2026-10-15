import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { stadiumQuickSellPrice } from "../lib/cardValue.js";
import { freeSpinReady, msUntilFreeSpin, spinStadium } from "../lib/spin.js";
import { setPendingSpin, takePendingSpin } from "../lib/spinStore.js";
import { findStadiumCase, openStadiumCase, STADIUM_CASES } from "../lib/stadiumCases.js";
import { getUserStadiumBuff } from "../lib/stadiumBuffs.js";

const router = Router();

router.get("/cases", (_req, res) => {
  res.json({ cases: STADIUM_CASES.map((c) => ({ id: c.id, title: c.title, priceCoins: c.priceCoins })) });
});

router.get("/", requireAuth, async (req, res) => {
  const stadiumCards = await prisma.stadiumCard.findMany({
    where: { ownerId: req.userId },
    include: { stadium: { include: { club: { include: { league: true } } } } },
    orderBy: { obtainedAt: "desc" },
  });
  res.json({ stadiumCards });
});

router.get("/buff", requireAuth, async (req, res) => {
  const buff = await getUserStadiumBuff(req.userId!);
  res.json(buff);
});

router.get("/status", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  res.json({
    ready: freeSpinReady(user.lastFreeStadiumSpinAt),
    msLeft: msUntilFreeSpin(user.lastFreeStadiumSpinAt),
  });
});

router.post("/spin", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  if (!freeSpinReady(user.lastFreeStadiumSpinAt)) {
    res.status(400).json({ error: "Бесплатный спин ещё не доступен", msLeft: msUntilFreeSpin(user.lastFreeStadiumSpinAt) });
    return;
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastFreeStadiumSpinAt: new Date() } });

  const buff = await getUserStadiumBuff(user.id);
  const stadium = await spinStadium(buff.topTierWeightBonus);
  if (!stadium) {
    res.status(500).json({ error: "Нет стадионов в базе — попробуйте ещё раз" });
    return;
  }

  const price = stadiumQuickSellPrice(stadium.rarity, stadium.capacity);
  setPendingSpin(user.id, { kind: "stadium", stadiumId: stadium.id, rarity: stadium.rarity, price });

  res.json({ stadium, rarity: stadium.rarity, estimatedValue: price * 4, sellPrice: price });
});

const openCaseSchema = z.object({ caseId: z.string() });

router.post("/open-case", requireAuth, async (req, res) => {
  const parsed = openCaseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректное тело запроса" });
    return;
  }

  const caseDef = findStadiumCase(parsed.data.caseId);
  if (!caseDef) {
    res.status(404).json({ error: "Кейс не найден" });
    return;
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  if (user.coins < caseDef.priceCoins) {
    res.status(400).json({ error: "Недостаточно монет" });
    return;
  }

  // Списываем сразу, до генерации результата — защита от повторного нажатия.
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { coins: { decrement: caseDef.priceCoins } } }),
    prisma.transaction.create({
      data: { userId: user.id, type: "STADIUM_CASE_OPEN", amount: -caseDef.priceCoins, meta: { caseId: caseDef.id } },
    }),
  ]);

  const buff = await getUserStadiumBuff(user.id);
  const stadium = await openStadiumCase(caseDef, buff.topTierWeightBonus);
  if (!stadium) {
    // Откатываем списание, если стадионов под эти веса не нашлось (пустая база — не должно случаться в норме).
    await prisma.user.update({ where: { id: user.id }, data: { coins: { increment: caseDef.priceCoins } } });
    res.status(500).json({ error: "Не удалось открыть кейс — монеты возвращены" });
    return;
  }

  const price = stadiumQuickSellPrice(stadium.rarity, stadium.capacity);
  setPendingSpin(user.id, { kind: "stadium", stadiumId: stadium.id, rarity: stadium.rarity, price });

  res.json({ stadium, rarity: stadium.rarity, estimatedValue: price * 4, sellPrice: price, coins: user.coins - caseDef.priceCoins });
});

router.post("/save", requireAuth, async (req, res) => {
  const pending = takePendingSpin(req.userId!);
  if (!pending || pending.kind !== "stadium") {
    res.status(400).json({ error: "Нечего сохранять — результат уже обработан" });
    return;
  }

  const stadiumCard = await prisma.stadiumCard.create({
    data: {
      stadiumId: pending.stadiumId,
      ownerId: req.userId!,
      quickSellPrice: pending.price,
    },
    include: { stadium: { include: { club: { include: { league: true } } } } },
  });

  res.json({ stadiumCard });
});

router.post("/sell", requireAuth, async (req, res) => {
  const pending = takePendingSpin(req.userId!);
  if (!pending || pending.kind !== "stadium") {
    res.status(400).json({ error: "Нечего продавать — результат уже обработан" });
    return;
  }

  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: req.userId },
      data: { coins: { increment: pending.price } },
    });
    await tx.transaction.create({
      data: { userId: req.userId!, type: "QUICK_SELL", amount: pending.price, meta: { stadiumId: pending.stadiumId } },
    });
    return updated;
  });

  res.json({ coins: user.coins });
});

const quickSellSchema = z.object({ stadiumCardId: z.string() });

router.post("/quick-sell", requireAuth, async (req, res) => {
  const parsed = quickSellSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректное тело запроса" });
    return;
  }

  const stadiumCard = await prisma.stadiumCard.findUnique({ where: { id: parsed.data.stadiumCardId } });
  if (!stadiumCard || stadiumCard.ownerId !== req.userId) {
    res.status(404).json({ error: "Карта стадиона не найдена" });
    return;
  }
  if (stadiumCard.isListed) {
    res.status(400).json({ error: "Выставлена на продажу — сначала снимите с рынка" });
    return;
  }

  const user = await prisma.$transaction(async (tx) => {
    await tx.stadiumCard.delete({ where: { id: stadiumCard.id } });
    const updated = await tx.user.update({
      where: { id: req.userId },
      data: { coins: { increment: stadiumCard.quickSellPrice } },
    });
    await tx.transaction.create({
      data: { userId: req.userId!, type: "QUICK_SELL", amount: stadiumCard.quickSellPrice, meta: { stadiumCardId: stadiumCard.id } },
    });
    return updated;
  });

  res.json({ coins: user.coins });
});

export default router;
