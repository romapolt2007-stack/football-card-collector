import confetti from "canvas-confetti";
import { useState } from "react";
import { usePlayWorldTour, useWorldTourStatus } from "../lib/useWorldTour";
import { RarityCard } from "../components/cards/RarityCard";
import { haptics } from "../lib/telegram";
import { sfx } from "../lib/sfx";
import type { WorldTourPlayResponse } from "../types/game";

interface Props {
  onClose: () => void;
}

const STATUS_ICON: Record<string, string> = { done: "✅", current: "▶️", locked: "🔒" };

/** World Tour — сюжетный режим: линейная последовательность городов, каждый этап разрешается мгновенно. */
export function WorldTourScreen({ onClose }: Props) {
  const { data } = useWorldTourStatus();
  const play = usePlayWorldTour();
  const [lastResult, setLastResult] = useState<WorldTourPlayResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function playStage() {
    setError(null);
    haptics.impact("medium");
    sfx.whistle();
    play.mutate(undefined, {
      onSuccess: (response) => {
        setLastResult(response);
        if (response.won) {
          sfx.goalRoar();
          haptics.notify("success");
          confetti({ particleCount: response.tourCompleted ? 160 : 60, spread: 70, origin: { y: 0.5 } });
        } else {
          haptics.notify("error");
        }
      },
      onError: (e) => setError((e as Error)?.message ?? "Не удалось сыграть этап"),
    });
  }

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-black/95">
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-3">
        <h2 className="text-base font-bold">🗺️ World Tour</h2>
        <button onClick={onClose} className="text-sm text-white/50">
          Закрыть
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-10">
        {lastResult && (
          <div
            className="rounded-xl border p-4 text-center"
            style={{
              borderColor: lastResult.won ? "rgba(110,231,160,0.4)" : "rgba(255,107,107,0.4)",
              background: lastResult.won ? "rgba(110,231,160,0.08)" : "rgba(255,107,107,0.08)",
            }}
          >
            <p className="text-sm font-bold" style={{ color: lastResult.won ? "#6ee7a0" : "#ff6b6b" }}>
              {lastResult.won ? `Победа в ${lastResult.city}! 🎉` : `Поражение в ${lastResult.city}`}
            </p>
            <p className="mt-1 text-2xl font-extrabold">
              {lastResult.userScore} : {lastResult.oppScore}
            </p>
            <p className="mt-1 text-xs text-white/50">vs {lastResult.opponentName}</p>
            <p className="mt-2 text-sm font-semibold text-gold">
              +{lastResult.result.rewardCoins.toLocaleString("ru-RU")} монет · +{lastResult.result.rewardXp} XP
            </p>
            {lastResult.result.grantedCard && (
              <div className="mt-3 flex flex-col items-center gap-2">
                <p className="text-xs text-white/50">Награда этапа</p>
                <RarityCard card={lastResult.result.grantedCard} size="sm" />
              </div>
            )}
            {lastResult.tourCompleted && (
              <p className="mt-2 text-sm font-extrabold text-gold">🏆 World Tour пройден полностью!</p>
            )}
          </div>
        )}

        {error && <p className="text-center text-sm text-red-400">{error}</p>}

        {data && !data.completed && (
          <button
            onClick={playStage}
            disabled={play.isPending}
            className="spin-button-texture relative overflow-hidden rounded-full bg-gold py-3.5 text-sm font-extrabold tracking-wide text-pitch-dark disabled:opacity-30"
          >
            ⚽ Играть: {data.stages[data.stage]?.city}
          </button>
        )}

        <div className="flex flex-col gap-2">
          {data?.stages.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border px-3 py-2.5"
              style={{
                borderColor: s.status === "current" ? "rgba(255,209,102,0.4)" : "rgba(255,255,255,0.1)",
                background: s.status === "current" ? "rgba(255,209,102,0.08)" : "rgba(255,255,255,0.03)",
                opacity: s.status === "locked" ? 0.45 : 1,
              }}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                {STATUS_ICON[s.status]} {s.city}
              </span>
              <span className="text-xs text-white/40">
                {s.rewardCoins.toLocaleString("ru-RU")} 🪙{s.guaranteedRarity ? ` · ${s.guaranteedRarity}` : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
