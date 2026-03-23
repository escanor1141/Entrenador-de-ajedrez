export type EngineScore =
  | {
      kind: "cp";
      cp: number;
    }
  | {
      kind: "mate";
      mate: number;
    };

export type MoveClassification = "best" | "good" | "inaccuracy" | "mistake" | "blunder";

export type ReviewMoveState = "pending" | "ready" | "error";

export interface ReviewMoveAnalysis {
  ply: number;
  san: string;
  uci: string;
  state: ReviewMoveState;
  score?: EngineScore | null;
  bestScore?: EngineScore | null;
  playedScore?: EngineScore | null;
  centipawnLoss?: number | null;
  classification?: MoveClassification | null;
  error?: string | null;
}

export interface ReviewAnalysisState {
  currentPly: number;
  totalPlies: number;
  isAnalyzing: boolean;
  moves: ReviewMoveAnalysis[];
  error?: string | null;
}
