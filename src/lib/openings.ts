import { OpeningData } from "@/types";

export function sortOpeningsByGamesDesc(openings: OpeningData[]): OpeningData[] {
  return [...openings].sort((a, b) => b.games - a.games);
}

export function getTopOpeningByGames(openings: OpeningData[]): OpeningData | undefined {
  return openings.reduce<OpeningData | undefined>((top, opening) => {
    if (!top || opening.games > top.games) {
      return opening;
    }

    return top;
  }, undefined);
}
