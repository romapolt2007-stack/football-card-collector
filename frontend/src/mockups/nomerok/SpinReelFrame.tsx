import confetti from "canvas-confetti";
import { motion, useAnimate } from "framer-motion";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { RARITY_THEME } from "../../components/cards/rarityTheme";
import { haptics } from "../../lib/telegram";
import { sfx } from "../../lib/sfx";
import type { Rarity } from "../../types/game";
import { MOCK_PANEL } from "./theme";

const ALL_RARITIES: Rarity[] = ["BRONZE", "SILVER", "GOLD", "LEGEND", "ICON"];
const TOP_TIER: Rarity[] = ["LEGEND", "ICON"];

const ITEM_HEIGHT = 92;
const STRIP_LENGTH = 36;
const WINNER_INDEX = 30;
const TOTAL_DURATION_MS = 3000;

interface Props {
  /** Итоговая редкость — уже известна (с сервера или замокана) до старта анимации, как в боевом SpinReel.tsx. */
  rarity: Rarity;
  /** Содержимое развёрнутой карточки результата. */
  resultNode: ReactNode;
  onDone: () => void;
}

/** Общий "движок" барабана ("карточка в карточке") для Экрана 1 — переиспользуется и реальным,
 * и ещё-моковым (Стадионы) результатом спина. Лента мини-карточек редкости крутится в рамке,
 * рамка светится цветом текущей редкости: разгон → крейсерская скорость → лёгкая заминка-"зацепка"
 * → промах мимо победной карты → возврат на неё. Топ-редкости получают более глубокий промах.
 * Золотая окантовка и стрелки-указатели на центральной линии остаются (без мигающих точек по
 * периметру — убраны по отзыву). Топ-редкости — конфетти + фанфары.
 *
 * Прокрутка ленты проигрывается через императивный animate() (useAnimate), а не декларативным
 * props `animate`/`transition` с массивом keyframes — Framer Motion v11 не наследует внешний
 * `duration` для transition конкретного свойства (transition.y), из-за чего при многосегментном
 * keyframe-массиве лента реально крутилась ~0.7с независимо от TOTAL_DURATION_MS. Явные
 * последовательные animate()-вызовы с собственной длительностью каждого — надёжны. */
export function SpinReelFrame({ rarity, resultNode, onDone }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stripScope, animateStrip] = useAnimate();
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

  function handleSettled() {
    tickerCancelRef.current?.();
    if (isTopTier) {
      sfx.fanfare();
      haptics.notify("success");
      confetti({
        particleCount: rarity === "ICON" ? 160 : 110,
        spread: 85,
        origin: { y: 0.4 },
        colors: rarity === "ICON" ? ["#ff3b5c", "#ffd166", "#ffffff"] : ["#b24bf3", "#ffd166", "#ffffff"],
      });
    } else {
      sfx.thud();
      haptics.impact("light");
    }
    setRevealed(true);
    window.setTimeout(onDone, 700);
  }

  useEffect(() => {
    if (!containerHeight || hasLaunchedRef.current) return;
    hasLaunchedRef.current = true;
    sfx.launch();
    haptics.impact("medium");
    tickerCancelRef.current = sfx.reelTicker(TOTAL_DURATION_MS);

    const targetY = -(WINNER_INDEX * ITEM_HEIGHT + ITEM_HEIGHT / 2 - containerHeight / 2);
    const hitchY = targetY * 0.58 + ITEM_HEIGHT * 0.25; // лёгкая заминка на подходе — чуть отстаёт от "идеальной" траектории
    const overshootY = targetY - ITEM_HEIGHT * (isTopTier ? 1.35 : 0.55);
    let cancelled = false;

    async function run() {
      const el = stripScope.current;
      if (!el) return;
      await animateStrip(el, { y: hitchY }, { duration: (TOTAL_DURATION_MS * 0.52) / 1000, ease: [0.1, 0.55, 0.2, 1] });
      if (cancelled) return;
      await animateStrip(el, { y: overshootY }, { duration: (TOTAL_DURATION_MS * 0.34) / 1000, ease: [0.45, 0, 0.55, 1] });
      if (cancelled) return;
      await animateStrip(el, { y: targetY }, { duration: (TOTAL_DURATION_MS * 0.14) / 1000, ease: [0.34, 1.56, 0.64, 1] });
      if (cancelled) return;
      handleSettled();
    }
    void run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerHeight]);

  return (
    <motion.div
      ref={containerRef}
      className="relative h-[220px] w-[170px] overflow-hidden rounded-[18px] border-[3px]"
      style={{
        background: MOCK_PANEL,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 0 0 5px #2a1d05, 0 0 0 6px rgba(255,209,102,0.55), 0 0 26px 2px ${theme.borderColor}55`,
      }}
      animate={containerHeight ? { borderColor: borderColorSequence, scale: [1, 1.015, 1, 1.015, 1] } : undefined}
      transition={{ duration: TOTAL_DURATION_MS / 1000, ease: "linear" }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex h-[2px] -translate-y-1/2 items-center justify-between">
        <span className="-ml-1 h-0 w-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-gold" />
        <span className="h-full flex-1 bg-gold/70" />
        <span className="-mr-1 h-0 w-0 border-y-[5px] border-r-[7px] border-y-transparent border-r-gold" />
      </div>
      <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.8)_0%,transparent_30%,transparent_70%,rgba(0,0,0,0.8)_100%)]" />

      {!revealed ? (
        <div ref={stripScope} className="flex flex-col">
          {strip.map((r, i) => (i === WINNER_INDEX ? <MiniCard key={i} rarity={r} faceDown /> : <MiniCard key={i} rarity={r} />))}
        </div>
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
