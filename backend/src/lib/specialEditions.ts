/**
 * Коллекционные издания — редкий косметический дроп из паков (другой материал/цвет
 * карты, та же редкость/статы игрока). Идентификаторы совпадают с
 * frontend/src/components/cards/specialEditionThemes.ts — держать в синхроне.
 */
export const SPECIAL_EDITION_IDS = ["ruby", "filigree-gold", "sapphire", "emerald", "amethyst", "obsidian"] as const;
export type SpecialEditionId = (typeof SPECIAL_EDITION_IDS)[number];

export const SPECIAL_EDITION_DROP_CHANCE = 0.04;
/** Коллекционная премия к цене продажи — издание не меняет overall/статы, только ценность на рынке. */
export const SPECIAL_EDITION_VALUE_MULTIPLIER = 1.5;

export function rollSpecialEdition(): SpecialEditionId | null {
  if (Math.random() >= SPECIAL_EDITION_DROP_CHANCE) return null;
  return SPECIAL_EDITION_IDS[Math.floor(Math.random() * SPECIAL_EDITION_IDS.length)];
}
