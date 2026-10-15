import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { addXp } from "../lib/xp.js";
import {
  FREE_BONUS_INTERVAL_MS,
  msUntilFreeBonusReady,
  rollFreeBonusCoinsAmount,
  rollFreeBonusPrizeType,
} from "../lib/freeBonus.js";
import {
  EMERGENCY_BONUS_COINS_THRESHOLD,
  EMERGENCY_BONUS_INTERVAL_MS,
  EMERGENCY_BONUS_REWARD,
  msUntilEmergencyBonusReady,
} from "../lib/emergencyBonus.js";
import { drawPackCards } from "../lib/cardDraw.js";
import { quickSellPrice } from "../lib/cardValue.js";
import { settleEnergy } from "../lib/energy.js";
import { grantReferralBonus } from "../lib/referral.js";
import { tierFor } from "../lib/penaltyStats.js";
import type { Rarity } from "@prisma/client";

const router = Router();

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    res.status(404).json({ error: "Пользователь не найден" });
    return;
  }
  const { energy, energyUpdatedAt } = await settleEnergy(req.userId!);
  res.json({ user: { ...user, energy, energyUpdatedAt } });
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

const AVATAR_PRESETS = ["⚽", "🧤", "🦁", "🐺", "🦅", "🔱", "⚡", "🛡️", "👑", "🔥", "⭐", "🎯"];

const avatarSchema = z.object({ icon: z.enum(AVATAR_PRESETS as [string, ...string[]]) });

router.post("/avatar", requireAuth, async (req, res) => {
  const parsed = avatarSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректная иконка аватара" });
    return;
  }
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { avatarIcon: parsed.data.icon },
  });
  res.json({ user });
});

function utcDay(date: Date): number {
  return Math.floor(date.getTime() / 86_400_000); // целые UTC-сутки от эпохи
}

const DAILY_XP_REWARD = 50;
const STREAK_INSURANCE_COST = 50;

router.post("/daily-claim", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  const now = new Date();
  const today = utcDay(now);

  if (user.lastDailyClaimAt && utcDay(user.lastDailyClaimAt) === today) {
    res.status(400).json({ error: "Бонус за сегодня уже получен" });
    return;
  }

  const missedOneDay = user.lastDailyClaimAt && utcDay(user.lastDailyClaimAt) === today - 2;
  const wasInsured = missedOneDay && user.streakInsuredAt && utcDay(user.streakInsuredAt) >= today - 2;
  const wasConsecutive = (user.lastDailyClaimAt && utcDay(user.lastDailyClaimAt) === today - 1) || wasInsured;
  const streak = wasConsecutive ? (user.dailyStreak % 7) + 1 : 1;
  const reward = 300 * streak * (streak === 7 ? 3 : 1);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { coins: { increment: reward }, dailyStreak: streak, lastDailyClaimAt: now, streakInsuredAt: null },
    }),
    prisma.transaction.create({
      data: { userId: user.id, type: "DAILY_BONUS", amount: reward, meta: { streak, wasInsured: Boolean(wasInsured) } },
    }),
  ]);

  const { xp, level, coins, levelUpReward } = await addXp(user.id, DAILY_XP_REWARD);
  res.json({ coins, streak, reward, xp, level, levelUpReward });
});

// "Окно спасения" стрика: пропустили ровно 1 день — до следующего клейма можно
// заплатить вместо сброса стрика на День 1 (см. Блок 1 ГДД — DailyBonusRoadmap уже
// существует, это расширение, а не новая механика).
router.get("/streak/status", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  const today = utcDay(new Date());
  const missedOneDay = Boolean(user.lastDailyClaimAt && utcDay(user.lastDailyClaimAt) === today - 2);
  const alreadyInsured = Boolean(user.streakInsuredAt && utcDay(user.streakInsuredAt) >= today - 2);
  res.json({
    canInsure: missedOneDay && !alreadyInsured,
    alreadyInsured,
    cost: STREAK_INSURANCE_COST,
    streak: user.dailyStreak,
  });
});

