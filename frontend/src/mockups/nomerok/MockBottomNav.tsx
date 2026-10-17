import { MOCK_PANEL, MOCK_PANEL_BORDER, MOCK_RED_DOT } from "./theme";

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

/** Нижняя навигация макета "Номерок-стиль" — плавающая панель, 5 вкладок. Только вёрстка, без логики. */
export function MockBottomNav({ tab, onChange }: Props) {
  return (
    <nav
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+10px)] z-40 flex rounded-[22px] p-1.5 backdrop-blur-xl"
      style={{ background: MOCK_PANEL, border: `1px solid ${MOCK_PANEL_BORDER}`, boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}
    >
      {TABS.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="relative flex flex-1 flex-col items-center gap-0.5 rounded-[16px] py-2 text-[10px] font-semibold transition"
            style={{ background: active ? "rgba(61,220,90,0.14)" : "transparent", color: active ? "#3DDC5A" : "rgba(255,255,255,0.45)" }}
          >
            <span className="text-base leading-none">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function MockRedDot({ size = 8 }: { size?: number }) {
  return <span className="absolute -right-0.5 -top-0.5 rounded-full" style={{ width: size, height: size, background: MOCK_RED_DOT }} />;
}
