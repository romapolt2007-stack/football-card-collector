/** Акцентные цвета «патчей сообщества» — зеркалит backend/src/lib/cosmeticPatches.ts, для синхронного применения в UI без лишнего запроса. */
export const PATCH_ACCENT_COLORS: Record<string, string> = {
  neon_pulse: "#5ad1ff",
  crimson_ultras: "#ff3b5c",
  emerald_dynasty: "#34d399",
  royal_violet: "#b24bf3",
};

export const DEFAULT_ACCENT_COLOR = "#ffd166";

export function accentColorFor(patchId: string | null | undefined): string {
  return (patchId && PATCH_ACCENT_COLORS[patchId]) || DEFAULT_ACCENT_COLOR;
}
