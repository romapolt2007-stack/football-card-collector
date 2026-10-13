import type { Card } from "../../types/game";
import { RARITY_THEME } from "./rarityTheme";

const STAT_LABELS = [
  ["PAC", "pace"],
  ["DRI", "dribbling"],
  ["SHO", "shooting"],
  ["DEF", "defending"],
  ["PAS", "passing"],
  ["PHY", "physical"],
] as const;

interface Props {
  card: Card;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES: Record<NonNullable<Props["size"]>, string> = {
  sm: "w-32 text-[10px]",
  md: "w-44 text-xs",
  lg: "w-60 text-sm",
};

export function RarityCard({ card, size = "md" }: Props) {
  const theme = RARITY_THEME[card.rarity];
  const { player } = card;
  const initials = player.name.slice(0, 2).toUpperCase();
  const isIcon = card.rarity === "ICON";
  const isLegend = card.rarity === "LEGEND";

  return (
    <div
      className={`relative aspect-[3/4.2] shrink-0 overflow-hidden rounded-2xl border-2 p-3 ${SIZE_CLASSES[size]} ${isIcon ? "icon-pulse" : ""}`}
      style={{
        background: theme.background,
        borderColor: theme.borderColor,
        boxShadow: theme.glow,
        color: theme.textColor,
      }}
    >
      {isLegend && <div className="holo-sweep pointer-events-none absolute inset-0" />}
      {isIcon && <IconSparkles />}

      <div className="relative flex items-start justify-between">
        <div className="flex flex-col items-center leading-none">
          <span className="text-2xl font-extrabold">{player.overall}</span>
          <span className="mt-0.5 text-[0.7em] font-bold opacity-80">{player.position}</span>
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
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 text-lg font-extrabold"
          style={{
            background: `linear-gradient(160deg, ${player.club.colorPrimary}, ${player.club.colorSecondary})`,
            borderColor: theme.borderColor,
          }}
        >
          {initials}
        </div>
        <p className="mt-1.5 truncate text-center text-[0.85em] font-bold tracking-wide uppercase">
          {player.name}
        </p>
      </div>

      <div className="relative mt-2 grid grid-cols-2 gap-x-2 gap-y-1">
        {STAT_LABELS.map(([label, key]) => (
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
