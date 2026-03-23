import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OpeningVariantCommentRecord } from "@/types/comments";

const {
  buildOpeningVariantCommentIdentity,
  listOpeningVariantComments,
  parseOpeningVariantCommentInput,
  upsertOpeningVariantComment,
  deleteOpeningVariantComment,
} = vi.hoisted(() => ({
  buildOpeningVariantCommentIdentity: vi.fn((username: string, eco: string, variantId: string) => ({
    username,
    eco,
    variantId,
    moveKey: "",
  })),
  listOpeningVariantComments: vi.fn(),
  parseOpeningVariantCommentInput: vi.fn(),
  upsertOpeningVariantComment: vi.fn(),
  deleteOpeningVariantComment: vi.fn(),
}));

vi.mock("@/lib/study-comments", () => ({
  buildOpeningVariantCommentIdentity,
  listOpeningVariantComments,
  parseOpeningVariantCommentInput,
  upsertOpeningVariantComment,
  deleteOpeningVariantComment,
}));

import { DELETE, GET, POST } from "@/app/api/openings/[username]/[eco]/variants/[variantId]/comments/route";

describe("opening variant comments route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns comments for a variant", async () => {
    const comments: OpeningVariantCommentRecord[] = [
      {
        id: "comment-1",
        username: "alice smith",
        eco: "B20",
        variantId: "main-line",
        moveKey: "1. e4",
        comment: "Strong central claim",
        annotation: "!",
        createdAt: "2026-03-23T00:00:00.000Z",
        updatedAt: "2026-03-23T00:00:00.000Z",
      },
    ];

    listOpeningVariantComments.mockResolvedValue(comments);

    const response = await GET(new Request("http://localhost/api/openings/alice%20smith/B20/variants/main-line/comments"), {
      params: Promise.resolve({ username: "alice%20smith", eco: "B20", variantId: "main-line" }),
    });

    expect(response.status).toBe(200);
    expect(buildOpeningVariantCommentIdentity).toHaveBeenCalledWith("alice smith", "B20", "main-line");
    expect(await response.json()).toEqual({
      username: "alice smith",
      eco: "B20",
      variantId: "main-line",
      comments,
    });
  });

  it("upserts a comment and returns the saved record", async () => {
    const savedComment: OpeningVariantCommentRecord = {
      id: "comment-2",
      username: "alice smith",
      eco: "B20",
      variantId: "main-line",
      moveKey: "1. e4",
      comment: "Best practical move",
      annotation: "!!",
      createdAt: "2026-03-23T00:00:00.000Z",
      updatedAt: "2026-03-23T00:00:00.000Z",
    };

    parseOpeningVariantCommentInput.mockReturnValue({
      ok: true,
      data: {
        identity: {
          username: "alice smith",
          eco: "B20",
          variantId: "main-line",
          moveKey: "1. e4",
        },
        comment: "Best practical move",
        annotation: "!!",
      },
    });
    upsertOpeningVariantComment.mockResolvedValue(savedComment);

    const response = await POST(
      new Request("http://localhost/api/openings/alice%20smith/B20/variants/main-line/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moveKey: "1. e4", comment: "Best practical move", annotation: "!!" }),
      }),
      { params: Promise.resolve({ username: "alice%20smith", eco: "B20", variantId: "main-line" }) }
    );

    expect(response.status).toBe(200);
    expect(parseOpeningVariantCommentInput).toHaveBeenCalledWith(
      { moveKey: "1. e4", comment: "Best practical move", annotation: "!!" },
      { username: "alice smith", eco: "B20", variantId: "main-line", moveKey: "" }
    );
    expect(upsertOpeningVariantComment).toHaveBeenCalledWith({
      identity: {
        username: "alice smith",
        eco: "B20",
        variantId: "main-line",
        moveKey: "1. e4",
      },
      comment: "Best practical move",
      annotation: "!!",
    });
    expect(await response.json()).toEqual({ comment: savedComment });
  });

  it("deletes a comment by move key", async () => {
    deleteOpeningVariantComment.mockResolvedValue(true);

    const response = await DELETE(
      new Request("http://localhost/api/openings/alice%20smith/B20/variants/main-line/comments?moveKey=1.%20e4"),
      { params: Promise.resolve({ username: "alice%20smith", eco: "B20", variantId: "main-line" }) }
    );

    expect(response.status).toBe(200);
    expect(deleteOpeningVariantComment).toHaveBeenCalledWith({
      username: "alice smith",
      eco: "B20",
      variantId: "main-line",
      moveKey: "1. e4",
    });
    expect(await response.json()).toEqual({ deleted: true });
  });

  it("rejects malformed POST bodies", async () => {
    const response = await POST(
      new Request("http://localhost/api/openings/alice%20smith/B20/variants/main-line/comments", {
        method: "POST",
        body: "not-json",
      }),
      { params: Promise.resolve({ username: "alice%20smith", eco: "B20", variantId: "main-line" }) }
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid JSON body" });
  });
});
