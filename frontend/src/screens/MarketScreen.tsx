import confetti from "canvas-confetti";
import { useMemo, useState } from "react";
import { BidModal } from "../components/market/BidModal";
import { CreateListingModal, type ListableItem } from "../components/market/CreateListingModal";
import { ListingCard } from "../components/market/ListingCard";
import { MarketTrendsTicker } from "../components/market/MarketTrendsTicker";
import { RARITY_THEME } from "../components/cards/rarityTheme";
import { CoinBalance } from "../components/common/CoinBalance";
import { PillTabs } from "../components/common/PillTabs";
import {
  useBuyListing,
  useCancelListing,
  useListings,
  useMarketHistory,
  useMarketLiveUpdates,
  useMyListings,
  type MarketFilters,
} from "../lib/useMarket";
import { useInventory, useStadiumCollection } from "../lib/queries";
import { haptics } from "../lib/telegram";
import { sfx } from "../lib/sfx";
import { useAuthStore } from "../store/useAuthStore";
import type { Listing, Rarity } from "../types/game";

const RARITIES: Rarity[] = ["BRONZE", "SILVER", "GOLD", "LEGEND", "ICON"];
const SORT_OPTIONS: { id: MarketFilters["sort"]; label: string }[] = [
  { id: "newest", label: "Новые" },
  { id: "price_asc", label: "Дешевле" },
  { id: "price_desc", label: "Дороже" },
  { id: "ovr_desc", label: "OVR" },
];

type Tab = "browse" | "mine" | "history";

