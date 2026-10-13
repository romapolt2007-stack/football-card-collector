import { PackFoilArt } from "../cases/PackFoilArt";
import type { PackDef } from "../../types/game";
import { PACK_THEME } from "./packTheme";

interface Props {
  pack: PackDef;
  disabled?: boolean;
  onOpen: () => void;
}

const SPARK_POSITIONS = [
  { top: "12%", left: "20%", delay: "0s" },
  { top: "30%", left: "78%", delay: "0.4s" },
  { top: "68%", left: "15%", delay: "0.8s" },
  { top: "80%", left: "70%", delay: "1.2s" },
];

export function PackTile({ pack, disabled, onOpen }: Props) {
  const theme = PACK_THEME[pack.id] ?? PACK_THEME.bronze;

  return (
    <button
      onClick={onOpen}
      disabled={disabled}
      className="relative flex flex-col items-center gap-1.5 overflow-hidden rounded-2xl border-2 p-3 pt-4 text-center transition-transform active:scale-95 disabled:opacity-40"
      style={{ background: theme.background, borderColor: theme.borderColor, boxShadow: theme.glow }}
    >
      <div className="foil-texture pointer-events-none absolute inset-0" />

      {theme.badge && (
        <span
          className={`absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide ${
            theme.badge.tone === "hot" ? "bg-red-500 text-white" : "bg-emerald-400 text-pitch-dark"
          }`}
        >
          {theme.badge.label}
        </span>
      )}

      {theme.sparky && (
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

      <PackFoilArt
        colorLight={theme.colorLight}
        colorDark={theme.colorDark}
        label={pack.title}
        emblem={pack.id === "starter" ? "⚽" : "🛡️"}
      />

      <span className="relative text-xs font-medium text-white/80">{pack.cardCount} карт</span>
      <span className="relative mt-0.5 flex items-center gap-1 rounded-full bg-black/40 px-3 py-1 text-xs font-bold text-white">
        {pack.isStarter ? (
          "Бесплатно"
        ) : (
          <>
            {pack.priceCoins.toLocaleString("ru-RU")}
            <span className="text-gold">🪙</span>
          </>
        )}
      </span>
    </button>
  );
}
