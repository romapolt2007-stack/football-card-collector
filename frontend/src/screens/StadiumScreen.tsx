import { useCollectStadium, useStadiumStatus, useUpgradeStadium } from "../lib/useStadium";
import { haptics } from "../lib/telegram";
import { sfx } from "../lib/sfx";

interface Props {
  onClose: () => void;
}

/** Трофейная комната / стадион — пассивный доход, копится по времени, вкладывайте монеты в апгрейд уровня. */
export function StadiumScreen({ onClose }: Props) {
  const { data } = useStadiumStatus();
  const collect = useCollectStadium();
  const upgrade = useUpgradeStadium();

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-black/95">
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-3">
        <h2 className="text-base font-bold">Трофейная комната</h2>
        <button onClick={onClose} className="text-sm text-white/50">
          Закрыть
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-10">
        <div className="metal-banner overflow-hidden rounded-2xl border border-white/15 px-4 py-5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Стадион</p>
          <p className="mt-1 text-3xl font-extrabold text-gold">
            🏟️ Уровень {data?.level ?? 1}
            {data && data.level >= data.maxLevel && <span className="ml-1 text-sm text-white/40">(макс)</span>}
          </p>
          <p className="mt-1 text-xs text-white/50">+{data?.incomePerHour ?? 0} 🪙/час пассивного дохода</p>
        </div>

        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5 text-center">
          <p className="text-xs text-white/60">Накоплено</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-300">
            {(data?.pending ?? 0).toLocaleString("ru-RU")} 🪙
          </p>
          <button
            onClick={() => {
              haptics.notify("success");
              sfx.kick();
              collect.mutate();
            }}
            disabled={!data?.pending || collect.isPending}
            className="spin-button-texture relative mt-4 overflow-hidden rounded-full bg-emerald-400 px-8 py-3 text-sm font-extrabold text-pitch-dark disabled:opacity-30"
          >
            Собрать
          </button>
        </div>

        <button
          onClick={() => {
            haptics.select();
            upgrade.mutate();
          }}
          disabled={data?.upgradeCost == null || upgrade.isPending}
          className="spin-button-texture relative overflow-hidden rounded-full bg-gold py-3.5 text-sm font-extrabold text-pitch-dark disabled:opacity-30"
        >
          {data?.upgradeCost == null
            ? "Максимальный уровень"
            : `⬆️ Улучшить за ${data.upgradeCost.toLocaleString("ru-RU")} 🪙`}
        </button>

        <p className="text-center text-[11px] text-white/35">
          Доход копится, пока вы не заходите в игру (до 8 часов за раз) — заходите почаще, чтобы не терять монеты.
        </p>
      </div>
    </div>
  );
}
