import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "./api";
import { getSocket } from "./socket";
import { useAuthStore } from "../store/useAuthStore";
import type { Listing, Rarity } from "../types/game";

export interface MarketFilters {
  rarity?: Rarity;
  position?: string;
  nation?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort: "newest" | "price_asc" | "price_desc" | "ovr_desc";
}

function toQueryString(filters: MarketFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return params.toString();
}

export function useListings(filters: MarketFilters) {
  return useQuery({
    queryKey: ["market", filters],
    queryFn: () =>
      api
        .get<{ listings: Listing[]; feeRate: number }>(`/api/market/listings?${toQueryString(filters)}`)
        .then((r) => r),
  });
}

/** Подписка на live-обновления рынка через Socket.IO — инвалидирует кэш при изменениях. */
export function useMarketLiveUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["market"] });

    socket.on("market:created", invalidate);
    socket.on("market:sold", invalidate);
    socket.on("market:removed", invalidate);

    return () => {
      socket.off("market:created", invalidate);
      socket.off("market:sold", invalidate);
      socket.off("market:removed", invalidate);
    };
  }, [queryClient]);
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { cardId: string; price: number }) =>
      api.post<{ listing: Listing }>("/api/market/list", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market"] });
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
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
  });
}
