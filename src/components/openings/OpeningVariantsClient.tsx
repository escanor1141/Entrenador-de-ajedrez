"use client";

import Link from "next/link";
import { ArrowLeft, Crown, Grid2x2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { OpeningVariantCard } from "./OpeningVariantCard";
import type { OpeningVariant } from "@/types";

interface OpeningVariantsClientProps {
  username: string;
  eco: string;
  openingName: string;
  variants: OpeningVariant[];
}

export function OpeningVariantsClient({ username, eco, openingName, variants }: OpeningVariantsClientProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link href={`/openings/${username}?eco=${encodeURIComponent(eco)}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a la apertura
            </Button>
          </Link>
          <Link href={`/dashboard/${username}`}>
            <Button variant="outline" size="sm">
              Dashboard
            </Button>
          </Link>
        </div>

        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-background-secondary via-background-secondary to-background-tertiary p-6 shadow-xl md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-accent-blue">Apertura</p>
            <h1 className="text-3xl font-bold md:text-4xl">
              <span className="font-mono text-accent-blue">{eco}</span> {openingName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Variantes principales detectadas desde las partidas reales de {username}.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-background/50 px-4 py-2 text-sm text-muted-foreground">
            <Grid2x2 className="h-4 w-4 text-accent-green" />
            {variants.length} variantes principales
          </div>
        </div>

        {variants.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-background-secondary p-8 text-center text-muted-foreground">
            No hay ramas suficientes para mostrar variantes aún.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {variants.map((variant) => (
              <OpeningVariantCard key={variant.id} variant={variant} />
            ))}
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-white/10 bg-background-secondary/70 p-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 text-foreground">
            <Crown className="h-4 w-4 text-accent-yellow" />
            MVP simple: el desbloqueo se basa en umbral de partidas por rama.
          </div>
        </div>
      </div>
    </div>
  );
}
