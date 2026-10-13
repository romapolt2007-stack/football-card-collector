import { useState } from "react";
import { useBidListing } from "../../lib/useMarket";
import { haptics } from "../../lib/telegram";
import { sfx } from "../../lib/sfx";
import type { Listing } from "../../types/game";

interface Props {
  listing: Listing;
  onClose: () => void;
}

export function BidModal({ listing, onClose }: Props) {
  const bid = useBidListing();
  const highestBid = listing.bids[0]?.amount ?? null;
  const minBid = (highestBid ?? listing.price - 1) + 1;
  const [amount, setAmount] = useState(String(minBid));

  function submit() {
    const value = Number(amount);
    if (!Number.isInteger(value) || value < minBid) return;
    haptics.impact("medium");
    sfx.kick();
    bid.mutate(
      { listingId: listing.id, amount: value },
      {
        onSuccess: () => {
          haptics.notify("success");
          onClose();
        },
      },
    );
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 px-6">
      <div className="w-full max-w-xs rounded-xl border border-white/15 bg-pitch-violet p-5 text-center">
        <p className="font-semibold">Ставка на {listing.card.player.name}</p>
        <p className="mt-1 text-xs text-white/50">
          {highestBid ? `Текущая ставка: ${highestBid.toLocaleString("ru-RU")} 🪙` : `Старт: ${listing.price.toLocaleString("ru-RU")} 🪙`}
        </p>

        <input
          type="number"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-3 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-center text-sm text-white outline-none"
        />
        <p className="mt-1 text-[10px] text-white/40">Минимум: {minBid.toLocaleString("ru-RU")} 🪙</p>

        {bid.isError && <p className="mt-2 text-xs text-red-400">{(bid.error as Error).message}</p>}

        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-full border border-white/20 py-2.5 text-sm font-semibold">
            Отмена
          </button>
          <button
            onClick={submit}
            disabled={bid.isPending || Number(amount) < minBid}
            className="flex-1 rounded-full bg-gold py-2.5 text-sm font-extrabold text-pitch-dark disabled:opacity-30"
          >
            Сделать ставку
          </button>
        </div>
      </div>
    </div>
  );
}
