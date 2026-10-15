import { useState } from "react";
import { haptics } from "../../lib/telegram";

export interface FilterOption {
  id: string;
  label: string;
  icon?: string;
  accent?: string;
}

interface Props {
  title: string;
  options: FilterOption[];
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
  onClose: () => void;
}

/** Нижний лист выбора фильтра — тот же паттерн, что выбор региона в «Номерке», но свой визуал. */
export function FilterPicker({ title, options, selectedId, onSelect, onClose }: Props) {
  const [search, setSearch] = useState("");
  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/80" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[75vh] w-full max-w-md flex-col rounded-t-3xl border-t border-white/10 bg-pitch-violet"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <p className="text-sm font-bold">{title}</p>
          <button onClick={onClose} className="text-sm text-white/50">
            Закрыть
          </button>
        </div>

        <div className="px-5 pb-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск..."
            className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none placeholder:text-white/40"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-8">
          <button
            onClick={() => {
              haptics.select();
              onSelect(undefined);
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left"
            style={{ background: !selectedId ? "rgba(255,209,102,0.12)" : "transparent" }}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2"
              style={{ borderColor: !selectedId ? "#ffd166" : "rgba(255,255,255,0.15)" }}
            >
              🌐
            </span>
            <span className={`text-sm font-semibold ${!selectedId ? "text-gold" : "text-white/80"}`}>Любой</span>
          </button>

          {filtered.map((opt) => {
            const active = opt.id === selectedId;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  haptics.select();
                  onSelect(opt.id);
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left"
                style={{ background: active ? "rgba(255,209,102,0.12)" : "transparent" }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm"
                  style={{ borderColor: active ? "#ffd166" : "rgba(255,255,255,0.15)", background: opt.accent }}
                >
                  {opt.icon ?? opt.label[0]}
                </span>
                <span className={`text-sm font-semibold ${active ? "text-gold" : "text-white/80"}`}>{opt.label}</span>
              </button>
            );
          })}
          {filtered.length === 0 && <p className="mt-4 text-center text-sm text-white/40">Ничего не найдено</p>}
        </div>
      </div>
    </div>
  );
}
