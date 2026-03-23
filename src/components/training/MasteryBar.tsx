"use client";

import { cn } from "@/lib/utils";
import type { RepertoireStats } from "@/types/training";

interface MasteryBarProps {
  stats: RepertoireStats;
  className?: string;
}

export function MasteryBar({ stats, className }: MasteryBarProps) {
  const { masteryPercent, masteredMoves, learningMoves, forgottenMoves, unseenMoves, totalMoves } = stats;

  const masteredWidth = totalMoves > 0 ? (masteredMoves / totalMoves) * 100 : 0;
  const learningWidth = totalMoves > 0 ? (learningMoves / totalMoves) * 100 : 0;
  const forgottenWidth = totalMoves > 0 ? (forgottenMoves / totalMoves) * 100 : 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Maestría del Repertorio</span>
        <span className={cn(
          "font-bold text-lg",
          masteryPercent >= 80 ? "text-accent-green" :
          masteryPercent >= 50 ? "text-accent-yellow" :
          "text-accent-red"
        )}>
          {masteryPercent}%
        </span>
      </div>

      <div className="h-3 bg-background-tertiary rounded-full overflow-hidden flex">
        <div
          className="h-full bg-accent-green transition-all duration-700"
          style={{ width: `${masteredWidth}%` }}
        />
        <div
          className="h-full bg-accent-yellow transition-all duration-700"
          style={{ width: `${learningWidth}%` }}
        />
        <div
          className="h-full bg-accent-red transition-all duration-700"
          style={{ width: `${forgottenWidth}%` }}
        />
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent-green" />
          <span>{masteredMoves} dominados</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent-yellow" />
          <span>{learningMoves} en proceso</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent-red" />
          <span>{forgottenMoves} olvidados</span>
        </div>
        {unseenMoves > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-muted" />
            <span>{unseenMoves} sin practicar</span>
          </div>
        )}
      </div>
    </div>
  );
}
