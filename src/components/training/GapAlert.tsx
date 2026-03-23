"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { GapSummary } from "@/types/training";

interface GapAlertProps {
  gaps: GapSummary[];
  onDrillLine?: (openingName: string) => void;
  className?: string;
}

export function GapAlert({ gaps, onDrillLine, className }: GapAlertProps) {
  if (gaps.length === 0) {
    return (
      <div className={cn("bg-background-secondary rounded-lg p-6 text-center", className)}>
        <div className="text-accent-green text-lg mb-2">Sin fugas detectadas</div>
        <p className="text-sm text-muted-foreground">
          Tus partidas recientes coinciden con tu repertorio
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-accent-yellow" />
        <h3 className="font-semibold">Fugas Detectadas</h3>
        <span className="text-sm text-muted-foreground">
          ({gaps.reduce((sum, g) => sum + g.totalDeviations, 0)} desviaciones)
        </span>
      </div>

      <div className="space-y-2">
        {gaps.map((gap, i) => (
          <div
            key={`${gap.openingName}-${i}`}
            className="bg-background-secondary rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-medium">{gap.openingName}</span>
                {gap.eco && (
                  <span className="font-mono text-accent-blue text-sm ml-2">
                    {gap.eco}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">
                  {gap.totalDeviations} desviaciones
                </span>
                <span className={cn(
                  "font-medium",
                  gap.lossRate >= 50 ? "text-accent-red" :
                  gap.lossRate >= 25 ? "text-accent-yellow" :
                  "text-accent-green"
                )}>
                  {gap.lossRate}% derrotas
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              {gap.deviations.slice(0, 3).map((dev, j) => (
                <div
                  key={j}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="text-muted-foreground">
                    J.{dev.deviationPly}
                  </span>
                  <span className="text-accent-green font-mono">
                    {dev.expectedMove}
                  </span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  <span className="text-accent-red font-mono">
                    {dev.actualMove}
                  </span>
                  <span className={cn(
                    "ml-auto text-xs px-2 py-0.5 rounded",
                    dev.result === "loss" ? "bg-accent-red/10 text-accent-red" :
                    dev.result === "draw" ? "bg-accent-yellow/10 text-accent-yellow" :
                    "bg-accent-green/10 text-accent-green"
                  )}>
                    {dev.result === "loss" ? "Derrota" :
                     dev.result === "draw" ? "Tablas" : "Victoria"}
                  </span>
                </div>
              ))}
              {gap.deviations.length > 3 && (
                <div className="text-xs text-muted-foreground pl-6">
                  +{gap.deviations.length - 3} más
                </div>
              )}
            </div>

            {onDrillLine && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() => onDrillLine(gap.openingName)}
              >
                Entrenar esta línea
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
