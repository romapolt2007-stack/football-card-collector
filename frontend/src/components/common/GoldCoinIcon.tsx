import { useId } from "react";

const TONES = {
  gold: { from: "#fff8e0", mid: "#ffd166", to: "#a9690a", stroke: "#6e4607", star: "rgba(110,70,7,0.55)" },
  silver: { from: "#f8fafc", mid: "#c6ccd6", to: "#5c636e", stroke: "#3a3f47", star: "rgba(40,45,52,0.55)" },
};

/** Детализированная рельефная монета (золото/серебро) для акцентов на стоимости. */
export function GoldCoinIcon({
  size = 20,
  className,
  tone = "gold",
}: {
  size?: number;
  className?: string;
  tone?: "gold" | "silver";
}) {
  const uid = useId();
  const gradId = `coin-${uid}`;
  const c = TONES[tone];

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <defs>
        <radialGradient id={gradId} cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor={c.from} />
          <stop offset="45%" stopColor={c.mid} />
          <stop offset="100%" stopColor={c.to} />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill={`url(#${gradId})`} stroke={c.stroke} strokeWidth="2" />
      <circle cx="24" cy="24" r="17.5" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.3" />
      <path
        d="M24 13 L27 21 L35.5 21 L28.7 26.2 L31.3 34.5 L24 29.5 L16.7 34.5 L19.3 26.2 L12.5 21 L21 21 Z"
        fill={c.star}
      />
    </svg>
  );
}
