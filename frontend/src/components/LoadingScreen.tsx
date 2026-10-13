export function LoadingScreen({ label = "Загрузка..." }: { label?: string }) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-pitch-dark">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-gold" />
      <p className="text-sm text-white/50">{label}</p>
    </div>
  );
}
