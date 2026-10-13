import { useMemo, useState } from "react";
import { RARITY_THEME } from "../components/cards/rarityTheme";
import { useInventory, useQuickSell } from "../lib/queries";
import { haptics } from "../lib/telegram";
import { POSITION_RU } from "../lib/ruLabels";
import type { Card, Rarity } from "../types/game";

const RARITIES: Rarity[] = ["BRONZE", "SILVER", "GOLD", "LEGEND", "ICON"];

export function InventoryScreen() {
  const { data: cards, isLoading } = useInventory();
  const quickSell = useQuickSell();
  const [search, setSearch] = useState("");
  const [rarityFilter, setRarityFilter] = useState<Rarity | null>(null);
  const [confirming, setConfirming] = useState<Card | null>(null);

  const filtered = useMemo(() => {
    return (cards ?? [])
      .filter((c) => !search || c.player.name.toLowerCase().includes(search.toLowerCase()))
      .filter((c) => !rarityFilter || c.rarity === rarityFilter)
      .sort((a, b) => b.player.overall - a.player.overall);
  }, [cards, search, rarityFilter]);

  function confirmSell() {
    if (!confirming) return;
    haptics.notify("success");
    quickSell.mutate(confirming.id);
    setConfirming(null);
  }

  return (
    <div className="flex min-h-dvh flex-col gap-4 px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-28">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold">🗂️ Инвентарь</h1>
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold">
          {cards?.length ?? 0} карт
        </span>
      </header>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск по имени..."
        className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none"
      />

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setRarityFilter(null)}
          className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${
            !rarityFilter ? "border-gold text-gold" : "border-white/20 text-white/50"
          }`}
        >
          Все
        </button>
        {RARITIES.map((r) => (
          <button
            key={r}
            onClick={() => setRarityFilter((prev) => (prev === r ? null : r))}
            className="shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold"
            style={{
              borderColor: rarityFilter === r ? RARITY_THEME[r].borderColor : "rgba(255,255,255,0.2)",
              color: rarityFilter === r ? RARITY_THEME[r].borderColor : "rgba(255,255,255,0.5)",
            }}
          >
            {RARITY_THEME[r].emoji}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-white/50">Загрузка...</p>}
      {!isLoading && filtered.length === 0 && (
        <p className="mt-6 text-center text-sm text-white/40">Карт не найдено</p>
      )}

      <div className="flex flex-col gap-2">
        {filtered.map((card) => (
          <div
            key={card.id}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
          >
            <span
              className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md text-xs font-extrabold"
              style={{ background: RARITY_THEME[card.rarity].background, color: RARITY_THEME[card.rarity].textColor }}
            >
              {card.player.overall}
              <span className="text-[8px] font-semibold opacity-80">{POSITION_RU[card.player.position]}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{card.player.name}</p>
              <p className="truncate text-xs text-white/50">
                {card.player.club.shortName} · {RARITY_THEME[card.rarity].emoji} {RARITY_THEME[card.rarity].label}
                {card.isListed && " · на рынке"}
                {card.unavailableMatches > 0 && (
                  <span className="text-red-300"> · 🚑 ещё {card.unavailableMatches} игр</span>
                )}
              </p>
            </div>
            <button
              onClick={() => setConfirming(card)}
              disabled={card.isListed}
              className="shrink-0 rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/70 disabled:opacity-30"
            >
              {card.quickSellPrice.toLocaleString("ru-RU")} 🪙
            </button>
          </div>
        ))}
      </div>

      {confirming && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 px-6">
          <div className="w-full max-w-xs rounded-xl border border-white/15 bg-pitch-violet p-5 text-center">
            <p className="font-semibold">Продать {confirming.player.name}?</p>
            <p className="mt-1 text-sm text-white/60">
              Получите {confirming.quickSellPrice.toLocaleString("ru-RU")} 🪙. Карту нельзя будет вернуть.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirming(null)}
                className="flex-1 rounded-full border border-white/20 py-2.5 text-sm font-semibold"
              >
                Отмена
              </button>
              <button
                onClick={confirmSell}
                disabled={quickSell.isPending}
                className="flex-1 rounded-full bg-gold py-2.5 text-sm font-extrabold text-pitch-dark disabled:opacity-30"
              >
                Продать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
