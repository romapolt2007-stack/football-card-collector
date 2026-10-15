import { useMemo } from "react";

interface Props {
  amount: number;
  onChange: (amount: number) => void;
  min: number;
  max: number;
}

const PRESETS = [1_000, 10_000, 100_000, 1_000_000, 10_000_000];
const SLIDER_STEPS = 1000;

function roundNice(value: number): number {
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const step = magnitude / 2 || 1;
  return Math.max(1, Math.round(value / step) * step);
}

function sliderToAmount(t: number, min: number, max: number): number {
  const raw = min * Math.pow(max / min, t);
  return Math.min(max, Math.max(min, roundNice(raw)));
}

function amountToSlider(amount: number, min: number, max: number): number {
  if (max <= min) return 0;
  const clamped = Math.min(max, Math.max(min, amount));
  return Math.log(clamped / min) / Math.log(max / min);
}

function formatShort(n: number): string {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000) return `${n / 1_000}k`;
  return `${n}`;
}

export function SpinAmountSlider({ amount, onChange, min, max }: Props) {
  const sliderValue = useMemo(() => Math.round(amountToSlider(amount, min, max) * SLIDER_STEPS), [amount, min, max]);
  const disabled = max <= min;

  function handleSlider(raw: number) {
    onChange(sliderToAmount(raw / SLIDER_STEPS, min, max));
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-white/50">
        <span>Ставка за спин</span>
        <span className="font-extrabold text-gold">{amount.toLocaleString("ru-RU")} 🪙</span>
      </div>
      <input
        type="range"
        min={0}
        max={SLIDER_STEPS}
        value={sliderValue}
        disabled={disabled}
        onChange={(e) => handleSlider(Number(e.target.value))}
        className="w-full accent-[#ffd166] disabled:opacity-30"
      />
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {PRESETS.filter((p) => p >= min && p <= max).map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
            style={{
              borderColor: amount === p ? "rgba(255,209,102,0.6)" : "rgba(255,255,255,0.15)",
              color: amount === p ? "#ffd166" : "rgba(255,255,255,0.5)",
              background: amount === p ? "rgba(255,209,102,0.1)" : "transparent",
            }}
          >
            {formatShort(p)}
          </button>
        ))}
      </div>
    </div>
  );
}
