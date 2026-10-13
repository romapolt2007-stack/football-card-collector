import type { PanInfo } from "framer-motion";
import type { Card, Formation } from "../../types/game";
import { FORMATIONS } from "../../lib/formations";
import { SlotSpot } from "./SlotSpot";

interface Props {
  formation: Formation;
  cardsBySlot: Record<string, Card | null>;
  registerRef: (slotId: string, el: HTMLDivElement | null) => void;
  onTapEmpty: (slotId: string) => void;
  onTapCard: (slotId: string) => void;
  onDragEnd: (slotId: string, info: PanInfo) => void;
}

export function PitchView({ formation, cardsBySlot, registerRef, onTapEmpty, onTapCard, onDragEnd }: Props) {
  return (
    <div
      className="relative aspect-[3/4] w-full overflow-visible rounded-xl border border-white/10"
      style={{ background: "linear-gradient(180deg, #1c6b3a 0%, #164f2c 100%)" }}
    >
      <PitchLines />
      {FORMATIONS[formation].map((slot) => (
        <SlotSpot
          key={slot.id}
          slotId={slot.id}
          label={slot.label}
          x={slot.x}
          y={slot.y}
          card={cardsBySlot[slot.id] ?? null}
          registerRef={registerRef}
          onTapEmpty={() => onTapEmpty(slot.id)}
          onTapCard={() => onTapCard(slot.id)}
          onDragEnd={onDragEnd}
        />
      ))}
    </div>
  );
}

function PitchLines() {
  return (
    <svg
      viewBox="0 0 100 133"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
    >
      <rect x="2" y="2" width="96" height="129" fill="none" stroke="white" strokeWidth="0.5" />
      <line x1="2" y1="66.5" x2="98" y2="66.5" stroke="white" strokeWidth="0.5" />
      <circle cx="50" cy="66.5" r="12" fill="none" stroke="white" strokeWidth="0.5" />
      <rect x="25" y="2" width="50" height="18" fill="none" stroke="white" strokeWidth="0.5" />
      <rect x="25" y="113" width="50" height="18" fill="none" stroke="white" strokeWidth="0.5" />
    </svg>
  );
}
