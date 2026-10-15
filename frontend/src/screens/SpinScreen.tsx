import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useSaveSpinPlayer, useSellSpinPlayer, useSpinPlayer, useSpinStatus } from "../lib/useSpin";
import { RarityCard } from "../components/cards/RarityCard";
import { haptics } from "../lib/telegram";
import type { Card, PlayerSpinResult } from "../types/game";

function formatCountdown(ms: number): string {
  const totalMin = Math.ceil(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h} ч ${m} мин`;
  return `${m} мин`;
}

function previewCard(result: PlayerSpinResult): Card {
  return {
    id: "preview",
    playerId: result.player.id,
    ownerId: "",
    rarity: result.rarity,
    isListed: false,
    quickSellPrice: result.sellPrice,
    obtainedAt: new Date().toISOString(),
    player: result.player,
  };
}

export function SpinScreen() {
  const user = useAuthStore((s) => s.user);
  const status = useSpinStatus();
  const spin = useSpinPlayer();
  const save = useSaveSpinPlayer();
  const sell = useSellSpinPlayer();
  const [result, setResult] = useState<PlayerSpinResult | null>(null);

  function handleSpin() {
    haptics.impact("medium");
    spin.mutate(undefined, { onSuccess: setResult });
  }

  function handleSave() {
    haptics.impact("light");
    save.mutate(undefined, { onSuccess: () => setResult(null) });
  }

  function handleSell() {
    haptics.impact("light");
    sell.mutate(undefined, { onSuccess: () => setResult(null) });
  }

  const ready = status.data?.ready ?? false;

  return (
    <div className="flex h-dvh flex-col overflow-y-auto pb-24">
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-3">
        <h1 className="text-lg font-extrabold text-gold">🎰 Собрать</h1>
        <span className="rounded-full border border-gold/30 bg-black/30 px-3 py-1 text-sm font-bold text-gold">
          {(user?.coins ?? 0).toLocaleString("ru-RU")} 🪙
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
        {result ? (
          <div className="flex flex-col items-center gap-4">
            <RarityCard card={previewCard(result)} size="lg" />
            <p className="text-sm text-white/60">Примерная стоимость: {result.estimatedValue.toLocaleString("ru-RU")} 🪙</p>
            <div className="flex gap-3">
              <button
                onClick={handleSell}
                disabled={sell.isPending}
                className="rounded-full border-2 border-white/20 bg-black/40 px-5 py-3 text-sm font-bold disabled:opacity-40"
              >
                Продать за {result.sellPrice.toLocaleString("ru-RU")} 🪙
              </button>
              <button
                onClick={handleSave}
                disabled={save.isPending}
                className="rounded-full bg-gold px-5 py-3 text-sm font-extrabold text-pitch-dark disabled:opacity-40"
              >
                💾 Сохранить
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex h-48 w-36 items-center justify-center rounded-2xl border-2 border-dashed border-gold/30 text-5xl">
              🎴
            </div>
            {status.isLoading ? (
              <p className="text-sm text-white/50">Загрузка...</p>
            ) : ready ? (
              <button
                onClick={handleSpin}
                disabled={spin.isPending}
                className="spin-button-texture rounded-full bg-gold px-10 py-4 text-base font-extrabold tracking-wide text-pitch-dark disabled:opacity-40"
              >
                {spin.isPending ? "Крутим..." : "КРУТИТЬ"}
              </button>
            ) : (
              <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-sm text-white/50">Бесплатный спин через</p>
                <p className="text-lg font-bold text-gold">{formatCountdown(status.data?.msLeft ?? 0)}</p>
              </div>
            )}
            {spin.isError && <p className="text-xs text-red-400">{(spin.error as Error).message}</p>}
          </>
        )}
      </div>
    </div>
  );
}
