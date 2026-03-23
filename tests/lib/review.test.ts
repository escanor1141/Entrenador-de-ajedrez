import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";
import { buildReviewTimeline, getReviewCommentary, getReviewSummary } from "@/lib/review";
import type { ParsedGame } from "@/types";

function makeGame(moves: string[]): ParsedGame {
  const chess = new Chess();
  const parsedMoves = moves.map((san, index) => {
    const move = chess.move(san);

    if (!move) {
      throw new Error(`Invalid SAN in test fixture: ${san}`);
    }

    return {
      ply: index + 1,
      san,
      uci: `${move.from}${move.to}${move.promotion ?? ""}`,
    };
  });

  return {
    id: "game-1",
    white: "Alice",
    black: "Bob",
    winner: "white",
    result: "1-0",
    userColor: "white",
    eco: "C20",
    openingName: "King's Pawn Game",
    openingPly: 2,
    rated: true,
    speed: "rapid",
    whiteElo: 1800,
    blackElo: 1750,
    moves: parsedMoves,
    playedAt: new Date("2026-03-23T12:00:00.000Z").toISOString(),
  };
}

describe("review helpers", () => {
  it("builds a timeline from the initial position through each move", () => {
    const game = makeGame(["e4", "e5", "Nf3", "Nc6"]);

    const timeline = buildReviewTimeline(game);

    expect(timeline).toHaveLength(5);
    expect(timeline[0]?.notation).toBe("Inicio");
    expect(timeline[1]?.notation).toBe("1. e4");
    expect(timeline[4]?.notation).toBe("2... Nc6");
  });

  it("summarizes review progress and commentary state", () => {
    const game = makeGame(["e4", "e5", "Nf3"]);

    expect(getReviewSummary(game, 2)).toEqual(
      expect.objectContaining({
        currentPly: 2,
        totalPlies: 3,
        progress: 67,
        phase: "opening",
        sideToMove: "white",
      })
    );

    expect(getReviewCommentary(game, 0, false)).toContain("Empezar revisión");
    expect(getReviewCommentary(game, 2, true)).toContain("MVP: comentario base");
  });
});