router.post("/streak/insure", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  const today = utcDay(new Date());
  const missedOneDay = user.lastDailyClaimAt && utcDay(user.lastDailyClaimAt) === today - 2;

  if (!missedOneDay) {
    res.status(400).json({ error: "Страховка стрика сейчас недоступна" });
    return;
  }
  if (user.streakInsuredAt && utcDay(user.streakInsuredAt) >= today - 2) {
    res.status(400).json({ error: "Стрик уже застрахован" });
    return;
  }
  if (user.coins < STREAK_INSURANCE_COST) {
    res.status(400).json({ error: "Недостаточно монет" });
    return;
  }

  const updated = await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { coins: { decrement: STREAK_INSURANCE_COST }, streakInsuredAt: new Date() },
    }),
    prisma.transaction.create({
      data: { userId: user.id, type: "DAILY_BONUS", amount: -STREAK_INSURANCE_COST, meta: { action: "streak_insure" } },
    }),
  ]);

  res.json({ coins: updated[0].coins, insured: true });
});

router.get("/free-bonus", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  const msLeft = msUntilFreeBonusReady(user.lastFreeBonusAt);
  res.json({ ready: msLeft === 0, msLeft, intervalMs: FREE_BONUS_INTERVAL_MS });
});

router.post("/free-bonus", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  const msLeft = msUntilFreeBonusReady(user.lastFreeBonusAt);
  if (msLeft > 0) {
    res.status(400).json({ error: "Бонус ещё не готов", msLeft });
    return;
  }

  const now = new Date();
  const prizeType = rollFreeBonusPrizeType();

  let coins = 0;
  let drawn: Awaited<ReturnType<typeof drawPackCards>> = [];
  if (prizeType === "COINS") {
    coins = rollFreeBonusCoinsAmount();
  } else if (prizeType === "CARD") {
    drawn = await drawPackCards(1, "BRONZE" as Rarity, 0);
  } else {
    drawn = await drawPackCards(3, "BRONZE" as Rarity, 0); // мини-пак
  }

  const { updatedUser, cards } = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: { coins: { increment: coins }, lastFreeBonusAt: now },
    });
    await tx.transaction.create({
      data: { userId: user.id, type: "FREE_BONUS", amount: coins, meta: { prizeType } },
    });

    const cards = [];
    for (const d of drawn) {
      const card = await tx.card.create({
        data: {
          playerId: d.player.id,
          ownerId: user.id,
          rarity: d.rarity,
          quickSellPrice: quickSellPrice(d.rarity, d.player),
        },
        include: { player: { include: { club: { include: { league: true } } } } },
      });
      cards.push(card);
    }

    return { updatedUser, cards };
  });

  res.json({
    coins: updatedUser.coins,
    prize: { type: prizeType, coins, cards },
    intervalMs: FREE_BONUS_INTERVAL_MS,
  });
});

router.get("/emergency-bonus", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  const eligible = user.coins < EMERGENCY_BONUS_COINS_THRESHOLD;
  const msLeft = msUntilEmergencyBonusReady(user.lastEmergencyBonusAt);
  res.json({
    eligible,
    ready: eligible && msLeft === 0,
    msLeft,
    intervalMs: EMERGENCY_BONUS_INTERVAL_MS,
    threshold: EMERGENCY_BONUS_COINS_THRESHOLD,
    reward: EMERGENCY_BONUS_REWARD,
  });
});

router.post("/emergency-bonus", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  if (user.coins >= EMERGENCY_BONUS_COINS_THRESHOLD) {
    res.status(400).json({ error: "Бонус доступен только когда монет почти нет" });
    return;
  }
  const msLeft = msUntilEmergencyBonusReady(user.lastEmergencyBonusAt);
  if (msLeft > 0) {
    res.status(400).json({ error: "Бонус ещё не готов", msLeft });
    return;
  }

  const now = new Date();
  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { coins: { increment: EMERGENCY_BONUS_REWARD }, lastEmergencyBonusAt: now },
    }),
    prisma.transaction.create({
      data: { userId: user.id, type: "EMERGENCY_BONUS", amount: EMERGENCY_BONUS_REWARD },
    }),
  ]);

  res.json({ coins: updatedUser.coins, reward: EMERGENCY_BONUS_REWARD, intervalMs: EMERGENCY_BONUS_INTERVAL_MS });
});

