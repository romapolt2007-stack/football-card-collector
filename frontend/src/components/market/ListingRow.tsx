import type { Listing } from "../../types/game";
import { RARITY_THEME } from "../cards/rarityTheme";

interface Props {
  listing: Listing;
  isMine: boolean;
  onBuy: () => void;
  onCancel: () => void;
  isBusy: boolean;
}

export function ListingRow({ listing, isMine, onBuy, onCancel, isBusy }: Props) {
  const theme = RARITY_THEME[listing.card.rarity];
  const { player } = listing.card;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
      <span
        className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md text-xs font-extrabold"
        style={{ background: theme.background, color: theme.textColor }}
      >
        {player.overall}
        <span className="text-[8px] font-semibold opacity-80">{player.position}</span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{player.name}</p>
        <p className="truncate text-xs text-white/50">
          {player.club.shortName} · {theme.emoji} {theme.label}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-sm font-bold text-gold">{listing.price.toLocaleString("ru-RU")} 🪙</span>
        {isMine ? (
          <button
            onClick={onCancel}
            disabled={isBusy}
            className="rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold text-white/70 disabled:opacity-30"
          >
            Снять
          </button>
        ) : (
          <button
            onClick={onBuy}
            disabled={isBusy}
            className="rounded-full bg-gold px-3 py-1 text-[11px] font-extrabold text-pitch-dark disabled:opacity-30"
          >
            Купить
          </button>
        )}
      </div>
    </div>
  );
}
