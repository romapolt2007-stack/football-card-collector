import { motion } from "framer-motion";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { FlippableCard } from "../cards/FlippableCard";
import { RARITY_THEME } from "../cards/rarityTheme";
import { haptics } from "../../lib/telegram";
import { useQuickSell } from "../../lib/queries";
import type { Card, Rarity } from "../../types/game";

const ITEM_WIDTH = 76;
const STRIP_LENGTH = 36;
const WINNER_INDEX = 30;
const ALL_RARITIES: Rarity[] = ["BRONZE", "SILVER", "GOLD", "LEGEND", "ICON"];

function Tile({ rarity }: { rarity: Rarity }) {
  const theme = RARITY_THEME[rarity];
  return (
    <div
      className="flex h-20 w-[68px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2"
      style={{ background: theme.background, borderColor: theme.borderColor }}
    >
      <span className="text-lg">{theme.emoji}</span>
      <span className="text-[10px] font-bold" style={{ color: theme.textColor }}>
        {theme.label}
      </span>
    </div>
  );
}

interface Props {
  card: Card;
  wasPity: boolean;
  onDone: () => void;
}

export function LuckyReel({ card, wasPity, onDone }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [landed, setLanded] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const quickSell = useQuickSell();

  const strip = useMemo(() => {
    return Array.from({ length: STRIP_LENGTH }, (_, i) =>
      i === WINNER_INDEX ? card.rarity : ALL_RARITIES[Math.floor(Math.random() * ALL_RARITIES.length)],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Измеряем реальную ширину после монтирования — offsetWidth во время рендера
  // ещё null (ref не привязан), иначе лента целится по заглушке и карточка
  // останавливается не под указателем.
  useLayoutEffect(() => {
    if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
  }, []);

  const targetX = -(WINNER_INDEX * ITEM_WIDTH + ITEM_WIDTH / 2 - containerWidth / 2);

  function handleLanded() {
    haptics.notify("success");
    setLanded(true);
    setTimeout(() => setRevealed(true), 300);
  }

  function handleSell() {
    haptics.impact("medium");
    quickSell.mutate(card.id, { onSuccess: onDone });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {wasPity && (
        <p className="animate-pulse text-sm font-extrabold text-gold">⭐ УДАЧА x5! ⭐</p>
      )}

      <div ref={containerRef} className="relative w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-0.5 -translate-x-1/2 bg-gold" />
        <motion.div
          className="flex gap-2 py-1"
          initial={{ x: 0 }}
          animate={containerWidth ? { x: targetX } : { x: 0 }}
          transition={{ duration: 4, ease: [0.12, 0.65, 0.2, 1] }}
          onAnimationComplete={() => containerWidth && handleLanded()}
        >
          {strip.map((rarity, i) => (
            <Tile key={i} rarity={rarity} />
          ))}
        </motion.div>
      </div>

      {landed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <FlippableCard card={card} revealed={revealed} size="md" />

          {revealed && (
            <div className="flex gap-2">
              <button
                onClick={handleSell}
                disabled={quickSell.isPending}
                className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold disabled:opacity-30"
              >
                Продать за {card.quickSellPrice.toLocaleString("ru-RU")} 🪙
              </button>
              <button
                onClick={onDone}
                className="rounded-full bg-gold px-5 py-2.5 text-sm font-extrabold text-pitch-dark"
              >
                Оставить
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
