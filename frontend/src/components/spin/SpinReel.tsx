import { motion } from "framer-motion";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { RARITY_THEME } from "../cards/rarityTheme";
import { PlayerPortrait } from "../cards/PlayerPortrait";
import { ClubCrest } from "../cards/ClubCrest";
import { haptics } from "../../lib/telegram";
import { sfx } from "../../lib/sfx";
import type { Player, Rarity } from "../../types/game";

const ALL_RARITIES: Rarity[] = ["BRONZE", "SILVER", "GOLD", "LEGEND", "ICON"];
const ITEM_HEIGHT = 92;
const STRIP_LENGTH = 36;
const WINNER_INDEX = 30;
const TOTAL_DURATION_MS = 3200;
const TOP_TIER: Rarity[] = ["LEGEND", "ICON"];

interface Props {
  targetRarity: Rarity;
  player: Player;
  onDone: () => void;
}

/** "Карточка в карточке" — голографический слот: внутри фиксированной рамки вертикально
 * мелькают мини-карточки, рамка светится цветом текущей редкости, в конце результат
 * тормозит и разворачивается лицом к игроку. Результат уже определён сервером — анимация
 * только показывает его. */
export function SpinReel({ targetRarity, player, onDone }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const hasLaunchedRef = useRef(false);
  const isTopTier = TOP_TIER.includes(targetRarity);
  const theme = RARITY_THEME[targetRarity];

  const strip = useMemo(
    () => Array.from({ length: STRIP_LENGTH }, (_, i) => (i === WINNER_INDEX ? targetRarity : ALL_RARITIES[Math.floor(Math.random() * ALL_RARITIES.length)])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const borderColorSequence = useMemo(() => {
    const seq = strip.filter((_, i) => i % 3 === 0).map((r) => RARITY_THEME[r].borderColor);
    seq.push(theme.borderColor, theme.borderColor);
    return seq;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (containerRef.current) setContainerHeight(containerRef.current.offsetHeight);
  }, []);

  useEffect(() => {
    if (containerHeight && !hasLaunchedRef.current) {
      hasLaunchedRef.current = true;
      sfx.launch();
      haptics.impact("medium");
    }
  }, [containerHeight]);

  const targetY = -(WINNER_INDEX * ITEM_HEIGHT + ITEM_HEIGHT / 2 - containerHeight / 2);
  const overshootY = targetY - ITEM_HEIGHT * 0.5;

  function handleSettled() {
    if (isTopTier) {
      sfx.fanfare();
      haptics.notify("success");
    } else {
      sfx.thud();
      haptics.impact("light");
    }
    setRevealed(true);
    window.setTimeout(onDone, 650);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        ref={containerRef}
        className="relative h-[270px] w-[200px] overflow-hidden rounded-[22px] border-[3px] bg-black/40"
        style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 0 26px 2px ${theme.borderColor}55` }}
        animate={containerHeight ? { borderColor: borderColorSequence } : undefined}
        transition={{ duration: TOTAL_DURATION_MS / 1000, ease: "linear" }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-[2px] -translate-y-1/2 bg-gold/70" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.75)_0%,transparent_28%,transparent_72%,rgba(0,0,0,0.75)_100%)]" />

        {!revealed ? (
          <motion.div
            className="flex flex-col"
            initial={{ y: 0 }}
            animate={containerHeight ? { y: isTopTier ? [0, overshootY, targetY] : [0, targetY] } : { y: 0 }}
            transition={
              containerHeight
                ? {
                    duration: TOTAL_DURATION_MS / 1000,
                    y: isTopTier
                      ? { times: [0, 0.88, 1], ease: [[0.11, 0.58, 0.18, 1], [0.34, 1.56, 0.64, 1]] }
                      : { ease: [0.11, 0.58, 0.18, 1] },
                  }
                : { duration: 0 }
            }
            onAnimationComplete={handleSettled}
          >
            {strip.map((rarity, i) =>
              i === WINNER_INDEX ? (
                <MiniSlotCard key={i} rarity={rarity} player={player} faceDown />
              ) : (
                <MiniSlotCard key={i} rarity={rarity} />
              ),
            )}
          </motion.div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <motion.div
              initial={{ rotateY: 180, scale: 0.9 }}
              animate={{ rotateY: 0, scale: 1 }}
              transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ perspective: 800, transformStyle: "preserve-3d" }}
            >
              <MiniSlotCard rarity={targetRarity} player={player} />
            </motion.div>
          </div>
        )}
      </motion.div>
      <p className="text-xs text-white/40">{revealed ? "" : "Крутим..."}</p>
    </div>
  );
}

function MiniSlotCard({ rarity, player, faceDown }: { rarity: Rarity; player?: Player; faceDown?: boolean }) {
  const theme = RARITY_THEME[rarity];

  if (faceDown) {
    return (
      <div
        className="flex shrink-0 items-center justify-center"
        style={{ height: ITEM_HEIGHT, background: `linear-gradient(160deg, ${theme.borderColor}33, transparent)` }}
      >
        <div
          className="flex h-16 w-16 items-center justify-center rounded-xl border-2 text-2xl"
          style={{ borderColor: theme.borderColor, background: "rgba(0,0,0,0.4)" }}
        >
          ❔
        </div>
      </div>
    );
  }

  if (player) {
    return (
      <div
        className="flex shrink-0 items-center gap-2 px-3"
        style={{ height: ITEM_HEIGHT, background: `linear-gradient(160deg, ${theme.background})` }}
      >
        <PlayerPortrait accent={theme.borderColor} size={48} nation={player.nation} playerId={player.id} />
        <div className="flex min-w-0 flex-1 flex-col" style={{ color: theme.textColor }}>
          <span className="truncate text-xs font-extrabold uppercase tracking-wide">{player.name}</span>
          <span className="text-[10px] opacity-75">
            {player.overall} OVR · {theme.label}
          </span>
        </div>
        <ClubCrest club={player.club} size={22} />
      </div>
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center gap-2"
      style={{ height: ITEM_HEIGHT, background: `linear-gradient(160deg, ${theme.borderColor}22, transparent)` }}
    >
      <span className="text-xl opacity-70">{theme.emoji}</span>
      <span className="text-xs font-bold opacity-50" style={{ color: theme.borderColor }}>
        {theme.label}
      </span>
    </div>
  );
}
