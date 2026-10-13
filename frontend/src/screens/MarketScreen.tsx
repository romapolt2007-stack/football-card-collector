import { useMemo, useState } from "react";
import { ListingRow } from "../components/market/ListingRow";
import { SellModal } from "../components/market/SellModal";
import { RARITY_THEME } from "../components/cards/rarityTheme";
import { useBuyListing, useCancelListing, useListings, useMarketLiveUpdates, type MarketFilters } from "../lib/useMarket";
import { useInventory } from "../lib/queries";
import { useAuthStore } from "../store/useAuthStore";
import type { Rarity } from "../types/game";

const RARITIES: Rarity[] = ["BRONZE", "SILVER", "GOLD", "LEGEND", "ICON"];
const SORT_OPTIONS: { id: MarketFilters["sort"]; label: string }[] = [
  { id: "newest", label: "Новые" },
  { id: "price_asc", label: "Дешевле" },
  { id: "price_desc", label: "Дороже" },
  { id: "ovr_desc", label: "OVR" },
];

export function MarketScreen() {
  const user = useAuthStore((s) => s.user);
  const [rarity, setRarity] = useState<Rarity | undefined>(undefined);
  const [sort, setSort] = useState<MarketFilters["sort"]>("newest");
  const [search, setSearch] = useState("");
  const [sellOpen, setSellOpen] = useState(false);

  const filters: MarketFilters = { rarity, sort, search: search || undefined };
  const { data, isLoading } = useListings(filters);
  const buyListing = useBuyListing();
  const cancelListing = useCancelListing();
  const { data: inventory } = useInventory();
  useMarketLiveUpdates();

  const sellableCards = useMemo(
    () => (inventory ?? []).filter((c) => !c.isListed),
    [inventory],
  );

  return (
    <div className="flex min-h-dvh flex-col gap-4 px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-28">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold">🏪 Рынок</h1>
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold">
          {(user?.coins ?? 0).toLocaleString("ru-RU")} 🪙
        </span>
      </header>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск по имени..."
        className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none"
      />

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setRarity(undefined)}
          className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${
            !rarity ? "border-gold text-gold" : "border-white/20 text-white/50"
          }`}
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
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSort(opt.id)}
            className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${
              sort === opt.id ? "border-gold bg-gold/20 text-gold" : "border-white/15 text-white/50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => setSellOpen(true)}
        className="rounded-full border border-dashed border-white/25 py-2.5 text-sm font-semibold text-white/70"
      >
        + Выставить карту
      </button>

      {isLoading && <p className="text-sm text-white/50">Загрузка...</p>}
      {!isLoading && data?.listings.length === 0 && (
        <p className="mt-4 text-center text-sm text-white/40">Пока ничего не продаётся</p>
      )}

      <div className="flex flex-col gap-2">
        {data?.listings.map((listing) => (
          <ListingRow
            key={listing.id}
            listing={listing}
            isMine={listing.sellerId === user?.id}
            onBuy={() => buyListing.mutate(listing.id)}
            onCancel={() => cancelListing.mutate(listing.id)}
            isBusy={buyListing.isPending || cancelListing.isPending}
          />
        ))}
      </div>

      {sellOpen && <SellModal cards={sellableCards} onClose={() => setSellOpen(false)} />}
    </div>
  );
}
