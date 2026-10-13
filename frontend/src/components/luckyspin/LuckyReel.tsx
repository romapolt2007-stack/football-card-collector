import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FlippableCard } from "../cards/FlippableCard";
import { RARITY_THEME } from "../cards/rarityTheme";
import { haptics } from "../../lib/telegram";
import { sfx } from "../../lib/sfx";
import { useQuickSell } from "../../lib/queries";
import type { Card, Rarity } from "../../types/game";

const ITEM_WIDTH = 76; // 68px-карта + gap-2 (8px)
const STRIP_LENGTH = 36;
const WINNER_INDEX = 30;
const ALL_RARITIES: Rarity[] = ["BRONZE", "SILVER", "GOLD", "LEGEND", "ICON"];
const TOP_TIER: Rarity[] = ["LEGEND", "ICON"];

/**
 * Тайминги анимации (от нажатия «Крутить» до кнопок под картой):
 *
 *   t=0ms      — sfx.launch() + импакт-хаптик, лента трогается с места
 *   t=0–4200ms — единая анимация x: лента едет и тормозит (easing [0.11,0.58,0.18,1]);
 *                для топ-карты (LEGEND/ICON) добавлен 3-й keyframe — лента
 *                проезжает цель на 0.55 ширины карты и откатывается назад
 *                (times [0, 0.88, 1], 2-й отрезок — пружинный bounce-easing)
 *   параллельно — blur(0→9→9→0)px по времени [0, 0.12, 0.6, 0.92] от общей
 *                длительности: резкий разгон блюра, долгая "мёртвая" фаза
 *                на крейсерской скорости, чистое изображение к моменту тормоза
 *   на каждый тик — щелчок при пересечении карточкой центрального маркера,
 *                считается из реальной позиции x (не по таймеру): далеко от
 *                победной карты — лёгкий tick()+selectionChanged, в последних
 *                3 карточках — тяжелеющий reelLandTick()+impact(medium/heavy)
 *   t=4200ms   — onAnimationComplete → handleLanded():
 *     • LEGEND/ICON: экран темнеет (180ms) → вспышка/искры + fanfare()
 *       + конфетти (ещё +470ms) → карта всплывает с scale-pop и свечением
 *       (итого ~950ms до появления статов)
 *     • GOLD: sfx.chime() + конфетти, карта сразу всплывает
 *     • BRONZE/SILVER: глухой sfx.thud(), карта сразу всплывает
 *   +300ms после появления карты — переворот рубашкой и показ статов
 */
const TOTAL_DURATION_MS = 4200;
const OVERSHOOT_PX = ITEM_WIDTH * 0.55;

function fireConfetti(rarity: Rarity) {
  const particleCount = rarity === "ICON" ? 160 : rarity === "LEGEND" ? 120 : 70;
  confetti({
    particleCount,
    spread: 85,
    origin: { y: 0.4 },
    colors:
      rarity === "ICON"
        ? ["#ff3b5c", "#ffffff"]
        : rarity === "LEGEND"
          ? ["#b24bf3", "#ffffff"]
          : ["#ffd166", "#ffffff"],
  });
}

function Tile({ rarity, active }: { rarity: Rarity; active: boolean }) {
  const theme = RARITY_THEME[rarity];
  return (
    <motion.div
      className="flex h-20 w-[68px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2"
      style={{ background: theme.background, borderColor: theme.borderColor }}
      animate={{
        scale: active ? 1.16 : 1,
        boxShadow: active ? `0 0 18px ${theme.borderColor}` : "0 0 0px transparent",
      }}
      transition={{ duration: 0.15 }}
    >
      <span className="text-lg">{theme.emoji}</span>
      <span className="text-[10px] font-bold" style={{ color: theme.textColor }}>
        {theme.label}
      </span>
    </motion.div>
  );
}

interface Props {
  card: Card;
  wasPity: boolean;
  onDone: () => void;
}

