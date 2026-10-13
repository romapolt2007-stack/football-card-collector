import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { ensureDailyQuests } from "../lib/quests.js";
import { addXp } from "../lib/xp.js";

const router = Router();

const QUEST_XP_REWARD = 100;

router.get("/", requireAuth, async (req, res) => {
  await ensureDailyQuests(req.userId!);
  const userQuests = await prisma.userQuest.findMany({
    where: { userId: req.userId, expiresAt: { gt: new Date() } },
    include: { quest: true },
    orderBy: { quest: { title: "asc" } },
  });
  res.json({ quests: userQuests });
});

const claimSchema = z.object({ userQuestId: z.string() });

router.post("/claim", requireAuth, async (req, res) => {
  const parsed = claimSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Некорректное тело запроса" });
    return;
  }

  const userQuest = await prisma.userQuest.findUnique({
    where: { id: parsed.data.userQuestId },
    include: { quest: true },
  });
  if (!userQuest || userQuest.userId !== req.userId) {
    res.status(404).json({ error: "Квест не найден" });
    return;
  }
  if (!userQuest.completed) {
    res.status(400).json({ error: "Квест ещё не выполнен" });
    return;
  }
  if (userQuest.claimed) {
    res.status(400).json({ error: "Награда уже получена" });
    return;
  }

  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id: req.userId },
      data: { coins: { increment: userQuest.quest.reward } },
    }),
    prisma.userQuest.update({ where: { id: userQuest.id }, data: { claimed: true } }),
    prisma.transaction.create({
      data: {
        userId: req.userId!,
        type: "QUEST_REWARD",
        amount: userQuest.quest.reward,
        meta: { questCode: userQuest.quest.code },
      },
    }),
  ]);

  const { xp, level } = await addXp(req.userId!, QUEST_XP_REWARD);
  res.json({ coins: user.coins, xp, level });
});

export default router;
