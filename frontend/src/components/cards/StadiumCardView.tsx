import type { StadiumCard } from "../../types/game";
import { RARITY_THEME } from "./rarityTheme";
import { StadiumIllustration } from "./StadiumIllustration";
import { ClubCrest } from "./ClubCrest";

interface Props {
  stadiumCard: StadiumCard;
  size?: "sm" | "md" | "lg" | "full";
  onClick?: () => void;
}

const SIZE_CLASSES: Record<NonNullable<Props["size"]>, string> = {
  sm: "w-32 text-[10px]",
  md: "w-44 text-xs",
  lg: "w-60 text-sm",
  full: "w-full text-[11px]",
};

const PENNANT_CLIP =
  "polygon(5% 0%, 95% 0%, 100% 3%, 100% 90%, 84% 95%, 50% 100%, 16% 95%, 0% 90%, 0% 3%)";

export function StadiumCardView({ stadiumCard, size = "md", onClick }: Props) {
  const { stadium } = stadiumCard;
  const theme = RARITY_THEME[stadium.rarity];
  const isLegend = stadium.rarity === "LEGEND";
  const isIcon = stadium.rarity === "ICON";
  const isFull = size === "full";

  return (
    <div
      onClick={onClick}
      className={`relative aspect-[3/4.2] shrink-0 overflow-hidden pb-4 border-[3px] p-3 ${SIZE_CLASSES[size]} ${isIcon ? "icon-pulse" : ""} ${onClick ? "cursor-pointer" : ""}`}
      style={{
        background: theme.background,
        borderColor: theme.borderColor,
        boxShadow: theme.glow,
        color: theme.textColor,
        clipPath: PENNANT_CLIP,
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-black/18" />
      <div className="foil-texture pointer-events-none absolute inset-0" />
      {isLegend && <div className="holo-sweep pointer-events-none absolute inset-0" />}

      <div className="relative flex items-start justify-between">
        <span className="text-lg font-extrabold" style={isFull ? { textShadow: `0 0 10px ${theme.borderColor}88` } : undefined}>
          {(stadium.capacity / 1000).toFixed(0)}к
        </span>
        <div className="flex items-center gap-1">
          <ClubCrest club={stadium.club} size={18} />
        </div>
      </div>

      <div className="relative mt-1 flex flex-col items-center">
        <StadiumIllustration stadiumId={stadium.id} accent={theme.borderColor} size={isFull ? 84 : 64} />
        <p className="mt-1.5 truncate text-center text-[0.85em] font-bold tracking-wide uppercase">{stadium.name}</p>
        <p className="truncate text-center text-[0.75em] opacity-75">{stadium.city}</p>
      </div>

      <div className="relative mt-2 grid grid-cols-2 gap-x-2 gap-y-1">
        <div className="flex items-center justify-between gap-1">
          <span className="font-extrabold">{stadium.capacity.toLocaleString("ru-RU")}</span>
          <span className="opacity-70">мест</span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <span className="font-extrabold">{stadium.openedYear}</span>
          <span className="opacity-70">год</span>
        </div>
        <div className="col-span-2 truncate text-center opacity-80">{stadium.club.name}</div>
      </div>
    </div>
  );
}
