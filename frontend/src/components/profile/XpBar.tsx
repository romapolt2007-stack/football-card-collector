import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { levelUpReward, xpForLevel } from "../../lib/xp";

interface Props {
  level: number;
  xp: number;
}

export function XpBar({ level, xp }: Props) {
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const progress = Math.min(100, Math.round(((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100));
  const remaining = Math.max(0, nextLevelXp - xp);
  const nextReward = levelUpReward(level + 1);

  const prevXpRef = useRef(xp);
  const [delta, setDelta] = useState<number | null>(null);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    const diff = xp - prevXpRef.current;
    if (diff > 0) {
      setDelta(diff);
      setPulseKey((k) => k + 1);
      const timer = setTimeout(() => setDelta(null), 1400);
      prevXpRef.current = xp;
      return () => clearTimeout(timer);
    }
    prevXpRef.current = xp;
  }, [xp]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-white/50">Уровень {level}</span>
        <div className="relative">
          {delta !== null && (
            <span
              key={pulseKey}
              className="float-up-fade pointer-events-none absolute -top-1 right-0 text-xs font-extrabold text-gold"
            >
              +{delta} XP
            </span>
          )}
          <span className="text-sm font-extrabold" style={{ textShadow: "0 0 10px rgba(255,209,102,0.6)" }}>
            {xp.toLocaleString("ru-RU")} / {nextLevelXp.toLocaleString("ru-RU")} XP
          </span>
        </div>
      </div>

      <div
        className="relative mt-2.5 h-3 overflow-hidden rounded-full bg-black/40"
        style={{ boxShadow: "inset 0 2px 4px rgba(0,0,0,0.6)" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #8a5a06, #ffd166 60%, #fff3cc)",
            boxShadow: `0 0 ${6 + progress / 6}px rgba(255,209,102,0.8)`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-white/50">
        <span>До следующего уровня: {remaining.toLocaleString("ru-RU")} XP</span>
        <span className="font-semibold text-gold">+{nextReward.toLocaleString("ru-RU")} 🪙 за уровень</span>
      </div>
    </div>
  );
}
