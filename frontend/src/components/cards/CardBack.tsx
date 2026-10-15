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

/** Та же форма щита, что у RarityCard.tsx (PENNANT_CLIP) — рубашка и лицо карты должны совпадать по силуэту при перевороте. */
const PENNANT_CLIP =
  "polygon(5% 0%, 95% 0%, 100% 3%, 100% 90%, 84% 95%, 50% 100%, 16% 95%, 0% 90%, 0% 3%)";

const BACK_TIER: Record<Rarity, { background: string; borderColor: string; glow: string }> = {
  BRONZE: {
    background: "linear-gradient(155deg, #8a5a30 0%, #4a2d14 55%, #231408 100%)",
    borderColor: "#cd7f32",
    glow: "0 0 16px rgba(205,127,50,0.35)",
  },
  SILVER: {
    background: "linear-gradient(155deg, #dfe2e7 0%, #767b85 55%, #3c4049 100%)",
    borderColor: "#e6e8ec",
    glow: "0 0 18px rgba(226,229,235,0.4)",
  },
  GOLD: {
    background: "linear-gradient(155deg, #ffe9a8 0%, #c98a1f 55%, #5c3c03 100%)",
    borderColor: "#ffd166",
    glow: "0 0 22px rgba(255,209,102,0.5)",
  },
  LEGEND: {
    background: "linear-gradient(155deg, #d7b3ff 0%, #7a2fd1 55%, #30094f 100%)",
    borderColor: "#b24bf3",
    glow: "0 0 26px rgba(178,75,243,0.6)",
  },
  ICON: {
    background: "linear-gradient(155deg, #ff8fa3 0%, #d1264a 55%, #4a0010 100%)",
    borderColor: "#ff3b5c",
    glow: "0 0 30px rgba(255,59,92,0.65)",
  },
};

/** Полированная "металлическая" рубашка карты с неоновым логотипом FCC — используется в пак-опенинге и рулетке «Удача». */
export function CardBack({ size = "md", rarity }: Props) {
  const tier = rarity ? BACK_TIER[rarity] : null;
  const borderColor = tier?.borderColor ?? "#8aa0ff";

  return (
    <div
      className={`relative flex aspect-[3/4.2] shrink-0 items-center justify-center overflow-hidden pb-4 border-[3px] ${SIZE_CLASSES[size]}`}
      style={{
        background: tier?.background ?? "linear-gradient(155deg, var(--color-pitch-blue), var(--color-pitch-violet))",
        borderColor,
        boxShadow: tier?.glow ?? "0 0 16px rgba(138,160,255,0.35)",
        clipPath: PENNANT_CLIP,
      }}
    >
      <div className="foil-texture pointer-events-none absolute inset-0" />
      <div className="holo-sweep pointer-events-none absolute inset-0" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(140deg, rgba(255,255,255,0.2) 0%, transparent 34%)" }}
      />
      <div className="absolute inset-3 rounded-xl border" style={{ borderColor: `${borderColor}55` }} />
      <span
        className="relative text-3xl font-extrabold tracking-wide text-white"
        style={{ textShadow: `0 0 14px ${borderColor}, 0 0 28px ${borderColor}99` }}
      >
        FCC
      </span>
    </div>
  );
}
