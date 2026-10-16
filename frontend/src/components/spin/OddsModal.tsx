import { motion } from "framer-motion";
import { RARITY_THEME } from "../cards/rarityTheme";
import { useSpinOdds } from "../../lib/useSpin";
import type { Rarity } from "../../types/game";

interface Props {
  amount: number;
  onClose: () => void;
}

const ORDER: Rarity[] = ["BRONZE", "SILVER", "GOLD", "LEGEND", "ICON"];

/** Бottom-sheet с текущими процентами редкости для выбранной ставки — прозрачность по требованию "показывать шансы". */
export function OddsModal({ amount, onClose }: Props) {
  const odds = useSpinOdds(amount);

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[75vh] w-full max-w-md flex-col rounded-t-[24px] border-t border-white/15 bg-[rgba(26,20,54,0.92)] shadow-[0_-8px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <p className="text-sm font-bold">📊 Шансы на ставку {amount.toLocaleString("ru-RU")} 🪙</p>
          <button onClick={onClose} className="text-sm text-white/50 transition active:scale-95">
            Закрыть
          </button>
        </div>

        <div className="flex flex-col gap-3 px-5 pb-8">
          {odds.isLoading && <p className="text-sm text-white/50">Загрузка...</p>}
          {odds.data &&
            ORDER.map((rarity) => {
              const theme = RARITY_THEME[rarity];
              const pct = odds.data!.percentages[rarity] ?? 0;
              return (
                <div key={rarity} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span style={{ color: theme.borderColor }}>
                      {theme.emoji} {theme.label}
                    </span>
                    <span className="text-white/80">{pct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: theme.borderColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(pct, 1)}%` }}
                      transition={{ type: "spring", stiffness: 160, damping: 22 }}
                    />
                  </div>
                </div>
              );
            })}
          <p className="mt-2 text-[11px] leading-relaxed text-white/40">
            Чем выше ставка — тем выше шанс Золота и выше. На максимальной ставке (10 000 000 🪙) шансы заметно смещены к
            топ-редкостям. Стадион тоже немного сдвигает проценты в пользу топ-карт.
          </p>
        </div>
      </div>
    </div>
  );
}
