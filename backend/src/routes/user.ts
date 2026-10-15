import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  res.json({ user });
});

const avatarSchema = z.object({ avatarIcon: z.string().max(16) });

router.post("/avatar", requireAuth, async (req, res) => {
  const parsed = avatarSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректное тело запроса" });
    return;
  }

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { avatarIcon: parsed.data.avatarIcon },
  });
  res.json({ user });
});

const DAILY_COOLDOWN_MS = 20 * 60 * 60 * 1000; // можно забрать раз в 20ч (не строго раз в сутки — прощает немного сдвинутый график)
const DAILY_STREAK_RESET_MS = 48 * 60 * 60 * 1000; // пропуск больше 2 суток — стрик сбрасывается
const DAILY_BASE_REWARD = 500;
const DAILY_STREAK_BONUS = 150;
const DAILY_STREAK_CAP = 7;

router.get("/daily-status", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  const ready = !user.lastDailyClaimAt || Date.now() - user.lastDailyClaimAt.getTime() >= DAILY_COOLDOWN_MS;
  res.json({ ready, streak: user.dailyStreak });
});

router.post("/daily-claim", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });

  const ready = !user.lastDailyClaimAt || Date.now() - user.lastDailyClaimAt.getTime() >= DAILY_COOLDOWN_MS;
  if (!ready) {
    res.status(400).json({ error: "Бонус уже забран — приходи позже" });
    return;
  }

  const streakBroken = user.lastDailyClaimAt ? Date.now() - user.lastDailyClaimAt.getTime() > DAILY_STREAK_RESET_MS : false;
  const newStreak = streakBroken || !user.lastDailyClaimAt ? 1 : Math.min(DAILY_STREAK_CAP, user.dailyStreak + 1);
  const reward = DAILY_BASE_REWARD + (newStreak - 1) * DAILY_STREAK_BONUS;

  const [updated] = await prisma.$transaction([
    prisma.user.update({
      where: { id: req.userId },
      data: { coins: { increment: reward }, dailyStreak: newStreak, lastDailyClaimAt: new Date() },
    }),
    prisma.transaction.create({
      data: { userId: req.userId!, type: "DAILY_BONUS", amount: reward, meta: { streak: newStreak } },
    }),
  ]);

  res.json({ coins: updated.coins, streak: updated.dailyStreak, reward });
});

export default router;
