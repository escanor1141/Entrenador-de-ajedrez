import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";
import { buildReviewTimeline } from "@/lib/review";
import { buildReviewEvaluationSeries, summarizeReviewAnalysis } from "@/lib/review-ux";
import type { ParsedGame, ReviewAnalysisState } from "@/types";

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
    id: "game-review-ux-1",
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

describe("review UX helpers", () => {
  it("summarizes review progress and approximate color accuracy", () => {
    const analysis: ReviewAnalysisState = {
      currentPly: 3,
      totalPlies: 4,
      isAnalyzing: false,
      error: null,
      moves: [
        {
          ply: 1,
          san: "e4",
          uci: "e2e4",
          state: "ready",
          score: { kind: "cp", cp: 20 },
          bestScore: { kind: "cp", cp: 30 },
          playedScore: { kind: "cp", cp: 20 },
          centipawnLoss: 10,
          classification: "best",
          error: null,
        },
        {
          ply: 2,
          san: "e5",
          uci: "e7e5",
          state: "error",
          score: null,
          bestScore: null,
          playedScore: null,
          centipawnLoss: null,
          classification: null,
          error: "timeout",
        },
        {
          ply: 3,
          san: "Nf3",
          uci: "g1f3",
          state: "pending",
          score: null,
          bestScore: null,
          playedScore: null,
          centipawnLoss: null,
          classification: null,
          error: null,
        },
        {
          ply: 4,
          san: "Nc6",
          uci: "b8c6",
          state: "ready",
          score: { kind: "cp", cp: -140 },
          bestScore: { kind: "cp", cp: -10 },
          playedScore: { kind: "cp", cp: -140 },
          centipawnLoss: 130,
          classification: "blunder",
          error: null,
        },
      ],
    };

    const overview = summarizeReviewAnalysis(analysis);

    expect(overview).toMatchObject({
      status: "con errores parciales",
      progress: 75,
      completedPlies: 3,
      readyPlies: 2,
      pendingPlies: 1,
      errorPlies: 1,
    });
    expect(overview.classificationCounts).toEqual({
      best: 1,
      good: 0,
      inaccuracy: 0,
      mistake: 0,
      blunder: 1,
    });
    expect(overview.whiteAccuracy).toMatchObject({ accuracy: 95, analyzedMoves: 1, averageCentipawnLoss: 10 });
    expect(overview.blackAccuracy).toMatchObject({ accuracy: 35, analyzedMoves: 1, averageCentipawnLoss: 130 });
  });

  it("builds a timeline series with fallback markers for pending and error moves", () => {
    const game = makeGame(["e4", "e5", "Nf3"]);
    const timeline = buildReviewTimeline(game);
    const series = buildReviewEvaluationSeries(
      {
        currentPly: 2,
        totalPlies: 3,
        isAnalyzing: false,
        error: null,
        moves: [
          {
            ply: 1,
            san: "e4",
            uci: "e2e4",
            state: "ready",
            score: { kind: "cp", cp: 30 },
            bestScore: { kind: "cp", cp: 40 },
            playedScore: { kind: "cp", cp: 30 },
            centipawnLoss: 10,
            classification: "good",
            error: null,
          },
          {
            ply: 2,
            san: "e5",
            uci: "e7e5",
            state: "pending",
            score: null,
            bestScore: null,
            playedScore: null,
            centipawnLoss: null,
            classification: null,
            error: null,
          },
          {
            ply: 3,
            san: "Nf3",
            uci: "g1f3",
            state: "error",
            score: null,
            bestScore: null,
            playedScore: null,
            centipawnLoss: null,
            classification: null,
            error: "timeout",
          },
        ],
      },
      timeline
    );

    expect(series).toHaveLength(3);
    expect(series[0]).toMatchObject({ ply: 1, label: "1. e4", state: "ready", score: 30 });
    expect(series[1]).toMatchObject({ ply: 2, label: "1... e5", state: "pending", score: null, scoreLabel: "Pendiente" });
    expect(series[2]).toMatchObject({ ply: 3, label: "2. Nf3", state: "error", score: null, scoreLabel: "Error" });
  });
});
