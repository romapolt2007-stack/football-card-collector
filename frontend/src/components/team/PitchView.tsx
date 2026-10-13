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
    <div className="flex flex-col">
      <StadiumBackdrop />
      <div className="relative aspect-[3/4] w-full overflow-visible rounded-b-2xl border border-white/10 shadow-2xl">
        <PitchSurface />
        <PitchLines />
        <div className="absolute inset-0">
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
      </div>
    </div>
  );
}

/** Трибуны + прожекторы над полем — декоративная полоса, задаёт глубину сцены. */
function StadiumBackdrop() {
  return (
    <div
      className="pointer-events-none relative h-14 w-full overflow-hidden rounded-t-2xl border-x border-t border-white/10"
      style={{ background: "linear-gradient(180deg, #0a0f20 0%, #111a33 55%, transparent 100%)" }}
    >
      <div
        className="crowd-shimmer absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 2px, transparent 2px, transparent 6px)",
          filter: "blur(2px)",
          maskImage: "linear-gradient(180deg, black 0%, black 50%, transparent 100%)",
        }}
      />
      <div
        className="floodlight-pulse absolute -left-8 -top-6 h-24 w-24 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,244,200,0.55) 0%, transparent 70%)", filter: "blur(4px)" }}
      />
      <div
        className="floodlight-pulse absolute -right-8 -top-6 h-24 w-24 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,244,200,0.55) 0%, transparent 70%)",
          filter: "blur(4px)",
          animationDelay: "1.4s",
        }}
      />
    </div>
  );
}

/** Газон с лёгким 3D-наклоном (только текстура — слоты карточек поверх остаются плоскими). */
function PitchSurface() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-b-2xl" style={{ perspective: "500px" }}>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #1f8049 0%, #1c7140 14%, #1a6339 32%, #17552f 55%, #144a29 78%, #113f24 100%)",
          transform: "rotateX(5deg)",
          transformOrigin: "bottom center",
        }}
      >
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: "repeating-linear-gradient(180deg, rgba(255,255,255,0.05) 0 9%, transparent 9% 18%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 70% 45% at 50% 100%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 100%)" }}
        />
      </div>
    </div>
  );
}

function PitchLines() {
  return (
    <svg
      viewBox="0 0 100 133"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-55"
    >
      <rect x="2" y="2" width="96" height="129" fill="none" stroke="white" strokeWidth="0.6" />
      <line x1="2" y1="66.5" x2="98" y2="66.5" stroke="white" strokeWidth="0.6" />
      <circle cx="50" cy="66.5" r="12" fill="none" stroke="white" strokeWidth="0.6" />
      <circle cx="50" cy="66.5" r="0.8" fill="white" />
      <rect x="22" y="2" width="56" height="20" fill="none" stroke="white" strokeWidth="0.6" />
      <rect x="38" y="2" width="24" height="8" fill="none" stroke="white" strokeWidth="0.6" />
      <circle cx="50" cy="16" r="0.8" fill="white" />
      <path d="M 38 20 A 12 12 0 0 0 62 20" fill="none" stroke="white" strokeWidth="0.6" />
      <rect x="22" y="111" width="56" height="20" fill="none" stroke="white" strokeWidth="0.6" />
      <rect x="38" y="123" width="24" height="8" fill="none" stroke="white" strokeWidth="0.6" />
      <circle cx="50" cy="117" r="0.8" fill="white" />
      <path d="M 38 113 A 12 12 0 0 1 62 113" fill="none" stroke="white" strokeWidth="0.6" />
    </svg>
  );
}
