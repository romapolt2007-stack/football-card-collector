import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { RarityCard } from "../components/cards/RarityCard";
import { ShootoutMiniGame } from "../components/match/ShootoutMiniGame";
import { TeamWalkout } from "../components/match/TeamWalkout";
import { usePlayQuickMatch } from "../lib/queries";
import { haptics } from "../lib/telegram";
import { sfx } from "../lib/sfx";
import type { MatchEvent, QuickMatchResponse, QuickMatchResult } from "../types/game";

const EVENT_LABEL: Record<string, string> = {
  GOAL: "⚽ Гол!",
  POST: "🥅 Штанга",
  SAVE: "🧤 Сейв",
  YELLOW: "🟨 Жёлтая карточка",
  RED: "🟥 Красная карточка",
  INJURY: "🚑 Травма",
};

type Phase = "idle" | "walkout" | "playing" | "shootout" | "result";

// Полный матч «проигрывается» за это время — часы идут с 1-й по 90-ю
// минуту равномерно, а события всплывают, когда часы доходят до их минуты.
const MATCH_PLAYBACK_MS = 28_000;
const MINUTE_TICK_MS = MATCH_PLAYBACK_MS / 90;

function eventsOf(response: QuickMatchResponse | null): MatchEvent[] {
  if (!response) return [];
  return "needsShootout" in response ? response.ninetyMin.events : response.match.events;
}

function opponentNameOf(response: QuickMatchResponse | null): string {
  if (!response) return "...";
  return "needsShootout" in response ? response.opponentName : response.match.opponentName;
}

export function MatchScreen() {
  const playMatch = usePlayQuickMatch();
  const [phase, setPhase] = useState<Phase>("idle");
  const [minute, setMinute] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const [finalResult, setFinalResult] = useState<QuickMatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const responseRef = useRef<QuickMatchResponse | null>(null);

  function start() {
    setError(null);
    setFinalResult(null);
    responseRef.current = null;
    setPhase("walkout");
    setMinute(0);
    setRevealedCount(0);
    playMatch.mutate(undefined, {
      onSuccess: (response) => {
        responseRef.current = response;
      },
      onError: (e) => {
        setError((e as Error)?.message ?? "Не удалось начать матч");
        setPhase("idle");
      },
    });
  }

  const response = responseRef.current;
  const events = eventsOf(response);

  // Часы матча: тикают раз в MINUTE_TICK_MS, не завязаны на количество событий.
  useEffect(() => {
    if (phase !== "playing" || !response) return;
    if (minute >= 90) {
      const timer = setTimeout(() => {
        sfx.whistle();
        if ("needsShootout" in response) {
          setPhase("shootout");
        } else {
          setPhase("result");
          setFinalResult(response);
        }
      }, 900);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setMinute((m) => m + 1), MINUTE_TICK_MS);
    return () => clearTimeout(timer);
  }, [phase, minute, response]);

  // Раскрываем события по мере того, как часы доходят до их минуты.
  useEffect(() => {
    if (phase !== "playing" || !response) return;
    let upTo = revealedCount;
    while (upTo < events.length && events[upTo].minute <= minute) upTo++;
    if (upTo === revealedCount) return;

    for (let i = revealedCount; i < upTo; i++) {
      const event = events[i];
      if (event.type === "GOAL") {
        if (event.team === "user") {
          sfx.goalRoar();
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } });
          haptics.notify("success");
        } else {
          haptics.impact("heavy");
        }
      } else if (event.type === "POST") {
        sfx.postClang();
      } else if (event.type === "YELLOW" || event.type === "RED") {
        sfx.cardReveal(event.type);
        haptics.impact(event.type === "RED" ? "heavy" : "medium");
      } else if (event.type === "INJURY") {
        sfx.injury();
        haptics.notify("warning");
      }
    }
    setRevealedCount(upTo);
  }, [phase, minute, revealedCount, events, response]);

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
        {error && <p className="max-w-xs text-sm text-red-400">{error}</p>}
        <button
          onClick={start}
          className="rounded-full bg-gold px-8 py-3.5 text-sm font-extrabold text-pitch-dark"
        >
          Играть
        </button>
      </div>
    );
  }

  if (phase === "walkout") {
    return <TeamWalkout opponentName="соперник" onDone={() => setPhase("playing")} />;
  }

  if (phase === "playing") {
    return (
      <div className="flex min-h-dvh flex-col gap-4 px-5 pt-[calc(env(safe-area-inset-top)+24px)] pb-10">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <div className="flex items-center justify-center gap-6">
            <span className="text-sm font-semibold text-white/70">Вы</span>
            <span className="text-3xl font-extrabold">
              {liveScore[0]} : {liveScore[1]}
            </span>
            <span className="text-sm font-semibold text-white/70">{opponentNameOf(response)}</span>
          </div>
          <p className="mt-1 text-center text-xs font-semibold text-gold">{Math.min(minute, 90)}&apos;</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <AnimatePresence initial={false}>
              {events.slice(0, revealedCount).map((e, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs"
                  style={{
                    background:
                      e.type === "RED"
                        ? "rgba(239,68,68,0.15)"
                        : e.type === "YELLOW"
                          ? "rgba(234,179,8,0.15)"
                          : e.type === "INJURY"
                            ? "rgba(96,165,250,0.12)"
                            : "transparent",
                  }}
                >
                  <span className="w-8 shrink-0 text-right text-white/40">{e.minute}&apos;</span>
                  <span>{EVENT_LABEL[e.type]}</span>
                  <span className="text-white/40">
                    — {e.team === "user" ? e.playerName ?? "вы" : e.playerName ?? opponentNameOf(response)}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "shootout" && response && "needsShootout" in response) {
    return (
      <ShootoutMiniGame
        draftId={response.draftId}
        opponentName={response.opponentName}
        onFinished={(result) => {
          setFinalResult(result);
          setPhase("result");
        }}
      />
    );
  }

  if (!finalResult) return null;
  const { match, squad, wonCard, shootout } = finalResult;

  return (
    <div className="flex min-h-dvh flex-col gap-5 px-5 pt-[calc(env(safe-area-inset-top)+24px)] pb-28">
      <div className="text-center">
        <p className="text-xs text-white/50">
          {shootout
            ? shootout.won
              ? "Победа по пенальти 🎉"
              : "Поражение по пенальти"
            : match.userScore > match.oppScore
              ? "Победа 🎉"
              : match.userScore === match.oppScore
                ? "Ничья"
                : "Поражение"}
        </p>
        <p className="mt-1 text-3xl font-extrabold">
          {match.userScore} : {match.oppScore}
          {shootout && (
            <span className="ml-2 text-lg text-white/50">
              ({shootout.userScore}:{shootout.oppScore} пен.)
            </span>
          )}
        </p>
        <p className="mt-1 text-sm text-white/50">
          vs {match.opponentName} ({match.opponentOvr} OVR) · ваша сила {squad.strength}
        </p>
      </div>

      <StatsBars stats={finalResult.stats} />

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
