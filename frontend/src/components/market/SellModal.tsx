import { useState } from "react";
import type { Card } from "../../types/game";
import { RARITY_THEME } from "../cards/rarityTheme";
import { useCreateListing } from "../../lib/useMarket";

interface Props {
  cards: Card[];
  onClose: () => void;
}

export function SellModal({ cards, onClose }: Props) {
  const [selected, setSelected] = useState<Card | null>(null);
  const [price, setPrice] = useState("");
  const createListing = useCreateListing();

  function submit() {
    if (!selected) return;
    const value = Number(price);
    if (!Number.isInteger(value) || value <= 0) return;
    createListing.mutate(
      { cardId: selected.id, price: value },
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
                  style={{
                    background: RARITY_THEME[card.rarity].background,
                    color: RARITY_THEME[card.rarity].textColor,
                  }}
                >
                  {card.player.overall}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{card.player.name}</p>
                  <p className="truncate text-xs text-white/50">
                    {card.player.position} · {card.player.club.shortName}
                  </p>
                </div>
                <span className="text-xs text-white/40">
                  ~{card.quickSellPrice.toLocaleString("ru-RU")} 🪙
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4 px-5 pb-8">
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-sm font-extrabold"
              style={{
                background: RARITY_THEME[selected.rarity].background,
                color: RARITY_THEME[selected.rarity].textColor,
              }}
            >
              {selected.player.overall}
            </span>
            <div>
              <p className="font-semibold">{selected.player.name}</p>
              <p className="text-xs text-white/50">
                {selected.player.position} · {selected.player.club.shortName}
              </p>
            </div>
          </div>

          <label className="text-xs text-white/60">
            Цена (монеты) — комиссия системы 5%
            <input
              type="number"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="например, 5000"
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none"
            />
          </label>

          {price && Number(price) > 0 && (
            <p className="text-xs text-white/40">
              Вы получите: {Math.round(Number(price) * 0.95).toLocaleString("ru-RU")} 🪙
            </p>
          )}

          {createListing.isError && (
            <p className="text-xs text-red-400">{(createListing.error as Error).message}</p>
          )}

          <div className="mt-auto flex gap-2">
            <button
              onClick={() => setSelected(null)}
              className="flex-1 rounded-full border border-white/20 py-3 text-sm font-semibold"
            >
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
