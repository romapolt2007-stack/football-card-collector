import { useMemo } from "react";
import type { Card } from "../../types/game";
import { SPECIAL_EDITIONS } from "./specialEditionThemes";
import { SpecialEditionCard } from "./SpecialEditionCard";

interface Props {
  cards: Card[];
}

const ELITE_OVERALL_THRESHOLD = 90;

/** У каждого игрока с overall>90 — своя витрина из 6 премиальных изданий (декоративная галерея материалов). */
export function SpecialEditionShowcase({ cards }: Props) {
  const eliteCards = useMemo(() => {
    const byPlayer = new Map<string, Card>();
    for (const card of cards) {
      if (card.player.overall <= ELITE_OVERALL_THRESHOLD) continue;
      const existing = byPlayer.get(card.player.id);
      if (!existing || card.player.overall > existing.player.overall) byPlayer.set(card.player.id, card);
    }
    return [...byPlayer.values()].sort((a, b) => b.player.overall - a.player.overall);
  }, [cards]);

  if (eliteCards.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {eliteCards.map((card) => (
        <div key={card.player.id}>
          <p className="mb-2 text-xs font-semibold text-white/50">
            ✨ Коллекция изданий — {card.player.name} ({card.player.overall})
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {SPECIAL_EDITIONS.map((theme) => (
              <SpecialEditionCard key={theme.id} card={card} theme={theme} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
