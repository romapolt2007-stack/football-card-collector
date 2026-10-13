import { motion } from "framer-motion";
import type { PackDef } from "../../types/game";
import { PACK_THEME } from "./packTheme";

interface Props {
  pack: PackDef;
  shaking?: boolean;
}

export function PackBox({ pack, shaking }: Props) {
  const theme = PACK_THEME[pack.id] ?? PACK_THEME.bronze;

  return (
    <motion.div
      className="flex h-56 w-40 flex-col items-center justify-center rounded-2xl border-2 shadow-2xl"
      style={{ background: theme.background, borderColor: theme.borderColor }}
      animate={
        shaking
          ? { rotate: [0, -6, 6, -6, 6, -3, 3, 0], scale: [1, 1.03, 1, 1.04, 1, 1.02, 1] }
          : { rotate: 0, scale: 1 }
      }
      transition={shaking ? { duration: 1.1, ease: "easeInOut" } : { duration: 0.3 }}
    >
      <span className="text-4xl">⚽️</span>
      <span className="mt-3 text-center text-sm font-bold text-white">{pack.title}</span>
    </motion.div>
  );
}
