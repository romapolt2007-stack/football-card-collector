import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import {
  BATTLE_PASS_MAX_LEVEL,
  BATTLE_PASS_PREMIUM_COST,
  BATTLE_PASS_XP_PER_LEVEL,
  battlePassLevel,
  rewardFor,
} from "../lib/battlePass.js";
import { drawGuaranteedCard } from "../lib/cardDraw.js";
import { quickSellPrice } from "../lib/cardValue.js";

const router = Router();

router.get("/status", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  const claims = await prisma.battlePassClaim.findMany({ where: { userId: req.userId } });

  res.json({
    xp: user.battlePassXp,
    level: battlePassLevel(user.battlePassXp),
    maxLevel: BATTLE_PASS_MAX_LEVEL,
    xpPerLevel: BATTLE_PASS_XP_PER_LEVEL,
    premium: user.battlePassPremium,
    premiumCost: BATTLE_PASS_PREMIUM_COST,
    claimedFree: claims.filter((c) => c.track === "FREE").map((c) => c.level),
    claimedPremium: claims.filter((c) => c.track === "PREMIUM").map((c) => c.level),
  });
});

router.post("/buy-premium", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  if (user.battlePassPremium) {
    res.status(400).json({ error: "Premium Pass уже куплен" });
    return;
  }
  if (user.coins < BATTLE_PASS_PREMIUM_COST) {
    res.status(400).json({ error: "Недостаточно монет" });
    return;
  }

  const updated = await prisma.$transaction([
    prisma.user.update({
      where: { id: req.userId },
      data: { coins: { decrement: BATTLE_PASS_PREMIUM_COST }, battlePassPremium: true },
    }),
    prisma.transaction.create({
      data: { userId: req.userId!, type: "BATTLE_PASS", amount: -BATTLE_PASS_PREMIUM_COST, meta: { action: "buy_premium" } },
    }),
  ]);

  res.json({ coins: updated[0].coins, premium: true });
});

const claimSchema = z.object({ level: z.number().int().min(1).max(BATTLE_PASS_MAX_LEVEL), track: z.enum(["FREE", "PREMIUM"]) });

router.post("/claim", requireAuth, async (req, res) => {
  const parsed = claimSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректные данные" });
    return;
  }
  const { level, track } = parsed.data;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  if (track === "PREMIUM" && !user.battlePassPremium) {
    res.status(400).json({ error: "Нужен Premium Pass" });
    return;
  }
  if (battlePassLevel(user.battlePassXp) < level) {
    res.status(400).json({ error: "Уровень ещё не достигнут" });
    return;
  }

  const already = await prisma.battlePassClaim.findUnique({
    where: { userId_level_track: { userId: req.userId!, level, track } },
  });
  if (already) {
    res.status(400).json({ error: "Награда уже получена" });
    return;
  }

  const reward = rewardFor(level, track);

  let grantedCard = null;
  if (reward.guaranteedRarity) {
    const drawn = await drawGuaranteedCard(reward.guaranteedRarity);
    if (drawn) {
      grantedCard = await prisma.card.create({
        data: {
          playerId: drawn.player.id,
          ownerId: req.userId!,
          rarity: drawn.rarity,
          quickSellPrice: quickSellPrice(drawn.rarity, drawn.player.overall),
        },
        include: { player: { include: { club: { include: { league: true } } } } },
      });
    }
  }

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({ where: { id: req.userId }, data: { coins: { increment: reward.coins } } }),
    prisma.transaction.create({
      data: { userId: req.userId!, type: "BATTLE_PASS", amount: reward.coins, meta: { level, track, grantedCardId: grantedCard?.id ?? null } },
    }),
    prisma.battlePassClaim.create({ data: { userId: req.userId!, level, track } }),
  ]);

  res.json({ coins: updatedUser.coins, rewardCoins: reward.coins, grantedCard });
});

export default router;
