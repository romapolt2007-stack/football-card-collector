import type { Rarity } from "../../types/game";

export interface RarityTheme {
  label: string;
  emoji: string;
  background: string;
  borderColor: string;
  glow: string;
  textColor: string;
  statBg: string;
}

export const RARITY_THEME: Record<Rarity, RarityTheme> = {
  BRONZE: {
    label: "Бронза",
    emoji: "🟤",
    background: "linear-gradient(160deg, #a96a35 0%, #6b3f1c 55%, #37200e 100%)",
    borderColor: "#cd7f32",
    glow: "none",
    textColor: "#fbe8d2",
    statBg: "rgba(0,0,0,0.25)",
  },
  SILVER: {
    label: "Серебро",
    emoji: "⚪",
    background: "linear-gradient(160deg, #e7e9ee 0%, #a7acb6 55%, #585d66 100%)",
    borderColor: "#e6e8ec",
    glow: "0 0 18px rgba(226,229,235,0.35)",
    textColor: "#14151a",
    statBg: "rgba(255,255,255,0.3)",
  },
  GOLD: {
    label: "Золото",
    emoji: "🟡",
    background: "linear-gradient(160deg, #fff1c2 0%, #e3a825 50%, #8a5a06 100%)",
    borderColor: "#ffd166",
    glow: "0 0 24px rgba(255,209,102,0.45)",
    textColor: "#2c1b00",
    statBg: "rgba(0,0,0,0.2)",
  },
  LEGEND: {
    label: "Легенда",
    emoji: "🟣",
    background: "linear-gradient(160deg, #d7b3ff 0%, #8b3df0 50%, #3b0a7a 100%)",
    borderColor: "#b24bf3",
    glow: "0 0 28px rgba(178,75,243,0.55)",
    textColor: "#fdf4ff",
    statBg: "rgba(0,0,0,0.3)",
  },
  ICON: {
    label: "Икона",
    emoji: "🔴",
    background: "linear-gradient(160deg, #ff8fa3 0%, #ff3b5c 45%, #5c0014 100%)",
    borderColor: "#ff3b5c",
    glow: "0 0 32px rgba(255,59,92,0.6)",
    textColor: "#fff5f6",
    statBg: "rgba(0,0,0,0.3)",
  },
};
