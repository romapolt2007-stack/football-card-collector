// Мок-данные для вёрстки экранов (без API) — макет №1 по ТЗ "Номерок-стиль". Лиги/клубы/игроки/
// стадионы теперь реальные (см. MockPreviewApp.tsx) — здесь осталось то, под что в бэкенде пока
// нет данных вообще: баннеры, плитки меню, чипы магазина, плейсхолдер превью до первого спина.

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
