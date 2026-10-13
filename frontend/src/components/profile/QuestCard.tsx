import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { haptics } from "../../lib/telegram";
import { sfx } from "../../lib/sfx";
import type { UserQuest } from "../../types/game";

const QUEST_ICON: Record<string, string> = {
  OPEN_PACK: "📦",
  PLAY_MATCH: "⚽",
  WIN_MATCH: "🏆",
  SELL_CARD: "💰",
  LOGIN_STREAK: "📅",
};

interface Props {
  userQuest: UserQuest;
  onClaim: () => void;
  isPending: boolean;
}

const R = 20;
const CIRCUMFERENCE = 2 * Math.PI * R;

export function QuestCard({ userQuest, onClaim, isPending }: Props) {
  const [coinsFlying, setCoinsFlying] = useState(false);
  const pct = Math.min(1, userQuest.progress / userQuest.quest.target);
  const icon = QUEST_ICON[userQuest.quest.code] ?? "🎯";

  function handleClaim() {
    haptics.notify("success");
    sfx.chime();
    setCoinsFlying(true);
    setTimeout(() => setCoinsFlying(false), 900);
    onClaim();
  }

  return (
    <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
        <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
          <circle cx="28" cy="28" r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
          <circle
            cx="28"
            cy="28"
            r={R}
            fill="none"
            stroke={userQuest.completed ? "#6ee7a0" : "#ffd166"}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - pct)}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <span className="absolute text-xl">{icon}</span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{userQuest.quest.title}</p>
        <p className="text-[11px] text-white/40">
          {userQuest.progress}/{userQuest.quest.target}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-gold">
          +{userQuest.quest.reward.toLocaleString("ru-RU")} 🪙
        </p>
      </div>

      <button
        onClick={handleClaim}
        disabled={!userQuest.completed || userQuest.claimed || isPending}
        className="shrink-0 rounded-full border px-3 py-2 text-xs font-extrabold disabled:opacity-30"
        style={{
          borderColor: userQuest.completed && !userQuest.claimed ? "#ffd166" : "rgba(255,255,255,0.15)",
          background: userQuest.completed && !userQuest.claimed ? "rgba(255,209,102,0.15)" : "transparent",
          color: userQuest.completed && !userQuest.claimed ? "#ffd166" : "rgba(255,255,255,0.4)",
          boxShadow: userQuest.completed && !userQuest.claimed ? "0 0 10px rgba(255,209,102,0.35)" : undefined,
        }}
      >
        {userQuest.claimed ? "Готово" : "Забрать"}
      </button>

      <AnimatePresence>
        {coinsFlying &&
          [0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute right-6 top-1/2 text-sm"
              initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              animate={{ opacity: 0, x: -40 - i * 10, y: -36 - i * 8, scale: 0.6 }}
              transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
            >
              🪙
            </motion.span>
          ))}
      </AnimatePresence>
    </div>
  );
}
