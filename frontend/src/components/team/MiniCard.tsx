import { motion, type PanInfo } from "framer-motion";
import type { Card, Rarity } from "../../types/game";
import { RARITY_THEME } from "../cards/rarityTheme";
import { haptics } from "../../lib/telegram";
import { sfx } from "../../lib/sfx";
import { POSITION_RU } from "../../lib/ruLabels";

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
  const isUnavailable = card.unavailableMatches > 0;

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
          className="pitch-card-bevel relative flex h-full w-full flex-col items-center justify-center gap-0.5 overflow-hidden rounded-md border"
          style={{
            background: theme.background,
            borderColor: theme.borderColor,
            boxShadow: `${theme.glow !== "none" ? `${theme.glow}, ` : ""}0 0 7px ${theme.borderColor}66`,
            opacity: isUnavailable ? 0.55 : 1,
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-black/22" />
          <div className="foil-texture pointer-events-none absolute inset-0" />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.26) 0%, transparent 32%)" }}
          />

          {isUnavailable && (
            <span className="absolute -right-1 -top-1 z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-extrabold text-white">
              {card.unavailableMatches}
            </span>
          )}

          <div className="relative z-10 flex flex-col items-center gap-0.5">
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-extrabold leading-none text-[#241a0a]"
              style={{
                background: isGoldBadge(card.rarity)
                  ? "radial-gradient(circle at 35% 30%, #fff6d8, #e3a825 75%)"
                  : "radial-gradient(circle at 35% 30%, #f5f6f8, #9aa0ab 75%)",
                boxShadow: "0 1px 1px rgba(0,0,0,0.4)",
              }}
            >
              {card.player.overall}
            </span>
            <span
              className="text-[7px] font-bold leading-none opacity-90"
              style={{ color: theme.textColor, textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
            >
              {POSITION_RU[card.player.position]}
            </span>
            <span
              className="w-full truncate px-0.5 text-center text-[7.5px] font-bold leading-none"
              style={{ color: theme.textColor, textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
            >
              {card.player.name}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
