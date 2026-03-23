"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createStockfishEvaluator } from "@/lib/stockfish";
import {
  createInitialReviewAnalysis,
  createReviewAnalysisSession,
  type ReviewAnalysisOptions,
} from "@/lib/review-analysis";
import type { ParsedGame, ReviewAnalysisState } from "@/types";

export interface UseReviewAnalysisOptions
  extends Omit<ReviewAnalysisOptions, "onUpdate" | "signal"> {}

export interface UseReviewAnalysisResult extends ReviewAnalysisState {
  retryFailed: () => void;
  cancel: () => void;
}

export function useReviewAnalysis(game: ParsedGame, options: UseReviewAnalysisOptions = {}): UseReviewAnalysisResult {
  const [state, setState] = useState<ReviewAnalysisState>(() => createInitialReviewAnalysis(game));
  const sessionRef = useRef<ReturnType<typeof createReviewAnalysisSession> | null>(null);
  const [runId, setRunId] = useState(0);
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

    sessionRef.current = session;

    void session.promise;

    return () => {
      session.cancel();
      if (sessionRef.current === session) {
        sessionRef.current = null;
      }
    };
  }, [game, game.id, game.moves.length, depth, timeoutMs, runId]);

  const retryFailed = useCallback(() => {
    setRunId((value) => value + 1);
  }, []);

  const cancel = useCallback(() => {
    sessionRef.current?.cancel();
  }, []);

  return {
    ...state,
    retryFailed,
    cancel,
  };
}
