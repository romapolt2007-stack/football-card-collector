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
          className="flex h-11 w-9 flex-col items-center justify-center rounded-md border-2 border-dashed text-[9px] font-bold"
          style={{
            borderColor: "rgba(255,209,102,0.35)",
            background: "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
            color: "rgba(255,209,102,0.55)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -2px 3px rgba(0,0,0,0.25)",
          }}
        >
          {label}
        </button>
      )}
    </div>
  );
}
