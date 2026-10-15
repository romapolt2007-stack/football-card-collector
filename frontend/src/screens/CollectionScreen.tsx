import { useMemo, useState } from "react";
import { CardDetailModal } from "../components/cards/CardDetailModal";
import { RarityCard } from "../components/cards/RarityCard";
import { StadiumCardView } from "../components/cards/StadiumCardView";
import { RarityFilterChip } from "../components/cards/RarityFilterChip";
import { RARITY_THEME } from "../components/cards/rarityTheme";
import { CoinBalance } from "../components/common/CoinBalance";
import { CrackedBinIcon } from "../components/common/CrackedBinIcon";
import { GoldCoinIcon } from "../components/common/GoldCoinIcon";
import { PillTabs } from "../components/common/PillTabs";
import { CreateListingModal, type ListableItem } from "../components/market/CreateListingModal";
import { useInventory, useQuickSell, useQuickSellBulk, useStadiumCollection, useStadiumQuickSell } from "../lib/queries";
import { useMyListings } from "../lib/useMarket";
import { POSITION_RU } from "../lib/ruLabels";
import { haptics } from "../lib/telegram";
import { useAuthStore } from "../store/useAuthStore";
import type { Card, Rarity, StadiumCard } from "../types/game";

const RARITIES: Rarity[] = ["BRONZE", "SILVER", "GOLD", "LEGEND", "ICON"];

