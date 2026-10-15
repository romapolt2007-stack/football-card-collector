import { useState } from "react";
import confetti from "canvas-confetti";
import { useAuthStore } from "../store/useAuthStore";
import { useSaveSpinPlayer, useSellSpinPlayer, useSpinPlayer, useSpinStatus } from "../lib/useSpin";
import { RarityCard } from "../components/cards/RarityCard";
import { SpinReel } from "../components/spin/SpinReel";
import { SpinFilterBar } from "../components/spin/SpinFilterBar";
import { HotStreakMeter } from "../components/spin/HotStreakMeter";
import { RARITY_THEME } from "../components/cards/rarityTheme";
import { haptics } from "../lib/telegram";
import type { Card, PlayerSpinResult, SpinFilters } from "../types/game";

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

const TOP_TIER = new Set(["LEGEND", "ICON"]);

export function SpinScreen() {
  const user = useAuthStore((s) => s.user);
  const status = useSpinStatus();
  const spin = useSpinPlayer();
  const save = useSaveSpinPlayer();
  const sell = useSellSpinPlayer();
  const [filters, setFilters] = useState<SpinFilters>({});
  const [result, setResult] = useState<PlayerSpinResult | null>(null);
  const [reeling, setReeling] = useState(false);
  const [revealed, setRevealed] = useState(false);

  function handleSpin() {
    haptics.impact("medium");
    setRevealed(false);
    spin.mutate(filters, {
      onSuccess: (r) => {
        setResult(r);
        setReeling(true);
      },
    });
  }

  function handleReelDone() {
    setReeling(false);
    setRevealed(true);
    if (result && TOP_TIER.has(result.rarity)) {
      confetti({
        particleCount: result.rarity === "ICON" ? 160 : 110,
        spread: 85,
        origin: { y: 0.4 },
        colors: result.rarity === "ICON" ? ["#ff3b5c", "#ffffff"] : ["#b24bf3", "#ffffff"],
      });
    }
  }

  function handleSave() {
    haptics.impact("light");
    save.mutate(undefined, {
      onSuccess: () => {
        setResult(null);
        setRevealed(false);
      },
    });
  }

  function handleSell() {
    haptics.impact("light");
    sell.mutate(undefined, {
      onSuccess: () => {
        setResult(null);
        setRevealed(false);
      },
    });
  }

  const ready = status.data?.ready ?? false;
  const theme = result ? RARITY_THEME[result.rarity] : null;

  return (
    <div className="velvet-texture flex h-dvh flex-col overflow-y-auto pb-24">
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-3">
        <h1 className="text-lg font-extrabold text-gold">🎰 Собрать</h1>
        <span className="rounded-full border border-gold/30 bg-black/30 px-3 py-1 text-sm font-bold text-gold">
          {(user?.coins ?? 0).toLocaleString("ru-RU")} 🪙
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4">
        {reeling && result ? (
          <SpinReel targetRarity={result.rarity} onDone={handleReelDone} />
        ) : revealed && result ? (
          <div className="flex flex-col items-center gap-4">
            <div
              className="relative overflow-hidden rounded-[28px] p-2"
              style={{
                background: `radial-gradient(circle at 50% 30%, ${theme!.borderColor}33 0%, transparent 70%)`,
              }}
            >
              <RarityCard card={previewCard(result)} size="lg" />
            </div>
            <p className="text-sm text-white/60">Примерная стоимость: {result.estimatedValue.toLocaleString("ru-RU")} 🪙</p>
            {result.wasHotUpgrade && (
              <p className="animate-pulse text-sm font-extrabold text-orange-400">🔥 Азарт сработал — апгрейд редкости!</p>
            )}
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
              <div className="flex w-full max-w-sm flex-col items-center gap-3">
                <HotStreakMeter streak={status.data?.hotStreak ?? 0} max={status.data?.hotStreakMax ?? 12} />
                <SpinFilterBar filters={filters} onChange={setFilters} />
                <button
                  onClick={handleSpin}
                  disabled={spin.isPending}
                  className="spin-button-texture w-full rounded-full bg-gold px-10 py-4 text-base font-extrabold tracking-wide text-pitch-dark disabled:opacity-40"
                >
                  {spin.isPending ? "Крутим..." : "КРУТИТЬ"}
                </button>
              </div>
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
