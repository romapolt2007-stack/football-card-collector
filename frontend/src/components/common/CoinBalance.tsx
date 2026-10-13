import { useEffect, useRef, useState } from "react";

interface Props {
  coins: number;
}

/** Золотой счётчик монет: вспыхивает и подпрыгивает при изменении, со знаком +/- пролетающим вверх. */
export function CoinBalance({ coins }: Props) {
  const prevRef = useRef(coins);
  const [delta, setDelta] = useState<number | null>(null);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    const diff = coins - prevRef.current;
    if (diff !== 0) {
      setDelta(diff);
      setPulseKey((k) => k + 1);
      const timer = setTimeout(() => setDelta(null), 1000);
      prevRef.current = coins;
      return () => clearTimeout(timer);
    }
    prevRef.current = coins;
  }, [coins]);

  return (
    <div className="relative">
      {delta !== null && (
        <span
          key={pulseKey}
          className="float-up-fade pointer-events-none absolute -top-1 right-0 text-xs font-extrabold"
          style={{ color: delta > 0 ? "#6ee7a0" : "#ff6b6b" }}
        >
          {delta > 0 ? `+${delta.toLocaleString("ru-RU")}` : delta.toLocaleString("ru-RU")}
        </span>
      )}
      <span
        key={`pulse-${pulseKey}`}
        className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-extrabold ${
          delta !== null ? "coin-pulse" : ""
        }`}
        style={{
          borderColor: "rgba(255,209,102,0.5)",
          background: "linear-gradient(135deg, rgba(255,209,102,0.22), rgba(255,209,102,0.06))",
          boxShadow: "0 0 14px rgba(255,209,102,0.3)",
          color: "#ffe9b3",
        }}
      >
        {coins.toLocaleString("ru-RU")}
        <span className="text-base">🪙</span>
      </span>
    </div>
  );
}
