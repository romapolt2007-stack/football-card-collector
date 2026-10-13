import type { PanInfo } from "framer-motion";
import type { Card } from "../../types/game";
import { BENCH_SLOT_IDS } from "../../lib/formations";
import { MiniCard } from "./MiniCard";

interface Props {
  cardsBySlot: Record<string, Card | null>;
  registerRef: (slotId: string, el: HTMLDivElement | null) => void;
  onTapEmpty: (slotId: string) => void;
  onTapCard: (slotId: string) => void;
  onDragEnd: (slotId: string, info: PanInfo) => void;
}

export function BenchRow({ cardsBySlot, registerRef, onTapEmpty, onTapCard, onDragEnd }: Props) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-white/50">Запасные</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {BENCH_SLOT_IDS.map((slotId) => {
          const card = cardsBySlot[slotId] ?? null;
          return (
            <div
              key={slotId}
              ref={(el) => registerRef(slotId, el)}
              className="relative flex h-14 w-11 shrink-0 items-center justify-center"
              data-slot-id={slotId}
            >
              {card ? (
                <MiniCard card={card} onTap={() => onTapCard(slotId)} onDragEnd={(info) => onDragEnd(slotId, info)} />
              ) : (
                <button
                  onClick={() => onTapEmpty(slotId)}
                  className="flex h-11 w-9 items-center justify-center rounded-md border-2 border-dashed border-white/20 bg-white/5 text-[9px] text-white/30"
                >
                  +
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
