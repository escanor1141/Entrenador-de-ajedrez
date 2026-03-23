"use client";

import { AlertTriangle, CheckCircle2, Loader2, NotebookPen, PencilLine, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VariantMove } from "@/types";
import type { CommentSyncStatus } from "@/lib/opening-variant-comments";

interface VariantCommentsPanelProps {
  variantTitle: string;
  variantNote: string;
  variantNoteSyncStatus: CommentSyncStatus;
  variantNoteSyncError: string | null;
  moveComment: string;
  moveCommentSyncStatus: CommentSyncStatus;
  moveCommentSyncError: string | null;
  selectedMove: VariantMove | null;
  onVariantNoteChange: (value: string) => void;
  onMoveCommentChange: (value: string) => void;
  backendStatus: Exclude<CommentSyncStatus, "saving">;
  backendError: string | null;
  onRetryLoadComments: () => void;
  onRetryVariantNoteSync: () => void;
  onRetryMoveCommentSync: () => void;
}

function TextArea({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={cn(
        "min-h-[140px] w-full rounded-2xl border border-white/10 bg-background/50 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent-blue/60",
        className
      )}
    />
  );
}

function SyncBadge({
  status,
  error,
  onRetry,
}: {
  status: CommentSyncStatus;
  error: string | null;
  onRetry?: () => void;
}) {
  const label =
    status === "loading"
      ? "Cargando"
      : status === "saving"
        ? "Guardando"
        : status === "synced"
          ? "Sincronizado"
          : status === "error"
            ? "Error"
            : "Pendiente";

  const icon =
    status === "loading" || status === "saving" ? (
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
    ) : status === "synced" ? (
      <CheckCircle2 className="h-3.5 w-3.5" />
    ) : (
      <AlertTriangle className="h-3.5 w-3.5" />
    );

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs",
          status === "synced" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
          (status === "loading" || status === "saving") && "border-blue-500/20 bg-blue-500/10 text-blue-300",
          status === "error" && "border-red-500/20 bg-red-500/10 text-red-300",
          status === "idle" && "border-white/10 bg-background/50 text-muted-foreground"
        )}
      >
        {icon}
        {label}
      </span>
      {status === "error" && onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-background/50 px-3 py-1 text-xs text-muted-foreground transition hover:border-white/20 hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reintentar
        </button>
      ) : null}
      {status === "error" && error ? <span className="max-w-[180px] truncate text-xs text-red-300">{error}</span> : null}
    </div>
  );
}

export function VariantCommentsPanel({
  variantTitle,
  variantNote,
  variantNoteSyncStatus,
  variantNoteSyncError,
  moveComment,
  moveCommentSyncStatus,
  moveCommentSyncError,
  selectedMove,
  onVariantNoteChange,
  onMoveCommentChange,
  backendStatus,
  backendError,
  onRetryLoadComments,
  onRetryVariantNoteSync,
  onRetryMoveCommentSync,
}: VariantCommentsPanelProps) {
  const selectedMoveLabel = selectedMove
    ? selectedMove.ply % 2 === 1
      ? `${Math.floor((selectedMove.ply + 1) / 2)}. ${selectedMove.san}`
      : `${Math.floor((selectedMove.ply + 1) / 2)}... ${selectedMove.san}`
    : "Sin jugada seleccionada";

  return (
    <aside className="rounded-3xl border border-white/10 bg-background-secondary/80 p-4 shadow-lg">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Comentarios</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">{variantTitle}</h2>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-background/50 px-3 py-1 text-xs text-muted-foreground">
            <NotebookPen className="h-3.5 w-3.5" />
            {backendStatus === "loading"
              ? "Cargando backend"
              : backendStatus === "error"
                ? "Backend con errores"
                : "Sync activo"}
          </span>
          {backendStatus === "error" ? (
            <button
              type="button"
              onClick={onRetryLoadComments}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-background/50 px-3 py-1 text-xs text-muted-foreground transition hover:border-white/20 hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reintentar carga
            </button>
          ) : null}
        </div>
      </div>

      {backendStatus === "error" && backendError ? (
        <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {backendError}
        </div>
      ) : null}

      <div className="space-y-4">
        <label className="block space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <PencilLine className="h-4 w-4 text-accent-blue" />
              Nota de variante
            </span>
            <SyncBadge status={variantNoteSyncStatus} error={variantNoteSyncError} onRetry={onRetryVariantNoteSync} />
          </div>
          <TextArea
            value={variantNote}
            onChange={onVariantNoteChange}
            placeholder="Ideas generales, planes o trampas de esta variante..."
            className="min-h-[160px]"
          />
        </label>

        <div className="rounded-2xl border border-white/10 bg-background/30 p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Jugada seleccionada</p>
              <h3 className="mt-1 text-base font-semibold text-foreground">{selectedMoveLabel}</h3>
            </div>
            <SyncBadge status={moveCommentSyncStatus} error={moveCommentSyncError} onRetry={onRetryMoveCommentSync} />
          </div>

          <label className="block space-y-2">
            <span className="text-sm text-muted-foreground">Comentario de la jugada</span>
            <TextArea
              value={moveComment}
              onChange={onMoveCommentChange}
              placeholder={selectedMove ? "Anotá recursos, errores o planes para esta jugada..." : "Seleccioná una jugada para comentar"}
              className="min-h-[180px]"
            />
          </label>
        </div>
      </div>
    </aside>
  );
}
