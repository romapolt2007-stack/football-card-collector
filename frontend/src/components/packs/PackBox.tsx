import { motion } from "framer-motion";
import { PackFoilArt } from "../cases/PackFoilArt";
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
      className="relative flex h-56 w-40 flex-col items-center justify-center"
      animate={
        shaking
          ? { rotate: [0, -6, 6, -6, 6, -3, 3, 0], scale: [1, 1.03, 1, 1.04, 1, 1.02, 1] }
          : { rotate: 0, scale: 1 }
      }
      transition={shaking ? { duration: 1.1, ease: "easeInOut" } : { duration: 0.3 }}
    >
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

      <PackFoilArt
        colorLight={theme.colorLight}
        colorDark={theme.colorDark}
        label={pack.title}
        emblem={pack.id === "starter" ? "⚽" : "🛡️"}
        size="lg"
      />
    </motion.div>
  );
}
