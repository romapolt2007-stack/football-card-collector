import { useState } from "react";
import { useApplyCosmeticPatch, useCosmeticPatches } from "../lib/useCosmeticPatches";
import { haptics } from "../lib/telegram";

interface Props {
  onClose: () => void;
}

/**
 * «Патчи сообщества» — чисто косметические темы акцентного цвета интерфейса.
 * Никаких реальных лиг/клубов/игроков — только вымышленные названия и авторы,
 * процедурный контент как и везде в проекте.
 */
export function CommunityPatchesScreen({ onClose }: Props) {
  const { data, isLoading } = useCosmeticPatches();
  const apply = useApplyCosmeticPatch();
  const [selected, setSelected] = useState<string | null>(null);

  const installedId = data?.installedId ?? null;
  const activeSelection = selected ?? installedId;

  function handleImport() {
    if (!activeSelection || activeSelection === installedId) return;
    haptics.impact("medium");
    apply.mutate(activeSelection);
  }

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-black/95">
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-3">
        <h2 className="text-base font-bold">Патчи сообщества</h2>
        <button onClick={onClose} className="text-sm text-white/50">
          Закрыть
        </button>
      </div>

      <div className="metal-banner mx-4 overflow-hidden rounded-2xl border border-white/15 px-4 py-3 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Community Patches</p>
        <p className="mt-0.5 text-lg font-extrabold text-white">🧩 Косметические темы</p>
      </div>

      {isLoading && <p className="mt-6 text-center text-sm text-white/50">Загрузка...</p>}

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-3">
          {data?.patches.map((patch) => {
            const isInstalled = patch.id === installedId;
            const isSelected = patch.id === activeSelection;
            return (
              <button
                key={patch.id}
                onClick={() => {
                  haptics.select();
                  setSelected(patch.id);
                }}
                className="relative flex items-center gap-3 overflow-hidden rounded-xl border-2 p-3 text-left"
                style={{
                  borderColor: isSelected ? patch.accentColor : "rgba(255,255,255,0.12)",
                  background: "linear-gradient(160deg, rgba(255,255,255,0.07), rgba(255,255,255,0.01))",
                  boxShadow: isSelected ? `0 0 14px ${patch.accentColor}55` : "none",
                }}
              >
                <div className="foil-texture pointer-events-none absolute inset-0" />
                <div
                  className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-xl"
                  style={{
                    background: `linear-gradient(160deg, ${patch.accentColor}55, ${patch.accentColor}11)`,
                    border: `1px solid ${patch.accentColor}88`,
                  }}
                >
                  🧩
                </div>
                <div className="relative min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{patch.title}</p>
                  <p className="truncate text-xs text-white/50">
                    от {patch.author} · {patch.sizeLabel}
                  </p>
                  <p className="truncate text-[11px] text-white/40">{patch.description}</p>
                </div>
                <span
                  className="relative shrink-0 rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide"
                  style={{
                    background: isInstalled ? "rgba(52,211,153,0.18)" : "rgba(255,209,102,0.15)",
                    color: isInstalled ? "#34d399" : "#ffd166",
                  }}
                >
                  {isInstalled ? "Установлено" : "Скачать"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-8 pt-2">
        {apply.isError && <p className="mb-2 text-center text-xs text-red-400">Не удалось применить патч</p>}
        <button
          onClick={handleImport}
          disabled={!activeSelection || activeSelection === installedId || apply.isPending}
          className="spin-button-texture relative w-full overflow-hidden rounded-full bg-gold py-3.5 text-sm font-extrabold tracking-wide text-pitch-dark disabled:opacity-30"
        >
          ИМПОРТИРОВАТЬ ПАТЧ
        </button>
      </div>
    </div>
  );
}
