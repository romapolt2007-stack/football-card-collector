import confetti from "canvas-confetti";
import { useEffect, useRef, useState } from "react";
import { RarityCard } from "../components/cards/RarityCard";
import { usePlayQuickMatch } from "../lib/queries";
import { haptics } from "../lib/telegram";
import type { QuickMatchResult } from "../types/game";

const EVENT_LABEL: Record<string, string> = { GOAL: "⚽ Гол!", POST: "🥅 Штанга", SAVE: "🧤 Сейв" };

type Phase = "idle" | "playing" | "result";

export function MatchScreen() {
  const playMatch = usePlayQuickMatch();
  const [phase, setPhase] = useState<Phase>("idle");
  const [revealedCount, setRevealedCount] = useState(0);
  const resultRef = useRef<QuickMatchResult | null>(null);

  function start() {
    setPhase("playing");
    setRevealedCount(0);
    playMatch.mutate(undefined, {
      onSuccess: (result) => {
        resultRef.current = result;
      },
    });
  }

  const result = resultRef.current;
  const events = result?.match.events ?? [];

  useEffect(() => {
    if (phase !== "playing" || !result) return;
    if (revealedCount >= events.length) {
      const timer = setTimeout(() => setPhase("result"), 500);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      const event = events[revealedCount];
      if (event.type === "GOAL") {
        if (event.team === "user") {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } });
          haptics.notify("success");
        } else {
          haptics.impact("heavy");
        }
      }
      setRevealedCount((n) => n + 1);
    }, 650);
    return () => clearTimeout(timer);
  }, [phase, revealedCount, events, result]);

  const liveScore = events.slice(0, revealedCount).reduce(
    (acc, e) => {
      if (e.type === "GOAL") acc[e.team === "user" ? 0 : 1]++;
      return acc;
    },
    [0, 0],
  );

  if (phase === "idle") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-lg font-extrabold">🏟️ Быстрый матч</h1>
        <p className="text-sm text-white/50">
          Сыграйте против случайного соперника на основе силы вашего активного состава
        </p>
        <button
          onClick={start}
          className="rounded-full bg-gold px-8 py-3.5 text-sm font-extrabold text-pitch-dark"
        >
          Играть
        </button>
      </div>
    );
  }

  if (phase === "playing") {
    return (
      <div className="flex min-h-dvh flex-col gap-4 px-5 pt-[calc(env(safe-area-inset-top)+24px)] pb-10">
        <div className="flex items-center justify-center gap-6">
          <span className="text-sm font-semibold text-white/70">Вы</span>
          <span className="text-3xl font-extrabold">
            {liveScore[0]} : {liveScore[1]}
          </span>
          <span className="text-sm font-semibold text-white/70">{result?.match.opponentName ?? "..."}</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            {events.slice(0, revealedCount).map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-white/60">
                <span className="w-8 shrink-0 text-right text-white/40">{e.minute}&apos;</span>
                <span>{EVENT_LABEL[e.type]}</span>
                <span className="text-white/40">— {e.team === "user" ? "вы" : result?.match.opponentName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;
  const { match, squad, wonCard } = result;

  return (
    <div className="flex min-h-dvh flex-col gap-5 px-5 pt-[calc(env(safe-area-inset-top)+24px)] pb-28">
      <div className="text-center">
        <p className="text-xs text-white/50">
          {match.userScore > match.oppScore ? "Победа 🎉" : match.userScore === match.oppScore ? "Ничья" : "Поражение"}
        </p>
        <p className="mt-1 text-3xl font-extrabold">
          {match.userScore} : {match.oppScore}
        </p>
        <p className="mt-1 text-sm text-white/50">
          vs {match.opponentName} ({match.opponentOvr} OVR) · ваша сила {squad.strength}
        </p>
      </div>

      <StatsBars stats={result.stats} />

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
        <p className="text-sm font-semibold text-gold">+{match.rewards.coins.toLocaleString("ru-RU")} монет</p>
        <p className="text-xs text-white/50">+{match.rewards.xp} XP</p>
      </div>

      {wonCard && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-white/50">Бонусная карта за матч</p>
          <RarityCard card={wonCard} size="md" />
        </div>
      )}

      <button
        onClick={() => setPhase("idle")}
        className="rounded-full bg-gold py-3.5 text-sm font-extrabold text-pitch-dark"
      >
        Ещё матч
      </button>
    </div>
  );
}

function StatsBars({ stats }: { stats: QuickMatchResult["stats"] }) {
  const rows: { label: string; values: [number, number]; suffix?: string }[] = [
    { label: "Владение", values: stats.possession, suffix: "%" },
    { label: "Удары", values: stats.shots },
    { label: "Угловые", values: stats.corners },
    { label: "xG", values: stats.xg },
  ];

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-white/10 bg-white/5 p-4">
      {rows.map((row) => {
        const total = row.values[0] + row.values[1] || 1;
        const pct = Math.round((row.values[0] / total) * 100);
        return (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between text-xs text-white/60">
              <span>
                {row.values[0]}
                {row.suffix}
              </span>
              <span>{row.label}</span>
              <span>
                {row.values[1]}
                {row.suffix}
              </span>
            </div>
            <div className="flex h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
