import { PrismaClient } from "@prisma/client";
import { POSITIONS_BY_SLOT, generatePlayerData, randInt } from "./seedShared.js";

/**
 * Добирает составы существующих клубов до размера полноценной команды,
 * НЕ трогая уже существующих игроков/карточки — безопасно для прода.
 * Идемпотентно: клуб, уже достигший целевого размера, пропускается,
 * так что повторный запуск ничего не дублирует.
 */
const prisma = new PrismaClient();

const MIN_SQUAD_SIZE = 22;
const MAX_SQUAD_SIZE = 26;

async function main() {
  const clubs = await prisma.club.findMany({
    select: { id: true, name: true, _count: { select: { players: true } } },
  });

  let totalAdded = 0;
  for (const club of clubs) {
    const target = randInt(MIN_SQUAD_SIZE, MAX_SQUAD_SIZE);
    const toAdd = target - club._count.players;
    if (toAdd <= 0) continue;

    for (let p = 0; p < toAdd; p++) {
      const position = POSITIONS_BY_SLOT[p % POSITIONS_BY_SLOT.length];
      await prisma.player.create({ data: generatePlayerData(position, club.id) });
      totalAdded++;
    }
  }

  console.log(`Добавлено игроков: ${totalAdded}`);
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
