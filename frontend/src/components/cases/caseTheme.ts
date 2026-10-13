export interface CaseTheme {
  background: string;
  borderColor: string;
  glow: string;
  colorLight: string;
  colorDark: string;
  packSize: number;
  badge?: { label: string; tone: "collection" | "limited" | "legends" };
  effect?: "sparky" | "rays" | "neon";
}

export const CASE_THEME: Record<string, CaseTheme> = {
  common: {
    background: "linear-gradient(155deg, #2a2d33 0%, #121318 60%, #060607 100%)",
    borderColor: "rgba(183,190,201,0.4)",
    glow: "0 0 14px rgba(183,190,201,0.18)",
    colorLight: "#aeb6c2",
    colorDark: "#454b54",
    packSize: 500,
  },
  rare: {
    background: "linear-gradient(155deg, #10233f 0%, #0a1326 60%, #05070f 100%)",
    borderColor: "rgba(79,145,255,0.45)",
    glow: "0 0 20px rgba(79,145,255,0.25)",
    colorLight: "#5aa8ff",
    colorDark: "#0b2a63",
    packSize: 1000,
    badge: { label: "Collection item", tone: "collection" },
    effect: "neon",
  },
  epic: {
    background: "linear-gradient(155deg, #2a1240 0%, #150a26 60%, #070410 100%)",
    borderColor: "rgba(178,106,255,0.45)",
    glow: "0 0 24px rgba(178,106,255,0.28)",
    colorLight: "#b06bff",
    colorDark: "#3b0f72",
    packSize: 2000,
    badge: { label: "Limited series", tone: "limited" },
    effect: "sparky",
  },
  mythic: {
    background: "linear-gradient(155deg, #2b2004 0%, #19130a 55%, #070504 100%)",
    borderColor: "rgba(255,209,102,0.5)",
    glow: "0 0 30px rgba(255,209,102,0.32)",
    colorLight: "#ffd166",
    colorDark: "#2a1a00",
    packSize: 5000,
    badge: { label: "Legends edition", tone: "legends" },
    effect: "rays",
  },
};
