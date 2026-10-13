import type { Position } from "../types/game";

/**
 * Русские обозначения амплуа и статов — данные в базе/enum'ах остаются
 * английскими (Position и т.д., менять их — риск миграции и поломки
 * фильтров), здесь только слой отображения.
 */
export const POSITION_RU: Record<Position, string> = {
  GK: "ВР",
  CB: "ЦЗ",
  LB: "ЛЗ",
  RB: "ПЗ",
  CDM: "ОПЗ",
  CM: "ЦП",
  CAM: "АПЗ",
  LW: "ЛП",
  RW: "ПП",
  ST: "ЦН",
  CF: "ФРВ",
};

export const POSITION_FULL_RU: Record<Position, string> = {
  GK: "Вратарь",
  CB: "Центральный защитник",
  LB: "Левый защитник",
  RB: "Правый защитник",
  CDM: "Опорный полузащитник",
  CM: "Центральный полузащитник",
  CAM: "Атакующий полузащитник",
  LW: "Левый полузащитник",
  RW: "Правый полузащитник",
  ST: "Нападающий",
  CF: "Форвард",
};

export const STAT_LABELS_RU = [
  ["ТЕМ", "pace"],
  ["ДРБ", "dribbling"],
  ["УДР", "shooting"],
  ["ЗАЩ", "defending"],
  ["ПАС", "passing"],
  ["ФИЗ", "physical"],
] as const;

export const FOOT_RU: Record<"LEFT" | "RIGHT", string> = {
  LEFT: "Левая",
  RIGHT: "Правая",
};
