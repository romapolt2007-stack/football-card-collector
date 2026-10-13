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
    { id: "GK", label: "GK", eligible: ["GK"], x: 50, y: 92 },
    { id: "LB", label: "LB", eligible: ["LB"], x: 15, y: 72 },
    { id: "CB1", label: "CB", eligible: ["CB"], x: 37, y: 76 },
    { id: "CB2", label: "CB", eligible: ["CB"], x: 63, y: 76 },
    { id: "RB", label: "RB", eligible: ["RB"], x: 85, y: 72 },
    { id: "LM", label: "LM", eligible: ["LW", "CM"], x: 15, y: 45 },
    { id: "CM1", label: "CM", eligible: ["CM"], x: 37, y: 48 },
    { id: "CM2", label: "CM", eligible: ["CM"], x: 63, y: 48 },
    { id: "RM", label: "RM", eligible: ["RW", "CM"], x: 85, y: 45 },
    { id: "ST1", label: "ST", eligible: ["ST", "CF"], x: 38, y: 18 },
    { id: "ST2", label: "ST", eligible: ["ST", "CF"], x: 62, y: 18 },
  ],
  "4-3-3": [
    { id: "GK", label: "GK", eligible: ["GK"], x: 50, y: 92 },
    { id: "LB", label: "LB", eligible: ["LB"], x: 15, y: 72 },
    { id: "CB1", label: "CB", eligible: ["CB"], x: 37, y: 76 },
    { id: "CB2", label: "CB", eligible: ["CB"], x: 63, y: 76 },
    { id: "RB", label: "RB", eligible: ["RB"], x: 85, y: 72 },
    { id: "CM1", label: "CM", eligible: ["CM"], x: 30, y: 48 },
    { id: "CDM", label: "CDM", eligible: ["CDM"], x: 50, y: 54 },
    { id: "CM2", label: "CM", eligible: ["CM"], x: 70, y: 48 },
    { id: "LW", label: "LW", eligible: ["LW"], x: 15, y: 18 },
    { id: "ST", label: "ST", eligible: ["ST", "CF"], x: 50, y: 14 },
    { id: "RW", label: "RW", eligible: ["RW"], x: 85, y: 18 },
  ],
  "3-5-2": [
    { id: "GK", label: "GK", eligible: ["GK"], x: 50, y: 92 },
    { id: "CB1", label: "CB", eligible: ["CB"], x: 30, y: 76 },
    { id: "CB2", label: "CB", eligible: ["CB"], x: 50, y: 79 },
    { id: "CB3", label: "CB", eligible: ["CB"], x: 70, y: 76 },
    { id: "LM", label: "LM", eligible: ["LW", "LB"], x: 10, y: 48 },
    { id: "CM1", label: "CM", eligible: ["CM"], x: 33, y: 50 },
    { id: "CDM", label: "CDM", eligible: ["CDM"], x: 50, y: 55 },
    { id: "CM2", label: "CM", eligible: ["CM"], x: 67, y: 50 },
    { id: "RM", label: "RM", eligible: ["RW", "RB"], x: 90, y: 48 },
    { id: "ST1", label: "ST", eligible: ["ST", "CF"], x: 38, y: 18 },
    { id: "ST2", label: "ST", eligible: ["ST", "CF"], x: 62, y: 18 },
  ],
  "4-2-3-1": [
    { id: "GK", label: "GK", eligible: ["GK"], x: 50, y: 92 },
    { id: "LB", label: "LB", eligible: ["LB"], x: 15, y: 72 },
    { id: "CB1", label: "CB", eligible: ["CB"], x: 37, y: 76 },
    { id: "CB2", label: "CB", eligible: ["CB"], x: 63, y: 76 },
    { id: "RB", label: "RB", eligible: ["RB"], x: 85, y: 72 },
    { id: "CDM1", label: "CDM", eligible: ["CDM"], x: 37, y: 56 },
    { id: "CDM2", label: "CDM", eligible: ["CDM"], x: 63, y: 56 },
    { id: "LW", label: "LW", eligible: ["LW"], x: 15, y: 30 },
    { id: "CAM", label: "CAM", eligible: ["CAM"], x: 50, y: 32 },
    { id: "RW", label: "RW", eligible: ["RW"], x: 85, y: 30 },
    { id: "ST", label: "ST", eligible: ["ST", "CF"], x: 50, y: 14 },
  ],
  "5-3-2": [
    { id: "GK", label: "GK", eligible: ["GK"], x: 50, y: 92 },
    { id: "LB", label: "LB", eligible: ["LB"], x: 10, y: 70 },
    { id: "CB1", label: "CB", eligible: ["CB"], x: 30, y: 77 },
    { id: "CB2", label: "CB", eligible: ["CB"], x: 50, y: 79 },
    { id: "CB3", label: "CB", eligible: ["CB"], x: 70, y: 77 },
    { id: "RB", label: "RB", eligible: ["RB"], x: 90, y: 70 },
    { id: "CM1", label: "CM", eligible: ["CM"], x: 30, y: 48 },
    { id: "CM2", label: "CM", eligible: ["CM"], x: 50, y: 50 },
    { id: "CM3", label: "CM", eligible: ["CM"], x: 70, y: 48 },
    { id: "ST1", label: "ST", eligible: ["ST", "CF"], x: 38, y: 18 },
    { id: "ST2", label: "ST", eligible: ["ST", "CF"], x: 62, y: 18 },
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
