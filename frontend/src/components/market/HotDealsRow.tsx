import { ClubCrest } from "../cards/ClubCrest";
import { RARITY_THEME } from "../cards/rarityTheme";
import type { Listing } from "../../types/game";

interface Props {
  listings: Listing[];
  onSelect: (listing: Listing) => void;
}

export function HotDealsRow({ listings, onSelect }: Props) {
  if (listings.length === 0) return null;

  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-extrabold text-gold">
        <span className="neon-pulse">🔥</span> Горячие сделки
      </p>
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {listings.map((listing) => {
          const theme = RARITY_THEME[listing.card.rarity];
          const price = listing.buyNowPrice ?? listing.price;
          return (
            <button
              key={listing.id}
              onClick={() => onSelect(listing)}
              className="flex w-28 shrink-0 flex-col items-center gap-1 rounded-xl border-2 p-2.5"
              style={{ background: theme.background, borderColor: theme.borderColor, boxShadow: theme.glow, color: theme.textColor }}
            >
              <ClubCrest club={listing.card.player.club} size={28} />
              <span className="text-sm font-extrabold">{listing.card.player.overall}</span>
              <span className="w-full truncate text-center text-[10px] font-bold uppercase">{listing.card.player.name}</span>
              <span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-extrabold">
                {price.toLocaleString("ru-RU")} 🪙
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
