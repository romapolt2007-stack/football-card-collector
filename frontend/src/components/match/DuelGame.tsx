import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { useState } from "react";
import { PillTabs } from "../common/PillTabs";
import { CoinBalance } from "../common/CoinBalance";
import { RarityCard } from "../cards/RarityCard";
import { useDuelRound, useDuelStatus, useFindDuel } from "../../lib/useDuel";
import { useAuthStore } from "../../store/useAuthStore";
import { haptics } from "../../lib/telegram";
import { sfx } from "../../lib/sfx";
import type { DuelResult, ShootoutPower, ShootoutRoundOutcome, ShootoutZone } from "../../types/game";
import type { MatchMode } from "../../screens/MatchScreen";

type Phase = "idle" | "playing" | "result";

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

export function DuelGame({ mode, onModeChange }: Props) {
  const user = useAuthStore((s) => s.user);
  const status = useDuelStatus();
  const find = useFindDuel();
  const roundMutation = useDuelRound();

  const [phase, setPhase] = useState<Phase>("idle");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [opponentName, setOpponentName] = useState("");
  const [isRealOpponent, setIsRealOpponent] = useState(false);
  const [kickZone, setKickZone] = useState<ShootoutZone | null>(null);
  const [kickPower, setKickPower] = useState<ShootoutPower>("MEDIUM");
  const [saveZone, setSaveZone] = useState<ShootoutZone | null>(null);
  const [userScore, setUserScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [round, setRound] = useState(1);
  const [lastOutcome, setLastOutcome] = useState<ShootoutRoundOutcome | null>(null);
  const [showingOutcome, setShowingOutcome] = useState(false);
  const [result, setResult] = useState<DuelResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canShoot = kickZone !== null && saveZone !== null && !roundMutation.isPending && !showingOutcome;
  const energyCost = status.data?.energyCost ?? 2;
  const canAfford = (status.data?.energy ?? 0) >= energyCost;

  function startDuel() {
    setError(null);
    find.mutate(undefined, {
      onSuccess: (res) => {
        setDraftId(res.draftId);
        setOpponentName(res.opponentName);
        setIsRealOpponent(res.isRealOpponent);
        setUserScore(0);
        setOppScore(0);
        setRound(1);
        setResult(null);
        setPhase("playing");
      },
      onError: (e) => setError((e as Error)?.message ?? "Не удалось найти соперника"),
    });
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
    return (
      <div className="velvet-texture flex min-h-dvh flex-col gap-5 px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-28">
        <header className="flex items-center justify-between">
          <h1 className="text-lg font-extrabold">⚔️ Дуэль</h1>
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
          ]}
        />

        <div className="metal-banner overflow-hidden rounded-2xl border border-white/15 px-4 py-3 text-center">
          <p className="text-xs font-semibold text-white/60">{status.data?.leagueLabel ?? "Бронзовая лига"}</p>
          <p className="mt-1 text-xl font-extrabold text-gold">{status.data?.points ?? 0} 🏆</p>
          <p className="mt-0.5 text-[11px] text-white/40">
            {status.data?.wins ?? 0}W / {status.data?.losses ?? 0}L
          </p>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-sm font-semibold">
          <span>⚡</span>
          <span style={{ color: canAfford ? "#ffd166" : "#ff6b6b" }}>
            {status.data?.energy ?? 0}/{status.data?.energyMax ?? 20}
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <p className="max-w-xs text-sm text-white/50">
            Пенальти-серия против состава реального соперника (снимок его силы) или честного бота, если
            никого не нашлось. Победа — кубки и монеты, поражение — потеря кубков минимальна.
          </p>

          {error && <p className="max-w-xs text-sm text-red-400">{error}</p>}

          <button
            onClick={startDuel}
            disabled={find.isPending || !canAfford}
            className="spin-button-texture relative flex items-center gap-2 overflow-hidden rounded-full bg-gold px-8 py-3.5 text-sm font-extrabold tracking-wide text-pitch-dark disabled:opacity-30"
          >
            Найти соперника (−{energyCost} ⚡)
          </button>
          {!canAfford && <p className="text-xs text-white/40">Недостаточно энергии — восстанавливается со временем</p>}
        </div>
      </div>
    );
  }

  if (phase === "playing") {
    return (
      <div className="velvet-texture flex min-h-dvh flex-col gap-5 px-5 pt-[calc(env(safe-area-inset-top)+24px)] pb-10">
        <div className="metal-banner overflow-hidden rounded-2xl border border-white/15 px-4 py-3 text-center">
          <p className="text-xs font-semibold text-white/60">
            Дуэль · раунд {round} {isRealOpponent ? "" : "(бот)"}
          </p>
          <p className="mt-1 text-2xl font-extrabold text-white">
            Вы {userScore} : {oppScore} {opponentName}
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
        {result.won ? "Победа в дуэли! 🎉" : "Поражение в дуэли"}
      </p>
      <p className="text-3xl font-extrabold">
        {userScore} : {oppScore}
      </p>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-semibold text-gold">+{result.rewardCoins.toLocaleString("ru-RU")} монет</p>
        <p className="text-xs text-white/50">+{result.rewardXp} XP</p>
        <p
          className="mt-1.5 text-sm font-bold"
          style={{ color: result.pointsDelta >= 0 ? "#6ee7a0" : "#ff6b6b" }}
        >
          {result.pointsDelta >= 0 ? "+" : ""}
          {result.pointsDelta} 🏆 · {result.leagueLabel}
        </p>
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
        Ещё дуэль
      </button>
    </div>
  );
}
