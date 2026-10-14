export type HairStyle = "short" | "wavy" | "afro";

export interface NationLook {
  skinFrom: string;
  skinTo: string;
  hairColor: string;
  hairStyle: HairStyle;
}

/** Внешность портрета (тон кожи + причёска) по нации игрока — для визуального разнообразия карточек. */
export const NATION_LOOKS: Record<string, NationLook> = {
  Англия: { skinFrom: "#f3cba0", skinTo: "#c99a6e", hairColor: "#3b2a1a", hairStyle: "short" },
  Бразилия: { skinFrom: "#d9a066", skinTo: "#a36a35", hairColor: "#1a1410", hairStyle: "wavy" },
  Франция: { skinFrom: "#f0c49a", skinTo: "#c2906a", hairColor: "#3b2a1a", hairStyle: "short" },
  Германия: { skinFrom: "#f5d0ab", skinTo: "#cf9f73", hairColor: "#c9a227", hairStyle: "short" },
  Аргентина: { skinFrom: "#e8b88a", skinTo: "#b8814f", hairColor: "#241a10", hairStyle: "wavy" },
  Испания: { skinFrom: "#e8b88a", skinTo: "#b8814f", hairColor: "#1a1410", hairStyle: "short" },
  Португалия: { skinFrom: "#e8b88a", skinTo: "#b8814f", hairColor: "#3b2a1a", hairStyle: "wavy" },
  Нидерланды: { skinFrom: "#f5d0ab", skinTo: "#cf9f73", hairColor: "#d4b483", hairStyle: "short" },
  Хорватия: { skinFrom: "#f0c49a", skinTo: "#c2906a", hairColor: "#3b2a1a", hairStyle: "short" },
  Нигерия: { skinFrom: "#8a5a35", skinTo: "#5c3a1e", hairColor: "#0d0a08", hairStyle: "afro" },
  Сенегал: { skinFrom: "#7a4a2a", skinTo: "#4a2e16", hairColor: "#0d0a08", hairStyle: "afro" },
  Япония: { skinFrom: "#e8c49a", skinTo: "#b8906a", hairColor: "#0d0a08", hairStyle: "short" },
};

export const DEFAULT_LOOK: NationLook = {
  skinFrom: "#f3cba0",
  skinTo: "#c99a6e",
  hairColor: "#241a10",
  hairStyle: "short",
};

export function lookForNation(nation: string | undefined): NationLook {
  return (nation && NATION_LOOKS[nation]) || DEFAULT_LOOK;
}
