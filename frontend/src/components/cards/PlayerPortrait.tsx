import { useId } from "react";
import { lookForNation } from "./nationLooks";

interface Props {
  accent?: string;
  size?: number;
  /** Нация игрока — определяет тон кожи и причёску портрета для визуального разнообразия. */
  nation?: string;
}

/** Стилизованный процедурный портрет-силуэт — векторный, без фото. Внешность варьируется по нации игрока. */
export function PlayerPortrait({ accent = "#e8c98a", size = 72, nation }: Props) {
  const uid = useId();
  const faceId = `portrait-face-${uid}`;
  const look = lookForNation(nation);

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <radialGradient id={faceId} cx="40%" cy="32%" r="75%">
          <stop offset="0%" stopColor={look.skinFrom} />
          <stop offset="100%" stopColor={look.skinTo} />
        </radialGradient>
      </defs>
      <path d="M10 100 Q10 66 50 62 Q90 66 90 100 Z" fill={accent} />
      <path d="M36 68 Q50 77 64 68 L64 81 Q50 90 36 81 Z" fill="rgba(0,0,0,0.18)" />
      <rect x="41" y="54" width="18" height="18" fill={`url(#${faceId})`} />
      <circle cx="50" cy="36" r="22" fill={`url(#${faceId})`} />
      {look.hairStyle === "afro" ? (
        <circle cx="50" cy="29" r="25" fill={look.hairColor} />
      ) : look.hairStyle === "wavy" ? (
        <path
          d="M25 33 Q22 11 50 10 Q78 11 75 33 Q71 19 61 24 Q55 18 50 24 Q45 18 39 24 Q29 19 25 33 Z"
          fill={look.hairColor}
        />
      ) : (
        <path
          d="M27 32 Q25 12 50 12 Q75 12 73 32 Q70 17 50 17 Q30 17 27 32 Z"
          fill={look.hairColor}
        />
      )}
      <circle cx="42" cy="36" r="2" fill="rgba(0,0,0,0.5)" />
      <circle cx="58" cy="36" r="2" fill="rgba(0,0,0,0.5)" />
      <path d="M45 47 Q50 50 55 47" stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
