"use client";

import { cn } from "@/lib/utils";
import type { VariantMove } from "@/types";

interface VariantMoveListProps {
  moves: VariantMove[];
  selectedPathKey: string;
  onMoveSelect: (index: number) => void;
}

function formatMoveLabel(move: VariantMove): string {
  const moveNumber = Math.floor((move.ply + 1) / 2);
  return move.ply % 2 === 1 ? `${moveNumber}. ${move.san}` : `${moveNumber}... ${move.san}`;
}

export function VariantMoveList({ moves, selectedPathKey, onMoveSelect }: VariantMoveListProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-background-secondary/80 p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Secuencia</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">Jugadas de la variante</h2>
        </div>
        <span className="rounded-full border border-white/10 bg-background/50 px-3 py-1 text-xs text-muted-foreground">
          {moves.length} plies
        </span>
      </div>

      <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
        {moves.map((move, index) => {
          const isActive = move.pathKey === selectedPathKey;

          return (
            <button
              key={move.pathKey}
              type="button"
              onClick={() => onMoveSelect(index)}
              className={cn(
                "flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition-all",
                isActive
                  ? "border-accent-blue/50 bg-accent-blue/10 text-foreground shadow-[0_0_0_1px_rgba(59,130,246,0.2)]"
                  : "border-white/10 bg-background/40 text-muted-foreground hover:border-white/20 hover:bg-background/70 hover:text-foreground"
              )}
            >
              <div>
                <div className="text-sm font-medium">{formatMoveLabel(move)}</div>
                <div className="mt-1 text-xs text-muted-foreground">{move.pathKey || "Inicio de línea"}</div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>FEN</div>
                <div className="max-w-[180px] truncate font-mono">{move.fen}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
