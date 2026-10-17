import type { Card } from "../../types/game";
import { RARITY_THEME } from "./rarityTheme";
import { ClubCrest } from "./ClubCrest";
import { PlayerActionSilhouette } from "./PlayerActionSilhouette";
import { hashString } from "./nationLooks";
import { POSITION_RU, STAT_LABELS_RU } from "../../lib/ruLabels";

interface Props {
  card: Card;
  size?: "sm" | "md" | "lg" | "full";
  onClick?: () => void;
}

const SIZE_CLASSES: Record<NonNullable<Props["size"]>, string> = {
  sm: "w-32 text-[10px]",
  md: "w-44 text-xs",
  lg: "w-60 text-sm",
  full: "w-full text-[11px]",
};

const SILHOUETTE_SIZE: Record<NonNullable<Props["size"]>, number> = {
  sm: 46,
  md: 60,
  lg: 82,
  full: 78,
};

const PADDING_CLASSES: Record<NonNullable<Props["size"]>, string> = {
  sm: "p-2.5 pb-2",
  md: "p-3 pb-2.5",
  lg: "p-3.5 pb-3",
  full: "p-3.5 pb-3",
};

/** Фирменная форма карты — мягко скруглённый верх (несколько точек вместо прямой линии
 * аппроксимируют кривую), заострение к низу. Полностью своя форма, не копия чьего-то ассета. */
const CARD_CLIP =
  "polygon(8% 2%, 20% 0%, 50% 0%, 80% 0%, 92% 2%, 100% 8%, 100% 88%, 85% 94%, 50% 100%, 15% 94%, 0% 88%, 0% 8%)";

/** Стабильный "игровой номер" 1-99 — чисто декоративный элемент карты (хэш от id игрока), в игре
 * нигде не хранится и не заявляется как настоящий номер футболиста. */
function jerseyNumber(playerId: string): number {
  return 1 + (hashString(playerId) % 99);
}

export function RarityCard({ card, size = "md", onClick }: Props) {
  const theme = RARITY_THEME[card.rarity];
  const { player } = card;
  const isIcon = card.rarity === "ICON";
  const isLegend = card.rarity === "LEGEND";
  const isFull = size === "full";

  return (
    <div
      onClick={onClick}
      className={`relative aspect-[3/5] shrink-0 overflow-hidden border-[3px] ${PADDING_CLASSES[size]} ${SIZE_CLASSES[size]} ${isIcon ? "icon-pulse" : ""} ${onClick ? "cursor-pointer" : ""}`}
      style={{
        background: theme.background,
        borderColor: theme.borderColor,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.1), 0 0 18px 3px ${theme.borderColor}70, ${theme.glow}`,
        color: theme.textColor,
        clipPath: CARD_CLIP,
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-black/18" />
      <div className="foil-texture pointer-events-none absolute inset-0" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(140deg, rgba(255,255,255,0.22) 0%, transparent 38%)" }}
      />
      {isLegend && <div className="holo-sweep pointer-events-none absolute inset-0" />}
      {isIcon && <IconSparkles />}

      <div className="relative flex items-start justify-between">
        <div className="flex flex-col items-center leading-none">
          <span className="text-2xl font-extrabold" style={isFull ? { textShadow: `0 0 10px ${theme.borderColor}88` } : undefined}>
            {player.overall}
          </span>
          <span className="mt-0.5 text-[0.7em] font-bold opacity-80">
            {POSITION_RU[player.position]} · №{jerseyNumber(player.id)}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <span className="text-lg leading-none">{player.nationFlag}</span>
          <ClubCrest club={player.club} size={isFull ? 26 : 18} />
        </div>
      </div>

      <div className="relative flex flex-col items-center">
        <PlayerActionSilhouette accent={theme.borderColor} size={SILHOUETTE_SIZE[size]} />
        <p className="truncate text-center text-[0.85em] font-bold tracking-wide uppercase">{player.name}</p>
      </div>

      <div className="relative mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5">
        {STAT_LABELS_RU.map(([label, key]) => (
          <div key={label} className="flex items-center justify-between gap-1">
            <span className="font-extrabold" style={isFull ? { textShadow: `0 0 6px ${theme.borderColor}66` } : undefined}>
              {player[key]}
            </span>
            <span className="opacity-70">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function IconSparkles() {
  const positions = [
    { top: "10%", left: "15%", delay: "0s" },
    { top: "25%", left: "80%", delay: "0.3s" },
    { top: "60%", left: "10%", delay: "0.6s" },
    { top: "75%", left: "85%", delay: "0.9s" },
    { top: "45%", left: "50%", delay: "1.2s" },
  ];
  return (
    <div className="pointer-events-none absolute inset-0">
      {positions.map((pos, i) => (
        <span
          key={i}
          className="sparkle absolute h-1 w-1 rounded-full bg-white"
          style={{ top: pos.top, left: pos.left, animationDelay: pos.delay }}
        />
      ))}
    </div>
  );
}
