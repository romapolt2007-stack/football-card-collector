import { useMemo, useState } from "react";
import type { Card, Position, Rarity } from "../../types/game";
import { RARITY_THEME } from "../cards/rarityTheme";

interface Props {
  cards: Card[];
  slotEligible: Position[];
  onPick: (card: Card) => void;
  onRemove?: () => void;
  onClose: () => void;
}

const RARITIES: Rarity[] = ["BRONZE", "SILVER", "GOLD", "LEGEND", "ICON"];

export function CardPicker({ cards, slotEligible, onPick, onRemove, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [rarityFilter, setRarityFilter] = useState<Rarity | null>(null);
  const [onlyEligible, setOnlyEligible] = useState(slotEligible.length > 0);

  const filtered = useMemo(() => {
    return cards
      .filter((c) => !search || c.player.name.toLowerCase().includes(search.toLowerCase()))
      .filter((c) => !rarityFilter || c.rarity === rarityFilter)
      .filter((c) => !onlyEligible || slotEligible.includes(c.player.position))
      .sort((a, b) => b.player.overall - a.player.overall);
  }, [cards, search, rarityFilter, onlyEligible, slotEligible]);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black/90">
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-3">
        <h2 className="text-base font-bold">Выбор игрока</h2>
        <button onClick={onClose} className="text-sm text-white/50">
          Закрыть
        </button>
      </div>

      <div className="flex flex-col gap-2 px-4 pb-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени..."
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none"
        />
        <div className="flex flex-wrap gap-1.5">
          {slotEligible.length > 0 && (
            <button
              onClick={() => setOnlyEligible((v) => !v)}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                onlyEligible ? "border-gold bg-gold/20 text-gold" : "border-white/20 text-white/60"
              }`}
            >
              Для позиции
            </button>
          )}
          {RARITIES.map((r) => (
            <button
              key={r}
              onClick={() => setRarityFilter((prev) => (prev === r ? null : r))}
              className="rounded-full border px-2.5 py-1 text-xs font-semibold"
              style={{
                borderColor: rarityFilter === r ? RARITY_THEME[r].borderColor : "rgba(255,255,255,0.2)",
                color: rarityFilter === r ? RARITY_THEME[r].borderColor : "rgba(255,255,255,0.6)",
              }}
            >
              {RARITY_THEME[r].emoji}
            </button>
          ))}
        </div>
      </div>

      {onRemove && (
        <button onClick={onRemove} className="mx-4 mb-2 rounded-lg bg-red-500/20 py-2 text-sm font-semibold text-red-300">
          Убрать со слота
        </button>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {filtered.length === 0 && (
          <p className="mt-6 text-center text-sm text-white/40">Ничего не найдено</p>
        )}
        <div className="flex flex-col gap-2">
          {filtered.map((card) => (
            <button
              key={card.id}
              onClick={() => onPick(card)}
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
                  {card.player.position} · {card.player.club.shortName}
                </p>
              </div>
              <span className="text-lg">{card.player.nationFlag}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
