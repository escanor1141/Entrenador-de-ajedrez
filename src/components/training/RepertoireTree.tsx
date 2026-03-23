"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMasteryLevel } from "@/lib/srs";
import { useTrainingStore } from "@/store/trainingStore";
import type { RepertoireMove, MasteryLevel } from "@/types/training";

interface RepertoireTreeProps {
  moves: RepertoireMove[];
  onMoveClick?: (move: RepertoireMove) => void;
  className?: string;
}

const MASTERY_COLORS: Record<MasteryLevel, { bg: string; text: string; dot: string }> = {
  mastered: { bg: "bg-accent-green/10", text: "text-accent-green", dot: "bg-accent-green" },
  learning: { bg: "bg-accent-yellow/10", text: "text-accent-yellow", dot: "bg-accent-yellow" },
  forgotten: { bg: "bg-accent-red/10", text: "text-accent-red", dot: "bg-accent-red" },
  unseen: { bg: "", text: "text-muted-foreground", dot: "bg-muted" },
};

function TreeNode({
  move,
  depth,
  onMoveClick,
}: {
  move: RepertoireMove;
  depth: number;
  onMoveClick?: (move: RepertoireMove) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const progress = useTrainingStore((s) => s.progress);
  const key = `${move.fen.split(" ").slice(0, 4).join(" ")}:${move.san}`;
  const level = getMasteryLevel(progress[key]);
  const colors = MASTERY_COLORS[level];

  const accuracy = progress[key] && progress[key].totalCount > 0
    ? Math.round((progress[key].correctCount / progress[key].totalCount) * 100)
    : null;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer transition-colors text-sm",
          colors.bg || "hover:bg-background-secondary"
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => onMoveClick?.(move)}
      >
        {move.children.length > 0 ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-background-tertiary rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        <div className={cn("w-2 h-2 rounded-full", colors.dot)} />

        <span className="font-mono text-muted-foreground text-xs">
          {move.ply % 2 === 1 ? `${Math.floor((move.ply - 1) / 2) + 1}.` : ""}
        </span>
        <span className={cn("font-medium", colors.text)}>{move.san}</span>

        {move.annotation && (
          <span className={cn(
            "text-xs font-bold",
            move.annotation === "!" ? "text-accent-green" :
            move.annotation === "!!" ? "text-accent-green" :
            move.annotation === "?" ? "text-accent-red" :
            move.annotation === "??" ? "text-accent-red" :
            "text-accent-yellow"
          )}>
            {move.annotation}
          </span>
        )}

        {move.comment && (
          <span className="text-xs text-muted-foreground truncate max-w-[120px]">
            {move.comment}
          </span>
        )}

        <div className="flex-1" />

        {accuracy !== null && (
          <span className={cn("text-xs font-mono", colors.text)}>
            {accuracy}%
          </span>
        )}
      </div>

      {isExpanded && move.children.length > 0 && (
        <div>
          {move.children.map((child, i) => (
            <TreeNode
              key={`${child.san}-${i}`}
              move={child}
              depth={depth + 1}
              onMoveClick={onMoveClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function RepertoireTree({ moves, onMoveClick, className }: RepertoireTreeProps) {
  return (
    <div className={cn("bg-background-secondary rounded-lg p-3 overflow-auto max-h-[500px] scrollbar-thin", className)}>
      {moves.length === 0 ? (
        <div className="text-center text-muted-foreground py-8 text-sm">
          No hay movimientos en el repertorio
        </div>
      ) : (
        moves.map((move, i) => (
          <TreeNode
            key={`${move.san}-${i}`}
            move={move}
            depth={0}
            onMoveClick={onMoveClick}
          />
        ))
      )}

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent-green" />
          Dominado
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent-yellow" />
          En proceso
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent-red" />
          Olvidado
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-muted" />
          Sin practicar
        </div>
      </div>
    </div>
  );
}
