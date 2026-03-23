"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { Button } from "@/components/ui/Button";
import { ParsedGame } from "@/types";
import {
  buildReviewTimeline,
  getReviewCommentary,
  getReviewSummary,
  STARTING_FEN,
} from "@/lib/review";
import { ArrowLeft, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, PlayCircle, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewClientProps {
  username: string;
  game: ParsedGame;
}

export function ReviewClient({ username, game }: ReviewClientProps) {
  const timeline = useMemo(() => buildReviewTimeline(game), [game]);
  const [currentPly, setCurrentPly] = useState(0);
  const [reviewStarted, setReviewStarted] = useState(false);
  const [boardWidth, setBoardWidth] = useState(320);

  useEffect(() => {
    setCurrentPly(0);
    setReviewStarted(false);
  }, [game.id]);

  useEffect(() => {
    const updateBoardWidth = () => {
      const viewport = window.innerWidth;

      if (viewport < 640) {
        setBoardWidth(Math.max(280, Math.min(360, viewport - 48)));
        return;
      }

      if (viewport < 1024) {
        setBoardWidth(480);
        return;
      }

      setBoardWidth(640);
    };

    updateBoardWidth();
    window.addEventListener("resize", updateBoardWidth);

    return () => window.removeEventListener("resize", updateBoardWidth);
  }, []);

  const summary = getReviewSummary(game, currentPly);
  const boardFen = timeline[currentPly]?.fen ?? STARTING_FEN;
  const currentMove = currentPly > 0 ? timeline[currentPly] : null;
  const commentary = getReviewCommentary(game, currentPly, reviewStarted);
  const isAtStart = currentPly === 0;
  const isAtEnd = currentPly === timeline.length - 1;

  const goToStart = () => {
    setReviewStarted(true);
    setCurrentPly(0);
  };

  const goToEnd = () => {
    setReviewStarted(true);
    setCurrentPly(timeline.length - 1);
  };

  const goPrev = () => {
    setReviewStarted(true);
    setCurrentPly((value) => Math.max(0, value - 1));
  };

  const goNext = () => {
    setReviewStarted(true);
    setCurrentPly((value) => Math.min(timeline.length - 1, value + 1));
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 left-[-6rem] h-72 w-72 rounded-full bg-accent-blue/10 blur-3xl" />
        <div className="absolute bottom-0 right-[-8rem] h-96 w-96 rounded-full bg-accent-purple/10 blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/${encodeURIComponent(username)}`} className="text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-sm text-muted-foreground">Revisión de partida</p>
              <h1 className="text-xl font-semibold md:text-2xl">{game.white} vs {game.black}</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
            <span className="rounded-full border border-border bg-background-secondary px-3 py-1 text-muted-foreground">{summary.openingLabel}</span>
            <span className="rounded-full border border-border bg-background-secondary px-3 py-1">{game.result}</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-6 md:px-6 md:py-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
          <section className="glass-card p-4 md:p-6 card-hover">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Ply {summary.currentPly}/{summary.totalPlies}</p>
                <h2 className="text-lg font-semibold">Tablero de análisis</h2>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={goToStart} disabled={isAtStart}>
                  <ChevronsLeft className="mr-2 h-4 w-4" />
                  Inicio
                </Button>
                <Button variant="outline" size="sm" onClick={goPrev} disabled={isAtStart}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Prev
                </Button>
                <Button variant="outline" size="sm" onClick={goNext} disabled={isAtEnd}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToEnd} disabled={isAtEnd}>
                  Fin
                  <ChevronsRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-center">
              <ChessBoard
                position={boardFen}
                boardWidth={boardWidth}
                orientation={game.userColor}
                interactive={false}
                className="shadow-none"
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Movimiento" value={currentMove?.notation ?? "Inicio"} />
              <MetricCard label="Turno" value={summary.sideToMove === "white" ? "Blancas" : "Negras"} />
              <MetricCard label="Fase" value={summary.phase} />
              <MetricCard label="Progreso" value={`${summary.progress}%`} />
            </div>
          </section>

          <aside className="space-y-6">
            <section className="glass-card p-5 card-hover">
              <div className="mb-4 flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-accent-blue" />
                <h2 className="text-lg font-semibold">Comentarista</h2>
              </div>
              <p className="rounded-xl border border-border bg-background-secondary/80 p-4 text-sm leading-6 text-muted-foreground">
                {commentary}
              </p>
              <div className="mt-4">
                <Button className="w-full" onClick={goToStart}>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Empezar revisión
                </Button>
              </div>
            </section>

            <section className="glass-card p-5 card-hover">
              <h2 className="mb-4 text-lg font-semibold">Resumen MVP</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <SummaryTile label="Jugador" value={game.userColor === "white" ? game.white : game.black} />
                <SummaryTile label="Rival" value={game.userColor === "white" ? game.black : game.white} />
                <SummaryTile label="Resultado" value={game.result} />
                <SummaryTile label="Movs." value={String(game.moves.length)} />
              </div>
              <div className={cn("mt-4 rounded-xl border border-dashed border-border bg-background-secondary/60 p-4 text-sm text-muted-foreground")}>
                MVP: estadísticas base derivadas de la partida actual. Sin engine, sin clasificación final y sin IA generativa.
              </div>
            </section>

            <section className="glass-card p-5 card-hover">
              <h2 className="mb-3 text-lg font-semibold">Estado actual</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Posición: {summary.currentMove}</p>
                <p>Lado al mover: {summary.sideToMove === "white" ? "Blancas" : "Negras"}</p>
                <p>Resultado final: {game.result}</p>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-border bg-background-secondary/70 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

interface SummaryTileProps {
  label: string;
  value: string;
}

function SummaryTile({ label, value }: SummaryTileProps) {
  return (
    <div className="rounded-xl border border-border bg-background-secondary/70 p-3">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
