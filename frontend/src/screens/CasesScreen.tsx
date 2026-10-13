import { useState } from "react";
import { CaseRoulette } from "../components/cases/CaseRoulette";
import { CaseTile } from "../components/cases/CaseTile";
import { CoinBalance } from "../components/common/CoinBalance";
import { PillTabs } from "../components/common/PillTabs";
import { LuckySpinPanel } from "../components/luckyspin/LuckySpinPanel";
import { useCases, useSpinCase } from "../lib/useCases";
import { useAuthStore } from "../store/useAuthStore";
import type { CaseDef, CaseSpinResult } from "../types/game";

export function CasesScreen() {
  const [mode, setMode] = useState<"cases" | "lucky">("cases");
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
        <h1 className="text-lg font-extrabold">{mode === "cases" ? "🎰 Кейсы" : "🍀 Удача"}</h1>
        <CoinBalance coins={user?.coins ?? 0} />
      </header>

      <PillTabs
        layoutId="cases-tabs"
        active={mode}
        onChange={(id) => setMode(id as "cases" | "lucky")}
        tabs={[
          { id: "cases", label: "Кейсы" },
          { id: "lucky", label: "Удача" },
        ]}
      />

      {mode === "lucky" ? (
        <LuckySpinPanel />
      ) : (
        <>
          {isLoading && <p className="text-sm text-white/50">Загрузка...</p>}

          <div className="grid grid-cols-2 gap-3">
            {cases?.map((c) => (
              <CaseTile
                key={c.id}
                caseDef={c}
                disabled={(user?.coins ?? 0) < c.priceCoins}
                onOpen={() => openCase(c)}
              />
            ))}
          </div>
        </>
      )}

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
