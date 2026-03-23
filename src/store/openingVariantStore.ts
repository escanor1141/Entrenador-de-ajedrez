import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OpeningVariantCommentRecord } from "@/types/comments";
import {
  createSyncedCommentState,
  mergeVariantCommentsFromServer,
  normalizeVariantCommentState,
  type CommentSyncStatus,
  type ManagedCommentState,
  type ManagedVariantCommentState,
  VARIANT_NOTE_KEY,
} from "@/lib/opening-variant-comments";

interface OpeningVariantStore {
  variants: Record<string, ManagedVariantCommentState>;
  setVariantNote: (variantId: string, note: string) => void;
  setMoveComment: (variantId: string, moveKey: string, comment: string) => void;
  hydrateVariantComments: (variantId: string, comments: OpeningVariantCommentRecord[]) => void;
  setVariantBackendStatus: (variantId: string, status: Exclude<CommentSyncStatus, "saving">, error?: string | null) => void;
  markCommentSynced: (variantId: string, commentKey: string, value: string) => void;
  setCommentSyncStatus: (
    variantId: string,
    commentKey: string,
    status: CommentSyncStatus,
    error?: string | null
  ) => void;
}

function createEmptyCommentState(): ManagedCommentState {
  return createSyncedCommentState("");
}

function ensureVariantState(
  state: Record<string, ManagedVariantCommentState>,
  variantId: string
): ManagedVariantCommentState {
  return state[variantId] ?? {
    variantNote: createEmptyCommentState(),
    moveComments: {},
    backendStatus: "idle",
    backendError: null,
  };
}

function ensureCommentState(
  comments: Record<string, ManagedCommentState>,
  moveKey: string
): ManagedCommentState {
  return comments[moveKey] ?? createEmptyCommentState();
}

export const useOpeningVariantStore = create<OpeningVariantStore>()(
  persist(
    (set) => ({
      variants: {},

      setVariantNote: (variantId, note) => {
        set((state) => {
          const current = ensureVariantState(state.variants, variantId);

          return {
            variants: {
              ...state.variants,
              [variantId]: {
                ...current,
                variantNote: {
                  ...current.variantNote,
                  value: note,
                  error: null,
                  syncStatus: note === current.variantNote.serverValue ? "synced" : "idle",
                },
              },
            },
          };
        });
      },

      setMoveComment: (variantId, moveKey, comment) => {
        set((state) => {
          const current = ensureVariantState(state.variants, variantId);
          const moveComments = { ...current.moveComments };
          const moveComment = ensureCommentState(moveComments, moveKey);

          return {
            variants: {
              ...state.variants,
              [variantId]: {
                ...current,
                moveComments: {
                  ...moveComments,
                  [moveKey]: {
                    ...moveComment,
                    value: comment,
                    error: null,
                    syncStatus: comment === moveComment.serverValue ? "synced" : "idle",
                  },
                },
              },
            },
          };
        });
      },

      hydrateVariantComments: (variantId, comments) => {
        set((state) => {
          const current = ensureVariantState(state.variants, variantId);
          const merged = mergeVariantCommentsFromServer(current, comments);

          return {
            variants: {
              ...state.variants,
              [variantId]: merged,
            },
          };
        });
      },

      setVariantBackendStatus: (variantId, status, error = null) => {
        set((state) => {
          const current = ensureVariantState(state.variants, variantId);

          return {
            variants: {
              ...state.variants,
              [variantId]: {
                ...current,
                backendStatus: status,
                backendError: error,
              },
            },
          };
        });
      },

      markCommentSynced: (variantId, commentKey, value) => {
        set((state) => {
          const current = ensureVariantState(state.variants, variantId);

          if (commentKey === VARIANT_NOTE_KEY) {
            return {
              variants: {
                ...state.variants,
                [variantId]: {
                  ...current,
                  variantNote: {
                    ...current.variantNote,
                    value,
                    serverValue: value,
                    syncStatus: "synced",
                    error: null,
                  },
                },
              },
            };
          }

          const moveComment = ensureCommentState(current.moveComments, commentKey);

          return {
            variants: {
              ...state.variants,
              [variantId]: {
                ...current,
                moveComments: {
                  ...current.moveComments,
                  [commentKey]: {
                    ...moveComment,
                    value,
                    serverValue: value,
                    syncStatus: "synced",
                    error: null,
                  },
                },
              },
            },
          };
        });
      },

      setCommentSyncStatus: (variantId, commentKey, status, error = null) => {
        set((state) => {
          const current = ensureVariantState(state.variants, variantId);

          if (commentKey === VARIANT_NOTE_KEY) {
            return {
              variants: {
                ...state.variants,
                [variantId]: {
                  ...current,
                  variantNote: {
                    ...current.variantNote,
                    syncStatus: status,
                    error,
                  },
                },
              },
            };
          }

          const moveComment = ensureCommentState(current.moveComments, commentKey);

          return {
            variants: {
              ...state.variants,
              [variantId]: {
                ...current,
                moveComments: {
                  ...current.moveComments,
                  [commentKey]: {
                    ...moveComment,
                    syncStatus: status,
                    error,
                  },
                },
              },
            },
          };
        });
      },
    }),
    {
      name: "lotus-opening-variant-storage",
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as { variants?: Record<string, unknown> } | undefined;

        if (!state?.variants) {
          return { variants: {} };
        }

        return {
          variants: Object.fromEntries(
            Object.entries(state.variants).map(([variantId, variantState]) => [
              variantId,
              normalizeVariantCommentState(variantState),
            ])
          ),
        };
      },
      partialize: (state) => ({
        variants: state.variants,
      }),
    }
  )
);
