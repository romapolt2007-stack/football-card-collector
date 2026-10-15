import { useId } from "react";
import { HAIR_STYLES, hashString, lookForNation, shadeColor } from "./nationLooks";

interface Props {
  accent?: string;
  size?: number;
  /** Нация игрока — определяет тон кожи портрета для визуального разнообразия. */
  nation?: string;
  /** ID игрока — сид для черт лица (причёска, форма лица, борода, глаза), чтобы игроки одной нации не выглядели одинаково. */
  playerId?: string;
}

const FACE_SHAPES = [
  { rx: 22, ry: 22 }, // круглое
  { rx: 19, ry: 24 }, // вытянутое
  { rx: 23, ry: 20 }, // широкое
] as const;

/** Стилизованный процедурный портрет-силуэт — векторный, без фото. Тон кожи — по нации, черты лица — по хэшу playerId. */
export function PlayerPortrait({ accent = "#e8c98a", size = 72, nation, playerId }: Props) {
  const uid = useId();
  const faceId = `portrait-face-${uid}`;
  const look = lookForNation(nation);
  const seed = hashString(playerId || nation || "default");

  const hairStyle = HAIR_STYLES[seed % HAIR_STYLES.length];
  const faceShape = FACE_SHAPES[Math.floor(seed / 5) % FACE_SHAPES.length];
  const hasBeard = Math.floor(seed / 17) % 3 === 0;
  const eyeRx = Math.floor(seed / 7) % 2 === 0 ? 2 : 2.6;
  const eyeRy = eyeRx === 2 ? 2 : 1.6;
  const browThickness = Math.floor(seed / 11) % 2 === 0 ? 1.2 : 2;
  const mouthStyle = Math.floor(seed / 13) % 3;
  const skinJitter = ((seed % 21) - 10) / 100; // ±10% яркости — лёгкий индивидуальный разброс поверх тона нации
  const skinFrom = shadeColor(look.skinFrom, skinJitter);
  const skinTo = shadeColor(look.skinTo, skinJitter);

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <radialGradient id={faceId} cx="40%" cy="32%" r="75%">
          <stop offset="0%" stopColor={skinFrom} />
          <stop offset="100%" stopColor={skinTo} />
        </radialGradient>
      </defs>
      <path d="M10 100 Q10 66 50 62 Q90 66 90 100 Z" fill={accent} />
      <path d="M36 68 Q50 77 64 68 L64 81 Q50 90 36 81 Z" fill="rgba(0,0,0,0.18)" />
      <rect x="41" y="54" width="18" height="18" fill={`url(#${faceId})`} />
      <ellipse cx="50" cy="36" rx={faceShape.rx} ry={faceShape.ry} fill={`url(#${faceId})`} />
      {hasBeard && (
        <path
          d="M30 40 Q30 58 50 60 Q70 58 70 40 Q70 52 50 54 Q30 52 30 40 Z"
          fill={look.hairColor}
          opacity={0.75}
        />
      )}
      {hairStyle === "afro" ? (
        <circle cx="50" cy="29" r="25" fill={look.hairColor} />
      ) : hairStyle === "wavy" ? (
        <path
          d="M25 33 Q22 11 50 10 Q78 11 75 33 Q71 19 61 24 Q55 18 50 24 Q45 18 39 24 Q29 19 25 33 Z"
          fill={look.hairColor}
        />
      ) : hairStyle === "bald" ? (
        <path d="M28 30 Q30 20 50 19 Q70 20 72 30" stroke={look.hairColor} strokeWidth="1.5" fill="none" opacity={0.5} />
      ) : hairStyle === "fauxhawk" ? (
        <path d="M44 10 Q50 6 56 10 L58 26 Q50 22 42 26 Z" fill={look.hairColor} />
      ) : (
        <path d="M27 32 Q25 12 50 12 Q75 12 73 32 Q70 17 50 17 Q30 17 27 32 Z" fill={look.hairColor} />
      )}
      <path d={`M38 30 Q42 ${27 - browThickness} 46 30`} stroke={look.hairColor} strokeWidth={browThickness} fill="none" strokeLinecap="round" />
      <path d={`M54 30 Q58 ${27 - browThickness} 62 30`} stroke={look.hairColor} strokeWidth={browThickness} fill="none" strokeLinecap="round" />
      <ellipse cx="42" cy="36" rx={eyeRx} ry={eyeRy} fill="rgba(0,0,0,0.5)" />
      <ellipse cx="58" cy="36" rx={eyeRx} ry={eyeRy} fill="rgba(0,0,0,0.5)" />
      <path d="M50 38 L48 44 Q50 46 52 44" stroke="rgba(0,0,0,0.22)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {mouthStyle === 0 ? (
        <path d="M45 47 Q50 50 55 47" stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      ) : mouthStyle === 1 ? (
        <path d="M44 46 Q50 52 56 46" stroke="rgba(0,0,0,0.4)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M45 47.5 L55 47.5" stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
}
