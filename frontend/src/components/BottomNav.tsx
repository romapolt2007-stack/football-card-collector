import type { ReactNode } from "react";
import { MiniPackIcon } from "./common/MiniPackIcon";

export type TabId = "packs" | "cases" | "team" | "inventory" | "sbc" | "match" | "market" | "profile";

interface Props {
  tab: TabId;
  onChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: "packs", label: "Паки", icon: <MiniPackIcon className="h-4 w-4" /> },
  { id: "cases", label: "Кейсы", icon: "🎰" },
  { id: "team", label: "Состав", icon: "👥" },
  { id: "inventory", label: "Карты", icon: "🗂️" },
  { id: "sbc", label: "Сборки", icon: "🛠️" },
  { id: "match", label: "Матч", icon: "🏟️" },
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
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[9px] font-semibold ${
              active ? "text-gold" : "text-white/40"
            }`}
          >
            <span className="flex h-4 items-center justify-center text-base leading-none">{t.icon}</span>
            {active && <span>{t.label}</span>}
          </button>
        );
      })}
    </nav>
  );
}
