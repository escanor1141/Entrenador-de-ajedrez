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

export interface ReviewMoveAnalysis {
  ply: number;
  san: string;
  uci: string;
  score?: EngineScore | null;
  classification?: MoveClassification | null;
}

export interface ReviewAnalysisState {
  currentPly: number;
  totalPlies: number;
  isAnalyzing: boolean;
  moves: ReviewMoveAnalysis[];
  error?: string | null;
}
