import type { ReactNode } from "react";

export type TabId = "spin" | "stadiums" | "collection" | "market" | "profile";

interface Props {
  tab: TabId;
  onChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: "spin", label: "Собрать", icon: "🎰" },
  { id: "stadiums", label: "Стадионы", icon: "🏟️" },
  { id: "collection", label: "Коллекция", icon: "🗂️" },
  { id: "market", label: "Рынок", icon: "🏪" },
  { id: "profile", label: "Профиль", icon: "👤" },
];

export function BottomNav({ tab, onChange }: Props) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/10 bg-pitch-dark/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      {TABS.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[9px] font-semibold"
            style={{ color: active ? "#ffd166" : "rgba(255,255,255,0.4)" }}
          >
            <span className="flex h-4 items-center justify-center text-base leading-none">{t.icon}</span>
            {active && <span>{t.label}</span>}
          </button>
        );
      })}
    </nav>
  );
}
