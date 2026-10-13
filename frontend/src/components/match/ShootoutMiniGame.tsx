import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { useState } from "react";
import { useShootoutRound } from "../../lib/queries";
import { haptics } from "../../lib/telegram";
import { sfx } from "../../lib/sfx";
import type { QuickMatchResult, ShootoutPower, ShootoutRoundOutcome, ShootoutZone } from "../../types/game";

interface Props {
  draftId: string;
  opponentName: string;
  onFinished: (result: QuickMatchResult) => void;
}

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

export function ShootoutMiniGame({ draftId, opponentName, onFinished }: Props) {
  const roundMutation = useShootoutRound();
  const [kickZone, setKickZone] = useState<ShootoutZone | null>(null);
  const [kickPower, setKickPower] = useState<ShootoutPower>("MEDIUM");
  const [saveZone, setSaveZone] = useState<ShootoutZone | null>(null);
  const [userScore, setUserScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [round, setRound] = useState(1);
  const [lastOutcome, setLastOutcome] = useState<ShootoutRoundOutcome | null>(null);
  const [showingOutcome, setShowingOutcome] = useState(false);

  const canShoot = kickZone !== null && saveZone !== null && !roundMutation.isPending && !showingOutcome;

  function shoot() {
    if (kickZone === null || saveZone === null) return;
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
          if (response.outcome.userSaved) {
            haptics.notify("success");
          } else if (response.outcome.userConceded) {
            haptics.impact("heavy");
          }

          setTimeout(() => {
            setShowingOutcome(false);
            setKickZone(null);
            setSaveZone(null);
            if (response.finished && response.result) {
              onFinished(response.result);
            } else {
              setRound(response.round);
            }
          }, 1900);
        },
      },
    );
  }

  return (
    <div className="flex min-h-dvh flex-col gap-5 px-5 pt-[calc(env(safe-area-inset-top)+24px)] pb-10">
      <div className="text-center">
        <p className="text-xs font-semibold text-white/50">Серия пенальти · раунд {round}</p>
        <p className="mt-1 text-2xl font-extrabold">
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
            className="mt-auto rounded-full bg-gold py-3.5 text-sm font-extrabold text-pitch-dark disabled:opacity-30"
          >
            Пробить!
          </button>
        </>
      )}
    </div>
  );
}
