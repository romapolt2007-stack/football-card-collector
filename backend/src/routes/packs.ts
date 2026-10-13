import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { PACKS, findPack } from "../lib/packs.js";
import { drawPackCards } from "../lib/cardDraw.js";
import { quickSellPrice } from "../lib/cardValue.js";
import { incrementQuestProgress } from "../lib/quests.js";
import { addXp } from "../lib/xp.js";

const PACK_OPEN_XP = 20;

const router = Router();

router.get("/", (_req, res) => {
  res.json({ packs: PACKS });
});

const openSchema = z.object({ packId: z.string() });

router.post("/open", requireAuth, async (req, res) => {
  const parsed = openSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректное тело запроса" });
    return;
  }

  const pack = findPack(parsed.data.packId);
  if (!pack) {
    res.status(404).json({ error: "Пак не найден" });
    return;
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });

  if (pack.isStarter && user.hasClaimedStarter) {
    res.status(400).json({ error: "Starter Pack уже был получен" });
    return;
  }
  if (!pack.isStarter && user.coins < pack.priceCoins) {
    res.status(400).json({ error: "Недостаточно монет" });
    return;
  }

  const drawn = await drawPackCards(pack.cardCount, pack.minRarity, pack.bonusChance);
  if (drawn.length === 0) {
    res.status(500).json({ error: "Не удалось сформировать пак — пустая база игроков" });
    return;
  }

  const { updatedUser, cards } = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: {
        coins: pack.isStarter ? undefined : { decrement: pack.priceCoins },
        hasClaimedStarter: pack.isStarter ? true : undefined,
      },
    });

    await tx.transaction.create({
      data: {
        userId: user.id,
        type: "PACK_OPEN",
        amount: -pack.priceCoins,
        meta: { packId: pack.id },
      },
    });

    const cards = [];
    for (const d of drawn) {
      const card = await tx.card.create({
        data: {
          playerId: d.player.id,
          ownerId: user.id,
          rarity: d.rarity,
          quickSellPrice: quickSellPrice(d.rarity, d.player.overall),
        },
        include: { player: { include: { club: { include: { league: true } } } } },
      });
      cards.push(card);
    }

    return { updatedUser, cards };
  });

  await incrementQuestProgress(user.id, "OPEN_PACK");
  const { xp, level } = await addXp(user.id, PACK_OPEN_XP);

  res.json({ cards, coins: updatedUser.coins, xp, level });
});

export default router;
