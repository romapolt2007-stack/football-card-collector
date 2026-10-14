import { ClubCrest } from "../cards/ClubCrest";
import { RARITY_THEME } from "../cards/rarityTheme";
import { POSITION_RU } from "../../lib/ruLabels";
import type { PenaltyTierInfo, UserStats } from "../../types/game";

const TIER_GRADIENTS = [
  "linear-gradient(160deg, #3a3a3a 0%, #1c1c1c 100%)",
  "linear-gradient(160deg, #e3a825 0%, #8a5a06 100%)",
  "linear-gradient(160deg, #d9dde3 0%, #8a8f99 100%)",
  "linear-gradient(160deg, #fff6d8 0%, #e3a825 70%, #8a5a06 100%)",
  "linear-gradient(160deg, #e0c3ff 0%, #8a4fff 60%, #4a1f99 100%)",
];

function PenaltyBadge({ label, icon, count, info }: { label: string; icon: string; count: number; info: PenaltyTierInfo }) {
  return (
    <div
      className={`flex flex-1 flex-col items-center gap-1 rounded-xl border p-3 text-center ${info.tier >= 4 ? "icon-pulse" : ""}`}
      style={{
        borderColor: info.tier > 0 ? "#ffd166" : "rgba(255,255,255,0.1)",
        background: TIER_GRADIENTS[info.tier],
        boxShadow: info.tier > 0 ? "0 0 14px rgba(255,209,102,0.35)" : undefined,
      }}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-[10px] font-extrabold uppercase tracking-wide text-white">{label}</span>
      <span className="text-xs font-bold text-white">{info.tierLabel ?? "Нет уровня"}</span>
      <span className="text-[9px] text-white/60">
        {count}
        {info.nextThreshold ? ` / ${info.nextThreshold}` : " · максимум"}
      </span>
    </div>
  );
}

interface Achievement {
  id: string;
  label: string;
  icon: string;
  description: string;
  unlocked: boolean;
}

function buildAchievements(stats: UserStats): Achievement[] {
  return [
    {
      id: "veteran",
      label: "Ветеран",
      icon: "🎖️",
      description: "100 дней в игре",
      unlocked: stats.daysPlayed >= 100,
    },
    {
      id: "sniper",
      label: "Снайпер",
      icon: "🎯",
      description: "500 голов за карьеру",
      unlocked: stats.totalGoals >= 500,
    },
    {
      id: "collector",
      label: "Коллекционер",
      icon: "🗂️",
      description: "50+ карт в коллекции",
      unlocked: stats.totalCards >= 50,
    },
    {
      id: "champion",
      label: "Чемпион",
      icon: "🏆",
      description: "10 побед в матчах",
      unlocked: stats.wins >= 10,
    },
    {
      id: "trader",
      label: "Трейдер",
      icon: "💹",
      description: "5 продаж на рынке",
      unlocked: stats.marketSales >= 5,
    },
    {
      id: "veteran_field",
      label: "Игрок поля",
      icon: "🏟️",
      description: "50 сыгранных матчей",
      unlocked: stats.totalMatches >= 50,
    },
  ];
}

interface Props {
  stats: UserStats;
}

export function StatsTab({ stats }: Props) {
  const achievements = buildAchievements(stats);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Матчи" value={stats.totalMatches} />
        <StatTile label="Победы" value={stats.wins} />
        <StatTile label="% побед" value={`${stats.winRate}%`} />
        <StatTile label="Голов" value={stats.totalGoals} />
        <StatTile label="Карт в коллекции" value={stats.totalCards} />
        <StatTile label="Продаж на рынке" value={stats.marketSales} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs text-white/50">Стоимость активного состава</p>
        <p className="mt-1 text-xl font-extrabold text-gold">{stats.squadValue.toLocaleString("ru-RU")} 🪙</p>
      </div>

      {stats.bestCard && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="mb-2 text-xs text-white/50">Лучший игрок клуба</p>
          <div
            className="flex items-center gap-3 rounded-xl border-2 p-3"
            style={{
              background: RARITY_THEME[stats.bestCard.rarity].background,
              borderColor: RARITY_THEME[stats.bestCard.rarity].borderColor,
              boxShadow: RARITY_THEME[stats.bestCard.rarity].glow,
              color: RARITY_THEME[stats.bestCard.rarity].textColor,
            }}
          >
            <span className="text-2xl font-extrabold">{stats.bestCard.player.overall}</span>
            <ClubCrest club={stats.bestCard.player.club} size={36} />
            <div>
              <p className="font-bold uppercase">{stats.bestCard.player.name}</p>
              <p className="text-xs opacity-80">{POSITION_RU[stats.bestCard.player.position]}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold text-white/70">Пенальти-мастерство</p>
        <div className="flex gap-2.5">
          <PenaltyBadge label="Снайпер" icon="🎯" count={stats.penaltyGoals} info={stats.penaltySniperTier} />
          <PenaltyBadge label="Стена" icon="🧤" count={stats.penaltySaves} info={stats.penaltyWallTier} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-white/70">Достижения</p>
        <div className="grid grid-cols-3 gap-2.5">
          {achievements.map((a) => (
            <div
              key={a.id}
              className="flex flex-col items-center gap-1 rounded-xl border p-3 text-center"
              style={{
                borderColor: a.unlocked ? "#ffd166" : "rgba(255,255,255,0.1)",
                background: a.unlocked ? "rgba(255,209,102,0.1)" : "rgba(255,255,255,0.03)",
                boxShadow: a.unlocked ? "0 0 12px rgba(255,209,102,0.3)" : undefined,
                opacity: a.unlocked ? 1 : 0.4,
              }}
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="text-[10px] font-bold">{a.label}</span>
              <span className="text-[9px] text-white/40">{a.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
      <p className="text-lg font-extrabold">{value}</p>
      <p className="text-[10px] text-white/50">{label}</p>
    </div>
  );
}
