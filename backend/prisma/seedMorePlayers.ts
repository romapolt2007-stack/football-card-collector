import { PrismaClient } from "@prisma/client";
import { POSITIONS_BY_SLOT, generatePlayerData, randInt } from "./seedShared.js";

/**
 * Добирает составы существующих клубов до размера полноценной команды,
 * НЕ трогая уже существующих игроков/карточки — безопасно для прода.
 * Идемпотентно: клуб, уже достигший целевого размера, пропускается,
 * так что повторный запуск ничего не дублирует.
 *
 * Пишем через createMany по одному клубу за раз (а не по игроку) —
 * пуловый коннекшн Neon на проде рвал соединение (P1017) при тысячах
 * последовательных одиночных INSERT; так в разы меньше round-trip'ов
 * и при обрыве на одном клубе теряется максимум один клуб, а не всё.
 */
let prisma = new PrismaClient();

const MIN_SQUAD_SIZE = 22;
const MAX_SQUAD_SIZE = 26;

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
  const clubs = await withRetry(
    () => prisma.club.findMany({ select: { id: true, name: true, _count: { select: { players: true } } } }),
    "Загрузка клубов",
  );

  let totalAdded = 0;
  let clubsTouched = 0;
  for (const club of clubs) {
    const target = randInt(MIN_SQUAD_SIZE, MAX_SQUAD_SIZE);
    const toAdd = target - club._count.players;
    if (toAdd <= 0) continue;

    const data = Array.from({ length: toAdd }, (_, p) =>
      generatePlayerData(POSITIONS_BY_SLOT[p % POSITIONS_BY_SLOT.length], club.id),
    );

    await withRetry(() => prisma.player.createMany({ data }), `Клуб "${club.name}"`);
    totalAdded += toAdd;
    clubsTouched++;
  }

  console.log(`Добавлено игроков: ${totalAdded} (клубов пополнено: ${clubsTouched})`);
  const totalPlayers = await prisma.player.count();
  const totalClubs = await prisma.club.count();
  console.log(`Итого: ${totalClubs} клубов, ${totalPlayers} игроков`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
