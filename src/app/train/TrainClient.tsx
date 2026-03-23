"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTrainingStore } from "@/store/trainingStore";
import { PgnImport } from "@/components/training/PgnImport";
import { MasteryBar } from "@/components/training/MasteryBar";
import { RepertoireTree } from "@/components/training/RepertoireTree";
import { TrainingConfig } from "@/components/training/TrainingConfig";
import { Button } from "@/components/ui/Button";
import { getRepertoireStats } from "@/lib/srs";
import {
  Plus,
  Trash2,
  Play,
  BookOpen,
  Target,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import type { DrillConfig, Color } from "@/types/training";
import { cn } from "@/lib/utils";

export function TrainClient() {
  const router = useRouter();
  const repertoires = useTrainingStore((s) => s.repertoires);
  const progress = useTrainingStore((s) => s.progress);
  const deleteRepertoire = useTrainingStore((s) => s.deleteRepertoire);
  const resetProgress = useTrainingStore((s) => s.resetProgress);

  const [showImport, setShowImport] = useState(false);
  const [expandedRep, setExpandedRep] = useState<string | null>(null);
  const [drillConfig, setDrillConfig] = useState<DrillConfig>({
    repertoireId: "",
    color: "white",
    maxDepth: 10,
  });

  const repStats = useMemo(() => {
    const stats: Record<string, ReturnType<typeof getRepertoireStats>> = {};
    for (const rep of repertoires) {
      const allMoves = rep.lines.flatMap((l) => l.rootMoves);
      stats[rep.id] = getRepertoireStats(allMoves, progress);
    }
    return stats;
  }, [repertoires, progress]);

  const handleStartDrill = () => {
    if (!drillConfig.repertoireId) return;
    router.push(`/train/${drillConfig.repertoireId}?depth=${drillConfig.maxDepth}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Target className="w-8 h-8 text-accent-purple" />
              Entrenamiento de Repertorio
            </h1>
            <p className="text-muted-foreground mt-1">
              Repetición espaciada para dominar tus aperturas
            </p>
          </div>
          <Button onClick={() => setShowImport(!showImport)}>
            <Plus className="w-4 h-4 mr-2" />
            Importar PGN
          </Button>
        </div>

        {showImport && (
          <div className="glass-card p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent-blue" />
              Importar Nuevo Repertorio
            </h2>
            <PgnImport onSuccess={() => setShowImport(false)} />
          </div>
        )}

        {repertoires.length === 0 && !showImport ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No tienes repertorios</h2>
            <p className="text-muted-foreground mb-6">
              Importa un archivo PGN para comenzar a entrenar tus aperturas
            </p>
            <Button onClick={() => setShowImport(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Importar tu primer repertorio
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-semibold">Tus Repertorios</h2>

              {repertoires.map((rep) => {
                const stats = repStats[rep.id];
                const isExpanded = expandedRep === rep.id;

                return (
                  <div
                    key={rep.id}
                    className="glass-card overflow-hidden"
                  >
                    <div
                      className="p-5 cursor-pointer"
                      onClick={() => setExpandedRep(isExpanded ? null : rep.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{rep.name}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className={cn(
                              rep.color === "white" ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {rep.color === "white" ? "⬜ Blancas" : "⬛ Negras"}
                            </span>
                            <span>{rep.totalMoves} jugadas</span>
                            <span>{rep.lines.length} {rep.lines.length === 1 ? "línea" : "líneas"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDrillConfig({
                                ...drillConfig,
                                repertoireId: rep.id,
                                color: rep.color,
                              });
                              router.push(`/train/${rep.id}?depth=${drillConfig.maxDepth}`);
                            }}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Drill
                          </Button>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {stats && <MasteryBar stats={stats} />}
                    </div>

                    {isExpanded && (
                      <div className="border-t border-border p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm text-muted-foreground">
                            Árbol de Decisiones
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              resetProgress(rep.id);
                            }}
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Reiniciar progreso
                          </Button>
                        </div>

                        <RepertoireTree
                          moves={rep.lines.flatMap((l) => l.rootMoves)}
                        />

                        <div className="flex justify-end">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteRepertoire(rep.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="space-y-6">
              {repertoires.length > 0 && (
                <div className="glass-card p-5">
                  <TrainingConfig
                    repertoires={repertoires}
                    config={drillConfig}
                    onConfigChange={setDrillConfig}
                    onStart={handleStartDrill}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
