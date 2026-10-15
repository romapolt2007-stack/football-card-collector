import { motion } from "framer-motion";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { RARITY_THEME } from "../cards/rarityTheme";
import { haptics } from "../../lib/telegram";
import { sfx } from "../../lib/sfx";
import type { Rarity } from "../../types/game";

const ALL_RARITIES: Rarity[] = ["BRONZE", "SILVER", "GOLD", "LEGEND", "ICON"];
const ITEM_WIDTH = 72;
const STRIP_LENGTH = 40;
const WINNER_INDEX = 34;
const TOTAL_DURATION_MS = 3400;
const TOP_TIER: Rarity[] = ["LEGEND", "ICON"];

interface Props {
  targetRarity: Rarity;
  onDone: () => void;
}

/** Лента редкостей, крутится и тормозит точно на targetRarity — результат уже определён сервером, анимация только показывает его. */
export function SpinReel({ targetRarity, onDone }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const hasLaunchedRef = useRef(false);
  const isTopTier = TOP_TIER.includes(targetRarity);

  const strip = useMemo(
    () =>
      Array.from({ length: STRIP_LENGTH }, (_, i) =>
        i === WINNER_INDEX ? targetRarity : ALL_RARITIES[Math.floor(Math.random() * ALL_RARITIES.length)],
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useLayoutEffect(() => {
    if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
  }, []);

  useEffect(() => {
    if (containerWidth && !hasLaunchedRef.current) {
      hasLaunchedRef.current = true;
      sfx.launch();
      haptics.impact("medium");
    }
  }, [containerWidth]);

  const targetX = -(WINNER_INDEX * ITEM_WIDTH + ITEM_WIDTH / 2 - containerWidth / 2);
  const overshootX = targetX - ITEM_WIDTH * 0.5;

  function handleDone() {
    if (isTopTier) {
      sfx.fanfare();
      haptics.notify("success");
    } else {
      sfx.thud();
      haptics.impact("light");
    }
    onDone();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={containerRef} className="relative w-full max-w-sm overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-1 -translate-x-1/2 rounded-full bg-gold" />
        <motion.div
          className="flex gap-2 py-1"
          initial={{ x: 0 }}
          animate={containerWidth ? { x: isTopTier ? [0, overshootX, targetX] : [0, targetX] } : { x: 0 }}
          transition={
            containerWidth
              ? {
                  duration: TOTAL_DURATION_MS / 1000,
                  x: isTopTier
                    ? { times: [0, 0.88, 1], ease: [[0.11, 0.58, 0.18, 1], [0.34, 1.56, 0.64, 1]] }
                    : { ease: [0.11, 0.58, 0.18, 1] },
                }
              : { duration: 0 }
          }
          onAnimationComplete={handleDone}
        >
          {strip.map((rarity, i) => {
            const theme = RARITY_THEME[rarity];
            return (
              <div
                key={i}
                className="flex h-20 w-[64px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2"
                style={{ background: theme.background, borderColor: theme.borderColor }}
              >
                <span className="text-lg">{theme.emoji}</span>
                <span className="text-[9px] font-bold" style={{ color: theme.textColor }}>
                  {theme.label}
                </span>
              </div>
            );
          })}
        </motion.div>
      </div>
      <p className="text-xs text-white/40">Крутим...</p>
    </div>
  );
}
