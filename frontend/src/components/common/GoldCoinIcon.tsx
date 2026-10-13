import { useId } from "react";

/** Детализированная рельефная золотая монета для акцентов на стоимости коллекции. */
export function GoldCoinIcon({ size = 20, className }: { size?: number; className?: string }) {
  const uid = useId();
  const gradId = `gold-coin-${uid}`;

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <defs>
        <radialGradient id={gradId} cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#fff8e0" />
          <stop offset="45%" stopColor="#ffd166" />
          <stop offset="100%" stopColor="#a9690a" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill={`url(#${gradId})`} stroke="#6e4607" strokeWidth="2" />
      <circle cx="24" cy="24" r="17.5" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.3" />
      <path
        d="M24 13 L27 21 L35.5 21 L28.7 26.2 L31.3 34.5 L24 29.5 L16.7 34.5 L19.3 26.2 L12.5 21 L21 21 Z"
        fill="rgba(110,70,7,0.55)"
      />
    </svg>
  );
}
