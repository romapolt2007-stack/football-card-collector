import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { addXp } from "../lib/xp.js";

const router = Router();

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    res.status(404).json({ error: "Пользователь не найден" });
    return;
  }
  res.json({ user });
});

const teamProfileSchema = z.object({
  teamName: z.string().min(1).max(30),
  teamLogo: z.string().max(10).optional(), // эмодзи-лого
  teamColors: z.string().max(40).optional(), // "#1e3a8a,#f59e0b"
});

router.post("/team", requireAuth, async (req, res) => {
  const parsed = teamProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректное тело запроса" });
    return;
  }

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: parsed.data,
  });
  res.json({ user });
});

function utcDay(date: Date): number {
  return Math.floor(date.getTime() / 86_400_000); // целые UTC-сутки от эпохи
}

const DAILY_XP_REWARD = 50;

router.post("/daily-claim", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  const now = new Date();
  const today = utcDay(now);

  if (user.lastDailyClaimAt && utcDay(user.lastDailyClaimAt) === today) {
    res.status(400).json({ error: "Бонус за сегодня уже получен" });
    return;
  }

  const wasConsecutive = user.lastDailyClaimAt && utcDay(user.lastDailyClaimAt) === today - 1;
  const streak = wasConsecutive ? (user.dailyStreak % 7) + 1 : 1;
  const reward = 300 * streak * (streak === 7 ? 3 : 1);

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { coins: { increment: reward }, dailyStreak: streak, lastDailyClaimAt: now },
    }),
    prisma.transaction.create({
      data: { userId: user.id, type: "DAILY_BONUS", amount: reward, meta: { streak } },
    }),
  ]);

  const { xp, level } = await addXp(user.id, DAILY_XP_REWARD);
  res.json({ coins: updatedUser.coins, streak, reward, xp, level });
});

export default router;
