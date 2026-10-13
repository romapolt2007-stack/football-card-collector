import type { CaseDef } from "../../types/game";
import { CASE_THEME } from "./caseTheme";
import { PackFoilArt } from "./PackFoilArt";

interface Props {
  caseDef: CaseDef;
  disabled?: boolean;
  onOpen: () => void;
}

const SPARK_POSITIONS = [
  { top: "12%", left: "20%", delay: "0s" },
  { top: "30%", left: "78%", delay: "0.4s" },
  { top: "68%", left: "15%", delay: "0.8s" },
  { top: "80%", left: "70%", delay: "1.2s" },
];

const BADGE_CLASS: Record<string, string> = {
  collection: "bg-sky-500 text-white",
  limited: "bg-violet-500 text-white",
  legends: "bg-gold text-pitch-dark",
};

export function CaseTile({ caseDef, disabled, onOpen }: Props) {
  const theme = CASE_THEME[caseDef.id] ?? CASE_THEME.common;

  return (
    <button
      onClick={onOpen}
      disabled={disabled}
      className="relative flex flex-col items-center gap-1.5 overflow-hidden rounded-2xl border-2 p-3 pt-4 text-center transition-transform active:scale-95 disabled:opacity-40"
      style={{ background: theme.background, borderColor: theme.borderColor, boxShadow: theme.glow }}
    >
      <div className="foil-texture pointer-events-none absolute inset-0" />

      {theme.effect === "rays" && <div className="light-rays pointer-events-none absolute inset-0" />}

      {theme.badge && (
        <span
          className={`absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide ${BADGE_CLASS[theme.badge.tone]}`}
        >
          {theme.badge.label}
        </span>
      )}

      {theme.effect === "sparky" && (
        <div className="pointer-events-none absolute inset-0">
          {SPARK_POSITIONS.map((pos, i) => (
            <span
              key={i}
              className="sparkle absolute h-1 w-1 rounded-full bg-white"
              style={{ top: pos.top, left: pos.left, animationDelay: pos.delay }}
            />
          ))}
        </div>
      )}

      <div className={theme.effect === "neon" ? "neon-pulse" : ""}>
        <PackFoilArt colorLight={theme.colorLight} colorDark={theme.colorDark} label={`Pack ${theme.packSize}`} />
      </div>

      <span className="relative text-sm font-extrabold text-white drop-shadow">{caseDef.title}</span>
      <span className="relative mt-0.5 flex items-center gap-1 rounded-full bg-black/40 px-3 py-1 text-xs font-bold text-white">
        {caseDef.priceCoins.toLocaleString("ru-RU")}
        <span className="text-gold">🪙</span>
      </span>
    </button>
  );
}
