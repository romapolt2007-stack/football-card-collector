import { PACK_PATH } from "../cases/PackFoilArt";

/** Маленький силуэт фольгированной пачки для нижней навигации — тот же контур, что у PackFoilArt. */
export function MiniPackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 132" className={className} fill="currentColor">
      <path d={PACK_PATH} />
    </svg>
  );
}
