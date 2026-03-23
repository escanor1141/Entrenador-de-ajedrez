"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { validatePgnFormat } from "@/lib/pgn-parser";
import { Button } from "@/components/ui/Button";
import { useTrainingStore } from "@/store/trainingStore";
import type { Color } from "@/types/training";

interface PgnImportProps {
  onSuccess?: () => void;
}

export function PgnImport({ onSuccess }: PgnImportProps) {
  const [pgnText, setPgnText] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState<Color>("white");
  const [validation, setValidation] = useState<{ valid: boolean; message: string; hasVariations: boolean } | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importRepertoire = useTrainingStore((s) => s.importRepertoire);

  const handleValidate = useCallback(() => {
    const result = validatePgnFormat(pgnText);
    setValidation(result);
  }, [pgnText]);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setPgnText(content);
      const result = validatePgnFormat(content);
      setValidation(result);

      if (!name) {
        const headerMatch = content.match(/\[Opening "([^"]+)"\]/);
        const eventMatch = content.match(/\[Event "([^"]+)"\]/);
        setName(headerMatch?.[1] || eventMatch?.[1] || file.name.replace(/\.pgn$/i, ""));
      }
    };
    reader.readAsText(file);
  }, [name]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".pgn") || file.type === "text/plain")) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleImport = useCallback(() => {
    if (!pgnText.trim()) {
      setFeedback({ type: "error", message: "Ingresa un PGN válido" });
      return;
    }
    if (!name.trim()) {
      setFeedback({ type: "error", message: "Ingresa un nombre para el repertorio" });
      return;
    }

    const result = importRepertoire(pgnText, name.trim(), color);
    setFeedback({
      type: result.success ? "success" : "error",
      message: result.message,
    });

    if (result.success) {
      setPgnText("");
      setName("");
      setValidation(null);
      onSuccess?.();
    }
  }, [pgnText, name, color, importRepertoire, onSuccess]);

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
          isDragging
            ? "border-accent-blue bg-accent-blue/10"
            : "border-border hover:border-accent-blue/50"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          Arrastra un archivo PGN aquí o
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <FileText className="w-4 h-4 mr-2" />
          Seleccionar archivo
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pgn,.txt"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Nombre del repertorio</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Siciliana Najdorf"
          className="input-styled"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Juegas con</label>
        <div className="flex gap-2">
          <button
            onClick={() => setColor("white")}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg border transition-colors font-medium",
              color === "white"
                ? "border-accent-blue bg-accent-blue/20 text-accent-blue"
                : "border-border text-muted-foreground hover:border-accent-blue/50"
            )}
          >
            Blancas
          </button>
          <button
            onClick={() => setColor("black")}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg border transition-colors font-medium",
              color === "black"
                ? "border-accent-blue bg-accent-blue/20 text-accent-blue"
                : "border-border text-muted-foreground hover:border-accent-blue/50"
            )}
          >
            Negras
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium">PGN</label>
          <button
            onClick={handleValidate}
            className="text-xs text-accent-blue hover:underline"
          >
            Validar
          </button>
        </div>
        <textarea
          value={pgnText}
          onChange={(e) => {
            setPgnText(e.target.value);
            setValidation(null);
          }}
          placeholder="1. e4 c5 2. Nf3 d6 3. d4 cxd4..."
          rows={8}
          className="input-styled font-mono text-sm resize-y"
        />
      </div>

      {validation && (
        <div className={cn(
          "flex items-center gap-2 p-3 rounded-lg text-sm",
          validation.valid
            ? "bg-accent-green/10 text-accent-green"
            : "bg-accent-red/10 text-accent-red"
        )}>
          {validation.valid ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {validation.message}
        </div>
      )}

      {feedback && (
        <div className={cn(
          "flex items-center gap-2 p-3 rounded-lg text-sm",
          feedback.type === "success"
            ? "bg-accent-green/10 text-accent-green"
            : "bg-accent-red/10 text-accent-red"
        )}>
          {feedback.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}

      <Button
        onClick={handleImport}
        className="w-full"
        disabled={!pgnText.trim() || !name.trim()}
      >
        Importar Repertorio
      </Button>
    </div>
  );
}
