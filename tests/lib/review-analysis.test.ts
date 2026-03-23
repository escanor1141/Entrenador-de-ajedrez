import { Chess } from "chess.js";
import { describe, expect, it, vi } from "vitest";
import {
  buildReviewMoveSteps,
  createInitialReviewAnalysis,
  createReviewAnalysisSession,
  runReviewAnalysis,
  type ReviewAnalysisEvaluator,
} from "@/lib/review-analysis";
import type { EvaluationResult } from "@/lib/stockfish";
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
    id: "game-analysis-1",
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

function createFenScoreMap() {
  return new Map<string, { kind: "cp"; cp: number }>();
}

function makeEvaluator(scores: Map<string, { kind: "cp"; cp: number }>, failingFen?: string): ReviewAnalysisEvaluator {
  const failedOnce = new Set<string>();

  const evaluatePosition = vi.fn(async ({ fen }: { fen: string }) => {
    if (fen === failingFen && !failedOnce.has(fen)) {
      failedOnce.add(fen);
      throw new Error("engine timeout");
    }

    const score = scores.get(fen);
    if (!score) {
      throw new Error(`Missing score for ${fen}`);
    }

    return {
      requestId: `req-${fen}`,
      fen,
      depth: 12,
      engineVersion: "test-engine",
      bestMove: null,
      score,
      pv: [],
      nodes: null,
      nps: null,
    };
  });

  return {
    evaluatePosition,
    dispose: vi.fn(),
    cancelActiveRequest: vi.fn(),
  };
}

describe("review analysis pipeline", () => {
  it("creates a pending analysis snapshot from the game timeline", () => {
    const game = makeGame(["e4", "e5"]);
    const analysis = createInitialReviewAnalysis(game);

    expect(analysis).toEqual(
      expect.objectContaining({
        currentPly: 0,
        totalPlies: 2,
        isAnalyzing: true,
      })
    );
    expect(analysis.moves).toEqual([
      expect.objectContaining({ ply: 1, san: "e4", state: "pending" }),
      expect.objectContaining({ ply: 2, san: "e5", state: "pending" }),
    ]);
  });

  it("analyzes moves progressively and keeps going after a per-move error", async () => {
    const game = makeGame(["e4", "e5", "Nf3"]);
    const steps = buildReviewMoveSteps(game);
    const scores = createFenScoreMap();

    scores.set(steps[0]!.beforeFen, { kind: "cp", cp: 30 });
    scores.set(steps[0]!.afterFen, { kind: "cp", cp: -28 });
    scores.set(steps[1]!.beforeFen, { kind: "cp", cp: -28 });
    scores.set(steps[2]!.beforeFen, { kind: "cp", cp: 30 });
    scores.set(steps[2]!.afterFen, { kind: "cp", cp: -10 });

    const evaluator = makeEvaluator(scores, steps[1]!.afterFen);
    const snapshots: ReturnType<typeof createInitialReviewAnalysis>[] = [];

    const finalState = await runReviewAnalysis(game, evaluator, {
      depth: 12,
      onUpdate: (state) => snapshots.push(state),
    });

    expect(finalState.isAnalyzing).toBe(false);
    expect(finalState.moves[0]).toMatchObject({
      state: "ready",
      classification: "best",
      centipawnLoss: 2,
    });
    expect(finalState.moves[1]).toMatchObject({
      state: "error",
      error: "engine timeout",
    });
    expect(finalState.moves[2]).toMatchObject({
      state: "ready",
      classification: "good",
    });

    expect(snapshots.some((snapshot) => snapshot.moves[0]?.state === "ready")).toBe(true);
    expect(snapshots.some((snapshot) => snapshot.moves[1]?.state === "error")).toBe(true);
  });

  it("cancels an active analysis session", () => {
    const game = makeGame(["e4"]);
    const evaluator: ReviewAnalysisEvaluator = {
      evaluatePosition: vi.fn(() => new Promise<EvaluationResult>(() => {})),
      dispose: vi.fn(),
      cancelActiveRequest: vi.fn(),
    };

    const session = createReviewAnalysisSession(game, evaluator, {
      onUpdate: vi.fn(),
    });

    session.cancel();

    expect(evaluator.cancelActiveRequest).toHaveBeenCalledTimes(1);
    expect(evaluator.dispose).toHaveBeenCalledTimes(1);
  });
});
