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

/**
 * OVR — сглаженное (не кусочно-плоское по редкости) распределение: среднее
 * двух равномерных роллов даёт треугольную форму вместо резких "ступенек"
 * плотности на границах редкости. Редкость — чистая функция от итогового
 * overall (никакого отдельного рандома), поэтому она растёт ровно вместе
 * с рейтингом, а не скачком на границе 84->85 как раньше.
 * Эмпирически (N=50000): Бронза ~50%, Серебро ~30%, Золото ~16%,
 * Легенда ~4%, Икона ~0.8% — плавно убывающая кривая.
 */
export function rollOverall(): number {
  const r = (Math.random() + Math.random()) / 2;
  return clamp(Math.round(44 + r * 55), 40, 99);
}

export function rarityForOverall(overall: number): Rarity {
  if (overall < 72) return Rarity.BRONZE;
  if (overall < 82) return Rarity.SILVER;
  if (overall < 91) return Rarity.GOLD;
  if (overall < 96) return Rarity.LEGEND;
  return Rarity.ICON;
}

/**
 * Статы — профиль множителей по позиции, в сумме дающий среднее 1.0, поэтому
 * среднее 6 суб-статов стремится к overall (а не уходит в произвольную
 * сторону, как при независимом рандоме каждого стата). Внутри — небольшой
 * джиттер для живого разброса между игроками одной позиции и рейтинга.
 */
const STAT_PROFILES: Record<Position, Record<"pace" | "shooting" | "passing" | "dribbling" | "defending" | "physical", number>> = {
  GK: { pace: 0.75, shooting: 0.5, passing: 1.0, dribbling: 0.75, defending: 1.55, physical: 1.45 },
  CB: { pace: 0.85, shooting: 0.6, passing: 0.95, dribbling: 0.75, defending: 1.55, physical: 1.3 },
  LB: { pace: 1.15, shooting: 0.7, passing: 1.05, dribbling: 1.05, defending: 1.25, physical: 0.8 },
  RB: { pace: 1.15, shooting: 0.7, passing: 1.05, dribbling: 1.05, defending: 1.25, physical: 0.8 },
  CDM: { pace: 0.9, shooting: 0.75, passing: 1.15, dribbling: 0.9, defending: 1.35, physical: 0.95 },
  CM: { pace: 1.0, shooting: 0.95, passing: 1.2, dribbling: 1.15, defending: 0.95, physical: 0.75 },
  CAM: { pace: 1.05, shooting: 1.15, passing: 1.25, dribbling: 1.25, defending: 0.55, physical: 0.75 },
  LW: { pace: 1.3, shooting: 1.1, passing: 1.05, dribbling: 1.3, defending: 0.5, physical: 0.75 },
  RW: { pace: 1.3, shooting: 1.1, passing: 1.05, dribbling: 1.3, defending: 0.5, physical: 0.75 },
  ST: { pace: 1.15, shooting: 1.4, passing: 0.85, dribbling: 1.1, defending: 0.45, physical: 1.05 },
  CF: { pace: 1.15, shooting: 1.4, passing: 0.85, dribbling: 1.1, defending: 0.45, physical: 1.05 },
};

export function rollStats(overall: number, position: Position) {
  const profile = STAT_PROFILES[position];
  const jitter = () => randInt(-4, 4);
  const stat = (mult: number) => clamp(Math.round(overall * mult) + jitter(), 20, 99);

  return {
    pace: stat(profile.pace),
    shooting: stat(profile.shooting),
    passing: stat(profile.passing),
    dribbling: stat(profile.dribbling),
    defending: stat(profile.defending),
    physical: stat(profile.physical),
  };
}

export function generatePlayerData(position: Position, clubId: string) {
  const nation = pick(NATIONS);
  const firstName = pick(nation.firstNames);
  const lastName = pick(nation.lastNames);
  const overall = rollOverall();
  const rarity = rarityForOverall(overall);
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
