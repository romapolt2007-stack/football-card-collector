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
/** Порог для особой механики "заморозки + 2 тапа" — только для настоящих суперзвёзд. */
const ULTRA_RARE_OVR = 93;
const TAPS_REQUIRED = 2;

interface Props {
  targetRarity: Rarity;
  player: Player;
  onDone: () => void;
}

/** "Карточка в карточке" — голографический слот: внутри фиксированной рамки вертикально
 * мелькают мини-карточки, рамка светится цветом текущей редкости, в конце результат
 * тормозит и разворачивается лицом к игроку. Для игроков 93+ OVR — результат сначала
 * "замирает" рубашкой вверх с золотой пульсацией и требует 2 тапа перед разворотом.
 * Результат уже определён сервером — анимация только показывает его. */
export function SpinReel({ targetRarity, player, onDone }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [taps, setTaps] = useState(0);
  const [burst, setBurst] = useState(false);
  const hasLaunchedRef = useRef(false);
  const humStopRef = useRef<(() => void) | null>(null);
  const isTopTier = TOP_TIER.includes(targetRarity);
  const isUltraRare = player.overall >= ULTRA_RARE_OVR;
  const theme = RARITY_THEME[targetRarity];
  const frozen = revealed && isUltraRare && !burst;

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

  useEffect(() => () => humStopRef.current?.(), []);

  const targetY = -(WINNER_INDEX * ITEM_HEIGHT + ITEM_HEIGHT / 2 - containerHeight / 2);
  const overshootY = targetY - ITEM_HEIGHT * 0.5;

  function handleSettled() {
    setRevealed(true);
    if (isUltraRare) {
      humStopRef.current = sfx.tensionHum();
      haptics.impact("heavy");
      return;
    }
    if (isTopTier) {
      sfx.fanfare();
      haptics.notify("success");
    } else {
      sfx.thud();
      haptics.impact("light");
    }
    window.setTimeout(onDone, 650);
  }

  function handleFreezeTap() {
    if (!frozen || burst) return;
    const next = taps + 1;
    setTaps(next);
    sfx.crystalTap();
    haptics.impact(next >= TAPS_REQUIRED ? "heavy" : "medium");
    if (next >= TAPS_REQUIRED) {
      humStopRef.current?.();
      setBurst(true);
      sfx.goldBurst();
      haptics.notify("success");
      window.setTimeout(onDone, 1150);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {frozen && <div className="fixed inset-0 z-30 bg-black/55" />}
      <motion.div
        ref={containerRef}
        className={`relative z-40 h-[270px] w-[200px] overflow-hidden rounded-[22px] border-[3px] bg-black/40 ${frozen ? "ultra-freeze-pulse" : ""}`}
        style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 0 26px 2px ${theme.borderColor}55` }}
        animate={containerHeight && !frozen && !burst ? { borderColor: borderColorSequence } : undefined}
        transition={{ duration: TOTAL_DURATION_MS / 1000, ease: "linear" }}
        onClick={handleFreezeTap}
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
        ) : frozen ? (
          <div className="relative flex h-full flex-col items-center justify-center gap-3">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 text-4xl"
              style={{ borderColor: "#ffd166", background: "rgba(0,0,0,0.45)" }}
            >
              ❔
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-extrabold uppercase tracking-wide text-gold">👆 Нажми {TAPS_REQUIRED} раза</span>
              <span className="text-[11px] font-bold text-white/60">{taps}/{TAPS_REQUIRED}</span>
            </div>
            {Array.from({ length: taps }).map((_, i) => (
              <SparkBurst key={i} />
            ))}
          </div>
        ) : (
          <div className="relative flex h-full items-center justify-center">
            {burst && <LightRayBurst />}
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

function SparkBurst() {
  const angles = [0, 60, 120, 180, 240, 300];
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {angles.map((deg) => (
        <span
          key={deg}
          className="spark-particle absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-gold"
          style={{ transform: `translate(-50%,-50%) rotate(${deg}deg) translateY(-34px)` }}
        />
      ))}
    </div>
  );
}

function LightRayBurst() {
  return (
    <div className="light-ray-burst pointer-events-none absolute inset-0 z-10">
      <div
        className="absolute inset-0"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0deg, rgba(255,209,102,0.9) 8deg, transparent 20deg, transparent 70deg, rgba(255,209,102,0.7) 80deg, transparent 95deg, transparent 160deg, rgba(255,209,102,0.8) 170deg, transparent 185deg, transparent 250deg, rgba(255,209,102,0.7) 260deg, transparent 275deg, transparent 340deg, rgba(255,209,102,0.9) 350deg, transparent 360deg)",
        }}
      />
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
