import { normalizeEngineScore } from "@/lib/review-evaluation";
import type { ReviewTimelineStep } from "@/lib/review";
import type {
  EngineScore,
  MoveClassification,
  ReviewAnalysisState,
  ReviewMoveAnalysis,
  ReviewMoveState,
} from "@/types";

export type ReviewAnalysisStatus = "sin jugadas" | "analizando" | "listo" | "con errores parciales" | "cancelado";

export interface ReviewColorAccuracy {
  accuracy: number | null;
  averageCentipawnLoss: number | null;
  analyzedMoves: number;
}

export interface ReviewAnalysisOverview {
  status: ReviewAnalysisStatus;
  progress: number;
  totalPlies: number;
  completedPlies: number;
  readyPlies: number;
  pendingPlies: number;
  errorPlies: number;
  classificationCounts: Record<MoveClassification, number>;
  whiteAccuracy: ReviewColorAccuracy;
  blackAccuracy: ReviewColorAccuracy;
}

export interface ReviewEvaluationPoint {
  ply: number;
  label: string;
  san: string;
  state: ReviewMoveState;
  classification: MoveClassification | null;
  score: number | null;
  scoreLabel: string;
}

const REVIEW_CLASSIFICATIONS: MoveClassification[] = ["best", "good", "inaccuracy", "mistake", "blunder"];

export function summarizeReviewAnalysis(analysis: ReviewAnalysisState): ReviewAnalysisOverview {
  const classificationCounts = createClassificationCounts();
  const whiteLosses: number[] = [];
  const blackLosses: number[] = [];

  let readyPlies = 0;
  let pendingPlies = 0;
  let errorPlies = 0;

  for (const move of analysis.moves) {
    if (move.state === "ready") {
      readyPlies += 1;

      const classification = move.classification ?? "good";
      classificationCounts[classification] += 1;

      if (typeof move.centipawnLoss === "number") {
        if (move.ply % 2 === 1) {
          whiteLosses.push(move.centipawnLoss);
        } else {
          blackLosses.push(move.centipawnLoss);
        }
      }

      continue;
    }

    if (move.state === "error") {
      errorPlies += 1;
      continue;
    }

    pendingPlies += 1;
  }

  const completedPlies = readyPlies + errorPlies;
  const totalPlies = analysis.totalPlies;
  const progress = totalPlies > 0 ? Math.round((completedPlies / totalPlies) * 100) : 0;
  const status = resolveAnalysisStatus(analysis, completedPlies, readyPlies, errorPlies);

  return {
    status,
    progress,
    totalPlies,
    completedPlies,
    readyPlies,
    pendingPlies,
    errorPlies,
    classificationCounts,
    whiteAccuracy: summarizeColorAccuracy(whiteLosses),
    blackAccuracy: summarizeColorAccuracy(blackLosses),
  };
}

export function buildReviewEvaluationSeries(
  analysis: ReviewAnalysisState,
  timeline: ReviewTimelineStep[]
): ReviewEvaluationPoint[] {
  const timelineByPly = new Map<number, ReviewTimelineStep>(timeline.map((step) => [step.ply, step]));

  return analysis.moves.map((move) => {
    const timelineStep = timelineByPly.get(move.ply);
    const score = move.state === "ready" ? toWhitePerspectiveScore(move) : null;

    return {
      ply: move.ply,
      label: timelineStep?.notation ?? formatMoveLabel(move.ply, move.san),
      san: move.san,
      state: move.state,
      classification: move.state === "ready" ? move.classification ?? "good" : null,
      score,
      scoreLabel: formatScoreLabel(move),
    };
  });
}

function resolveAnalysisStatus(
  analysis: ReviewAnalysisState,
  completedPlies: number,
  readyPlies: number,
  errorPlies: number
): ReviewAnalysisStatus {
  if (analysis.totalPlies === 0) {
    return "sin jugadas";
  }

  if (analysis.isAnalyzing) {
    return "analizando";
  }

  if (analysis.error === "Análisis cancelado") {
    return "cancelado";
  }

  if (completedPlies === analysis.totalPlies && errorPlies === 0) {
    return "listo";
  }

  if (readyPlies > 0 || errorPlies > 0) {
    return "con errores parciales";
  }

  return "con errores parciales";
}

function summarizeColorAccuracy(losses: number[]): ReviewColorAccuracy {
  if (losses.length === 0) {
    return {
      accuracy: null,
      averageCentipawnLoss: null,
      analyzedMoves: 0,
    };
  }

  const averageCentipawnLoss = losses.reduce((sum, value) => sum + value, 0) / losses.length;
  const accuracy = Math.max(0, Math.min(100, Math.round(100 - averageCentipawnLoss / 2)));

  return {
    accuracy,
    averageCentipawnLoss,
    analyzedMoves: losses.length,
  };
}

function createClassificationCounts(): Record<MoveClassification, number> {
  return REVIEW_CLASSIFICATIONS.reduce<Record<MoveClassification, number>>((counts, classification) => {
    counts[classification] = 0;
    return counts;
  }, {} as Record<MoveClassification, number>);
}

function toWhitePerspectiveScore(move: ReviewMoveAnalysis): number | null {
  if (!move.score) {
    return null;
  }

  const normalizedScore = normalizeEngineScore(move.score);
  return move.ply % 2 === 1 ? normalizedScore : -normalizedScore;
}

function formatScoreLabel(move: ReviewMoveAnalysis): string {
  if (move.state === "pending") {
    return "Pendiente";
  }

  if (move.state === "error") {
    return "Error";
  }

  if (!move.score) {
    return "Sin score";
  }

  if (move.score.kind === "cp") {
    const signedCp = move.score.cp / 100;
    return `${signedCp >= 0 ? "+" : ""}${signedCp.toFixed(2)}`;
  }

  return `${move.score.mate >= 0 ? "+" : "-"}M${Math.abs(move.score.mate)}`;
}

function formatMoveLabel(ply: number, san: string): string {
  const moveNumber = Math.ceil(ply / 2);
  return ply % 2 === 1 ? `${moveNumber}. ${san}` : `${moveNumber}... ${san}`;
}
