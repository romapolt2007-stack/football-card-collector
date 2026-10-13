import { PrismaClient } from "@prisma/client";
import {
  CLUB_COLORS,
  POSITIONS_BY_SLOT,
  generateClubName,
  generatePlayerData,
  randInt,
  pick,
} from "./seedShared.js";

/**
 * Добавляет новые лиги/клубы/игроков, НЕ трогая существующие данные —
 * в отличие от seed.ts это безопасно запускать на проде: там уже могут
 * быть собранные карточки у реальных игроков, а полный ресид их бы удалил.
 * Идемпотентно: лига с уже существующим именем пропускается.
 */
const prisma = new PrismaClient();

const NEW_LEAGUE_DEFS = [
  { name: "Liga Atlântica", clubCount: 16 },
  { name: "Tulpen Liga", clubCount: 16 },
  { name: "Liga Verde-Ouro", clubCount: 16 },
];

async function main() {
  const existingLeagueNames = new Set((await prisma.league.findMany({ select: { name: true } })).map((l) => l.name));
  const maxOrder = (await prisma.league.aggregate({ _max: { order: true } }))._max.order ?? -1;

  const usedClubNames = new Set((await prisma.club.findMany({ select: { name: true } })).map((c) => c.name));

  let nextOrder = maxOrder + 1;
  for (const leagueDef of NEW_LEAGUE_DEFS) {
    if (existingLeagueNames.has(leagueDef.name)) {
      console.log(`Лига "${leagueDef.name}" уже существует — пропускаю`);
      continue;
    }

    const league = await prisma.league.create({
      data: { name: leagueDef.name, order: nextOrder++ },
    });

    for (let i = 0; i < leagueDef.clubCount; i++) {
      const clubName = generateClubName(usedClubNames);
      const [colorPrimary, colorSecondary] = pick(CLUB_COLORS);
      const club = await prisma.club.create({
        data: {
          name: clubName,
          shortName: clubName.slice(0, 3).toUpperCase(),
          colorPrimary,
          colorSecondary,
          leagueId: league.id,
        },
      });

      const squadSize = randInt(6, 8);
      for (let p = 0; p < squadSize; p++) {
        const position = POSITIONS_BY_SLOT[p % POSITIONS_BY_SLOT.length];
        await prisma.player.create({ data: generatePlayerData(position, club.id) });
      }
    }
    console.log(`Лига "${leagueDef.name}" — ${leagueDef.clubCount} клубов добавлено`);
  }

  const totalPlayers = await prisma.player.count();
  const totalClubs = await prisma.club.count();
  const totalLeagues = await prisma.league.count();
  console.log(`Итого: ${totalLeagues} лиг, ${totalClubs} клубов, ${totalPlayers} игроков`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
