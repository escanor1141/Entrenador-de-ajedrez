"use client";

import { useEffect, useState } from "react";
import { createStockfishEvaluator } from "@/lib/stockfish";
import {
  createInitialReviewAnalysis,
  createReviewAnalysisSession,
  type ReviewAnalysisOptions,
} from "@/lib/review-analysis";
import type { ParsedGame, ReviewAnalysisState } from "@/types";

export interface UseReviewAnalysisOptions
  extends Omit<ReviewAnalysisOptions, "onUpdate" | "signal"> {}

export function useReviewAnalysis(game: ParsedGame, options: UseReviewAnalysisOptions = {}): ReviewAnalysisState {
  const [state, setState] = useState<ReviewAnalysisState>(() => createInitialReviewAnalysis(game));
  const depth = options.depth ?? 12;
  const timeoutMs = options.timeoutMs;

  useEffect(() => {
    setState(createInitialReviewAnalysis(game));

    const evaluator = createStockfishEvaluator({ defaultDepth: depth });
    const session = createReviewAnalysisSession(game, evaluator, {
      depth,
      timeoutMs,
      onUpdate: setState,
    });

    void session.promise;

    return () => {
      session.cancel();
    };
  }, [game, game.id, game.moves.length, depth, timeoutMs]);

  return state;
}
