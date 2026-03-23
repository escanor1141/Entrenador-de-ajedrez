import { Chess } from "chess.js";
import type { ParsedGame } from "@/types";
import { getGamePhase } from "@/lib/utils";

export const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export interface ReviewTimelineStep {
  ply: number;
  san: string;
  notation: string;
  fen: string;
  sideToMove: "white" | "black";
}

export interface ReviewSummary {
  currentPly: number;
  totalPlies: number;
  progress: number;
  phase: ReturnType<typeof getGamePhase>;
  sideToMove: "white" | "black";
  currentMove: string;
  openingLabel: string;
}

export function buildReviewTimeline(game: ParsedGame): ReviewTimelineStep[] {
  const chess = new Chess();
  const timeline: ReviewTimelineStep[] = [
    {
      ply: 0,
      san: "",
      notation: "Inicio",
      fen: STARTING_FEN,
      sideToMove: "white",
    },
  ];

  for (const move of game.moves) {
    const applied = chess.move(move.san);

    if (!applied) {
      break;
    }

    timeline.push({
      ply: move.ply,
      san: move.san,
      notation: formatMoveNotation(move.ply, move.san),
      fen: chess.fen(),
      sideToMove: move.ply % 2 === 1 ? "black" : "white",
    });
  }

  return timeline;
}

export function getReviewSummary(game: ParsedGame, currentPly: number): ReviewSummary {
  const totalPlies = game.moves.length;
  const clampedPly = Math.max(0, Math.min(currentPly, totalPlies));
  const sideToMove: ReviewSummary["sideToMove"] = clampedPly % 2 === 0 ? "white" : "black";
  const currentMove =
    clampedPly === 0 ? "Inicio" : formatMoveNotation(clampedPly, game.moves[clampedPly - 1]?.san ?? "");

  return {
    currentPly: clampedPly,
    totalPlies,
    progress: totalPlies > 0 ? Math.round((clampedPly / totalPlies) * 100) : 0,
    phase: getGamePhase(clampedPly),
    sideToMove,
    currentMove,
    openingLabel: game.eco ? `${game.eco}${game.openingName ? ` · ${game.openingName}` : ""}` : "MVP",
  };
}

export function getReviewCommentary(game: ParsedGame, currentPly: number, reviewStarted: boolean): string {
  if (!reviewStarted) {
    return "MVP: no hay IA generativa todavía. Tocá Empezar revisión para recorrer la partida paso a paso.";
  }

  if (currentPly === 0) {
    return `Arrancamos desde la posición inicial. ${game.white} juega con blancas y ${game.black} con negras.`;
  }

  if (currentPly >= game.moves.length) {
    return "Llegaste al final de la partida. Volvé con Inicio o Prev para revisar el cierre.";
  }

  const move = game.moves[currentPly - 1];
  const phase = getGamePhase(currentPly);

  return `Movimiento ${formatMoveNotation(move.ply, move.san)}. Fase ${phase}. MVP: comentario base, sin narrativa generativa.`;
}

function formatMoveNotation(ply: number, san: string): string {
  const moveNumber = Math.ceil(ply / 2);
  return ply % 2 === 1 ? `${moveNumber}. ${san}` : `${moveNumber}... ${san}`;
}
