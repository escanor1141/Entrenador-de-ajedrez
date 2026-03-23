import { describe, expect, it } from "vitest";
import { getTopOpeningByGames, sortOpeningsByGamesDesc } from "@/lib/openings";
import type { OpeningData } from "@/types";

function opening(name: string, games: number): OpeningData {
  return {
    eco: name,
    name,
    games,
    wins: 0,
    draws: 0,
    losses: 0,
    asWhite: 0,
    asBlack: 0,
    bulletGames: 0,
    blitzGames: 0,
    rapidGames: 0,
    classicalGames: 0,
    recentGames: [],
  };
}

describe("openings helpers", () => {
  it("sorts by games descending without mutating the input", () => {
    const openings = [opening("A", 3), opening("B", 9), opening("C", 5)];
    const snapshot = [...openings];

    const sorted = sortOpeningsByGamesDesc(openings);

    expect(sorted.map((item) => item.name)).toEqual(["B", "C", "A"]);
    expect(openings).toEqual(snapshot);
    expect(sorted).not.toBe(openings);
  });

  it("returns the top opening or undefined for empty input", () => {
    expect(getTopOpeningByGames([])).toBeUndefined();

    const top = getTopOpeningByGames([opening("A", 2), opening("B", 7), opening("C", 7)]);

    expect(top?.name).toBe("B");
  });
});
