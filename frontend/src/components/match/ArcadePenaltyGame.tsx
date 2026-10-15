import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { useState } from "react";
import { PillTabs } from "../common/PillTabs";
import { CoinBalance } from "../common/CoinBalance";
import { RarityCard } from "../cards/RarityCard";
import { useArcadeFreeStatus, useArcadePenaltyRound, useStartArcadePenalty } from "../../lib/useArcadePenalty";
import { formatLongCountdown } from "../../lib/useLuckySpin";
import { useAuthStore } from "../../store/useAuthStore";
import { haptics } from "../../lib/telegram";
import { sfx } from "../../lib/sfx";
import type {
  ArcadeDifficulty,
  ArcadeResult,
  ShootoutPower,
  ShootoutRoundOutcome,
  ShootoutZone,
} from "../../types/game";
import type { MatchMode } from "../../screens/MatchScreen";

type Phase = "idle" | "playing" | "result";

const DIFFICULTY_LABEL: Record<ArcadeDifficulty, string> = { EASY: "Лёгкий", MEDIUM: "Средний", HARD: "Сложный" };
const POWER_LABEL: Record<ShootoutPower, string> = { WEAK: "Слабо", MEDIUM: "Средне", STRONG: "Сильно" };
const ZONES: ShootoutZone[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function ZoneGrid({
  selected,
  onSelect,
  accent,
}: {
  selected: number | null;
  onSelect: (z: ShootoutZone) => void;
  accent: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {ZONES.map((z) => (
        <button
          key={z}
          onClick={() => {
            haptics.select();
            onSelect(z);
          }}
          className="aspect-square rounded-lg border-2 transition-colors"
          style={{
            borderColor: selected === z ? accent : "rgba(255,255,255,0.15)",
            background: selected === z ? `${accent}33` : "rgba(255,255,255,0.04)",
          }}
        />
      ))}
    </div>
  );
}

interface Props {
  mode: MatchMode;
  onModeChange: (mode: MatchMode) => void;
}

export function ArcadePenaltyGame({ mode, onModeChange }: Props) {
  const user = useAuthStore((s) => s.user);
  const freeStatus = useArcadeFreeStatus();
  const start = useStartArcadePenalty();
  const roundMutation = useArcadePenaltyRound();

  const [phase, setPhase] = useState<Phase>("idle");
  const [difficulty, setDifficulty] = useState<ArcadeDifficulty>("MEDIUM");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [kickZone, setKickZone] = useState<ShootoutZone | null>(null);
  const [kickPower, setKickPower] = useState<ShootoutPower>("MEDIUM");
  const [saveZone, setSaveZone] = useState<ShootoutZone | null>(null);
  const [userScore, setUserScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [round, setRound] = useState(1);
  const [lastOutcome, setLastOutcome] = useState<ShootoutRoundOutcome | null>(null);
  const [showingOutcome, setShowingOutcome] = useState(false);
  const [result, setResult] = useState<ArcadeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canShoot = kickZone !== null && saveZone !== null && !roundMutation.isPending && !showingOutcome;

  function startGame(free: boolean) {
    setError(null);
    start.mutate(
      { difficulty, free },
      {
        onSuccess: (res) => {
          setDraftId(res.draftId);
          setUserScore(0);
          setOppScore(0);
          setRound(1);
          setResult(null);
          setPhase("playing");
        },
        onError: (e) => setError((e as Error)?.message ?? "Не удалось начать серию"),
      },
    );
  }

  function shoot() {
    if (!draftId || kickZone === null || saveZone === null) return;
    haptics.impact("heavy");
    sfx.kick();
    roundMutation.mutate(
      { draftId, kickZone, kickPower, saveZone },
      {
        onSuccess: (response) => {
          setLastOutcome(response.outcome);
          setShowingOutcome(true);
          setUserScore(response.userScore);
          setOppScore(response.oppScore);

          if (response.outcome.userScored) {
            sfx.goalRoar();
            haptics.notify("success");
            confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } });
          } else {
            sfx.postClang();
          }
          if (response.outcome.userSaved) haptics.notify("success");
          else if (response.outcome.userConceded) haptics.impact("heavy");

          setTimeout(() => {
            setShowingOutcome(false);
            setKickZone(null);
            setSaveZone(null);
            if (response.finished && response.result) {
              setResult(response.result);
              setPhase("result");
            } else {
              setRound(response.round);
            }
          }, 1900);
        },
      },
    );
  }

  if (phase === "idle") {
    const canAfford = (user?.coins ?? 0) >= (freeStatus.data?.paidCost ?? 200);
    return (
      <div className="velvet-texture flex min-h-dvh flex-col gap-5 px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-28">
        <header className="flex items-center justify-between">
          <h1 className="text-lg font-extrabold">🥅 Пенальти</h1>
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
            Серия из 5 пенальти против соперника выбранной сложности — бейте и отражайте удары,
            зарабатывайте монеты и бонусные карты
          </p>

          <div className="flex gap-2">
            {(["EASY", "MEDIUM", "HARD"] as ArcadeDifficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => {
                  haptics.select();
                  setDifficulty(d);
                }}
                className="rounded-full border px-4 py-2 text-sm font-semibold"
                style={{
                  borderColor: difficulty === d ? "#ffd166" : "rgba(255,255,255,0.15)",
                  color: difficulty === d ? "#ffd166" : "rgba(255,255,255,0.6)",
                  background: difficulty === d ? "rgba(255,209,102,0.12)" : "transparent",
                }}
              >
                {DIFFICULTY_LABEL[d]}
              </button>
            ))}
          </div>

          {error && <p className="max-w-xs text-sm text-red-400">{error}</p>}

          {freeStatus.ready ? (
            <button
              onClick={() => startGame(true)}
              disabled={start.isPending}
              className="spin-button-texture relative overflow-hidden rounded-full bg-emerald-400 px-8 py-3.5 text-sm font-extrabold text-pitch-dark disabled:opacity-30"
            >
              🎁 Бесплатная серия
            </button>
          ) : (
            <p className="text-xs text-white/40">Бесплатная серия через {formatLongCountdown(freeStatus.msLeft)}</p>
          )}

          <button
            onClick={() => startGame(false)}
            disabled={start.isPending || !canAfford}
            className="spin-button-texture relative flex items-center gap-2 overflow-hidden rounded-full bg-gold px-8 py-3.5 text-sm font-extrabold tracking-wide text-pitch-dark disabled:opacity-30"
          >
            Играть за {freeStatus.data?.paidCost ?? 200} 🪙
          </button>
        </div>
      </div>
    );
  }

  if (phase === "playing") {
    return (
      <div className="velvet-texture flex min-h-dvh flex-col gap-5 px-5 pt-[calc(env(safe-area-inset-top)+24px)] pb-10">
        <div className="metal-banner overflow-hidden rounded-2xl border border-white/15 px-4 py-3 text-center">
          <p className="text-xs font-semibold text-white/60">Серия пенальти · раунд {round}</p>
          <p className="mt-1 text-2xl font-extrabold text-white">
            Вы {userScore} : {oppScore} {DIFFICULTY_LABEL[difficulty]}
          </p>
        </div>

        {showingOutcome && lastOutcome ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-1 flex-col items-center justify-center gap-4"
          >
            <p className="text-lg font-extrabold" style={{ color: lastOutcome.userScored ? "#6ee7a0" : "#ff6b6b" }}>
              {lastOutcome.userScored ? "⚽ ГОЛ!" : lastOutcome.userShotOnTarget ? "🧤 Отражён!" : "❌ Мимо ворот"}
            </p>
            <p className="text-base font-bold" style={{ color: lastOutcome.userSaved ? "#6ee7a0" : "#ff6b6b" }}>
              {!lastOutcome.botOnTarget
                ? "🎯 Соперник бьёт мимо!"
                : lastOutcome.userSaved
                  ? "🧤 Вы отразили удар!"
                  : "😢 Соперник забивает"}
            </p>
          </motion.div>
        ) : (
          <>
            <section>
              <p className="mb-2 text-xs font-semibold text-white/50">Ваш удар — выберите угол</p>
              <ZoneGrid selected={kickZone} onSelect={setKickZone} accent="#ffd166" />
              <div className="mt-2 flex gap-1.5">
                {(["WEAK", "MEDIUM", "STRONG"] as ShootoutPower[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      haptics.select();
                      setKickPower(p);
                    }}
                    className="flex-1 rounded-full border py-1.5 text-xs font-semibold"
                    style={{
                      borderColor: kickPower === p ? "#ffd166" : "rgba(255,255,255,0.15)",
                      color: kickPower === p ? "#ffd166" : "rgba(255,255,255,0.5)",
                      background: kickPower === p ? "rgba(255,209,102,0.12)" : "transparent",
                    }}
                  >
                    {POWER_LABEL[p]}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <p className="mb-2 text-xs font-semibold text-white/50">Ваша защита — куда прыгнет вратарь</p>
              <ZoneGrid selected={saveZone} onSelect={setSaveZone} accent="#5ad1ff" />
            </section>

            <button
              onClick={shoot}
              disabled={!canShoot}
              className="spin-button-texture relative mt-auto overflow-hidden rounded-full bg-gold py-3.5 text-sm font-extrabold tracking-wide text-pitch-dark disabled:opacity-30"
            >
              Пробить!
            </button>
          </>
        )}
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="velvet-texture flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="text-xl font-extrabold" style={{ color: result.won ? "#ffd166" : "rgba(255,255,255,0.7)" }}>
        {result.won ? "Победа в серии! 🎉" : "Поражение в серии"}
      </p>
      <p className="text-3xl font-extrabold">
        {userScore} : {oppScore}
      </p>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-semibold text-gold">+{result.rewardCoins.toLocaleString("ru-RU")} монет</p>
        <p className="text-xs text-white/50">+{result.rewardXp} XP</p>
      </div>

      {result.grantedCard && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-white/50">Бонусная карта</p>
          <RarityCard card={result.grantedCard} size="md" />
        </div>
      )}

      <button
        onClick={() => setPhase("idle")}
        className="spin-button-texture relative overflow-hidden rounded-full bg-gold px-8 py-3.5 text-sm font-extrabold text-pitch-dark"
      >
        Ещё серия
      </button>
    </div>
  );
}
