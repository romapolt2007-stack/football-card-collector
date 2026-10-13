import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { haptics } from "../../lib/telegram";
import { sfx } from "../../lib/sfx";
import type { CaseDef, CasePrize, CasePrizeDef } from "../../types/game";
import { CASE_THEME } from "./caseTheme";
import { ITEM_WIDTH, ReelItem } from "./ReelItem";

const STRIP_LENGTH = 40;
const WINNER_INDEX = 33;
const SPIN_DURATION_MS = 4500;
const BIG_WIN_RARITIES = ["LEGEND", "ICON"];

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

function isBigWin(prize: CasePrize): boolean {
  return prize.type === "JACKPOT" || (!!prize.card && BIG_WIN_RARITIES.includes(prize.card.rarity));
}

export function CaseRoulette({ caseDef, prize, onDone }: Props) {
  const theme = CASE_THEME[caseDef.id] ?? CASE_THEME.common;
  const containerRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const hapticsFiredRef = useRef(false);
  const tickerCancelRef = useRef<(() => void) | null>(null);

  const strip = useMemo(() => {
    const winnerDef = prizeToDef(prize, caseDef.prizes);
    return Array.from({ length: STRIP_LENGTH }, (_, i) =>
      i === WINNER_INDEX ? winnerDef : randomFiller(caseDef.prizes),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Измеряем реальную ширину после монтирования — offsetWidth во время рендера
  // ещё null (ref не привязан), иначе лента целится по заглушке и приз
  // останавливается не под указателем.
  useLayoutEffect(() => {
    if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
  }, []);

  // Тиканье рулетки, замедляющееся к концу — нарастающее напряжение перед призом.
  useEffect(() => {
    if (!containerWidth) return;
    tickerCancelRef.current = sfx.reelTicker(SPIN_DURATION_MS);
    return () => tickerCancelRef.current?.();
  }, [containerWidth]);

  const targetX = -(WINNER_INDEX * ITEM_WIDTH + ITEM_WIDTH / 2 - containerWidth / 2);

  function handleComplete() {
    if (!containerWidth) return;
    tickerCancelRef.current?.();

    if (isBigWin(prize)) {
      sfx.fanfare();
      haptics.notify("success");
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.4 },
        colors: ["#ffd166", "#b24bf3", "#ffffff"],
      });
    } else {
      sfx.chime();
      haptics.notify("success");
    }
    setDone(true);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-2xl border-2 p-1"
        style={{ borderColor: theme.borderColor, boxShadow: theme.glow }}
      >
        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-0.5 -translate-x-1/2 bg-gold" />
        <motion.div
          className="flex gap-2 py-1"
          initial={{ x: 0 }}
          animate={containerWidth ? { x: targetX } : { x: 0 }}
          transition={{ duration: SPIN_DURATION_MS / 1000, ease: [0.12, 0.65, 0.2, 1] }}
          onUpdate={(latest) => {
            if (!containerWidth) return;
            const x = typeof latest.x === "number" ? latest.x : 0;
            if (!hapticsFiredRef.current && x < targetX + ITEM_WIDTH * 1.5) {
              hapticsFiredRef.current = true;
              haptics.impact("light");
            }
          }}
          onAnimationComplete={handleComplete}
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
          <p className={`text-sm font-semibold ${isBigWin(prize) ? "text-gold" : "text-white/70"}`}>
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
