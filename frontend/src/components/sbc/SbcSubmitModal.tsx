import { useMemo, useState } from "react";
import type { Card, SbcDef } from "../../types/game";
import { RARITY_THEME } from "../cards/rarityTheme";
import { RarityCard } from "../cards/RarityCard";
import { useSubmitSbc } from "../../lib/useSbc";
import { haptics } from "../../lib/telegram";
import { sfx } from "../../lib/sfx";

const RARITY_ORDER: Record<string, number> = { BRONZE: 0, SILVER: 1, GOLD: 2, LEGEND: 3, ICON: 4 };

interface Props {
  sbc: SbcDef;
  cards: Card[];
  onClose: () => void;
}

export function SbcSubmitModal({ sbc, cards, onClose }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [grantedCard, setGrantedCard] = useState<Card | null | undefined>(undefined);
  const submit = useSubmitSbc();

  const eligible = useMemo(() => {
    return cards
      .filter((c) => !c.isListed)
      .filter((c) => !sbc.minRarity || RARITY_ORDER[c.rarity] >= RARITY_ORDER[sbc.minRarity])
      .sort((a, b) => b.player.overall - a.player.overall);
  }, [cards, sbc.minRarity]);

  const selectedCards = useMemo(
    () => selected.map((id) => cards.find((c) => c.id === id)).filter((c): c is Card => Boolean(c)),
    [selected, cards],
  );

  const overallSum = selectedCards.reduce((s, c) => s + c.player.overall, 0);
  const sameClubOk = !sbc.sameClub || new Set(selectedCards.map((c) => c.player.club.id)).size <= 1;
  const distinctNationsOk =
    !sbc.distinctNations || new Set(selectedCards.map((c) => c.player.nation)).size === selectedCards.length;
  const overallOk = !sbc.minOverallSum || overallSum >= sbc.minOverallSum;
  const countOk = selected.length === sbc.count;
  const canSubmit = countOk && overallOk && sameClubOk && distinctNationsOk && !submit.isPending;

  function toggle(card: Card) {
    haptics.select();
    setSelected((prev) => {
      if (prev.includes(card.id)) return prev.filter((id) => id !== card.id);
      if (prev.length >= sbc.count) return prev;
      return [...prev, card.id];
    });
  }

  function handleSubmit() {
    if (!canSubmit) return;
    submit.mutate(
      { sbcId: sbc.id, cardIds: selected },
      {
        onSuccess: (res) => {
          haptics.notify("success");
          sfx.chime();
          setGrantedCard(res.grantedCard);
        },
      },
    );
  }

  if (grantedCard !== undefined) {
    return (
      <div className="fixed inset-0 z-[95] flex flex-col items-center justify-center gap-5 bg-black/90 px-6">
        <p className="text-lg font-extrabold text-gold">Сборка выполнена!</p>
        {grantedCard && <RarityCard card={grantedCard} size="lg" />}
        <button onClick={onClose} className="rounded-full bg-gold px-8 py-3 text-sm font-extrabold text-pitch-dark">
          Отлично
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-black/90">
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-3">
        <div className="min-w-0 pr-3">
          <h2 className="truncate text-base font-bold">{sbc.title}</h2>
          <p className="text-xs text-white/50">{sbc.description}</p>
        </div>
        <button onClick={onClose} className="shrink-0 text-sm text-white/50">
          Закрыть
        </button>
      </div>

      <div className="flex flex-col gap-1.5 px-4 pb-3 text-xs">
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <span className={countOk ? "font-bold text-emerald-400" : "text-white/60"}>
            Выбрано: {selected.length}/{sbc.count}
          </span>
          {sbc.minOverallSum !== undefined && (
            <span className={overallOk ? "font-bold text-emerald-400" : "text-white/60"}>
              Сумма: {overallSum}/{sbc.minOverallSum}
            </span>
          )}
        </div>
        {sbc.sameClub && selectedCards.length > 1 && !sameClubOk && (
          <p className="text-red-400">Все карты должны быть из одного клуба</p>
        )}
        {sbc.distinctNations && !distinctNationsOk && <p className="text-red-400">Карты должны быть из разных стран</p>}
        {submit.isError && <p className="text-red-400">{(submit.error as Error)?.message ?? "Ошибка отправки"}</p>}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {eligible.length === 0 && <p className="mt-6 text-center text-sm text-white/40">Нет подходящих карт</p>}
        <div className="flex flex-col gap-2">
          {eligible.map((card) => {
            const isSelected = selected.includes(card.id);
            return (
              <button
                key={card.id}
                onClick={() => toggle(card)}
                className="flex items-center gap-3 rounded-lg border px-3 py-2 text-left"
                style={{
                  borderColor: isSelected ? "#ffd166" : "rgba(255,255,255,0.1)",
                  background: isSelected ? "rgba(255,209,102,0.12)" : "rgba(255,255,255,0.05)",
                }}
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
                    {card.player.club.shortName} · {card.player.nationFlag}
                  </p>
                </div>
                {isSelected && <span className="text-gold">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-8 pt-2">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="spin-button-texture relative w-full overflow-hidden rounded-full bg-gold py-3.5 text-sm font-extrabold tracking-wide text-pitch-dark disabled:opacity-30"
        >
          Выполнить сборку
        </button>
      </div>
    </div>
  );
}
