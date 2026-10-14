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
/** Внешнее кольцо-рамка чуть крупнее основного щита — как золотой кант у титульных эмблем. */
const OUTER_RING_PATH = "M50 0 L97 13 V48 C97 77 77 97 50 103 C23 97 3 77 3 48 V13 Z";
/** Пятиконечная звезда над инициалами — отсылка к "звёздам за титулы" на настоящих клубных гербах. */
const STAR_PATH =
  "M50 2 L55.9 14.5 L69.5 16.2 L59.5 25.6 L62.3 39.1 L50 32.5 L37.7 39.1 L40.5 25.6 L30.5 16.2 L44.1 14.5 Z";

/**
 * Процедурная эмблема клуба — щит с золотым кантом, одним из 5 геометрических
 * узоров и опциональной звездой за "титулы" (цвета и буквы берутся из клуба
 * в базе). Полностью сгенерированная форма, без обращения к реальным
 * логотипам — визуальный язык классических футсимов, не конкретный клуб.
 */
export function ClubCrest({ club, size = 48 }: Props) {
  const variant = hashString(club.id) % 5;
  const showStar = hashString(`${club.id}-star`) % 3 === 0;
  const { colorPrimary: p, colorSecondary: s, shortName } = club;
  const clipId = `shield-${club.id}`;
  const ringId = `ring-${club.id}`;

  return (
    <svg width={size} height={(size * 103) / 100} viewBox="0 0 100 103">
      <defs>
        <clipPath id={clipId}>
          <path d={SHIELD_PATH} />
        </clipPath>
        <linearGradient id={ringId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff6d8" />
          <stop offset="50%" stopColor="#e3a825" />
          <stop offset="100%" stopColor="#8a5a06" />
        </linearGradient>
      </defs>

      <path d={OUTER_RING_PATH} fill="none" stroke={`url(#${ringId})`} strokeWidth="2.5" />

      <g clipPath={`url(#${clipId})`}>
        <rect width="100" height="100" fill={p} />
        {variant === 0 && <rect x="50" width="50" height="100" fill={s} />}
        {variant === 1 && <polygon points="0,0 100,0 0,100" fill={s} />}
        {variant === 2 && <circle cx="50" cy="50" r="28" fill={s} />}
        {variant === 3 && <rect x="0" y="33" width="100" height="34" fill={s} />}
        {variant === 4 && <polygon points="50,0 100,50 50,100 0,50" fill={s} />}
        {/* Рельефный блик сверху и тень снизу — объёмный "3D" вид щита. */}
        <ellipse cx="42" cy="18" rx="38" ry="16" fill="rgba(255,255,255,0.28)" />
        <rect y="70" width="100" height="30" fill="rgba(0,0,0,0.28)" />
      </g>
      <path d={SHIELD_PATH} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2.5" />
      <path d={SHIELD_PATH} fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1" transform="translate(0.6,0.6)" />

      {showStar && <path d={STAR_PATH} fill="#ffd166" stroke="rgba(0,0,0,0.35)" strokeWidth="1" />}

      <text
        x="50"
        y={showStar ? "66" : "60"}
        textAnchor="middle"
        fontSize={showStar ? "24" : "28"}
        fontWeight="800"
        fill="#fff"
        style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.4)", strokeWidth: 3 }}
      >
        {shortName}
      </text>
    </svg>
  );
}
