"use client";

import Link from "next/link";
import { Lock, Sparkles, Trophy } from "lucide-react";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { cn, formatNumber } from "@/lib/utils";
import type { OpeningVariant } from "@/types";

interface OpeningVariantCardProps {
  variant: OpeningVariant;
  username: string;
  eco: string;
}

export function OpeningVariantCard({ variant, username, eco }: OpeningVariantCardProps) {
  const detailHref = `/openings/${username}/${eco}/variants/${encodeURIComponent(variant.id)}`;

  return (
    <Link href={detailHref} className="group block">
      <article
        className={cn(
          "relative overflow-hidden rounded-2xl border border-white/10 bg-background-secondary/90 p-4 shadow-lg transition-transform duration-200 group-hover:-translate-y-1",
          variant.isUnlocked ? "hover:-translate-y-1" : "opacity-85"
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.28em] text-muted-foreground">
              Variante principal
            </p>
            <h3 className="text-lg font-semibold text-foreground">{variant.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{variant.lineText}</p>
          </div>
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
              variant.isUnlocked
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-amber-500/15 text-amber-300"
            )}
          >
            {variant.isUnlocked ? <Sparkles className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            {variant.isUnlocked ? "Desbloqueada" : `Bloqueada · ${variant.unlockThreshold}+`}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,220px)_1fr]">
          <div className="rounded-xl border border-white/10 bg-background-tertiary/80 p-2">
            <ChessBoard position={variant.fen} boardWidth={190} interactive={false} />
          </div>

          <div className="flex flex-col justify-between gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-background-tertiary/80 p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Winrate</p>
                <p className="mt-1 text-xl font-semibold text-emerald-300">{variant.winrate.toFixed(1)}%</p>
              </div>
              <div className="rounded-xl bg-background-tertiary/80 p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Partidas</p>
                <p className="mt-1 text-xl font-semibold text-foreground">{formatNumber(variant.games)}</p>
              </div>
              <div className="rounded-xl bg-background-tertiary/80 p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Estado</p>
                <p className="mt-1 flex items-center gap-2 text-xl font-semibold text-foreground">
                  <Trophy className="h-4 w-4 text-accent-yellow" />
                  {variant.isUnlocked ? "Abierta" : "Bloqueada"}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-white/10 bg-background/40 px-3 py-2 text-xs text-muted-foreground">
              {variant.isUnlocked
                ? "Acceso habilitado por frecuencia de partidas."
                : `Se desbloquea al superar ${variant.unlockThreshold} partidas en esta rama.`}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
