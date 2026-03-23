"use client";

import { NotebookPen, PencilLine } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VariantMove } from "@/types";

interface VariantCommentsPanelProps {
  variantTitle: string;
  variantNote: string;
  moveComment: string;
  selectedMove: VariantMove | null;
  onVariantNoteChange: (value: string) => void;
  onMoveCommentChange: (value: string) => void;
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

export function VariantCommentsPanel({
  variantTitle,
  variantNote,
  moveComment,
  selectedMove,
  onVariantNoteChange,
  onMoveCommentChange,
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
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-background/50 px-3 py-1 text-xs text-muted-foreground">
          <NotebookPen className="h-3.5 w-3.5" />
          Autosave local
        </span>
      </div>

      <div className="space-y-4">
        <label className="block space-y-2">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
            <PencilLine className="h-4 w-4 text-accent-blue" />
            Nota de variante
          </span>
          <TextArea
            value={variantNote}
            onChange={onVariantNoteChange}
            placeholder="Ideas generales, planes o trampas de esta variante..."
            className="min-h-[160px]"
          />
        </label>

        <div className="rounded-2xl border border-white/10 bg-background/30 p-4">
          <div className="mb-3">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Jugada seleccionada</p>
            <h3 className="mt-1 text-base font-semibold text-foreground">{selectedMoveLabel}</h3>
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
