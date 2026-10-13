interface Props {
  club: { id: string; shortName: string; colorPrimary: string; colorSecondary: string };
  size?: number;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const SHIELD_PATH = "M50 3 L93 15 V47 C93 74 75 93 50 99 C25 93 7 74 7 47 V15 Z";

/**
 * Процедурная эмблема клуба — щит с одним из 5 геометрических узоров
 * (цвета и буквы берутся из клуба в базе). Полностью сгенерированная
 * форма, без обращения к реальным логотипам — только общий дух
 * "геральдического щита", как у классических футсимов.
 */
export function ClubCrest({ club, size = 48 }: Props) {
  const variant = hashString(club.id) % 5;
  const { colorPrimary: p, colorSecondary: s, shortName } = club;
  const clipId = `shield-${club.id}`;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <clipPath id={clipId}>
          <path d={SHIELD_PATH} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="100" height="100" fill={p} />
        {variant === 0 && <rect x="50" width="50" height="100" fill={s} />}
        {variant === 1 && <polygon points="0,0 100,0 0,100" fill={s} />}
        {variant === 2 && <circle cx="50" cy="50" r="28" fill={s} />}
        {variant === 3 && <rect x="0" y="33" width="100" height="34" fill={s} />}
        {variant === 4 && <polygon points="50,0 100,50 50,100 0,50" fill={s} />}
      </g>
      <path d={SHIELD_PATH} fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="2.5" />
      <text
        x="50"
        y="60"
        textAnchor="middle"
        fontSize="28"
        fontWeight="800"
        fill="#fff"
        style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.4)", strokeWidth: 3 }}
      >
        {shortName}
      </text>
    </svg>
  );
}
