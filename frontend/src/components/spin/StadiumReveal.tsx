import { motion } from "framer-motion";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { StadiumCardView } from "../cards/StadiumCardView";
import { RARITY_THEME } from "../cards/rarityTheme";
import { sfx } from "../../lib/sfx";
import { haptics } from "../../lib/telegram";
import type { StadiumCard } from "../../types/game";

interface Props {
  stadiumCard: StadiumCard;
}

const TOP_TIER = new Set(["LEGEND", "ICON"]);

/** "Голографический проектор": лучи света из-под карты + разлёт частиц — для выдачи стадиона из кейса/спина. */
export function StadiumReveal({ stadiumCard }: Props) {
  const rarity = stadiumCard.stadium.rarity;
  const theme = RARITY_THEME[rarity];
  const isTopTier = TOP_TIER.has(rarity);

  useEffect(() => {
    if (isTopTier) {
      sfx.fanfare();
      haptics.notify("success");
      confetti({
        particleCount: rarity === "ICON" ? 160 : 110,
        spread: 90,
        origin: { y: 0.45 },
        colors: rarity === "ICON" ? ["#ff3b5c", "#ffffff"] : ["#b24bf3", "#ffffff"],
      });
    } else {
      sfx.chime();
      haptics.impact("medium");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative flex flex-col items-center gap-4">
      {/* Вращающиеся лучи проектора позади карты */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, ${theme.borderColor}55 20deg, transparent 40deg, transparent 180deg, ${theme.borderColor}40 200deg, transparent 220deg, transparent 360deg)`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />
      {/* Луч-конус снизу, как из проектора */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-56 w-40 -translate-x-1/2 -translate-y-1/2"
        style={{
          background: `radial-gradient(ellipse at 50% 100%, ${theme.borderColor}45 0%, transparent 70%)`,
        }}
        initial={{ opacity: 0, scaleY: 0.5 }}
        animate={{ opacity: [0, 0.9, 0.6], scaleY: [0.5, 1.1, 1] }}
        transition={{ duration: 0.8 }}
      />

      <motion.div
        initial={{ scale: 0.3, opacity: 0, rotateY: -90 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 16 }}
        style={{ perspective: 1000 }}
      >
        <StadiumCardView stadiumCard={stadiumCard} size="lg" />
      </motion.div>
    </div>
  );
}
