import { PrismaClient } from "@prisma/client";
import {
  CLUB_COLORS,
  POSITIONS_BY_SLOT,
  generateClubName,
  generatePlayerData,
  randInt,
  pick,
} from "./seedShared.js";

const prisma = new PrismaClient();

const LEAGUE_DEFS = [
  { name: "Crown League", clubCount: 20 },
  { name: "Kaiser Liga", clubCount: 18 },
  { name: "Liga Dorada", clubCount: 20 },
  { name: "Lega Stella", clubCount: 20 },
  { name: "Ligue Royale", clubCount: 18 },
  { name: "Liga Atlântica", clubCount: 16 },
  { name: "Tulpen Liga", clubCount: 16 },
  { name: "Liga Verde-Ouro", clubCount: 16 },
];

async function main() {
  console.log("Очищаю старые данные...");
  await prisma.card.deleteMany();
  await prisma.player.deleteMany();
  await prisma.club.deleteMany();
  await prisma.league.deleteMany();
  await prisma.quest.deleteMany();

  const usedClubNames = new Set<string>();

  for (const [leagueOrder, leagueDef] of LEAGUE_DEFS.entries()) {
    const league = await prisma.league.create({
      data: { name: leagueDef.name, order: leagueOrder },
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
    console.log(`Лига "${leagueDef.name}" — ${leagueDef.clubCount} клубов готово`);
  }

  const totalPlayers = await prisma.player.count();
  console.log(`Всего игроков: ${totalPlayers}`);

  console.log("Сею ежедневные квесты...");
  await prisma.quest.createMany({
    data: [
      { code: "OPEN_PACK", title: "Открой 1 пак", description: "Открой любой пак", target: 1, reward: 500 },
      { code: "PLAY_MATCH", title: "Сыграй 3 матча", description: "Сыграй 3 матча в любом режиме", target: 3, reward: 800 },
      { code: "WIN_MATCH", title: "Победи в матче", description: "Выиграй 1 матч", target: 1, reward: 1000 },
      { code: "SELL_CARD", title: "Продай карточку", description: "Выставь карточку на рынок", target: 1, reward: 300 },
      { code: "LOGIN_STREAK", title: "Зайди в игру", description: "Ежедневный вход", target: 1, reward: 200 },
    ],
  });

  console.log("Готово.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
