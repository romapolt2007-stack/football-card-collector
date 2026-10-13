import { AnimatePresence, motion } from "framer-motion";
import { RarityCard } from "./RarityCard";
import { RARITY_THEME } from "./rarityTheme";
import { haptics } from "../../lib/telegram";
import { sfx } from "../../lib/sfx";
import type { Card } from "../../types/game";

interface Props {
  card: Card | null;
  onClose: () => void;
  onSell: (card: Card) => void;
  onAssign: (card: Card) => void;
  selling?: boolean;
}

export function CardDetailModal({ card, onClose, onSell, onAssign, selling }: Props) {
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
