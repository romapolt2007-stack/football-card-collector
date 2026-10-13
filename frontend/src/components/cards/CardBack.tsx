import type { Rarity } from "../../types/game";

interface Props {
  size?: "sm" | "md" | "lg";
  /** Если не задано — нейтральная рубашка (как в лотереях, где редкость не должна спойлериться заранее). */
  rarity?: Rarity;
}

const SIZE_CLASSES: Record<NonNullable<Props["size"]>, string> = {
  sm: "w-32",
  md: "w-44",
  lg: "w-60",
};

const BACK_TIER: Record<Rarity, { background: string; borderColor: string; glow: string; holo?: boolean }> = {
  BRONZE: {
    background: "linear-gradient(155deg, #8a5a30 0%, #4a2d14 100%)",
    borderColor: "#cd7f32",
    glow: "none",
  },
  SILVER: {
    background: "linear-gradient(155deg, #dfe2e7 0%, #767b85 100%)",
    borderColor: "#e6e8ec",
    glow: "0 0 14px rgba(226,229,235,0.3)",
  },
  GOLD: {
    background: "linear-gradient(155deg, #ffe9a8 0%, #8a5a06 100%)",
    borderColor: "#ffd166",
    glow: "0 0 20px rgba(255,209,102,0.4)",
  },
  LEGEND: {
    background: "linear-gradient(155deg, #d7b3ff 0%, #4a1393 100%)",
    borderColor: "#b24bf3",
    glow: "0 0 24px rgba(178,75,243,0.5)",
    holo: true,
  },
  ICON: {
    background: "linear-gradient(155deg, #ff8fa3 0%, #6b0018 100%)",
    borderColor: "#ff3b5c",
    glow: "0 0 28px rgba(255,59,92,0.55)",
    holo: true,
  },
};

export function CardBack({ size = "md", rarity }: Props) {
  const tier = rarity ? BACK_TIER[rarity] : null;

  return (
    <div
      className={`relative flex aspect-[3/4.2] shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 ${
        tier ? "" : "border-white/15"
      } ${SIZE_CLASSES[size]}`}
      style={{
        background: tier?.background ?? "linear-gradient(155deg, var(--color-pitch-blue), var(--color-pitch-violet))",
        borderColor: tier?.borderColor,
        boxShadow: tier?.glow,
      }}
    >
      {tier?.holo && <div className="holo-sweep pointer-events-none absolute inset-0" />}
      <div className="absolute inset-3 rounded-xl border border-white/10" />
      <span className="text-3xl font-extrabold text-white/30">FCC</span>
    </div>
  );
}
