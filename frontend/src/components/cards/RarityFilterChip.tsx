interface Props {
  active: boolean;
  label: string;
  background: string;
  borderColor: string;
  onClick: () => void;
}

/** Фильтр редкости в виде миниатюрной текстурированной карточки вместо плоской пилюли. */
export function RarityFilterChip({ active, label, background, borderColor, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="relative flex h-14 w-11 shrink-0 flex-col items-center justify-end overflow-hidden rounded-md border-2 pb-1 transition-transform"
      style={{
        background,
        borderColor: active ? borderColor : "rgba(255,255,255,0.14)",
        boxShadow: active ? `0 0 10px ${borderColor}99` : "none",
        opacity: active ? 1 : 0.5,
        transform: active ? "scale(1.05)" : "scale(1)",
      }}
    >
      <div className="foil-texture pointer-events-none absolute inset-0" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 30%)" }}
      />
      <span
        className="relative px-0.5 text-center text-[8.5px] font-extrabold leading-tight text-white"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.65)" }}
      >
        {label}
      </span>
    </button>
  );
}
