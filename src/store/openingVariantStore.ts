import { create } from "zustand";
import { persist } from "zustand/middleware";

interface VariantCommentState {
  variantNote: string;
  moveComments: Record<string, string>;
}

interface OpeningVariantStore {
  variants: Record<string, VariantCommentState>;
  setVariantNote: (variantId: string, note: string) => void;
  setMoveComment: (variantId: string, moveKey: string, comment: string) => void;
}

function ensureVariantState(state: Record<string, VariantCommentState>, variantId: string): VariantCommentState {
  return state[variantId] ?? { variantNote: "", moveComments: {} };
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
                variantNote: note,
              },
            },
          };
        });
      },

      setMoveComment: (variantId, moveKey, comment) => {
        set((state) => {
          const current = ensureVariantState(state.variants, variantId);

          return {
            variants: {
              ...state.variants,
              [variantId]: {
                ...current,
                moveComments: {
                  ...current.moveComments,
                  [moveKey]: comment,
                },
              },
            },
          };
        });
      },
    }),
    {
      name: "lotus-opening-variant-storage",
      partialize: (state) => ({
        variants: state.variants,
      }),
    }
  )
);
