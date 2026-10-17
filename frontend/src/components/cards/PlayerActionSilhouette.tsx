import { useId } from "react";

interface Props {
  /** Основной цвет силуэта (обычно цвет редкости карты). */
  accent?: string;
  size?: number;
}

/**
 * Объёмный силуэт футболиста в динамике (удар по мячу) — вместо фото лица/тела реального
 * игрока. Один и тот же силуэт для всех карт (как в референсе) — только это и сертифицированно
 * свободно от претензий по авторским правам/биометрии: ни черт лица, ни конкретной фигуры.
 * Лёгкий градиент поверх плоской заливки даёт "объём" без намёка на фотореализм.
 */
export function PlayerActionSilhouette({ accent = "#ffd166", size = 120 }: Props) {
  const uid = useId();
  const gradId = `silhouette-vol-${uid}`;

  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 100 125" fill="none">
      <defs>
        <linearGradient id={gradId} x1="20%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="35%" stopColor={accent} stopOpacity="1" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.72" />
        </linearGradient>
      </defs>

      {/* мяч */}
      <circle cx="78" cy="104" r="6.5" fill={`url(#${gradId})`} opacity="0.9" />

      {/* дальняя (опорная) нога, согнута назад */}
      <path d="M44 70 Q32 78 30 96 Q29 102 34 104 Q38 105 39 100 Q41 88 50 78 Z" fill={`url(#${gradId})`} />

      {/* торс, наклонён вперёд в динамике удара */}
      <path
        d="M39 34 Q50 28 60 35 Q66 44 63 58 Q61 68 52 74 Q42 71 38 60 Q35 48 39 34 Z"
        fill={`url(#${gradId})`}
      />

      {/* дальняя (отведённая назад) рука */}
      <path d="M40 40 Q28 38 20 46 Q17 49 20 52 Q23 54 26 51 Q33 46 43 47 Z" fill={`url(#${gradId})`} opacity="0.92" />

      {/* ближняя рука, вынесена вперёд для баланса */}
      <path d="M58 38 Q70 34 78 40 Q81 43 78 46 Q75 48 71 45 Q64 42 56 44 Z" fill={`url(#${gradId})`} />

      {/* бьющая нога, вытянута вперёд-вниз к мячу */}
      <path d="M50 74 Q62 80 70 92 Q74 98 70 101 Q66 103 63 98 Q56 87 46 80 Z" fill={`url(#${gradId})`} />

      {/* голова, слегка наклонена к мячу */}
      <circle cx="47" cy="22" r="11" fill={`url(#${gradId})`} />

      {/* блик — ощущение объёма/материала, а не плоской заливки */}
      <ellipse cx="42" cy="17" rx="4" ry="6" fill="#ffffff" opacity="0.28" />
    </svg>
  );
}
