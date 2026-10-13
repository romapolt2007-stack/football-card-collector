import type { Formation, Position } from "../types/game";

export interface FormationSlot {
  id: string;
  label: string;
  /** Позиции, для которых слот считается "родным" — влияет на подсказки в пикере */
  eligible: Position[];
  /** Проценты от размера поля: x слева направо, y сверху (атака) вниз (вратарь) */
  x: number;
  y: number;
}

export const FORMATIONS: Record<Formation, FormationSlot[]> = {
  "4-4-2": [
    { id: "GK", label: "ВР", eligible: ["GK"], x: 50, y: 92 },
    { id: "LB", label: "ЛЗ", eligible: ["LB"], x: 13, y: 74 },
    { id: "CB1", label: "ЦЗ", eligible: ["CB"], x: 37, y: 74 },
    { id: "CB2", label: "ЦЗ", eligible: ["CB"], x: 63, y: 74 },
    { id: "RB", label: "ПЗ", eligible: ["RB"], x: 87, y: 74 },
    { id: "LM", label: "ЛП", eligible: ["LW", "CM"], x: 13, y: 46 },
    { id: "CM1", label: "ЦП", eligible: ["CM"], x: 37, y: 46 },
    { id: "CM2", label: "ЦП", eligible: ["CM"], x: 63, y: 46 },
    { id: "RM", label: "ПП", eligible: ["RW", "CM"], x: 87, y: 46 },
    { id: "ST1", label: "ЦН", eligible: ["ST", "CF"], x: 38, y: 16 },
    { id: "ST2", label: "ЦН", eligible: ["ST", "CF"], x: 62, y: 16 },
  ],
  "4-3-3": [
    { id: "GK", label: "ВР", eligible: ["GK"], x: 50, y: 92 },
    { id: "LB", label: "ЛЗ", eligible: ["LB"], x: 13, y: 74 },
    { id: "CB1", label: "ЦЗ", eligible: ["CB"], x: 37, y: 74 },
    { id: "CB2", label: "ЦЗ", eligible: ["CB"], x: 63, y: 74 },
    { id: "RB", label: "ПЗ", eligible: ["RB"], x: 87, y: 74 },
    { id: "CM1", label: "ЦП", eligible: ["CM"], x: 30, y: 50 },
    { id: "CDM", label: "ОПЗ", eligible: ["CDM"], x: 50, y: 56 },
    { id: "CM2", label: "ЦП", eligible: ["CM"], x: 70, y: 50 },
    { id: "LW", label: "ЛП", eligible: ["LW"], x: 15, y: 18 },
    { id: "ST", label: "ЦН", eligible: ["ST", "CF"], x: 50, y: 14 },
    { id: "RW", label: "ПП", eligible: ["RW"], x: 85, y: 18 },
  ],
  "3-5-2": [
    { id: "GK", label: "ВР", eligible: ["GK"], x: 50, y: 92 },
    { id: "CB1", label: "ЦЗ", eligible: ["CB"], x: 28, y: 76 },
    { id: "CB2", label: "ЦЗ", eligible: ["CB"], x: 50, y: 76 },
    { id: "CB3", label: "ЦЗ", eligible: ["CB"], x: 72, y: 76 },
    { id: "LM", label: "ЛП", eligible: ["LW", "LB"], x: 8, y: 48 },
    { id: "CM1", label: "ЦП", eligible: ["CM"], x: 33, y: 50 },
    { id: "CDM", label: "ОПЗ", eligible: ["CDM"], x: 50, y: 56 },
    { id: "CM2", label: "ЦП", eligible: ["CM"], x: 67, y: 50 },
    { id: "RM", label: "ПП", eligible: ["RW", "RB"], x: 92, y: 48 },
    { id: "ST1", label: "ЦН", eligible: ["ST", "CF"], x: 38, y: 16 },
    { id: "ST2", label: "ЦН", eligible: ["ST", "CF"], x: 62, y: 16 },
  ],
  "4-2-3-1": [
    { id: "GK", label: "ВР", eligible: ["GK"], x: 50, y: 92 },
    { id: "LB", label: "ЛЗ", eligible: ["LB"], x: 13, y: 74 },
    { id: "CB1", label: "ЦЗ", eligible: ["CB"], x: 37, y: 74 },
    { id: "CB2", label: "ЦЗ", eligible: ["CB"], x: 63, y: 74 },
    { id: "RB", label: "ПЗ", eligible: ["RB"], x: 87, y: 74 },
    { id: "CDM1", label: "ОПЗ", eligible: ["CDM"], x: 35, y: 58 },
    { id: "CDM2", label: "ОПЗ", eligible: ["CDM"], x: 65, y: 58 },
    { id: "LW", label: "ЛП", eligible: ["LW"], x: 15, y: 32 },
    { id: "CAM", label: "АПЗ", eligible: ["CAM"], x: 50, y: 32 },
    { id: "RW", label: "ПП", eligible: ["RW"], x: 85, y: 32 },
    { id: "ST", label: "ЦН", eligible: ["ST", "CF"], x: 50, y: 14 },
  ],
  "5-3-2": [
    { id: "GK", label: "ВР", eligible: ["GK"], x: 50, y: 92 },
    { id: "LB", label: "ЛЗ", eligible: ["LB"], x: 10, y: 75 },
    { id: "CB1", label: "ЦЗ", eligible: ["CB"], x: 30, y: 75 },
    { id: "CB2", label: "ЦЗ", eligible: ["CB"], x: 50, y: 75 },
    { id: "CB3", label: "ЦЗ", eligible: ["CB"], x: 70, y: 75 },
    { id: "RB", label: "ПЗ", eligible: ["RB"], x: 90, y: 75 },
    { id: "CM1", label: "ЦП", eligible: ["CM"], x: 30, y: 49 },
    { id: "CM2", label: "ЦП", eligible: ["CM"], x: 50, y: 49 },
    { id: "CM3", label: "ЦП", eligible: ["CM"], x: 70, y: 49 },
    { id: "ST1", label: "ЦН", eligible: ["ST", "CF"], x: 38, y: 16 },
    { id: "ST2", label: "ЦН", eligible: ["ST", "CF"], x: 62, y: 16 },
  ],
};

export const BENCH_SIZE = 7;
export const BENCH_SLOT_IDS = Array.from({ length: BENCH_SIZE }, (_, i) => `BENCH${i + 1}`);

export function emptySlotsFor(formation: Formation): { slotId: string; cardId: string | null }[] {
  return [
    ...FORMATIONS[formation].map((s) => ({ slotId: s.id, cardId: null })),
    ...BENCH_SLOT_IDS.map((id) => ({ slotId: id, cardId: null })),
  ];
}
