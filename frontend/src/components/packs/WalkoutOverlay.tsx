import { motion } from "framer-motion";
import type { Card } from "../../types/game";

interface Props {
  card: Card;
}

export function WalkoutOverlay({ card }: Props) {
  const { player } = card;

  return (
    <motion.div
      className="fixed inset-0 z-[95] flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        background: `radial-gradient(circle at 50% 38%, ${player.club.colorPrimary} 0%, ${player.club.colorSecondary}55 42%, #000 100%)`,
      }}
    >
      <motion.div
        className="absolute inset-0 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.55 }}
      />

      <motion.span
        className="relative text-[110px] leading-none drop-shadow-2xl"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.5, ease: "backOut" }}
      >
        {player.nationFlag}
      </motion.span>

      <motion.p
        className="relative mt-3 text-xl font-black uppercase tracking-widest text-white drop-shadow-lg"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45 }}
      >
        ⭐ Выход звезды! ⭐
      </motion.p>

      <motion.p
        className="relative mt-1 text-sm font-bold text-white/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65 }}
      >
        {player.club.name}
      </motion.p>
    </motion.div>
  );
}
