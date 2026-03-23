"use client";

import { useState, useCallback, useEffect } from "react";
import { Chess } from "chess.js";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Check, X, ArrowRight, RotateCcw, Trophy } from "lucide-react";
import type { DrillMove, DrillConfig, Repertoire, MoveProgress, Color } from "@/types/training";
import { useTrainingStore } from "@/store/trainingStore";
import { buildDrillSequence, validateUserMove, calculateDrillScore } from "@/lib/training-engine";

interface DrillPanelProps {
  repertoire: Repertoire;
  config: DrillConfig;
  onComplete?: (score: number, total: number) => void;
}

export function DrillPanel({ repertoire, config, onComplete }: DrillPanelProps) {
  const progress = useTrainingStore((s) => s.progress);
  const updateProgress = useTrainingStore((s) => s.updateProgress);

  const [sequence, setSequence] = useState<DrillMove[]>([]);
  const [expectedMoves, setExpectedMoves] = useState<Map<number, string>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentFen, setCurrentFen] = useState("");
  const [orientation, setOrientation] = useState<Color>(config.color);
  const [phase, setPhase] = useState<"loading" | "playing" | "correct" | "wrong" | "completed">("loading");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [highlights, setHighlights] = useState<{ square: string; color: string }[]>([]);
  const [arrows, setArrows] = useState<{ from: string; to: string; color: string }[]>([]);

  useEffect(() => {
    const { moves, expectedUserMoves } = buildDrillSequence(
      repertoire,
      config.color,
      config.maxDepth,
      progress
    );
    setSequence(moves);
    setExpectedMoves(expectedUserMoves);
    setCurrentIndex(0);
    setScore(0);
    setTotalAttempts(0);
    setHighlights([]);
    setArrows([]);

    if (moves.length > 0) {
      setCurrentFen(moves[0].fen);
      advanceToFirstUserMove(moves, expectedUserMoves);
    }
  }, [repertoire, config, progress]);

  const advanceToFirstUserMove = (moves: DrillMove[], expected: Map<number, string>) => {
    let idx = 0;
    while (idx < moves.length && !expected.has(idx)) {
      idx++;
    }

    if (idx >= moves.length) {
      setPhase("completed");
      return;
    }

    setCurrentIndex(idx);
    setCurrentFen(moves[idx].fen);
    setPhase("playing");
    setHighlights([]);
    setArrows([]);
  };

  const handleMove = useCallback(
    (from: string, to: string) => {
      if (phase !== "playing") return false;

      const expected = expectedMoves.get(currentIndex);
      if (!expected) return false;

      const game = new Chess(currentFen);
      try {
        const move = game.move({ from, to, promotion: "q" });
        if (!move) return false;

        const userSan = move.san;
        const result = validateUserMove(currentFen, userSan, expected);
        setTotalAttempts((t) => t + 1);

        if (result.correct) {
          setPhase("correct");
          setFeedback(result.feedback);
          setScore((s) => s + 1);
          updateProgress(currentFen, expected, true);

          const moveTo = expected.replace(/[+#xKQRBN]/g, "").slice(-2);
          setHighlights([{ square: moveTo, color: "rgba(16, 185, 129, 0.4)" }]);

          setTimeout(() => {
            advanceToNext();
          }, 800);
        } else {
          setPhase("wrong");
          setFeedback(result.feedback);
          updateProgress(currentFen, expected, false);

          setHighlights([
            { square: to, color: "rgba(239, 68, 68, 0.4)" },
          ]);

          const expectedMove = new Chess(currentFen).move(expected);
          if (expectedMove) {
            setArrows([{
              from: expectedMove.from,
              to: expectedMove.to,
              color: "#10B981",
            }]);
          }
        }

        return false;
      } catch {
        return false;
      }
    },
    [phase, currentFen, currentIndex, expectedMoves, updateProgress]
  );

  const advanceToNext = () => {
    setHighlights([]);
    setArrows([]);

    let nextIdx = currentIndex + 1;
    while (nextIdx < sequence.length && !expectedMoves.has(nextIdx)) {
      nextIdx++;
    }

    if (nextIdx >= sequence.length) {
      setPhase("completed");
      onComplete?.(score + 1, totalAttempts + 1);
      return;
    }

    setCurrentIndex(nextIdx);
    setCurrentFen(sequence[nextIdx].fen);
    setPhase("playing");
    setFeedback("");
  };

  const handleContinueAfterWrong = () => {
    const expected = expectedMoves.get(currentIndex);
    if (expected) {
      updateProgress(currentFen, expected, true);
    }
    advanceToNext();
  };

  const handleRetry = () => {
    setPhase("playing");
    setFeedback("");
    setHighlights([]);
    setArrows([]);
  };

  const handleRestart = () => {
    const { moves, expectedUserMoves } = buildDrillSequence(
      repertoire,
      config.color,
      config.maxDepth,
      progress
    );
    setSequence(moves);
    setExpectedMoves(expectedUserMoves);
    setCurrentIndex(0);
    setScore(0);
    setTotalAttempts(0);
    setHighlights([]);
    setArrows([]);

    if (moves.length > 0) {
      setCurrentFen(moves[0].fen);
      advanceToFirstUserMove(moves, expectedUserMoves);
    }
  };

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-muted-foreground">Cargando secuencia...</div>
      </div>
    );
  }

  if (phase === "completed") {
    const result = calculateDrillScore(totalAttempts, score);
    return (
      <div className="text-center p-8">
        <Trophy className={cn("w-16 h-16 mx-auto mb-4", result.color)} />
        <h3 className="text-2xl font-bold mb-2">¡Drill Completado!</h3>
        <div className={cn("text-5xl font-bold mb-2", result.color)}>
          {result.grade}
        </div>
        <p className="text-muted-foreground mb-1">
          {score} de {totalAttempts} correctos ({result.percent}%)
        </p>
        <Button onClick={handleRestart} className="mt-6">
          <RotateCcw className="w-4 h-4 mr-2" />
          Repetir Drill
        </Button>
      </div>
    );
  }

  const currentMove = sequence[currentIndex];
  const moveNumber = currentMove ? Math.floor((currentMove.ply - 1) / 2) + 1 : 0;
  const isWhitePly = currentMove ? currentMove.ply % 2 === 1 : true;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Movimiento {totalAttempts + 1} — Jugada {moveNumber}
          {isWhitePly ? "." : "..."}
        </div>
        <div className="text-sm font-mono">
          <span className="text-accent-green">{score}</span>
          <span className="text-muted-foreground">/{totalAttempts || "?"}</span>
        </div>
      </div>

      <div className="h-1.5 bg-background-tertiary rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent-blue to-accent-purple transition-all duration-500"
          style={{
            width: `${sequence.length > 0 ? ((currentIndex + 1) / sequence.length) * 100 : 0}%`,
          }}
        />
      </div>

      <div className="flex justify-center">
        <ChessBoard
          position={currentFen}
          onMove={handleMove}
          boardWidth={420}
          orientation={orientation}
          interactive={phase === "playing"}
          highlights={highlights}
          arrows={arrows}
        />
      </div>

      {phase === "playing" && (
        <div className="text-center text-muted-foreground text-sm">
          {currentMove?.comment || "Tu turno — juega la jugada teórica correcta"}
        </div>
      )}

      {phase === "correct" && (
        <div className="flex items-center justify-center gap-3 p-3 bg-accent-green/10 rounded-lg">
          <Check className="w-5 h-5 text-accent-green" />
          <span className="text-accent-green font-medium">{feedback}</span>
        </div>
      )}

      {phase === "wrong" && (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-3 p-3 bg-accent-red/10 rounded-lg">
            <X className="w-5 h-5 text-accent-red" />
            <span className="text-accent-red font-medium">{feedback}</span>
          </div>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={handleRetry}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Reintentar
            </Button>
            <Button size="sm" onClick={handleContinueAfterWrong}>
              <ArrowRight className="w-4 h-4 mr-1" />
              Continuar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
