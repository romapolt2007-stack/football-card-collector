import { useMemo } from "react";
import type { Card } from "../../types/game";
import { SPECIAL_EDITIONS } from "./specialEditionThemes";
import { SpecialEditionCard } from "./SpecialEditionCard";

interface Props {
  cards: Card[];
}

/** Витрина из 6 премиальных изданий лучшей карты игрока — декоративная галерея материалов вверху инвентаря. */
export function SpecialEditionShowcase({ cards }: Props) {
  const bestCard = useMemo(() => {
    if (cards.length === 0) return null;
    return [...cards].sort((a, b) => b.player.overall - a.player.overall)[0];
  }, [cards]);

  if (!bestCard) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-white/50">✨ Коллекция изданий</p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {SPECIAL_EDITIONS.map((theme) => (
          <SpecialEditionCard key={theme.id} card={bestCard} theme={theme} />
        ))}
      </div>
    </div>
  );
}
