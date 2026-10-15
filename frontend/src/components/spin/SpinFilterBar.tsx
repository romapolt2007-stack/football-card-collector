import { useMemo, useState } from "react";
import { FilterPicker, type FilterOption } from "./FilterPicker";
import { useLeagues, useNations } from "../../lib/useMeta";
import { haptics } from "../../lib/telegram";
import type { SpinFilters } from "../../types/game";

interface Props {
  filters: SpinFilters;
  onChange: (filters: SpinFilters) => void;
}

type ActiveSheet = "league" | "club" | "nation" | null;

export function SpinFilterBar({ filters, onChange }: Props) {
  const { data: leagues } = useLeagues();
  const { data: nations } = useNations();
  const [sheet, setSheet] = useState<ActiveSheet>(null);

  const leagueOptions: FilterOption[] = useMemo(
    () => (leagues ?? []).map((l) => ({ id: l.id, label: l.name, icon: "🏆" })),
    [leagues],
  );

  const selectedLeague = leagues?.find((l) => l.id === filters.leagueId);
  const clubOptions: FilterOption[] = useMemo(() => {
    const pool = filters.leagueId ? (selectedLeague?.clubs ?? []) : (leagues ?? []).flatMap((l) => l.clubs);
    return pool.map((c) => ({ id: c.id, label: c.name, icon: c.shortName.slice(0, 2), accent: c.colorPrimary }));
  }, [filters.leagueId, selectedLeague, leagues]);

  const nationOptions: FilterOption[] = useMemo(
    () => (nations ?? []).map((n) => ({ id: n.nation, label: n.nation, icon: n.flag })),
    [nations],
  );

  const selectedClub = clubOptions.find((c) => c.id === filters.clubId);
  const selectedNation = nationOptions.find((n) => n.id === filters.nation);

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterPill
          label="Лига"
          value={selectedLeague?.name}
          onClick={() => {
            haptics.select();
            setSheet("league");
          }}
        />
        <FilterPill
          label="Клуб"
          value={selectedClub?.label}
          onClick={() => {
            haptics.select();
            setSheet("club");
          }}
        />
        <FilterPill
          label="Страна"
          value={selectedNation?.label}
          onClick={() => {
            haptics.select();
            setSheet("nation");
          }}
        />
      </div>

      {sheet === "league" && (
        <FilterPicker
          title="Выбрать лигу"
          options={leagueOptions}
          selectedId={filters.leagueId}
          onSelect={(id) => onChange({ ...filters, leagueId: id, clubId: undefined })}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === "club" && (
        <FilterPicker
          title="Выбрать клуб"
          options={clubOptions}
          selectedId={filters.clubId}
          onSelect={(id) => onChange({ ...filters, clubId: id })}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === "nation" && (
        <FilterPicker
          title="Выбрать страну"
          options={nationOptions}
          selectedId={filters.nation}
          onSelect={(id) => onChange({ ...filters, nation: id })}
          onClose={() => setSheet(null)}
        />
      )}
    </>
  );
}

function FilterPill({ label, value, onClick }: { label: string; value?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex shrink-0 flex-col items-start rounded-xl border px-3 py-1.5 text-left"
      style={{
        borderColor: value ? "rgba(255,209,102,0.5)" : "rgba(255,255,255,0.15)",
        background: value ? "rgba(255,209,102,0.1)" : "rgba(255,255,255,0.04)",
      }}
    >
      <span className="text-[9px] uppercase tracking-wide text-white/40">{label}</span>
      <span className={`max-w-[110px] truncate text-xs font-bold ${value ? "text-gold" : "text-white/60"}`}>
        {value ?? "Любой"}
      </span>
    </button>
  );
}
