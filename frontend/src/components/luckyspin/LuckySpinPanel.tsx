import { useMemo, useState } from "react";
import { LuckyReel } from "./LuckyReel";
import { RARITY_THEME } from "../cards/rarityTheme";
import { useLuckySpin, useLuckySpinMeta, weightsForStake } from "../../lib/useLuckySpin";
import { useAuthStore } from "../../store/useAuthStore";
import type { LuckySpinResult, Rarity } from "../../types/game";

const RARITY_ORDER: Rarity[] = ["BRONZE", "SILVER", "GOLD", "LEGEND", "ICON"];

function riskLabel(fraction: number): string {
  if (fraction < 0.25) return "Осторожно";
  if (fraction < 0.5) return "Уверенно";
  if (fraction < 0.75) return "Рискованно";
  return "Ва-банк";
}

export function LuckySpinPanel() {
  const { data: meta, isLoading } = useLuckySpinMeta();
  const user = useAuthStore((s) => s.user);
  const spin = useLuckySpin();
  const [stake, setStake] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<LuckySpinResult | null>(null);

  const currentStake = stake ?? meta?.minStake ?? 100;

  const odds = useMemo(() => {
    if (!meta) return null;
    const weights = weightsForStake(meta, currentStake);
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    return RARITY_ORDER.map((r) => ({ rarity: r, pct: (weights[r] / total) * 100 }));
  }, [meta, currentStake]);

  const fraction = meta ? (currentStake - meta.minStake) / (meta.maxStake - meta.minStake) : 0;
  const canAfford = (user?.coins ?? 0) >= currentStake;

  function startSpin() {
    setSpinning(true);
    setResult(null);
    spin.mutate(currentStake, { onSuccess: setResult });
  }

  if (isLoading || !meta) return <p className="text-sm text-white/50">Загрузка...</p>;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-white/50">
        Двигайте ползунок — чем выше ставка, тем лучше шансы на редкую карту. Каждый 100-й спин —
        гарантированная удача x5.
      </p>

      <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/50">{riskLabel(fraction)}</span>
          <span className="text-lg font-extrabold text-gold">
            {currentStake.toLocaleString("ru-RU")} 🪙
          </span>
        </div>

        <input
          type="range"
          min={meta.minStake}
          max={meta.maxStake}
          step={meta.step}
          value={currentStake}
          onChange={(e) => setStake(Number(e.target.value))}
          className="mt-3 w-full accent-gold"
        />
        <div className="mt-1 flex justify-between text-[10px] text-white/40">
          <span>{meta.minStake}</span>
          <span>{meta.maxStake}</span>
        </div>

        {odds && (
          <div className="mt-4 flex flex-col gap-1.5">
            {odds.map(({ rarity, pct }) => (
              <div key={rarity} className="flex items-center gap-2 text-xs">
                <span className="w-20 shrink-0 text-white/60">
                  {RARITY_THEME[rarity].emoji} {RARITY_THEME[rarity].label}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(pct, 1)}%`, background: RARITY_THEME[rarity].borderColor }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-white/40">{pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={startSpin}
          disabled={!canAfford}
          className="mt-4 w-full rounded-full bg-gold py-3 text-sm font-extrabold text-pitch-dark disabled:opacity-30"
        >
          {canAfford ? "Крутить" : "Недостаточно монет"}
        </button>
      </div>

      {spinning && (
        <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-black/90 px-4">
          {!result ? (
            <p className="text-sm text-white/40">Крутим...</p>
          ) : (
            <LuckyReel
              card={result.card}
              wasPity={result.wasPity}
              onDone={() => {
                setSpinning(false);
                setResult(null);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
