import { motion } from "framer-motion";

interface Props {
  streak: number;
  threshold: number;
  level: number;
}

/** Шкала "Азарта" — серия спинов без пропуска; по достижении порога (зависит от уровня) следующий спин гарантированно топ-редкости. */
export function HotStreakMeter({ streak, threshold, level }: Props) {
  const pct = Math.min(100, (streak / threshold) * 100);
  const hot = streak >= threshold * 0.5;
  const maxed = streak >= threshold;

  return (
    <div className="flex w-full max-w-sm flex-col gap-1">
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-white/50">
        <span className="flex items-center gap-1.5">
          <span className={hot ? "text-orange-400" : ""}>{maxed ? "🎁 Гарантия!" : hot ? "🔥 Азарт" : "Азарт"}</span>
          <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white/60">Ур. {level}</span>
        </span>
        <span>
          {streak}/{threshold}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: maxed
              ? "linear-gradient(90deg, #ffd166, #b24bf3)"
              : hot
                ? "linear-gradient(90deg, #ff8a3d, #ff3b5c)"
                : "linear-gradient(90deg, #ffd166, #ff8a3d)",
            boxShadow: maxed ? "0 0 12px rgba(178,75,243,0.7)" : hot ? "0 0 10px rgba(255,59,92,0.6)" : undefined,
          }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 24 }}
        />
      </div>
    </div>
  );
}
