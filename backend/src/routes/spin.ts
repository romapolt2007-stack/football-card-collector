import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { quickSellPrice } from "../lib/cardValue.js";
import {
  hotStreakThreshold,
  MAX_SPIN_COST,
  MIN_SPIN_COST,
  nextHotStreak,
  playerLevel,
  rarityWeightsForSpin,
  spinPlayer,
  spinPlayerGuaranteedTop,
} from "../lib/spin.js";
import { setPendingSpin, takePendingSpin } from "../lib/spinStore.js";
import { getUserStadiumBuff } from "../lib/stadiumBuffs.js";
import { leagueTrendMultiplier } from "../lib/marketTrends.js";

const router = Router();

router.get("/status", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  res.json({
    coins: user.coins,
    minCost: MIN_SPIN_COST,
    maxCost: MAX_SPIN_COST,
    level: playerLevel(user.totalSpins),
    totalSpins: user.totalSpins,
    hotStreak: user.hotStreakCount,
    hotStreakThreshold: hotStreakThreshold(user.totalSpins),
  });
});

/** Кнопка "Шансы" — текущие проценты редкости для заданной ставки (с учётом баффа стадиона). */
router.get("/odds", requireAuth, async (req, res) => {
  const amount = Math.min(MAX_SPIN_COST, Math.max(MIN_SPIN_COST, Number(req.query.amount) || MIN_SPIN_COST));
  const stadiumBuff = await getUserStadiumBuff(req.userId!);
  const weights = rarityWeightsForSpin(amount, stadiumBuff.topTierWeightBonus);
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const percentages = Object.fromEntries(
    Object.entries(weights).map(([rarity, w]) => [rarity, Math.round((w / total) * 1000) / 10]),
  );
  res.json({ amount, minCost: MIN_SPIN_COST, maxCost: MAX_SPIN_COST, percentages });
});

const spinSchema = z.object({
  amount: z.number().int().min(MIN_SPIN_COST).max(MAX_SPIN_COST),
  leagueId: z.string().optional(),
  clubId: z.string().optional(),
  nation: z.string().optional(),
});

router.post("/spin", requireAuth, async (req, res) => {
  const parsed = spinSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректное тело запроса" });
    return;
  }
  const { amount, ...filters } = parsed.data;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  const threshold = hotStreakThreshold(user.totalSpins);
  const nextStreak = nextHotStreak(user.hotStreakCount, user.lastFreeSpinAt, Boolean(filters.clubId), threshold);
  const guaranteedTop = nextStreak >= threshold;
  const streakAfterSpin = guaranteedTop ? 0 : nextStreak;

  // Списываем ставку и фиксируем серию/счётчик спинов атомарно, одним условным
  // апдейтом — защита и от повторного нажатия, и от гонки при нехватке монет.
  const charged = await prisma.user.updateMany({
    where: { id: user.id, coins: { gte: amount } },
    data: {
      coins: { decrement: amount },
      lastFreeSpinAt: new Date(),
      hotStreakCount: streakAfterSpin,
      totalSpins: { increment: 1 },
    },
  });
  if (charged.count === 0) {
    res.status(400).json({ error: "Недостаточно монет для такой ставки" });
    return;
  }
  await prisma.transaction.create({ data: { userId: user.id, type: "SPIN_PLAYER", amount: -amount } });

  const stadiumBuff = await getUserStadiumBuff(user.id);
  const player = guaranteedTop
    ? await spinPlayerGuaranteedTop(filters)
    : await spinPlayer(filters, amount, stadiumBuff.topTierWeightBonus);

  if (!player) {
    // Под эти фильтры никого не нашлось — возвращаем ставку.
    await prisma.user.update({ where: { id: user.id }, data: { coins: { increment: amount } } });
    res.status(400).json({ error: "Нет игроков под эти фильтры — попробуйте другие" });
    return;
  }

  const trendMultiplier = leagueTrendMultiplier(player.club.leagueId);
  const price = quickSellPrice(player.rarity, player, trendMultiplier);
  setPendingSpin(user.id, { kind: "player", playerId: player.id, rarity: player.rarity, price });

  res.json({
    player,
    rarity: player.rarity,
    estimatedValue: price * 4,
    sellPrice: price,
    level: playerLevel(user.totalSpins + 1),
    hotStreak: streakAfterSpin,
    hotStreakThreshold: hotStreakThreshold(user.totalSpins + 1),
    wasGuaranteedTop: guaranteedTop,
    coins: user.coins - amount,
  });
});

router.post("/save", requireAuth, async (req, res) => {
  const pending = takePendingSpin(req.userId!);
  if (!pending || pending.kind !== "player") {
    res.status(400).json({ error: "Нечего сохранять — результат уже обработан" });
    return;
  }

  const player = await prisma.player.findUniqueOrThrow({
    where: { id: pending.playerId },
    include: { _count: { select: { cards: true } } },
  });
  if (player.maxSupply != null && player._count.cards >= player.maxSupply) {
    res.status(409).json({ error: `Все ${player.maxSupply} копий «${player.fullName}» уже разобраны` });
    return;
  }

  const card = await prisma.card.create({
    data: {
      playerId: pending.playerId,
      ownerId: req.userId!,
      rarity: pending.rarity,
      quickSellPrice: pending.price,
    },
    include: { player: { include: { club: { include: { league: true } } } } },
  });

  res.json({ card });
});

router.post("/sell", requireAuth, async (req, res) => {
  const pending = takePendingSpin(req.userId!);
  if (!pending || pending.kind !== "player") {
    res.status(400).json({ error: "Нечего продавать — результат уже обработан" });
    return;
  }

  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: req.userId },
      data: { coins: { increment: pending.price } },
    });
    await tx.transaction.create({
      data: { userId: req.userId!, type: "QUICK_SELL", amount: pending.price, meta: { playerId: pending.playerId } },
    });
    return updated;
  });

  res.json({ coins: user.coins });
});

export default router;