export function MarketScreen() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>("browse");
  const [kind, setKind] = useState<"player" | "stadium">("player");
  const [rarity, setRarity] = useState<Rarity | undefined>(undefined);
  const [auctionType, setAuctionType] = useState<"AUCTION" | "BUY_NOW" | undefined>(undefined);
  const [sort, setSort] = useState<MarketFilters["sort"]>("newest");
  const [search, setSearch] = useState("");
  const [sellOpen, setSellOpen] = useState(false);
  const [bidding, setBidding] = useState<Listing | null>(null);

  const filters: MarketFilters = { kind, rarity, auctionType, sort, search: search || undefined };
  const { data, isLoading } = useListings(filters);
  const myListings = useMyListings();
  const history = useMarketHistory();
  const buyListing = useBuyListing();
  const cancelListing = useCancelListing();
  const { data: inventory } = useInventory();
  const { data: stadiumInventory } = useStadiumCollection();
  useMarketLiveUpdates();

  const listableCards: ListableItem[] = useMemo(
    () =>
      (inventory ?? [])
        .filter((c) => !c.isListed)
        .map((c) => ({
          cardId: c.id,
          label: c.player.name,
          sublabel: `${c.player.position} · ${c.player.club.shortName}`,
          rarity: c.rarity,
          quickSellPrice: c.quickSellPrice,
        })),
    [inventory],
  );
  const listableStadiums: ListableItem[] = useMemo(
    () =>
      (stadiumInventory ?? [])
        .filter((s) => !s.isListed)
        .map((s) => ({
          stadiumCardId: s.id,
          label: s.stadium.name,
          sublabel: `${s.stadium.city} · ${s.stadium.club.name}`,
          rarity: s.stadium.rarity,
          quickSellPrice: s.quickSellPrice,
        })),
    [stadiumInventory],
  );

  const visibleListings = data?.listings ?? [];

  function handleBuy(listing: Listing) {
    haptics.impact("heavy");
    buyListing.mutate(listing.id, {
      onSuccess: () => {
        sfx.goalRoar();
        haptics.notify("success");
        confetti({ particleCount: 70, spread: 75, origin: { y: 0.5 }, colors: ["#ffd166", "#6ee7a0"] });
      },
    });
  }

  function handleCancel(listing: Listing) {
    haptics.impact("medium");
    cancelListing.mutate(listing.id);
  }

  return (
    <div className="flex min-h-dvh flex-col gap-4 px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-28">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold">🏪 Рынок</h1>
        <CoinBalance coins={user?.coins ?? 0} />
      </header>

      <PillTabs
        layoutId="market-tabs"
        active={tab}
        onChange={(id) => setTab(id as Tab)}
        tabs={[
          { id: "browse", label: "Витрина" },
          { id: "mine", label: "Мои лоты" },
          { id: "history", label: "История" },
        ]}
      />

      {tab === "browse" && (
        <>
          <MarketTrendsTicker />

          <PillTabs
            layoutId="market-kind"
            active={kind}
            onChange={(id) => setKind(id as "player" | "stadium")}
            tabs={[
              { id: "player", label: "Игроки" },
              { id: "stadium", label: "Стадионы" },
            ]}
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени..."
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none"
          />

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setRarity(undefined)}
              className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${!rarity ? "border-gold text-gold" : "border-white/20 text-white/50"}`}
            >
              Все
            </button>
            {RARITIES.map((r) => (
              <button
                key={r}
                onClick={() => setRarity((prev) => (prev === r ? undefined : r))}
                className="shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold"
                style={{
                  borderColor: rarity === r ? RARITY_THEME[r].borderColor : "rgba(255,255,255,0.2)",
                  color: rarity === r ? RARITY_THEME[r].borderColor : "rgba(255,255,255,0.5)",
                }}
              >
                {RARITY_THEME[r].emoji}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setAuctionType(undefined)}
              className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${!auctionType ? "border-gold bg-gold/15 text-gold" : "border-white/15 text-white/50"}`}
            >
              Все лоты
            </button>
            <button
              onClick={() => setAuctionType((p) => (p === "BUY_NOW" ? undefined : "BUY_NOW"))}
              className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${auctionType === "BUY_NOW" ? "border-gold bg-gold/15 text-gold" : "border-white/15 text-white/50"}`}
            >
              Выкуп
            </button>
            <button
              onClick={() => setAuctionType((p) => (p === "AUCTION" ? undefined : "AUCTION"))}
              className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${auctionType === "AUCTION" ? "border-gold bg-gold/15 text-gold" : "border-white/15 text-white/50"}`}
            >
              Аукцион
            </button>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSort(opt.id)}
                className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${sort === opt.id ? "border-white/60 text-white" : "border-white/15 text-white/50"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSellOpen(true)}
            className="rounded-full border border-dashed border-white/25 py-2.5 text-sm font-semibold text-white/70"
          >
            + Выставить {kind === "player" ? "карту" : "стадион"}
          </button>

          {isLoading && <p className="text-sm text-white/50">Загрузка...</p>}
          {!isLoading && visibleListings.length === 0 && (
            <p className="mt-4 text-center text-sm text-white/40">Пока ничего не продаётся</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            {visibleListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isMine={listing.sellerId === user?.id}
                onBuy={() => handleBuy(listing)}
                onBid={() => setBidding(listing)}
                onCancel={() => handleCancel(listing)}
                isBusy={buyListing.isPending || cancelListing.isPending}
              />
            ))}
          </div>
        </>
      )}

      {tab === "mine" && (
        <div className="grid grid-cols-2 gap-3">
          {myListings.isLoading && <p className="text-sm text-white/50">Загрузка...</p>}
          {!myListings.isLoading && (myListings.data ?? []).length === 0 && (
            <p className="col-span-2 mt-4 text-center text-sm text-white/40">У вас пока нет активных лотов</p>
          )}
          {(myListings.data ?? []).map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isMine
              onBuy={() => {}}
              onBid={() => {}}
              onCancel={() => handleCancel(listing)}
              isBusy={cancelListing.isPending}
            />
          ))}
        </div>
      )}

      {tab === "history" && (
        <div className="flex flex-col gap-2">
          {history.isLoading && <p className="text-sm text-white/50">Загрузка...</p>}
          {!history.isLoading && (history.data ?? []).length === 0 && (
            <p className="mt-4 text-center text-sm text-white/40">История сделок пуста</p>
          )}
          {(history.data ?? []).map((entry) => (
            <div key={entry.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <div>
                <p className="text-sm font-semibold">
                  {entry.type === "MARKET_BUY" ? "Покупка" : "Продажа"}
                  {entry.itemName && <span className="text-white/50"> · {entry.itemName}</span>}
                </p>
                <p className="text-xs text-white/40">{new Date(entry.createdAt).toLocaleString("ru-RU")}</p>
              </div>
              <span className="text-sm font-extrabold" style={{ color: entry.amount >= 0 ? "#6ee7a0" : "#ff6b6b" }}>
                {entry.amount >= 0 ? "+" : ""}
                {entry.amount.toLocaleString("ru-RU")} 🪙
              </span>
            </div>
          ))}
        </div>
      )}

      {sellOpen && (
        <CreateListingModal
          items={kind === "player" ? listableCards : listableStadiums}
          listings={data?.listings ?? []}
          onClose={() => setSellOpen(false)}
        />
      )}
      {bidding && <BidModal listing={bidding} onClose={() => setBidding(null)} />}
    </div>
  );
}
