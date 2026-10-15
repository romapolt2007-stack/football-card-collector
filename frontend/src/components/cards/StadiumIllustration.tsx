interface Props {
  stadiumId: string;
  accent: string;
  size?: number;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Процедурная абстрактная иллюстрация арены — овальная чаша трибун +
 * прожекторы, без фото и без копирования реальной архитектуры конкретного
 * стадиона. Вариация формы/количества ярусов — по хэшу от id.
 */
export function StadiumIllustration({ stadiumId, accent, size = 72 }: Props) {
  const seed = hashString(stadiumId);
  const tiers = 2 + (seed % 3); // 2-4 яруса трибун
  const hasRoof = seed % 2 === 0;
  const floodlights = 2 + (Math.floor(seed / 3) % 3); // 2-4 прожектора

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <radialGradient id={`pitch-${stadiumId}`} cx="50%" cy="55%" r="60%">
          <stop offset="0%" stopColor="#2f6b3a" />
          <stop offset="100%" stopColor="#1c4526" />
        </radialGradient>
      </defs>

      {/* Поле в центре чаши */}
      <ellipse cx="50" cy="56" rx="26" ry="14" fill={`url(#pitch-${stadiumId})`} />
      <ellipse cx="50" cy="56" rx="26" ry="14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />

      {/* Ярусы трибун — концентрические дуги-"бублики" вокруг поля */}
      {Array.from({ length: tiers }, (_, i) => {
        const rx = 34 + i * 7;
        const ry = 20 + i * 4.5;
        return (
          <ellipse
            key={i}
            cx="50"
            cy="56"
            rx={rx}
            ry={ry}
            fill="none"
            stroke={accent}
            strokeWidth={5}
            opacity={0.85 - i * 0.15}
          />
        );
      })}

      {hasRoof && (
        <ellipse
          cx="50"
          cy="56"
          rx={34 + tiers * 7 + 3}
          ry={20 + tiers * 4.5 + 3}
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.5"
          strokeDasharray="2 3"
        />
      )}

      {/* Прожекторы по краям чаши */}
      {Array.from({ length: floodlights }, (_, i) => {
        const angle = (Math.PI * 2 * i) / floodlights - Math.PI / 2;
        const rx = 34 + (tiers - 1) * 7 + 6;
        const ry = 20 + (tiers - 1) * 4.5 + 6;
        const x = 50 + rx * Math.cos(angle);
        const y = 56 + ry * Math.sin(angle);
        return <rect key={i} x={x - 1.5} y={y - 10} width="3" height="10" rx="1" fill="rgba(255,255,255,0.75)" />;
      })}
    </svg>
  );
}
