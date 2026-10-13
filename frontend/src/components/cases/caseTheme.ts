export interface CaseTheme {
  background: string;
  borderColor: string;
  glow: string;
  accent: string;
  badge?: { label: string; tone: "hot" | "jackpot" };
  effect?: "sparky" | "rays" | "neon";
}

export const CASE_THEME: Record<string, CaseTheme> = {
  common: {
    background: "linear-gradient(155deg, #9aa3b2 0%, #5c636f 45%, #2b2f36 100%)",
    borderColor: "#b7bec9",
    glow: "0 0 14px rgba(183,190,201,0.3)",
    accent: "🎰",
  },
  rare: {
    background: "linear-gradient(155deg, #4fd1ff 0%, #1f6fd6 45%, #0b2f73 100%)",
    borderColor: "#5ad1ff",
    glow: "0 0 22px rgba(90,209,255,0.5)",
    accent: "🎲",
    badge: { label: "Шанс x10", tone: "hot" },
    effect: "neon",
  },
  epic: {
    background: "linear-gradient(155deg, #e6cbff 0%, #a85af5 40%, #5618a8 70%, #220a4a 100%)",
    borderColor: "#c07bff",
    glow: "0 0 28px rgba(192,123,255,0.55)",
    accent: "💠",
    badge: { label: "Джекпот", tone: "jackpot" },
    effect: "sparky",
  },
  mythic: {
    background: "linear-gradient(155deg, #fff3cc 0%, #f0c04a 25%, #2a2a2a 55%, #0c0c0c 100%)",
    borderColor: "#ffd166",
    glow: "0 0 36px rgba(255,209,102,0.6)",
    accent: "👑",
    badge: { label: "Джекпот x3", tone: "jackpot" },
    effect: "rays",
  },
};
