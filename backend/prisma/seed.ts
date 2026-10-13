import { PrismaClient, Position, Rarity, Foot } from "@prisma/client";

const prisma = new PrismaClient();

// ──────────────────────────────────────────
// Пулы данных для генерации вымышленных игроков.
// Нации и флаги — настоящие (это просто факт, не брендинг),
// клубы, лиги и имена — полностью придуманные.
// ──────────────────────────────────────────

interface NationPool {
  name: string;
  flag: string;
  firstNames: string[];
  lastNames: string[];
}

const NATIONS: NationPool[] = [
  {
    name: "Англия",
    flag: "🏴",
    firstNames: ["Джейми", "Харри", "Коннор", "Лиам", "Дилан", "Джордан"],
    lastNames: ["Бейкер", "Уолш", "Хьюз", "Диксон", "Прайс", "Коллинз"],
  },
  {
    name: "Бразилия",
    flag: "🇧🇷",
    firstNames: ["Лукас", "Габриэль", "Матеус", "Бруно", "Родриго", "Жоао"],
    lastNames: ["Сильва", "Са", "Коста", "Алвес", "Фариа", "Соуза"],
  },
  {
    name: "Франция",
    flag: "🇫🇷",
    firstNames: ["Антуан", "Люка", "Малик", "Тео", "Юго", "Набиль"],
    lastNames: ["Дюбуа", "Моро", "Фурнье", "Ланглуа", "Бернар", "Симон"],
  },
  {
    name: "Германия",
    flag: "🇩🇪",
    firstNames: ["Лукас", "Финн", "Йонас", "Максимилиан", "Леон", "Феликс"],
    lastNames: ["Вебер", "Шмидт", "Зоммер", "Бауэр", "Хоффманн", "Кёлер"],
  },
  {
    name: "Аргентина",
    flag: "🇦🇷",
    firstNames: ["Матео", "Сантьяго", "Факундо", "Агустин", "Николас", "Томас"],
    lastNames: ["Гонсалес", "Ромеро", "Диас", "Фернандес", "Торрес", "Молина"],
  },
  {
    name: "Испания",
    flag: "🇪🇸",
    firstNames: ["Пабло", "Альваро", "Серхио", "Иван", "Диего", "Маркос"],
    lastNames: ["Гарсия", "Муньос", "Наварро", "Иглесиас", "Кастро", "Домингес"],
  },
  {
    name: "Португалия",
    flag: "🇵🇹",
    firstNames: ["Жоау", "Руй", "Тьягу", "Диогу", "Бруну", "Андре"],
    lastNames: ["Перейра", "Кошта", "Карвалью", "Родригеш", "Маркеш", "Виейра"],
  },
  {
    name: "Нидерланды",
    flag: "🇳🇱",
    firstNames: ["Дейли", "Йерун", "Люк", "Стен", "Рейн", "Коэн"],
    lastNames: ["Де Йонг", "Виссер", "Баккер", "Мейер", "Янссен", "Деккер"],
  },
  {
    name: "Хорватия",
    flag: "🇭🇷",
    firstNames: ["Иван", "Марко", "Лука", "Антонио", "Томислав", "Филип"],
    lastNames: ["Хорват", "Йосипович", "Ковач", "Бабич", "Юрич", "Новак"],
  },
  {
    name: "Нигерия",
    flag: "🇳🇬",
    firstNames: ["Чидубем", "Эммануэль", "Самуэль", "Виктор", "Кельвин", "Исаак"],
    lastNames: ["Оконкво", "Адейеми", "Балогун", "Эзе", "Нвосу", "Ибе"],
  },
  {
    name: "Сенегал",
    flag: "🇸🇳",
    firstNames: ["Мамаду", "Усман", "Ибраима", "Шейх", "Муса", "Садио"],
    lastNames: ["Диоп", "Ндьяй", "Сарр", "Фай", "Гей", "Систе"],
  },
  {
    name: "Япония",
    flag: "🇯🇵",
    firstNames: ["Такуми", "Каору", "Рицу", "Хироки", "Юто", "Шо"],
    lastNames: ["Такахаши", "Ямамото", "Сато", "Ито", "Накамура", "Кобаяши"],
  },
];

