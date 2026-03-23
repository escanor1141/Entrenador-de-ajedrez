"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Grid2x2, RotateCcw } from "lucide-react";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { Button } from "@/components/ui/Button";
import { cn, calculateWinrate } from "@/lib/utils";
import { useOpeningVariantStore } from "@/store/openingVariantStore";
import type { OpeningVariant, VariantMove } from "@/types";
import { VariantCommentsPanel } from "./VariantCommentsPanel";
import { VariantMoveList } from "./VariantMoveList";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

interface OpeningVariantDetailClientProps {
  username: string;
  eco: string;
  openingName: string;
  variant: OpeningVariant;
}

function getMoveLabel(move: VariantMove | null): string {
  if (!move) {
    return "Sin jugada seleccionada";
  }

  const moveNumber = Math.floor((move.ply + 1) / 2);
  return move.ply % 2 === 1 ? `${moveNumber}. ${move.san}` : `${moveNumber}... ${move.san}`;
}

export function OpeningVariantDetailClient({ username, eco, openingName, variant }: OpeningVariantDetailClientProps) {
  const variantStorageKey = `${username}:${variant.id}`;
  const [selectedIndex, setSelectedIndex] = useState(variant.moves.length > 0 ? 0 : -1);
  const [boardWidth, setBoardWidth] = useState(360);

  useEffect(() => {
    setSelectedIndex(variant.moves.length > 0 ? 0 : -1);
  }, [variant.id, variant.moves.length]);

  useEffect(() => {
    const updateBoardWidth = () => {
      const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 360;
      setBoardWidth(Math.min(520, Math.max(280, viewportWidth - 48)));
    };

    updateBoardWidth();
    window.addEventListener("resize", updateBoardWidth);

    return () => window.removeEventListener("resize", updateBoardWidth);
  }, []);

  const selectedMove = useMemo(
    () => (selectedIndex >= 0 ? variant.moves[selectedIndex] ?? null : null),
    [selectedIndex, variant.moves]
  );

  const variantNote = useOpeningVariantStore((state) => state.variants[variantStorageKey]?.variantNote ?? "");
  const moveComment = useOpeningVariantStore((state) =>
    selectedMove ? state.variants[variantStorageKey]?.moveComments[selectedMove.pathKey] ?? "" : ""
  );
  const setVariantNote = useOpeningVariantStore((state) => state.setVariantNote);
  const setMoveComment = useOpeningVariantStore((state) => state.setMoveComment);

  const canGoPrev = selectedIndex > 0;
  const canGoNext = selectedIndex >= 0 && selectedIndex < variant.moves.length - 1;
  const currentFen = selectedMove?.fen ?? STARTING_FEN;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link href={`/openings/${username}?eco=${encodeURIComponent(eco)}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a la apertura
            </Button>
          </Link>
          <Link href={`/openings/${username}/${eco}/variants`}>
            <Button variant="outline" size="sm">
              <Grid2x2 className="mr-2 h-4 w-4" />
              Variantes
            </Button>
          </Link>
        </div>

        <div className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-br from-background-secondary via-background-secondary to-background-tertiary p-6 shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.3em] text-accent-blue">Detalle de variante</p>
              <h1 className="text-3xl font-bold md:text-4xl">
                <span className="font-mono text-accent-blue">{eco}</span> {openingName}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{variant.title} · {variant.lineText}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-background/50 px-4 py-3 text-sm text-muted-foreground">
                <div className="text-xs uppercase tracking-[0.2em]">Partidas</div>
                <div className="mt-1 text-lg font-semibold text-foreground">{variant.games}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-background/50 px-4 py-3 text-sm text-muted-foreground">
                <div className="text-xs uppercase tracking-[0.2em]">Winrate</div>
                <div className="mt-1 text-lg font-semibold text-accent-green">{calculateWinrate(variant.wins, variant.games).toFixed(1)}%</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-background/50 px-4 py-3 text-sm text-muted-foreground">
                <div className="text-xs uppercase tracking-[0.2em]">Comentario</div>
                <div className="mt-1 text-lg font-semibold text-foreground">Autosave local</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(320px,0.8fr)]">
          <section className="rounded-3xl border border-white/10 bg-background-secondary/80 p-4 shadow-lg">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Tablero</p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">{getMoveLabel(selectedMove)}</h2>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" disabled={!canGoPrev} onClick={() => setSelectedIndex((current) => Math.max(0, current - 1))} aria-label="Jugada anterior">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" disabled={!canGoNext} onClick={() => setSelectedIndex((current) => Math.min(variant.moves.length - 1, current + 1))} aria-label="Siguiente jugada">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIndex(variant.moves.length > 0 ? 0 : -1)}
                  className="hidden md:inline-flex"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reiniciar
                </Button>
              </div>
            </div>

            <div className={cn("flex justify-center rounded-2xl border border-white/10 bg-background/40 p-3", "overflow-hidden") }>
              <ChessBoard position={currentFen} boardWidth={boardWidth} interactive={false} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="rounded-full border border-white/10 bg-background/50 px-3 py-1">{variant.moves.length} movimientos</span>
              <span className="rounded-full border border-white/10 bg-background/50 px-3 py-1">Seleccionada: {selectedIndex + 1}</span>
            </div>
          </section>

          <VariantMoveList
            moves={variant.moves}
            selectedPathKey={selectedMove?.pathKey ?? ""}
            onMoveSelect={setSelectedIndex}
          />

          <VariantCommentsPanel
            variantTitle={variant.title}
            variantNote={variantNote}
            moveComment={moveComment}
            selectedMove={selectedMove}
            onVariantNoteChange={(value) => setVariantNote(variantStorageKey, value)}
            onMoveCommentChange={(value) => {
              if (selectedMove) {
                setMoveComment(variantStorageKey, selectedMove.pathKey, value);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
