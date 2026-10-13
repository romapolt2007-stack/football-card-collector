import { RARITY_THEME } from "../cards/rarityTheme";
import type { CasePrizeDef, Rarity } from "../../types/game";

export const ITEM_WIDTH = 76;

interface Props {
  prize: CasePrizeDef;
  sampleCoins?: number;
}

const COIN_BG = "linear-gradient(160deg, #3a3550, #1b1746)";
const JACKPOT_BG = "linear-gradient(160deg, #fff1c2, #e3a825 55%, #8a5a06)";

export function ReelItem({ prize, sampleCoins }: Props) {
  if (prize.type === "CARD" && prize.rarity) {
    const theme = RARITY_THEME[prize.rarity as Rarity];
    return (
      <div
        className="flex h-20 w-[68px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2"
        style={{ background: theme.background, borderColor: theme.borderColor }}
      >
        <span className="text-lg">{theme.emoji}</span>
        <span className="text-[10px] font-bold" style={{ color: theme.textColor }}>
          {theme.label}
        </span>
      </div>
    );
  }

  if (prize.type === "JACKPOT") {
    return (
      <div
        className="flex h-20 w-[68px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-gold"
        style={{ background: JACKPOT_BG }}
      >
        <span className="text-lg">💎</span>
        <span className="text-[10px] font-extrabold text-pitch-dark">
          {sampleCoins ? sampleCoins.toLocaleString("ru-RU") : `x${prize.jackpotMultiplier}`}
        </span>
      </div>
    );
  }

  const coins = sampleCoins ?? Math.round(((prize.coinsMin ?? 0) + (prize.coinsMax ?? 0)) / 2);
  return (
    <div
      className="flex h-20 w-[68px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-white/15"
      style={{ background: COIN_BG }}
    >
      <span className="text-lg">🪙</span>
      <span className="text-[10px] font-bold text-white/80">{coins.toLocaleString("ru-RU")}</span>
    </div>
  );
}
