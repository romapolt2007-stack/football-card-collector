/** Силуэт мусорной корзины с трещиной — для кнопки массовой продажи «мусорных» карт. */
export function CrackedBinIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} fill="none">
      <path d="M10 14 H38 L35 42 Q34.5 44 32.5 44 H15.5 Q13.5 44 13 42 Z" fill="currentColor" opacity="0.92" />
      <rect x="7" y="9" width="34" height="5" rx="1.5" fill="currentColor" />
      <rect x="18" y="4" width="12" height="4" rx="1.5" fill="currentColor" />
      <path
        d="M20 18 L24 26 L20 30 L27 40"
        stroke="rgba(20,0,0,0.75)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
