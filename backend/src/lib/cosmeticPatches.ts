/**
 * «Патчи сообщества» — чисто косметические темы интерфейса (акцентный цвет),
 * выдуманные моддерами и названиями, без реальных лиг/клубов/игроков.
 * Контент процедурный, как и всё остальное в проекте — не реальный импорт данных.
 */
export interface CosmeticPatchDef {
  id: string;
  title: string;
  author: string;
  sizeLabel: string;
  description: string;
  accentColor: string;
}

export const COSMETIC_PATCHES: CosmeticPatchDef[] = [
  {
    id: "neon_pulse",
    title: "Неоновый Пульс",
    author: "NeonForge_09",
    sizeLabel: "3.8 МБ",
    description: "Меняет акцентный цвет интерфейса на неоновый циан",
    accentColor: "#5ad1ff",
  },
  {
    id: "crimson_ultras",
    title: "Алый Ультрас",
    author: "UltrasWorkshop",
    sizeLabel: "2.9 МБ",
    description: "Меняет акцентный цвет интерфейса на насыщенный алый",
    accentColor: "#ff3b5c",
  },
  {
    id: "emerald_dynasty",
    title: "Изумрудная Династия",
    author: "GreenPitchMods",
    sizeLabel: "5.1 МБ",
    description: "Меняет акцентный цвет интерфейса на изумрудный",
    accentColor: "#34d399",
  },
  {
    id: "royal_violet",
    title: "Королевский Фиолет",
    author: "ChemistryLabs",
    sizeLabel: "4.4 МБ",
    description: "Меняет акцентный цвет интерфейса на королевский фиолет",
    accentColor: "#b24bf3",
  },
];

export function findCosmeticPatch(id: string): CosmeticPatchDef | undefined {
  return COSMETIC_PATCHES.find((p) => p.id === id);
}
