import { useMemo, useState } from "react";
import { CardDetailModal } from "../components/cards/CardDetailModal";
import { RarityCard } from "../components/cards/RarityCard";
import { RarityFilterChip } from "../components/cards/RarityFilterChip";
import { RARITY_THEME } from "../components/cards/rarityTheme";
import { SpecialEditionShowcase } from "../components/cards/SpecialEditionShowcase";
import { CoinBalance } from "../components/common/CoinBalance";
import { CrackedBinIcon } from "../components/common/CrackedBinIcon";
import { GoldCoinIcon } from "../components/common/GoldCoinIcon";
import { useInventory, useQuickSell, useQuickSellBulk } from "../lib/queries";
import { haptics } from "../lib/telegram";
import { useAuthStore } from "../store/useAuthStore";
import type { Card, Rarity } from "../types/game";

const RARITIES: Rarity[] = ["BRONZE", "SILVER", "GOLD", "LEGEND", "ICON"];

interface Props {
  onNavigateToTeam: () => void;
}

export function InventoryScreen({ onNavigateToTeam }: Props) {
  const { data: cards, isLoading } = useInventory();
  const user = useAuthStore((s) => s.user);
  const quickSell = useQuickSell();
  const bulkSell = useQuickSellBulk();
  const [search, setSearch] = useState("");
  const [rarityFilter, setRarityFilter] = useState<Rarity | null>(null);
  const [viewing, setViewing] = useState<Card | null>(null);
  const [confirming, setConfirming] = useState<Card | null>(null);
  const [confirmingBulk, setConfirmingBulk] = useState(false);

  const filtered = useMemo(() => {
    return (cards ?? [])
      .filter((c) => !search || c.player.name.toLowerCase().includes(search.toLowerCase()))
      .filter((c) => !rarityFilter || c.rarity === rarityFilter)
      .sort((a, b) => b.player.overall - a.player.overall);
  }, [cards, search, rarityFilter]);

  const totalValue = useMemo(() => (cards ?? []).reduce((sum, c) => sum + c.quickSellPrice, 0), [cards]);

  const junkCards = useMemo(
    () => (cards ?? []).filter((c) => (c.rarity === "BRONZE" || c.rarity === "SILVER") && !c.isListed),
    [cards],
  );
  const junkValue = useMemo(() => junkCards.reduce((sum, c) => sum + c.quickSellPrice, 0), [junkCards]);

  function confirmSell() {
    if (!confirming) return;
    haptics.notify("success");
    quickSell.mutate(confirming.id);
    setConfirming(null);
    setViewing(null);
  }

  function confirmBulkSell() {
    haptics.notify("success");
    bulkSell.mutate(junkCards.map((c) => c.id));
    setConfirmingBulk(false);
  }

  return (
    <div className="velvet-texture flex min-h-dvh flex-col gap-4 px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-28">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold">🗂️ Инвентарь</h1>
        <CoinBalance coins={user?.coins ?? 0} />
      </header>

      <SpecialEditionShowcase cards={cards ?? []} />

      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <div>
          <p className="text-xs text-white/50">{cards?.length ?? 0} карт</p>
          <p className="flex items-center gap-1.5 text-xl font-extrabold">
            <GoldCoinIcon size={20} />
            <span className="shine-text-gold">{totalValue.toLocaleString("ru-RU")}</span>
          </p>
          <p className="text-[10px] text-white/40">Общая стоимость коллекции</p>
        </div>
        {junkCards.length > 0 && (
          <button
            onClick={() => setConfirmingBulk(true)}
            className="spin-button-texture relative flex shrink-0 items-center gap-1.5 overflow-hidden rounded-full px-3 py-2 text-xs font-bold text-white"
            style={{
              background: "linear-gradient(160deg, #c23a4a 0%, #7a1322 55%, #450a12 100%)",
              boxShadow: "0 0 10px rgba(194,58,74,0.45), inset 0 1px 0 rgba(255,255,255,0.12)",
            }}
          >
            <CrackedBinIcon size={15} />
            Продать мусор ({junkCards.length})
          </button>
        )}
      </div>

      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.2" y2="16.2" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени..."
          className="metal-input w-full rounded-lg border border-white/15 py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/40"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <RarityFilterChip
          active={!rarityFilter}
          label="Все"
          background="linear-gradient(160deg, #fff1c2 0%, #e3a825 50%, #8a5a06 100%)"
          borderColor="#ffd166"
          onClick={() => {
            haptics.select();
            setRarityFilter(null);
          }}
        />
        {RARITIES.map((r) => (
          <RarityFilterChip
            key={r}
            active={rarityFilter === r}
            label={RARITY_THEME[r].label}
            background={RARITY_THEME[r].background}
            borderColor={RARITY_THEME[r].borderColor}
            onClick={() => {
              haptics.select();
              setRarityFilter((prev) => (prev === r ? null : r));
            }}
          />
        ))}
      </div>

      {isLoading && <p className="text-sm text-white/50">Загрузка...</p>}
      {!isLoading && filtered.length === 0 && (
        <p className="mt-6 text-center text-sm text-white/40">Карт не найдено</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((card) => (
          <RarityCard key={card.id} card={card} size="full" onClick={() => setViewing(card)} />
        ))}
      </div>

      <CardDetailModal
        card={viewing}
        onClose={() => setViewing(null)}
        onSell={(c) => setConfirming(c)}
        onAssign={onNavigateToTeam}
      />

      {confirming && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 px-6">
          <div className="w-full max-w-xs rounded-xl border border-white/15 bg-pitch-violet p-5 text-center">
            <p className="font-semibold">Продать {confirming.player.name}?</p>
            <p className="mt-1 text-sm text-white/60">
              Получите {confirming.quickSellPrice.toLocaleString("ru-RU")} 🪙. Карту нельзя будет вернуть.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirming(null)}
                className="flex-1 rounded-full border border-white/20 py-2.5 text-sm font-semibold"
              >
                Отмена
              </button>
              <button
                onClick={confirmSell}
                disabled={quickSell.isPending}
                className="flex-1 rounded-full bg-gold py-2.5 text-sm font-extrabold text-pitch-dark disabled:opacity-30"
              >
                Продать
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmingBulk && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 px-6">
          <div className="w-full max-w-xs rounded-xl border border-white/15 bg-pitch-violet p-5 text-center">
            <p className="font-semibold">Продать {junkCards.length} карт (бронза/серебро)?</p>
            <p className="mt-1 text-sm text-white/60">
              Получите {junkValue.toLocaleString("ru-RU")} 🪙. Карты нельзя будет вернуть.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirmingBulk(false)}
                className="flex-1 rounded-full border border-white/20 py-2.5 text-sm font-semibold"
              >
                Отмена
              </button>
              <button
                onClick={confirmBulkSell}
                disabled={bulkSell.isPending}
                className="flex-1 rounded-full bg-gold py-2.5 text-sm font-extrabold text-pitch-dark disabled:opacity-30"
              >
                Продать все
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
