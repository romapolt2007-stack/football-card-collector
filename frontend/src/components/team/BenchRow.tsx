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
    <div
      className="rounded-2xl border border-white/10 p-3"
      style={{
        background:
          "linear-gradient(160deg, rgba(20,22,38,0.9), rgba(10,12,24,0.95)), repeating-linear-gradient(135deg, rgba(255,255,255,0.015) 0 2px, transparent 2px 5px)",
      }}
    >
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
                  className="flex h-11 w-9 items-center justify-center rounded-md border border-white/15 text-[9px] text-white/35"
                  style={{
                    background: "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.07), rgba(255,255,255,0.01))",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -2px 3px rgba(0,0,0,0.3), 0 0 6px rgba(255,209,102,0.08)",
                  }}
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
