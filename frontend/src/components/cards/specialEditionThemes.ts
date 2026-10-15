export interface SpecialEditionTheme {
  id: string;
  label: string;
  tag: string;
  background: string;
  borderColor: string;
  glow: string;
  textColor: string;
  patternClass: string;
}

/** Витрина премиальных «изданий» карты — визуальная галерея материалов, не влияет на редкость/экономику. */
export const SPECIAL_EDITIONS: SpecialEditionTheme[] = [
  {
    id: "ruby",
    label: "Рубиновое издание",
    tag: "RUBY",
    background: "linear-gradient(160deg, #7a1322 0%, #450a12 55%, #230509 100%)",
    borderColor: "#d9d9df",
    glow: "0 0 26px rgba(217,40,61,0.5)",
    textColor: "#fff2f2",
    patternClass: "holo-sweep",
  },
  {
    id: "filigree-gold",
    label: "Золотая гравировка",
    tag: "GOLD",
    background: "linear-gradient(160deg, #8a6a1e 0%, #5c4512 55%, #2e2208 100%)",
    borderColor: "#f1cf7a",
    glow: "0 0 26px rgba(241,207,122,0.45)",
    textColor: "#fff6da",
    patternClass: "filigree-texture",
  },
  {
    id: "sapphire",
    label: "Сапфировая серия",
    tag: "TOTY",
    background: "linear-gradient(160deg, #163a7a 0%, #0c224a 55%, #06122a 100%)",
    borderColor: "#cfd9ea",
    glow: "0 0 26px rgba(79,140,255,0.5)",
    textColor: "#eef3ff",
    patternClass: "crystal-texture",
  },
  {
    id: "emerald",
    label: "Изумрудная волна",
    tag: "DYNAMIC",
    background: "linear-gradient(160deg, #15704a 0%, #0b4530 55%, #052118 100%)",
    borderColor: "#cd7f32",
    glow: "0 0 26px rgba(40,200,130,0.4)",
    textColor: "#eafff2",
    patternClass: "wave-texture",
  },
  {
    id: "amethyst",
    label: "Королевский аметист",
    tag: "ROYAL",
    background: "linear-gradient(160deg, #5a1f8a 0%, #370f5c 55%, #1c0730 100%)",
    borderColor: "#e3c56a",
    glow: "0 0 26px rgba(178,75,243,0.5)",
    textColor: "#f8ecff",
    patternClass: "filigree-texture",
  },
  {
    id: "obsidian",
    label: "Чёрное издание",
    tag: "BLACK",
    background: "linear-gradient(160deg, #1c1c1f 0%, #0a0a0b 55%, #000000 100%)",
    borderColor: "#e0a78a",
    glow: "0 0 26px rgba(224,167,138,0.35)",
    textColor: "#fdf1ea",
    patternClass: "carbon-texture",
  },
];

const EDITION_BY_ID: Record<string, SpecialEditionTheme> = Object.fromEntries(SPECIAL_EDITIONS.map((e) => [e.id, e]));

/** Тема издания по id карты (card.specialEdition) — undefined, если карта обычная. */
export function editionById(id: string | null | undefined): SpecialEditionTheme | undefined {
  return id ? EDITION_BY_ID[id] : undefined;
}
