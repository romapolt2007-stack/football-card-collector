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
            className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-extrabold tracking-wide transition-colors"
            style={{
              borderColor: isActive ? "rgba(255,209,102,0.85)" : "rgba(255,255,255,0.14)",
              background: isActive
                ? "linear-gradient(160deg, rgba(255,209,102,0.18), rgba(255,209,102,0.04))"
                : "linear-gradient(160deg, rgba(0,0,0,0.3), rgba(0,0,0,0.5))",
              boxShadow: isActive
                ? "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 12px rgba(255,209,102,0.3)"
                : "inset 0 2px 4px rgba(0,0,0,0.5)",
            }}
          >
            <span
              style={{
                backgroundImage: isActive
                  ? "linear-gradient(180deg, #fff6d8 0%, #ffd166 45%, #c98a1f 100%)"
                  : "linear-gradient(180deg, #f3f4f7 0%, #c7cbd3 45%, #8a8f99 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                WebkitTextFillColor: "transparent",
                textShadow: isActive ? "0 1px 1px rgba(0,0,0,0.3)" : "0 1px 1px rgba(0,0,0,0.4)",
              }}
            >
              {f}
            </span>
          </button>
        );
      })}
    </div>
  );
}
