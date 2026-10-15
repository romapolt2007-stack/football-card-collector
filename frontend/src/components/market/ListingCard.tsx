import { useEffect, useState } from "react";
import { ClubCrest } from "../cards/ClubCrest";
import { StadiumIllustration } from "../cards/StadiumIllustration";
import { RARITY_THEME } from "../cards/rarityTheme";
import { POSITION_RU } from "../../lib/ruLabels";
import type { Listing } from "../../types/game";

interface Props {
  listing: Listing;
  isMine: boolean;
  onBuy: () => void;
  onBid: () => void;
  onCancel: () => void;
  isBusy: boolean;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "завершён";
  const totalMin = Math.floor(ms / 60_000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const minutes = totalMin % 60;
  if (days > 0) return `${days}д ${hours}ч`;
  if (hours > 0) return `${hours}ч ${minutes}м`;
  return `${minutes}:${Math.floor((ms % 60_000) / 1000).toString().padStart(2, "0")}`;
}

export function ListingCard({ listing, isMine, onBuy, onBid, onCancel, isBusy }: Props) {
  const rarity = listing.card?.rarity ?? listing.stadiumCard!.stadium.rarity;
  const theme = RARITY_THEME[rarity];
  const [msLeft, setMsLeft] = useState(() => new Date(listing.expiresAt).getTime() - Date.now());

  useEffect(() => {
    const timer = setInterval(() => setMsLeft(new Date(listing.expiresAt).getTime() - Date.now()), 1000);
    return () => clearInterval(timer);
  }, [listing.expiresAt]);

  const highestBid = listing.bids[0]?.amount ?? null;
  const isBotSeller = listing.seller.username === "market_bot";
  const sellerLabel = isBotSeller ? "🤖 Рыночный Бот" : listing.seller.firstName ?? listing.seller.username ?? "Игрок";

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-2xl border-2 p-3"
      style={{ background: theme.background, borderColor: theme.borderColor, boxShadow: theme.glow, color: theme.textColor }}
    >
      {listing.card ? (
        <>
          <div className="flex items-start justify-between">
            <div className="flex flex-col items-center leading-none">
              <span className="text-xl font-extrabold">{listing.card.player.overall}</span>
              <span className="mt-0.5 text-[0.65em] font-bold opacity-80">{POSITION_RU[listing.card.player.position]}</span>
            </div>
            <ClubCrest club={listing.card.player.club} size={32} />
          </div>
          <p className="mt-1 truncate text-center text-xs font-bold uppercase tracking-wide">{listing.card.player.name}</p>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <span className="text-xl font-extrabold">{(listing.stadiumCard!.stadium.capacity / 1000).toFixed(0)}к</span>
            <ClubCrest club={listing.stadiumCard!.stadium.club} size={32} />
          </div>
          <div className="flex justify-center">
            <StadiumIllustration stadiumId={listing.stadiumCard!.stadium.id} accent={theme.borderColor} size={40} />
          </div>
          <p className="mt-1 truncate text-center text-xs font-bold uppercase tracking-wide">{listing.stadiumCard!.stadium.name}</p>
        </>
      )}

      <div className="mt-2 flex items-center justify-between rounded-full bg-black/25 px-2 py-1 text-[10px] font-semibold">
        <span>⏱ {formatCountdown(msLeft)}</span>
        <span className="truncate pl-1 opacity-80">{sellerLabel}</span>
      </div>

      <div className="mt-2 flex flex-col gap-1 text-xs">
        <div className="flex items-center justify-between">
          <span className="opacity-70">{highestBid ? "Ставка" : "Старт"}</span>
          <span className="font-extrabold">{(highestBid ?? listing.price).toLocaleString("ru-RU")} 🪙</span>
        </div>
        {listing.buyNowPrice && (
          <div className="flex items-center justify-between">
            <span className="opacity-70">Выкуп</span>
            <span className="font-extrabold text-gold">{listing.buyNowPrice.toLocaleString("ru-RU")} 🪙</span>
          </div>
        )}
      </div>

      {isMine ? (
        <button
          onClick={onCancel}
          disabled={isBusy}
          className="mt-2 rounded-full border border-white/30 bg-black/20 py-2 text-xs font-semibold disabled:opacity-30"
        >
          Снять с продажи
        </button>
      ) : (
        <div className="mt-2 flex gap-1.5">
          <button
            onClick={onBid}
            disabled={isBusy}
            className="flex-1 rounded-full border border-white/30 bg-black/20 py-2 text-xs font-semibold disabled:opacity-30"
          >
            Ставка
          </button>
          {listing.buyNowPrice && (
            <button
              onClick={onBuy}
              disabled={isBusy}
              className="flex-1 rounded-full bg-gold py-2 text-xs font-extrabold text-pitch-dark disabled:opacity-30"
            >
              Выкуп
            </button>
          )}
        </div>
      )}
    </div>
  );
}
