import { useId } from "react";

/** Стилизованный процедурный портрет-силуэт для витрины изданий — векторный, без фото. */
export function PlayerPortrait({ accent = "#e8c98a", size = 72 }: { accent?: string; size?: number }) {
  const uid = useId();
  const faceId = `portrait-face-${uid}`;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <radialGradient id={faceId} cx="40%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#f3cba0" />
          <stop offset="100%" stopColor="#c99a6e" />
        </radialGradient>
      </defs>
      <path d="M10 100 Q10 66 50 62 Q90 66 90 100 Z" fill={accent} />
      <path d="M36 68 Q50 77 64 68 L64 81 Q50 90 36 81 Z" fill="rgba(0,0,0,0.18)" />
      <rect x="41" y="54" width="18" height="18" fill={`url(#${faceId})`} />
      <circle cx="50" cy="36" r="22" fill={`url(#${faceId})`} />
      <path
        d="M27 32 Q25 12 50 12 Q75 12 73 32 Q70 17 50 17 Q30 17 27 32 Z"
        fill="#241a10"
      />
      <circle cx="42" cy="36" r="2" fill="rgba(0,0,0,0.5)" />
      <circle cx="58" cy="36" r="2" fill="rgba(0,0,0,0.5)" />
      <path d="M45 47 Q50 50 55 47" stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
