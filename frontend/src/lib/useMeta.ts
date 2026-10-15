import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type { LeagueWithClubs, NationOption } from "../types/game";

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
