import { useEffect, useState } from "react";

interface Props {
  amount: number;
  onChange: (amount: number) => void;
  min: number;
  max: number;
}

const PRESETS = [1_000, 2_000, 3_000, 4_000, 5_000, 10_000];
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

export function SpinAmountSlider({ amount, onChange, min, max }: Props) {
  const [inputValue, setInputValue] = useState(String(amount));
  const disabled = max <= min;

  useEffect(() => {
    setInputValue(String(amount));
  }, [amount]);

  function handleSlider(raw: number) {
    onChange(sliderToAmount(raw / SLIDER_STEPS, min, max));
  }

  function commitInput() {
    const parsed = Math.round(Number(inputValue.replace(/[^\d]/g, "")));
    if (Number.isFinite(parsed) && parsed > 0) {
      onChange(Math.min(max, Math.max(min, parsed)));
    } else {
      setInputValue(String(amount));
    }
  }

  const sliderValue = Math.round(amountToSlider(amount, min, max) * SLIDER_STEPS);

  return (
    <div className="flex w-full flex-col gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gold/80">Своя ставка</span>

      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={SLIDER_STEPS}
          value={sliderValue}
          disabled={disabled}
          onChange={(e) => handleSlider(Number(e.target.value))}
          className="h-2 flex-1 accent-[#ffd166] disabled:opacity-30"
        />
        <input
          value={inputValue}
          inputMode="numeric"
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={commitInput}
          onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
          className="w-24 rounded-lg border border-gold/40 bg-black/40 px-2 py-1.5 text-right text-xs font-bold text-gold outline-none focus:border-gold"
        />
      </div>

      <div className="flex w-full gap-1.5">
        {PRESETS.filter((p) => p >= min && p <= max).map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className="flex-1 rounded-xl border py-1.5 text-[11px] font-bold"
            style={{
              borderColor: amount === p ? "rgba(255,209,102,0.6)" : "rgba(255,255,255,0.15)",
              color: amount === p ? "#ffd166" : "rgba(255,255,255,0.6)",
              background: amount === p ? "rgba(255,209,102,0.1)" : "transparent",
            }}
          >
            {p >= 1000 ? `${p / 1000}k` : p}
          </button>
        ))}
      </div>
    </div>
  );
}
