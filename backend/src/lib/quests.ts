import { prisma } from "./prisma.js";

function endOfToday(): Date {
  const d = new Date();
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

const DAILY_QUEST_COUNT = 3;

/** Гарантирует, что у пользователя есть активный набор из 3 ежедневных квестов. */
export async function ensureDailyQuests(userId: string) {
  const active = await prisma.userQuest.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
  });
  if (active.length > 0) return;

  const allQuests = await prisma.quest.findMany({ where: { isDaily: true } });
  const shuffled = [...allQuests].sort(() => Math.random() - 0.5).slice(0, DAILY_QUEST_COUNT);

  await prisma.userQuest.createMany({
    data: shuffled.map((q) => ({
      userId,
      questId: q.id,
      expiresAt: endOfToday(),
    })),
  });
}

/** Продвигает прогресс активного квеста пользователя по коду, если такой назначен сегодня. */
export async function incrementQuestProgress(userId: string, code: string, amount = 1) {
  const quest = await prisma.quest.findUnique({ where: { code } });
  if (!quest) return;

  const userQuest = await prisma.userQuest.findFirst({
    where: { userId, questId: quest.id, expiresAt: { gt: new Date() }, completed: false },
  });
  if (!userQuest) return;

  const progress = Math.min(quest.target, userQuest.progress + amount);
  await prisma.userQuest.update({
    where: { id: userQuest.id },
    data: { progress, completed: progress >= quest.target },
  });
}