const LEAGUE_DEFS = [
  { name: "Crown League", clubCount: 20 },
  { name: "Kaiser Liga", clubCount: 18 },
  { name: "Liga Dorada", clubCount: 20 },
  { name: "Lega Stella", clubCount: 20 },
  { name: "Ligue Royale", clubCount: 18 },
];

const CITY_WORDS = [
  "Норт", "Саут", "Ист", "Вест", "Ривер", "Хилл", "Лейк", "Порт", "Стоун",
  "Бридж", "Фолкон", "Крест", "Вейл", "Харбор", "Мидл", "Ред", "Голд",
  "Силвер", "Кастл", "Форест", "Айрон", "Старлайт", "Сентрал", "Юнион",
  "Роял", "Атлас", "Феникс", "Коув", "Хавен", "Кросс",
];

const CLUB_SUFFIXES = [
  "Юнайтед", "Сити", "Атлетик", "Роверс", "Уондерерс", "Динамо", "Реал",
  "Интер", "Олимпик", "Спортинг", "Юнион", "ФК",
];

const CLUB_COLORS: [string, string][] = [
  ["#1e3a8a", "#f59e0b"],
  ["#991b1b", "#f8fafc"],
  ["#064e3b", "#eab308"],
  ["#312e81", "#38bdf8"],
  ["#7c2d12", "#fde68a"],
  ["#4c0519", "#f472b6"],
  ["#1e1b4b", "#a3e635"],
  ["#0c4a6e", "#fef08a"],
];

const POSITIONS_BY_SLOT: Position[] = [
  Position.GK,
  Position.CB,
  Position.CB,
  Position.LB,
  Position.RB,
  Position.CDM,
  Position.CM,
  Position.CAM,
  Position.LW,
  Position.RW,
  Position.ST,
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Редкость и базовый OVR согласно распределению из ТЗ. */
function rollRarity(): { rarity: Rarity; ovrRange: [number, number] } {
  const roll = Math.random() * 100;
  if (roll < 60) return { rarity: Rarity.BRONZE, ovrRange: [60, 74] };
  if (roll < 85) return { rarity: Rarity.SILVER, ovrRange: [75, 84] };
  if (roll < 97) return { rarity: Rarity.GOLD, ovrRange: [85, 92] };
  if (roll < 99.5) return { rarity: Rarity.LEGEND, ovrRange: [93, 96] };
  return { rarity: Rarity.ICON, ovrRange: [97, 99] };
}

/** Статы с позиционным смещением вокруг overall. */
function rollStats(overall: number, position: Position) {
  const base = (spread: number) => clamp(overall + randInt(-spread, spread), 20, 99);

  const isDefender = ["GK", "CB", "LB", "RB", "CDM"].includes(position);
  const isAttacker = ["LW", "RW", "ST", "CF"].includes(position);

  return {
    pace: base(isAttacker ? 6 : 10),
    shooting: isDefender ? base(18) - 10 : base(8),
    passing: base(10),
    dribbling: isDefender ? base(14) - 6 : base(8),
    defending: isAttacker ? base(18) - 12 : base(8),
    physical: base(9),
  };
}

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
      let clubName = `${pick(CITY_WORDS)} ${pick(CLUB_SUFFIXES)}`;
      while (usedClubNames.has(clubName)) {
        clubName = `${pick(CITY_WORDS)} ${pick(CLUB_SUFFIXES)}`;
      }
      usedClubNames.add(clubName);

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
        const nation = pick(NATIONS);
        const firstName = pick(nation.firstNames);
        const lastName = pick(nation.lastNames);
        const { rarity, ovrRange } = rollRarity();
        const overall = randInt(ovrRange[0], ovrRange[1]);
        const stats = rollStats(overall, position);

        await prisma.player.create({
          data: {
            name: lastName,
            fullName: `${firstName} ${lastName}`,
            nation: nation.name,
            nationFlag: nation.flag,
            position,
            overall,
            ...stats,
            age: randInt(18, 35),
            height: position === Position.GK ? randInt(185, 200) : randInt(168, 195),
            foot: Math.random() < 0.78 ? Foot.RIGHT : Foot.LEFT,
            weakFoot: clamp(randInt(1, 5) + (rarity === Rarity.ICON ? 1 : 0), 1, 5),
            skillMoves: clamp(randInt(1, 5) + (rarity === Rarity.LEGEND || rarity === Rarity.ICON ? 1 : 0), 1, 5),
            rarity,
            clubId: club.id,
          },
        });
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
