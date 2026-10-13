import type { PanInfo } from "framer-motion";
import type { Card } from "../../types/game";
import { MiniCard } from "./MiniCard";

interface Props {
  slotId: string;
  label: string;
  x: number;
  y: number;
  card: Card | null;
  registerRef: (slotId: string, el: HTMLDivElement | null) => void;
  onTapEmpty: () => void;
  onTapCard: () => void;
  onDragEnd: (slotId: string, info: PanInfo) => void;
}

export function SlotSpot({ slotId, label, x, y, card, registerRef, onTapEmpty, onTapCard, onDragEnd }: Props) {
  return (
    <div
      ref={(el) => registerRef(slotId, el)}
      className="absolute flex h-14 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
      style={{ left: `${x}%`, top: `${y}%` }}
      data-slot-id={slotId}
    >
      {card ? (
        <MiniCard card={card} onTap={onTapCard} onDragEnd={(info) => onDragEnd(slotId, info)} />
      ) : (
        <button
          onClick={onTapEmpty}
          className="flex h-11 w-9 flex-col items-center justify-center rounded-md border-2 border-dashed border-white/25 bg-white/5 text-[9px] font-bold text-white/40"
        >
          {label}
        </button>
      )}
    </div>
  );
}
