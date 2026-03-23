"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ReviewAnalysisState } from "@/types";
import type { ReviewAnalysisOverview } from "@/lib/review-ux";
import { AlertCircle, RefreshCcw, PauseCircle, PlayCircle } from "lucide-react";

interface ReviewAnalysisStatusCardProps {
  analysis: ReviewAnalysisState;
  overview: ReviewAnalysisOverview;
  onRetryFailed: () => void;
  onCancel: () => void;
}

export function ReviewAnalysisStatusCard({ analysis, overview, onRetryFailed, onCancel }: ReviewAnalysisStatusCardProps) {
  const canRetry = !analysis.isAnalyzing && (overview.errorPlies > 0 || overview.pendingPlies > 0);

  return (
    <section className="glass-card p-5 card-hover">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Revisión progresiva</p>
          <h2 className="text-lg font-semibold">Estado global</h2>
        </div>
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-xs uppercase tracking-[0.16em]",
            overview.status === "analizando"
              ? "border-accent-blue/30 bg-accent-blue/10 text-accent-blue"
              : overview.status === "listo"
              ? "border-accent-green/30 bg-accent-green/10 text-accent-green"
              : overview.status === "cancelado"
              ? "border-accent-yellow/30 bg-accent-yellow/10 text-accent-yellow"
              : "border-accent-red/30 bg-accent-red/10 text-accent-red"
          )}
        >
          {labelForStatus(overview.status)}
        </span>
      </div>

      <div className="space-y-3">
        <div className="h-3 overflow-hidden rounded-full border border-border bg-background-secondary">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              overview.status === "analizando"
                ? "bg-gradient-to-r from-accent-blue to-accent-purple"
                : overview.status === "listo"
                ? "bg-accent-green"
                : "bg-gradient-to-r from-accent-yellow to-accent-red"
            )}
            style={{ width: `${overview.progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {overview.completedPlies}/{overview.totalPlies} jugadas procesadas
          </span>
          <span className="font-medium text-foreground">{overview.progress}%</span>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <StatusStat label="Listas" value={overview.readyPlies} tone="green" />
          <StatusStat label="Pendientes" value={overview.pendingPlies} tone="muted" />
          <StatusStat label="Errores" value={overview.errorPlies} tone="red" />
        </div>

        {analysis.error ? (
          <div className="flex items-start gap-2 rounded-xl border border-border bg-background-secondary/70 p-3 text-sm text-muted-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 text-accent-yellow" />
            <p>{analysis.error}</p>
          </div>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2">
          <ActionButton
            label="Reintentar fallidos"
            description={canRetry ? "Relanza el análisis desde cero" : "Esperá a que termine o cancelalo primero"}
            icon={<RefreshCcw className="h-4 w-4" />}
            onClick={onRetryFailed}
            disabled={!canRetry}
          />
          <ActionButton
            label="Cancelar análisis"
            description={analysis.isAnalyzing ? "Detiene el engine en curso" : "No hay análisis activo"}
            icon={<PauseCircle className="h-4 w-4" />}
            onClick={onCancel}
            disabled={!analysis.isAnalyzing}
            destructive
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <PlayCircle className="h-3.5 w-3.5" />
          <span>El progreso cuenta jugadas resueltas y fallidas; las pendientes siguen visibles en el timeline.</span>
        </div>
      </div>
    </section>
  );
}

function StatusStat({ label, value, tone }: { label: string; value: number; tone: "green" | "muted" | "red" }) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2 text-sm",
        tone === "green"
          ? "border-accent-green/30 bg-accent-green/10 text-accent-green"
          : tone === "red"
          ? "border-accent-red/30 bg-accent-red/10 text-accent-red"
          : "border-border bg-background-secondary/70 text-muted-foreground"
      )}
    >
      <p className="text-xs uppercase tracking-[0.18em] opacity-80">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

function ActionButton({ label, description, icon, onClick, disabled, destructive }: ActionButtonProps) {
  return (
    <Button
      type="button"
      variant={destructive ? "destructive" : "outline"}
      className="h-auto w-full justify-start gap-3 px-4 py-3 text-left"
      onClick={onClick}
      disabled={disabled}
    >
      <span className="mt-0.5">{icon}</span>
      <span className="flex flex-col items-start">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs font-normal opacity-80">{description}</span>
      </span>
    </Button>
  );
}

function labelForStatus(status: string): string {
  switch (status) {
    case "analizando":
      return "Analizando";
    case "listo":
      return "Listo";
    case "cancelado":
      return "Cancelado";
    case "con errores parciales":
      return "Con errores parciales";
    default:
      return "Sin jugadas";
  }
}
