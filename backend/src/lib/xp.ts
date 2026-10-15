import { prisma } from "./prisma.js";

/** XP, необходимый суммарно для достижения уровня N: 500 * N(N+1)/2 (нарастающий шаг). */
export function levelForXp(xp: number): number {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
}

export function xpForLevel(level: number): number {
  return 500 * ((level - 1) * level) / 2;
}

/** Награда монетами за новый уровень — скромная, но настоящая (не просто текст в UI). */
export function levelUpReward(level: number): number {
  return level * 200;
}

export async function addXp(userId: string, amount: number) {
  const user = await prisma.user.update({
    where: { id: userId },
    // Battle Pass XP растёт синхронно с обычным XP — один источник прогресса
    // для всех игровых действий, без необходимости трогать каждый route отдельно.
    data: { xp: { increment: amount }, battlePassXp: { increment: amount } },
  });
  const newLevel = levelForXp(user.xp);

  if (newLevel === user.level) {
    return { xp: user.xp, level: newLevel, coins: user.coins, levelUpReward: 0 };
  }

  let coins = user.coins;
  let totalReward = 0;
  for (let lvl = user.level + 1; lvl <= newLevel; lvl++) totalReward += levelUpReward(lvl);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { level: newLevel, coins: { increment: totalReward } },
  });
  coins = updated.coins;

  await prisma.transaction.create({
    data: { userId, type: "LEVEL_UP", amount: totalReward, meta: { newLevel } },
  });

  return { xp: user.xp, level: newLevel, coins, levelUpReward: totalReward };
}
