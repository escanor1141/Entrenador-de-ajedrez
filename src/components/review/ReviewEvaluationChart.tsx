"use client";

import type { ReviewEvaluationPoint } from "@/lib/review-ux";
import { cn } from "@/lib/utils";
import { BarChart3, Circle } from "lucide-react";

interface ReviewEvaluationChartProps {
  points: ReviewEvaluationPoint[];
}

const WIDTH = 1000;
const HEIGHT = 280;
const PADDING_X = 64;
const PADDING_Y = 32;

export function ReviewEvaluationChart({ points }: ReviewEvaluationChartProps) {
  const readyScores = points.flatMap((point) => (point.score === null ? [] : [point.score]));
  const maxAbsScore = Math.max(100, ...readyScores.map((score) => Math.abs(score)));
  const scoreRange = maxAbsScore * 1.2;
  const plotHeight = HEIGHT - PADDING_Y * 2;
  const plotWidth = WIDTH - PADDING_X * 2;
  const centerY = PADDING_Y + plotHeight / 2;

  const scoreToY = (score: number) => {
    const normalized = Math.max(-scoreRange, Math.min(scoreRange, score));
    const progress = (normalized + scoreRange) / (scoreRange * 2);
    return PADDING_Y + plotHeight - progress * plotHeight;
  };

  const pointCount = Math.max(points.length, 1);
  const pointToX = (index: number) =>
    PADDING_X + (pointCount === 1 ? plotWidth / 2 : (index * plotWidth) / (pointCount - 1));

  const segments = buildPathSegments(points, pointToX, scoreToY);

  return (
    <section className="glass-card p-5 card-hover">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-accent-blue" />
        <div>
          <h2 className="text-lg font-semibold">Gráfico de evaluación</h2>
          <p className="text-sm text-muted-foreground">Puntos listos con score real; pendientes y errores quedan como marcadores de fallback.</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full overflow-visible">
            <defs>
              <linearGradient id="review-eval-line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgb(59 130 246)" />
                <stop offset="100%" stopColor="rgb(139 92 246)" />
              </linearGradient>
            </defs>

            <rect x="0" y="0" width={WIDTH} height={HEIGHT} rx="20" className="fill-background-secondary/50" />
            <line x1={PADDING_X} x2={WIDTH - PADDING_X} y1={centerY} y2={centerY} className="stroke-border" strokeWidth="1.2" />

            {[-scoreRange, 0, scoreRange].map((tickValue) => {
              const y = scoreToY(tickValue);
              return (
                <g key={tickValue}>
                  <line x1={PADDING_X} x2={WIDTH - PADDING_X} y1={y} y2={y} className="stroke-border/40" strokeDasharray="5 8" strokeWidth="1" />
                  <text x={18} y={y + 4} className="fill-muted-foreground text-[11px] font-medium">
                    {formatScoreTick(tickValue)}
                  </text>
                </g>
              );
            })}

            {segments.map((segment, index) => (
              <path key={`${segment.kind}-${index}`} d={segment.d} fill="none" stroke="url(#review-eval-line)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            ))}

            {points.map((point, index) => {
              const x = pointToX(index);
              const y = point.score === null ? centerY : scoreToY(point.score);
              const isReady = point.state === "ready";
              const isError = point.state === "error";
              const fill = isReady ? classificationFill(point.classification) : "rgb(26 26 31)";
              const stroke = isReady ? classificationStroke(point.classification) : isError ? "rgb(239 68 68)" : "rgb(156 163 175)";

              return (
                <g key={point.ply}>
                  <circle cx={x} cy={y} r={isReady ? 7 : 6} fill={fill} stroke={stroke} strokeWidth="2" />
                  <title>{`${point.label} · ${point.scoreLabel}`}</title>
                  {isError ? (
                    <text x={x} y={y + 4} textAnchor="middle" className="fill-accent-red text-[10px] font-bold">
                      ×
                    </text>
                  ) : null}
                  {shouldShowTickLabel(point.ply, points.length) ? (
                    <text x={x} y={HEIGHT - 10} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                      {point.label}
                    </text>
                  ) : null}
                  <text x={x} y={y - 14} textAnchor="middle" className="fill-foreground text-[11px] font-medium">
                    {isReady ? point.scoreLabel : point.state === "error" ? "Error" : "Pend."}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <LegendPill label="Listo" className="border-accent-green/30 bg-accent-green/10 text-accent-green" />
        <LegendPill label="Pendiente" className="border-border bg-background-secondary/70 text-muted-foreground" />
        <LegendPill label="Error" className="border-accent-red/30 bg-accent-red/10 text-accent-red" />
        <span className="inline-flex items-center gap-1.5">
          <Circle className="h-3 w-3 fill-foreground text-foreground" />
          Score desde la perspectiva de blancas
        </span>
      </div>
    </section>
  );
}

interface Segment {
  kind: "ready";
  d: string;
}

function buildPathSegments(
  points: ReviewEvaluationPoint[],
  pointToX: (index: number) => number,
  scoreToY: (score: number) => number
): Segment[] {
  const segments: Segment[] = [];
  let currentPath = "";

  points.forEach((point, index) => {
    if (point.score === null) {
      if (currentPath) {
        segments.push({ kind: "ready", d: currentPath });
        currentPath = "";
      }

      return;
    }

    const x = pointToX(index);
    const y = scoreToY(point.score);
    currentPath = currentPath ? `${currentPath} L ${x} ${y}` : `M ${x} ${y}`;
  });

  if (currentPath) {
    segments.push({ kind: "ready", d: currentPath });
  }

  return segments;
}

function formatScoreTick(score: number): string {
  if (score === 0) {
    return "0.00";
  }

  return `${score > 0 ? "+" : ""}${(score / 100).toFixed(2)}`;
}

function shouldShowTickLabel(ply: number, totalPoints: number): boolean {
  return ply === 1 || ply === totalPoints || ply % 2 === 1;
}

function classificationFill(classification: ReviewEvaluationPoint["classification"]): string {
  switch (classification) {
    case "best":
      return "rgb(16 185 129 / 0.18)";
    case "good":
      return "rgb(59 130 246 / 0.18)";
    case "inaccuracy":
      return "rgb(245 158 11 / 0.18)";
    case "mistake":
      return "rgb(249 115 22 / 0.18)";
    case "blunder":
      return "rgb(239 68 68 / 0.18)";
    default:
      return "rgb(26 26 31)";
  }
}

function classificationStroke(classification: ReviewEvaluationPoint["classification"]): string {
  switch (classification) {
    case "best":
      return "rgb(16 185 129)";
    case "good":
      return "rgb(59 130 246)";
    case "inaccuracy":
      return "rgb(245 158 11)";
    case "mistake":
      return "rgb(249 115 22)";
    case "blunder":
      return "rgb(239 68 68)";
    default:
      return "rgb(107 114 128)";
  }
}

function LegendPill({ label, className }: { label: string; className: string }) {
  return <span className={cn("rounded-full border px-2.5 py-1", className)}>{label}</span>;
}
