import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useAuthStore } from "../store/useAuthStore";
import type {
  Card,
  PlayerSpinResult,
  PlayerSpinStatus,
  SpinFiltersWithAmount,
  SpinOdds,
  SpinStatus,
  StadiumCard,
  StadiumSpinResult,
} from "../types/game";

export function useSpinStatus() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["spin-status"],
    queryFn: () => api.get<PlayerSpinStatus>("/api/spin/status"),
    enabled: Boolean(token),
    refetchInterval: 30_000,
  });
}

/** Для кнопки "Шансы" — текущие проценты редкости при заданной ставке. */
export function useSpinOdds(amount: number) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["spin-odds", amount],
    queryFn: () => api.get<SpinOdds>(`/api/spin/odds?amount=${amount}`),
    enabled: Boolean(token) && amount > 0,
    staleTime: 10_000,
  });
}

export function useSpinPlayer() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (request: SpinFiltersWithAmount) => api.post<PlayerSpinResult>("/api/spin/spin", request),
    onSuccess: (result) => {
      if (user && result.coins != null) setUser({ ...user, coins: result.coins });
      queryClient.invalidateQueries({ queryKey: ["spin-status"] });
    },
  });
}

export function useSaveSpinPlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ card: Card }>("/api/spin/save"),
    onSuccess: (result) => {
      queryClient.setQueryData<Card[]>(["cards"], (prev) => [result.card, ...(prev ?? [])]);
    },
  });
}

export function useSellSpinPlayer() {
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: () => api.post<{ coins: number }>("/api/spin/sell"),
    onSuccess: (result) => {
      if (user) setUser({ ...user, coins: result.coins });
    },
  });
}

export interface StadiumCaseDef {
  id: string;
  title: string;
  priceCoins: number;
}

export function useStadiumCases() {
  return useQuery({
    queryKey: ["stadium-cases"],
    queryFn: () => api.get<{ cases: StadiumCaseDef[] }>("/api/stadiums/cases").then((r) => r.cases),
    staleTime: 10 * 60_000,
  });
}

export function useOpenStadiumCase() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (caseId: string) => api.post<StadiumSpinResult & { coins: number }>("/api/stadiums/open-case", { caseId }),
    onSuccess: (result) => {
      if (user) setUser({ ...user, coins: result.coins });
      queryClient.invalidateQueries({ queryKey: ["stadium-spin-status"] });
    },
  });
}

export function useStadiumSpinStatus() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["stadium-spin-status"],
    queryFn: () => api.get<SpinStatus>("/api/stadiums/status"),
    enabled: Boolean(token),
    refetchInterval: 30_000,
  });
}

export function useSpinStadium() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<StadiumSpinResult>("/api/stadiums/spin", {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stadium-spin-status"] }),
  });
}

/** Платный спин стадионов по ставке + фильтру лиги/клуба — аналог useSpinPlayer, для макета "Номерок-стиль". */
export function useSpinStadiumStaked() {
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (request: SpinFiltersWithAmount) => api.post<StadiumSpinResult & { coins: number }>("/api/stadiums/spin-staked", request),
    onSuccess: (result) => {
      if (user) setUser({ ...user, coins: result.coins });
    },
  });
}

export function useSaveSpinStadium() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ stadiumCard: StadiumCard }>("/api/stadiums/save"),
    onSuccess: (result) => {
      queryClient.setQueryData<StadiumCard[]>(["stadium-cards"], (prev) => [result.stadiumCard, ...(prev ?? [])]);
    },
  });
}

export function useSellSpinStadium() {
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: () => api.post<{ coins: number }>("/api/stadiums/sell"),
    onSuccess: (result) => {
      if (user) setUser({ ...user, coins: result.coins });
    },
  });
}
