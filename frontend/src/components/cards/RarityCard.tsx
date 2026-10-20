import type { Card } from "../../types/game";
import { RARITY_THEME } from "./rarityTheme";
import { ClubCrest } from "./ClubCrest";
import { PlayerActionSilhouette } from "./PlayerActionSilhouette";
import { hashString } from "./nationLooks";

interface Props {
  card: Card;
  size?: "sm" | "md" | "lg" | "full";
  onClick?: () => void;
}

const SIZE_CLASSES: Record<NonNullable<Props["size"]>, string> = {
  sm: "w-32 text-[10px]",
  md: "w-44 text-xs",
  lg: "w-60 text-sm",
  full: "w-full text-[11px]",
};

const SILHOUETTE_SIZE: Record<NonNullable<Props["size"]>, number> = {
  sm: 46,
  md: 60,
  lg: 82,
  full: 78,
};

const PADDING_CLASSES: Record<NonNullable<Props["size"]>, string> = {
  sm: "p-2.5 pb-2",
  md: "p-3 pb-2.5",
  lg: "p-3.5 pb-3",
  full: "p-3.5 pb-3",
};

const FRAME_THICKNESS: Record<NonNullable<Props["size"]>, string> = {
  sm: "3px",
  md: "3px",
  lg: "4px",
  full: "4px",
};

/** 6 статов — международные аббревиатуры (как в референсе), а не переводные: это "игровые
 * термины" карты, а не интерфейс приложения (тот остаётся русским). */
const STAT_LABELS_EN = [
  ["PAC", "pace"],
  ["DRI", "dribbling"],
  ["SHO", "shooting"],
  ["DEF", "defending"],
  ["PAS", "passing"],
  ["PHY", "physical"],
] as const;

/** Фирменная форма карты — мягко скруглённый верх (несколько точек вместо прямой линии
 * аппроксимируют кривую), заострение к низу. Полностью своя форма, не копия чьего-то ассета. */
const CARD_CLIP =
  "polygon(8% 2%, 20% 0%, 50% 0%, 80% 0%, 92% 2%, 100% 8%, 100% 88%, 85% 94%, 50% 100%, 15% 94%, 0% 88%, 0% 8%)";

/** Фон под золотой рамкой — для каждой редкости свой "энергетический" фон: тёмная радиальная
 * база в оттенке редкости + диагональные светящиеся полосы того же оттенка. Та же визуальная
 * формула везде, меняется только палитра, так что редкость читается с первого взгляда ещё до
 * того, как заметен сам цвет цифр/свечения силуэта. */
const RARITY_BG: Record<Card["rarity"], string> = {
  BRONZE: "radial-gradient(130% 95% at 50% 0%, #5c3618 0%, #2e1a0c 46%, #120a04 100%)",
  SILVER: "radial-gradient(130% 95% at 50% 0%, #4a4f58 0%, #22252b 46%, #0c0d10 100%)",
  GOLD: "radial-gradient(130% 95% at 50% 0%, #5a4414 0%, #2b2008 46%, #100b02 100%)",
  LEGEND: "radial-gradient(130% 95% at 50% 0%, #3c1a66 0%, #1d0e3a 46%, #0a0616 100%)",
  ICON: "radial-gradient(135% 95% at 50% 0%, #4a1026 0%, #2a0a18 42%, #0c0308 100%)",
};

const RARITY_STREAKS: Record<Card["rarity"], string> = {
  BRONZE:
    "linear-gradient(112deg, transparent 22%, rgba(230,160,90,0.38) 30%, transparent 40%)," +
    "linear-gradient(112deg, transparent 48%, rgba(205,127,50,0.3) 56%, transparent 66%)," +
    "linear-gradient(112deg, transparent 70%, rgba(160,100,40,0.24) 78%, transparent 88%)",
  SILVER:
    "linear-gradient(112deg, transparent 22%, rgba(230,233,238,0.38) 30%, transparent 40%)," +
    "linear-gradient(112deg, transparent 48%, rgba(190,198,208,0.28) 56%, transparent 66%)," +
    "linear-gradient(112deg, transparent 70%, rgba(140,150,165,0.24) 78%, transparent 88%)",
  GOLD:
    "linear-gradient(112deg, transparent 22%, rgba(255,230,160,0.4) 30%, transparent 40%)," +
    "linear-gradient(112deg, transparent 48%, rgba(255,209,102,0.3) 56%, transparent 66%)," +
    "linear-gradient(112deg, transparent 70%, rgba(200,150,60,0.24) 78%, transparent 88%)",
  LEGEND:
    "linear-gradient(112deg, transparent 22%, rgba(190,130,255,0.4) 30%, transparent 40%)," +
    "linear-gradient(112deg, transparent 48%, rgba(255,140,210,0.28) 56%, transparent 66%)," +
    "linear-gradient(112deg, transparent 70%, rgba(130,170,255,0.22) 78%, transparent 88%)",
  ICON:
    "linear-gradient(112deg, transparent 22%, rgba(255,120,150,0.38) 30%, transparent 40%)," +
    "linear-gradient(112deg, transparent 48%, rgba(255,59,92,0.28) 56%, transparent 66%)," +
    "linear-gradient(112deg, transparent 70%, rgba(200,40,70,0.22) 78%, transparent 88%)",
};

