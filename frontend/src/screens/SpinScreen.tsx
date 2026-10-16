import { useEffect, useState } from "react";
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
const DEFAULT_MIN = 1_000;
const DEFAULT_MAX = 10_000_000;
const AMOUNT_PRESETS = [1_000, 10_000, 100_000, 1_000_000, 10_000_000];

function formatPreset(n: number): string {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000) return `${n / 1_000}k`;
  return `${n}`;
}

export function SpinScreen() {
  const user = useAuthStore((s) => s.user);
  const status = useSpinStatus();
  const spin = useSpinPlayer();
  const save = useSaveSpinPlayer();
  const sell = useSellSpinPlayer();
  const [filters, setFilters] = useState<SpinFilters>({});
  const [amount, setAmount] = useState(DEFAULT_MIN);
  const [result, setResult] = useState<PlayerSpinResult | null>(null);
  const [reeling, setReeling] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const minCost = status.data?.minCost ?? DEFAULT_MIN;
  const maxCost = status.data?.maxCost ?? DEFAULT_MAX;
  const coins = user?.coins ?? 0;
  const affordableMax = Math.max(minCost, Math.min(maxCost, coins));
  const canAfford = coins >= minCost;

  useEffect(() => {
    setAmount((prev) => Math.min(Math.max(prev, minCost), affordableMax));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minCost, affordableMax]);

  function handleSpin() {
    haptics.impact("medium");
    setRevealed(false);
    spin.mutate(
      { ...filters, amount },
      {
        onSuccess: (r) => {
          setResult(r);
          setReeling(true);
        },
      },
    );
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

  const theme = result ? RARITY_THEME[result.rarity] : null;

  return (
    <div className="velvet-texture flex h-dvh flex-col overflow-y-auto pb-24">
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-3">
        <h1 className="text-lg font-extrabold text-gold">🎰 Собрать</h1>
        <span className="rounded-full border border-gold/30 bg-black/30 px-3 py-1 text-sm font-bold text-gold">
          {coins.toLocaleString("ru-RU")} 🪙
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4">
        {reeling && result ? (
          <SpinReel targetRarity={result.rarity} player={result.player} onDone={handleReelDone} />
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
            {result.wasGuaranteedTop && (
              <p className="animate-pulse text-sm font-extrabold text-orange-400">🎁 Азарт сработал — гарантированная топ-карта!</p>
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
            <div className="relative flex h-[270px] w-[200px] items-center justify-center overflow-hidden rounded-[22px] border-[3px] border-gold/40 bg-black/40">
              <div className="holo-idle-glow pointer-events-none absolute inset-0" />
              <span className="relative text-5xl opacity-60">🎴</span>
            </div>
            {status.isLoading ? (
              <p className="text-sm text-white/50">Загрузка...</p>
            ) : (
              <div className="flex w-full max-w-sm flex-col items-center gap-3">
                <HotStreakMeter
                  streak={status.data?.hotStreak ?? 0}
                  threshold={status.data?.hotStreakThreshold ?? 150}
                  level={status.data?.level ?? 1}
                />
                <SpinFilterBar filters={filters} onChange={setFilters} />
                {canAfford ? (
                  <>
                    <div className="flex w-full gap-1.5">
                      {AMOUNT_PRESETS.filter((p) => p >= minCost && p <= affordableMax).map((p) => (
                        <button
                          key={p}
                          onClick={() => {
                            haptics.select();
                            setAmount(p);
                          }}
                          className="flex-1 rounded-xl border py-2 text-xs font-bold"
                          style={{
                            borderColor: amount === p ? "rgba(255,209,102,0.6)" : "rgba(255,255,255,0.15)",
                            color: amount === p ? "#ffd166" : "rgba(255,255,255,0.6)",
                            background: amount === p ? "rgba(255,209,102,0.12)" : "transparent",
                          }}
                        >
                          {formatPreset(p)}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleSpin}
                      disabled={spin.isPending}
                      className="spin-pulse w-full rounded-full bg-[linear-gradient(135deg,#ffe28a,#ffb020,#ff8a00)] px-10 py-5 text-lg font-extrabold tracking-wide text-pitch-dark disabled:animate-none disabled:opacity-40"
                    >
                      {spin.isPending ? "Крутим..." : `КРУТИТЬ за ${amount.toLocaleString("ru-RU")} 🪙`}
                    </button>
                  </>
                ) : (
                  <p className="text-center text-sm text-white/50">
                    Нужно минимум {minCost.toLocaleString("ru-RU")} 🪙 на спин
                  </p>
                )}
              </div>
            )}
            {spin.isError && <p className="text-xs text-red-400">{(spin.error as Error).message}</p>}
          </>
        )}
      </div>
    </div>
  );
}
