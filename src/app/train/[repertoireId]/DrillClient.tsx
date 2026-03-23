"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTrainingStore } from "@/store/trainingStore";
import { DrillPanel } from "@/components/training/DrillPanel";
import { RepertoireTree } from "@/components/training/RepertoireTree";
import { MasteryBar } from "@/components/training/MasteryBar";
import { Button } from "@/components/ui/Button";
import { getRepertoireStats } from "@/lib/srs";
import {
  ArrowLeft,
  Settings,
  TreePine,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DrillClientProps {
  params: Promise<{ repertoireId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export function DrillClient({ params, searchParams }: DrillClientProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);

  const repertoires = useTrainingStore((s) => s.repertoires);
  const progress = useTrainingStore((s) => s.progress);
  const [showTree, setShowTree] = useState(false);

  const repertoire = repertoires.find((r) => r.id === resolvedParams.repertoireId);

  const maxDepth = typeof resolvedSearchParams.depth === "string"
    ? parseInt(resolvedSearchParams.depth) || 10
    : 10;

  const stats = useMemo(() => {
    if (!repertoire) return null;
    const allMoves = repertoire.lines.flatMap((l) => l.rootMoves);
    return getRepertoireStats(allMoves, progress);
  }, [repertoire, progress]);

  if (!repertoire) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Repertorio no encontrado</h2>
          <p className="text-muted-foreground mb-4">
            El repertorio que buscas no existe o fue eliminado
          </p>
          <Link href="/train">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Entrenamiento
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <Link href="/train">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Repertorios
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTree(!showTree)}
            >
              <TreePine className="w-4 h-4 mr-1" />
              {showTree ? "Ocultar árbol" : "Ver árbol"}
              {showTree ? (
                <ChevronUp className="w-4 h-4 ml-1" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-1" />
              )}
            </Button>

            <Link href={`/train/${repertoire.id}/settings`}>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">{repertoire.name}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span>{repertoire.color === "white" ? "⬜ Blancas" : "⬛ Negras"}</span>
            <span>{repertoire.totalMoves} jugadas</span>
            <span>Profundidad: {maxDepth}</span>
          </div>
          {stats && (
            <div className="mt-3">
              <MasteryBar stats={stats} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={cn("lg:col-span-2", showTree ? "" : "lg:col-span-3")}>
            <div className="glass-card p-6">
              <DrillPanel
                repertoire={repertoire}
                config={{
                  repertoireId: repertoire.id,
                  color: repertoire.color,
                  maxDepth,
                }}
                onComplete={(score, total) => {
                  // Session completed
                }}
              />
            </div>
          </div>

          {showTree && (
            <div className="space-y-4">
              <div className="glass-card p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <TreePine className="w-4 h-4 text-accent-blue" />
                  Árbol del Repertorio
                </h3>
                <RepertoireTree
                  moves={repertoire.lines.flatMap((l) => l.rootMoves)}
                  className="max-h-[600px]"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
