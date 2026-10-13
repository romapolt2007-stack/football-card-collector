import { useState } from "react";
import { LuckyReel } from "./LuckyReel";
import { useLuckySpin, useStakeTiers } from "../../lib/useLuckySpin";
import { useAuthStore } from "../../store/useAuthStore";
import type { LuckySpinResult } from "../../types/game";

export function LuckySpinPanel() {
  const { data: tiers, isLoading } = useStakeTiers();
  const user = useAuthStore((s) => s.user);
  const spin = useLuckySpin();
  const [stake, setStake] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<LuckySpinResult | null>(null);

  function startSpin(selectedStake: number) {
    setStake(selectedStake);
    setSpinning(true);
    setResult(null);
    spin.mutate(selectedStake, { onSuccess: setResult });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-white/50">
        Выберите ставку — чем выше, тем лучше шансы на редкую карту. Каждый 100-й спин — гарантированная
        удача x5.
      </p>

      {isLoading && <p className="text-sm text-white/50">Загрузка...</p>}

      <div className="grid grid-cols-2 gap-3">
        {tiers?.map((tier) => (
          <button
            key={tier.stake}
            onClick={() => startSpin(tier.stake)}
            disabled={(user?.coins ?? 0) < tier.stake}
            className="flex flex-col items-center gap-1 rounded-2xl border-2 border-white/15 bg-white/5 p-4 text-center disabled:opacity-40"
          >
            <span className="text-sm font-bold">{tier.label}</span>
            <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-semibold">
              {tier.stake.toLocaleString("ru-RU")} 🪙
            </span>
          </button>
        ))}
      </div>

      {spinning && stake && (
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
