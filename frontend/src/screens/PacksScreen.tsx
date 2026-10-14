import { useState } from "react";
import { CoinBalance } from "../components/common/CoinBalance";
import { PackOpeningModal } from "../components/packs/PackOpeningModal";
import { PackTile } from "../components/packs/PackTile";
import { usePacks } from "../lib/queries";
import { useAuthStore } from "../store/useAuthStore";
import type { PackDef } from "../types/game";

export function PacksScreen() {
  const { data, isLoading } = usePacks();
  const packs = data?.packs;
  const user = useAuthStore((s) => s.user);
  const [openingPack, setOpeningPack] = useState<PackDef | null>(null);
  const [openKey, setOpenKey] = useState(0);

  function canAfford(pack: PackDef) {
    if (pack.isStarter) return !user?.hasClaimedStarter;
    return (user?.coins ?? 0) >= pack.effectivePrice;
  }

  function openPack(pack: PackDef) {
    setOpeningPack(pack);
    setOpenKey((k) => k + 1);
  }

  return (
    <div className="flex min-h-dvh flex-col gap-5 px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-28">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold">📦 Паки</h1>
        <CoinBalance coins={user?.coins ?? 0} />
      </header>

      {data?.happyHour && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-xs font-bold text-gold">
          🎉 Happy Hours — паки дешевле на {Math.round((data.happyHourDiscount ?? 0) * 100)}%
        </div>
      )}

      {isLoading && <p className="text-sm text-white/50">Загрузка...</p>}

      <div className="grid grid-cols-2 gap-3">
        {packs?.map((pack) => (
          <PackTile
            key={pack.id}
            pack={pack}
            disabled={!canAfford(pack)}
            onOpen={() => openPack(pack)}
          />
        ))}
      </div>

      {openingPack && (
        <PackOpeningModal
          key={`${openingPack.id}-${openKey}`}
          pack={openingPack}
          onClose={() => setOpeningPack(null)}
          onOpenAnother={() => openPack(openingPack)}
          canOpenAnother={canAfford(openingPack)}
        />
      )}
    </div>
  );
}
