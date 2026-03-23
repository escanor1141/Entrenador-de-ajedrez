import { describe, expect, it } from "vitest";
import {
  VARIANT_NOTE_KEY,
  createSyncedCommentState,
  mergeVariantCommentsFromServer,
  normalizeVariantCommentState,
} from "@/lib/opening-variant-comments";

describe("opening variant comments helpers", () => {
  it("upgrades persisted local comments to the managed shape", () => {
    const state = normalizeVariantCommentState({
      variantNote: "local note",
      moveComments: {
        "1. e4": "central control",
      },
    });

    expect(state.variantNote).toEqual(createSyncedCommentState("local note"));
    expect(state.moveComments["1. e4"]).toEqual(createSyncedCommentState("central control"));
  });

  it("preserves dirty local edits while merging the latest backend snapshot", () => {
    const merged = mergeVariantCommentsFromServer(
      {
        variantNote: {
          value: "draft note",
          serverValue: "saved note",
          syncStatus: "idle",
          error: null,
        },
        moveComments: {
          "1. e4": {
            value: "draft move",
            serverValue: "old move",
            syncStatus: "saving",
            error: null,
          },
          "1... c5": createSyncedCommentState("old stable move"),
        },
        backendStatus: "error",
        backendError: "offline",
      },
      [
        { id: "1", username: "alice", eco: "B20", variantId: "main", moveKey: VARIANT_NOTE_KEY, comment: "server note", createdAt: "", updatedAt: "" },
        { id: "2", username: "alice", eco: "B20", variantId: "main", moveKey: "1... c5", comment: "Sicilian idea", createdAt: "", updatedAt: "" },
      ]
    );

    expect(merged.variantNote.value).toBe("draft note");
    expect(merged.moveComments["1. e4"].value).toBe("draft move");
    expect(merged.moveComments["1... c5"]).toEqual(createSyncedCommentState("Sicilian idea"));
    expect(merged.backendStatus).toBe("synced");
    expect(merged.backendError).toBeNull();
  });
});
