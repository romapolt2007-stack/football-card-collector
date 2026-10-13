import { RARITY_THEME } from "../cards/rarityTheme";
import type { MarketTrend } from "../../types/game";

interface Props {
  trends: MarketTrend[];
}

/** Бегущая строка трендов цен по редкости — опирается на реальные продажи за 24ч. */
export function TrendTicker({ trends }: Props) {
  if (trends.length === 0) return null;

  const items = [...trends, ...trends];

  return (
    <div className="overflow-hidden rounded-full border border-white/10 bg-white/5 py-1.5">
      <div className="flex w-max animate-[marquee_22s_linear_infinite] gap-6 px-4">
        {items.map((t, i) => (
          <span key={i} className="flex shrink-0 items-center gap-1.5 text-xs font-semibold whitespace-nowrap">
            {RARITY_THEME[t.rarity].emoji} {RARITY_THEME[t.rarity].label}
            <span style={{ color: t.changePct >= 0 ? "#6ee7a0" : "#ff6b6b" }}>
              {t.changePct >= 0 ? "▲" : "▼"} {Math.abs(t.changePct)}%
            </span>
            <span className="text-white/40">· ~{t.recentAvg.toLocaleString("ru-RU")} 🪙</span>
          </span>
        ))}
      </div>
    </div>
  );
}
