import { Chess } from "chess.js";
import type { Repertoire, RepertoireMove, DrillMove, MoveProgress, Color } from "@/types/training";
import { createProgressKey, sortByPriority, collectAllMoves, isDue } from "@/lib/srs";

interface DrillSequence {
  moves: DrillMove[];
  expectedUserMoves: Map<number, string>;
}

export function buildDrillSequence(
  repertoire: Repertoire,
  color: Color,
  maxDepth: number,
  progress: Record<string, MoveProgress>
): DrillSequence {
  const line = selectLine(repertoire, color, progress);
  if (!line) {
    return { moves: [], expectedUserMoves: new Map() };
  }

  return buildSequenceFromMoves(line, color, maxDepth);
}

function selectLine(
  repertoire: Repertoire,
  color: Color,
  progress: Record<string, MoveProgress>
): RepertoireMove[] | null {
  if (repertoire.lines.length === 0) return null;

  const scoredLines = repertoire.lines.map((line) => {
    const allMoves = collectAllMoves(line.rootMoves);
    const userMoves = allMoves.filter((m) => isUserTurn(m.ply, color));
    let score = 0;

    for (const move of userMoves) {
      const key = createProgressKey(move.fen, move.san);
      const p = progress[key];
      if (!p || p.totalCount === 0) {
        score -= 100;
      } else if (isDue(p)) {
        score -= 50;
      } else {
        score += p.easinessFactor * 10;
      }
    }

    return { line: line.rootMoves, score };
  });

  scoredLines.sort((a, b) => a.score - b.score);
  return scoredLines[0].line;
}

function isUserTurn(ply: number, userColor: Color): boolean {
  const isWhiteMove = ply % 2 === 1;
  return (userColor === "white" && isWhiteMove) || (userColor === "black" && !isWhiteMove);
}

function buildSequenceFromMoves(
  rootMoves: RepertoireMove[],
  color: Color,
  maxDepth: number
): DrillSequence {
  const moves: DrillMove[] = [];
  const expectedUserMoves = new Map<number, string>();

  const game = new Chess();
  let ply = 1;

  function walk(nodes: RepertoireMove[]): boolean {
    if (nodes.length === 0 || ply > maxDepth) return false;

    const node = nodes[0];
    const fen = game.fen();
    const userMove = isUserTurn(ply, color);

    moves.push({
      fen,
      san: node.san,
      ply,
      isUserMove: userMove,
      comment: node.comment,
      annotation: node.annotation,
    });

    if (userMove) {
      expectedUserMoves.set(moves.length - 1, node.san);
    }

    const moveResult = game.move(node.san);
    if (!moveResult) return false;

    ply++;

    if (node.children.length > 0 && ply <= maxDepth) {
      const childLine = selectMainVariation(node.children);
      if (childLine.length > 0) {
        walk(childLine);
      }
    }

    return true;
  }

  walk(rootMoves);

  return { moves, expectedUserMoves };
}

function selectMainVariation(moves: RepertoireMove[]): RepertoireMove[] {
  if (moves.length === 0) return [];
  const sorted = [...moves].sort((a, b) => b.children.length - a.children.length);
  const result: RepertoireMove[] = [];
  let current: RepertoireMove | undefined = sorted[0];

  while (current) {
    result.push(current);
    if (current.children.length === 0) break;
    const nextSorted = [...current.children].sort((a, b) => b.children.length - a.children.length);
    current = nextSorted[0];
  }

  return result;
}

export function validateUserMove(
  fen: string,
  userSan: string,
  expectedSan: string
): { correct: boolean; feedback: string } {
  if (userSan === expectedSan) {
    return { correct: true, feedback: "¡Correcto!" };
  }

  return {
    correct: false,
    feedback: `Incorrecto. La jugada correcta es ${expectedSan}`,
  };
}

export function getSanFromUci(fen: string, uci: string): string | null {
  try {
    const game = new Chess(fen);
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length > 4 ? uci[4] : undefined;
    const move = game.move({ from, to, promotion });
    return move ? move.san : null;
  } catch {
    return null;
  }
}

export function getOpponentMoveFromRepertoire(
  repertoire: Repertoire,
  color: Color,
  moveHistory: string[]
): RepertoireMove | null {
  const game = new Chess();

  for (const san of moveHistory) {
    try {
      game.move(san);
    } catch {
      return null;
    }
  }

  const currentFen = game.fen();
  const nextPly = moveHistory.length + 1;

  function findMoveAtPosition(moves: RepertoireMove[]): RepertoireMove | null {
    for (const move of moves) {
      if (move.fen === currentFen) {
        return move;
      }
      const found = findMoveAtPosition(move.children);
      if (found) return found;
    }
    return null;
  }

  for (const line of repertoire.lines) {
    const found = findMoveAtPosition(line.rootMoves);
    if (found) return found;
  }

  return null;
}

export function calculateDrillScore(
  totalMoves: number,
  correctMoves: number
): { percent: number; grade: string; color: string } {
  if (totalMoves === 0) return { percent: 0, grade: "-", color: "text-muted-foreground" };

  const percent = Math.round((correctMoves / totalMoves) * 100);

  if (percent >= 90) return { percent, grade: "S", color: "text-accent-green" };
  if (percent >= 75) return { percent, grade: "A", color: "text-accent-blue" };
  if (percent >= 60) return { percent, grade: "B", color: "text-accent-yellow" };
  if (percent >= 40) return { percent, grade: "C", color: "text-accent-yellow" };
  return { percent, grade: "D", color: "text-accent-red" };
}
