import { motion } from "framer-motion";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { RARITY_THEME } from "../../components/cards/rarityTheme";
import { haptics } from "../../lib/telegram";
import { sfx } from "../../lib/sfx";
import type { Rarity } from "../../types/game";
import { MOCK_PANEL } from "./theme";

const ALL_RARITIES: Rarity[] = ["BRONZE", "SILVER", "GOLD", "LEGEND", "ICON"];
const TOP_TIER: Rarity[] = ["LEGEND", "ICON"];

const ITEM_HEIGHT = 92;
const STRIP_LENGTH = 50;
const WINNER_INDEX = 42;
const TOTAL_DURATION_MS = 5600;

interface Props {
  /** Итоговая редкость — уже известна (с сервера или замокана) до старта анимации, как в боевом SpinReel.tsx. */
  rarity: Rarity;
  /** Содержимое развёрнутой карточки результата. */
  resultNode: ReactNode;
  onDone: () => void;
}

/** Общий "движок" барабана ("карточка в карточке") для Экрана 1 — переиспользуется и реальным,
 * и ещё-моковым (Стадионы) результатом спина. Лента мини-карточек редкости крутится в рамке,
 * рамка светится цветом текущей редкости. Длиннее и с бóльшим "драматизмом", чем раньше: разгон →
 * крейсерская скорость → лёгкая заминка-"зацепка" → промах мимо победной карты → возврат на неё.
 * Топ-редкости получают более глубокий промах и доп. паузу перед разворотом. */
export function SpinReelFrame({ rarity, resultNode, onDone }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const hasLaunchedRef = useRef(false);
  const tickerCancelRef = useRef<(() => void) | null>(null);

  const isTopTier = TOP_TIER.includes(rarity);
  const theme = RARITY_THEME[rarity];

  const strip = useMemo(
    () => Array.from({ length: STRIP_LENGTH }, (_, i) => (i === WINNER_INDEX ? rarity : ALL_RARITIES[Math.floor(Math.random() * ALL_RARITIES.length)])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const borderColorSequence = useMemo(() => {
    const seq = strip.filter((_, i) => i % 2 === 0).map((r) => RARITY_THEME[r].borderColor);
    seq.push(theme.borderColor, theme.borderColor, theme.borderColor);
    return seq;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (containerRef.current) setContainerHeight(containerRef.current.offsetHeight);
  }, []);

  useEffect(() => {
    if (containerHeight && !hasLaunchedRef.current) {
      hasLaunchedRef.current = true;
      sfx.launch();
      haptics.impact("medium");
      tickerCancelRef.current = sfx.reelTicker(TOTAL_DURATION_MS);
    }
    return () => tickerCancelRef.current?.();
  }, [containerHeight]);

  const targetY = -(WINNER_INDEX * ITEM_HEIGHT + ITEM_HEIGHT / 2 - containerHeight / 2);
  const hitchY = targetY * 0.58 + ITEM_HEIGHT * 0.25; // лёгкая заминка на подходе — чуть отстаёт от "идеальной" траектории
  const overshootY = targetY - ITEM_HEIGHT * (isTopTier ? 1.35 : 0.55);

  function handleSettled() {
    tickerCancelRef.current?.();
    if (isTopTier) {
      sfx.fanfare();
      haptics.notify("success");
    } else {
      sfx.thud();
      haptics.impact("light");
    }
    setRevealed(true);
    window.setTimeout(onDone, 1000);
  }

  return (
    <motion.div
      ref={containerRef}
      className="relative h-[220px] w-[170px] overflow-hidden rounded-[20px] border-[3px]"
      style={{ background: MOCK_PANEL, boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 0 26px 2px ${theme.borderColor}55` }}
      animate={containerHeight ? { borderColor: borderColorSequence, scale: [1, 1.015, 1, 1.015, 1] } : undefined}
      transition={{ duration: TOTAL_DURATION_MS / 1000, ease: "linear" }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-[2px] -translate-y-1/2 bg-white/50" />
      <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.8)_0%,transparent_30%,transparent_70%,rgba(0,0,0,0.8)_100%)]" />

      {!revealed ? (
        <motion.div
          className="flex flex-col"
          initial={{ y: 0 }}
          animate={containerHeight ? { y: [0, hitchY, overshootY, targetY] } : { y: 0 }}
          transition={
            containerHeight
              ? {
                  duration: TOTAL_DURATION_MS / 1000,
                  y: {
                    times: [0, 0.52, 0.86, 1],
                    ease: [
                      [0.1, 0.55, 0.2, 1],
                      [0.45, 0, 0.55, 1],
                      [0.34, 1.56, 0.64, 1],
                    ],
                  },
                }
              : { duration: 0 }
          }
          onAnimationComplete={handleSettled}
        >
          {strip.map((r, i) => (i === WINNER_INDEX ? <MiniCard key={i} rarity={r} faceDown /> : <MiniCard key={i} rarity={r} />))}
        </motion.div>
      ) : (
        <div className="flex h-full items-center justify-center">
          <motion.div
            initial={{ rotateY: 180, scale: 0.9 }}
            animate={{ rotateY: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ perspective: 800, transformStyle: "preserve-3d" }}
          >
            {resultNode}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function MiniCard({ rarity, faceDown }: { rarity: Rarity; faceDown?: boolean }) {
  const theme = RARITY_THEME[rarity];

  if (faceDown) {
    return (
      <div className="flex shrink-0 items-center justify-center" style={{ height: ITEM_HEIGHT, background: `linear-gradient(160deg, ${theme.borderColor}33, transparent)` }}>
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 text-2xl" style={{ borderColor: theme.borderColor, background: "rgba(0,0,0,0.4)" }}>
          ❔
        </div>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center justify-center gap-2" style={{ height: ITEM_HEIGHT, background: `linear-gradient(160deg, ${theme.borderColor}22, transparent)` }}>
      <span className="text-xl opacity-70">{theme.emoji}</span>
      <span className="text-xs font-bold opacity-50" style={{ color: theme.borderColor }}>
        {theme.label}
      </span>
    </div>
  );
}
