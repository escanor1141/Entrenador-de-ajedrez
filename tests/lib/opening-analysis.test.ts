import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";
import { buildOpeningMoveTree, buildOpeningVariants } from "@/lib/opening-analysis";
import type { ParsedGame } from "@/types";

function makeGame(moves: string[], winner: ParsedGame["winner"], openingPly = 2): ParsedGame {
  return {
    id: `game-${moves.join("-")}`,
    white: "Alice",
    black: "Bob",
    winner,
    result: winner === null ? "1/2-1/2" : winner === "white" ? "1-0" : "0-1",
    userColor: "white",
    eco: "B20",
    openingName: "Sicilian Defense",
    openingPly,
    rated: true,
    speed: "blitz",
    moves: moves.map((san, index) => ({ ply: index + 1, san, uci: san })),
    playedAt: new Date(0).toISOString(),
  };
}

describe("opening analysis helpers", () => {
  it("builds move trees from full game histories", () => {
    const tree = buildOpeningMoveTree([makeGame(["e4", "c5", "Nf3"], "white")]);

    expect(tree).toHaveLength(1);
    expect(tree[0].san).toBe("e4");
    expect(tree[0].children[0].san).toBe("c5");
  });

  it("derives principal variants from the opening continuations", () => {
    const games = [
      makeGame(["e4", "c5", "Nf3", "d6"], "white"),
      makeGame(["e4", "c5", "Nf3", "d6"], "white"),
      makeGame(["e4", "c5", "c3"], null),
    ];

    const variants = buildOpeningVariants(games, "B20", { limit: 2, maxDepth: 4, unlockThreshold: 2 });
    const expectedFenGame = new Chess();
    expectedFenGame.move("e4");
    expectedFenGame.move("c5");
    expectedFenGame.move("Nf3");
    expectedFenGame.move("d6");

    expect(variants).toHaveLength(2);
    expect(variants[0].games).toBe(2);
    expect(variants[0].isUnlocked).toBe(true);
    expect(variants[0].lineText).toBe("1. e4 c5 2. Nf3 d6");
    expect(variants[0].fen).toBe(expectedFenGame.fen());
    expect(variants[1].games).toBe(1);
    expect(variants[1].isUnlocked).toBe(false);
  });
});
