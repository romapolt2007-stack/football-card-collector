import type { PlayerTrend } from "../../types/game";

interface Props {
  risers: PlayerTrend[];
  fallers: PlayerTrend[];
}

function TrendItem({ t, positive }: { t: PlayerTrend; positive: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">
      <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold">
        <span className="shrink-0">{t.nationFlag}</span>
        <span className="truncate">{t.name}</span>
        <span className="shrink-0 text-white/40">{t.overall}</span>
      </span>
      <span
        className="shrink-0 text-xs font-bold"
        style={{ color: positive ? "#6ee7a0" : "#ff6b6b" }}
      >
        {positive ? "▲" : "▼"} {Math.abs(t.changePct)}%
      </span>
    </div>
  );
}

/** Fantasy-биржа: топ растущих/падающих в цене игроков за 24ч — на реальных продажах, без фейковой волатильности. */
export function PlayerTrendsRow({ risers, fallers }: Props) {
  if (risers.length === 0 && fallers.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">📊 Fantasy-биржа · 24ч</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-semibold text-emerald-300">В ЦЕНЕ</p>
          {risers.length === 0 ? (
            <p className="text-[11px] text-white/30">Пока нет данных</p>
          ) : (
            risers.map((t) => <TrendItem key={t.playerId} t={t} positive />)
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-semibold text-red-300">ПАДАЮТ</p>
          {fallers.length === 0 ? (
            <p className="text-[11px] text-white/30">Пока нет данных</p>
          ) : (
            fallers.map((t) => <TrendItem key={t.playerId} t={t} positive={false} />)
          )}
        </div>
      </div>
    </div>
  );
}
