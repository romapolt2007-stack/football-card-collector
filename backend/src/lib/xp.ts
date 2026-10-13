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

export async function addXp(userId: string, amount: number) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: amount } },
  });
  const newLevel = levelForXp(user.xp);
  if (newLevel !== user.level) {
    await prisma.user.update({ where: { id: userId }, data: { level: newLevel } });
  }
  return { xp: user.xp, level: newLevel };
}
