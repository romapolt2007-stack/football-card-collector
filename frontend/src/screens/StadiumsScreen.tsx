import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import {
  useOpenStadiumCase,
  useSaveSpinStadium,
  useSellSpinStadium,
  useSpinStadium,
  useStadiumCases,
  useStadiumSpinStatus,
} from "../lib/useSpin";
import { StadiumReveal } from "../components/spin/StadiumReveal";
import { useStadiumBuff } from "../lib/useMeta";
import { haptics } from "../lib/telegram";
import type { StadiumCard, StadiumSpinResult } from "../types/game";

const RARITY_LABEL: Record<string, string> = {
  BRONZE: "Бронза",
  SILVER: "Серебро",
  GOLD: "Золото",
  LEGEND: "Легенда",
  ICON: "Икона",
};

function formatCountdown(ms: number): string {
  const totalMin = Math.ceil(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h} ч ${m} мин`;
  return `${m} мин`;
}

function previewStadiumCard(result: StadiumSpinResult): StadiumCard {
  return {
    id: "preview",
    stadiumId: result.stadium.id,
    ownerId: "",
    isListed: false,
    quickSellPrice: result.sellPrice,
    obtainedAt: new Date().toISOString(),
    stadium: result.stadium,
  };
}

const CASE_STYLE: Record<string, { emoji: string; gradient: string; border: string }> = {
  bronze: { emoji: "🥉", gradient: "linear-gradient(160deg, #a96a35 0%, #6b3f1c 100%)", border: "#cd7f32" },
  silver: { emoji: "🥈", gradient: "linear-gradient(160deg, #e7e9ee 0%, #767b85 100%)", border: "#e6e8ec" },
  gold: { emoji: "🥇", gradient: "linear-gradient(160deg, #fff1c2 0%, #8a5a06 100%)", border: "#ffd166" },
  legendary: { emoji: "👑", gradient: "linear-gradient(160deg, #d7b3ff 0%, #3b0a7a 100%)", border: "#b24bf3" },
};

export function StadiumsScreen() {
  const user = useAuthStore((s) => s.user);
  const status = useStadiumSpinStatus();
  const buff = useStadiumBuff();
  const cases = useStadiumCases();
  const spin = useSpinStadium();
  const openCase = useOpenStadiumCase();
  const save = useSaveSpinStadium();
  const sell = useSellSpinStadium();
  const [result, setResult] = useState<StadiumSpinResult | null>(null);

  function handleFreeSpin() {
    haptics.impact("medium");
    spin.mutate(undefined, { onSuccess: setResult });
  }

  function handleOpenCase(caseId: string) {
    haptics.impact("medium");
    openCase.mutate(caseId, { onSuccess: setResult });
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
  const busy = spin.isPending || openCase.isPending;

  return (
    <div className="velvet-texture flex h-dvh flex-col overflow-y-auto pb-24">
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-3">
        <h1 className="text-lg font-extrabold text-gold">🏟️ Стадионы</h1>
        <span className="rounded-full border border-gold/30 bg-black/30 px-3 py-1 text-sm font-bold text-gold">
          {(user?.coins ?? 0).toLocaleString("ru-RU")} 🪙
        </span>
      </div>

      {buff.data?.bestRarity && (
        <div className="mx-4 mb-3 flex items-center justify-between rounded-xl border border-gold/30 bg-gold/10 px-3 py-2 text-xs">
          <span className="font-semibold text-gold">
            🏟️ Бафф стадиона: {RARITY_LABEL[buff.data.bestRarity] ?? buff.data.bestRarity}
          </span>
          <span className="font-bold text-white/70">
            +{Math.round(buff.data.topTierWeightBonus * 100)}% топ-карты · +{buff.data.extraListingSlots} слотов рынка
          </span>
        </div>
      )}

      {result ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          <StadiumReveal stadiumCard={previewStadiumCard(result)} />
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
        <div className="flex flex-col gap-5 px-4 pb-6">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-6">
            <div className="flex h-20 w-16 items-center justify-center rounded-xl border-2 border-dashed border-gold/30 text-3xl">
              🏟️
            </div>
            {status.isLoading ? (
              <p className="text-sm text-white/50">Загрузка...</p>
            ) : ready ? (
              <button
                onClick={handleFreeSpin}
                disabled={busy}
                className="spin-button-texture rounded-full bg-gold px-8 py-3 text-sm font-extrabold tracking-wide text-pitch-dark disabled:opacity-40"
              >
                {spin.isPending ? "Крутим..." : "🎁 Бесплатный спин"}
              </button>
            ) : (
              <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-xs text-white/50">Бесплатный спин через</p>
                <p className="text-base font-bold text-gold">{formatCountdown(status.data?.msLeft ?? 0)}</p>
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Кейсы стадионов</p>
            <div className="grid grid-cols-2 gap-3">
              {(cases.data ?? []).map((c) => {
                const style = CASE_STYLE[c.id] ?? CASE_STYLE.bronze;
                const canAfford = (user?.coins ?? 0) >= c.priceCoins;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleOpenCase(c.id)}
                    disabled={busy || !canAfford}
                    className="spin-button-texture relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border-2 p-4 disabled:opacity-40"
                    style={{ background: style.gradient, borderColor: style.border }}
                  >
                    <span className="text-3xl">{style.emoji}</span>
                    <span className="text-xs font-bold text-white">{c.title}</span>
                    <span className="rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-extrabold text-white">
                      {c.priceCoins.toLocaleString("ru-RU")} 🪙
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {(spin.isError || openCase.isError) && (
            <p className="text-center text-xs text-red-400">
              {((spin.error ?? openCase.error) as Error)?.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
