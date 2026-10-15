import { useMemo, useState, type CSSProperties } from "react";
import { LuckyReel } from "./LuckyReel";
import { TierBall } from "./TierBall";
import { RARITY_THEME } from "../cards/rarityTheme";
import {
  formatLongCountdown,
  useFreeLuckySpinStatus,
  useLuckySpin,
  useLuckySpinMeta,
  weightsForStake,
} from "../../lib/useLuckySpin";
import { useAuthStore } from "../../store/useAuthStore";
import { haptics } from "../../lib/telegram";
import type { LuckySpinResult, Rarity } from "../../types/game";

const RARITY_ORDER: Rarity[] = ["BRONZE", "SILVER", "GOLD", "LEGEND", "ICON"];

function riskLabel(fraction: number): string {
  if (fraction < 0.25) return "Осторожно";
  if (fraction < 0.5) return "Уверенно";
  if (fraction < 0.75) return "Рискованно";
  return "Ва-банк";
}

function lerpColor(from: string, to: string, t: number): string {
  const a = parseInt(from.slice(1), 16);
  const b = parseInt(to.slice(1), 16);
  const r = Math.round(((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * t);
  const g = Math.round(((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * t);
  const bl = Math.round((a & 255) + ((b & 255) - (a & 255)) * t);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

export function LuckySpinPanel() {
  const { data: meta, isLoading } = useLuckySpinMeta();
  const user = useAuthStore((s) => s.user);
  const spin = useLuckySpin();
  const freeSpin = useFreeLuckySpinStatus();
  const [stake, setStake] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<LuckySpinResult | null>(null);

  const currentStake = stake ?? meta?.minStake ?? 10_000;

  const odds = useMemo(() => {
    if (!meta) return null;
    const weights = weightsForStake(meta, currentStake);
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    return RARITY_ORDER.map((r) => ({ rarity: r, pct: (weights[r] / total) * 100 }));
  }, [meta, currentStake]);

  const fraction = meta ? (currentStake - meta.minStake) / (meta.maxStake - meta.minStake) : 0;
  const canAfford = (user?.coins ?? 0) >= currentStake;
  const sliderFillColor = lerpColor("#ffd166", "#ff3b5c", fraction);

  function startSpin() {
    haptics.impact("medium");
    setSpinning(true);
    setResult(null);
    spin.mutate({ stake: currentStake }, { onSuccess: setResult });
  }

  function startFreeSpin() {
    haptics.impact("medium");
    setSpinning(true);
    setResult(null);
    spin.mutate({ free: true }, { onSuccess: setResult });
  }

  if (isLoading || !meta) return <p className="text-sm text-white/50">Загрузка...</p>;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-white/50">
        Двигайте ползунок — чем выше ставка, тем лучше шансы на редкую карту. Каждый 100-й спин —
        гарантированная удача x5.
      </p>

      {freeSpin.data && (
        <div
          className="flex items-center justify-between rounded-2xl border p-4"
          style={{
            borderColor: freeSpin.ready ? "rgba(110,231,160,0.5)" : "rgba(255,255,255,0.1)",
            background: freeSpin.ready
              ? "linear-gradient(135deg, rgba(110,231,160,0.18), rgba(110,231,160,0.05))"
              : "rgba(255,255,255,0.05)",
            boxShadow: freeSpin.ready ? "0 0 20px rgba(110,231,160,0.25)" : "none",
          }}
        >
          <div>
            <p className={`font-semibold ${freeSpin.ready ? "neon-pulse" : ""}`}>🎁 Бесплатный спин</p>
            <p className="text-xs text-white/50">
              {freeSpin.ready ? "Доступен прямо сейчас" : `Через ${formatLongCountdown(freeSpin.msLeft)}`}
            </p>
          </div>
          <button
            onClick={startFreeSpin}
            disabled={!freeSpin.ready || spin.isPending}
            className="shrink-0 rounded-full bg-emerald-400 px-5 py-2 text-sm font-extrabold tracking-wide text-pitch-dark disabled:opacity-30"
          >
            SPIN
          </button>
        </div>
      )}

      <div
        className="foil-texture relative overflow-hidden rounded-2xl border p-4"
        style={{ borderColor: "rgba(255,209,102,0.25)", background: "rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/50">{riskLabel(fraction)}</span>
          <span className="text-lg font-extrabold text-gold" style={{ textShadow: "0 0 12px rgba(255,209,102,0.5)" }}>
            {currentStake.toLocaleString("ru-RU")} 🪙
          </span>
        </div>

        <input
          type="range"
          min={meta.minStake}
          max={meta.maxStake}
          step={meta.step}
          value={currentStake}
          onChange={(e) => setStake(Number(e.target.value))}
          className="luck-slider mt-3 w-full"
          style={
            {
              "--slider-pct": `${fraction * 100}%`,
              "--slider-fill-color": sliderFillColor,
            } as CSSProperties
          }
        />
        <div className="mt-1 flex justify-between text-[10px] text-white/40">
          <span>{meta.minStake}</span>
          <span>{meta.maxStake}</span>
        </div>

        {odds && (
          <div className="mt-4 flex flex-col gap-1.5">
            {odds.map(({ rarity, pct }) => (
              <div key={rarity} className="flex items-center gap-2 text-xs">
                <span className="flex w-20 shrink-0 items-center gap-1.5 text-white/60">
                  <TierBall
                    color={RARITY_THEME[rarity].borderColor}
                    glow={RARITY_THEME[rarity].glow}
                    emblem={rarity === "ICON"}
                  />
                  {RARITY_THEME[rarity].label}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(pct, 1)}%`,
                      background: RARITY_THEME[rarity].borderColor,
                      boxShadow: `0 0 6px ${RARITY_THEME[rarity].borderColor}`,
                    }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-white/40">{pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={startSpin}
          disabled={!canAfford}
          className="spin-button-texture relative mt-4 w-full overflow-hidden rounded-full bg-gold py-3.5 text-base font-extrabold tracking-widest text-pitch-dark shadow-[0_0_20px_rgba(255,209,102,0.4)] disabled:opacity-30"
        >
          {canAfford ? "SPIN" : "Недостаточно монет"}
        </button>
      </div>

      {spinning && (
        <div className="velvet-texture fixed inset-0 z-[90] flex flex-col items-center justify-center bg-black/90 px-4">
          {!result ? (
            <p className="text-sm text-white/40">Крутим...</p>
          ) : (
            <LuckyReel
              card={result.card}
              wasPity={result.wasPity}
              onDone={() => {
                setSpinning(false);
                setResult(null);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