const applyReferralSchema = z.object({ code: z.string().min(1) });

router.post("/apply-referral", requireAuth, async (req, res) => {
  const parsed = applyReferralSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректный код" });
    return;
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  if (user.referredBy) {
    res.status(400).json({ error: "Код приглашения уже применён" });
    return;
  }

  const referrer = await prisma.user.findUnique({ where: { referralCode: parsed.data.code.trim() } });
  if (!referrer) {
    res.status(404).json({ error: "Код не найден" });
    return;
  }
  if (referrer.id === user.id) {
    res.status(400).json({ error: "Нельзя использовать собственный код" });
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { referredBy: referrer.id } });
    await grantReferralBonus(tx, referrer.id, user.id);
  });

  res.json({ applied: true });
});

router.get("/referrals", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  const [invitedCount, earnings] = await Promise.all([
    prisma.user.count({ where: { referredBy: req.userId } }),
    prisma.transaction.aggregate({
      where: { userId: req.userId, type: "REFERRAL_BONUS" },
      _sum: { amount: true },
    }),
  ]);

  res.json({
    referralCode: user.referralCode,
    invitedCount,
    totalEarned: earnings._sum.amount ?? 0,
  });
});

interface MatchEventLike {
  type: string;
  team: "user" | "opponent";
}

router.get("/stats", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });

  const matches = await prisma.match.findMany({
    where: { userId: req.userId },
    select: { userScore: true, oppScore: true, events: true, rewards: true },
  });

  let wins = 0;
  let totalGoals = 0;
  for (const m of matches) {
    const rewards = m.rewards as { shootout?: { won?: boolean } } | null;
    const won = rewards?.shootout ? Boolean(rewards.shootout.won) : m.userScore > m.oppScore;
    if (won) wins++;
    const events = (m.events as unknown as MatchEventLike[]) ?? [];
    totalGoals += events.filter((e) => e.type === "GOAL" && e.team === "user").length;
  }
  const totalMatches = matches.length;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  const cards = await prisma.card.findMany({
    where: { ownerId: req.userId },
    include: { player: { include: { club: { include: { league: true } } } } },
    orderBy: { player: { overall: "desc" } },
    take: 1,
  });
  const bestCard = cards[0] ?? null;

  const totalCards = await prisma.card.count({ where: { ownerId: req.userId } });

  const activeSquad = await prisma.squad.findFirst({ where: { userId: req.userId, isActive: true } });
  let squadValue = 0;
  if (activeSquad) {
    const slots = activeSquad.slots as unknown as { cardId: string | null }[];
    const cardIds = slots.map((s) => s.cardId).filter((id): id is string => Boolean(id));
    const squadCards = await prisma.card.findMany({ where: { id: { in: cardIds } }, select: { quickSellPrice: true } });
    squadValue = squadCards.reduce((sum, c) => sum + c.quickSellPrice, 0);
  }

  const marketSales = await prisma.transaction.count({ where: { userId: req.userId, type: "MARKET_SELL" } });

  const daysPlayed = Math.floor((Date.now() - user.createdAt.getTime()) / 86_400_000);

  res.json({
    totalMatches,
    wins,
    winRate,
    totalGoals,
    totalCards,
    squadValue,
    marketSales,
    daysPlayed,
    bestCard,
    penaltyGoals: user.penaltyGoals,
    penaltySaves: user.penaltySaves,
    penaltySniperTier: tierFor(user.penaltyGoals),
    penaltyWallTier: tierFor(user.penaltySaves),
  });
});

export default router;
