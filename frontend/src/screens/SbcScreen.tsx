import { useState } from "react";
import { SbcSubmitModal } from "../components/sbc/SbcSubmitModal";
import { SbcTile } from "../components/sbc/SbcTile";
import { CoinBalance } from "../components/common/CoinBalance";
import { useInventory } from "../lib/queries";
import { useSbcChallenges } from "../lib/useSbc";
import { useAuthStore } from "../store/useAuthStore";
import type { SbcDef } from "../types/game";

export function SbcScreen() {
  const { data, isLoading } = useSbcChallenges();
  const { data: cards } = useInventory();
  const user = useAuthStore((s) => s.user);
  const [active, setActive] = useState<SbcDef | null>(null);

  const completedIds = new Set(data?.completedIds ?? []);

  return (
    <div className="flex min-h-dvh flex-col gap-4 px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-28">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold">🛠️ Сборки</h1>
        <CoinBalance coins={user?.coins ?? 0} />
      </header>

      <p className="text-sm text-white/50">
        Сдайте карты, подходящие под требования сборки, и получите гарантированную награду
      </p>

      {isLoading && <p className="text-sm text-white/50">Загрузка...</p>}

      <div className="flex flex-col gap-3">
        {data?.sbcs.map((sbc) => (
          <SbcTile key={sbc.id} sbc={sbc} completed={completedIds.has(sbc.id)} onOpen={() => setActive(sbc)} />
        ))}
      </div>

      {active && <SbcSubmitModal sbc={active} cards={cards ?? []} onClose={() => setActive(null)} />}
    </div>
  );
}
