"use client";

import { useQuery } from "@tanstack/react-query";
import { GameFilters, ParsedGame } from "@/types";
import { buildGameFiltersQuery } from "@/lib/gameFilters";

interface UseGamesResult {
  data?: {
    username: string;
    games: ParsedGame[];
    total: number;
  };
  isLoading: boolean;
  error: Error | null;
}

type UseGamesFilters = GameFilters | GameFilters["perfType"] | "all" | undefined;

function normalizeFilters(filters?: UseGamesFilters): GameFilters {
  if (!filters || filters === "all") return {};
  if (typeof filters === "string") return { perfType: filters };
  return filters;
}

export function useGames(username: string | null, filters?: UseGamesFilters): UseGamesResult {
  const normalizedFilters = normalizeFilters(filters);
  const queryString = buildGameFiltersQuery(normalizedFilters);

  const { data, isLoading, error } = useQuery({
    queryKey: ["games", username, queryString],
    queryFn: async () => {
      if (!username) return null;
      const url = `/api/games/${username}${queryString ? `?${queryString}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch games");
      }
      return res.json();
    },
    enabled: !!username,
    staleTime: 1000 * 60 * 60,
  });

  return { data, isLoading, error };
}
