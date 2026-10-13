import { useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FlippableCard } from "../cards/FlippableCard";
import { haptics } from "../../lib/telegram";
import { useOpenPack, useQuickSell } from "../../lib/queries";
import type { Card, PackDef, Rarity } from "../../types/game";
import { PackBox } from "./PackBox";

interface Props {
  pack: PackDef;
  onClose: () => void;
}

type Phase = "shaking" | "flash" | "revealing" | "summary";

const REVEAL_RARITIES: Rarity[] = ["GOLD", "LEGEND", "ICON"];

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

export function PackOpeningModal({ pack, onClose }: Props) {
  const queryClient = useQueryClient();
  const openPack = useOpenPack();
  const quickSell = useQuickSell();

  const [phase, setPhase] = useState<Phase>("shaking");
  const [revealedCount, setRevealedCount] = useState(0);
  const existingPlayerIds = useRef(
    new Set((queryClient.getQueryData<Card[]>(["cards"]) ?? []).map((c) => c.playerId)),
  );

  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      openPack.mutate(pack.id);
    }
    const shakeTimer = setTimeout(() => setPhase("flash"), 1100);
    return () => clearTimeout(shakeTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "flash") return;
    const timer = setTimeout(() => setPhase("revealing"), 350);
    return () => clearTimeout(timer);
  }, [phase]);

  const cards = openPack.data?.cards ?? [];

  useEffect(() => {
    if (phase !== "revealing" || cards.length === 0) return;
    if (revealedCount >= cards.length) {
      const timer = setTimeout(() => setPhase("summary"), 400);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      const card = cards[revealedCount];
      if (REVEAL_RARITIES.includes(card.rarity)) {
        fireConfetti(card.rarity);
        haptics.notify("success");
      } else {
        haptics.impact("light");
      }
      setRevealedCount((n) => n + 1);
    }, 650);
    return () => clearTimeout(timer);
  }, [phase, revealedCount, cards]);

  const duplicates = cards.filter((c) => existingPlayerIds.current.has(c.playerId));

  function handleSellDuplicates() {
    duplicates.forEach((c) => quickSell.mutate(c.id));
  }

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

      {(phase === "revealing" || phase === "summary") && cards.length > 0 && (
        <div className="flex w-full flex-col items-center gap-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {cards.map((card, i) => (
              <FlippableCard key={card.id} card={card} revealed={i < revealedCount} size="sm" />
            ))}
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
              <button
                onClick={onClose}
                className="rounded-full bg-gold px-5 py-3 text-sm font-extrabold text-pitch-dark"
              >
                Забрать всё
              </button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
