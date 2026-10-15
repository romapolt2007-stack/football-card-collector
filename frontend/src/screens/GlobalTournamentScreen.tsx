import confetti from "canvas-confetti";
import { useState } from "react";
import { useStartTournament, useTournamentFreeStatus, useTournamentRound } from "../lib/useGlobalTournament";
import { formatLongCountdown } from "../lib/useLuckySpin";
import { RarityCard } from "../components/cards/RarityCard";
import { haptics } from "../lib/telegram";
import { sfx } from "../lib/sfx";
import type { TournamentRoundResponse } from "../lib/useGlobalTournament";

interface Props {
  onClose: () => void;
}

/** Глобальный турнир — честная сетка на 64 (вы + процедурные боты), 6 раундов, раз в 7 дней. */
export function GlobalTournamentScreen({ onClose }: Props) {
  const freeStatus = useTournamentFreeStatus();
  const start = useStartTournament();
  const round = useTournamentRound();

  const [draftId, setDraftId] = useState<string | null>(null);
  const [roundLabel, setRoundLabel] = useState("1/64 финала");
  const [roundsWon, setRoundsWon] = useState(0);
  const [lastRound, setLastRound] = useState<TournamentRoundResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function startTournament() {
    setError(null);
    start.mutate(undefined, {
      onSuccess: (res) => {
        setDraftId(res.draftId);
        setRoundLabel(res.roundLabel);
        setRoundsWon(0);
        setLastRound(null);
      },
      onError: (e) => setError((e as Error)?.message ?? "Не удалось начать турнир"),
    });
  }

  function playRound() {
    if (!draftId) return;
    haptics.impact("medium");
    sfx.whistle();
    round.mutate(draftId, {
      onSuccess: (response) => {
        setLastRound(response);
        if (response.won) {
          sfx.goalRoar();
          haptics.notify("success");
          confetti({ particleCount: response.champion ? 200 : 70, spread: 80, origin: { y: 0.5 } });
          setRoundsWon((w) => w + 1);
        } else {
          haptics.notify("error");
        }
        if (!response.finished && response.nextRound) setRoundLabel(response.nextRound.label);
      },
    });
  }

  const inProgress = Boolean(draftId) && !(lastRound?.finished ?? false);

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-black/95">
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-3">
        <h2 className="text-base font-bold">🌍 Глобальный турнир</h2>
        <button onClick={onClose} className="text-sm text-white/50">
          Закрыть
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-10">
        {!draftId && (
          <>
            <p className="text-center text-sm text-white/50">
              Сетка на 64 участника — вы и 63 процедурных соперника нарастающей силы. 6 раундов, поражение
              на любом этапе заканчивает попытку. Финал — гарантированная ICON-карта.
            </p>
            {error && <p className="text-center text-sm text-red-400">{error}</p>}
            {freeStatus.ready ? (
              <button
                onClick={startTournament}
                disabled={start.isPending}
                className="spin-button-texture relative overflow-hidden rounded-full bg-gold py-3.5 text-sm font-extrabold tracking-wide text-pitch-dark disabled:opacity-30"
              >
                🌍 Начать турнир
              </button>
            ) : (
              <p className="text-center text-xs text-white/40">
                Следующая попытка через {formatLongCountdown(freeStatus.msLeft)}
              </p>
            )}
          </>
        )}

        {lastRound && (
          <div
            className="rounded-xl border p-4 text-center"
            style={{
              borderColor: lastRound.won ? "rgba(110,231,160,0.4)" : "rgba(255,107,107,0.4)",
              background: lastRound.won ? "rgba(110,231,160,0.08)" : "rgba(255,107,107,0.08)",
            }}
          >
            <p className="text-sm font-bold" style={{ color: lastRound.won ? "#6ee7a0" : "#ff6b6b" }}>
              {lastRound.champion
                ? "🏆 Вы — чемпион мира! 🎉"
                : lastRound.won
                  ? `Победа в раунде «${lastRound.roundLabel}»`
                  : `Поражение в раунде «${lastRound.roundLabel}»`}
            </p>
            <p className="mt-1 text-2xl font-extrabold">
              {lastRound.userScore} : {lastRound.oppScore}
            </p>
            <p className="mt-1 text-xs text-white/50">vs {lastRound.opponentName}</p>
            <p className="mt-2 text-sm font-semibold text-gold">
              +{lastRound.result.rewardCoins.toLocaleString("ru-RU")} монет · +{lastRound.result.rewardXp} XP
            </p>
            {lastRound.result.grantedCard && (
              <div className="mt-3 flex flex-col items-center gap-2">
                <p className="text-xs text-white/50">Награда раунда</p>
                <RarityCard card={lastRound.result.grantedCard} size="sm" />
              </div>
            )}
          </div>
        )}

        {draftId && inProgress && (
          <>
            <div className="metal-banner overflow-hidden rounded-2xl border border-white/15 px-4 py-3 text-center">
              <p className="text-xs font-semibold text-white/60">Пройдено раундов: {roundsWon} / 6</p>
              <p className="mt-1 text-xl font-extrabold text-white">{roundLabel}</p>
            </div>
            <button
              onClick={playRound}
              disabled={round.isPending}
              className="spin-button-texture relative overflow-hidden rounded-full bg-gold py-3.5 text-sm font-extrabold tracking-wide text-pitch-dark disabled:opacity-30"
            >
              ⚽ Играть раунд
            </button>
          </>
        )}

        {lastRound?.finished && (
          <button
            onClick={() => {
              setDraftId(null);
              setLastRound(null);
            }}
            className="rounded-full border border-white/20 py-3 text-sm font-semibold"
          >
            Закрыть итог
          </button>
        )}
      </div>
    </div>
  );
}
