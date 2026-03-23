export type Color = "white" | "black";

export type Annotation = "!" | "!!" | "?" | "??" | "!?" | "?!";

export type DrillPhase = "idle" | "playing" | "correct" | "wrong" | "completed";

export type MasteryLevel = "mastered" | "learning" | "forgotten" | "unseen";

export interface RepertoireMove {
  san: string;
  uci: string;
  fen: string;
  comment?: string;
  annotation?: Annotation;
  children: RepertoireMove[];
  ply: number;
}

export interface RepertoireLine {
  id: string;
  name: string;
  color: Color;
  rootMoves: RepertoireMove[];
  createdAt: number;
}

export interface Repertoire {
  id: string;
  name: string;
  color: Color;
  lines: RepertoireLine[];
  importedAt: number;
  pgnSource?: string;
  totalMoves: number;
}

export interface MoveProgress {
  key: string;
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextReview: number;
  lastReview: number;
  correctCount: number;
  totalCount: number;
}

export interface DrillConfig {
  repertoireId: string;
  color: Color;
  maxDepth: number;
  lineId?: string;
}

export interface DrillMove {
  fen: string;
  san: string;
  ply: number;
  isUserMove: boolean;
  comment?: string;
  annotation?: Annotation;
}

export interface TrainingSession {
  id: string;
  repertoireId: string;
  color: Color;
  currentFen: string;
  moveHistory: DrillMove[];
  currentIndex: number;
  score: number;
  totalMoves: number;
  maxDepth: number;
  startedAt: number;
  completedAt?: number;
}

export interface DrillState {
  phase: DrillPhase;
  currentMove: DrillMove | null;
  expectedSan: string | null;
  userSan: string | null;
  feedback: string | null;
}

export interface GapDetectionResult {
  gameId: string;
  eco?: string;
  openingName?: string;
  deviationPly: number;
  expectedMove: string;
  actualMove: string;
  result: "win" | "loss" | "draw";
  playedAt: string;
}

export interface GapSummary {
  openingName: string;
  eco?: string;
  totalDeviations: number;
  lossRate: number;
  deviations: GapDetectionResult[];
}

export interface RepertoireStats {
  totalMoves: number;
  masteredMoves: number;
  learningMoves: number;
  forgottenMoves: number;
  unseenMoves: number;
  masteryPercent: number;
}

export interface PgnParseResult {
  success: boolean;
  repertoires: RepertoireLine[];
  errors: string[];
  warnings: string[];
}
