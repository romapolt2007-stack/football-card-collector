import type { Card } from "../../types/game";
import type { SpecialEditionTheme } from "./specialEditionThemes";
import { PlayerPortrait } from "./PlayerPortrait";
import { POSITION_RU, STAT_LABELS_RU } from "../../lib/ruLabels";

interface Props {
  card: Card;
  theme: SpecialEditionTheme;
}

/** Карточка-витрина: одно и то же издание игрока в другом премиальном материале. Чисто декоративная, не меняет редкость карты. */
export function SpecialEditionCard({ card, theme }: Props) {
  const { player } = card;

  return (
    <div
      className="relative aspect-[3/4.2] w-36 shrink-0 overflow-hidden rounded-2xl border-2 p-2.5 text-[10px]"
      style={{
        background: theme.background,
        borderColor: theme.borderColor,
        boxShadow: theme.glow,
        color: theme.textColor,
      }}
    >
      <div className={`${theme.patternClass} pointer-events-none absolute inset-0`} />
      <div className="foil-texture pointer-events-none absolute inset-0" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(140deg, rgba(255,255,255,0.18) 0%, transparent 32%)" }}
      />

      <span
        className="absolute left-2 top-2 z-10 rounded px-1.5 py-0.5 text-[7px] font-extrabold uppercase tracking-wide"
        style={{ background: "rgba(0,0,0,0.4)", color: theme.borderColor }}
      >
        {theme.tag}
      </span>

      <div className="relative flex items-start justify-between pt-3.5">
        <div className="flex flex-col items-center leading-none">
          <span className="text-xl font-extrabold" style={{ textShadow: `0 0 8px ${theme.borderColor}88` }}>
            {player.overall}
          </span>
          <span className="mt-0.5 text-[0.7em] font-bold opacity-80">{POSITION_RU[player.position]}</span>
        </div>
        <span className="text-base leading-none">{player.nationFlag}</span>
      </div>

      <div className="relative mt-1 flex flex-col items-center">
        <PlayerPortrait accent={theme.borderColor} size={54} nation={player.nation} />
        <p className="mt-1 truncate text-center text-[0.8em] font-bold tracking-wide uppercase">{player.name}</p>
        <p className="truncate text-center text-[0.65em] font-semibold opacity-70">{theme.label}</p>
      </div>

      <div className="relative mt-1.5 grid grid-cols-2 gap-x-1.5 gap-y-0.5 text-[9px]">
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
