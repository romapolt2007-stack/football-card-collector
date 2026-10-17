import { RARITY_THEME } from "../../components/cards/rarityTheme";
import type { Rarity, Stadium } from "../../types/game";
import { SpinReelFrame } from "./SpinReelFrame";

interface Props {
  stadium: Stadium;
  rarity: Rarity;
  onDone: () => void;
}

/** Та же рамка барабана, но результат — реальный стадион с сервера (POST /api/stadiums/spin-staked). */
export function RealStadiumReel({ stadium, rarity, onDone }: Props) {
  return <SpinReelFrame rarity={rarity} resultNode={<RealStadiumResultCard stadium={stadium} rarity={rarity} />} onDone={onDone} />;
}

export function RealStadiumResultCard({ stadium, rarity }: { stadium: Stadium; rarity: Rarity }) {
  const theme = RARITY_THEME[rarity];
  return (
    <div
      className="flex h-[150px] w-[130px] flex-col items-center justify-center gap-2 rounded-[16px] p-3"
      style={{ background: theme.background, color: theme.textColor, boxShadow: theme.glow }}
    >
      <span
        className="flex h-10 w-10 items-center justify-center rounded-[10px] text-[10px] font-extrabold"
        style={{ background: stadium.club.colorPrimary, color: stadium.club.colorSecondary }}
      >
        {stadium.club.shortName}
      </span>
      <div className="flex flex-col items-center">
        <span className="text-xs font-extrabold">{stadium.capacity.toLocaleString("ru-RU")} мест</span>
        <span className="text-[10px] opacity-80">{stadium.name}</span>
      </div>
      <span className="text-[10px] font-bold" style={{ color: theme.textColor }}>
        {theme.emoji} {theme.label}
      </span>
    </div>
  );
}
