"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Grid2x2, RotateCcw } from "lucide-react";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { Button } from "@/components/ui/Button";
import { cn, calculateWinrate } from "@/lib/utils";
import { useOpeningVariantStore } from "@/store/openingVariantStore";
import type { OpeningVariant, VariantMove } from "@/types";
import {
  VARIANT_NOTE_KEY,
  deleteOpeningVariantComment,
  fetchOpeningVariantComments,
  saveOpeningVariantComment,
} from "@/lib/opening-variant-comments";
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
  const syncCountersRef = useRef<Record<string, number>>({});
  const syncRequestKey = useCallback((commentKey: string) => `${variantStorageKey}:${commentKey}`, [variantStorageKey]);

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

  const variantState = useOpeningVariantStore((state) => state.variants[variantStorageKey]);
  const variantNote = variantState?.variantNote.value ?? "";
  const variantNoteSyncStatus = variantState?.variantNote.syncStatus ?? (variantState ? "synced" : "idle");
  const variantNoteSyncError = variantState?.variantNote.error ?? null;
  const moveCommentEntry = selectedMove ? variantState?.moveComments[selectedMove.pathKey] : undefined;
  const moveComment = moveCommentEntry?.value ?? "";
  const moveCommentSyncStatus = moveCommentEntry?.syncStatus ?? (selectedMove ? "idle" : "idle");
  const moveCommentSyncError = moveCommentEntry?.error ?? null;
  const backendStatus = variantState?.backendStatus ?? "idle";
  const backendError = variantState?.backendError ?? null;

  const setVariantNote = useOpeningVariantStore((state) => state.setVariantNote);
  const setMoveComment = useOpeningVariantStore((state) => state.setMoveComment);
  const hydrateVariantComments = useOpeningVariantStore((state) => state.hydrateVariantComments);
  const setVariantBackendStatus = useOpeningVariantStore((state) => state.setVariantBackendStatus);
  const setCommentSyncStatus = useOpeningVariantStore((state) => state.setCommentSyncStatus);
  const markCommentSynced = useOpeningVariantStore((state) => state.markCommentSynced);

  const loadVariantComments = useCallback(async () => {
    setVariantBackendStatus(variantStorageKey, "loading");

    try {
      const comments = await fetchOpeningVariantComments({ username, eco, variantId: variant.id });
      hydrateVariantComments(variantStorageKey, comments);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load variant comments";
      setVariantBackendStatus(variantStorageKey, "error", message);
    }
  }, [eco, hydrateVariantComments, setVariantBackendStatus, username, variant.id, variantStorageKey]);

  const syncComment = useCallback(
    async (commentKey: string, rawValue: string) => {
      const requestKey = syncRequestKey(commentKey);
      const normalizedValue = rawValue.trim();
      const requestId = (syncCountersRef.current[requestKey] ?? 0) + 1;
      syncCountersRef.current[requestKey] = requestId;

      setCommentSyncStatus(variantStorageKey, commentKey, "saving");

      try {
        if (normalizedValue.length === 0) {
          await deleteOpeningVariantComment({ username, eco, variantId: variant.id, moveKey: commentKey });
        } else {
          await saveOpeningVariantComment({
            username,
            eco,
            variantId: variant.id,
            moveKey: commentKey,
            comment: normalizedValue,
          });
        }

        if (syncCountersRef.current[requestKey] !== requestId) {
          return;
        }

        const currentValue = useOpeningVariantStore.getState().variants[variantStorageKey]?.variantNote.value;
        const currentMoveValue = useOpeningVariantStore.getState().variants[variantStorageKey]?.moveComments[commentKey]?.value;
        const latestValue = commentKey === VARIANT_NOTE_KEY ? currentValue : currentMoveValue;

        if (latestValue !== rawValue) {
          return;
        }

        markCommentSynced(variantStorageKey, commentKey, normalizedValue);
      } catch (error) {
        if (syncCountersRef.current[requestKey] !== requestId) {
          return;
        }

        const message = error instanceof Error ? error.message : "Failed to sync comment";
        const currentValue = useOpeningVariantStore.getState().variants[variantStorageKey]?.variantNote.value;
        const currentMoveValue = useOpeningVariantStore.getState().variants[variantStorageKey]?.moveComments[commentKey]?.value;
        const latestValue = commentKey === VARIANT_NOTE_KEY ? currentValue : currentMoveValue;

        if (latestValue !== rawValue) {
          return;
        }

        setCommentSyncStatus(variantStorageKey, commentKey, "error", message);
      }
    },
    [eco, markCommentSynced, setCommentSyncStatus, syncRequestKey, username, variant.id, variantStorageKey]
  );

  useEffect(() => {
    void loadVariantComments();
  }, [loadVariantComments]);

  useEffect(() => {
    if (!variantState) {
      return;
    }

    if (variantNoteSyncStatus === "error" || variantNoteSyncStatus === "saving") {
      return;
    }

    if (variantNote === (variantState.variantNote.serverValue ?? "")) {
      return;
    }

    const handle = window.setTimeout(() => {
      void syncComment(VARIANT_NOTE_KEY, variantNote);
    }, 500);

    return () => window.clearTimeout(handle);
  }, [syncComment, variantNote, variantNoteSyncStatus, variantState]);

  useEffect(() => {
    if (!selectedMove || !moveCommentEntry) {
      return;
    }

    if (moveCommentSyncStatus === "error" || moveCommentSyncStatus === "saving") {
      return;
    }

    if (moveComment === moveCommentEntry.serverValue) {
      return;
    }

    const handle = window.setTimeout(() => {
      void syncComment(selectedMove.pathKey, moveComment);
    }, 500);

    return () => window.clearTimeout(handle);
  }, [moveComment, moveCommentEntry, moveCommentSyncStatus, selectedMove, syncComment]);

  const retryVariantNoteSync = useCallback(() => {
    void syncComment(VARIANT_NOTE_KEY, variantNote);
  }, [syncComment, variantNote]);

  const retryMoveCommentSync = useCallback(() => {
    if (selectedMove) {
      void syncComment(selectedMove.pathKey, moveComment);
    }
  }, [moveComment, selectedMove, syncComment]);

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
                <div className="mt-1 text-lg font-semibold text-foreground">
                  {backendStatus === "loading"
                    ? "Sincronizando"
                    : backendStatus === "error"
                      ? "Error de sync"
                      : "Sincronizado"}
                </div>
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
            variantNoteSyncStatus={variantNoteSyncStatus}
            variantNoteSyncError={variantNoteSyncError}
            moveComment={moveComment}
            moveCommentSyncStatus={moveCommentSyncStatus}
            moveCommentSyncError={moveCommentSyncError}
            selectedMove={selectedMove}
            onVariantNoteChange={(value) => setVariantNote(variantStorageKey, value)}
            onMoveCommentChange={(value) => {
              if (selectedMove) {
                setMoveComment(variantStorageKey, selectedMove.pathKey, value);
              }
            }}
            backendStatus={backendStatus}
            backendError={backendError}
            onRetryLoadComments={() => {
              void loadVariantComments();
            }}
            onRetryVariantNoteSync={retryVariantNoteSync}
            onRetryMoveCommentSync={retryMoveCommentSync}
          />
        </div>
      </div>
    </div>
  );
}
