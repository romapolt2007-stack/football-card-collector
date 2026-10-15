import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { quickSellPrice } from "../lib/cardValue.js";
import {
  attemptTopTierUpgrade,
  freeSpinReady,
  hotStreakUpgradeChance,
  HOT_STREAK_MAX,
  msUntilFreeSpin,
  nextHotStreak,
  spinPlayer,
} from "../lib/spin.js";
import { setPendingSpin, takePendingSpin } from "../lib/spinStore.js";
import { getUserStadiumBuff } from "../lib/stadiumBuffs.js";
import { leagueTrendMultiplier } from "../lib/marketTrends.js";

const router = Router();

router.get("/status", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  res.json({
    ready: freeSpinReady(user.lastFreeSpinAt),
    msLeft: msUntilFreeSpin(user.lastFreeSpinAt),
    hotStreak: user.hotStreakCount,
    hotStreakMax: HOT_STREAK_MAX,
  });
});

const spinSchema = z.object({
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

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  if (!freeSpinReady(user.lastFreeSpinAt)) {
    res.status(400).json({ error: "Бесплатный спин ещё не доступен", msLeft: msUntilFreeSpin(user.lastFreeSpinAt) });
    return;
  }

  const streak = nextHotStreak(user.hotStreakCount, user.lastFreeSpinAt, Boolean(parsed.data.clubId));

  // Кулдаун и серию фиксируем сразу, до генерации результата — защита от повторного нажатия.
  await prisma.user.update({ where: { id: user.id }, data: { lastFreeSpinAt: new Date(), hotStreakCount: streak } });

  let player = await spinPlayer(parsed.data);
  if (!player) {
    res.status(400).json({ error: "Нет игроков под эти фильтры — попробуйте другие" });
    return;
  }

  const stadiumBuff = await getUserStadiumBuff(user.id);
  let wasHotUpgrade = false;
  if (!["LEGEND", "ICON"].includes(player.rarity)) {
    const chance = hotStreakUpgradeChance(streak, stadiumBuff.topTierWeightBonus);
    const upgraded = await attemptTopTierUpgrade(parsed.data, chance);
    if (upgraded) {
      player = upgraded;
      wasHotUpgrade = true;
    }
  }

  const trendMultiplier = leagueTrendMultiplier(player.club.leagueId);
  const price = quickSellPrice(player.rarity, player, trendMultiplier);
  setPendingSpin(user.id, { kind: "player", playerId: player.id, rarity: player.rarity, price });

  res.json({
    player,
    rarity: player.rarity,
    estimatedValue: price * 4,
    sellPrice: price,
    hotStreak: streak,
    hotStreakMax: HOT_STREAK_MAX,
    wasHotUpgrade,
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