export function LuckyReel({ card, wasPity, onDone }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [spinning, setSpinning] = useState(true);
  const [centerIndex, setCenterIndex] = useState(-1);
  const [dimming, setDimming] = useState(false);
  const [sparking, setSparking] = useState(false);
  const [landed, setLanded] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const quickSell = useQuickSell();

  const isTopTier = TOP_TIER.includes(card.rarity);
  const hasLaunchedRef = useRef(false);
  const lastTickIndexRef = useRef(-1);

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

  useEffect(() => {
    if (containerWidth && !hasLaunchedRef.current) {
      hasLaunchedRef.current = true;
      sfx.launch();
      haptics.impact("medium");
    }
  }, [containerWidth]);

  const targetX = -(WINNER_INDEX * ITEM_WIDTH + ITEM_WIDTH / 2 - containerWidth / 2);
  const overshootX = targetX - OVERSHOOT_PX;

  function indexAtX(x: number): number {
    return Math.round((containerWidth / 2 - ITEM_WIDTH / 2 - x) / ITEM_WIDTH);
  }

  function handleUpdate(latest: { x?: number }) {
    if (!containerWidth || landed) return;
    const x = typeof latest.x === "number" ? latest.x : 0;
    const idx = indexAtX(x);
    if (idx === lastTickIndexRef.current || idx < 0 || idx >= STRIP_LENGTH) return;
    lastTickIndexRef.current = idx;
    setCenterIndex(idx);

    const distance = WINNER_INDEX - idx;
    if (distance >= 0 && distance <= 3) {
      sfx.reelLandTick(distance);
      haptics.impact(distance === 0 ? "heavy" : "medium");
    } else {
      sfx.tick();
      haptics.select();
    }
  }

  function handleLanded() {
    if (!containerWidth) return;
    setSpinning(false);

    if (isTopTier) {
      setDimming(true);
      setTimeout(() => {
        setSparking(true);
        sfx.fanfare();
        haptics.notify("success");
        fireConfetti(card.rarity);
      }, 180);
      setTimeout(() => {
        setDimming(false);
        setSparking(false);
        setLanded(true);
      }, 650);
      setTimeout(() => setRevealed(true), 950);
    } else {
      if (card.rarity === "GOLD") {
        sfx.chime();
        haptics.notify("success");
        fireConfetti("GOLD");
      } else {
        sfx.thud();
        haptics.impact("light");
      }
      setLanded(true);
      setTimeout(() => setRevealed(true), 300);
    }
  }

  function handleSell() {
    haptics.impact("medium");
    quickSell.mutate(card.id, { onSuccess: onDone });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {wasPity && <p className="animate-pulse text-sm font-extrabold text-gold">⭐ УДАЧА x5! ⭐</p>}

      <div ref={containerRef} className="relative w-full overflow-hidden">
        <div
          className={`pointer-events-none absolute inset-y-0 left-1/2 z-10 w-1 -translate-x-1/2 rounded-full bg-gold ${
            spinning ? "marker-pulse" : ""
          }`}
        />
        <motion.div
          className="flex gap-2 py-1"
          initial={{ x: 0, filter: "blur(0px)" }}
          animate={
            containerWidth
              ? {
                  x: isTopTier ? [0, overshootX, targetX] : [0, targetX],
                  filter: ["blur(0px)", "blur(9px)", "blur(9px)", "blur(0px)"],
                }
              : { x: 0 }
          }
          transition={
            containerWidth
              ? {
                  duration: TOTAL_DURATION_MS / 1000,
                  x: isTopTier
                    ? { times: [0, 0.88, 1], ease: [[0.11, 0.58, 0.18, 1], [0.34, 1.56, 0.64, 1]] }
                    : { ease: [0.11, 0.58, 0.18, 1] },
                  filter: { times: [0, 0.12, 0.6, 0.92], ease: "linear" },
                }
              : { duration: 0 }
          }
          onUpdate={handleUpdate}
          onAnimationComplete={handleLanded}
        >
          {strip.map((rarity, i) => (
            <Tile key={i} rarity={rarity} active={i === centerIndex} />
          ))}
        </motion.div>
      </div>

      <AnimatePresence>
        {dimming && (
          <motion.div
            className="fixed inset-0 z-[95] flex items-center justify-center bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.82 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {sparking && (
              <div
                className="spark-burst pointer-events-none h-40 w-40 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${RARITY_THEME[card.rarity].borderColor} 0%, transparent 70%)`,
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {landed && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: isTopTier ? 0.7 : 1 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={isTopTier ? { type: "spring", stiffness: 260, damping: 18 } : { duration: 0.3 }}
          className="relative flex flex-col items-center gap-4"
        >
          {isTopTier && (
            <div
              className="pointer-events-none absolute -z-10 h-56 w-56 rounded-full blur-2xl"
              style={{ background: RARITY_THEME[card.rarity].borderColor, opacity: 0.35 }}
            />
          )}

          <FlippableCard card={card} revealed={revealed} size="md" showRarityBack />

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
