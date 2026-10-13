import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";

interface SlotLike {
  slotId: string;
  cardId: string | null;
}

/** Убирает карту из всех составов владельца — вызывать перед продажей/выставлением на рынок. */
export async function clearCardFromSquads(userId: string, cardId: string) {
  const squads = await prisma.squad.findMany({ where: { userId } });
  for (const squad of squads) {
    const slots = squad.slots as unknown as SlotLike[];
    if (!slots.some((s) => s.cardId === cardId)) continue;
    const nextSlots = slots.map((s) => (s.cardId === cardId ? { ...s, cardId: null } : s));
    await prisma.squad.update({
      where: { id: squad.id },
      data: { slots: nextSlots as unknown as Prisma.InputJsonValue },
    });
  }
}
