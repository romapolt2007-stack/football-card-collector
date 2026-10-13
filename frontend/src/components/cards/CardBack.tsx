interface Props {
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES: Record<NonNullable<Props["size"]>, string> = {
  sm: "w-32",
  md: "w-44",
  lg: "w-60",
};

export function CardBack({ size = "md" }: Props) {
  return (
    <div
      className={`relative flex aspect-[3/4.2] shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/15 ${SIZE_CLASSES[size]}`}
      style={{
        background: "linear-gradient(155deg, var(--color-pitch-blue), var(--color-pitch-violet))",
      }}
    >
      <div className="absolute inset-3 rounded-xl border border-white/10" />
      <span className="text-3xl font-extrabold text-white/25">FCC</span>
    </div>
  );
}
