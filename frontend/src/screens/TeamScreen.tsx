import type { PanInfo } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { BenchRow } from "../components/team/BenchRow";
import { CardPicker } from "../components/team/CardPicker";
import { ChemistryBadge } from "../components/team/ChemistryBadge";
import { FormationPicker } from "../components/team/FormationPicker";
import { PitchView } from "../components/team/PitchView";
import { calcChemistry } from "../lib/chemistry";
import { BENCH_SLOT_IDS, emptySlotsFor, FORMATIONS } from "../lib/formations";
import { useInventory, useSquads, useCreateSquad, useUpdateSquad } from "../lib/queries";
import { haptics } from "../lib/telegram";
import { sfx } from "../lib/sfx";
import type { Card, Formation, SquadSlot } from "../types/game";

const FORMATION_OPTIONS: Formation[] = ["4-4-2", "4-3-3", "3-5-2", "4-2-3-1", "5-3-2"];

export function TeamScreen() {
  const { data: squads, isLoading: squadsLoading } = useSquads();
  const { data: inventory } = useInventory();
  const createSquad = useCreateSquad();
  const updateSquad = useUpdateSquad();

  const activeSquad = useMemo(() => squads?.find((s) => s.isActive) ?? squads?.[0], [squads]);

  const [formation, setFormation] = useState<Formation>("4-4-2");
  const [slots, setSlots] = useState<SquadSlot[]>(emptySlotsFor("4-4-2"));
  const [pickerSlot, setPickerSlot] = useState<string | null>(null);

  useEffect(() => {
    if (activeSquad) {
      setFormation(activeSquad.formation);
      setSlots(activeSquad.slots);
    }
  }, [activeSquad?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const slotRefs = useRef<Record<string, HTMLDivElement | null>>({});
  function registerRef(slotId: string, el: HTMLDivElement | null) {
    slotRefs.current[slotId] = el;
  }

  const cardById = useMemo(() => {
    const map = new Map<string, Card>();
    inventory?.forEach((c) => map.set(c.id, c));
    return map;
  }, [inventory]);

  const cardsBySlot = useMemo(() => {
    const map: Record<string, Card | null> = {};
    slots.forEach((s) => {
      map[s.slotId] = s.cardId ? (cardById.get(s.cardId) ?? null) : null;
    });
    return map;
  }, [slots, cardById]);

  const placedCardIds = useMemo(() => new Set(slots.map((s) => s.cardId).filter(Boolean)), [slots]);
  const availableCards = useMemo(
    () => (inventory ?? []).filter((c) => !placedCardIds.has(c.id) && !c.isListed),
    [inventory, placedCardIds],
  );

  const starters = FORMATIONS[formation].map((s) => cardsBySlot[s.id] ?? null);
  const chemistry = calcChemistry(starters);

  function persist(nextSlots: SquadSlot[], nextFormation = formation) {
    setSlots(nextSlots);
    if (activeSquad) {
      updateSquad.mutate({ id: activeSquad.id, slots: nextSlots, formation: nextFormation });
    }
  }

  /** map+upsert: если слота ещё нет в массиве (старые/неполные данные), добавляем его. */
  function setSlotCard(currentSlots: SquadSlot[], slotId: string, cardId: string | null): SquadSlot[] {
    const exists = currentSlots.some((s) => s.slotId === slotId);
    if (!exists) return [...currentSlots, { slotId, cardId }];
    return currentSlots.map((s) => (s.slotId === slotId ? { ...s, cardId } : s));
  }

  function assignCard(slotId: string, card: Card) {
    persist(setSlotCard(slots, slotId, card.id));
    haptics.select();
    setPickerSlot(null);
  }

  function removeCard(slotId: string) {
    persist(setSlotCard(slots, slotId, null));
    setPickerSlot(null);
  }

  function handleDragEnd(originSlotId: string, info: PanInfo) {
    const target = Object.entries(slotRefs.current).find(([id, el]) => {
      if (!el || id === originSlotId) return false;
      const rect = el.getBoundingClientRect();
      return (
        info.point.x >= rect.left &&
        info.point.x <= rect.right &&
        info.point.y >= rect.top &&
        info.point.y <= rect.bottom
      );
    });
    if (!target) return;
    const targetSlotId = target[0];

    const originCardId = slots.find((s) => s.slotId === originSlotId)?.cardId ?? null;
    const targetCardId = slots.find((s) => s.slotId === targetSlotId)?.cardId ?? null;

    const next = setSlotCard(setSlotCard(slots, originSlotId, targetCardId), targetSlotId, originCardId);
    persist(next);
    haptics.impact("medium");
  }

  function handleFormationChange(next: Formation) {
    if (next === formation) return;
    sfx.whoosh();
    haptics.impact("medium");
    setFormation(next);
    // переносим уже расставленных игроков в новые слоты по возможности, лишних — на скамейку
    const oldStarterCards = FORMATIONS[formation]
      .map((s) => cardsBySlot[s.id])
      .filter((c): c is Card => Boolean(c));
    const benchCards = BENCH_SLOT_IDS.map((id) => cardsBySlot[id]).filter((c): c is Card => Boolean(c));
    const allPlaced = [...oldStarterCards, ...benchCards];

    const newSlots = emptySlotsFor(next);
    allPlaced.slice(0, FORMATIONS[next].length).forEach((card, i) => {
      newSlots[i].cardId = card.id;
    });
    allPlaced.slice(FORMATIONS[next].length, FORMATIONS[next].length + BENCH_SLOT_IDS.length).forEach((card, i) => {
      newSlots[FORMATIONS[next].length + i].cardId = card.id;
    });

    persist(newSlots, next);
  }

  if (squadsLoading) {
    return <p className="p-6 text-center text-sm text-white/50">Загрузка...</p>;
  }

  if (!activeSquad) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-white/60">У вас пока нет состава</p>
        <button
          onClick={() => createSquad.mutate({ formation: "4-4-2", slots: emptySlotsFor("4-4-2") })}
          disabled={createSquad.isPending}
          className="rounded-full bg-gold px-6 py-3 text-sm font-extrabold text-pitch-dark"
        >
          Создать состав
        </button>
      </div>
    );
  }

  const pickerSlotDef = pickerSlot ? FORMATIONS[formation].find((s) => s.id === pickerSlot) : undefined;

  return (
    <div className="flex min-h-dvh flex-col gap-4 px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-28">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold">Состав</h1>
        <ChemistryBadge value={chemistry} />
      </header>

      <FormationPicker options={FORMATION_OPTIONS} active={formation} onChange={handleFormationChange} />

      <PitchView
        formation={formation}
        cardsBySlot={cardsBySlot}
        registerRef={registerRef}
        onTapEmpty={(slotId) => setPickerSlot(slotId)}
        onTapCard={(slotId) => setPickerSlot(slotId)}
        onDragEnd={handleDragEnd}
      />

      <BenchRow
        cardsBySlot={cardsBySlot}
        registerRef={registerRef}
        onTapEmpty={(slotId) => setPickerSlot(slotId)}
        onTapCard={(slotId) => setPickerSlot(slotId)}
        onDragEnd={handleDragEnd}
      />

      {pickerSlot && (
        <CardPicker
          cards={availableCards}
          slotEligible={pickerSlotDef?.eligible ?? []}
          onPick={(card) => assignCard(pickerSlot, card)}
          onRemove={cardsBySlot[pickerSlot] ? () => removeCard(pickerSlot) : undefined}
          onClose={() => setPickerSlot(null)}
        />
      )}
    </div>
  );
}
