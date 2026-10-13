import { motion, type PanInfo } from "framer-motion";
import type { Card } from "../../types/game";
import { RARITY_THEME } from "../cards/rarityTheme";

interface Props {
  card: Card;
  onTap: () => void;
  onDragEnd: (info: PanInfo) => void;
}

export function MiniCard({ card, onTap, onDragEnd }: Props) {
  const theme = RARITY_THEME[card.rarity];

  return (
    <motion.div
      drag
      dragSnapToOrigin
      dragElastic={0.2}
      dragMomentum={false}
      whileDrag={{ scale: 1.15, zIndex: 50 }}
      onDragEnd={(_e, info) => onDragEnd(info)}
      onTap={onTap}
      className="absolute flex h-14 w-11 -translate-x-1/2 -translate-y-1/2 cursor-grab flex-col items-center justify-center rounded-md border text-[9px] font-bold active:cursor-grabbing"
      style={{
        background: theme.background,
        borderColor: theme.borderColor,
        color: theme.textColor,
        touchAction: "none",
      }}
    >
      <span className="text-sm leading-none font-extrabold">{card.player.overall}</span>
      <span className="leading-none opacity-80">{card.player.position}</span>
      <span className="mt-0.5 w-full truncate px-0.5 text-center leading-none">
        {card.player.name}
      </span>
    </motion.div>
  );
}
