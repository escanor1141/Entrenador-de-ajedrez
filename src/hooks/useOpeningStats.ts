"use client";

import { useQuery } from "@tanstack/react-query";
import { GameFilters, OpeningStats, OpeningData } from "@/types";
import { buildGameFiltersQuery } from "@/lib/gameFilters";

interface UseOpeningStatsResult {
  data?: {
    username: string;
    openings: OpeningData[];
    stats: OpeningStats;
  };
  isLoading: boolean;
  error: Error | null;
}

export function useOpeningStats(username: string | null, filters?: GameFilters): UseOpeningStatsResult {
  const queryString = buildGameFiltersQuery(filters ?? {});

  const { data, isLoading, error } = useQuery({
    queryKey: ["openings", username, queryString],
    queryFn: async () => {
      if (!username) return null;
      const res = await fetch(`/api/openings/${username}${queryString ? `?${queryString}` : ""}`);
      if (!res.ok) {
        throw new Error("Failed to fetch opening stats");
      }
      return res.json();
    },
    enabled: !!username,
    staleTime: 1000 * 60 * 60,
  });

  return { data, isLoading, error };
}
