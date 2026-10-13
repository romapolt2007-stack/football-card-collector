import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "./api";
import { getSocket } from "./socket";
import { useAuthStore } from "../store/useAuthStore";
import type { Listing, MarketHistoryEntry, MarketTrend, Rarity } from "../types/game";

export interface MarketFilters {
  rarity?: Rarity;
  position?: string;
  nation?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  auctionType?: "AUCTION" | "BUY_NOW";
  sort: "newest" | "price_asc" | "price_desc" | "ovr_desc";
}

function toQueryString(filters: object): string {
  const params = new URLSearchParams();
  Object.entries(filters as Record<string, string | number | undefined>).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return params.toString();
}

export function useListings(filters: MarketFilters) {
  return useQuery({
    queryKey: ["market", filters],
    queryFn: () =>
      api.get<{ listings: Listing[]; feeRate: number }>(`/api/market/listings?${toQueryString(filters)}`),
  });
}

export function useHotDeals() {
  return useQuery({
    queryKey: ["market-hot"],
    queryFn: () => api.get<{ listings: Listing[] }>("/api/market/hot").then((r) => r.listings),
    refetchInterval: 30_000,
  });
}

export function useMarketTrends() {
  return useQuery({
    queryKey: ["market-trends"],
    queryFn: () => api.get<{ trends: MarketTrend[] }>("/api/market/trends").then((r) => r.trends),
    refetchInterval: 60_000,
  });
}

export function useMyListings() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["market-mine"],
    queryFn: () => api.get<{ listings: Listing[] }>("/api/market/mine").then((r) => r.listings),
    enabled: Boolean(token),
  });
}

export function useMarketHistory() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["market-history"],
    queryFn: () => api.get<{ history: MarketHistoryEntry[] }>("/api/market/history").then((r) => r.history),
    enabled: Boolean(token),
  });
}

/** Подписка на live-обновления рынка через Socket.IO — инвалидирует кэш при изменениях. */
export function useMarketLiveUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["market"] });
      queryClient.invalidateQueries({ queryKey: ["market-hot"] });
      queryClient.invalidateQueries({ queryKey: ["market-mine"] });
    };

    socket.on("market:created", invalidate);
    socket.on("market:sold", invalidate);
    socket.on("market:removed", invalidate);
    socket.on("market:bid", invalidate);

    return () => {
      socket.off("market:created", invalidate);
      socket.off("market:sold", invalidate);
      socket.off("market:removed", invalidate);
      socket.off("market:bid", invalidate);
    };
  }, [queryClient]);
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { cardId: string; price: number; buyNowPrice?: number; durationHours: number }) =>
      api.post<{ listing: Listing }>("/api/market/list", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market"] });
      queryClient.invalidateQueries({ queryKey: ["market-mine"] });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
  });
}

export function useCancelListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (listingId: string) => api.post<{ ok: true }>(`/api/market/listings/${listingId}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market"] });
      queryClient.invalidateQueries({ queryKey: ["market-mine"] });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
  });
}

export function useBuyListing() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (listingId: string) => api.post<{ coins: number }>("/api/market/buy", { listingId }),
    onSuccess: (result) => {
      if (user) setUser({ ...user, coins: result.coins });
      queryClient.invalidateQueries({ queryKey: ["market"] });
      queryClient.invalidateQueries({ queryKey: ["market-hot"] });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
  });
}

export function useBidListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, amount }: { listingId: string; amount: number }) =>
      api.post(`/api/market/listings/${listingId}/bid`, { amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market"] });
      queryClient.invalidateQueries({ queryKey: ["market-hot"] });
    },
  });
}
