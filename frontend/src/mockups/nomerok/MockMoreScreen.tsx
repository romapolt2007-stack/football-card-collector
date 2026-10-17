import { MOCK_MENU_TILES, MOCK_SHOP_CHIPS } from "./mockData";
import { MOCK_ACCENT_GRADIENT, MOCK_ACTIVE_COLOR, MOCK_BG, MOCK_PANEL, MOCK_PANEL_BORDER, MOCK_RED_DOT } from "./theme";

interface Props {
  onBack: () => void;
  level: number;
  xp: number;
  xpToNext: number;
  coins: number;
  onOpenProfile?: () => void;
  onTileClick?: (id: string) => void;
}

const TILE_ICONS: Record<string, string> = {
  cards: "🗂",
  stadium: "🏟",
  market: "🏪",
  trophy: "🏆",
  list: "📋",
  wheel: "🎡",
  friends: "👥",
  gift: "🎁",
};

function ProfileRing({ level, pct }: { level: number; pct: number }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 shrink-0 -rotate-90">
      <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
      <circle cx="24" cy="24" r={r} fill="none" stroke={MOCK_ACTIVE_COLOR} strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} />
      <text x="24" y="24" transform="rotate(90 24 24)" textAnchor="middle" dominantBaseline="central" className="fill-white text-[13px] font-extrabold">
        {level}
      </text>
    </svg>
  );
}

export function MockMoreScreen({ onBack, level, xp, xpToNext, coins, onOpenProfile, onTileClick }: Props) {
  const xpPct = Math.round((xp / xpToNext) * 100);

  return (
    <div className="flex h-dvh flex-col overflow-y-auto pb-[112px]" style={{ background: MOCK_BG }}>
      <div className="flex items-center justify-center px-3 pt-[calc(env(safe-area-inset-top)+10px)]">
        <button onClick={onBack} className="absolute left-3 text-lg">
          ‹
        </button>
        <h1 className="text-base font-extrabold">Ещё</h1>
      </div>

      {/* 3.1 — карточка профиля */}
      <button
        onClick={onOpenProfile}
        className="mx-3 mt-4 flex items-center gap-3 rounded-[18px] px-4 py-3.5 text-left"
        style={{ background: MOCK_PANEL, border: `1px solid ${MOCK_PANEL_BORDER}` }}
      >
        <ProfileRing level={level} pct={xpPct} />
        <div>
          <p className="text-sm font-extrabold">Уровень {level}</p>
          <p className="text-[11px] text-white/45">
            опыт {xp} из {xpToNext}
          </p>
        </div>
        <div className="ml-auto flex flex-col items-end leading-tight">
          <span className="text-[10px] text-white/40">Баланс</span>
          <span className="text-base font-extrabold">{coins.toLocaleString("ru-RU")} 🪙</span>
        </div>
      </button>

      {/* 3.2 — поиск */}
      <div className="mx-3 mt-3 flex items-center gap-2 rounded-[14px] px-3.5 py-2.5" style={{ background: MOCK_PANEL, border: `1px solid ${MOCK_PANEL_BORDER}` }}>
        <span className="text-white/35">🔍</span>
        <span className="text-xs text-white/35">Найти: коллекция, рынок, рейтинг…</span>
      </div>

      {/* 3.3 — сетка разделов */}
      <div className="mx-3 mt-4 grid grid-cols-4 gap-2.5">
        {MOCK_MENU_TILES.map((t) => (
          <button
            key={t.id}
            onClick={() => onTileClick?.(t.id)}
            className="flex flex-col items-center gap-1.5 rounded-[16px] py-3.5 active:scale-[0.97]"
            style={{ background: MOCK_PANEL, border: `1px solid ${MOCK_PANEL_BORDER}` }}
          >
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full text-base" style={{ background: `${t.color}26`, color: t.color }}>
              {TILE_ICONS[t.icon]}
              {t.badge && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full" style={{ background: MOCK_RED_DOT }} />}
            </span>
            <span className="text-[10px] font-semibold text-white/80">{t.label}</span>
          </button>
        ))}
      </div>

      {/* 3.4 — карточка магазина */}
      <div className="mx-3 mt-4 rounded-[16px] p-4" style={{ background: MOCK_ACCENT_GRADIENT }}>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-white/15 text-lg">⭐</span>
          <div className="flex-1">
            <p className="text-sm font-extrabold text-white">Магазин</p>
            <p className="text-[11px] text-white/70">Паки, наборы и усиления за ⭐ звёзды</p>
          </div>
          <button className="rounded-full bg-black/25 px-4 py-2 text-xs font-extrabold text-white">Открыть</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {MOCK_SHOP_CHIPS.map((chip) => (
            <span key={chip} className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#3c1a66]">
              {chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
