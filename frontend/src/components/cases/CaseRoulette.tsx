import { motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { haptics } from "../../lib/telegram";
import type { CaseDef, CasePrize, CasePrizeDef } from "../../types/game";
import { ITEM_WIDTH, ReelItem } from "./ReelItem";

const STRIP_LENGTH = 40;
const WINNER_INDEX = 33;

interface Props {
  caseDef: CaseDef;
  prize: CasePrize;
  onDone: () => void;
}

function randomFiller(pool: CasePrizeDef[]): CasePrizeDef {
  return pool[Math.floor(Math.random() * pool.length)];
}

function prizeToDef(prize: CasePrize, pool: CasePrizeDef[]): CasePrizeDef {
  if (prize.card) {
    return pool.find((p) => p.type === "CARD" && p.rarity === prize.card!.rarity) ?? { type: "CARD", weight: 1, rarity: prize.card.rarity };
  }
  if (prize.type === "JACKPOT") {
    return pool.find((p) => p.type === "JACKPOT") ?? { type: "JACKPOT", weight: 1, jackpotMultiplier: 3 };
  }
  return { type: "COINS", weight: 1, coinsMin: prize.coins, coinsMax: prize.coins };
}

export function CaseRoulette({ caseDef, prize, onDone }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  const hapticsFiredRef = useRef(false);

  const strip = useMemo(() => {
    const winnerDef = prizeToDef(prize, caseDef.prizes);
    return Array.from({ length: STRIP_LENGTH }, (_, i) =>
      i === WINNER_INDEX ? winnerDef : randomFiller(caseDef.prizes),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const containerWidth = containerRef.current?.offsetWidth ?? 360;
  const targetX = -(WINNER_INDEX * ITEM_WIDTH + ITEM_WIDTH / 2 - containerWidth / 2);

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={containerRef} className="relative w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-0.5 -translate-x-1/2 bg-gold" />
        <motion.div
          className="flex gap-2 py-1"
          initial={{ x: 0 }}
          animate={{ x: targetX }}
          transition={{ duration: 4.5, ease: [0.12, 0.65, 0.2, 1] }}
          onUpdate={(latest) => {
            const x = typeof latest.x === "number" ? latest.x : 0;
            if (!hapticsFiredRef.current && x < targetX + ITEM_WIDTH * 1.5) {
              hapticsFiredRef.current = true;
              haptics.impact("light");
            }
          }}
          onAnimationComplete={() => {
            haptics.notify("success");
            setDone(true);
          }}
        >
          {strip.map((item, i) => (
            <ReelItem
              key={i}
              prize={item}
              sampleCoins={i === WINNER_INDEX && prize.type !== "CARD" ? prize.coins : undefined}
            />
          ))}
        </motion.div>
      </div>

      {done && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3"
        >
          <p className="text-sm font-semibold text-white/70">
            {prize.card
              ? `Выпала карта: ${prize.card.player.name}`
              : `+${prize.coins.toLocaleString("ru-RU")} монет`}
          </p>
          <button onClick={onDone} className="rounded-full bg-gold px-6 py-2.5 text-sm font-extrabold text-pitch-dark">
            Забрать
          </button>
        </motion.div>
      )}
    </div>
  );
}
