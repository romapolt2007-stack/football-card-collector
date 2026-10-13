import { useState } from "react";
import { CaseRoulette } from "../components/cases/CaseRoulette";
import { useCases, useSpinCase } from "../lib/useCases";
import { useAuthStore } from "../store/useAuthStore";
import type { CaseDef, CaseSpinResult } from "../types/game";

const CASE_EMOJI: Record<string, string> = {
  common: "🎰",
  rare: "🎲",
  epic: "💠",
  mythic: "👑",
};

export function CasesScreen() {
  const { data: cases, isLoading } = useCases();
  const user = useAuthStore((s) => s.user);
  const spinCase = useSpinCase();
  const [opening, setOpening] = useState<CaseDef | null>(null);
  const [spinResult, setSpinResult] = useState<CaseSpinResult | null>(null);

  function openCase(def: CaseDef) {
    setOpening(def);
    setSpinResult(null);
    spinCase.mutate(def.id, { onSuccess: setSpinResult });
  }

  return (
    <div className="flex min-h-dvh flex-col gap-5 px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-28">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold">🎰 Кейсы</h1>
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold">
          {(user?.coins ?? 0).toLocaleString("ru-RU")} 🪙
        </span>
      </header>

      {isLoading && <p className="text-sm text-white/50">Загрузка...</p>}

      <div className="grid grid-cols-2 gap-3">
        {cases?.map((c) => (
          <button
            key={c.id}
            onClick={() => openCase(c)}
            disabled={(user?.coins ?? 0) < c.priceCoins}
            className="flex flex-col items-center gap-2 rounded-2xl border-2 border-white/15 bg-white/5 p-4 text-center disabled:opacity-40"
          >
            <span className="text-3xl">{CASE_EMOJI[c.id] ?? "🎁"}</span>
            <span className="text-sm font-bold">{c.title}</span>
            <span className="mt-1 rounded-full bg-black/30 px-3 py-1 text-xs font-semibold">
              {c.priceCoins.toLocaleString("ru-RU")} 🪙
            </span>
          </button>
        ))}
      </div>

      {opening && (
        <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-black/90 px-4">
          <p className="mb-6 text-sm font-semibold text-white/70">{opening.title}</p>
          {!spinResult ? (
            <p className="text-sm text-white/40">Крутим...</p>
          ) : (
            <CaseRoulette
              caseDef={opening}
              prize={spinResult.prize}
              onDone={() => {
                setOpening(null);
                setSpinResult(null);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
