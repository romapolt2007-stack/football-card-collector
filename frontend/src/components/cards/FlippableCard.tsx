import { motion } from "framer-motion";
import type { Card } from "../../types/game";
import { CardBack } from "./CardBack";
import { RarityCard } from "./RarityCard";

interface Props {
  card: Card;
  revealed: boolean;
  size?: "sm" | "md" | "lg";
  /** Рубашка намекает на редкость (золото/легенда светятся ещё до переворота) — для пак-опенинга. */
  showRarityBack?: boolean;
  /** Стилизованный портрет вместо герба клуба — для "парадного" раскрытия (рулетка «Удача»). */
  portrait?: boolean;
}

export function FlippableCard({ card, revealed, size = "md", showRarityBack, portrait }: Props) {
  return (
    <div style={{ perspective: 1000 }}>
      <motion.div
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d", position: "relative" }}
      >
        <div style={{ backfaceVisibility: "hidden" }}>
          <CardBack size={size} rarity={showRarityBack ? card.rarity : undefined} />
        </div>
        <div
          style={{
            backfaceVisibility: "hidden",
            position: "absolute",
            inset: 0,
            transform: "rotateY(180deg)",
          }}
        >
          <RarityCard card={card} size={size} portrait={portrait} />
        </div>
      </motion.div>
    </div>
  );
}
