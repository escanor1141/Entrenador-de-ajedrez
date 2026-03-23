import { Chess } from "chess.js";
import type { ParsedGame, Move } from "@/types";
import type { Repertoire, RepertoireMove, GapDetectionResult, GapSummary, Color } from "@/types/training";

export function detectGaps(
  games: ParsedGame[],
  repertoires: Repertoire[]
): GapDetectionResult[] {
  const results: GapDetectionResult[] = [];

  for (const game of games) {
    for (const rep of repertoires) {
      if (rep.color !== game.userColor) continue;

      const gap = findDeviation(game, rep);
      if (gap) {
        results.push(gap);
      }
    }
  }

  return results;
}

function findDeviation(game: ParsedGame, repertoire: Repertoire): GapDetectionResult | null {
  const chess = new Chess();

  for (let i = 0; i < game.moves.length; i++) {
    const move = game.moves[i];
    const isUserTurn = isUserMove(i, game.userColor);

    if (!isUserTurn) {
      try {
        chess.move(move.san);
      } catch {
        return null;
      }
      continue;
    }

    const currentFen = chess.fen();
    const expectedMove = findExpectedMove(repertoire, currentFen, move.ply);

    if (expectedMove && expectedMove.san !== move.san) {
      const result: "win" | "loss" | "draw" = game.winner === null
        ? "draw"
        : (game.userColor === "white" && game.winner === "white") ||
          (game.userColor === "black" && game.winner === "black")
          ? "win"
          : "loss";

      return {
        gameId: game.id,
        eco: game.eco,
        openingName: game.openingName,
        deviationPly: move.ply,
        expectedMove: expectedMove.san,
        actualMove: move.san,
        result,
        playedAt: game.playedAt,
      };
    }

    try {
      chess.move(move.san);
    } catch {
      return null;
    }
  }

  return null;
}

function isUserMove(index: number, userColor: Color): boolean {
  if (userColor === "white") return index % 2 === 0;
  return index % 2 === 1;
}

function findExpectedMove(
  repertoire: Repertoire,
  fen: string,
  ply: number
): RepertoireMove | null {
  for (const line of repertoire.lines) {
    const found = searchMoveInTree(line.rootMoves, fen, ply);
    if (found) return found;
  }
  return null;
}

function searchMoveInTree(
  moves: RepertoireMove[],
  targetFen: string,
  targetPly: number
): RepertoireMove | null {
  for (const move of moves) {
    if (move.fen === targetFen && move.ply === targetPly) {
      return move;
    }
    const found = searchMoveInTree(move.children, targetFen, targetPly);
    if (found) return found;
  }
  return null;
}

export function summarizeGaps(gaps: GapDetectionResult[]): GapSummary[] {
  const grouped = new Map<string, GapDetectionResult[]>();

  for (const gap of gaps) {
    const key = gap.openingName || gap.eco || "Desconocido";
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(gap);
  }

  const summaries: GapSummary[] = [];

  for (const [name, deviations] of grouped) {
    const losses = deviations.filter((d) => d.result === "loss").length;
    summaries.push({
      openingName: name,
      eco: deviations[0].eco,
      totalDeviations: deviations.length,
      lossRate: deviations.length > 0 ? Math.round((losses / deviations.length) * 100) : 0,
      deviations,
    });
  }

  summaries.sort((a, b) => b.totalDeviations - a.totalDeviations);

  return summaries;
}

export function findRepertoireForGame(
  game: ParsedGame,
  repertoires: Repertoire[]
): Repertoire | null {
  for (const rep of repertoires) {
    if (rep.color !== game.userColor) continue;

    if (game.eco) {
      for (const line of rep.lines) {
        if (line.name.toLowerCase().includes(game.eco.toLowerCase()) ||
            (game.openingName && line.name.toLowerCase().includes(game.openingName.toLowerCase()))) {
          return rep;
        }
      }
    }

    const matches = checkMoveMatch(game, rep);
    if (matches >= 3) return rep;
  }

  return null;
}

function checkMoveMatch(game: ParsedGame, repertoire: Repertoire): number {
  const chess = new Chess();
  let matchCount = 0;

  for (let i = 0; i < Math.min(game.moves.length, 10); i++) {
    const move = game.moves[i];
    const isUser = isUserMove(i, game.userColor);

    if (isUser) {
      const fen = chess.fen();
      const found = findExpectedMove(repertoire, fen, move.ply);
      if (found && found.san === move.san) {
        matchCount++;
      }
    }

    try {
      chess.move(move.san);
    } catch {
      break;
    }
  }

  return matchCount;
}
