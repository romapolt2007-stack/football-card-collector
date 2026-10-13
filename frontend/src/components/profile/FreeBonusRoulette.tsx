import { motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { FlippableCard } from "../cards/FlippableCard";
import { haptics } from "../../lib/telegram";
import type { FreeBonusPrize, FreeBonusPrizeType } from "../../types/game";

const ITEM_WIDTH = 76;
const STRIP_LENGTH = 36;
const WINNER_INDEX = 30;

const FILLER_POOL: FreeBonusPrizeType[] = ["COINS", "COINS", "CARD", "CARD", "PACK"];

function Tile({ type }: { type: FreeBonusPrizeType }) {
  if (type === "CARD") {
    return (
      <div className="flex h-20 w-[68px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-silver bg-gradient-to-br from-white/20 to-white/5">
        <span className="text-lg">🃏</span>
        <span className="text-[10px] font-bold text-white/80">Карта</span>
      </div>
    );
  }
  if (type === "PACK") {
    return (
      <div className="flex h-20 w-[68px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-gold bg-gradient-to-br from-gold/30 to-gold/5">
        <span className="text-lg">🎁</span>
        <span className="text-[10px] font-bold text-white/80">Мини-пак</span>
      </div>
    );
  }
  return (
    <div className="flex h-20 w-[68px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-white/15 bg-gradient-to-br from-pitch-blue to-pitch-violet">
      <span className="text-lg">🪙</span>
      <span className="text-[10px] font-bold text-white/80">Монеты</span>
    </div>
  );
}

interface Props {
  prize: FreeBonusPrize;
  onDone: () => void;
}

export function FreeBonusRoulette({ prize, onDone }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [landed, setLanded] = useState(false);
  const [revealedCards, setRevealedCards] = useState(0);

  const strip = useMemo(() => {
    return Array.from({ length: STRIP_LENGTH }, (_, i) =>
      i === WINNER_INDEX ? prize.type : FILLER_POOL[Math.floor(Math.random() * FILLER_POOL.length)],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const containerWidth = containerRef.current?.offsetWidth ?? 360;
  const targetX = -(WINNER_INDEX * ITEM_WIDTH + ITEM_WIDTH / 2 - containerWidth / 2);

  function handleLanded() {
    haptics.notify("success");
    setLanded(true);
    if (prize.cards.length === 0) return;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setRevealedCards(i);
      haptics.impact("light");
      if (i >= prize.cards.length) clearInterval(timer);
    }, 500);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={containerRef} className="relative w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-0.5 -translate-x-1/2 bg-gold" />
        <motion.div
          className="flex gap-2 py-1"
          initial={{ x: 0 }}
          animate={{ x: targetX }}
          transition={{ duration: 4, ease: [0.12, 0.65, 0.2, 1] }}
          onAnimationComplete={handleLanded}
        >
          {strip.map((type, i) => (
            <Tile key={i} type={type} />
          ))}
        </motion.div>
      </div>

      {landed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full flex-col items-center gap-4"
        >
          {prize.type === "COINS" && (
            <p className="text-lg font-extrabold text-gold">
              +{prize.coins.toLocaleString("ru-RU")} монет
            </p>
          )}

          {prize.cards.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              {prize.cards.map((card, i) => (
                <FlippableCard key={card.id} card={card} revealed={i < revealedCards} size="sm" />
              ))}
            </div>
          )}

          {(prize.type === "COINS" || revealedCards >= prize.cards.length) && (
            <button
              onClick={onDone}
              className="rounded-full bg-gold px-6 py-2.5 text-sm font-extrabold text-pitch-dark"
            >
              Забрать
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
