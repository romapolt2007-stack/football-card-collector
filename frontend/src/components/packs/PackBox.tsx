import { motion } from "framer-motion";
import type { PackDef } from "../../types/game";
import { PACK_THEME } from "./packTheme";

interface Props {
  pack: PackDef;
  shaking?: boolean;
}

const SPARK_POSITIONS = [
  { top: "5%", left: "10%", delay: "0s" },
  { top: "20%", left: "85%", delay: "0.25s" },
  { top: "70%", left: "8%", delay: "0.5s" },
  { top: "85%", left: "80%", delay: "0.75s" },
  { top: "45%", left: "50%", delay: "1s" },
];

export function PackBox({ pack, shaking }: Props) {
  const theme = PACK_THEME[pack.id] ?? PACK_THEME.bronze;

  return (
    <motion.div
      className="relative flex h-56 w-40 flex-col items-center justify-center overflow-hidden rounded-2xl border-2 shadow-2xl"
      style={{ background: theme.background, borderColor: theme.borderColor, boxShadow: theme.glow }}
      animate={
        shaking
          ? { rotate: [0, -6, 6, -6, 6, -3, 3, 0], scale: [1, 1.03, 1, 1.04, 1, 1.02, 1] }
          : { rotate: 0, scale: 1 }
      }
      transition={shaking ? { duration: 1.1, ease: "easeInOut" } : { duration: 0.3 }}
    >
      <div className="sheen-sweep pointer-events-none absolute inset-0" />

      {theme.sparky && shaking && (
        <div className="pointer-events-none absolute inset-0">
          {SPARK_POSITIONS.map((pos, i) => (
            <span
              key={i}
              className="sparkle absolute h-1.5 w-1.5 rounded-full bg-white"
              style={{ top: pos.top, left: pos.left, animationDelay: pos.delay }}
            />
          ))}
        </div>
      )}

      <span className="relative text-4xl drop-shadow-lg">{theme.accent}</span>
      <span className="relative mt-3 text-center text-sm font-bold text-white drop-shadow">{pack.title}</span>
    </motion.div>
  );
}
