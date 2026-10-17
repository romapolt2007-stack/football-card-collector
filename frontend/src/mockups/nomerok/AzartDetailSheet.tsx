import { motion } from "framer-motion";
import { MOCK_PANEL, MOCK_PANEL_BORDER, MOCK_SHEET_BG } from "./theme";

interface Props {
  streak: number;
  threshold: number;
  onClose: () => void;
}

function azartFill(hot: boolean, maxed: boolean): string {
  if (maxed) return "linear-gradient(90deg, #ffd166, #b24bf3)";
  if (hot) return "linear-gradient(90deg, #ff8a3d, #ff3b5c)";
  return "linear-gradient(90deg, #ffd166, #ff8a3d)";
}

/** Разворот плашки "Азарт" — точные цифры: сколько прокруток в серии и сколько ещё до гарантии. */
export function AzartDetailSheet({ streak, threshold, onClose }: Props) {
  const pct = Math.min(100, (streak / threshold) * 100);
  const hot = streak >= threshold * 0.5;
  const maxed = streak >= threshold;
  const remaining = Math.max(0, threshold - streak);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-[24px] pb-[env(safe-area-inset-bottom)]"
        style={{ background: MOCK_SHEET_BG, border: `1px solid ${MOCK_PANEL_BORDER}`, borderBottom: "none" }}
      >
        <div className="flex justify-center pt-2.5">
          <span className="h-1 w-10 rounded-full bg-white/15" />
        </div>

        <div className="flex flex-col items-center gap-2 px-5 pb-6 pt-3 text-center">
          <h2 className="text-base font-extrabold">{maxed ? "🎁 Азартный спин готов!" : "🔥 Азарт"}</h2>
          <p className="text-xs text-white/45">
            {maxed
              ? "Следующая прокрутка гарантированно топ-редкости — Легенда или Икона."
              : "Крутите без долгих пауз — когда серия доберётся до конца, следующий спин гарантированно топ-редкости."}
          </p>

          <div className="relative mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full"
              style={{ background: azartFill(hot, maxed) }}
              animate={{ width: `${pct}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 24 }}
            />
          </div>

          <div className="mt-3 flex w-full gap-2">
            <div className="flex-1 rounded-[12px] px-4 py-3 text-left" style={{ background: MOCK_PANEL, border: `1px solid ${MOCK_PANEL_BORDER}` }}>
              <p className="text-[11px] text-white/40">Прокруток в серии</p>
              <p className="text-xl font-extrabold">{streak}</p>
            </div>
            <div className="flex-1 rounded-[12px] px-4 py-3 text-left" style={{ background: MOCK_PANEL, border: `1px solid ${MOCK_PANEL_BORDER}` }}>
              <p className="text-[11px] text-white/40">{maxed ? "Статус" : "Осталось прокруток"}</p>
              <p className="text-xl font-extrabold">{maxed ? "Готово" : remaining}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
