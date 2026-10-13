import { useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FlippableCard } from "../cards/FlippableCard";
import { haptics } from "../../lib/telegram";
import { sfx } from "../../lib/sfx";
import { useOpenPack, useQuickSell } from "../../lib/queries";
import type { Card, PackDef, Rarity } from "../../types/game";
import { PackBox } from "./PackBox";
import { WalkoutOverlay } from "./WalkoutOverlay";

interface Props {
  pack: PackDef;
  onClose: () => void;
  onOpenAnother?: () => void;
  canOpenAnother?: boolean;
}

type Phase = "shaking" | "flash" | "dropping" | "interactive" | "summary";

const CONFETTI_RARITIES: Rarity[] = ["GOLD", "LEGEND", "ICON"];
const DROP_STAGGER_MS = 380;

function isWalkout(card: Card): boolean {
  return card.rarity === "ICON" || card.player.overall >= 90;
}

function fireConfetti(rarity: Rarity) {
  const particleCount = rarity === "ICON" ? 160 : rarity === "LEGEND" ? 110 : 70;
  confetti({
    particleCount,
    spread: 80,
    origin: { y: 0.4 },
    colors:
      rarity === "ICON"
        ? ["#ff3b5c", "#ffffff"]
        : rarity === "LEGEND"
          ? ["#b24bf3", "#ffffff"]
          : ["#ffd166", "#ffffff"],
  });
}

export function PackOpeningModal({ pack, onClose, onOpenAnother, canOpenAnother }: Props) {
  const queryClient = useQueryClient();
  const openPack = useOpenPack();
  const quickSell = useQuickSell();

  const [phase, setPhase] = useState<Phase>("shaking");
  const [droppedCount, setDroppedCount] = useState(0);
  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());
  const [walkoutCard, setWalkoutCard] = useState<Card | null>(null);

  const existingPlayerIds = useRef(
    new Set((queryClient.getQueryData<Card[]>(["cards"]) ?? []).map((c) => c.playerId)),
  );
  const hasStartedRef = useRef(false);

  // Фаза 1: пак трясётся в руках, затем с треском вскрывается.
  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      openPack.mutate(pack.id);
    }
    const shakeTimer = setTimeout(() => {
      sfx.crackle();
      haptics.impact("heavy");
      setPhase("flash");
    }, 1100);
    return () => clearTimeout(shakeTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "flash") return;
    const timer = setTimeout(() => setPhase("dropping"), 350);
    return () => clearTimeout(timer);
  }, [phase]);

  const cards = openPack.data?.cards ?? [];

  // Фаза 2: карты вылетают из пака по одной, рубашкой вверх.
  useEffect(() => {
    if (phase !== "dropping" || cards.length === 0) return;
    if (droppedCount >= cards.length) {
      setPhase("interactive");
      return;
    }
    const timer = setTimeout(() => {
      sfx.whoosh();
      haptics.impact("light");
      setDroppedCount((n) => n + 1);
    }, DROP_STAGGER_MS);
    return () => clearTimeout(timer);
  }, [phase, droppedCount, cards.length]);

  // Фаза 4: все карты открыты — идём на итоговый экран.
  useEffect(() => {
    if (phase !== "interactive" || cards.length === 0) return;
    if (flippedIds.size < cards.length) return;
    const timer = setTimeout(() => setPhase("summary"), 500);
    return () => clearTimeout(timer);
  }, [phase, flippedIds, cards.length]);

  function handleFlip(card: Card) {
    if (flippedIds.has(card.id) || walkoutCard) return;

    if (isWalkout(card)) {
      sfx.fanfare();
      haptics.notify("success");
      fireConfetti(card.rarity === "ICON" ? "ICON" : "LEGEND");
      setWalkoutCard(card);
      setTimeout(() => {
        setWalkoutCard(null);
        setFlippedIds((prev) => new Set(prev).add(card.id));
      }, 1700);
      return;
    }

    if (CONFETTI_RARITIES.includes(card.rarity)) {
      sfx.chime();
      haptics.notify("success");
      fireConfetti(card.rarity);
    } else {
      sfx.tick();
      haptics.impact("light");
    }
    setFlippedIds((prev) => new Set(prev).add(card.id));
  }

  const duplicates = cards.filter((c) => existingPlayerIds.current.has(c.playerId));

  function handleSellDuplicates() {
    duplicates.forEach((c) => quickSell.mutate(c.id));
  }

  const allFlipped = cards.length > 0 && flippedIds.size === cards.length;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-black/80 px-6">
      <AnimatePresence>
        {(phase === "shaking" || phase === "flash") && (
          <motion.div exit={{ opacity: 0, scale: 0.8 }} className="flex flex-col items-center gap-6">
            <PackBox pack={pack} shaking={phase === "shaking"} />
            {openPack.isError && (
              <p className="max-w-xs text-center text-sm text-red-400">
                {(openPack.error as Error)?.message ?? "Не удалось открыть пак"}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {phase === "flash" && (
        <motion.div
          className="fixed inset-0 bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.35 }}
        />
      )}

      {(phase === "dropping" || phase === "interactive" || phase === "summary") && cards.length > 0 && (
        <div className="flex w-full flex-col items-center gap-6">
          {phase === "interactive" && !allFlipped && (
            <p className="flip-hint text-xs font-semibold text-white/60">
              Нажмите или свайпните карту, чтобы перевернуть
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            {cards.map((card, i) => {
              const dropped = i < droppedCount || phase === "interactive" || phase === "summary";
              const flipped = flippedIds.has(card.id);
              return (
                <motion.div
                  key={card.id}
                  initial={{ y: -60, opacity: 0, scale: 0.6 }}
                  animate={dropped ? { y: 0, opacity: 1, scale: 1 } : { y: -60, opacity: 0, scale: 0.6 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  drag={!flipped && dropped}
                  dragElastic={0.5}
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  onDragEnd={(_, info) => {
                    if (!flipped && (Math.abs(info.offset.x) > 36 || Math.abs(info.offset.y) > 36)) handleFlip(card);
                  }}
                  onClick={() => dropped && handleFlip(card)}
                  whileTap={dropped && !flipped ? { scale: 0.95 } : undefined}
                  className={dropped && !flipped ? "cursor-pointer" : undefined}
                >
                  <FlippableCard card={card} revealed={flipped} size="sm" showRarityBack />
                </motion.div>
              );
            })}
          </div>

          {phase === "summary" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex w-full max-w-xs flex-col gap-3"
            >
              {duplicates.length > 0 && (
                <button
                  onClick={handleSellDuplicates}
                  disabled={quickSell.isPending}
                  className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white"
                >
                  Продать дубликаты ({duplicates.length})
                </button>
              )}
              {onOpenAnother && canOpenAnother && (
                <button
                  onClick={onOpenAnother}
                  className="rounded-full border border-gold/50 bg-gold/15 px-5 py-3 text-sm font-semibold text-gold"
                >
                  Открыть ещё один
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-full bg-gold px-5 py-3 text-sm font-extrabold text-pitch-dark"
              >
                Сохранить всё
              </button>
            </motion.div>
          )}
        </div>
      )}

      <AnimatePresence>{walkoutCard && <WalkoutOverlay card={walkoutCard} />}</AnimatePresence>
    </div>
  );
}
