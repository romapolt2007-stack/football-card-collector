import { Position, Rarity, Foot } from "@prisma/client";

// ──────────────────────────────────────────
// Общие пулы данных и генераторы для вымышленных игроков/клубов —
// используются и полным сидом (seed.ts), и точечным добавлением
// новых лиг (seedAdditionalLeagues.ts), чтобы не дублировать логику.
// Нации и флаги — настоящие (это просто факт, не брендинг),
// клубы, лиги и имена — полностью придуманные.
// ──────────────────────────────────────────

export interface NationPool {
  name: string;
  flag: string;
  firstNames: string[];
  lastNames: string[];
}

export const NATIONS: NationPool[] = [
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

export const CITY_WORDS = [
  "Норт", "Саут", "Ист", "Вест", "Ривер", "Хилл", "Лейк", "Порт", "Стоун",
  "Бридж", "Фолкон", "Крест", "Вейл", "Харбор", "Мидл", "Ред", "Голд",
  "Силвер", "Кастл", "Форест", "Айрон", "Старлайт", "Сентрал", "Юнион",
  "Роял", "Атлас", "Феникс", "Коув", "Хавен", "Кросс",
];

export const CLUB_SUFFIXES = [
  "Юнайтед", "Сити", "Атлетик", "Роверс", "Уондерерс", "Динамо", "Реал",
  "Интер", "Олимпик", "Спортинг", "Юнион", "ФК",
];

export const CLUB_COLORS: [string, string][] = [
  ["#1e3a8a", "#f59e0b"],
  ["#991b1b", "#f8fafc"],
  ["#064e3b", "#eab308"],
  ["#312e81", "#38bdf8"],
  ["#7c2d12", "#fde68a"],
  ["#4c0519", "#f472b6"],
  ["#1e1b4b", "#a3e635"],
  ["#0c4a6e", "#fef08a"],
];

export const POSITIONS_BY_SLOT: Position[] = [
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

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Редкость и базовый OVR согласно распределению из ТЗ. */
export function rollRarity(): { rarity: Rarity; ovrRange: [number, number] } {
  const roll = Math.random() * 100;
  if (roll < 60) return { rarity: Rarity.BRONZE, ovrRange: [60, 74] };
  if (roll < 85) return { rarity: Rarity.SILVER, ovrRange: [75, 84] };
  if (roll < 98.3) return { rarity: Rarity.GOLD, ovrRange: [85, 92] };
  if (roll < 99.5) return { rarity: Rarity.LEGEND, ovrRange: [93, 96] };
  return { rarity: Rarity.ICON, ovrRange: [97, 99] };
}

/** Статы с позиционным смещением вокруг overall. */
export function rollStats(overall: number, position: Position) {
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

export function generatePlayerData(position: Position, clubId: string) {
  const nation = pick(NATIONS);
  const firstName = pick(nation.firstNames);
  const lastName = pick(nation.lastNames);
  const { rarity, ovrRange } = rollRarity();
  const overall = randInt(ovrRange[0], ovrRange[1]);
  const stats = rollStats(overall, position);

  return {
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
    clubId,
  };
}

export function generateClubName(usedClubNames: Set<string>): string {
  let clubName = `${pick(CITY_WORDS)} ${pick(CLUB_SUFFIXES)}`;
  while (usedClubNames.has(clubName)) {
    clubName = `${pick(CITY_WORDS)} ${pick(CLUB_SUFFIXES)}`;
  }
  usedClubNames.add(clubName);
  return clubName;
}
