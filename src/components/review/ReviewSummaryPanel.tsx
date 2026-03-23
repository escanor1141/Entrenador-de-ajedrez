"use client";

import type { ReviewAnalysisOverview } from "@/lib/review-ux";
import type { MoveClassification } from "@/types";
import { cn } from "@/lib/utils";
import { CheckCircle2, Target } from "lucide-react";

interface ReviewSummaryPanelProps {
  overview: ReviewAnalysisOverview;
}

const CLASSIFICATION_ORDER: MoveClassification[] = ["best", "good", "inaccuracy", "mistake", "blunder"];

export function ReviewSummaryPanel({ overview }: ReviewSummaryPanelProps) {
  return (
    <section className="glass-card p-5 card-hover">
      <div className="mb-4 flex items-center gap-2">
        <Target className="h-5 w-5 text-accent-purple" />
        <div>
          <h2 className="text-lg font-semibold">Resumen de revisión</h2>
          <p className="text-sm text-muted-foreground">Conteo por clasificación y precisión aproximada por color.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {CLASSIFICATION_ORDER.map((classification) => (
            <div key={classification} className="rounded-xl border border-border bg-background-secondary/70 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{labelForClassification(classification)}</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{overview.classificationCounts[classification]}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <AccuracyCard
            color="Blancas"
            accuracy={overview.whiteAccuracy.accuracy}
            averageLoss={overview.whiteAccuracy.averageCentipawnLoss}
            analyzedMoves={overview.whiteAccuracy.analyzedMoves}
          />
          <AccuracyCard
            color="Negras"
            accuracy={overview.blackAccuracy.accuracy}
            averageLoss={overview.blackAccuracy.averageCentipawnLoss}
            analyzedMoves={overview.blackAccuracy.analyzedMoves}
          />
        </div>

        <div className="rounded-xl border border-border bg-background-secondary/60 p-3 text-xs text-muted-foreground">
          Fórmula simple: <span className="text-foreground">precisión aprox. = 100 - CPL promedio / 2</span> usando solo jugadas ya analizadas.
        </div>
      </div>
    </section>
  );
}

function AccuracyCard({
  color,
  accuracy,
  averageLoss,
  analyzedMoves,
}: {
  color: string;
  accuracy: number | null;
  averageLoss: number | null;
  analyzedMoves: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-background-secondary/70 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{color}</p>
        <CheckCircle2 className={cn("h-4 w-4", accuracy === null ? "text-muted-foreground" : "text-accent-green")} />
      </div>
      <p className="text-2xl font-semibold text-foreground">{accuracy === null ? "—" : `${accuracy}%`}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {analyzedMoves > 0 && averageLoss !== null
          ? `CPL prom. ${averageLoss.toFixed(1)} · ${analyzedMoves} jugadas`
          : "Sin jugadas analizadas"}
      </p>
    </div>
  );
}

function labelForClassification(classification: MoveClassification): string {
  switch (classification) {
    case "best":
      return "Mejor";
    case "good":
      return "Buena";
    case "inaccuracy":
      return "Imprecisión";
    case "mistake":
      return "Error";
    case "blunder":
      return "Blunder";
  }
}
