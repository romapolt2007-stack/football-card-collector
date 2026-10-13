import { useState } from "react";
import { PackOpeningModal } from "../components/packs/PackOpeningModal";
import { PackTile } from "../components/packs/PackTile";
import { usePacks } from "../lib/queries";
import { useAuthStore } from "../store/useAuthStore";
import type { PackDef } from "../types/game";

export function PacksScreen() {
  const { data: packs, isLoading } = usePacks();
  const user = useAuthStore((s) => s.user);
  const [openingPack, setOpeningPack] = useState<PackDef | null>(null);

  function canAfford(pack: PackDef) {
    if (pack.isStarter) return !user?.hasClaimedStarter;
    return (user?.coins ?? 0) >= pack.priceCoins;
  }

  return (
    <div className="flex min-h-dvh flex-col gap-5 px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-28">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold">📦 Паки</h1>
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold">
          {(user?.coins ?? 0).toLocaleString("ru-RU")} 🪙
        </span>
      </header>

      {isLoading && <p className="text-sm text-white/50">Загрузка...</p>}

      <div className="grid grid-cols-2 gap-3">
        {packs?.map((pack) => (
          <PackTile
            key={pack.id}
            pack={pack}
            disabled={!canAfford(pack)}
            onOpen={() => setOpeningPack(pack)}
          />
        ))}
      </div>

      {openingPack && (
        <PackOpeningModal pack={openingPack} onClose={() => setOpeningPack(null)} />
      )}
    </div>
  );
}
