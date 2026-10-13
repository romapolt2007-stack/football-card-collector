import type { CaseDef } from "../../types/game";
import { CASE_THEME } from "./caseTheme";

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

export function CaseTile({ caseDef, disabled, onOpen }: Props) {
  const theme = CASE_THEME[caseDef.id] ?? CASE_THEME.common;

  return (
    <button
      onClick={onOpen}
      disabled={disabled}
      className="relative flex flex-col items-center gap-1.5 overflow-hidden rounded-2xl border-2 p-4 pt-5 text-center transition-transform active:scale-95 disabled:opacity-40"
      style={{ background: theme.background, borderColor: theme.borderColor, boxShadow: theme.glow }}
    >
      {theme.effect === "rays" && <div className="light-rays pointer-events-none absolute inset-0" />}

      {theme.badge && (
        <span
          className={`absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${
            theme.badge.tone === "jackpot" ? "bg-violet-500 text-white" : "bg-sky-400 text-pitch-dark"
          }`}
        >
          {theme.badge.label}
        </span>
      )}

      <div className="sheen-sweep pointer-events-none absolute inset-0" />

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

      <span className={`relative text-4xl drop-shadow-lg ${theme.effect === "neon" ? "neon-pulse" : ""}`}>
        {theme.accent}
      </span>
      <span className="relative text-sm font-extrabold text-white drop-shadow">{caseDef.title}</span>
      <span className="relative mt-1 flex items-center gap-1 rounded-full bg-black/35 px-3 py-1 text-xs font-bold text-white">
        {caseDef.priceCoins.toLocaleString("ru-RU")}
        <span className="text-gold">🪙</span>
      </span>
    </button>
  );
}
