import { motion } from "framer-motion";
import { MOCK_PANEL, MOCK_PANEL_BORDER } from "./theme";

interface Props {
  streak: number;
  threshold: number;
  onOpen: () => void;
}

function azartFill(hot: boolean, maxed: boolean): string {
  if (maxed) return "linear-gradient(90deg, #ffd166, #b24bf3)";
  if (hot) return "linear-gradient(90deg, #ff8a3d, #ff3b5c)";
  return "linear-gradient(90deg, #ffd166, #ff8a3d)";
}

/** Растянутая плашка "Азарт" в верхней панели — тап открывает AzartDetailSheet с точными цифрами.
 * .holo-sweep — уже существующий в проекте класс (index.css), даёт "бегущую" полоску поверх. */
export function AzartBar({ streak, threshold, onOpen }: Props) {
  const pct = Math.min(100, (streak / threshold) * 100);
  const hot = streak >= threshold * 0.5;
  const maxed = streak >= threshold;

  return (
    <button
      onClick={onOpen}
      className="relative flex-1 overflow-hidden rounded-[14px] px-3 py-2 text-left"
      style={{ background: MOCK_PANEL, border: `1px solid ${MOCK_PANEL_BORDER}` }}
    >
      <div className="relative z-10 flex items-center justify-between text-[11px] font-bold">
        <span className="flex items-center gap-1.5">
          <span>{maxed ? "🎁" : "🔥"}</span>
          <span>Азарт</span>
        </span>
        <span className="text-white/50">
          {streak}/{threshold} ›
        </span>
      </div>
      <div className="relative z-10 mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full"
          style={{ background: azartFill(hot, maxed) }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 24 }}
        />
      </div>
      <div className="holo-sweep pointer-events-none absolute inset-0" />
    </button>
  );
}