export function CollectionScreen() {
  const [kind, setKind] = useState<"players" | "stadiums">("players");
  const { data: cards, isLoading: cardsLoading } = useInventory();
  const { data: stadiumCards, isLoading: stadiumsLoading } = useStadiumCollection();
  const { data: myListings } = useMyListings();
  const user = useAuthStore((s) => s.user);
  const quickSell = useQuickSell();
  const stadiumQuickSell = useStadiumQuickSell();
  const bulkSell = useQuickSellBulk();

  const [search, setSearch] = useState("");
  const [rarityFilter, setRarityFilter] = useState<Rarity | null>(null);
  const [viewingCard, setViewingCard] = useState<Card | null>(null);
  const [viewingStadium, setViewingStadium] = useState<StadiumCard | null>(null);
  const [confirmingSell, setConfirmingSell] = useState<{ kind: "card" | "stadium"; id: string; label: string; price: number } | null>(null);
  const [confirmingBulk, setConfirmingBulk] = useState(false);
  const [listingContext, setListingContext] = useState<"players" | "stadiums" | null>(null);

  const filteredCards = useMemo(() => {
    return (cards ?? [])
      .filter((c) => !search || c.player.name.toLowerCase().includes(search.toLowerCase()))
      .filter((c) => !rarityFilter || c.rarity === rarityFilter)
      .sort((a, b) => b.player.overall - a.player.overall);
  }, [cards, search, rarityFilter]);

  const filteredStadiums = useMemo(() => {
    return (stadiumCards ?? [])
      .filter((s) => !search || s.stadium.name.toLowerCase().includes(search.toLowerCase()))
      .filter((s) => !rarityFilter || s.stadium.rarity === rarityFilter)
      .sort((a, b) => b.stadium.capacity - a.stadium.capacity);
  }, [stadiumCards, search, rarityFilter]);

  const totalValue = useMemo(
    () => (cards ?? []).reduce((sum, c) => sum + c.quickSellPrice, 0) + (stadiumCards ?? []).reduce((sum, s) => sum + s.quickSellPrice, 0),
    [cards, stadiumCards],
  );

  const junkCards = useMemo(
    () => (cards ?? []).filter((c) => (c.rarity === "BRONZE" || c.rarity === "SILVER") && !c.isListed),
    [cards],
  );
  const junkValue = useMemo(() => junkCards.reduce((sum, c) => sum + c.quickSellPrice, 0), [junkCards]);

  const listableCards: ListableItem[] = useMemo(
    () =>
      (cards ?? [])
        .filter((c) => !c.isListed)
        .map((c) => ({
          cardId: c.id,
          label: c.player.name,
          sublabel: `${POSITION_RU[c.player.position]} · ${c.player.club.shortName}`,
          rarity: c.rarity,
          quickSellPrice: c.quickSellPrice,
        })),
    [cards],
  );

  const listableStadiums: ListableItem[] = useMemo(
    () =>
      (stadiumCards ?? [])
        .filter((s) => !s.isListed)
        .map((s) => ({
          stadiumCardId: s.id,
          label: s.stadium.name,
          sublabel: `${s.stadium.city} · ${s.stadium.club.name}`,
          rarity: s.stadium.rarity,
          quickSellPrice: s.quickSellPrice,
        })),
    [stadiumCards],
  );

  function confirmSell() {
    if (!confirmingSell) return;
    haptics.notify("success");
    if (confirmingSell.kind === "card") quickSell.mutate(confirmingSell.id);
    else stadiumQuickSell.mutate(confirmingSell.id);
    setConfirmingSell(null);
    setViewingCard(null);
    setViewingStadium(null);
  }

  function confirmBulkSell() {
    haptics.notify("success");
    bulkSell.mutate(junkCards.map((c) => c.id));
    setConfirmingBulk(false);
  }

  const isLoading = kind === "players" ? cardsLoading : stadiumsLoading;

  return (
    <div className="velvet-texture flex min-h-dvh flex-col gap-4 px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-28">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold">🗂️ Коллекция</h1>
        <CoinBalance coins={user?.coins ?? 0} />
      </header>

      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <div>
          <p className="text-xs text-white/50">{(cards?.length ?? 0) + (stadiumCards?.length ?? 0)} предметов</p>
          <p className="flex items-center gap-1.5 text-xl font-extrabold">
            <GoldCoinIcon size={20} />
            <span className="shine-text-gold">{totalValue.toLocaleString("ru-RU")}</span>
          </p>
          <p className="text-[10px] text-white/40">Общая стоимость коллекции</p>
        </div>
        {kind === "players" && junkCards.length > 0 && (
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

      <PillTabs
        tabs={[
          { id: "players", label: "Игроки" },
          { id: "stadiums", label: "Стадионы" },
        ]}
        active={kind}
        onChange={(id) => setKind(id as "players" | "stadiums")}
        layoutId="collection-kind"
      />

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

      {kind === "players" && (
        <button
          onClick={() => setListingContext("players")}
          className="rounded-full border border-gold/30 bg-black/30 py-2.5 text-xs font-bold text-gold"
        >
          🏪 Выставить карту на рынок
        </button>
      )}
      {kind === "stadiums" && (
        <button
          onClick={() => setListingContext("stadiums")}
          className="rounded-full border border-gold/30 bg-black/30 py-2.5 text-xs font-bold text-gold"
        >
          🏪 Выставить стадион на рынок
        </button>
      )}

      {isLoading && <p className="text-sm text-white/50">Загрузка...</p>}
      {!isLoading && kind === "players" && filteredCards.length === 0 && (
        <p className="mt-6 text-center text-sm text-white/40">Карт не найдено</p>
      )}
      {!isLoading && kind === "stadiums" && filteredStadiums.length === 0 && (
        <p className="mt-6 text-center text-sm text-white/40">Стадионов не найдено</p>
      )}

      {kind === "players" && (
        <div className="grid grid-cols-2 gap-3">
          {filteredCards.map((card) => (
            <RarityCard key={card.id} card={card} size="full" onClick={() => setViewingCard(card)} />
          ))}
        </div>
      )}
      {kind === "stadiums" && (
        <div className="grid grid-cols-2 gap-3">
          {filteredStadiums.map((sc) => (
            <StadiumCardView key={sc.id} stadiumCard={sc} size="full" onClick={() => setViewingStadium(sc)} />
          ))}
        </div>
      )}

      <CardDetailModal
        card={viewingCard}
        onClose={() => setViewingCard(null)}
        onSell={(c) => setConfirmingSell({ kind: "card", id: c.id, label: c.player.name, price: c.quickSellPrice })}
        onList={() => {
          setViewingCard(null);
          setListingContext("players");
        }}
        selling={quickSell.isPending}
      />

      {viewingStadium && (
        <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-6 bg-black/85 px-6" onClick={() => setViewingStadium(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <StadiumCardView stadiumCard={viewingStadium} size="lg" />
          </div>
          <div onClick={(e) => e.stopPropagation()} className="flex w-full max-w-xs flex-col gap-2.5">
            <button
              onClick={() => {
                setViewingStadium(null);
                setListingContext("stadiums");
              }}
              disabled={viewingStadium.isListed}
              className="rounded-full bg-gold py-3 text-sm font-extrabold text-pitch-dark disabled:opacity-30"
            >
              {viewingStadium.isListed ? "Уже на рынке" : "🏪 Выставить на рынок"}
            </button>
            <button
              onClick={() =>
                setConfirmingSell({ kind: "stadium", id: viewingStadium.id, label: viewingStadium.stadium.name, price: viewingStadium.quickSellPrice })
              }
              disabled={viewingStadium.isListed || stadiumQuickSell.isPending}
              className="rounded-full border border-white/20 bg-white/5 py-3 text-sm font-semibold disabled:opacity-30"
            >
              {viewingStadium.isListed ? "На рынке — недоступно" : `Продать за ${viewingStadium.quickSellPrice.toLocaleString("ru-RU")} 🪙`}
            </button>
            <button onClick={() => setViewingStadium(null)} className="py-2 text-sm font-semibold text-white/50">
              Закрыть
            </button>
          </div>
        </div>
      )}

      {listingContext && (
        <CreateListingModal
          items={listingContext === "players" ? listableCards : listableStadiums}
          listings={myListings ?? []}
          onClose={() => setListingContext(null)}
        />
      )}

      {confirmingSell && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 px-6">
          <div className="w-full max-w-xs rounded-xl border border-white/15 bg-pitch-violet p-5 text-center">
            <p className="font-semibold">Продать {confirmingSell.label}?</p>
            <p className="mt-1 text-sm text-white/60">
              Получите {confirmingSell.price.toLocaleString("ru-RU")} 🪙. Отменить нельзя.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirmingSell(null)}
                className="flex-1 rounded-full border border-white/20 py-2.5 text-sm font-semibold"
              >
                Отмена
              </button>
              <button
                onClick={confirmSell}
                disabled={quickSell.isPending || stadiumQuickSell.isPending}
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
