export interface PackTheme {
  background: string;
  borderColor: string;
  glow: string;
  colorLight: string;
  colorDark: string;
  badge?: { label: string; tone: "hot" | "free" };
  sparky?: boolean;
}

export const PACK_THEME: Record<string, PackTheme> = {
  starter: {
    background: "linear-gradient(155deg, #16213f 0%, #0b1226 60%, #05070f 100%)",
    borderColor: "rgba(123,154,239,0.45)",
    glow: "0 0 16px rgba(123,154,239,0.22)",
    colorLight: "#7b9aef",
    colorDark: "#1c2c5c",
    badge: { label: "Бесплатно раз в сутки", tone: "free" },
  },
  bronze: {
    background: "linear-gradient(155deg, #2b1b0e 0%, #190f08 60%, #090503 100%)",
    borderColor: "rgba(205,127,50,0.5)",
    glow: "0 0 14px rgba(205,127,50,0.22)",
    colorLight: "#cd7f32",
    colorDark: "#4a2a10",
  },
  silver: {
    background: "linear-gradient(155deg, #2b2e34 0%, #16181c 60%, #08090a 100%)",
    borderColor: "rgba(226,229,235,0.5)",
    glow: "0 0 20px rgba(226,229,235,0.25)",
    colorLight: "#e6e8ec",
    colorDark: "#6c7178",
    badge: { label: "Хит продаж", tone: "hot" },
  },
  gold: {
    background: "linear-gradient(155deg, #2e2206 0%, #1a1304 60%, #080502 100%)",
    borderColor: "rgba(255,209,102,0.55)",
    glow: "0 0 26px rgba(255,209,102,0.3)",
    colorLight: "#ffd166",
    colorDark: "#8a5a06",
  },
  legend: {
    background: "linear-gradient(155deg, #260f42 0%, #150926 60%, #07040f 100%)",
    borderColor: "rgba(178,75,243,0.5)",
    glow: "0 0 30px rgba(178,75,243,0.3)",
    colorLight: "#b24bf3",
    colorDark: "#3b0f72",
    sparky: true,
  },
  icon: {
    background: "linear-gradient(155deg, #350711 0%, #1d040a 60%, #080203 100%)",
    borderColor: "rgba(255,59,92,0.55)",
    glow: "0 0 34px rgba(255,59,92,0.32)",
    colorLight: "#ff3b5c",
    colorDark: "#5c0014",
    sparky: true,
    badge: { label: "Шанс на икону", tone: "hot" },
  },
};
