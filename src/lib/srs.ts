import type { MoveProgress, MasteryLevel, RepertoireMove } from "@/types/training";

const INITIAL_EASINESS = 2.5;
const MIN_EASINESS = 1.3;
const MS_PER_DAY = 86400000;

export function createProgressKey(fen: string, san: string): string {
  const fenBase = fen.split(" ").slice(0, 4).join(" ");
  return `${fenBase}:${san}`;
}

export function createInitialProgress(key: string): MoveProgress {
  return {
    key,
    easinessFactor: INITIAL_EASINESS,
    interval: 0,
    repetitions: 0,
    nextReview: 0,
    lastReview: 0,
    correctCount: 0,
    totalCount: 0,
  };
}

export function processCorrect(progress: MoveProgress): MoveProgress {
  const now = Date.now();
  const newEF = Math.max(
    MIN_EASINESS,
    progress.easinessFactor + (0.1 - (5 - 5) * (0.08 + (5 - 5) * 0.02))
  );

  let newInterval: number;
  let newReps = progress.repetitions + 1;

  if (newReps <= 1) {
    newInterval = 1;
  } else if (newReps === 2) {
    newInterval = 6;
  } else {
    newInterval = Math.round(progress.interval * newEF);
  }

  return {
    ...progress,
    easinessFactor: newEF,
    interval: newInterval,
    repetitions: newReps,
    nextReview: now + newInterval * MS_PER_DAY,
    lastReview: now,
    correctCount: progress.correctCount + 1,
    totalCount: progress.totalCount + 1,
  };
}

export function processWrong(progress: MoveProgress): MoveProgress {
  const now = Date.now();
  const newEF = Math.max(MIN_EASINESS, progress.easinessFactor - 0.2);

  return {
    ...progress,
    easinessFactor: newEF,
    interval: 0,
    repetitions: 0,
    nextReview: now,
    lastReview: now,
    totalCount: progress.totalCount + 1,
  };
}

export function getMasteryLevel(progress: MoveProgress | undefined): MasteryLevel {
  if (!progress || progress.totalCount === 0) return "unseen";

  const accuracy = progress.correctCount / progress.totalCount;

  if (progress.repetitions >= 3 && accuracy >= 0.8) return "mastered";
  if (accuracy < 0.5 || progress.repetitions === 0) return "forgotten";
  return "learning";
}

export function getAccuracy(progress: MoveProgress): number {
  if (progress.totalCount === 0) return 0;
  return (progress.correctCount / progress.totalCount) * 100;
}

export function isDue(progress: MoveProgress): boolean {
  return Date.now() >= progress.nextReview;
}

export function sortByPriority(a: MoveProgress, b: MoveProgress): number {
  const now = Date.now();
  const overdueA = Math.max(0, now - a.nextReview);
  const overdueB = Math.max(0, now - b.nextReview);

  if (overdueA > 0 && overdueB === 0) return -1;
  if (overdueB > 0 && overdueA === 0) return 1;

  if (a.totalCount === 0 && b.totalCount > 0) return -1;
  if (b.totalCount === 0 && a.totalCount > 0) return 1;

  return a.easinessFactor - b.easinessFactor;
}

export function getNextReviewDate(progress: MoveProgress): string {
  if (progress.nextReview === 0) return "Ahora";
  const diff = progress.nextReview - Date.now();
  if (diff <= 0) return "Ahora";
  const days = Math.ceil(diff / MS_PER_DAY);
  if (days === 1) return "Mañana";
  if (days < 7) return `${days} días`;
  if (days < 30) return `${Math.round(days / 7)} semanas`;
  return `${Math.round(days / 30)} meses`;
}

export function collectAllMoves(
  moves: RepertoireMove[],
  result: { fen: string; san: string; ply: number; comment?: string }[] = []
): { fen: string; san: string; ply: number; comment?: string }[] {
  for (const move of moves) {
    result.push({ fen: move.fen, san: move.san, ply: move.ply, comment: move.comment });
    if (move.children.length > 0) {
      collectAllMoves(move.children, result);
    }
  }
  return result;
}

export function getRepertoireStats(
  moves: RepertoireMove[],
  progressMap: Record<string, MoveProgress>
) {
  const allMoves = collectAllMoves(moves);
  let mastered = 0;
  let learning = 0;
  let forgotten = 0;
  let unseen = 0;

  for (const move of allMoves) {
    const key = createProgressKey(move.fen, move.san);
    const level = getMasteryLevel(progressMap[key]);
    if (level === "mastered") mastered++;
    else if (level === "learning") learning++;
    else if (level === "forgotten") forgotten++;
    else unseen++;
  }

  const total = allMoves.length || 1;

  return {
    totalMoves: allMoves.length,
    masteredMoves: mastered,
    learningMoves: learning,
    forgottenMoves: forgotten,
    unseenMoves: unseen,
    masteryPercent: Math.round((mastered / total) * 100),
  };
}
