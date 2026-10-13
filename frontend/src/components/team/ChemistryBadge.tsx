import { chemistryColor } from "../../lib/chemistry";

interface Props {
  value: number;
}

/** Голографический кристалл-счётчик химии состава (вместо плоской плашки). */
export function ChemistryBadge({ value }: Props) {
  const color = chemistryColor(value);

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-white/50">Химия</span>
      <div className="relative flex h-7 w-7 items-center justify-center">
        <div
          className="chem-crystal-glow chem-crystal absolute inset-0"
          style={{
            background: `linear-gradient(160deg, ${color}, ${color}66 60%, ${color}22)`,
            boxShadow: `0 0 10px ${color}99`,
          }}
        />
        <span className="relative text-[11px] font-extrabold text-pitch-dark">{value}</span>
      </div>
    </div>
  );
}
