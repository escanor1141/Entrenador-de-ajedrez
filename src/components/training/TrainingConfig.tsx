"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Play, Sliders } from "lucide-react";
import type { DrillConfig, Repertoire, Color } from "@/types/training";

interface TrainingConfigProps {
  repertoires: Repertoire[];
  config: DrillConfig;
  onConfigChange: (config: DrillConfig) => void;
  onStart: () => void;
  className?: string;
}

export function TrainingConfig({
  repertoires,
  config,
  onConfigChange,
  onStart,
  className,
}: TrainingConfigProps) {
  const selectedRep = repertoires.find((r) => r.id === config.repertoireId);

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex items-center gap-2 mb-2">
        <Sliders className="w-5 h-5 text-accent-blue" />
        <h3 className="font-semibold">Configurar Drill</h3>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Repertorio</label>
        <div className="space-y-2">
          {repertoires.map((rep) => (
            <button
              key={rep.id}
              onClick={() => onConfigChange({ ...config, repertoireId: rep.id })}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-colors",
                config.repertoireId === rep.id
                  ? "border-accent-blue bg-accent-blue/10"
                  : "border-border hover:border-accent-blue/50"
              )}
            >
              <div className="font-medium">{rep.name}</div>
              <div className="text-xs text-muted-foreground flex gap-3 mt-1">
                <span>{rep.color === "white" ? "Blancas" : "Negras"}</span>
                <span>{rep.totalMoves} jugadas</span>
                <span>{rep.lines.length} {rep.lines.length === 1 ? "línea" : "líneas"}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Profundidad máxima</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={4}
            max={20}
            value={config.maxDepth}
            onChange={(e) =>
              onConfigChange({ ...config, maxDepth: parseInt(e.target.value) })
            }
            className="flex-1 accent-accent-blue"
          />
          <span className="font-mono text-sm w-12 text-center">
            {config.maxDepth} jug.
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Hasta qué jugada practicar (total de medias jugadas)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Línea (opcional)</label>
        <select
          value={config.lineId || ""}
          onChange={(e) =>
            onConfigChange({
              ...config,
              lineId: e.target.value || undefined,
            })
          }
          className="input-styled text-sm"
          disabled={!selectedRep}
        >
          <option value="">Todas las líneas</option>
          {selectedRep?.lines.map((line) => (
            <option key={line.id} value={line.id}>
              {line.name}
            </option>
          ))}
        </select>
      </div>

      <Button
        onClick={onStart}
        className="w-full"
        disabled={!config.repertoireId}
      >
        <Play className="w-4 h-4 mr-2" />
        Iniciar Drill
      </Button>
    </div>
  );
}
