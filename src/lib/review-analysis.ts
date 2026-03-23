import { Chess } from "chess.js";
import { classifyReviewMove, getCentipawnLoss } from "@/lib/review-evaluation";
import { STARTING_FEN } from "@/lib/review";
import type { EvaluationResult, StockfishEvaluator } from "@/lib/stockfish";
import type { ParsedGame, ReviewAnalysisState, ReviewMoveAnalysis } from "@/types";

export interface ReviewAnalysisOptions {
  depth?: number;
  timeoutMs?: number;
  onUpdate?: (state: ReviewAnalysisState) => void;
  signal?: AbortSignal;
}

export type ReviewAnalysisEvaluator = Pick<
  StockfishEvaluator,
  "evaluatePosition" | "dispose" | "cancelActiveRequest"
>;

export interface ReviewMoveStep {
  ply: number;
  san: string;
  uci: string;
  beforeFen: string;
  afterFen: string;
}

const DEFAULT_REVIEW_ANALYSIS_DEPTH = 12;

function cloneScore(score: EvaluationResult["score"]): EvaluationResult["score"] {
  if (!score) {
    return null;
  }

  return score.kind === "cp" ? { kind: "cp", cp: score.cp } : { kind: "mate", mate: score.mate };
}

function invertScore(score: EvaluationResult["score"]): EvaluationResult["score"] {
  if (!score) {
    return null;
  }

  return score.kind === "cp" ? { kind: "cp", cp: -score.cp } : { kind: "mate", mate: -score.mate };
}

function createPendingMove(step: ReviewMoveStep): ReviewMoveAnalysis {
  return {
    ply: step.ply,
    san: step.san,
    uci: step.uci,
    state: "pending",
    score: null,
    bestScore: null,
    playedScore: null,
    centipawnLoss: null,
    classification: null,
    error: null,
  };
}

export function buildReviewMoveSteps(game: ParsedGame): ReviewMoveStep[] {
  const chess = new Chess();
  const steps: ReviewMoveStep[] = [];
  let beforeFen = STARTING_FEN;

  for (const move of game.moves) {
    const applied = chess.move(move.san);

    if (!applied) {
      break;
    }

    steps.push({
      ply: move.ply,
      san: move.san,
      uci: move.uci,
      beforeFen,
      afterFen: chess.fen(),
    });

    beforeFen = chess.fen();
  }

  return steps;
}

export function createInitialReviewAnalysis(game: ParsedGame): ReviewAnalysisState {
  const moves = buildReviewMoveSteps(game).map(createPendingMove);

  return {
    currentPly: 0,
    totalPlies: moves.length,
    isAnalyzing: true,
    moves,
    error: null,
  };
}

function updateMove(
  state: ReviewAnalysisState,
  index: number,
  next: Partial<ReviewMoveAnalysis>
): ReviewAnalysisState {
  const moves = state.moves.map((move, moveIndex) =>
    moveIndex === index ? { ...move, ...next } : move
  );

  return {
    ...state,
    currentPly: Math.max(state.currentPly, index + 1),
    moves,
  };
}

function setMoveError(state: ReviewAnalysisState, index: number, error: string): ReviewAnalysisState {
  return updateMove(state, index, {
    state: "error",
    error,
    score: null,
    bestScore: null,
    playedScore: null,
    centipawnLoss: null,
    classification: null,
  });
}

function setMoveReady(
  state: ReviewAnalysisState,
  index: number,
  payload: Pick<ReviewMoveAnalysis, "score" | "bestScore" | "playedScore" | "centipawnLoss" | "classification">
): ReviewAnalysisState {
  return updateMove(state, index, {
    state: "ready",
    error: null,
    ...payload,
  });
}

async function evaluatePosition(
  evaluator: Pick<StockfishEvaluator, "evaluatePosition">,
  fen: string,
  depth: number,
  timeoutMs?: number
): Promise<EvaluationResult> {
  return evaluator.evaluatePosition({ fen, depth, timeoutMs });
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export async function runReviewAnalysis(
  game: ParsedGame,
  evaluator: ReviewAnalysisEvaluator,
  options: ReviewAnalysisOptions = {}
): Promise<ReviewAnalysisState> {
  const depth = options.depth ?? DEFAULT_REVIEW_ANALYSIS_DEPTH;
  const analysisTimeoutMs = options.timeoutMs;
  const steps = buildReviewMoveSteps(game);
  let state: ReviewAnalysisState = {
    currentPly: 0,
    totalPlies: steps.length,
    isAnalyzing: true,
    moves: steps.map(createPendingMove),
    error: null,
  };

  const emit = (nextState: ReviewAnalysisState) => {
    state = nextState;
    options.onUpdate?.(nextState);
  };

  try {
    let bestEval: EvaluationResult | null = null;

    for (let index = 0; index < steps.length; index += 1) {
      if (options.signal?.aborted) {
        break;
      }

      const step = steps[index];

      if (!bestEval || bestEval.fen !== step.beforeFen) {
        try {
          bestEval = await evaluatePosition(evaluator, step.beforeFen, depth, analysisTimeoutMs);
        } catch (error) {
          if (options.signal?.aborted || isAbortError(error)) {
            break;
          }

          emit(setMoveError(state, index, error instanceof Error ? error.message : "No se pudo evaluar la posición"));
          bestEval = null;
          continue;
        }
      }

      try {
        const playedEval = await evaluatePosition(evaluator, step.afterFen, depth, analysisTimeoutMs);
        const bestScore = cloneScore(bestEval.score);
        const playedScore = invertScore(playedEval.score);

        if (!bestScore || !playedScore) {
          emit(setMoveError(state, index, "El engine no devolvió una evaluación utilizable"));
          bestEval = playedEval;
          continue;
        }

        const centipawnLoss = getCentipawnLoss(bestScore, playedScore);

        emit(
          setMoveReady(state, index, {
            score: playedScore,
            bestScore,
            playedScore,
            centipawnLoss,
            classification: classifyReviewMove(bestScore, playedScore),
          })
        );

        bestEval = playedEval;
      } catch (error) {
        if (options.signal?.aborted || isAbortError(error)) {
          break;
        }

        emit(setMoveError(state, index, error instanceof Error ? error.message : "No se pudo evaluar la jugada"));
        bestEval = null;
      }
    }
  } finally {
    emit({
      ...state,
      isAnalyzing: false,
      error: options.signal?.aborted ? "Análisis cancelado" : state.error,
    });
  }

  return state;
}

export interface ReviewAnalysisSession {
  promise: Promise<ReviewAnalysisState>;
  cancel: () => void;
}

export function createReviewAnalysisSession(
  game: ParsedGame,
  evaluator: ReviewAnalysisEvaluator,
  options: ReviewAnalysisOptions = {}
): ReviewAnalysisSession {
  const controller = new AbortController();
  let disposed = false;

  const dispose = () => {
    if (disposed) {
      return;
    }

    disposed = true;
    evaluator.dispose?.();
  };

  const promise = runReviewAnalysis(game, evaluator, {
    ...options,
    signal: controller.signal,
  }).finally(dispose);

  return {
    promise,
    cancel: () => {
      controller.abort();
      evaluator.cancelActiveRequest?.();
      dispose();
    },
  };
}
