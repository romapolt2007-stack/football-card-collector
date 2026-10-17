import { RARITY_THEME } from "../../components/cards/rarityTheme";
import { POSITION_RU } from "../../lib/ruLabels";
import type { Player, Rarity } from "../../types/game";
import { SpinReelFrame } from "./SpinReelFrame";

interface Props {
  player: Player;
  rarity: Rarity;
  onDone: () => void;
}

/** Та же рамка барабана, но результат уже пришёл с сервера (POST /api/spin/spin) — реальный игрок,
 * реальная редкость. Анимация только показывает то, что уже решено на бэкенде. */
export function RealPlayerReel({ player, rarity, onDone }: Props) {
  return <SpinReelFrame rarity={rarity} resultNode={<RealPlayerResultCard player={player} rarity={rarity} />} onDone={onDone} />;
}

export function RealPlayerResultCard({ player, rarity }: { player: Player; rarity: Rarity }) {
  const theme = RARITY_THEME[rarity];
  return (
    <div
      className="flex h-[150px] w-[130px] flex-col items-center justify-center gap-2 rounded-[16px] p-3"
      style={{ background: theme.background, color: theme.textColor, boxShadow: theme.glow }}
    >
      <span
        className="flex h-10 w-10 items-center justify-center rounded-[10px] text-[10px] font-extrabold"
        style={{ background: player.club.colorPrimary, color: player.club.colorSecondary }}
      >
        {player.club.shortName}
      </span>
      <div className="flex flex-col items-center">
        <span className="text-xs font-extrabold">{player.nationFlag} {player.name}</span>
        <span className="text-[10px] opacity-80">
          {POSITION_RU[player.position]} · {player.overall} OVR
        </span>
      </div>
      <span className="text-[10px] font-bold" style={{ color: theme.textColor }}>
        {theme.emoji} {theme.label}
      </span>
    </div>
  );
}
