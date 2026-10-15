import { motion } from "framer-motion";

interface Props {
  streak: number;
  max: number;
}

/** Шкала "Азарта" — чем длиннее серия спинов без пропуска, тем выше шанс на LEGEND/ICON. */
export function HotStreakMeter({ streak, max }: Props) {
  const pct = Math.min(100, (streak / max) * 100);
  const hot = streak >= max * 0.5;

  return (
    <div className="flex w-full max-w-sm flex-col gap-1">
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-white/50">
        <span className={hot ? "text-orange-400" : ""}>{hot ? "🔥 Азарт" : "Азарт"}</span>
        <span>
          {streak}/{max}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: hot
              ? "linear-gradient(90deg, #ff8a3d, #ff3b5c)"
              : "linear-gradient(90deg, #ffd166, #ff8a3d)",
            boxShadow: hot ? "0 0 10px rgba(255,59,92,0.6)" : undefined,
          }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 24 }}
        />
      </div>
    </div>
  );
}
