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
const PALETTES: [string, string, string][] = [
  ["#5EA6FF", "#1C4FBF", "#07163F"],
  ["#FF6B88", "#D81B4A", "#3A0414"],
  ["#4BE3B0", "#0E9E73", "#042A20"],
  ["#FFC24B", "#E08A0C", "#3A1E00"],
  ["#B98BFF", "#7A32E0", "#200A4A"],
  ["#4BD66B", "#0E8F38", "#042A10"],
  ["#FF8FB0", "#D8265C", "#3A0420"],
  ["#5FC8FF", "#1073C4", "#031E3A"],
];

/**
 * Процедурная "иконка приложения" для лиги — квадратный значок со скруглением,
 * золотой рамкой и объёмным градиентным символом внутри (один из 6 абстрактных
 * геометрических знаков, не копия ничьего реального лого). Детерминирована по
 * id лиги.
 */
export function LeagueCrest({ leagueId, size = 40 }: Props) {
  const h = hashString(leagueId);
  const [light, mid, dark] = PALETTES[h % PALETTES.length];
  const symbolVariant = Math.floor(h / PALETTES.length) % 6;
  const bgId = `league-bg-${leagueId}`;
  const symId = `league-sym-${leagueId}`;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <linearGradient id={bgId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={dark} />
          <stop offset="100%" stopColor={mid} />
        </linearGradient>
        <linearGradient id={symId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="55%" stopColor={light} />
          <stop offset="100%" stopColor={mid} />
        </linearGradient>
      </defs>

      <rect x="2" y="2" width="96" height="96" rx="22" fill={`url(#${bgId})`} stroke="#ffd166" strokeWidth="2.5" />
      <rect x="7" y="7" width="86" height="86" rx="18" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      <ellipse cx="36" cy="22" rx="30" ry="13" fill="rgba(255,255,255,0.16)" />

      <g filter="none" transform="translate(50,52)">
        {symbolVariant === 0 && (
          // гранёный кристалл
          <path
            d="M0 -30 L20 -10 L13 24 L-13 24 L-20 -10 Z M0 -30 L0 24 M-20 -10 L20 -10"
            fill={`url(#${symId})`}
            fillOpacity="0.9"
            stroke={dark}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        )}
        {symbolVariant === 1 && (
          // двойной шеврон (скорость)
          <path
            d="M-24 10 L0 -16 L24 10 M-24 26 L0 0 L24 26"
            fill="none"
            stroke={`url(#${symId})`}
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {symbolVariant === 2 && (
          // щит с молнией
          <path
            d="M0 -28 L24 -18 V6 C24 22 13 30 0 34 C-13 30 -24 22 -24 6 V-18 Z M6 -16 L-8 4 H2 L-6 20 L12 -2 H2 Z"
            fill={`url(#${symId})`}
            fillRule="evenodd"
            stroke={dark}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        )}
        {symbolVariant === 3 && (
          // шестерёнка-звезда (8 лучей)
          <path
            d="M0 -28 L7 -12 L24 -18 L13 -3 L28 0 L13 3 L24 18 L7 12 L0 28 L-7 12 L-24 18 L-13 3 L-28 0 L-13 -3 L-24 -18 L-7 -12 Z"
            fill={`url(#${symId})`}
            stroke={dark}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        )}
        {symbolVariant === 4 && (
          // кольцо с перекрестием (компас/мяч)
          <>
            <circle cx="0" cy="0" r="26" fill="none" stroke={`url(#${symId})`} strokeWidth="8" />
            <path d="M0 -26 V26 M-26 0 H26" stroke={`url(#${symId})`} strokeWidth="6" strokeLinecap="round" />
          </>
        )}
        {symbolVariant === 5 && (
          // пламя/крыло
          <path
            d="M0 -30 C16 -22 22 -4 14 14 C10 24 -2 30 -14 24 C-24 18 -26 2 -16 -8 C-10 -2 -8 6 -10 12 C-2 6 2 -8 0 -30 Z"
            fill={`url(#${symId})`}
            stroke={dark}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        )}
      </g>
    </svg>
  );
}
