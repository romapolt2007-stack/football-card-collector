import { MOCK_ACTIVE_COLOR, MOCK_PANEL, MOCK_PANEL_BORDER, MOCK_RED_DOT } from "./theme";

export type MockTab = "play" | "collection" | "market" | "friends" | "more";

interface Props {
  tab: MockTab;
  onChange: (tab: MockTab) => void;
}

const TABS: { id: MockTab; label: string; icon: string }[] = [
  { id: "play", label: "Играть", icon: "▶" },
  { id: "collection", label: "Коллекция", icon: "🗂" },
  { id: "market", label: "Рынок", icon: "🏪" },
  { id: "friends", label: "Друзья", icon: "👥" },
  { id: "more", label: "Ещё", icon: "•••" },
];

/** Нижняя навигация — сплошная полоса на всю ширину с верхней границей (как в исходной версии
 * приложения), а не плавающая закруглённая панель. */
export function MockBottomNav({ tab, onChange }: Props) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
      style={{ background: `${MOCK_PANEL}f2`, borderColor: MOCK_PANEL_BORDER }}
    >
      {TABS.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold"
            style={{ color: active ? MOCK_ACTIVE_COLOR : "rgba(255,255,255,0.45)" }}
          >
            <span className="text-base leading-none">{t.icon}</span>
            <span>{t.label}</span>
            {active && <span className="absolute -top-[1px] h-[2px] w-8 rounded-full" style={{ background: MOCK_ACTIVE_COLOR }} />}
          </button>
        );
      })}
    </nav>
  );
}

export function MockRedDot({ size = 8 }: { size?: number }) {
  return <span className="absolute -right-0.5 -top-0.5 rounded-full" style={{ width: size, height: size, background: MOCK_RED_DOT }} />;
}
