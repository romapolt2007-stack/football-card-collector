import { motion, type PanInfo } from "framer-motion";
import type { Card, Rarity } from "../../types/game";
import { RARITY_THEME } from "../cards/rarityTheme";
import { haptics } from "../../lib/telegram";
import { sfx } from "../../lib/sfx";

interface Props {
  card: Card;
  onTap: () => void;
  onDragEnd: (info: PanInfo) => void;
}

function isGoldBadge(rarity: Rarity) {
  return rarity === "GOLD" || rarity === "LEGEND" || rarity === "ICON";
}

export function MiniCard({ card, onTap, onDragEnd }: Props) {
  const theme = RARITY_THEME[card.rarity];

  function handleTap() {
    sfx.kick();
    haptics.impact("light");
    onTap();
  }

  return (
    // Два вложенных motion.div: внешний отвечает за layout-анимацию (плавный
    // "перетёк" игрока в новую позицию при смене схемы), внутренний — за drag.
    // Framer Motion не даёт совмещать drag+dragSnapToOrigin и layout на ОДНОМ
    // элементе (onDragEnd переставал срабатывать) — отсюда разделение.
    <motion.div
      layout
      layoutId={`squad-card-${card.id}`}
      transition={{ layout: { type: "spring", stiffness: 320, damping: 28 } }}
      className="absolute h-14 w-11 -translate-x-1/2 -translate-y-1/2"
    >
      <motion.div
        drag
        dragSnapToOrigin
        dragElastic={0.2}
        dragMomentum={false}
        whileDrag={{ scale: 1.15, zIndex: 50 }}
        onDragEnd={(_e, info) => onDragEnd(info)}
        onTap={handleTap}
        className="flex h-full w-full cursor-grab flex-col items-center active:cursor-grabbing"
        style={{ touchAction: "none" }}
      >
        <div className="card-float-shadow absolute -bottom-1 left-1/2 h-2 w-8 -translate-x-1/2 rounded-full bg-black/60 blur-[3px]" />

        <div
          className="pitch-card-bevel relative flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-md border"
          style={{
            background: theme.background,
            borderColor: theme.borderColor,
            boxShadow: theme.glow !== "none" ? theme.glow : undefined,
          }}
        >
          <span
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-extrabold leading-none text-[#241a0a]"
            style={{
              background: isGoldBadge(card.rarity)
                ? "radial-gradient(circle at 35% 30%, #fff6d8, #e3a825 75%)"
                : "radial-gradient(circle at 35% 30%, #f5f6f8, #9aa0ab 75%)",
            }}
          >
            {card.player.overall}
          </span>
          <span className="text-[7px] font-bold leading-none opacity-90" style={{ color: theme.textColor }}>
            {card.player.position}
          </span>
          <span
            className="w-full truncate px-0.5 text-center text-[7.5px] font-bold leading-none"
            style={{ color: theme.textColor }}
          >
            {card.player.name}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
