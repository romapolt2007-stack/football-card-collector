import { useMemo, useState } from "react";
import type { Card, Listing } from "../../types/game";
import { RARITY_THEME } from "../cards/rarityTheme";
import { useCreateListing } from "../../lib/useMarket";
import { POSITION_RU } from "../../lib/ruLabels";
import { haptics } from "../../lib/telegram";

interface Props {
  cards: Card[];
  listings: Listing[];
  onClose: () => void;
}

const DURATIONS: { hours: number; label: string }[] = [
  { hours: 1, label: "1 час" },
  { hours: 6, label: "6 часов" },
  { hours: 24, label: "24 часа" },
  { hours: 168, label: "7 дней" },
];

export function CreateListingModal({ cards, listings, onClose }: Props) {
  const [selected, setSelected] = useState<Card | null>(null);
  const [price, setPrice] = useState("");
  const [buyNowPrice, setBuyNowPrice] = useState("");
  const [durationHours, setDurationHours] = useState(24);
  const createListing = useCreateListing();

  const avgPrice = useMemo(() => {
    if (!selected) return null;
    const sameRarity = listings.filter((l) => l.card.rarity === selected.rarity);
    if (sameRarity.length === 0) return null;
    const total = sameRarity.reduce((sum, l) => sum + (l.buyNowPrice ?? l.price), 0);
    return Math.round(total / sameRarity.length);
  }, [selected, listings]);

  function submit() {
    if (!selected) return;
    const startValue = Number(price);
    if (!Number.isInteger(startValue) || startValue <= 0) return;
    const buyNowValue = buyNowPrice ? Number(buyNowPrice) : undefined;
    if (buyNowValue !== undefined && (!Number.isInteger(buyNowValue) || buyNowValue <= startValue)) return;

    haptics.impact("medium");
    createListing.mutate(
      { cardId: selected.id, price: startValue, buyNowPrice: buyNowValue, durationHours },
      { onSuccess: onClose },
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black/90">
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-3">
        <h2 className="text-base font-bold">Выставить на продажу</h2>
        <button onClick={onClose} className="text-sm text-white/50">
          Закрыть
        </button>
      </div>

      {!selected ? (
        <div className="flex-1 overflow-y-auto px-4 pb-8">
          {cards.length === 0 && (
            <p className="mt-6 text-center text-sm text-white/40">
              Нет карт для продажи — все либо в составе, либо уже на рынке
            </p>
          )}
          <div className="flex flex-col gap-2">
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => setSelected(card)}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xs font-extrabold"
                  style={{ background: RARITY_THEME[card.rarity].background, color: RARITY_THEME[card.rarity].textColor }}
                >
                  {card.player.overall}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{card.player.name}</p>
                  <p className="truncate text-xs text-white/50">
                    {POSITION_RU[card.player.position]} · {card.player.club.shortName}
                  </p>
                </div>
                <span className="text-xs text-white/40">~{card.quickSellPrice.toLocaleString("ru-RU")} 🪙</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 pb-8">
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-sm font-extrabold"
              style={{ background: RARITY_THEME[selected.rarity].background, color: RARITY_THEME[selected.rarity].textColor }}
            >
              {selected.player.overall}
            </span>
            <div>
              <p className="font-semibold">{selected.player.name}</p>
              <p className="text-xs text-white/50">
                {POSITION_RU[selected.player.position]} · {selected.player.club.shortName}
              </p>
            </div>
          </div>

          {avgPrice !== null && (
            <p className="rounded-lg bg-white/5 px-3 py-2 text-xs text-white/60">
              Средняя цена для «{RARITY_THEME[selected.rarity].label}» на рынке сейчас: ~
              {avgPrice.toLocaleString("ru-RU")} 🪙
            </p>
          )}

          <label className="text-xs text-white/60">
            Стартовая цена (ставки) — комиссия системы 5%
            <input
              type="number"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="например, 5000"
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none"
            />
          </label>

          <label className="text-xs text-white/60">
            Цена мгновенного выкупа (необязательно)
            <input
              type="number"
              inputMode="numeric"
              value={buyNowPrice}
              onChange={(e) => setBuyNowPrice(e.target.value)}
              placeholder="например, 9000"
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none"
            />
          </label>

          <div>
            <p className="mb-1.5 text-xs text-white/60">Срок лота</p>
            <div className="flex gap-1.5">
              {DURATIONS.map((d) => (
                <button
                  key={d.hours}
                  onClick={() => setDurationHours(d.hours)}
                  className="flex-1 rounded-full border py-2 text-xs font-semibold"
                  style={{
                    borderColor: durationHours === d.hours ? "#ffd166" : "rgba(255,255,255,0.15)",
                    color: durationHours === d.hours ? "#ffd166" : "rgba(255,255,255,0.5)",
                    background: durationHours === d.hours ? "rgba(255,209,102,0.12)" : "transparent",
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {price && Number(price) > 0 && (
            <p className="text-xs text-white/40">
              При выкупе вы получите: {Math.round(Number(buyNowPrice || price) * 0.95).toLocaleString("ru-RU")} 🪙
            </p>
          )}

          {createListing.isError && <p className="text-xs text-red-400">{(createListing.error as Error).message}</p>}

          <div className="mt-auto flex gap-2">
            <button onClick={() => setSelected(null)} className="flex-1 rounded-full border border-white/20 py-3 text-sm font-semibold">
              Назад
            </button>
            <button
              onClick={submit}
              disabled={!price || Number(price) <= 0 || createListing.isPending}
              className="flex-1 rounded-full bg-gold py-3 text-sm font-extrabold text-pitch-dark disabled:opacity-30"
            >
              Выставить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
