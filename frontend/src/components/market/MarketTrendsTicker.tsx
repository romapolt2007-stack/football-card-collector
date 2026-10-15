import { useMarketTrends } from "../../lib/useMeta";

export function MarketTrendsTicker() {
  const trends = useMarketTrends();
  const data = trends.data ?? [];
  if (data.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-white/5 p-2.5">
      <p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-white/40">
        📰 Тренды дня
      </p>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {data.map((t) => {
          const up = t.changePct > 0;
          const flat = t.changePct === 0;
          return (
            <span
              key={t.leagueId}
              className="shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold"
              style={{
                borderColor: flat ? "rgba(255,255,255,0.15)" : up ? "rgba(110,231,160,0.4)" : "rgba(255,107,107,0.4)",
                color: flat ? "rgba(255,255,255,0.6)" : up ? "#6ee7a0" : "#ff6b6b",
                background: flat ? "transparent" : up ? "rgba(110,231,160,0.08)" : "rgba(255,107,107,0.08)",
              }}
            >
              {t.leagueName} {up ? "▲" : flat ? "" : "▼"} {up ? "+" : ""}
              {t.changePct}%
            </span>
          );
        })}
      </div>
    </div>
  );
}
