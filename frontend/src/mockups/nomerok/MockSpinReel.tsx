import { useMemo } from "react";
import { RARITY_THEME } from "../../components/cards/rarityTheme";
import type { Rarity } from "../../types/game";
import { SpinReelFrame } from "./SpinReelFrame";
import { MOCK_CLUBS, type MockClub } from "./mockData";

const ALL_RARITIES: Rarity[] = ["BRONZE", "SILVER", "GOLD", "LEGEND", "ICON"];
// Те же веса, что и в реальной экономике спина (backend/src/lib/spin.ts, минимальная ставка) — для правдоподобия макета.
const MOCK_WEIGHTS: Record<Rarity, number> = { BRONZE: 60, SILVER: 25, GOLD: 12, LEGEND: 2.5, ICON: 0.5 };

function rollMockRarity(): Rarity {
  const total = Object.values(MOCK_WEIGHTS).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const rarity of ALL_RARITIES) {
    r -= MOCK_WEIGHTS[rarity];
    if (r <= 0) return rarity;
  }
  return "BRONZE";
}

export interface MockSpinOutcome {
  rarity: Rarity;
  club: MockClub;
  capacity: number;
}

function rollMockOutcome(pool: MockClub[]): MockSpinOutcome {
  const club = pool[Math.floor(Math.random() * pool.length)] ?? MOCK_CLUBS[0];
  return { rarity: rollMockRarity(), club, capacity: club.stadiumCapacity };
}

interface Props {
  pool: MockClub[];
  onDone: (outcome: MockSpinOutcome) => void;
}

/** Стадионы пока не подключены к бэкенду (там нет платного спина с фильтром по лиге/клубу,
 * только старый бесплатный раз-в-24ч) — оставляем клиентский мок до отдельного решения по экономике. */
export function MockSpinReel({ pool, onDone }: Props) {
  const outcome = useMemo(() => rollMockOutcome(pool), [pool]);
  return <SpinReelFrame rarity={outcome.rarity} resultNode={<MockResultCard outcome={outcome} />} onDone={() => onDone(outcome)} />;
}

export function MockResultCard({ outcome }: { outcome: MockSpinOutcome }) {
  const theme = RARITY_THEME[outcome.rarity];
  return (
    <div
      className="flex h-[150px] w-[130px] flex-col items-center justify-center gap-2 rounded-[16px] p-3"
      style={{ background: theme.background, color: theme.textColor, boxShadow: theme.glow }}
    >
      <span
        className="flex h-10 w-10 items-center justify-center rounded-[10px] text-[10px] font-extrabold"
        style={{ background: outcome.club.colorPrimary, color: outcome.club.colorSecondary }}
      >
        {outcome.club.shortName}
      </span>
      <div className="flex flex-col items-center">
        <span className="text-xs font-extrabold">{outcome.capacity.toLocaleString("ru-RU")} мест</span>
        <span className="text-[10px] opacity-80">{outcome.club.name}</span>
      </div>
      <span className="text-[10px] font-bold" style={{ color: theme.textColor }}>
        {theme.emoji} {theme.label}
      </span>
    </div>
  );
}
