import type { PackDef } from "../../types/game";
import { PACK_THEME } from "./packTheme";

interface Props {
  pack: PackDef;
  disabled?: boolean;
  onOpen: () => void;
}

export function PackTile({ pack, disabled, onOpen }: Props) {
  const theme = PACK_THEME[pack.id] ?? PACK_THEME.bronze;

  return (
    <button
      onClick={onOpen}
      disabled={disabled}
      className="flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-transform active:scale-95 disabled:opacity-40"
      style={{ background: theme.background, borderColor: theme.borderColor }}
    >
      <span className="text-3xl">⚽️</span>
      <span className="text-sm font-bold text-white">{pack.title}</span>
      <span className="text-xs text-white/70">{pack.cardCount} карт</span>
      <span className="mt-1 rounded-full bg-black/30 px-3 py-1 text-xs font-semibold text-white">
        {pack.isStarter ? "Бесплатно" : `${pack.priceCoins.toLocaleString("ru-RU")} 🪙`}
      </span>
    </button>
  );
}
