import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { RarityCard } from "./RarityCard";
import { RARITY_THEME } from "./rarityTheme";
import { haptics } from "../../lib/telegram";
import { sfx } from "../../lib/sfx";
import { TRAINING_BOOST_CAP } from "../../lib/cardStats";
import type { Card } from "../../types/game";

interface Props {
  card: Card | null;
  onClose: () => void;
  onSell: (card: Card) => void;
  onAssign: (card: Card) => void;
  onTrain: (card: Card, duplicateCardId: string) => void;
  duplicates: Card[];
  selling?: boolean;
  training?: boolean;
}

export function CardDetailModal({ card, onClose, onSell, onAssign, onTrain, duplicates, selling, training }: Props) {
  const [picking, setPicking] = useState(false);
  const atCap = (card?.trainingBoost ?? 0) >= TRAINING_BOOST_CAP;

  useEffect(() => {
    setPicking(false);
  }, [card?.id]);
  return (
    <AnimatePresence>
      {card && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-6 bg-black/85 px-6"
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(circle at 50% 42%, ${RARITY_THEME[card.rarity].borderColor}33 0%, transparent 60%)`,
            }}
          />

          <motion.div
            key={card.id}
            initial={{ scale: 0.4, rotateY: -90, opacity: 0 }}
            animate={{ scale: 1, rotateY: 0, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            style={{ perspective: 1000 }}
          >
            <RarityCard card={card} size="lg" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-xs flex-col gap-2.5"
          >
            {picking ? (
              <>
                <p className="text-center text-xs text-white/60">
                  Выберите дубль для сжигания — карта получит +1 OVR (сейчас +{card.trainingBoost}/{TRAINING_BOOST_CAP})
                </p>
                <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto">
                  {duplicates.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        haptics.impact("medium");
                        onTrain(card, d.id);
                        setPicking(false);
                      }}
                      disabled={training}
                      className="flex items-center justify-between rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-left text-xs disabled:opacity-30"
                    >
                      <span className="font-semibold">{d.player.name}</span>
                      <span className="text-white/50">{d.rarity} · {d.player.overall} OVR</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setPicking(false)} className="py-2 text-sm font-semibold text-white/50">
                  Отмена
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    haptics.select();
                    onAssign(card);
                  }}
                  className="rounded-full bg-gold py-3 text-sm font-extrabold text-pitch-dark"
                >
                  Установить в состав
                </button>
                <button
                  onClick={() => {
                    haptics.select();
                    setPicking(true);
                  }}
                  disabled={atCap || duplicates.length === 0 || card.isListed}
                  className="rounded-full border border-emerald-400/40 bg-emerald-400/10 py-3 text-sm font-semibold text-emerald-300 disabled:opacity-30"
                >
                  {atCap
                    ? `Макс. тренировки (+${TRAINING_BOOST_CAP})`
                    : duplicates.length === 0
                      ? "Нет дублей для тренировки"
                      : `🏋️ Тренировать (дублей: ${duplicates.length})`}
                </button>
                <button
                  onClick={() => {
                    haptics.impact("medium");
                    sfx.kick();
                    onSell(card);
                  }}
                  disabled={card.isListed || selling}
                  className="rounded-full border border-white/20 bg-white/5 py-3 text-sm font-semibold disabled:opacity-30"
                >
                  {card.isListed ? "На рынке — недоступно" : `Продать за ${card.quickSellPrice.toLocaleString("ru-RU")} 🪙`}
                </button>
                <button onClick={onClose} className="py-2 text-sm font-semibold text-white/50">
                  Закрыть
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
