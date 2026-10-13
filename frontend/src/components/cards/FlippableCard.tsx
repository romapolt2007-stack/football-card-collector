import { motion } from "framer-motion";
import type { Card } from "../../types/game";
import { CardBack } from "./CardBack";
import { RarityCard } from "./RarityCard";

interface Props {
  card: Card;
  revealed: boolean;
  size?: "sm" | "md" | "lg";
}

export function FlippableCard({ card, revealed, size = "md" }: Props) {
  return (
    <div style={{ perspective: 1000 }}>
      <motion.div
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d", position: "relative" }}
      >
        <div style={{ backfaceVisibility: "hidden" }}>
          <CardBack size={size} />
        </div>
        <div
          style={{
            backfaceVisibility: "hidden",
            position: "absolute",
            inset: 0,
            transform: "rotateY(180deg)",
          }}
        >
          <RarityCard card={card} size={size} />
        </div>
      </motion.div>
    </div>
  );
}
