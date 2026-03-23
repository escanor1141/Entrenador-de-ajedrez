import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Repertoire, MoveProgress, DrillConfig, TrainingSession, DrillMove, Color } from "@/types/training";
import { parsePgn } from "@/lib/pgn-parser";
import { createProgressKey, processCorrect, processWrong, createInitialProgress } from "@/lib/srs";

interface TrainingStore {
  repertoires: Repertoire[];
  progress: Record<string, MoveProgress>;
  currentSession: TrainingSession | null;

  importRepertoire: (pgn: string, name: string, color: Color) => { success: boolean; message: string; repertoire?: Repertoire };
  deleteRepertoire: (id: string) => void;
  updateProgress: (fen: string, san: string, correct: boolean) => void;
  resetProgress: (repertoireId?: string) => void;

  startSession: (config: DrillConfig) => void;
  endSession: () => void;
  updateSessionMove: (move: DrillMove, index: number) => void;
  incrementScore: () => void;
}

function countMovesInRepertoire(repertoire: Repertoire): number {
  let count = 0;
  function countMoves(moves: readonly { children: readonly unknown[] }[]) {
    for (const move of moves) {
      count++;
      if (move.children.length > 0) {
        countMoves(move.children as readonly { children: readonly unknown[] }[]);
      }
    }
  }
  for (const line of repertoire.lines) {
    countMoves(line.rootMoves);
  }
  return count;
}

function generateId(): string {
  return `rep_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const useTrainingStore = create<TrainingStore>()(
  persist(
    (set, get) => ({
      repertoires: [],
      progress: {},
      currentSession: null,

      importRepertoire: (pgn: string, name: string, color: Color) => {
        const result = parsePgn(pgn);

        if (!result.success || result.repertoires.length === 0) {
          return {
            success: false,
            message: result.errors.join("; ") || "No se pudieron parsear las líneas del PGN",
          };
        }

        const repertoire: Repertoire = {
          id: generateId(),
          name,
          color,
          lines: result.repertoires.map((line) => ({
            ...line,
            name: line.name || name,
            color,
          })),
          importedAt: Date.now(),
          pgnSource: pgn.slice(0, 500),
          totalMoves: 0,
        };

        repertoire.totalMoves = countMovesInRepertoire(repertoire);

        set((state) => ({
          repertoires: [...state.repertoires, repertoire],
        }));

        return {
          success: true,
          message: `Repertorio "${name}" importado: ${repertoire.totalMoves} movimientos`,
          repertoire,
        };
      },

      deleteRepertoire: (id: string) => {
        set((state) => ({
          repertoires: state.repertoires.filter((r) => r.id !== id),
        }));
      },

      updateProgress: (fen: string, san: string, correct: boolean) => {
        const key = createProgressKey(fen, san);
        set((state) => {
          const current = state.progress[key] || createInitialProgress(key);
          const updated = correct ? processCorrect(current) : processWrong(current);
          return {
            progress: { ...state.progress, [key]: updated },
          };
        });
      },

      resetProgress: (repertoireId?: string) => {
        if (!repertoireId) {
          set({ progress: {} });
          return;
        }
        set((state) => {
          const newProgress = { ...state.progress };
          const rep = state.repertoires.find((r) => r.id === repertoireId);
          if (rep) {
            for (const line of rep.lines) {
              function clearMoves(moves: { fen: string; san: string; children: typeof moves }[]) {
                for (const move of moves) {
                  const key = createProgressKey(move.fen, move.san);
                  delete newProgress[key];
                  if (move.children.length > 0) clearMoves(move.children);
                }
              }
              clearMoves(line.rootMoves);
            }
          }
          return { progress: newProgress };
        });
      },

      startSession: (config: DrillConfig) => {
        const session: TrainingSession = {
          id: `session_${Date.now()}`,
          repertoireId: config.repertoireId,
          color: config.color,
          currentFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          moveHistory: [],
          currentIndex: 0,
          score: 0,
          totalMoves: 0,
          maxDepth: config.maxDepth,
          startedAt: Date.now(),
        };
        set({ currentSession: session });
      },

      endSession: () => {
        set((state) => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, completedAt: Date.now() }
            : null,
        }));
      },

      updateSessionMove: (move: DrillMove, index: number) => {
        set((state) => {
          if (!state.currentSession) return state;
          const history = [...state.currentSession.moveHistory];
          history[index] = move;
          return {
            currentSession: {
              ...state.currentSession,
              moveHistory: history,
              currentFen: move.fen,
              currentIndex: index + 1,
              totalMoves: Math.max(state.currentSession.totalMoves, index + 1),
            },
          };
        });
      },

      incrementScore: () => {
        set((state) => {
          if (!state.currentSession) return state;
          return {
            currentSession: {
              ...state.currentSession,
              score: state.currentSession.score + 1,
            },
          };
        });
      },
    }),
    {
      name: "lotus-training-storage",
      partialize: (state) => ({
        repertoires: state.repertoires,
        progress: state.progress,
      }),
    }
  )
);
