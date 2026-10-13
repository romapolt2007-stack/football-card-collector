import type { Card } from "../../types/game";
import { RARITY_THEME } from "./rarityTheme";
import { ClubCrest } from "./ClubCrest";
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

export function RarityCard({ card, size = "md", onClick }: Props) {
  const theme = RARITY_THEME[card.rarity];
  const { player } = card;
  const isIcon = card.rarity === "ICON";
  const isLegend = card.rarity === "LEGEND";
  const isUnavailable = card.unavailableMatches > 0;

  return (
    <div
      onClick={onClick}
      className={`relative aspect-[3/4.2] shrink-0 overflow-hidden rounded-2xl border-2 p-3 ${SIZE_CLASSES[size]} ${isIcon ? "icon-pulse" : ""} ${onClick ? "cursor-pointer" : ""}`}
      style={{
        background: theme.background,
        borderColor: theme.borderColor,
        boxShadow: theme.glow,
        color: theme.textColor,
        opacity: isUnavailable ? 0.6 : 1,
      }}
    >
      {isLegend && <div className="holo-sweep pointer-events-none absolute inset-0" />}
      {isIcon && <IconSparkles />}
      {isUnavailable && (
        <span className="absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-extrabold text-white">
          {card.unavailableMatches}
        </span>
      )}

      <div className="relative flex items-start justify-between">
        <div className="flex flex-col items-center leading-none">
          <span className="text-2xl font-extrabold">{player.overall}</span>
          <span className="mt-0.5 text-[0.7em] font-bold opacity-80">{POSITION_RU[player.position]}</span>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <span className="text-lg leading-none">{player.nationFlag}</span>
          <span
            className="rounded px-1.5 py-0.5 text-[0.65em] font-semibold"
            style={{ background: theme.statBg }}
          >
            {player.club.shortName}
          </span>
        </div>
      </div>

      <div className="relative mt-1 flex flex-col items-center">
        <ClubCrest club={player.club} size={56} />
        <p className="mt-1.5 truncate text-center text-[0.85em] font-bold tracking-wide uppercase">
          {player.name}
        </p>
      </div>

      <div className="relative mt-2 grid grid-cols-2 gap-x-2 gap-y-1">
        {STAT_LABELS_RU.map(([label, key]) => (
          <div key={label} className="flex items-center justify-between gap-1">
            <span className="font-extrabold">{player[key]}</span>
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
