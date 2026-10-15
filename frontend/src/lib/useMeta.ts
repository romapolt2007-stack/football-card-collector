import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { useAuthStore } from "../store/useAuthStore";
import type { LeagueTrend, LeagueWithClubs, NationOption, StadiumBuff } from "../types/game";

export function useLeagues() {
  return useQuery({
    queryKey: ["meta-leagues"],
    queryFn: () => api.get<{ leagues: LeagueWithClubs[] }>("/api/meta/leagues").then((r) => r.leagues),
    staleTime: 10 * 60_000,
  });
}

export function useNations() {
  return useQuery({
    queryKey: ["meta-nations"],
    queryFn: () => api.get<{ nations: NationOption[] }>("/api/meta/nations").then((r) => r.nations),
    staleTime: 10 * 60_000,
  });
}

export function useStadiumBuff() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["stadium-buff"],
    queryFn: () => api.get<StadiumBuff>("/api/stadiums/buff"),
    enabled: Boolean(token),
  });
}

export function useMarketTrends() {
  return useQuery({
    queryKey: ["market-trends-today"],
    queryFn: () => api.get<{ trends: LeagueTrend[] }>("/api/market/trends-today").then((r) => r.trends),
    staleTime: 10 * 60_000,
  });
}
