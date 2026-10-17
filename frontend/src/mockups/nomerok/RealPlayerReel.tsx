import { RarityCard } from "../../components/cards/RarityCard";
import type { Card, Player, Rarity } from "../../types/game";
import { SpinReelFrame } from "./SpinReelFrame";

interface Props {
  player: Player;
  rarity: Rarity;
  onDone: () => void;
}

/** Та же рамка барабана, но результат уже пришёл с сервера (POST /api/spin/spin) — реальный игрок,
 * реальная редкость. Анимация только показывает то, что уже решено на бэкенде. */
export function RealPlayerReel({ player, rarity, onDone }: Props) {
  return <SpinReelFrame rarity={rarity} resultNode={<RealPlayerResultCard player={player} rarity={rarity} />} onDone={onDone} />;
}

function previewCard(player: Player, rarity: Rarity): Card {
  return {
    id: "preview",
    playerId: player.id,
    ownerId: "",
    rarity,
    isListed: false,
    quickSellPrice: 0,
    obtainedAt: new Date().toISOString(),
    player,
  };
}

/** Единый стандарт карты (RarityCard) — тот же компонент, что в Коллекции/на Рынке/в модалке карты,
 * чтобы результат спина выглядел идентично карте в руках, а не отдельным мини-дизайном. */
export function RealPlayerResultCard({ player, rarity }: { player: Player; rarity: Rarity }) {
  return <RarityCard card={previewCard(player, rarity)} size="sm" />;
}
