import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { quickSellPrice } from "../lib/cardValue.js";
import { freeSpinReady, msUntilFreeSpin, rollPosition, spinPlayer } from "../lib/spin.js";
import { setPendingSpin, takePendingSpin } from "../lib/spinStore.js";

const router = Router();

router.get("/status", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  res.json({
    ready: freeSpinReady(user.lastFreeSpinAt),
    msLeft: msUntilFreeSpin(user.lastFreeSpinAt),
  });
});

const spinSchema = z.object({ leagueId: z.string().optional() });

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

  // Кулдаун фиксируем сразу, до генерации результата — защита от повторного нажатия.
  await prisma.user.update({ where: { id: user.id }, data: { lastFreeSpinAt: new Date() } });

  const position = rollPosition();
  const player = await spinPlayer(position, parsed.data.leagueId);
  if (!player) {
    res.status(500).json({ error: "Нет игроков под эту позицию — попробуйте ещё раз" });
    return;
  }

  const price = quickSellPrice(player.rarity, player);
  setPendingSpin(user.id, { kind: "player", playerId: player.id, rarity: player.rarity, price });

  res.json({ player, rarity: player.rarity, estimatedValue: price * 4, sellPrice: price });
});

router.post("/save", requireAuth, async (req, res) => {
  const pending = takePendingSpin(req.userId!);
  if (!pending || pending.kind !== "player") {
    res.status(400).json({ error: "Нечего сохранять — результат уже обработан" });
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
