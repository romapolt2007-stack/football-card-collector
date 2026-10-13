import type { Formation } from "../../types/game";

interface Props {
  options: Formation[];
  active: Formation;
  onChange: (f: Formation) => void;
}

export function FormationPicker({ options, active, onChange }: Props) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {options.map((f) => {
        const isActive = f === active;
        return (
          <button
            key={f}
            onClick={() => onChange(f)}
            className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{
              borderColor: isActive ? "rgba(255,209,102,0.8)" : "rgba(255,255,255,0.1)",
              color: isActive ? "#ffd166" : "rgba(255,255,255,0.5)",
              background: isActive
                ? "linear-gradient(160deg, rgba(255,209,102,0.16), rgba(255,209,102,0.04))"
                : "linear-gradient(160deg, rgba(0,0,0,0.3), rgba(0,0,0,0.5))",
              boxShadow: isActive
                ? "inset 0 1px 0 rgba(255,255,255,0.08), 0 0 10px rgba(255,209,102,0.25)"
                : "inset 0 2px 4px rgba(0,0,0,0.5)",
            }}
          >
            {f}
          </button>
        );
      })}
    </div>
  );
}
