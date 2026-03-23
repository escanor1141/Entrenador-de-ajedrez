import type { EngineScore, MoveClassification } from "@/types/review";

export interface ReviewClassificationThresholds {
  best: number;
  good: number;
  inaccuracy: number;
  mistake: number;
}

export const DEFAULT_REVIEW_CLASSIFICATION_THRESHOLDS = {
  best: 15,
  good: 50,
  inaccuracy: 100,
  mistake: 300,
} satisfies ReviewClassificationThresholds;

const MATE_SCORE_BASE = 1_000_000;

export function normalizeEngineScore(score: EngineScore): number {
  if (score.kind === "cp") {
    return score.cp;
  }

  const normalizedMate = MATE_SCORE_BASE - Math.abs(score.mate);
  return score.mate > 0 ? normalizedMate : -normalizedMate;
}

export function getCentipawnLoss(bestScore: EngineScore, playedScore: EngineScore): number {
  return Math.max(0, normalizeEngineScore(bestScore) - normalizeEngineScore(playedScore));
}

export function classifyCentipawnLoss(
  centipawnLoss: number,
  thresholds: ReviewClassificationThresholds = DEFAULT_REVIEW_CLASSIFICATION_THRESHOLDS
): MoveClassification {
  if (centipawnLoss <= thresholds.best) {
    return "best";
  }

  if (centipawnLoss <= thresholds.good) {
    return "good";
  }

  if (centipawnLoss <= thresholds.inaccuracy) {
    return "inaccuracy";
  }

  if (centipawnLoss <= thresholds.mistake) {
    return "mistake";
  }

  return "blunder";
}

export function classifyReviewMove(
  bestScore: EngineScore,
  playedScore: EngineScore,
  thresholds: ReviewClassificationThresholds = DEFAULT_REVIEW_CLASSIFICATION_THRESHOLDS
): MoveClassification {
  return classifyCentipawnLoss(getCentipawnLoss(bestScore, playedScore), thresholds);
}
