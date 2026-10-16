import type { ReactNode } from "react";
import { useState } from "react";
import { haptics } from "../../lib/telegram";

export interface FilterOption {
  id: string;
  label: string;
  icon?: string;
  iconNode?: ReactNode;
  accent?: string;
}

interface Props {
  title: string;
  options: FilterOption[];
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
  onClose: () => void;
}

/** Нижний лист выбора фильтра — тот же паттерн, что выбор региона в «Номерке», но свой визуал: стекло/блюр, карточки, никаких реальных лого лиг/клубов — только свои иконки/эмодзи/цвета. */
export function FilterPicker({ title, options, selectedId, onSelect, onClose }: Props) {
  const [search, setSearch] = useState("");
  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[75vh] w-full max-w-md flex-col rounded-t-[24px] border-t border-white/15 bg-[rgba(26,20,54,0.82)] shadow-[0_-8px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <p className="text-sm font-bold">{title}</p>
          <button onClick={onClose} className="text-sm text-white/50 transition active:scale-95">
            Закрыть
          </button>
        </div>

        <div className="px-5 pb-3">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/40">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="w-full rounded-xl border border-white/15 bg-black/35 py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-white/40 focus:border-gold/40"
            />
          </div>
        </div>

        <div className="filter-sheet-scroll flex-1 overflow-y-auto px-3 pb-8">
          <OptionRow
            icon="🌐"
            label="Любой"
            active={!selectedId}
            onClick={() => {
              haptics.select();
              onSelect(undefined);
              onClose();
            }}
          />

          {filtered.map((opt) => (
            <OptionRow
              key={opt.id}
              icon={opt.icon ?? opt.label[0]}
              iconNode={opt.iconNode}
              label={opt.label}
              accent={opt.accent}
              active={opt.id === selectedId}
              onClick={() => {
                haptics.select();
                onSelect(opt.id);
                onClose();
              }}
            />
          ))}
          {filtered.length === 0 && <p className="mt-4 text-center text-sm text-white/40">Ничего не найдено</p>}
        </div>
      </div>
    </div>
  );
}

function OptionRow({
  icon,
  iconNode,
  label,
  accent,
  active,
  onClick,
}: {
  icon: string;
  iconNode?: ReactNode;
  label: string;
  accent?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="mb-1.5 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition active:scale-[0.97]"
      style={{
        background: active
          ? "linear-gradient(135deg, rgba(255,209,102,0.18), rgba(255,209,102,0.06))"
          : "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
        boxShadow: active ? "inset 0 0 0 1px rgba(255,209,102,0.4)" : "inset 0 0 0 1px rgba(255,255,255,0.06)",
      }}
    >
      {iconNode ? (
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
          style={{ border: `1.5px solid ${active ? "#ffd166" : "rgba(255,255,255,0.15)"}` }}
        >
          {iconNode}
        </span>
      ) : (
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
          style={{
            background: accent ?? (active ? "rgba(255,209,102,0.22)" : "rgba(255,255,255,0.08)"),
            border: `1.5px solid ${active ? "#ffd166" : "rgba(255,255,255,0.15)"}`,
          }}
        >
          {icon}
        </span>
      )}
      <span className={`text-sm font-medium ${active ? "text-gold" : "text-white/85"}`}>{label}</span>
    </button>
  );
}
