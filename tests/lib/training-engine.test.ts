import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";
import { createProgressKey } from "@/lib/srs";
import {
  buildDrillSequence,
  calculateDrillScore,
  getSanFromUci,
  validateUserMove,
} from "@/lib/training-engine";
import type { MoveProgress, Repertoire, RepertoireLine, RepertoireMove } from "@/types/training";

function makeMoveNode(game: Chess, san: string, children: RepertoireMove[] = []): RepertoireMove {
  const fen = game.fen();
  const move = game.move(san);

  if (!move) {
    throw new Error(`Invalid SAN in test fixture: ${san}`);
  }

  return {
    fen,
    san,
    uci: `${move.from}${move.to}${move.promotion ?? ""}`,
    ply: game.history().length,
    children,
  };
}

function makeLinearLine(name: string, color: RepertoireLine["color"], sans: string[]): RepertoireLine {
  const game = new Chess();
  const rootMoves = makeLinearMoves(game, sans);

  return {
    id: name,
    name,
    color,
    rootMoves,
    createdAt: 0,
  };
}

function makeLinearMoves(game: Chess, sans: string[]): RepertoireMove[] {
  if (sans.length === 0) return [];

  const [san, ...rest] = sans;
  const node = makeMoveNode(game, san);
  node.children = makeLinearMoves(game, rest);

  return [node];
}

describe("training engine", () => {
  it("builds a drill sequence from the weakest line and tracks user moves", () => {
    const lineA = makeLinearLine("line-a", "white", ["e4", "e5"]);
    const lineB = makeLinearLine("line-b", "white", ["d4", "d5"]);
    const progressKey = createProgressKey(lineB.rootMoves[0].fen, lineB.rootMoves[0].san);
    const progress: Record<string, MoveProgress> = {
      [progressKey]: {
        key: progressKey,
        easinessFactor: 2.7,
        interval: 3,
        repetitions: 2,
        nextReview: Date.now() + 86_400_000,
        lastReview: Date.now(),
        correctCount: 2,
        totalCount: 2,
      },
    };

    const sequence = buildDrillSequence(
      {
        id: "rep",
        name: "rep",
        color: "white",
        lines: [lineA, lineB],
        importedAt: 0,
        totalMoves: 4,
      },
      "white",
      8,
      progress
    );

    expect(sequence.moves.map((move) => move.san)).toEqual(["e4", "e5"]);
    expect(sequence.moves.map((move) => move.isUserMove)).toEqual([true, false]);
    expect(sequence.expectedUserMoves.get(0)).toBe("e4");
    expect(sequence.expectedUserMoves.size).toBe(1);
  });

  it("follows the main variation and handles empty repertoires", () => {
    const game = new Chess();
    const root = makeMoveNode(game, "e4");
    const afterE4Game = new Chess(game.fen());
    const quietBranch = makeMoveNode(new Chess(afterE4Game.fen()), "e5");
    const c5Game = new Chess(afterE4Game.fen());
    const activeBranch = makeMoveNode(c5Game, "c5");
    const afterC5 = new Chess(c5Game.fen());

    activeBranch.children = [makeMoveNode(afterC5, "Nf3")];

    root.children = [quietBranch, activeBranch];

    const sequence = buildDrillSequence(
      {
        id: "rep",
        name: "rep",
        color: "white",
        lines: [
          {
            id: "line",
            name: "line",
            color: "white",
            rootMoves: [root],
            createdAt: 0,
          },
        ],
        importedAt: 0,
        totalMoves: 3,
      },
      "white",
      8,
      {}
    );

    expect(sequence.moves.map((move) => move.san)).toEqual(["e4", "c5", "Nf3"]);
    expect(sequence.expectedUserMoves.get(0)).toBe("e4");
    expect(sequence.expectedUserMoves.get(2)).toBe("Nf3");

    expect(
      buildDrillSequence(
        {
          id: "rep",
          name: "rep",
          color: "white",
          lines: [],
          importedAt: 0,
          totalMoves: 0,
        },
        "white",
        8,
        {}
      )
    ).toEqual({ moves: [], expectedUserMoves: new Map() });
  });

  it("validates moves, converts UCI and scores drill results", () => {
    const chess = new Chess();
    const fen = chess.fen();

    expect(validateUserMove(fen, "e4", "e4")).toEqual({ correct: true, feedback: "¡Correcto!" });
    expect(validateUserMove(fen, "d4", "e4")).toEqual({
      correct: false,
      feedback: "Incorrecto. La jugada correcta es e4",
    });
    expect(getSanFromUci(fen, "e2e4")).toBe("e4");
    expect(getSanFromUci(fen, "a1a8")).toBeNull();
    expect(calculateDrillScore(0, 0)).toEqual({ percent: 0, grade: "-", color: "text-muted-foreground" });
    expect(calculateDrillScore(10, 8)).toEqual({ percent: 80, grade: "A", color: "text-accent-blue" });
  });
});
