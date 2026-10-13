import { useId } from "react";

interface Props {
  colorLight: string;
  colorDark: string;
  label: string;
  emblem?: string;
  size?: "md" | "lg";
}

const SIZE_CLASS: Record<NonNullable<Props["size"]>, string> = {
  md: "h-32 w-24",
  lg: "h-56 w-40",
};

export const PACK_PATH =
  "M8 16 L21 7 L35 13 L50 5 L65 13 L79 7 L92 16 L94 118 Q94 127 85 127 L15 127 Q6 127 6 118 Z";

/**
 * Силуэт фольгированной пачки карт (запаянный волнистый верх, сужающееся тело) —
 * SVG вместо растровой текстуры, т.к. в проекте нет пайплайна для фото-ассетов.
 * useId — чтобы градиенты/маски не схлопывались между несколькими тайлами на странице.
 */
export function PackFoilArt({ colorLight, colorDark, label, emblem = "⚽", size = "md" }: Props) {
  const uid = useId();
  const gradId = `pack-grad-${uid}`;
  const clipId = `pack-clip-${uid}`;

  return (
    <div className={`relative mx-auto ${SIZE_CLASS[size]}`}>
      <svg viewBox="0 0 100 132" className="h-full w-full drop-shadow-xl">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorLight} />
            <stop offset="48%" stopColor={colorDark} />
            <stop offset="100%" stopColor="#050507" />
          </linearGradient>
          <clipPath id={clipId}>
            <path d={PACK_PATH} />
          </clipPath>
        </defs>

        <path d={PACK_PATH} fill={`url(#${gradId})`} stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />

        {/* диагональный блик фольги — тёмная/светлая половины как на реальной упаковке */}
        <polygon points="6,78 58,7 94,7 94,45 6,112" fill="rgba(255,255,255,0.16)" clipPath={`url(#${clipId})`} />
        <polygon points="6,118 94,100 94,118 85,127 15,127" fill="rgba(0,0,0,0.25)" clipPath={`url(#${clipId})`} />
      </svg>

      <div className={`pointer-events-none absolute inset-0 flex flex-col items-center ${size === "lg" ? "px-4" : "px-2"}`}>
        <span className={`${size === "lg" ? "mt-12 text-4xl" : "mt-7 text-2xl"} drop-shadow-lg`}>{emblem}</span>
        <span
          className={`mt-auto text-center font-extrabold leading-tight tracking-wide text-white drop-shadow-lg ${
            size === "lg" ? "mb-14 text-sm" : "mb-8 text-[9px]"
          }`}
        >
          {label}
        </span>
      </div>

      <div
        className="sheen-sweep pointer-events-none absolute inset-0"
        style={{ clipPath: `path('${PACK_PATH}')` }}
      />
    </div>
  );
}
