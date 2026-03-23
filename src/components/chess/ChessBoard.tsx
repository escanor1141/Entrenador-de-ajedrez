"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Chessboard } from "react-chessboard";
import { Chess, type Square } from "chess.js";
import { cn } from "@/lib/utils";

type Arrow = [Square, Square, string?];

interface HighlightSquare {
  square: string;
  color: string;
}

interface ArrowProp {
  from: string;
  to: string;
  color: string;
}

interface ChessBoardProps {
  position?: string;
  onMove?: (from: string, to: string, promotion?: string) => boolean;
  boardWidth?: number;
  orientation?: "white" | "black";
  interactive?: boolean;
  className?: string;
  onPositionChange?: (fen: string) => void;
  highlights?: HighlightSquare[];
  arrows?: ArrowProp[];
}

export function ChessBoard({
  position = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  onMove,
  boardWidth = 400,
  orientation = "white",
  interactive = true,
  className,
  onPositionChange,
  highlights = [],
  arrows = [],
}: ChessBoardProps) {
  const gameRef = useRef<Chess | null>(null);
  const [internalPosition, setInternalPosition] = useState(position);

  if (!gameRef.current) {
    const chess = new Chess();
    try {
      chess.load(position);
    } catch {
      chess.reset();
    }
    gameRef.current = chess;
  }

  const game = gameRef.current;

  useEffect(() => {
    if (position !== internalPosition) {
      try {
        game.load(position);
        setInternalPosition(position);
      } catch {
        // ignore invalid FEN
      }
    }
  }, [position, game, internalPosition]);

  const handleDrop = useCallback(
    (sourceSquare: string, targetSquare: string, piece: string) => {
      if (!interactive) return false;

      try {
        const move = game.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: piece[1]?.toLowerCase() || "q",
        });

        if (move === null) return false;

        const newFen = game.fen();
        setInternalPosition(newFen);
        onPositionChange?.(newFen);

        if (onMove) {
          return onMove(sourceSquare, targetSquare, move.promotion);
        }

        return true;
      } catch {
        return false;
      }
    },
    [game, interactive, onMove, onPositionChange]
  );

  const customSquareStyles: Record<string, React.CSSProperties> = {};
  for (const h of highlights) {
    customSquareStyles[h.square] = {
      backgroundColor: h.color,
    };
  }

  const chessboardArrows: Arrow[] | undefined = useMemo(() => {
    if (arrows.length === 0) return undefined;
    return arrows.map((a) => [a.from as Square, a.to as Square, a.color] as Arrow);
  }, [arrows]);

  return (
    <div className={cn("rounded-lg overflow-hidden shadow-lg", className)}>
      <Chessboard
        position={internalPosition}
        onPieceDrop={handleDrop}
        boardWidth={boardWidth}
        boardOrientation={orientation}
        customBoardStyle={{
          borderRadius: "8px",
        }}
        customDarkSquareStyle={{
          backgroundColor: "#6B4423",
        }}
        customLightSquareStyle={{
          backgroundColor: "#B58863",
        }}
        customSquareStyles={customSquareStyles}
        customArrows={chessboardArrows}
        arePiecesDraggable={interactive}
        animationDuration={100}
      />
    </div>
  );
}
