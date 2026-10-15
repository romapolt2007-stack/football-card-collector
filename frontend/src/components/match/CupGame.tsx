import confetti from "canvas-confetti";
import { useState } from "react";
import { PillTabs } from "../common/PillTabs";
import { CoinBalance } from "../common/CoinBalance";
import { RarityCard } from "../cards/RarityCard";
import { useCupFreeStatus, useCupRound, useStartCup } from "../../lib/useCup";
import { formatLongCountdown } from "../../lib/useLuckySpin";
import { useAuthStore } from "../../store/useAuthStore";
import { haptics } from "../../lib/telegram";
import { sfx } from "../../lib/sfx";
import type { CupRoundResponse } from "../../types/game";
import type { MatchMode } from "../../screens/MatchScreen";

type Phase = "idle" | "playing" | "result";

interface Props {
  mode: MatchMode;
  onModeChange: (mode: MatchMode) => void;
}

/** Кубок на выбывание: 3 раунда против ботов нарастающей силы, каждый раунд разрешается мгновенно. */
export function CupGame({ mode, onModeChange }: Props) {
  const user = useAuthStore((s) => s.user);
  const freeStatus = useCupFreeStatus();
  const start = useStartCup();
  const round = useCupRound();

  const [phase, setPhase] = useState<Phase>("idle");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [roundLabel, setRoundLabel] = useState("Четвертьфинал");
  const [wins, setWins] = useState(0);
  const [lastRound, setLastRound] = useState<CupRoundResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function startCup() {
    setError(null);
    start.mutate(undefined, {
      onSuccess: (res) => {
        setDraftId(res.draftId);
        setRoundLabel(res.roundLabel);
        setWins(0);
        setLastRound(null);
        setPhase("playing");
      },
      onError: (e) => setError((e as Error)?.message ?? "Не удалось начать кубок"),
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
          confetti({ particleCount: response.champion ? 140 : 60, spread: 70, origin: { y: 0.5 } });
          setWins((w) => w + 1);
        } else {
          haptics.notify("error");
        }
        if (response.finished) {
          setPhase("result");
        } else if (response.nextRound) {
          setRoundLabel(response.nextRound.label);
        }
      },
    });
  }

  if (phase === "idle") {
    return (
      <div className="velvet-texture flex min-h-dvh flex-col gap-5 px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-28">
        <header className="flex items-center justify-between">
          <h1 className="text-lg font-extrabold">🏆 Кубок</h1>
          <CoinBalance coins={user?.coins ?? 0} />
        </header>

        <PillTabs
          layoutId="match-mode"
          active={mode}
          onChange={(id) => onModeChange(id as MatchMode)}
          tabs={[
            { id: "quick", label: "Быстрый матч" },
            { id: "penalty", label: "Пенальти" },
            { id: "duel", label: "Дуэль" },
            { id: "cup", label: "Кубок" },
          ]}
        />

        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <p className="max-w-xs text-sm text-white/50">
            3 раунда на выбывание — четвертьфинал, полуфинал, финал — против ботов нарастающей силы.
            Проигрыш на любом этапе заканчивает попытку. За победу в финале — гарантированная золотая карта.
          </p>

          {error && <p className="max-w-xs text-sm text-red-400">{error}</p>}

          {freeStatus.ready ? (
            <button
              onClick={startCup}
              disabled={start.isPending}
              className="spin-button-texture relative overflow-hidden rounded-full bg-gold px-8 py-3.5 text-sm font-extrabold tracking-wide text-pitch-dark disabled:opacity-30"
            >
              🏆 Начать Кубок
            </button>
          ) : (
            <p className="text-xs text-white/40">Следующая попытка через {formatLongCountdown(freeStatus.msLeft)}</p>
          )}
        </div>
      </div>
    );
  }

  if (phase === "playing") {
    return (
      <div className="velvet-texture flex min-h-dvh flex-col gap-5 px-5 pt-[calc(env(safe-area-inset-top)+24px)] pb-10">
        <div className="metal-banner overflow-hidden rounded-2xl border border-white/15 px-4 py-3 text-center">
          <p className="text-xs font-semibold text-white/60">Кубок · раунд {wins + 1} из 3</p>
          <p className="mt-1 text-xl font-extrabold text-white">{roundLabel}</p>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-5">
          {lastRound && !lastRound.finished && (
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-lg font-extrabold" style={{ color: lastRound.won ? "#6ee7a0" : "#ff6b6b" }}>
                {lastRound.userScore} : {lastRound.oppScore} vs {lastRound.opponentName}
              </p>
              <p className="text-xs text-white/50">+{lastRound.result.rewardCoins.toLocaleString("ru-RU")} монет</p>
            </div>
          )}

          <button
            onClick={playRound}
            disabled={round.isPending}
            className="spin-button-texture relative overflow-hidden rounded-full bg-gold px-10 py-4 text-sm font-extrabold tracking-wide text-pitch-dark disabled:opacity-30"
          >
            ⚽ Играть матч
          </button>
        </div>
      </div>
    );
  }

  if (!lastRound) return null;

  return (
    <div className="velvet-texture flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="text-xl font-extrabold" style={{ color: lastRound.champion ? "#ffd166" : "rgba(255,255,255,0.7)" }}>
        {lastRound.champion ? "🏆 Чемпион Кубка!" : "Вылет из Кубка"}
      </p>
      <p className="text-3xl font-extrabold">
        {lastRound.userScore} : {lastRound.oppScore}
      </p>
      <p className="text-sm text-white/50">
        {lastRound.roundLabel} · пройдено раундов: {wins}
      </p>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-semibold text-gold">
          +{lastRound.result.rewardCoins.toLocaleString("ru-RU")} монет
        </p>
        <p className="text-xs text-white/50">+{lastRound.result.rewardXp} XP</p>
      </div>

      {lastRound.result.grantedCard && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-white/50">Награда чемпиона</p>
          <RarityCard card={lastRound.result.grantedCard} size="md" />
        </div>
      )}

      <button
        onClick={() => setPhase("idle")}
        className="spin-button-texture relative overflow-hidden rounded-full bg-gold px-8 py-3.5 text-sm font-extrabold text-pitch-dark"
      >
        Закрыть
      </button>
    </div>
  );
}
