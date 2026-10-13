export interface PackTheme {
  background: string;
  borderColor: string;
  glow: string;
  accent: string;
  badge?: { label: string; tone: "hot" | "free" };
  sparky?: boolean;
}

export const PACK_THEME: Record<string, PackTheme> = {
  starter: {
    background: "linear-gradient(155deg, #4d6dc2 0%, #26407f 55%, #101b3d 100%)",
    borderColor: "#7b9aef",
    glow: "0 0 16px rgba(123,154,239,0.35)",
    accent: "🔷",
    badge: { label: "Бесплатно раз в сутки", tone: "free" },
  },
  bronze: {
    background: "linear-gradient(155deg, #b17a46 0%, #7a4a26 45%, #3b2110 100%)",
    borderColor: "#cd7f32",
    glow: "0 0 14px rgba(205,127,50,0.3)",
    accent: "🥉",
  },
  silver: {
    background: "linear-gradient(155deg, #f3f5f8 0%, #c7ccd4 35%, #8a8f99 65%, #4f535b 100%)",
    borderColor: "#e6e8ec",
    glow: "0 0 20px rgba(226,229,235,0.4)",
    accent: "⚪",
    badge: { label: "Хит продаж", tone: "hot" },
  },
  gold: {
    background: "linear-gradient(155deg, #fff3cc 0%, #f0c04a 35%, #b9821c 65%, #6b4406 100%)",
    borderColor: "#ffd166",
    glow: "0 0 26px rgba(255,209,102,0.5)",
    accent: "🥇",
  },
  legend: {
    background: "linear-gradient(155deg, #e6cbff 0%, #a85af5 40%, #6422c2 70%, #27085e 100%)",
    borderColor: "#b24bf3",
    glow: "0 0 30px rgba(178,75,243,0.6)",
    accent: "🟣",
    sparky: true,
  },
  icon: {
    background: "linear-gradient(155deg, #ffd0db 0%, #ff5c7a 35%, #c20033 65%, #45010f 100%)",
    borderColor: "#ff3b5c",
    glow: "0 0 34px rgba(255,59,92,0.65)",
    accent: "🔴",
    sparky: true,
    badge: { label: "Шанс на икону", tone: "hot" },
  },
};
