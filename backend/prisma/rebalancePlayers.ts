import { PrismaClient } from "@prisma/client";
import { rarityForOverall, rollStats } from "./seedShared.js";

/**
 * Пересчитывает rarity и суб-статы (pace/shooting/...) у УЖЕ существующих
 * игроков под новую формулу из seedShared.ts — overall не трогаем (он уже
 * закреплён в экономике/картах), пересчитываем только то, что из него
 * выводится. Безопасно для прода: ничего не удаляет, только UPDATE.
 *
 * Card.rarity — собственное поле, зафиксированное в момент дропа (не связано
 * live-ссылкой с Player.rarity), так что смена Player.rarity НЕ меняет
 * редкость уже выданных карт — только то, в какой пак-пул игрок попадёт
 * при будущих дропах. Card.quickSellPrice тоже не трогаем (экономика уже
 * выданных карт остаётся как есть).
 *
 * Батчим по клубам (не по одному игроку) — тот же приём, что в
 * seedMorePlayers.ts, чтобы не ловить P1017 от пулера Neon на тысячах
 * последовательных UPDATE.
 */
let prisma = new PrismaClient();

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fn();
    } catch (e) {
      console.error(`${label}: попытка ${attempt} не удалась`, e instanceof Error ? e.message : e);
      if (attempt === 3) throw e;
      await prisma.$disconnect();
      prisma = new PrismaClient();
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw new Error("unreachable");
}

async function main() {
  const clubs = await withRetry(() => prisma.club.findMany({ select: { id: true, name: true } }), "Загрузка клубов");

  let totalUpdated = 0;
  const rarityBefore: Record<string, number> = {};
  const rarityAfter: Record<string, number> = {};

  for (const club of clubs) {
    const players = await withRetry(
      () => prisma.player.findMany({ where: { clubId: club.id }, select: { id: true, overall: true, position: true, rarity: true } }),
      `Загрузка состава ${club.name}`,
    );
    if (players.length === 0) continue;

    await withRetry(
      () =>
        prisma.$transaction(
          players.map((p) => {
            rarityBefore[p.rarity] = (rarityBefore[p.rarity] ?? 0) + 1;
            const newRarity = rarityForOverall(p.overall);
            rarityAfter[newRarity] = (rarityAfter[newRarity] ?? 0) + 1;
            const stats = rollStats(p.overall, p.position);
            return prisma.player.update({ where: { id: p.id }, data: { rarity: newRarity, ...stats } });
          }),
        ),
      `Обновление состава ${club.name}`,
    );
    totalUpdated += players.length;
    console.log(`${club.name}: обновлено ${players.length} игроков (всего ${totalUpdated})`);
  }

  console.log("Редкость ДО:", rarityBefore);
  console.log("Редкость ПОСЛЕ:", rarityAfter);
  console.log(`Готово. Всего обновлено игроков: ${totalUpdated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