/** Шлифованный металл — полоса светлых/тёмных золотых бликов имитирует брашированную
 * поверхность, а не плоскую заливку. */
const BRUSHED_GOLD =
  "linear-gradient(135deg, #fff3c4 0%, #d9a334 16%, #ffe9a8 30%, #b9811c 46%, #ffdf91 62%, #946112 78%, #ffe9a8 92%, #fff3c4 100%)";

/** Стабильный "игровой номер" 1-99 — чисто декоративный элемент карты (хэш от id игрока), в игре
 * нигде не хранится и не заявляется как настоящий номер футболиста. */
function jerseyNumber(playerId: string): number {
  return 1 + (hashString(playerId) % 99);
}

export function RarityCard({ card, size = "md", onClick }: Props) {
  const theme = RARITY_THEME[card.rarity];
  const { player } = card;
  const isIcon = card.rarity === "ICON";
  const isLegend = card.rarity === "LEGEND";

  return (
    <div
      onClick={onClick}
      className={`relative shrink-0 aspect-[3/5] ${SIZE_CLASSES[size]} ${onClick ? "cursor-pointer" : ""}`}
      style={{
        background: BRUSHED_GOLD,
        boxShadow: isIcon
          ? "0 0 3px 1px rgba(255,223,145,0.95), 0 0 20px 4px rgba(255,197,94,0.55), 0 0 36px 10px rgba(255,59,92,0.4)"
          : "0 0 3px 1px rgba(255,223,145,0.9), 0 0 24px 5px rgba(255,197,94,0.5)",
        clipPath: CARD_CLIP,
      }}
    >
      <div
        className={`absolute overflow-hidden ${isIcon ? "icon-pulse" : ""} ${PADDING_CLASSES[size]}`}
        style={{ inset: FRAME_THICKNESS[size], background: RARITY_BG[card.rarity], color: "#f5f1e6", clipPath: CARD_CLIP }}
      >
        <div className="carbon-texture pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute inset-0" style={{ background: RARITY_STREAKS[card.rarity] }} />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(140deg, rgba(255,255,255,0.14) 0%, transparent 34%)" }}
        />
        {isLegend && <div className="holo-sweep pointer-events-none absolute inset-0" />}
        {isIcon && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "linear-gradient(115deg, transparent 38%, rgba(255,59,92,0.35) 50%, transparent 62%)",
            }}
          />
        )}
        {isIcon && <IconSparkles />}

        <div className="relative flex items-start justify-between">
          <div className="flex flex-col items-center leading-none">
            <span className="text-2xl font-extrabold text-white" style={{ textShadow: `0 0 8px ${theme.borderColor}aa` }}>
              {player.overall}
            </span>
            <span className="mt-0.5 text-[0.7em] font-bold opacity-80">
              {player.position} · No. {jerseyNumber(player.id)}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <span className="text-lg leading-none">{player.nationFlag}</span>
            <ClubCrest club={player.club} size={size === "full" || size === "lg" ? 26 : 18} />
          </div>
        </div>

        <div className="relative flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            <span
              className="pointer-events-none absolute rounded-full blur-md"
              style={{
                width: SILHOUETTE_SIZE[size] * 1.3,
                height: SILHOUETTE_SIZE[size] * 1.3,
                background: `radial-gradient(circle, ${theme.borderColor}55 0%, transparent 70%)`,
              }}
            />
            <PlayerActionSilhouette accent={theme.borderColor} size={SILHOUETTE_SIZE[size]} />
          </div>
          <p className="truncate text-center text-[0.85em] font-bold tracking-wide text-white uppercase">{player.name}</p>
        </div>

        <div className="relative mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5">
          {STAT_LABELS_EN.map(([label, key]) => (
            <div key={label} className="flex items-center justify-between gap-1">
              <span className="opacity-70">{label}</span>
              <span className="font-extrabold text-white" style={{ textShadow: `0 0 5px ${theme.borderColor}88` }}>
                {player[key]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IconSparkles() {
  const positions = [
    { top: "10%", left: "15%", delay: "0s" },
    { top: "25%", left: "80%", delay: "0.3s" },
    { top: "60%", left: "10%", delay: "0.6s" },
    { top: "75%", left: "85%", delay: "0.9s" },
    { top: "45%", left: "50%", delay: "1.2s" },
  ];
  return (
    <div className="pointer-events-none absolute inset-0">
      {positions.map((pos, i) => (
        <span
          key={i}
          className="sparkle absolute h-1 w-1 rounded-full bg-white"
          style={{ top: pos.top, left: pos.left, animationDelay: pos.delay }}
        />
      ))}
    </div>
  );
}
