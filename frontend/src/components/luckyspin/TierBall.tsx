import { useId } from "react";

interface Props {
  color: string;
  glow?: string;
  size?: number;
  emblem?: boolean;
}

/** Миниатюрный текстурированный футбольный мяч для списка вероятностей на экране «Удача». */
export function TierBall({ color, glow = "none", size = 18, emblem = false }: Props) {
  const uid = useId();
  const sheenId = `ball-sheen-${uid}`;

  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full" style={{ width: size, height: size, boxShadow: glow }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <defs>
          <radialGradient id={sheenId} cx="35%" cy="28%" r="60%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
            <stop offset="45%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill={color} stroke="rgba(0,0,0,0.4)" strokeWidth="3" />
        <path
          d="M50,27 L50,7 M65,39 L83,29 M59,59 L73,77 M41,59 L27,77 M35,39 L17,29"
          stroke="rgba(0,0,0,0.4)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        {emblem ? (
          <polygon points="50,33 61,41 57,55 43,55 39,41" fill="rgba(255,255,255,0.92)" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
        ) : (
          <polygon points="50,28 65,39 59,59 41,59 35,39" fill="rgba(0,0,0,0.5)" />
        )}
        <circle cx="50" cy="50" r="46" fill={`url(#${sheenId})`} />
      </svg>
    </span>
  );
}
