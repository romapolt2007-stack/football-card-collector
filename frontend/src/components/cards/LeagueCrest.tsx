interface Props {
  leagueId: string;
  size?: number;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Палитры подобраны произвольно (хэш от id лиги) — не привязаны к фирменным цветам реальных лиг. */
const PALETTES: [string, string][] = [
  ["#2E7DE1", "#0B2A6B"],
  ["#E13B5C", "#5C0B22"],
  ["#17B88E", "#0A4A3A"],
  ["#F2A93B", "#8A5406"],
  ["#8B5CF6", "#2E1065"],
  ["#2DBE60", "#0B4A24"],
  ["#E0587A", "#4A0B22"],
  ["#4BA3E3", "#0B3A5C"],
];

/**
 * Процедурная эмблема лиги — круглый значок с кольцевым градиентом и одним из
 * 6 абстрактных геометрических символов внутри (не копия ничьего реального
 * лого). Детерминирована по id лиги — одна и та же лига всегда даёт один и
 * тот же значок.
 */
export function LeagueCrest({ leagueId, size = 40 }: Props) {
  const h = hashString(leagueId);
  const [primary, secondary] = PALETTES[h % PALETTES.length];
  const symbolVariant = Math.floor(h / PALETTES.length) % 6;
  const gradId = `league-grad-${leagueId}`;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <radialGradient id={gradId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={primary} />
          <stop offset="100%" stopColor={secondary} />
        </radialGradient>
      </defs>

      <circle cx="50" cy="50" r="47" fill={`url(#${gradId})`} stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />

      <g fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.92">
        {symbolVariant === 0 && (
          // пятиконечная звезда
          <path d="M50 18 L58 40 L82 40 L63 54 L70 76 L50 62 L30 76 L37 54 L18 40 L42 40 Z" strokeWidth="3.5" fill="#fff" fillOpacity="0.15" />
        )}
        {symbolVariant === 1 && (
          // шеврон/галочка
          <path d="M26 56 L50 32 L74 56 M26 72 L50 48 L74 72" />
        )}
        {symbolVariant === 2 && (
          // кольцо-мяч (упрощённые "швы")
          <>
            <circle cx="50" cy="50" r="22" />
            <path d="M50 28 V72 M28 50 H72 M34 34 L66 66 M66 34 L34 66" strokeWidth="2.5" opacity="0.6" />
          </>
        )}
        {symbolVariant === 3 && (
          // ромб
          <path d="M50 20 L78 50 L50 80 L22 50 Z" fill="#fff" fillOpacity="0.12" />
        )}
        {symbolVariant === 4 && (
          // лавровая дуга (упрощённая, не копия конкретного герба)
          <path d="M28 62 Q50 30 72 62 M28 62 Q50 46 72 62" />
        )}
        {symbolVariant === 5 && (
          // щит-контур
          <path d="M50 22 L74 30 V54 C74 68 63 78 50 82 C37 78 26 68 26 54 V30 Z" fill="#fff" fillOpacity="0.12" />
        )}
      </g>

      <ellipse cx="38" cy="24" rx="26" ry="10" fill="rgba(255,255,255,0.25)" />
    </svg>
  );
}
