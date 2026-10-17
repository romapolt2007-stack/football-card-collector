// Мок-данные для вёрстки экранов (без API) — макет №1 по ТЗ "Номерок-стиль".

export interface MockLeague {
  id: string;
  name: string;
  flag: string;
}

export interface MockClub {
  id: string;
  leagueId: string;
  name: string;
  shortName: string;
  colorPrimary: string;
  colorSecondary: string;
  playerCount: number;
  stadiumCapacity: number;
  spinPriceMultiplier: number;
}

export const MOCK_LEAGUES: MockLeague[] = [
  { id: "eng", name: "Англия", flag: "🏴" },
  { id: "esp", name: "Испания", flag: "🇪🇸" },
  { id: "ita", name: "Италия", flag: "🇮🇹" },
  { id: "ger", name: "Германия", flag: "🇩🇪" },
  { id: "fra", name: "Франция", flag: "🇫🇷" },
  { id: "all", name: "Все лиги", flag: "🌍" },
];

export const MOCK_CLUBS: MockClub[] = [
  { id: "ars", leagueId: "eng", name: "Арсенал", shortName: "ARS", colorPrimary: "#EF0107", colorSecondary: "#FFFFFF", playerCount: 28, stadiumCapacity: 60704, spinPriceMultiplier: 3 },
  { id: "liv", leagueId: "eng", name: "Ливерпуль", shortName: "LIV", colorPrimary: "#C8102E", colorSecondary: "#F6EB61", playerCount: 27, stadiumCapacity: 61276, spinPriceMultiplier: 3 },
  { id: "mci", leagueId: "eng", name: "Манчестер Сити", shortName: "MCI", colorPrimary: "#6CABDD", colorSecondary: "#1C2C5B", playerCount: 26, stadiumCapacity: 53400, spinPriceMultiplier: 3 },
  { id: "rma", leagueId: "esp", name: "Реал Мадрид", shortName: "RMA", colorPrimary: "#FEBE10", colorSecondary: "#1A2574", playerCount: 25, stadiumCapacity: 81044, spinPriceMultiplier: 3 },
  { id: "bar", leagueId: "esp", name: "Барселона", shortName: "BAR", colorPrimary: "#A50044", colorSecondary: "#004D98", playerCount: 26, stadiumCapacity: 99354, spinPriceMultiplier: 3 },
  { id: "juv", leagueId: "ita", name: "Ювентус", shortName: "JUV", colorPrimary: "#000000", colorSecondary: "#FFFFFF", playerCount: 25, stadiumCapacity: 41507, spinPriceMultiplier: 3 },
  { id: "bay", leagueId: "ger", name: "Бавария", shortName: "BAY", colorPrimary: "#DC052D", colorSecondary: "#0066B2", playerCount: 24, stadiumCapacity: 75024, spinPriceMultiplier: 3 },
  { id: "psg", leagueId: "fra", name: "ПСЖ", shortName: "PSG", colorPrimary: "#004170", colorSecondary: "#DA291C", playerCount: 24, stadiumCapacity: 47929, spinPriceMultiplier: 3 },
];

export const MOCK_ANY_CLUB_PRICE_MULTIPLIER = 1;
export const MOCK_ALL_LEAGUES_PRICE_MULTIPLIER = 0.7;

export const MOCK_PROFILE = {
  level: 2,
  xp: 17,
  xpToNext: 50,
  luck: 81,
  coins: 99_023,
};

export const MOCK_BANNERS = [
  { id: "quest", kind: "quest" as const, title: "🍀 Удача x10 БЕСПЛАТНО", subtitle: "🎁 Задание · Удача x10 на 1 час" },
  { id: "ad", kind: "ad" as const, title: "Футбольный VPN с обходом блокировок", subtitle: "РЕКЛАМА" },
];

export const MOCK_MENU_TILES = [
  { id: "collection", label: "Коллекция", color: "#2DD4BF", icon: "cards" as const, badge: false },
  { id: "stadiums", label: "Стадионы", color: "#38BDF8", icon: "stadium" as const, badge: false },
  { id: "market", label: "Рынок", color: "#E11D8F", icon: "market" as const, badge: false },
  { id: "rating", label: "Рейтинг", color: "#FACC15", icon: "trophy" as const, badge: false },
  { id: "quests", label: "Задания", color: "#2DD4BF", icon: "list" as const, badge: true },
  { id: "wheel", label: "Колесо", color: "#FACC15", icon: "wheel" as const, badge: true },
  { id: "friends", label: "Друзья", color: "#38BDF8", icon: "friends" as const, badge: true },
  { id: "gift", label: "Подарок", color: "#E11D8F", icon: "gift" as const, badge: true },
];

export const MOCK_SHOP_CHIPS = ["👑 VIP", "🍀 Удача", "🎴 Паки", "🎁 Наборы", "🪙 Монеты"];

export interface MockPreviewPlayer {
  position: string;
  club: string;
  leagueFlag: string;
}

export const MOCK_PREVIEW_PLAYER: MockPreviewPlayer = {
  position: "ST",
  club: "Арсенал",
  leagueFlag: "🏴",
};
